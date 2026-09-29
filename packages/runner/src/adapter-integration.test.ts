import { createHash } from "node:crypto";
import { writeFileSync, truncateSync } from "node:fs";
import { mkdtemp, readFile, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { startMockUpstream } from "@aob/mock-upstream";
import { validateC1Event, validateC4Run } from "@aob/contracts";
import { validateExecutionConditions } from "./execution-conditions.js";
import { runDockerCell, runHostCell } from "./cell.js";

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "test-fixtures");

async function taskFixture(native = false): Promise<{ taskDir: string; root: string }> {
  const root = await mkdtemp(join(tmpdir(), "aob-adapter-integration-"));
  const taskDir = join(root, "task");
  await mkdir(join(taskDir, "workspace"), { recursive: true });
  await writeFile(join(taskDir, "prompt.md"), "Complete the integration task.\n");
  await writeFile(join(taskDir, "workspace", "input.txt"), "input\n");
  if (native) {
    await writeFile(join(taskDir, "verifier.json"), JSON.stringify({
      kind: "docker-command", image: "aob-native-verifier:s2", image_digest: "sha256:" + "a".repeat(64),
      command: ["aob-native-verify"], workdir: ".", network: "none",
    }));
  } else {
    await writeFile(join(taskDir, "verify.sh"), "#!/bin/sh\ntest -f workspace/SOLVED\n", { mode: 0o755 });
  }
  return { taskDir, root };
}

async function assertArtifacts(out: string, expectedTool: string): Promise<void> {
  const run = validateC4Run(JSON.parse(await readFile(join(out, "run.json"), "utf8")));
  expect(run.tool).toBe(expectedTool);
  expect(run.outcome).toBe("completed");
  expect(run.task_environment).toEqual({ kind: "prepared-local", network: "disabled" });
  expect(run.container.verifier_image_digest).toMatch(/^(host|sha256:)/);
  const candidate = JSON.parse(await readFile(join(out, "candidate-evidence.json"), "utf8"));
  expect(candidate).toMatchObject({ status: "captured", agent_image_identity: run.container.image_digest, verifier_image_identity: run.container.verifier_image_digest, image_bytes_archived: false });
  expect(candidate.run_sha256).toBe(`sha256:${createHash("sha256").update(await readFile(join(out, "run.json"))).digest("hex")}`);
  expect(await readFile(join(out, "candidate.patch"), "utf8")).toContain("SOLVED");

  const events = (await readFile(join(out, "events.jsonl"), "utf8")).trim().split("\n")
    .map((line) => validateC1Event(JSON.parse(line)));
  expect(events).toHaveLength(1);
  expect(events[0]?.run_id).toBe(run.run_id);
  if (expectedTool === "codex") {
    expect(run.adapter_result.toolEvents).toHaveLength(1);
    expect(await readFile(join(out, "tool-events.jsonl"), "utf8")).toContain("command_execution");
  }
}

