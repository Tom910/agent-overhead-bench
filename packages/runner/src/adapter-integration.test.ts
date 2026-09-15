import { mkdtemp, readFile, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { startMockUpstream } from "@aob/mock-upstream";
import { validateC1Event, validateC4Run } from "@aob/contracts";
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
