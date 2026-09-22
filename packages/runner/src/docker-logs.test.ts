import { chmod, mkdtemp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as adapters from "@aob/adapters";
import { ConfigError, ToolError } from "@aob/contracts";
import { describe, expect, it, vi } from "vitest";
import { describeDockerProxyRoute, runDockerCommand } from "./docker.js";

async function fixture(body: string, versionBody = "process.stdout.write('0.1.0\\n');", cleanupBody = "") {
  const root = await mkdtemp(join(tmpdir(), "aob-docker-streamed-logs-"));
  const bin = join(root, "bin");
  const workspace = join(root, "workspace");
  const out = join(root, "out");
  await mkdir(bin);
  await mkdir(workspace);
  const docker = join(bin, "docker");
  await writeFile(docker, `#!${process.execPath}
const fs = require('node:fs');
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(join(root, "commands"))}, args.join(' ') + '\\n');
if (args[0] === 'image') { process.stdout.write('sha256:' + 'a'.repeat(64) + '\\n'); }
else if ((args[0] === 'rm' || args[0] === 'kill') && args.includes('aob-123-456')) { ${cleanupBody} }
else if (args[0] === 'run' && args.includes('version-fixture')) { ${versionBody} }
else if (args[0] === 'run' && args.includes('/opt/aob/runner-entrypoint.sh')) {
  const root = ${JSON.stringify(root)};
  ${body}
}
`);
  await chmod(docker, 0o755);
  const previousPath = process.env.PATH;
  process.env.PATH = `${bin}:${previousPath ?? "/usr/bin:/bin"}`;
  const route = describeDockerProxyRoute("http://host.docker.internal:1234", "aob-123-456");
  return {
    root, out,
    run: (timeout = 5, version = false, admission?: () => void) => runDockerCommand({
      image: "aob-mock:s2", argv: ["fixture", route.clientUrl], env: { TEST_SECRET: "fixture-extra-secret" }, workdir: workspace,
      ...(version ? { versionArgv: ["version-fixture"], toolVersion: "0.1.0" } : {}),
    }, route, out, timeout, undefined, admission),
    async close() { process.env.PATH = previousPath; await rm(root, { recursive: true, force: true }); },
  };
}

describe("Docker run log storage", () => {
  it("checks admission after slow setup and before launching the measured container", async () => {
    const f = await fixture("fs.writeFileSync(root + '/paid-started', 'yes');", "setTimeout(() => process.stdout.write('0.1.0\\n'), 100);");
    const admitted = performance.now();
    try {
      await expect(f.run(5, true, () => {
        if (performance.now() - admitted > 50) throw new ConfigError("price admission expired");
      })).rejects.toThrow("price admission expired");
      expect(await stat(join(f.root, "paid-started")).then(() => true, () => false)).toBe(false);
      expect(await readFile(join(f.root, "commands"), "utf8")).toContain("rm -f");
    } finally { await f.close(); }
  });

  it("persists redacted output while the measured command is still running", async () => {
    const f = await fixture(`
      process.stdout.write('prefix sk-or-private fixture-extra-secret\\n' + 'x'.repeat(128 * 1024));
      process.stderr.write('stderr Bearer private-token\\n');
      const timer = setInterval(() => {
        if (fs.existsSync(root + '/release')) { clearInterval(timer); process.stdout.write('tail\\n'); }
      }, 10);
    `);
    const running = f.run();
    try {
      const deadline = performance.now() + 2_000;
      let bytes = 0;
      while (performance.now() < deadline) {
        bytes = await stat(join(f.out, "stdout.log")).then((s) => s.size, () => 0);
        if (bytes > 64 * 1024) break;
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      expect(bytes).toBeGreaterThan(64 * 1024);
    } finally {
      await writeFile(join(f.root, "release"), "");
      const result = await running;
      try {
        expect(result.exitCode).toBe(0);
        expect(await readFile(result.stdoutPath, "utf8")).toBe("prefix [redacted] [redacted]\n" + "x".repeat(128 * 1024) + "tail\n");
        expect(await readFile(result.stderrPath, "utf8")).toBe("stderr [redacted]\n");
      } finally { await f.close(); }
    }
  });

  it("rejects oversized control output rather than retaining an unbounded version response", async () => {
    const f = await fixture("", "process.stdout.write('0.1.0\\n' + 'x'.repeat(2 * 1024 * 1024));");
    try { await expect(f.run(5, true)).rejects.toBeInstanceOf(ToolError); }
    finally { await f.close(); }
  });

  it("retains complete measured output beyond the control limit", async () => {
    const f = await fixture(`
      const block = Buffer.alloc(64 * 1024, 120);
      for (let i = 0; i < 64; i++) fs.writeSync(1, block);
      process.stdout.write('tail-模型\\n');
      process.stderr.write('separate stderr\\n');
    `);
    try {
      const result = await f.run();
      expect(result.exitCode).toBe(0);
      const output = await readFile(result.stdoutPath);
      expect(output.length).toBe(4 * 1024 * 1024 + Buffer.byteLength("tail-模型\n"));
      expect(output.subarray(0, 4 * 1024 * 1024).every((byte) => byte === 120)).toBe(true);
      expect(output.subarray(4 * 1024 * 1024).toString()).toBe("tail-模型\n");
      expect(await readFile(result.stderrPath, "utf8")).toBe("separate stderr\n");
    } finally { await f.close(); }
  });

  it("flushes pending redaction and preserves both logs after timeout", async () => {
    const f = await fixture(`
      process.stdout.write('prefix fixture-extra-secret');
      process.stderr.write('stderr sk-or-private');
      setInterval(() => {}, 1000);
    `);
    try {
      const result = await f.run(0.3);
      expect(result.exitCode).toBe(124);
      expect(await readFile(result.stdoutPath, "utf8")).toBe("prefix [redacted]");
      expect(await readFile(result.stderrPath, "utf8")).toBe("stderr [redacted]");
      expect(await readFile(join(f.root, "commands"), "utf8")).toContain("rm -f aob-123-456");
    } finally { await f.close(); }
  });

  it("turns a log sink failure into a typed rejection and cleans up the running container", async () => {
    const f = await fixture("process.stdout.write('retained prefix\\n'); setInterval(() => {}, 1000);");
    const create = adapters.createRunLogWriter;
    const spy = vi.spyOn(adapters, "createRunLogWriter").mockImplementation((path, extra) => {
      const writer = create(path, extra);
      return { write(chunk) { writer.write(chunk); throw new ToolError("fixture disk failure"); }, close() { writer.close(); } };
    });
    try {
      await expect(f.run()).rejects.toBeInstanceOf(ToolError);
      const commands = await readFile(join(f.root, "commands"), "utf8");
      expect(commands).toContain("rm -f aob-123-456");
      expect(commands).toContain("rm -f aob-relay-123-456");
      expect(commands).toContain("network rm aob-net-123-456");
      expect(await readFile(join(f.out, "stdout.log"), "utf8")).toBe("retained prefix\n");
    } finally { spy.mockRestore(); await f.close(); }
  });

  it("retains late pipe output while waiting for timeout cleanup", async () => {
    const f = await fixture(`
      process.on('SIGTERM', () => {});
      process.stdout.write('initial\\n');
      require('node:child_process').spawn(process.execPath, ['-e',
        "setTimeout(() => { process.stdout.write('late during cleanup\\\\n'); }, 850);"
      ], { stdio: ['ignore', 'inherit', 'inherit'] });
      setInterval(() => {}, 1000);
    `, undefined, "setTimeout(() => {}, 1000);");
    try {
      const result = await f.run(0.2);
      expect(result.exitCode).toBe(124);
      expect(await readFile(result.stdoutPath, "utf8")).toBe("initial\nlate during cleanup\n");
    } finally { await f.close(); }
  });
});