describe("zero-spend adapter integration", () => {
  it.each(["normal", "error", "timeout"] as const)("captures the candidate before a mutating verifier for a %s adapter result", async mode => {
    const { taskDir, root } = await taskFixture();
    const stub = join(root, "capture-stub.mjs");
    await writeFile(stub, `#!${process.execPath}
import { writeFileSync, mkdirSync } from 'node:fs';
if (process.argv.includes('--version')) { console.log('fixture 1'); process.exit(0); }
writeFileSync('input.txt', 'agent change\\n');
mkdirSync('.git', { recursive: true }); writeFileSync('.git/HEAD', 'agent-corrupted-ref');
writeFileSync('SOLVED', 'ok');
${mode === "timeout" ? "setInterval(() => {}, 1000);" : `process.exit(${mode === "error" ? 7 : 0});`}
`, { mode: 0o755 });
    await writeFile(join(taskDir, "verify.sh"), "#!/bin/sh\ntest -f candidate.patch || exit 9\nprintf 'verifier mutation\\n' > workspace/input.txt\n", { mode: 0o755 });
    const original = process.env.AOB_HERMES_BIN; process.env.AOB_HERMES_BIN = stub;
    const mock = await startMockUpstream({ includeUsage: true });
    try {
      const out = join(root, "capture");
      const run = await runHostCell({ dir: out, taskDir, upstream: mock.baseUrl, run_id: `capture-${mode}`, tool: "hermes", task_id: "fixture", task_source: "local-development", task_revision: "working-tree", task_regime: "short", model: "mock", price_book: "mock", timeoutS: mode === "timeout" ? 0.15 : 5 });
      const patch = await readFile(join(out, "candidate.patch"), "utf8");
      const evidence = JSON.parse(await readFile(join(out, "candidate-evidence.json"), "utf8"));
      expect(evidence.run_sha256).toBe(`sha256:${createHash("sha256").update(await readFile(join(out, "run.json"))).digest("hex")}`);
      expect(evidence).toMatchObject({ status: "captured", run_id: `capture-${mode}`, image_bytes_archived: false });
      expect(patch).toContain("+agent change");
      expect(patch).not.toMatch(/verifier mutation|stdout\.log|stderr\.log|agent-corrupted-ref|\.aob-home/);
      expect(run.outcome).toBe(mode === "normal" ? "completed" : mode === "error" ? "adapter_error" : "timeout");
      expect(await readFile(join(out, "workspace/input.txt"), "utf8")).toBe(mode === "normal" ? "verifier mutation\n" : "agent change\n");
    } finally {
      await mock.close();
      if (original === undefined) delete process.env.AOB_HERMES_BIN; else process.env.AOB_HERMES_BIN = original;
    }
  });

  it("keeps native success when the candidate exceeds the capture limit", async () => {
    const { taskDir, root } = await taskFixture(); const out = join(root, "unavailable");
    const mock = await startMockUpstream({ includeUsage: true });
    try {
      const run = await runHostCell({ dir: out, taskDir, upstream: mock.baseUrl, run_id: "unavailable", tool: "mock-agent", task_id: "fixture", task_source: "local-development", task_revision: "working-tree", task_regime: "short", model: "mock", price_book: "mock",
        onExecutionStart: () => { writeFileSync(join(out, "workspace/oversized"), ""); truncateSync(join(out, "workspace/oversized"), 256 * 1024 * 1024 + 1); } });
      expect(run.outcome).toBe("completed");
      expect(JSON.parse(await readFile(join(out, "candidate-evidence.json"), "utf8"))).toMatchObject({ status: "unavailable", reason: "candidate-snapshot-unavailable", patch: null });
      await expect(readFile(join(out, "candidate.patch"))).rejects.toThrow();
    } finally { await mock.close(); }
  });

  it.each(["error", "timeout"] as const)("retains candidate changes after a Docker adapter %s", async mode => {
    const { taskDir, root } = await taskFixture();
    await writeFile(join(taskDir, "workspace/fixture-behavior"), mode);
    await writeFile(join(root, "docker"), await readFile(join(fixtureDir, "docker-stub.mjs")), { mode: 0o755 });
    const previousPath = process.env.PATH; process.env.PATH = root + ":" + (previousPath ?? "/usr/bin:/bin");
    const mock = await startMockUpstream({ includeUsage: true });
    try {
      const out = join(root, "out");
      const run = await runDockerCell({ dir: out, taskDir, upstream: mock.baseUrl, run_id: `docker-capture-${mode}`, tool: "hermes", task_id: "fixture", task_source: "local-development", task_revision: "working-tree", task_regime: "short", model: "mock", price_book: "mock", timeoutS: mode === "timeout" ? 1 : 5 });
      expect(run.outcome).toBe(mode === "timeout" ? "timeout" : "adapter_error");
      expect(JSON.parse(await readFile(join(out, "candidate-evidence.json"), "utf8"))).toMatchObject({ status: "captured", agent_image_identity: run.container.image_digest });
      expect(await readFile(join(out, "candidate.patch"), "utf8")).toContain("SOLVED");
    } finally { await mock.close(); process.env.PATH = previousPath; }
  });

  it("runs every host adapter through the proxy and mock upstream", async () => {
    const { taskDir, root } = await taskFixture();
    const stub = join(root, "host-stub.mjs");
    await writeFile(stub, await readFile(join(fixtureDir, "adapter-host-stub.mjs")), { mode: 0o755 });
    const old = {
      claude: process.env.AOB_CLAUDE_BIN,
      codex: process.env.AOB_CODEX_BIN,
      hermes: process.env.AOB_HERMES_BIN,
    };
    process.env.AOB_CLAUDE_BIN = stub;
    process.env.AOB_CODEX_BIN = stub;
    process.env.AOB_HERMES_BIN = stub;
    const mock = await startMockUpstream({ servedModel: "z-ai/glm-5.3-flash", includeUsage: true });
    try {
      for (const tool of ["claude-code", "codex", "hermes"] as const) {
        const out = join(root, "out", tool);
        const run = await runHostCell({
          dir: out, taskDir, upstream: mock.baseUrl, run_id: "integration-" + tool, tool, task_id: "task-1",
          ...(tool === "claude-code" ? { toolConfiguration: "claude-code-no-web-search" as const } : {}),
          model: "z-ai/glm-5.3-flash", price_book: "mock", condition: "pinned", rep: 0,
          task_source: "local-development", task_revision: "working-tree", task_regime: "short",
          environment: { kind: "prepared-local", network: "disabled" },
        });
        expect(run.outcome, tool).toBe("completed");
        expect(run.tool_configuration).toBe(tool === "claude-code" ? "claude-code-no-web-search" : undefined);
        await assertArtifacts(out, tool);
      }
    } finally {
      await mock.close();
      for (const [name, value] of Object.entries(old)) {
        const key = name === "claude" ? "AOB_CLAUDE_BIN" : name === "codex" ? "AOB_CODEX_BIN" : "AOB_HERMES_BIN";
        if (value === undefined) delete process.env[key]; else process.env[key] = value;
      }
    }
  });

  it("runs every fresh-container adapter through the proxy and mock upstream", async () => {
    const { taskDir, root } = await taskFixture();
    const docker = join(root, "docker");
    await writeFile(docker, await readFile(join(fixtureDir, "docker-stub.mjs")), { mode: 0o755 });
    const oldPath = process.env.PATH;
    process.env.PATH = root + ":" + (oldPath ?? "/usr/bin:/bin");
    const mock = await startMockUpstream({ servedModel: "z-ai/glm-5.3-flash", includeUsage: true });
    try {
      for (const tool of ["aider", "opencode", "qwen", "claude-code", "codex", "hermes"] as const) {
        const out = join(root, "out", tool);
        const containers: string[] = [];
        const run = await runDockerCell({
          dir: out, taskDir, upstream: mock.baseUrl, run_id: "integration-" + tool, tool, task_id: "task-1",
          ...(tool === "claude-code" ? { toolConfiguration: "claude-code-no-web-search" as const } : {}),
          model: "z-ai/glm-5.3-flash", price_book: "mock", condition: "pinned", rep: 0,
          task_source: "local-development", task_revision: "working-tree", task_regime: "short",
          environment: { kind: "prepared-local", network: "disabled" },
          onContainerStart: (name) => { containers.push(name); },
        });
        expect(run.outcome, tool).toBe("completed");
        expect(run.tool_configuration).toBe(tool === "claude-code" ? "claude-code-no-web-search" : undefined);
        const evidence = validateExecutionConditions(await readFile(join(out, "run.json")), JSON.parse(await readFile(join(out, "execution-conditions.json"), "utf8")));
        expect(evidence.run_id).toBe(run.run_id);
        expect(evidence.agent.status).toBe("unavailable"); // this Docker fixture cannot attest runtime controls
        expect(evidence.verifier?.status).toBe("unavailable");
        expect(containers).toHaveLength(2);
        expect(containers[1]).toMatch(/^aob-verify-[0-9]+-[0-9]+$/);
        await assertArtifacts(out, tool);
      }
    } finally {
      await mock.close();
      process.env.PATH = oldPath;
    }
  }, 30_000);

  it("runs a native verifier descriptor through the Docker cell boundary", async () => {
    const { taskDir, root } = await taskFixture(true);
    const docker = join(root, "docker");
    await writeFile(docker, await readFile(join(fixtureDir, "docker-stub.mjs")), { mode: 0o755 });
    const oldPath = process.env.PATH;
    process.env.PATH = root + ":" + (oldPath ?? "/usr/bin:/bin");
    const mock = await startMockUpstream({ servedModel: "z-ai/glm-5.3-flash", includeUsage: true });
    try {
      const run = await runDockerCell({
        dir: join(root, "out", "native"), taskDir, upstream: mock.baseUrl, run_id: "integration-native",
        tool: "aider", task_id: "task-1", model: "z-ai/glm-5.3-flash", price_book: "mock", condition: "pinned", rep: 0,
        task_source: "local-development", task_revision: "working-tree", task_regime: "short",
        environment: { kind: "prepared-local", network: "disabled" },
      });
      expect(run.outcome).toBe("completed");
      await assertArtifacts(join(root, "out", "native"), "aider");
    } finally {
      await mock.close();
      process.env.PATH = oldPath;
    }
  });

  it("uses the native verifier for a host adapter as well", async () => {
    const { taskDir, root } = await taskFixture(true);
    const stub = join(root, "host-stub.mjs");
    await writeFile(stub, await readFile(join(fixtureDir, "adapter-host-stub.mjs")), { mode: 0o755 });
    const binDir = join(root, "bin");
    await mkdir(binDir);
    await writeFile(join(binDir, "docker"), "#!/bin/sh\nif [ \"$1\" = image ]; then printf 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\\n'; exit 0; fi\nexit 0\n", { mode: 0o755 });
    const oldBin = process.env.AOB_CLAUDE_BIN;
    const oldPath = process.env.PATH;
    process.env.AOB_CLAUDE_BIN = stub;
    process.env.PATH = binDir + ":" + (oldPath ?? "/usr/bin:/bin");
    const mock = await startMockUpstream({ servedModel: "z-ai/glm-5.3-flash", includeUsage: true });
    try {
      const out = join(root, "out", "host-native");
      const run = await runHostCell({
        dir: out, taskDir, upstream: mock.baseUrl, run_id: "integration-host-native", tool: "claude-code", task_id: "task-1",
        model: "z-ai/glm-5.3-flash", price_book: "mock", condition: "pinned", rep: 0,
        task_source: "local-development", task_revision: "working-tree", task_regime: "short",
        environment: { kind: "prepared-local", network: "disabled" },
      });
      expect(run.outcome).toBe("completed");
      await assertArtifacts(out, "claude-code");
    } finally {
      await mock.close();
      if (oldBin === undefined) delete process.env.AOB_CLAUDE_BIN; else process.env.AOB_CLAUDE_BIN = oldBin;
      process.env.PATH = oldPath;
    }
  });
});
