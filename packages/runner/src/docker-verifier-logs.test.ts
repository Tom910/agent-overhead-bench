import { chmod, mkdtemp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as adapters from "@aob/adapters";
import { ToolError } from "@aob/contracts";
import { describe, expect, it, vi } from "vitest";
import { runDockerVerification } from "./docker.js";

async function fixture(body: string) {
  const root = await mkdtemp(join(tmpdir(), "aob-verifier-streamed-logs-"));
  const bin = join(root, "bin");
  const workspace = join(root, "workspace");
  const logPath = join(root, "verify.log");
  const script = join(root, "verify.sh");
  await mkdir(bin);
  await mkdir(workspace);
  await writeFile(script, "#!/bin/sh\nexit 0\n");
  const docker = join(bin, "docker");
  await writeFile(docker, `#!${process.execPath}
const fs = require('node:fs');
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(join(root, "commands"))}, args.join(' ') + '\\n');
if (args[0] === 'image') process.stdout.write('sha256:' + 'a'.repeat(64) + '\\n');
else if (args[0] === 'run') {
  const root = ${JSON.stringify(root)};
  ${body}
}
`);
  await chmod(docker, 0o755);
  const previousPath = process.env.PATH;
  process.env.PATH = `${bin}:${previousPath ?? "/usr/bin:/bin"}`;
  return {
    root, logPath,
    run: (timeoutS = 5, legacy = false) => runDockerVerification({
      image: "aob-mock:s2", imageDigest: `sha256:${"a".repeat(64)}`, workspaceDir: workspace,
      ...(legacy ? { verificationFile: script } : { command: ["fixture-verifier"] }), logPath, timeoutS,
    }),
    async close() { process.env.PATH = previousPath; await rm(root, { recursive: true, force: true }); },
  };
}

describe("Docker verifier log storage", () => {
  it("streams a native verifier beyond 1 MiB before exit and retains its original exit code", async () => {
    const f = await fixture(`
      for (let i = 0; i < 32; i++) fs.writeSync(1, Buffer.alloc(64 * 1024, 120));
      for (let i = 0; i < 32; i++) fs.writeSync(2, Buffer.alloc(64 * 1024, 121));
      const timer = setInterval(() => {
        if (fs.existsSync(root + '/release')) {
          clearInterval(timer);
          process.stdout.write('tail\\n');
          process.exitCode = 7;
        }
      }, 10);
    `);
    const running = f.run().then((result) => ({ result }), (error: unknown) => ({ error }));
    try {
      const deadline = performance.now() + 2_000;
      let bytes = 0;
      while (performance.now() < deadline) {
        bytes = await stat(f.logPath).then((info) => info.size, () => 0);
        if (bytes > 1024 * 1024) break;
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      expect(bytes).toBeGreaterThan(1024 * 1024);
      const spoolDirectory = (await readdir(f.root)).find((name) => name.startsWith(".aob-verifier-stderr-"));
      expect(spoolDirectory).toBeDefined();
      expect((await stat(join(f.root, spoolDirectory!))).mode & 0o777).toBe(0o700);
      expect((await stat(join(f.root, spoolDirectory!, "stderr.log"))).mode & 0o777).toBe(0o600);
      await writeFile(join(f.root, "release"), "");
      const outcome = await running;
      expect("result" in outcome && outcome.result.exitCode).toBe(7);
      expect(await readFile(f.logPath, "utf8")).toBe("x".repeat(2 * 1024 * 1024) + "tail\n" + "y".repeat(2 * 1024 * 1024));
      expect((await readdir(f.root)).some((name) => name.startsWith(".aob-verifier-stderr-"))).toBe(false);
    } finally {
      await writeFile(join(f.root, "release"), "");
      await running;
      await f.close();
    }
  });

  it("allows legacy stdout at its existing 1 MiB limit plus the verification metadata suffix", async () => {
    const f = await fixture(`
      for (let i = 0; i < 16; i++) fs.writeSync(1, Buffer.alloc(64 * 1024, 120));
      process.stdout.write('\\n__AOB_VERIFY_META__{"exit":0,"duration_ms":12}\\n');
    `);
    try {
      expect(await f.run(5, true)).toEqual({ exitCode: 0, duration_ms: 12 });
      expect(await readFile(f.logPath, "utf8")).toBe("x".repeat(1024 * 1024));
    } finally { await f.close(); }
  });

  it("redacts stdout secrets independently when stderr arrives between their chunks", async () => {
    const f = await fixture(`
      process.stdout.write('stdout sk-');
      setTimeout(() => process.stderr.write('stderr visible\\n'), 30);
      setTimeout(() => process.stdout.write('or-private\\n'), 80);
    `);
    try {
      expect((await f.run()).exitCode).toBe(0);
      expect(await readFile(f.logPath, "utf8")).toBe("stdout [redacted]\nstderr visible\n");
    } finally { await f.close(); }
  });

  it.each([
    { stdout: "Bearer ", stderr: "private-token" },
    { stdout: "sk-", stderr: "secret" },
  ])("redacts a secret formed at the stdout/stderr seam: $stdout", async ({ stdout, stderr }) => {
    const f = await fixture(`process.stdout.write(${JSON.stringify(stdout)}); process.stderr.write(${JSON.stringify(stderr)});`);
    try {
      expect((await f.run()).exitCode).toBe(0);
      expect(await readFile(f.logPath, "utf8")).toBe("[redacted]");
    } finally { await f.close(); }
  });

  it("keeps invalid UTF-8 at each stream boundary instead of joining bytes across streams", async () => {
    const f = await fixture("process.stdout.write(Buffer.from([0xe2])); process.stderr.write(Buffer.from([0x82, 0xac]));");
    try {
      expect((await f.run()).exitCode).toBe(0);
      expect(await readFile(f.logPath, "utf8")).toBe("\uFFFD\uFFFD\uFFFD");
    } finally { await f.close(); }
  });

  it("flushes both native verifier streams after timeout and removes temporary logs", async () => {
    const f = await fixture(`
      process.stdout.write('stdout sk-or-private');
      process.stderr.write('stderr Bearer private');
      setInterval(() => {}, 1000);
    `);
    try {
      expect((await f.run(0.3)).exitCode).toBe(124);
      expect(await readFile(f.logPath, "utf8")).toBe("stdout [redacted] [redacted]");
      expect((await readdir(f.root)).some((name) => name.startsWith(".aob-verifier-stderr-"))).toBe(false);
      expect(await readFile(join(f.root, "commands"), "utf8")).toContain("rm -f aob-verify-");
    } finally { await f.close(); }
  });

  it("retains typed log failures and removes private temporary files after stopping the verifier", async () => {
    const f = await fixture("process.stdout.write('prefix\\n'); setInterval(() => {}, 1000);");
    const create = adapters.createRunLogWriter;
    const spy = vi.spyOn(adapters, "createRunLogWriter").mockImplementation((path, extra) => {
      const writer = create(path, extra);
      return { write(chunk) { writer.write(chunk); throw new ToolError("fixture disk failure"); }, close() { writer.close(); } };
    });
    try {
      await expect(f.run()).rejects.toBeInstanceOf(ToolError);
      expect((await readdir(f.root)).some((name) => name.startsWith(".aob-verifier-stderr-"))).toBe(false);
      expect(await readFile(join(f.root, "commands"), "utf8")).toContain("rm -f aob-verify-");
    } finally { spy.mockRestore(); await f.close(); }
  });
});
