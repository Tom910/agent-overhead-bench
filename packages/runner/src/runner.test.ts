import { access, chmod, link, mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { writeFileSync } from "node:fs";
import { execFile as execFileCallback } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { promisify } from "node:util";
import { startMockUpstream } from "@aob/mock-upstream";
import type { ContainerInvocation } from "@aob/adapters";
import { BudgetExceeded, ConfigError, validateC1Event, validateC4Run } from "@aob/contracts";
import { assertBudget, estimateEventsUsd } from "./budget.js";
import {
  blockRandomize,
  createMatrixState,
  loadState,
  pending,
  saveState,
  transitionCell,
} from "./state.js";
import { applyTaskEnvironmentImage, brokerDockerInvocation, runHostCell, shouldSkipVerification, stageTask } from "./cell.js";
import { runMatrix } from "./matrix.js";
import { assertOfficialRunWindow, createRunWindowLedger, loadRunWindowLedger, saveRunWindowLedger } from "./window-ledger.js";
import { IMAGE_INSPECT_ATTEMPTS, versionOutputLines, cleanupDockerContainer, cleanupDockerResources, describeDockerProxyRoute, runDockerCommand, runDockerVerification, startDockerProxyRoute, stopDockerProxyRoute } from "./docker.js";

const execFile = promisify(execFileCallback);
const fakeDigest = "sha256:" + "a".repeat(64);

async function findFiles(root: string, wanted: string, found: string[] = []): Promise<string[]> {
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) await findFiles(path, wanted, found);
    else if (entry.isFile() && entry.name === wanted) found.push(path);
  }
  return found;
}

describe("state machine", () => {
  it("resumes pending cells and does not repeat done", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-st-"));
    const path = join(dir, "state.json");
    saveState(path, {
      version: 1,
      seed: 42,
      spentUsd: 0,
      cells: [
        { id: "a", tool: "mock", task_id: "t", condition: "pinned", rep: 0, status: "done", retries: 0 },
        { id: "b", tool: "mock", task_id: "t", condition: "pinned", rep: 1, status: "pending", retries: 0 },
      ],
    });
    const st = loadState(path);
    expect(pending(st).map((c) => c.id)).toEqual(["b"]);
  });

  it("enforces lifecycle transitions and rejects corrupted state", async () => {
    const cell = { id: "a", tool: "mock", task_id: "t", condition: "pinned" as const, rep: 0, status: "pending" as const, retries: 0 };
    let state = createMatrixState([cell], 7);
    state = transitionCell(state, "a", "staged");
    state = transitionCell(state, "a", "running");
    state = transitionCell(state, "a", "verifying");
    state = transitionCell(state, "a", "done");
    expect(() => transitionCell(state, "a", "pending")).toThrow(ConfigError);

    const path = join(await mkdtemp(join(tmpdir(), "aob-corrupt-")), "state.json");
    await writeFile(path, "{broken");
    expect(() => loadState(path)).toThrow(ConfigError);
    await writeFile(path, JSON.stringify({
      version: 1, seed: 7, spentUsd: 0,
      cells: [{ ...cell, rep: -1 }],
    }));
    expect(() => loadState(path)).toThrow(ConfigError);
    await writeFile(path, JSON.stringify({
      version: 1, seed: 7, spentUsd: 0,
      cells: [{ ...cell, unexpected: true }],
    }));
    expect(() => loadState(path)).toThrow(ConfigError);
    await writeFile(path, JSON.stringify({
      version: 1, seed: 7, spentUsd: 0,
      cells: [cell, cell],
    }));
    expect(() => loadState(path)).toThrow(ConfigError);

    const verifierState = createMatrixState([{ ...cell, status: "verifying", containerName: "aob-verify-7-8" }], 7);
    saveState(path, verifierState);
    expect(loadState(path).cells[0]?.containerName).toBe("aob-verify-7-8");
  });

  it("block-randomizes one of each tool per block", () => {
    let i = 0;
    const rng = () => {
      i += 1;
      return (i % 10) / 10;
    };
    const blocks = blockRandomize(["a", "b", "c"], 4, rng);
    expect(blocks).toHaveLength(4);
    for (const b of blocks) {
      expect([...b].sort()).toEqual(["a", "b", "c"]);
    }
  });
});

describe("task environment image selection", () => {
	it("selects the tool-specific prepared image and preserves its digest", () => {
		const invocation: ContainerInvocation = {
			image: "aob-codex:s2",
			argv: ["codex"],
			env: {},
			workdir: "/tmp/workspace",
		};
		const selected = applyTaskEnvironmentImage(invocation, {
			kind: "prepared-local",
			network: "disabled",
			agent_images: {codex: {image: "aob-task-codex:calibration", image_digest: fakeDigest}},
		}, "codex");
		expect(selected.image).toBe("aob-task-codex:calibration");
		expect(selected.image_digest).toBe(fakeDigest);
	});

	it("keeps provider credentials out of Docker adapter environments", () => {
		const invocation: ContainerInvocation = {
			image: "aob-agent:s2",
			argv: ["agent"],
			env: {
				OPENROUTER_API_KEY: "sk-or-real",
				OPENAI_API_KEY: "sk-openai-real",
				ANTHROPIC_AUTH_TOKEN: "sk-anthropic-real",
				ANTHROPIC_API_KEY: "sk-anthropic-secondary",
				CI: "1",
			},
			workdir: "/tmp/workspace",
		};
		const brokered = brokerDockerInvocation(invocation);
		expect(brokered.env).toEqual({
			OPENROUTER_API_KEY: "aob-proxy-broker",
			OPENAI_API_KEY: "aob-proxy-broker",
			ANTHROPIC_AUTH_TOKEN: "aob-proxy-broker",
			ANTHROPIC_API_KEY: "aob-proxy-broker",
			CI: "1",
		});
	});

	it("preserves intentionally empty provider variables while brokering credentials", () => {
		const brokered = brokerDockerInvocation({
			image: "aob-agent:s2",
			argv: ["agent"],
			env: { OPENROUTER_API_KEY: "sk-or-real", ANTHROPIC_AUTH_TOKEN: "", ANTHROPIC_API_KEY: "", CI: "1" },
			workdir: "/tmp/workspace",
		});
		expect(brokered.env).toEqual({
			OPENROUTER_API_KEY: "aob-proxy-broker",
			ANTHROPIC_AUTH_TOKEN: "",
			ANTHROPIC_API_KEY: "",
			CI: "1",
		});
	});
});

describe("budget", () => {
  const rates = { input: 0.001, cached_input: 0.0001, output: 0.002 };

  it("prices cached and uncached input separately and exposes unavailable usage", () => {
    expect(estimateEventsUsd([
      { usage: { input: 100, cached_input: 40, output: 10 } },
      { usage: { input: 20, cached_input: 0, output: 5 } },
    ], rates)).toBeCloseTo(0.114, 8);
    expect(estimateEventsUsd([{ usage: null }], rates)).toBeNull();
    expect(() => estimateEventsUsd([{ usage: { input: -1, cached_input: 0, output: 1 } }], rates)).toThrow(ConfigError);
  });

  it("throws only when the next cell cannot stay under the hard cap", () => {
    expect(() => assertBudget(1, 0, 1)).not.toThrow();
    expect(() => assertBudget(1, 0.01, 1)).toThrow(BudgetExceeded);
  });
});

describe("matrix", () => {
  it("records an empty model for default-condition cells", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-default-model-"));
    await mkdir(join(dir, "workspace"), { recursive: true });
    await writeFile(join(dir, "prompt.md"), "solve\n");
    await writeFile(join(dir, "verify.sh"), "#!/bin/sh\ntest -f \"$(dirname \"$0\")/workspace/SOLVED\"\n", { mode: 0o755 });
    const mock = await startMockUpstream();
    try {
      const out = join(dir, "out");
      await runMatrix({
        resultsDir: join(out, "results"), statePath: join(out, "state.json"),
        tasks: [{ id: "default-model", dir, source: "local-development", revision: "working-tree", regime: "short", timeoutS: 5 }],
        tools: ["mock-agent"], conditions: ["default"], reps: 1, model: "z-ai/glm-5.3-flash", priceBook: "mock",
        upstream: mock.baseUrl, mode: "host",
      });
      const run = JSON.parse(await readFile(join(out, "results/default/mock-agent/default-model/rep-0/run.json"), "utf8")) as { model: string };
      expect(run.model).toBe("");
    } finally {
      await mock.close();
    }
  });

  it("stages a native verifier descriptor without exposing a verifier script", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-native-stage-"));
    const taskDir = join(dir, "task");
    await mkdir(join(taskDir, "workspace"), { recursive: true });
    await writeFile(join(taskDir, "prompt.md"), "Implement the task\n");
    await writeFile(join(taskDir, "verifier.json"), JSON.stringify({
      kind: "docker-command", image: "aob-native-verifier:s2", image_digest: fakeDigest,
      command: ["npm", "test"], workdir: ".", network: "none",
    }));
    const staged = stageTask({
      dir: join(dir, "cell"), taskDir, upstream: "http://127.0.0.1:1", run_id: "native-stage",
      tool: "mock-agent", task_id: "native-stage", model: "mock", price_book: "mock",
    });
    expect(staged.verifier).toEqual({
      kind: "docker-command", image: "aob-native-verifier:s2", image_digest: fakeDigest,
      command: ["npm", "test"], workdir: ".", network: "none",
    });
    expect(staged.verifyFile).toBeUndefined();
    await expect(access(join(staged.workspaceDir, "verifier.json"))).rejects.toBeDefined();
    await expect(access(join(dir, "cell", "verifier.json"))).resolves.toBeUndefined();
  });

  it("runs the reduced dry-run twice and emits schema-valid artifacts", async () => {
    const repo = join(dirname(fileURLToPath(import.meta.url)), "../../..");
    const out = await mkdtemp(join(tmpdir(), "aob-dry-run-test-"));
    const script = join(repo, "scripts/s5-dry-run.sh");
    const first = JSON.parse((await execFile("sh", [script, out], { cwd: repo })).stdout) as { cells: Array<{ id: string; tool: string; status: string }> };
    const second = JSON.parse((await execFile("sh", [script, out], { cwd: repo })).stdout) as { cells: Array<{ status: string }> };
    expect(first.cells).toHaveLength(8);
    expect(first.cells.every((cell) => cell.status === "done")).toBe(true);
    expect(new Set(first.cells.map((cell) => cell.id)).size).toBe(8);
    expect(first.cells.filter((cell) => cell.tool === "mock-agent")).toHaveLength(4);
    expect(first.cells.filter((cell) => cell.tool === "mock-agent-secondary")).toHaveLength(4);
    expect(second.cells).toEqual(first.cells);
    for (const runPath of await findFiles(join(out, "results"), "run.json")) {
      const run = validateC4Run(JSON.parse(await readFile(runPath, "utf8")));
      const eventsPath = join(dirname(runPath), run.events_file);
      for (const line of (await readFile(eventsPath, "utf8")).split("\n").filter(Boolean)) validateC1Event(JSON.parse(line));
    }
    const fullOut = await mkdtemp(join(tmpdir(), "aob-full-dry-run-test-"));
    const dryRunEnv = { ...process.env, AOB_DRY_RUN_MODE: "host" };
    const full = JSON.parse((await execFile("sh", [join(repo, "scripts/s5-full-dry-run.sh"), fullOut], { cwd: repo, env: dryRunEnv })).stdout) as { cells: Array<{ condition: string; status: string }> };
    const fullSecond = JSON.parse((await execFile("sh", [join(repo, "scripts/s5-full-dry-run.sh"), fullOut], { cwd: repo, env: dryRunEnv })).stdout) as { cells: Array<{ condition: string; status: string }> };
    expect(full.cells).toHaveLength(16);
    expect(new Set(full.cells.map((cell) => cell.condition))).toEqual(new Set(["pinned", "default"]));
    expect(full.cells.every((cell) => cell.status === "done")).toBe(true);
    expect(fullSecond.cells).toEqual(full.cells);

    const killResumeOut = await mkdtemp(join(tmpdir(), "aob-kill-resume-test-"));
    const killResume = await execFile("sh", [join(repo, "scripts/s5-kill-resume.sh"), killResumeOut], { cwd: repo });
    const killSummary = JSON.parse(killResume.stdout.trim().split("\n").at(-1) ?? "{}");
    expect(killSummary).toEqual({ cells: 8, runArtifacts: 8 });
  }, 15_000);

  it("accepts mixed execution mode for host and container adapters", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-mixed-mode-"));
    const state = await runMatrix({
      resultsDir: join(dir, "results"), statePath: join(dir, "state.json"),
      tasks: [{ id: "t", dir, source: "local-development", revision: "working-tree", regime: "short", timeoutS: 1 }],
      tools: ["mock-agent"], conditions: ["pinned"], reps: 1, model: "mock", priceBook: "mock", mode: "mixed",
      executeCell: async (cell) => ({
        v: 1 as const, run_id: cell.id, tool: "mock-agent", tool_version: "mock", task_id: "t",
        task_source: "local-development", task_revision: "working-tree", task_regime: "short" as const, condition: "pinned" as const, rep: 0, model: "mock", ori_version: null, tool_visibility: "none" as const,
        anchors: { adapter: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 }, proxy: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 } },
        adapter_result: { exitCode: 0, tStart: 0, tEnd: 1, anchor: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 }, artifacts: { stdoutPath: "stdout.log", stderrPath: "stderr.log" } },
        events_file: "events.jsonl", verification: { exit: 0, duration_ms: 1, logPath: "verify.log" }, container: { image_digest: "mock", verifier_image_digest: "mock", started_iso: "2026-01-01T00:00:00.000Z" }, task_environment: { kind: "runner-default", network: "disabled" as const }, host: { os: "test", cpu: "test", ram_gb: 1 }, spend_usd_estimate: 0, price_book: "mock", outcome: "completed" as const,
      }),
    });
    expect(state.cells[0]?.status).toBe("done");
  });

  it("generates a distinct replacement run ID without changing cell identity", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-replacement-id-"));
    const taskDir = join(dir, "task");
    await mkdir(join(taskDir, "workspace"), { recursive: true });
    await writeFile(join(taskDir, "prompt.md"), "solve\n");
    await writeFile(join(taskDir, "verify.sh"), "#!/bin/sh\nexit 0\n", { mode: 0o755 });
    const mock = await startMockUpstream();
    try {
    const state = await runMatrix({
      resultsDir: join(dir, "results"), statePath: join(dir, "state.json"),
      tasks: [{ id: "replacement-task", dir: taskDir, source: "local-development", revision: "working-tree", regime: "short", timeoutS: 1 }],
      tools: ["mock-agent"], conditions: ["pinned"], reps: 1, model: "mock", priceBook: "mock", upstream: mock.baseUrl, mode: "host", runIdSuffix: "replacement",
    });
    expect(state.cells[0]).toMatchObject({ id: "pinned:mock-agent:replacement-task:0:replacement", tool: "mock-agent", task_id: "replacement-task", condition: "pinned", rep: 0 });
    const run = JSON.parse(await readFile(join(dir, "results/pinned/mock-agent/replacement-task/rep-0/run.json"), "utf8")) as { run_id: string };
    expect(run.run_id).toBe("pinned:mock-agent:replacement-task:0:replacement");
    } finally {
      await mock.close();
    }
  });

  it("executes a reduced matrix once per cell and resumes done cells", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-matrix-"));
    const statePath = join(dir, "state.json");
    const calls: string[] = [];
    const executeCell = async (cell: { id: string; tool: string; condition: "pinned" | "default"; rep: number }, task: { id: string }, _out: string) => {
      calls.push(cell.id);
      return {
        v: 1 as const, run_id: cell.id, tool: cell.tool, tool_version: "mock", task_id: task.id,
        task_source: "local-development", task_revision: "working-tree", task_regime: "short" as const,
        condition: cell.condition, rep: cell.rep, model: "mock", ori_version: null, tool_visibility: "none" as const,
        anchors: {
          adapter: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 },
          proxy: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 },
        },
        adapter_result: {
          exitCode: 0, tStart: 0, tEnd: 1,
          anchor: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 },
          artifacts: { stdoutPath: "stdout.log", stderrPath: "stderr.log" },
        },
        events_file: "events.jsonl", verification: { exit: 0, duration_ms: 1, logPath: "verify.log" },
        container: { image_digest: "mock", verifier_image_digest: "mock", started_iso: "2026-01-01T00:00:00.000Z" }, task_environment: { kind: "runner-default", network: "disabled" as const },
        host: { os: "test", cpu: "test", ram_gb: 1 }, spend_usd_estimate: 0.1,
        price_book: "mock", outcome: "completed" as const,
      };
    };
    const opts = {
      resultsDir: join(dir, "results"), statePath, tasks: [
        { id: "t1", dir: dir, source: "local-development", revision: "working-tree", regime: "short" as const, timeoutS: 1 },
        { id: "t2", dir: dir, source: "local-development", revision: "working-tree", regime: "short" as const, timeoutS: 1 },
      ], tools: ["a", "b"], conditions: ["pinned" as const], reps: 2, model: "mock", priceBook: "mock",
        executeCell,
    };
    const first = await runMatrix(opts);
    expect(first.cells).toHaveLength(8);
    expect(first.cells.every((cell) => cell.status === "done")).toBe(true);
    expect(calls).toHaveLength(8);
    const second = await runMatrix(opts);
    expect(second.cells.every((cell) => cell.status === "done")).toBe(true);
    expect(calls).toHaveLength(8);
    await expect(runMatrix({ ...opts, model: "different-model" })).rejects.toBeInstanceOf(ConfigError);
  });

  it("binds a normal matrix session to a closed run-window ledger", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-window-matrix-"));
    const host = { os: "test", cpu: "test", ram_gb: 1, docker: "test", image_digests: [] };
    const c4Host = { os: "test", cpu: "test", ram_gb: 1 };
    const state = await runMatrix({
      resultsDir: join(dir, "results"), statePath: join(dir, "state.json"),
      tasks: [{ id: "t", dir, source: "local-development", revision: "working-tree", regime: "short", timeoutS: 1 }],
      tools: ["mock"], conditions: ["pinned"], reps: 1, model: "mock", priceBook: "mock",
      runWindow: { path: join(dir, "provenance", "run-window-ledger.json"), sessionId: "session-test-window", host, now: (() => { let n = 0; return () => ({ wall_clock_iso: "2026-08-30T14:00:00.000Z", monotonic_zero: 0, now_ms: n++ * 100 }); })() },
      executeCell: async (cell) => ({
        v: 1 as const, run_id: cell.id, tool: "mock", tool_version: "mock", task_id: "t", task_source: "local-development", task_revision: "working-tree", task_regime: "short" as const,
        condition: "pinned" as const, rep: 0, model: "mock", ori_version: null, tool_visibility: "none" as const,
        anchors: { adapter: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 }, proxy: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 } },
        adapter_result: { exitCode: 0, tStart: 0, tEnd: 1, anchor: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 }, artifacts: { stdoutPath: "stdout.log", stderrPath: "stderr.log" } },
        events_file: "events.jsonl", verification: { exit: 0, duration_ms: 1, logPath: "verify.log" }, container: { image_digest: "mock", verifier_image_digest: "mock", started_iso: "2026-01-01T00:00:00.000Z" }, task_environment: { kind: "runner-default" as const, network: "disabled" as const }, host: c4Host, spend_usd_estimate: 0, price_book: "mock", outcome: "completed" as const,
      }),
    });
    expect(state.run_window_session_id).toBe("session-test-window");
    expect(() => assertOfficialRunWindow(loadRunWindowLedger(join(dir, "provenance", "run-window-ledger.json")), { requireResultBinding: false })).not.toThrow();
  });

  it("refuses an orphaned run-window ledger when matrix state is absent", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-window-orphan-"));
    const ledgerPath = join(dir, "provenance", "run-window-ledger.json");
    const host = { os: "test", cpu: "test", ram_gb: 1, docker: "test", image_digests: [] };
    saveRunWindowLedger(ledgerPath, createRunWindowLedger({
      sessionId: "session-orphan-window",
      now: { wall_clock_iso: "2026-08-30T14:00:00.000Z", monotonic_zero: 0, now_ms: 0 },
      host,
      matrixDefinitionSha256: "sha256:" + "a".repeat(64),
    }));
    await expect(runMatrix({
      resultsDir: join(dir, "results"), statePath: join(dir, "state.json"),
      tasks: [{ id: "t", dir, source: "local-development", revision: "working-tree", regime: "short", timeoutS: 1 }],
      tools: ["mock"], conditions: ["pinned"], reps: 1, model: "mock", priceBook: "mock",
      runWindow: { path: ledgerPath, sessionId: "session-orphan-window", host },
      executeCell: async () => { throw new Error("must not execute"); },
    })).rejects.toThrow(/matrix state is missing for an existing run-window ledger/);
  });

  it("preserves independent repetition indices and binds them on resume", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-independent-rep-"));
    const opts = {
      resultsDir: join(dir, "results"), statePath: join(dir, "state.json"),
      tasks: [{ id: "t", dir, source: "local-development", revision: "working-tree", regime: "short" as const, timeoutS: 1 }],
      tools: ["mock"], conditions: ["pinned" as const], reps: 1, repStart: 3, model: "mock", priceBook: "mock",
      beforeCell: async () => { throw new ConfigError("test admission stop"); },
    };
    await expect(runMatrix(opts)).rejects.toThrow("test admission stop");
    const state = loadState(opts.statePath);
    expect(state.cells.map(({ id, rep }) => ({ id, rep }))).toEqual([{ id: "pinned:mock:t:3", rep: 3 }]);
    await expect(runMatrix({ ...opts, repStart: 2 })).rejects.toThrow(/definition/);
    await rm(dir, { recursive: true, force: true });
  });

  it.each([-1, 0.5, Infinity, Number.MAX_SAFE_INTEGER])("rejects unsafe repetition start %s", async (repStart) => {
    const dir = await mkdtemp(join(tmpdir(), "aob-invalid-rep-"));
    await expect(runMatrix({
      resultsDir: join(dir, "results"), statePath: join(dir, "state.json"), tasks: [],
      tools: ["mock"], conditions: ["pinned"], reps: 2, repStart, model: "mock", priceBook: "mock",
    })).rejects.toThrow(/repStart/);
    await rm(dir, { recursive: true, force: true });
  });

  it("persists running until the cell executor returns", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-lifecycle-boundary-"));
    const statePath = join(dir, "state.json");
    let observed: string | undefined;
    const result = await runMatrix({
      resultsDir: join(dir, "results"), statePath,
      tasks: [{ id: "t", dir, source: "local-development", revision: "working-tree", regime: "short", timeoutS: 1 }],
      tools: ["mock"], conditions: ["pinned"], reps: 1, model: "mock", priceBook: "mock",
      executeCell: async (cell) => {
        observed = (JSON.parse(await readFile(statePath, "utf8")) as { cells: Array<{ status: string }> }).cells[0]?.status;
        return {
          v: 1 as const, run_id: cell.id, tool: "mock", tool_version: "mock", task_id: "t",
          task_source: "local-development", task_revision: "working-tree", task_regime: "short" as const,
          condition: "pinned" as const, rep: 0, model: "mock", ori_version: null, tool_visibility: "none" as const,
          anchors: { adapter: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 }, proxy: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 } },
          adapter_result: { exitCode: 0, tStart: 0, tEnd: 1, anchor: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 }, artifacts: { stdoutPath: "", stderrPath: "" } },
          events_file: "events.jsonl", verification: { exit: 0, duration_ms: 1, logPath: "verify.log" },
          container: { image_digest: "mock", verifier_image_digest: "mock", started_iso: "2026-01-01T00:00:00.000Z" }, task_environment: { kind: "runner-default", network: "disabled" as const }, host: { os: "test", cpu: "test", ram_gb: 1 },
          spend_usd_estimate: 0, price_book: "mock", outcome: "completed" as const,
        };
      },
    });
    expect(observed).toBe("running");
    expect(result.cells[0]?.status).toBe("done");
  });

  it("rejects resuming a state file with a different matrix definition", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-matrix-shape-"));
    const statePath = join(dir, "state.json");
    saveState(statePath, {
      version: 1, seed: 1, spentUsd: 0,
      definition_key: JSON.stringify({ model: "mock", priceBook: "mock", tools: ["a"], conditions: ["pinned"], reps: 1, tasks: [{ id: "t", source: "local-development", revision: "working-tree", regime: "short", timeoutS: 1 }] }),
      cells: [{ id: "pinned:a:t:0", tool: "a", task_id: "t", condition: "pinned", rep: 0, status: "done", retries: 0 }],
    });
    await expect(runMatrix({
      resultsDir: join(dir, "results"), statePath,
      tasks: [{ id: "t", dir, source: "local-development", revision: "working-tree", regime: "short", timeoutS: 1 }],
      tools: ["a", "b"], conditions: ["pinned"], reps: 1, model: "mock", priceBook: "mock",
      executeCell: async () => { throw new Error("must reject before execution"); },
    })).rejects.toBeInstanceOf(ConfigError);
  });

  it("rejects legacy state without a definition key instead of silently adopting it", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-matrix-legacy-"));
    const statePath = join(dir, "state.json");
    saveState(statePath, {
      version: 1, seed: 1, spentUsd: 0,
      cells: [{ id: "pinned:a:t:0", tool: "a", task_id: "t", condition: "pinned", rep: 0, status: "done", retries: 0 }],
    });
    await expect(runMatrix({
      resultsDir: join(dir, "results"), statePath,
      tasks: [{ id: "t", dir, source: "local-development", revision: "working-tree", regime: "short", timeoutS: 1 }],
      tools: ["a"], conditions: ["pinned"], reps: 1, model: "different-model", priceBook: "different-book",
      executeCell: async () => { throw new Error("must reject legacy state"); },
    })).rejects.toThrow(/definition[_ ]key|model/i);
  });

  it("retries a failed cell once and then quarantines it", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-retry-"));
    let attempts = 0;
    const result = await runMatrix({
      resultsDir: join(dir, "results"), statePath: join(dir, "state.json"),
      tasks: [{ id: "t", dir, source: "local-development", revision: "working-tree", regime: "short", timeoutS: 1 }],
      tools: ["mock"], conditions: ["pinned"], reps: 1, model: "mock", priceBook: "mock",
      executeCell: async (cell) => {
        attempts += 1;
        const cellDir = join(dir, "results", "pinned", "mock", "t", "rep-0");
        await mkdir(cellDir, { recursive: true });
        await writeFile(join(cellDir, "run.json"), JSON.stringify({ attempt: attempts }));
        await writeFile(join(cellDir, "events.jsonl"), `attempt-${attempts}\n`);
        return {
          v: 1 as const, run_id: cell.id, tool: "mock", tool_version: "mock", task_id: "t",
          task_source: "local-development", task_revision: "working-tree", task_regime: "short" as const,
          condition: "pinned" as const, rep: 0, model: "mock", ori_version: null, tool_visibility: "none" as const,
          anchors: { adapter: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 }, proxy: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 } },
          adapter_result: { exitCode: 1, tStart: 0, tEnd: 1, anchor: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 }, artifacts: { stdoutPath: "", stderrPath: "" } },
          events_file: "events.jsonl", verification: { exit: 1, duration_ms: 1, logPath: "verify.log" }, container: { image_digest: "mock", verifier_image_digest: "mock", started_iso: "2026-01-01T00:00:00.000Z" }, task_environment: { kind: "runner-default", network: "disabled" as const }, host: { os: "test", cpu: "test", ram_gb: 1 }, spend_usd_estimate: 0, price_book: "mock", outcome: "verify_error" as const,
        };
      },
    });
    expect(attempts).toBe(2);
    expect(result.cells[0]?.status).toBe("quarantined");
    expect(result.cells[0]?.retries).toBe(1);
    expect(JSON.parse(await readFile(join(dir, "results", "pinned", "mock", "t", "rep-0", ".attempts", "attempt-0", "run.json"), "utf8"))).toEqual({ attempt: 1 });
  });

  it("does not silently quarantine a thrown execution error", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-execution-error-"));
    const failure = new ConfigError("Docker storage is unavailable");
    await expect(runMatrix({
      resultsDir: join(dir, "results"), statePath: join(dir, "state.json"),
      tasks: [{ id: "t", dir, source: "local-development", revision: "working-tree", regime: "short", timeoutS: 1 }],
      tools: ["mock"], conditions: ["pinned"], reps: 1, model: "mock", priceBook: "mock",
      executeCell: async () => { throw failure; },
    })).rejects.toBe(failure);
    const state = loadState(join(dir, "state.json"));
    expect(state.cells[0]?.status).toBe("failed");
    expect(state.cells[0]?.retries).toBe(0);
  });

  it("stops at the budget cap and leaves the current cell pending", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-budget-stop-"));
    await expect(runMatrix({
      resultsDir: join(dir, "results"), statePath: join(dir, "state.json"),
      tasks: [{ id: "t", dir, source: "local-development", revision: "working-tree", regime: "short", timeoutS: 1 }],
      tools: ["mock"], conditions: ["pinned"], reps: 1, model: "mock", priceBook: "mock",
      capUsd: 0.5, priceRates: { input: 1, cached_input: 1, output: 1 },
      estimateCellUsd: () => 0.6,
      executeCell: async (cell) => ({
        v: 1 as const, run_id: cell.id, tool: "mock", tool_version: "mock", task_id: "t",
        task_source: "local-development", task_revision: "working-tree", task_regime: "short" as const,
        condition: "pinned" as const, rep: 0, model: "mock", ori_version: null, tool_visibility: "none" as const,
        anchors: { adapter: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 }, proxy: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 } },
        adapter_result: { exitCode: 0, tStart: 0, tEnd: 1, anchor: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 }, artifacts: { stdoutPath: "", stderrPath: "" } },
        events_file: "events.jsonl", verification: { exit: 0, duration_ms: 1, logPath: "verify.log" }, container: { image_digest: "mock", verifier_image_digest: "mock", started_iso: "2026-01-01T00:00:00.000Z" }, task_environment: { kind: "runner-default", network: "disabled" as const }, host: { os: "test", cpu: "test", ram_gb: 1 }, spend_usd_estimate: 0.6, price_book: "mock", outcome: "completed" as const,
      }),
    })).rejects.toBeInstanceOf(BudgetExceeded);
    expect(loadState(join(dir, "state.json")).cells[0]?.status).toBe("pending");
  });

  it("persists the spend of a returned C4 that exceeds the cap", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-budget-over-cap-accounting-"));
    const statePath = join(dir, "state.json");
    const runMatrixOptions = {
      resultsDir: join(dir, "results"), statePath,
      tasks: [{ id: "t", dir, source: "local-development", revision: "working-tree", regime: "short" as const, timeoutS: 1 }],
      tools: ["mock"], conditions: ["pinned" as const], reps: 1, model: "mock", priceBook: "mock",
      capUsd: 0.5, priceRates: { input: 1, cached_input: 1, output: 1 }, estimateCellUsd: () => 0.1,
      executeCell: async (cell: { id: string }, _task: unknown, output: string) => {
        const run = {
          v: 1 as const, run_id: cell.id, tool: "mock", tool_version: "mock", task_id: "t",
          task_source: "local-development", task_revision: "working-tree", task_regime: "short" as const,
          condition: "pinned" as const, rep: 0, model: "mock", ori_version: null, tool_visibility: "none" as const,
          anchors: { adapter: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 }, proxy: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 } },
          adapter_result: { exitCode: 0, tStart: 0, tEnd: 1, anchor: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 }, artifacts: { stdoutPath: "stdout.log", stderrPath: "stderr.log" } },
          events_file: "events.jsonl", verification: { exit: 1, duration_ms: 0, logPath: "verify.log" },
          container: { image_digest: "mock", verifier_image_digest: "mock", started_iso: "2026-01-01T00:00:00.000Z" }, task_environment: { kind: "runner-default" as const, network: "disabled" as const }, host: { os: "test", cpu: "test", ram_gb: 1 },
          spend_usd_estimate: 0.6, price_book: "mock", outcome: "verify_error" as const,
        };
        await mkdir(output, { recursive: true });
        await writeFile(join(output, "run.json"), `${JSON.stringify(run)}\n`);
        return run;
      },
    };
    await expect(runMatrix(runMatrixOptions)).rejects.toBeInstanceOf(BudgetExceeded);
    expect(loadState(statePath).spentUsd).toBeCloseTo(0.6, 8);
    await expect(runMatrix(runMatrixOptions)).rejects.toBeInstanceOf(BudgetExceeded);
    expect(loadState(statePath).spentUsd).toBeCloseTo(0.6, 8);
  });

  it("rejects a foreign valid C4 in a failed cell before retry", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-failed-foreign-artifact-"));
    const statePath = join(dir, "state.json");
    const runMatrixOptions = {
      resultsDir: join(dir, "results"), statePath,
      tasks: [{ id: "t", dir, source: "local-development", revision: "working-tree", regime: "short" as const, timeoutS: 1 }],
      tools: ["mock"], conditions: ["pinned" as const], reps: 1, model: "mock", priceBook: "mock",
      capUsd: 0.5, priceRates: { input: 1, cached_input: 1, output: 1 }, estimateCellUsd: () => 0.1,
      executeCell: async (cell: { id: string }, _task: unknown, output: string) => {
        const run = {
          v: 1 as const, run_id: cell.id, tool: "mock", tool_version: "mock", task_id: "t",
          task_source: "local-development", task_revision: "working-tree", task_regime: "short" as const,
          condition: "pinned" as const, rep: 0, model: "mock", ori_version: null, tool_visibility: "none" as const,
          anchors: { adapter: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 }, proxy: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 } },
          adapter_result: { exitCode: 1, tStart: 0, tEnd: 1, anchor: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 }, artifacts: { stdoutPath: "stdout.log", stderrPath: "stderr.log" } },
          events_file: "events.jsonl", verification: { exit: 1, duration_ms: 0, logPath: "verify.log" },
          container: { image_digest: "mock", verifier_image_digest: "mock", started_iso: "2026-01-01T00:00:00.000Z" }, task_environment: { kind: "runner-default" as const, network: "disabled" as const }, host: { os: "test", cpu: "test", ram_gb: 1 },
          spend_usd_estimate: 0.1, price_book: "mock", outcome: "adapter_error" as const,
        };
        await mkdir(output, { recursive: true });
        await writeFile(join(output, "run.json"), `${JSON.stringify(run)}\n`);
        return run;
      },
    };
    await expect(runMatrix(runMatrixOptions)).resolves.toMatchObject({ cells: [{ status: "quarantined" }] });
    const resultPath = join(dir, "results", "pinned", "mock", "t", "rep-0", "run.json");
    const foreign = JSON.parse(await readFile(resultPath, "utf8"));
    foreign.run_id = "pinned:mock:foreign:0";
    await writeFile(resultPath, `${JSON.stringify(foreign)}\n`);
    const state = loadState(statePath);
    state.cells[0]!.status = "failed";
    state.cells[0]!.retries = 0;
    saveState(statePath, state);
    await expect(runMatrix(runMatrixOptions)).rejects.toThrow(/does not match the matrix cell/i);
  });

  it("preserves an executed C4 when capped spend is unavailable", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-budget-unavailable-"));
    const statePath = join(dir, "state.json");
    let executions = 0;
    const runMatrixOptions = {
      resultsDir: join(dir, "results"), statePath,
      tasks: [{ id: "t", dir, source: "local-development", revision: "working-tree", regime: "short" as const, timeoutS: 1 }],
      tools: ["mock"], conditions: ["pinned" as const], reps: 1, model: "mock", priceBook: "mock",
      capUsd: 0.5, priceRates: { input: 1, cached_input: 1, output: 1 }, estimateCellUsd: () => 0.1,
      executeCell: async (cell: { id: string }, _task: unknown, output: string) => {
        executions += 1;
        const run = {
          v: 1 as const, run_id: cell.id, tool: "mock", tool_version: "mock", task_id: "t",
          task_source: "local-development", task_revision: "working-tree", task_regime: "short" as const,
          condition: "pinned" as const, rep: 0, model: "mock", ori_version: null, tool_visibility: "none" as const,
          anchors: { adapter: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 }, proxy: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 } },
          adapter_result: { exitCode: 124, tStart: 0, tEnd: 1, anchor: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 }, artifacts: { stdoutPath: "stdout.log", stderrPath: "stderr.log" } },
          events_file: "events.jsonl", verification: { exit: 1, duration_ms: 0, logPath: "verify.log" },
          container: { image_digest: "mock", verifier_image_digest: "mock", started_iso: "2026-01-01T00:00:00.000Z" }, task_environment: { kind: "runner-default" as const, network: "disabled" as const }, host: { os: "test", cpu: "test", ram_gb: 1 },
          spend_usd_estimate: null, price_book: "mock", outcome: "timeout" as const,
        };
        await mkdir(output, { recursive: true });
        await writeFile(join(output, "run.json"), `${JSON.stringify(run)}\n`);
        return run;
      },
    };
    await expect(runMatrix(runMatrixOptions)).rejects.toBeInstanceOf(BudgetExceeded);
    const resultDir = join(dir, "results", "pinned", "mock", "t", "rep-0");
    await expect(access(join(resultDir, "run.json"))).resolves.toBeUndefined();
    expect(loadState(statePath).cells[0]?.status).toBe("failed");
    expect(loadState(statePath).spentUsd).toBe(0);
    await expect(runMatrix(runMatrixOptions)).rejects.toBeInstanceOf(BudgetExceeded);
    expect(executions).toBe(1);
  });

  it("does not retry a preserved C4 whose recorded spend exceeds the cap", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-budget-over-cap-"));
    const statePath = join(dir, "state.json");
    let executions = 0;
    const runMatrixOptions = {
      resultsDir: join(dir, "results"), statePath,
      tasks: [{ id: "t", dir, source: "local-development", revision: "working-tree", regime: "short" as const, timeoutS: 1 }],
      tools: ["mock"], conditions: ["pinned" as const], reps: 1, model: "mock", priceBook: "mock",
      capUsd: 0.5, priceRates: { input: 1, cached_input: 1, output: 1 }, estimateCellUsd: () => 0.1,
      executeCell: async (cell: { id: string }, _task: unknown, output: string) => {
        executions += 1;
        const run = {
          v: 1 as const, run_id: cell.id, tool: "mock", tool_version: "mock", task_id: "t",
          task_source: "local-development", task_revision: "working-tree", task_regime: "short" as const,
          condition: "pinned" as const, rep: 0, model: "mock", ori_version: null, tool_visibility: "none" as const,
          anchors: { adapter: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 }, proxy: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 } },
          adapter_result: { exitCode: 0, tStart: 0, tEnd: 1, anchor: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 }, artifacts: { stdoutPath: "stdout.log", stderrPath: "stderr.log" } },
          events_file: "events.jsonl", verification: { exit: 1, duration_ms: 0, logPath: "verify.log" },
          container: { image_digest: "mock", verifier_image_digest: "mock", started_iso: "2026-01-01T00:00:00.000Z" }, task_environment: { kind: "runner-default" as const, network: "disabled" as const }, host: { os: "test", cpu: "test", ram_gb: 1 },
          spend_usd_estimate: 0.6, price_book: "mock", outcome: "verify_error" as const,
        };
        await mkdir(output, { recursive: true });
        await writeFile(join(output, "run.json"), `${JSON.stringify(run)}\n`);
        return run;
      },
    };
    await expect(runMatrix(runMatrixOptions)).rejects.toBeInstanceOf(BudgetExceeded);
    expect(loadState(statePath).cells[0]?.status).toBe("failed");
    await expect(runMatrix(runMatrixOptions)).rejects.toBeInstanceOf(BudgetExceeded);
    expect(executions).toBe(1);
  });

  it("checks a retry estimate against retained spend without reusing old spend", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-budget-retry-room-"));
    const statePath = join(dir, "state.json");
    let executions = 0;
    const result = await runMatrix({
      resultsDir: join(dir, "results"), statePath,
      tasks: [{ id: "t", dir, source: "local-development", revision: "working-tree", regime: "short" as const, timeoutS: 1 }],
      tools: ["mock"], conditions: ["pinned" as const], reps: 1, model: "mock", priceBook: "mock",
      capUsd: 0.5, priceRates: { input: 1, cached_input: 1, output: 1 }, estimateCellUsd: () => 0.1,
      executeCell: async (cell: { id: string }, _task: unknown, output: string) => {
        executions += 1;
        const failed = executions === 1;
        const run = {
          v: 1 as const, run_id: cell.id, tool: "mock", tool_version: "mock", task_id: "t",
          task_source: "local-development", task_revision: "working-tree", task_regime: "short" as const,
          condition: "pinned" as const, rep: 0, model: "mock", ori_version: null, tool_visibility: "none" as const,
          anchors: { adapter: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 }, proxy: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 } },
          adapter_result: { exitCode: failed ? 1 : 0, tStart: 0, tEnd: 1, anchor: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 }, artifacts: { stdoutPath: "stdout.log", stderrPath: "stderr.log" } },
          events_file: "events.jsonl", verification: { exit: failed ? 1 : 0, duration_ms: 0, logPath: "verify.log" },
          container: { image_digest: "mock", verifier_image_digest: "mock", started_iso: "2026-01-01T00:00:00.000Z" }, task_environment: { kind: "runner-default" as const, network: "disabled" as const }, host: { os: "test", cpu: "test", ram_gb: 1 },
          spend_usd_estimate: failed ? 0.31 : 0.1, price_book: "mock", outcome: failed ? "verify_error" as const : "completed" as const,
        };
        await mkdir(output, { recursive: true });
        await writeFile(join(output, "run.json"), `${JSON.stringify(run)}\n`);
        return run;
      },
    });
    expect(executions).toBe(2);
    expect(result.cells[0]?.status).toBe("done");
    expect(result.spentUsd).toBeCloseTo(0.41, 8);
  });

  it("rejects a zero preflight estimate when a hard cap is armed", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-budget-estimate-"));
    await expect(runMatrix({
      resultsDir: join(dir, "results"), statePath: join(dir, "state.json"),
      tasks: [{ id: "t", dir, source: "local-development", revision: "working-tree", regime: "short", timeoutS: 1 }],
      tools: ["mock"], conditions: ["pinned"], reps: 1, model: "mock", priceBook: "mock",
      capUsd: 1, estimateCellUsd: () => 0,
      executeCell: async () => { throw new Error("must reject before execution"); },
    })).rejects.toThrow(/positive conservative spend estimate/);
  });

  it("reconciles a completed artifact after an interrupted lifecycle transition", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-resume-artifact-"));
    const statePath = join(dir, "state.json");
    const resultDir = join(dir, "results", "pinned", "mock", "t", "rep-0");
    const run = {
      v: 1 as const, run_id: "pinned:mock:t:0", tool: "mock", tool_version: "mock", task_id: "t",
      task_source: "local-development", task_revision: "working-tree", task_regime: "short" as const,
      condition: "pinned" as const, rep: 0, model: "mock", ori_version: null, tool_visibility: "none" as const,
      anchors: { adapter: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 }, proxy: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 } },
      adapter_result: { exitCode: 0, tStart: 0, tEnd: 1, anchor: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 }, artifacts: { stdoutPath: "stdout.log", stderrPath: "stderr.log" } },
      events_file: "events.jsonl", verification: { exit: 0, duration_ms: 1, logPath: "verify.log" }, container: { image_digest: "mock", verifier_image_digest: "mock", started_iso: "2026-01-01T00:00:00.000Z" }, task_environment: { kind: "runner-default", network: "disabled" as const }, host: { os: "test", cpu: "test", ram_gb: 1 }, spend_usd_estimate: 0.25, price_book: "mock", outcome: "completed" as const,
    };
    await mkdir(resultDir, { recursive: true });
    await writeFile(join(resultDir, "run.json"), `${JSON.stringify(run)}\n`);
    saveState(statePath, {
      version: 1, seed: 1, spentUsd: 0,
      definition_key: JSON.stringify({ model: "mock", priceBook: "mock", tools: ["mock"], conditions: ["pinned"], reps: 1, tasks: [{ id: "t", source: "local-development", revision: "working-tree", regime: "short", timeoutS: 1 }] }),
      cells: [{ id: run.run_id, tool: "mock", task_id: "t", condition: "pinned", rep: 0, status: "verifying", retries: 0 }],
    });
    let executions = 0;
    const result = await runMatrix({
      resultsDir: join(dir, "results"), statePath,
      tasks: [{ id: "t", dir, source: "local-development", revision: "working-tree", regime: "short", timeoutS: 1 }],
      tools: ["mock"], conditions: ["pinned"], reps: 1, model: "mock", priceBook: "mock",
      executeCell: async () => { executions += 1; throw new Error("must not rerun completed artifact"); },
    });
    expect(executions).toBe(0);
    expect(result.cells[0]?.status).toBe("done");
    expect(result.spentUsd).toBeCloseTo(0.25, 8);
  });

  it("recovers and charges a failed artifact before retrying", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-resume-failed-artifact-"));
    const statePath = join(dir, "state.json");
    const resultDir = join(dir, "results", "pinned", "mock", "t", "rep-0");
    const run = {
      v: 1 as const, run_id: "pinned:mock:t:0", tool: "mock", tool_version: "mock", task_id: "t",
      task_source: "local-development", task_revision: "working-tree", task_regime: "short" as const,
      condition: "pinned" as const, rep: 0, model: "mock", ori_version: null, tool_visibility: "none" as const,
      anchors: { adapter: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 }, proxy: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 } },
      adapter_result: { exitCode: 1, tStart: 0, tEnd: 1, anchor: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 }, artifacts: { stdoutPath: "stdout.log", stderrPath: "stderr.log" } },
      events_file: "events.jsonl", verification: { exit: 1, duration_ms: 1, logPath: "verify.log" },
      container: { image_digest: "mock", verifier_image_digest: "mock", started_iso: "2026-01-01T00:00:00.000Z" }, task_environment: { kind: "runner-default", network: "disabled" as const },
      host: { os: "test", cpu: "test", ram_gb: 1 }, spend_usd_estimate: 0.25, price_book: "mock", outcome: "verify_error" as const,
    };
    await mkdir(resultDir, { recursive: true });
    await writeFile(join(resultDir, "run.json"), `${JSON.stringify(run)}\n`);
    saveState(statePath, {
      version: 1, seed: 1, spentUsd: 0,
      definition_key: JSON.stringify({ model: "mock", priceBook: "mock", tools: ["mock"], conditions: ["pinned"], reps: 1, tasks: [{ id: "t", source: "local-development", revision: "working-tree", regime: "short", timeoutS: 1 }] }),
      cells: [{ id: run.run_id, tool: "mock", task_id: "t", condition: "pinned", rep: 0, status: "running", retries: 0 }],
    });
    let executions = 0;
    const result = await runMatrix({
      resultsDir: join(dir, "results"), statePath,
      tasks: [{ id: "t", dir, source: "local-development", revision: "working-tree", regime: "short", timeoutS: 1 }],
      tools: ["mock"], conditions: ["pinned"], reps: 1, model: "mock", priceBook: "mock",
      executeCell: async (cell) => {
        executions += 1;
        return { ...run, run_id: cell.id, adapter_result: { ...run.adapter_result, exitCode: 0 }, verification: { ...run.verification, exit: 0 }, spend_usd_estimate: 0.07, outcome: "completed" as const };
      },
    });
    expect(executions).toBe(1);
    expect(result.cells[0]?.status).toBe("done");
    expect(result.spentUsd).toBeCloseTo(0.32, 8);
    expect(JSON.parse(await readFile(join(resultDir, ".attempts", "attempt-0", "run.json"), "utf8"))).toEqual(run);
  });

  it("does not recharge an archived failure when resuming a staged retry", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-resume-staged-retry-"));
    const statePath = join(dir, "state.json");
    const resultDir = join(dir, "results", "pinned", "mock", "t", "rep-0");
    const run = {
      v: 1 as const, run_id: "pinned:mock:t:0", tool: "mock", tool_version: "mock", task_id: "t",
      task_source: "local-development", task_revision: "working-tree", task_regime: "short" as const,
      condition: "pinned" as const, rep: 0, model: "mock", ori_version: null, tool_visibility: "none" as const,
      anchors: { adapter: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 }, proxy: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 } },
      adapter_result: { exitCode: 1, tStart: 0, tEnd: 1, anchor: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 }, artifacts: { stdoutPath: "stdout.log", stderrPath: "stderr.log" } },
      events_file: "events.jsonl", verification: { exit: 1, duration_ms: 1, logPath: "verify.log" },
      container: { image_digest: "mock", verifier_image_digest: "mock", started_iso: "2026-01-01T00:00:00.000Z" }, task_environment: { kind: "runner-default", network: "disabled" as const },
      host: { os: "test", cpu: "test", ram_gb: 1 }, spend_usd_estimate: 0.25, price_book: "mock", outcome: "verify_error" as const,
    };
    await mkdir(join(resultDir, ".attempts", "attempt-0"), { recursive: true });
    await writeFile(join(resultDir, "run.json"), `${JSON.stringify(run)}\n`);
    await writeFile(join(resultDir, ".attempts", "attempt-0", "run.json"), `${JSON.stringify(run)}\n`);
    saveState(statePath, {
      version: 1, seed: 1, spentUsd: 0.25,
      definition_key: JSON.stringify({ model: "mock", priceBook: "mock", tools: ["mock"], conditions: ["pinned"], reps: 1, tasks: [{ id: "t", source: "local-development", revision: "working-tree", regime: "short", timeoutS: 1 }] }),
      cells: [{ id: run.run_id, tool: "mock", task_id: "t", condition: "pinned", rep: 0, status: "staged", retries: 1 }],
    });
    let executions = 0;
    const result = await runMatrix({
      resultsDir: join(dir, "results"), statePath,
      tasks: [{ id: "t", dir, source: "local-development", revision: "working-tree", regime: "short", timeoutS: 1 }],
      tools: ["mock"], conditions: ["pinned"], reps: 1, model: "mock", priceBook: "mock",
      executeCell: async (cell) => {
        executions += 1;
        return { ...run, run_id: cell.id, adapter_result: { ...run.adapter_result, exitCode: 0 }, verification: { ...run.verification, exit: 0 }, spend_usd_estimate: 0.07, outcome: "completed" as const };
      },
    });
    expect(executions).toBe(1);
    expect(result.cells[0]?.status).toBe("done");
    expect(result.spentUsd).toBeCloseTo(0.32, 8);
  });

  it("does not claim zero spend when usage exists but rates are absent", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-unpriced-"));
    const taskDir = join(dir, "task");
    await mkdir(join(taskDir, "workspace"), { recursive: true });
    await writeFile(join(taskDir, "prompt.md"), "solve");
    await writeFile(join(taskDir, "verify.sh"), "#!/bin/sh\ntest -f \"$(dirname \"$0\")/workspace/SOLVED\"\n", { mode: 0o755 });
    const mock = await startMockUpstream({ delayMs: 0, streamed: false, includeUsage: true, status: 200 });
    try {
      const run = await runHostCell({
        dir: join(dir, "out"), taskDir, upstream: mock.baseUrl, run_id: "unpriced", tool: "mock-agent", task_id: "echo", model: "mock", price_book: "unknown",
        task_source: "local-development", task_revision: "working-tree", task_regime: "short",
      });
      expect(run.spend_usd_estimate).toBeNull();
    } finally {
      await mock.close();
    }
  });

  it("charges valid interrupted proxy usage once before resuming", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-interrupted-spend-"));
    const resultsDir = join(dir, "results");
    const statePath = join(dir, "state.json");
    const eventDir = join(resultsDir, "pinned", "mock", "t", "rep-0");
    await mkdir(eventDir, { recursive: true });
    await writeFile(join(eventDir, "events.jsonl"), `${JSON.stringify({
      v: 1, run_id: "pinned:mock:t:0", seq: 0, t_req_start: 0, t_req_body_end: 0,
      t_upstream_sent: 0, t_first_byte: 1, t_last_byte: 1, duration_ms: 1,
      method: "POST", path: "/v1/chat/completions", protocol: "openai_chat",
      model_requested: "mock", model_served: "mock", status: 200, streamed: false,
      usage: { input: 10, cached_input: 0, output: 5, reasoning_output: 0 },
      usage_source: "response_body", error: null,
    })}\n`);
    saveState(statePath, {
      version: 1, seed: 1, spentUsd: 0,
      definition_key: JSON.stringify({ model: "mock", priceBook: "mock", tools: ["mock"], conditions: ["pinned"], reps: 1, tasks: [{ id: "t", source: "local-development", revision: "working-tree", regime: "short", timeoutS: 1 }] }),
      cells: [{ id: "pinned:mock:t:0", tool: "mock", task_id: "t", condition: "pinned", rep: 0, status: "running", retries: 0 }],
    });
    let attempts = 0;
    const executeCell = async (cell: { id: string }) => {
      attempts += 1;
      return {
        v: 1 as const, run_id: cell.id, tool: "mock", tool_version: "mock", task_id: "t",
        task_source: "local-development", task_revision: "working-tree", task_regime: "short" as const,
        condition: "pinned" as const, rep: 0, model: "mock", ori_version: null, tool_visibility: "none" as const,
        anchors: { adapter: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 }, proxy: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 } },
        adapter_result: { exitCode: 0, tStart: 0, tEnd: 1, anchor: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 }, artifacts: { stdoutPath: "", stderrPath: "" } },
        events_file: "events.jsonl", verification: { exit: 0, duration_ms: 1, logPath: "verify.log" },
        container: { image_digest: "mock", verifier_image_digest: "mock", started_iso: "2026-01-01T00:00:00.000Z" }, task_environment: { kind: "runner-default", network: "disabled" as const }, host: { os: "test", cpu: "test", ram_gb: 1 },
        spend_usd_estimate: 0, price_book: "mock", outcome: "completed" as const,
      };
    };
    const options = {
      resultsDir, statePath,
      tasks: [{ id: "t", dir, source: "local-development", revision: "working-tree", regime: "short" as const, timeoutS: 1 }],
      tools: ["mock"], conditions: ["pinned" as const], reps: 1, model: "mock", priceBook: "mock",
      priceRates: { input: 0.001, cached_input: 0.0001, output: 0.002 }, executeCell,
    };
    const first = await runMatrix(options);
    expect(first.spentUsd).toBeCloseTo(0.02, 8);
    expect(first.cells[0]?.status).toBe("done");
    const second = await runMatrix(options);
    expect(second.spentUsd).toBeCloseTo(0.02, 8);
    expect(attempts).toBe(1);
  });

  it("cleans persisted Docker container, relay, and network before recovering a killed cell", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-orphan-container-"));
    const binDir = join(dir, "bin");
    await mkdir(binDir);
    const marker = join(dir, "cleanup-marker");
    const docker = join(binDir, "docker");
    await writeFile(docker, `#!/bin/sh
if [ "$1" = rm ] && [ "$2" = -f ] && { [ "$3" = aob-123-456 ] || [ "$3" = aob-verify-123-456 ] || [ "$3" = aob-relay-123-456 ]; }; then printf '%s\\n' "$3" >> "${marker}"; exit 0; fi
if [ "$1" = network ] && [ "$2" = rm ] && [ "$3" = aob-net-123-456 ]; then printf '%s\\n' "$3" >> "${marker}"; exit 0; fi
exit 1
`);
    await chmod(docker, 0o755);
    const statePath = join(dir, "state.json");
    saveState(statePath, {
      version: 1, seed: 1, spentUsd: 0,
      definition_key: JSON.stringify({ model: "mock", priceBook: "mock", tools: ["mock"], conditions: ["pinned"], reps: 1, tasks: [{ id: "t", source: "local-development", revision: "working-tree", regime: "short", timeoutS: 1 }] }),
      cells: [{ id: "pinned:mock:t:0", tool: "mock", task_id: "t", condition: "pinned", rep: 0, status: "running", retries: 0, containerName: "aob-123-456", relayName: "aob-relay-123-456", networkName: "aob-net-123-456" }],
    });
    const originalPath = process.env.PATH;
    process.env.PATH = `${binDir}:${originalPath ?? "/usr/bin:/bin"}`;
    try {
      const result = await runMatrix({
        resultsDir: join(dir, "results"), statePath,
        tasks: [{ id: "t", dir, source: "local-development", revision: "working-tree", regime: "short", timeoutS: 1 }],
        tools: ["mock"], conditions: ["pinned"], reps: 1, model: "mock", priceBook: "mock",
        executeCell: async (cell) => ({
          v: 1 as const, run_id: cell.id, tool: "mock", tool_version: "mock", task_id: "t",
          task_source: "local-development", task_revision: "working-tree", task_regime: "short" as const,
          condition: "pinned" as const, rep: 0, model: "mock", ori_version: null, tool_visibility: "none" as const,
          anchors: { adapter: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 }, proxy: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 } },
          adapter_result: { exitCode: 0, tStart: 0, tEnd: 1, anchor: { wall_clock_iso: "2026-01-01T00:00:00.000Z", monotonic_zero: 0 }, artifacts: { stdoutPath: "", stderrPath: "" } },
          events_file: "events.jsonl", verification: { exit: 0, duration_ms: 1, logPath: "verify.log" },
          container: { image_digest: "mock", verifier_image_digest: "mock", started_iso: "2026-01-01T00:00:00.000Z" }, task_environment: { kind: "runner-default", network: "disabled" as const }, host: { os: "test", cpu: "test", ram_gb: 1 },
          spend_usd_estimate: 0, price_book: "mock", outcome: "completed" as const,
        }),
      });
      expect(await readFile(marker, "utf8")).toBe("aob-123-456\naob-relay-123-456\naob-net-123-456\n");
      expect(result.cells[0]?.status).toBe("done");
      expect(result.cells[0]?.containerName).toBeUndefined();
    } finally {
      process.env.PATH = originalPath;
    }
  });

  it("refuses a capped resume when interrupted spend was previously unpriced", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-unpriced-resume-"));
    const statePath = join(dir, "state.json");
    const definitionKey = JSON.stringify({ model: "mock", priceBook: "mock", tools: ["mock"], conditions: ["pinned"], reps: 1, tasks: [{ id: "t", source: "local-development", revision: "working-tree", regime: "short", timeoutS: 1 }] });
    saveState(statePath, {
      version: 1, seed: 1, spentUsd: 0, definition_key: definitionKey,
      cells: [{ id: "pinned:mock:t:0", tool: "mock", task_id: "t", condition: "pinned", rep: 0, status: "running", retries: 0, interruptedSpendUsd: null }],
    });
    let executed = false;
    await expect(runMatrix({
      resultsDir: join(dir, "results"), statePath,
      tasks: [{ id: "t", dir, source: "local-development", revision: "working-tree", regime: "short", timeoutS: 1 }],
      tools: ["mock"], conditions: ["pinned"], reps: 1, model: "mock", priceBook: "mock",
      capUsd: 1, estimateCellUsd: () => 1,
      executeCell: async () => { executed = true; throw new Error("must not execute unpriced capped cell"); },
    })).rejects.toBeInstanceOf(BudgetExceeded);
    expect(executed).toBe(false);
  });
});

describe("Docker executor", () => {
  it("uses an internal agent network and a bridge-connected relay", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-docker-relay-"));
    const binDir = join(dir, "bin");
    await mkdir(binDir);
    const argsPath = join(dir, "docker-args");
    const docker = join(binDir, "docker");
    await writeFile(docker, `#!/bin/sh
printf '%s\\n' "$*" >> "${argsPath}"
if [ "$1" = image ]; then printf '${fakeDigest}\\n'; exit 0; fi
if [ "$1" = network ] && [ "$2" = create ]; then printf 'network-id\\n'; exit 0; fi
if [ "$1" = network ] && [ "$2" = connect ]; then exit 0; fi
if [ "$1" = exec ]; then exit 0; fi
if [ "$1" = rm ] || { [ "$1" = network ] && [ "$2" = rm ]; }; then exit 0; fi
if [ "$1" = run ] && printf '%s' "$*" | grep -q -- ' -d '; then printf 'relay-id\\n'; exit 0; fi
exit 0
`);
    await chmod(docker, 0o755);
    const originalPath = process.env.PATH;
    process.env.PATH = `${binDir}:${originalPath ?? "/usr/bin:/bin"}`;
    const route = describeDockerProxyRoute("http://host.docker.internal:1234", "aob-123-456");
    try {
      await startDockerProxyRoute(route);
      await stopDockerProxyRoute(route);
      const lines = (await readFile(argsPath, "utf8")).trim().split("\n");
      expect(lines.some((line) => line.includes("network create") && line.includes("--internal"))).toBe(true);
      expect(lines.some((line) => line.includes("network connect bridge aob-relay-123-456"))).toBe(true);
      expect(lines.some((line) => line.includes("run --pull=never -d") && line.includes("--network aob-net-123-456"))).toBe(true);
      expect(lines.some((line) => line.includes("rm -f aob-relay-123-456"))).toBe(true);
      expect(lines.some((line) => line.includes("network rm aob-net-123-456"))).toBe(true);
    } finally {
      process.env.PATH = originalPath;
    }
  });

  it("attaches the agent only to the internal network", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-docker-internal-"));
    const binDir = join(dir, "bin");
    await mkdir(binDir);
    const argsPath = join(dir, "docker-args");
    const docker = join(binDir, "docker");
    await writeFile(docker, `#!/bin/sh
printf '%s\\n' "$*" >> "${argsPath}"
if [ "$1" = image ]; then printf '${fakeDigest}\\n'; exit 0; fi
if [ "$1" = network ] && [ "$2" = create ]; then printf 'network-id\\n'; exit 0; fi
if [ "$1" = network ] && [ "$2" = connect ]; then exit 0; fi
if [ "$1" = exec ]; then exit 0; fi
if [ "$1" = rm ] || { [ "$1" = network ] && [ "$2" = rm ]; }; then exit 0; fi
if [ "$1" = run ] && printf '%s' "$*" | grep -q -- ' -d '; then printf 'relay-id\\n'; exit 0; fi
printf 'agent\\n'
exit 0
`);
    await chmod(docker, 0o755);
    const workspace = join(dir, "workspace");
    await mkdir(workspace);
    const originalPath = process.env.PATH;
    process.env.PATH = `${binDir}:${originalPath ?? "/usr/bin:/bin"}`;
    const route = describeDockerProxyRoute("http://host.docker.internal:1234", "aob-123-456");
    try {
      const result = await runDockerCommand({
        image: "aob-mock:s2", argv: ["echo", `${route.clientUrl}/v1`], env: {}, workdir: workspace,
      }, route, join(dir, "out"));
      expect(result.exitCode).toBe(0);
      const lines = (await readFile(argsPath, "utf8")).trim().split("\n");
      const agent = lines.find((line) => line.includes("/opt/aob/runner-entrypoint.sh"));
      expect(agent).toBeDefined();
      expect(agent).toContain("--network aob-net-123-456");
      expect(agent).not.toContain("--network bridge");
      expect(agent).not.toContain("--add-host=host.docker.internal:host-gateway");
    } finally {
      process.env.PATH = originalPath;
    }
  });

  it("gives read-only Docker version probes a bounded temporary home", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-docker-version-home-"));
    const binDir = join(dir, "bin");
    await mkdir(binDir);
    const argsPath = join(dir, "docker-args");
    const docker = join(binDir, "docker");
    await writeFile(docker, `#!/bin/sh
printf '%s\\n' "$*" >> "${argsPath}"
if [ "$1" = image ]; then printf '${fakeDigest}\\n'; exit 0; fi
if [ "$1" = network ] && [ "$2" = create ]; then printf 'network-id\\n'; exit 0; fi
if [ "$1" = network ] && [ "$2" = connect ]; then exit 0; fi
if [ "$1" = network ] && [ "$2" = rm ]; then exit 0; fi
if [ "$1" = exec ]; then exit 0; fi
if [ "$1" = run ] && printf '%s' "$*" | grep -q -- ' -d '; then printf 'relay-id\\n'; exit 0; fi
if [ "$1" = run ] && printf '%s' "$*" | grep -q -- '--entrypoint opencode'; then
  printf '%s' "$*" | grep -q -- '--read-only' || exit 1
  printf '%s' "$*" | grep -q -- '--cap-drop=ALL' || exit 1
  printf '%s' "$*" | grep -q -- '--security-opt no-new-privileges' || exit 1
  printf '%s' "$*" | grep -q -- '--network none' || exit 1
  printf '%s' "$*" | grep -q -- '--tmpfs /tmp:rw,noexec,nosuid,nodev,size=64m' || exit 1
  printf '%s' "$*" | grep -q -- '--env HOME=/tmp' || exit 1
  printf '1.18.23\\n'; exit 0
fi
printf 'agent\\n'
exit 0
`);
    await chmod(docker, 0o755);
    const workspace = join(dir, "workspace");
    await mkdir(workspace);
    const originalPath = process.env.PATH;
    process.env.PATH = `${binDir}:${originalPath ?? "/usr/bin:/bin"}`;
    const route = describeDockerProxyRoute("http://host.docker.internal:1234", "aob-123-456");
    try {
      const result = await runDockerCommand({
        image: "aob-opencode:s2", toolVersion: "1.18.23", versionArgv: ["opencode", "--version"],
        argv: ["echo", route.clientUrl], env: {}, workdir: workspace,
      }, route, join(dir, "out"));
      expect(result.toolVersion).toBe("1.18.23");
      const args = await readFile(argsPath, "utf8");
      const probe = args.split("\n").find((line) => line.includes("--entrypoint opencode"));
      expect(probe).toContain("--tmpfs /tmp:rw,noexec,nosuid,nodev,size=64m");
      expect(probe).toContain("--env HOME=/tmp");
    } finally {
      process.env.PATH = originalPath;
    }
  });

	it("uses the host proxy route, isolated workspace mount, closed stdin, digest capture, and redacted logs", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-docker-"));
    const binDir = join(dir, "bin");
    await mkdir(binDir);
    const argsPath = join(dir, "docker-args");
    const docker = join(binDir, "docker");
    await writeFile(docker, `#!/bin/sh
printf '%s\\n' "$*" >> "${argsPath}"
if [ "$1" = image ]; then printf '${fakeDigest}\\n'; exit 0; fi
if [ "$1" = network ] && [ "$2" = create ]; then printf 'network-id\\n'; exit 0; fi
if [ "$1" = network ] && [ "$2" = connect ]; then exit 0; fi
if [ "$1" = network ] && [ "$2" = rm ]; then exit 0; fi
if [ "$1" = exec ]; then exit 0; fi
if [ "$1" = run ] && printf '%s' "$*" | grep -q -- ' -d '; then printf 'relay-id\\n'; exit 0; fi
if [ "$1" = run ] && printf '%s' "$*" | grep -q -- '--entrypoint echo'; then printf '0.1.0\\n'; exit 0; fi
if [ "$AOB_SECRET" = 'sk-or-docker-secret' ]; then printf 'env-forwarded\\n' > "${argsPath}.env"; fi
if printf '%s' "$*" | grep -q -- '--json'; then
  printf '%s\\n' '{"type":"item.started","item":{"id":"cmd-1","type":"command_execution","command":"sk-or-docker-secret"}}'
  printf '%s\\n' '{"type":"item.completed","item":{"id":"cmd-1","type":"command_execution","status":"completed"}}'
  exit 0
fi
if read line; then printf 'stdin-was-open\\n'; fi
printf 'secret sk-or-docker-secret\\n'
printf 'stderr secret sk-or-docker-secret\\n' >&2
exit 0
`);
    await chmod(docker, 0o755);
    const workspace = join(dir, "workspace");
    await mkdir(workspace);
    const out = join(dir, "out");
    const originalPath = process.env.PATH;
    process.env.PATH = `${binDir}:${originalPath ?? "/usr/bin:/bin"}`;
    const route = describeDockerProxyRoute("http://host.docker.internal:1234", "aob-123-456");
    try {
      const result = await runDockerCommand({
        image: "aob-mock:s2", toolVersion: "0.1.0", versionArgv: ["echo", "0.1.0"], argv: ["--json", "echo", `${route.clientUrl}/v1`, "ok"], env: { AOB_SECRET: "sk-or-docker-secret" }, workdir: workspace, toolEventFormat: "codex-json",
      }, route, out);
      const args = await readFile(argsPath, "utf8");
      expect(args).toContain("--read-only");
      expect(args).toContain("--pull=never");
      expect(args).toContain("--tmpfs /tmp:rw,noexec,nosuid,nodev,size=64m");
      expect(args).toContain("--cap-drop=ALL");
      expect(args).toContain("--security-opt no-new-privileges");
      expect(args).toContain("--entrypoint /opt/aob/runner-entrypoint.sh");
      expect(args).toContain("--workdir /work/workspace");
      expect(args).toContain(`dst=/work/workspace`);
      expect(args).not.toContain(`dst=/work,`);
      expect(args).toContain(` ${fakeDigest} `);
      expect(args).not.toContain(`aob-mock:s2@${fakeDigest}`);
      expect(args).toContain("--env AOB_SECRET");
      expect(args).not.toContain("sk-or-docker-secret");
      expect(await readFile(`${argsPath}.env`, "utf8")).toBe("env-forwarded\n");
      const agentArgs = args.split("\n").find((line) => line.includes("/opt/aob/runner-entrypoint.sh"));
      expect(agentArgs).toContain("--network aob-net-123-456");
      expect(agentArgs).not.toContain("--network bridge");
      expect(agentArgs).not.toContain("--add-host=host.docker.internal:host-gateway");
      expect((args.match(/--mount/g) ?? []).length).toBe(1);
      expect(result.imageDigest).toBe(fakeDigest);
      expect(result.toolVersion).toBe("0.1.0");
      expect(await readFile(result.stdoutPath, "utf8")).not.toContain("sk-or-docker-secret");
      expect(await readFile(result.stderrPath, "utf8")).not.toContain("sk-or-docker-secret");
      expect(await readFile(result.stdoutPath, "utf8")).not.toContain("stdin-was-open");
      expect(result.toolEvents).toEqual([{ tStart: expect.any(Number), tEnd: expect.any(Number), kind: "command_execution" }]);
      expect(result.toolLogPath).toBe(join(out, "tool-events.jsonl"));
      expect(await readFile(result.toolLogPath!, "utf8")).not.toContain("sk-or-docker-secret");
    } finally {
      process.env.PATH = originalPath;
    }
	});

	it("selects the OpenCode JSON parser and projects its completed tool interval", async () => {
		const dir = await mkdtemp(join(tmpdir(), "aob-docker-opencode-events-"));
		const binDir = join(dir, "bin");
		await mkdir(binDir);
		const docker = join(binDir, "docker");
		await writeFile(docker, `#!/bin/sh
if [ "$1" = image ]; then printf '${fakeDigest}\\n'; exit 0; fi
if [ "$1" = network ] && [ "$2" = create ]; then exit 0; fi
if [ "$1" = network ] && [ "$2" = connect ]; then exit 0; fi
if [ "$1" = network ] && [ "$2" = rm ]; then exit 0; fi
if [ "$1" = rm ]; then exit 0; fi
if [ "$1" = exec ]; then exit 0; fi
if [ "$1" = run ] && printf '%s' "$*" | grep -q -- ' -d '; then printf 'relay-id\\n'; exit 0; fi
if [ "$1" = run ]; then
  sleep 0.02
  now=$(node -e 'process.stdout.write(String(Date.now()))')
  start=$((now - 10))
  end=$((now - 1))
  printf '{"type":"tool_use","part":{"type":"tool","callID":"oc-1","tool":"bash","state":{"status":"completed","time":{"start":%s,"end":%s}}}}\\n' "$start" "$end"
  exit 0
fi
exit 1
`);
		await chmod(docker, 0o755);
		const workspace = join(dir, "workspace");
		await mkdir(workspace);
		const originalPath = process.env.PATH;
		process.env.PATH = `${binDir}:${originalPath ?? "/usr/bin:/bin"}`;
		const route = describeDockerProxyRoute("http://host.docker.internal:1234", "aob-123-456");
		try {
			const result = await runDockerCommand({
				image: "aob-opencode:s2",
				argv: ["opencode", "run", "--format", "json", "prompt", route.clientUrl], env: {}, workdir: workspace, toolEventFormat: "opencode-json",
			}, route, join(dir, "out"));
			expect(result.toolEvents).toEqual([{ tStart: expect.any(Number), tEnd: expect.any(Number), kind: "bash" }]);
			expect(result.toolLogPath).toBe(join(dir, "out", "tool-events.jsonl"));
		} finally {
			process.env.PATH = originalPath;
		}
	});

	it("turns malformed Docker structured output into a failed cell result", async () => {
		const dir = await mkdtemp(join(tmpdir(), "aob-docker-parser-failure-"));
		const binDir = join(dir, "bin");
		await mkdir(binDir);
		const docker = join(binDir, "docker");
		await writeFile(docker, `#!/bin/sh
if [ "$1" = image ]; then printf '${fakeDigest}\\n'; exit 0; fi
if [ "$1" = network ] && [ "$2" = create ]; then exit 0; fi
if [ "$1" = network ] && [ "$2" = connect ]; then exit 0; fi
if [ "$1" = network ] && [ "$2" = rm ]; then exit 0; fi
if [ "$1" = rm ]; then exit 0; fi
if [ "$1" = exec ]; then exit 0; fi
if [ "$1" = run ] && printf '%s' "$*" | grep -q -- ' -d '; then printf 'relay-id\\n'; exit 0; fi
if [ "$1" = run ]; then printf '{"type":"tool_use","part":{"type":"tool","callID":"open","tool":"bash","state":{"status":"running"}}}\\n'; exit 0; fi
exit 1
`);
		await chmod(docker, 0o755);
		const workspace = join(dir, "workspace");
		await mkdir(workspace);
		const originalPath = process.env.PATH;
		process.env.PATH = `${binDir}:${originalPath ?? "/usr/bin:/bin"}`;
		const route = describeDockerProxyRoute("http://host.docker.internal:1234", "aob-123-456");
		try {
			const result = await runDockerCommand({
				image: "aob-opencode:s2", argv: ["opencode", "run", "--format", "json", "--", "prompt", route.clientUrl], env: {}, workdir: workspace, toolEventFormat: "opencode-json",
			}, route, join(dir, "out"));
			expect(result.exitCode).toBe(1);
			expect(result.toolEvents).toBeUndefined();
		} finally {
			process.env.PATH = originalPath;
		}
	});

	it("rejects a task agent image whose declared digest differs before launch", async () => {
		const dir = await mkdtemp(join(tmpdir(), "aob-docker-image-digest-"));
		const binDir = join(dir, "bin");
		await mkdir(binDir);
		const docker = join(binDir, "docker");
		await writeFile(docker, `#!/bin/sh
if [ "$1" = image ]; then printf '${fakeDigest}\\n'; exit 0; fi
if [ "$1" = network ] && [ "$2" = create ]; then exit 0; fi
if [ "$1" = network ] && [ "$2" = connect ]; then exit 0; fi
if [ "$1" = exec ]; then exit 0; fi
if [ "$1" = rm ] || { [ "$1" = network ] && [ "$2" = rm ]; }; then exit 0; fi
if [ "$1" = run ]; then printf 'relay-id\\n'; exit 0; fi
exit 1
`);
		await chmod(docker, 0o755);
		const workspace = join(dir, "workspace");
		await mkdir(workspace);
		const originalPath = process.env.PATH;
		process.env.PATH = `${binDir}:${originalPath ?? "/usr/bin:/bin"}`;
		const route = describeDockerProxyRoute("http://host.docker.internal:1234", "aob-123-456");
		try {
			await expect(runDockerCommand({
				image: "aob-task-codex:calibration", image_digest: "sha256:" + "b".repeat(64),
				argv: ["codex", route.clientUrl], env: {}, workdir: workspace,
			}, route, join(dir, "out"))).rejects.toThrow(/image identity drift/);
		} finally {
			process.env.PATH = originalPath;
		}
	});

  it("isolates verification in a network-disabled container and captures its evidence", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-docker-verify-"));
    const binDir = join(dir, "bin");
    await mkdir(binDir);
    const argsPath = join(dir, "docker-args");
    const docker = join(binDir, "docker");
    await writeFile(docker, `#!/bin/sh
printf '%s\\n' "$*" >> "${argsPath}"
if [ "$1" = image ]; then printf '${fakeDigest}\\n'; exit 0; fi
printf 'verified\\n'
printf '\\n__AOB_VERIFY_META__{"exit":0,"duration_ms":3.5}\\n'
exit 0
`);
    await chmod(docker, 0o755);
    const workspace = join(dir, "workspace");
    await mkdir(workspace);
    const verifier = join(dir, "verify.sh");
    await writeFile(verifier, "#!/bin/sh\nexit 0\n", { mode: 0o755 });
    const out = join(dir, "out");
    const originalPath = process.env.PATH;
    process.env.PATH = `${binDir}:${originalPath ?? "/usr/bin:/bin"}`;
    try {
      let verificationStarted = 0;
      let containerStarted = "";
      const result = await runDockerVerification({
        image: "aob-mock:s2", imageDigest: fakeDigest, workspaceDir: workspace, verificationFile: verifier,
        logPath: join(out, "verify.log"), timeoutS: 30,
        onVerificationStart: () => { verificationStarted += 1; },
        onContainerStart: (name) => { containerStarted = name; },
      });
      const args = await readFile(argsPath, "utf8").catch(() => "");
      expect(args).toContain("--network none");
      expect(args).toContain("--pull=never");
      expect(args).toContain("--tmpfs /tmp:rw,noexec,nosuid,nodev,size=256m");
      expect(args).toContain("--cap-drop=ALL");
      expect(args).toContain("--security-opt no-new-privileges");
      expect(args).toContain("dst=/work/workspace,readonly=false");
      expect(args).toContain("--read-only");
      expect((args.match(/--mount/g) ?? []).length).toBe(2);
      expect(args).not.toContain("dst=/out");
      expect(result).toEqual({ exitCode: 0, duration_ms: 3.5 });
      expect(verificationStarted).toBe(1);
      expect(containerStarted).toMatch(/^aob-verify-[0-9]+-[0-9]+$/);
      expect(await readFile(join(out, "verify.log"), "utf8")).toBe("verified\n");
    } finally {
      process.env.PATH = originalPath;
    }
  });

  it("runs a native verifier command without a shell or verifier-file mount", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-docker-native-verify-"));
    const binDir = join(dir, "bin");
    await mkdir(binDir);
    const argsPath = join(dir, "docker-args");
    const docker = join(binDir, "docker");
    await writeFile(docker, `#!/bin/sh
printf '%s\\n' "$*" >> "${argsPath}"
if [ "$1" = image ]; then printf '${fakeDigest}\\n'; exit 0; fi
printf 'native-verified\\n'
exit 0
`);
    await chmod(docker, 0o755);
    const workspace = join(dir, "workspace");
    await mkdir(workspace);
    const out = join(dir, "out");
    const originalPath = process.env.PATH;
    process.env.PATH = `${binDir}:${originalPath ?? "/usr/bin:/bin"}`;
    try {
      const result = await runDockerVerification({
        image: "aob-native-verifier:s2", imageDigest: fakeDigest, workspaceDir: workspace,
        command: ["npm", "test", "--", "unit"], workdir: "packages/core", network: "none",
        logPath: join(out, "verify.log"), timeoutS: 30,
      });
      const args = await readFile(argsPath, "utf8");
      expect(args).toContain("--network none");
      expect(args).toContain("--pull=never");
      expect(args).toContain("--tmpfs /tmp:rw,noexec,nosuid,nodev,size=256m");
      expect(args).toContain("dst=/work/workspace,readonly=false");
      expect(args).toContain("--read-only");
      expect(args.split("\\n")[0]).toContain("image inspect");
      expect(args).toContain(` ${fakeDigest} `);
      expect(args).not.toContain(`aob-native-verifier:s2@${fakeDigest}`);
      expect(args).toContain("npm");
      expect(args).toContain("packages/core");
      expect(args).not.toContain("spawnSync");
      expect(args).toContain("--entrypoint npm");
      expect(args).not.toContain("sh -c");
      expect(args).not.toContain("/work/verify.sh");
      expect((args.match(/--mount/g) ?? []).length).toBe(1);
      expect(result.exitCode).toBe(0);
      expect(result.duration_ms).toBeGreaterThanOrEqual(0);
      expect(await readFile(join(out, "verify.log"), "utf8")).toBe("native-verified\n");
    } finally {
      process.env.PATH = originalPath;
    }
  });

  it("does not let a success marker override Docker's nonzero exit", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-docker-marker-"));
    const binDir = join(dir, "bin");
    await mkdir(binDir);
    const docker = join(binDir, "docker");
    await writeFile(docker, `#!/bin/sh
if [ "$1" = image ]; then printf '${fakeDigest}\\n'; exit 0; fi
printf '\\n__AOB_VERIFY_META__{"exit":0,"duration_ms":2}\\n'
exit 7
`);
    await chmod(docker, 0o755);
    const workspace = join(dir, "workspace");
    await mkdir(workspace);
    const verifier = join(dir, "verify.sh");
    await writeFile(verifier, "#!/bin/sh\nexit 0\n", { mode: 0o755 });
    const originalPath = process.env.PATH;
    process.env.PATH = `${binDir}:${originalPath ?? "/usr/bin:/bin"}`;
    try {
      const result = await runDockerVerification({
        image: "aob-mock:s2", imageDigest: fakeDigest, workspaceDir: workspace, verificationFile: verifier,
        logPath: join(dir, "verify.log"), timeoutS: 30,
      });
      expect(result.exitCode).toBe(7);
    } finally {
      process.env.PATH = originalPath;
    }
  });

  it("rejects a verifier image whose local identity differs before starting it", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-docker-verify-digest-"));
    const binDir = join(dir, "bin");
    await mkdir(binDir);
    const argsPath = join(dir, "docker-args");
    const docker = join(binDir, "docker");
    await writeFile(docker, `#!/bin/sh
printf '%s\\n' "$*" >> "${argsPath}"
if [ "$1" = image ]; then printf 'sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\\n'; exit 0; fi
printf 'should-not-run\\n'
exit 0
`);
    await chmod(docker, 0o755);
    const workspace = join(dir, "workspace");
    await mkdir(workspace);
    const originalPath = process.env.PATH;
    process.env.PATH = `${binDir}:${originalPath ?? "/usr/bin:/bin"}`;
    try {
      await expect(runDockerVerification({
        image: "aob-native-verifier:s2", imageDigest: fakeDigest, workspaceDir: workspace,
        command: ["npm", "test"], network: "none", logPath: join(dir, "verify.log"), timeoutS: 30,
      })).rejects.toThrow(/Docker verifier image identity drift/);
      const args = await readFile(argsPath, "utf8");
      expect(args).toContain("image inspect");
      expect(args).not.toContain("--entrypoint npm");
    } finally {
      process.env.PATH = originalPath;
    }
  });

  it("rejects a symlink at the final setup-file path", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-docker-setup-link-"));
    const binDir = join(dir, "bin");
    await mkdir(binDir);
    const docker = join(binDir, "docker");
    await writeFile(docker, "#!/bin/sh\nexit 1\n");
    await chmod(docker, 0o755);
    const workspace = join(dir, "workspace");
    await mkdir(workspace);
    const outside = join(dir, "outside");
    await writeFile(outside, "must remain unchanged\n");
    await symlink(outside, join(workspace, "setup-link"));
    const originalPath = process.env.PATH;
    process.env.PATH = `${binDir}:${originalPath ?? "/usr/bin:/bin"}`;
    try {
      await expect(runDockerCommand({
        image: "aob-mock:s2", argv: ["echo", "http://aob-relay:8080/v1"], env: {}, workdir: workspace,
        setupFiles: [{ path: join(workspace, "setup-link"), contents: "must not overwrite\n" }],
      }, describeDockerProxyRoute("http://host.docker.internal:1234", "aob-123-456"), join(dir, "out"))).rejects.toBeInstanceOf(ConfigError);
      expect(await readFile(outside, "utf8")).toBe("must remain unchanged\n");
    } finally {
      process.env.PATH = originalPath;
    }
  });

  it("rejects a hard link at the final setup-file path", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-docker-setup-hard-link-"));
    const binDir = join(dir, "bin");
    await mkdir(binDir);
    const docker = join(binDir, "docker");
    await writeFile(docker, "#!/bin/sh\nexit 1\n");
    await chmod(docker, 0o755);
    const workspace = join(dir, "workspace");
    await mkdir(workspace);
    const outside = join(dir, "outside");
    await writeFile(outside, "must remain unchanged\n");
    await link(outside, join(workspace, "setup-link"));
    const originalPath = process.env.PATH;
    process.env.PATH = `${binDir}:${originalPath ?? "/usr/bin:/bin"}`;
    try {
      await expect(runDockerCommand({
        image: "aob-mock:s2", argv: ["echo", "http://aob-relay:8080/v1"], env: {}, workdir: workspace,
        setupFiles: [{ path: join(workspace, "setup-link"), contents: "must not overwrite\n" }],
      }, describeDockerProxyRoute("http://host.docker.internal:1234", "aob-123-456"), join(dir, "out"))).rejects.toBeInstanceOf(ConfigError);
      expect(await readFile(outside, "utf8")).toBe("must remain unchanged\n");
    } finally {
      process.env.PATH = originalPath;
    }
  });

  it("waits for Docker container cleanup after a timeout", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-docker-timeout-"));
    const binDir = join(dir, "bin");
    await mkdir(binDir);
    const marker = join(dir, "cleanup-marker");
    const docker = join(binDir, "docker");
    await writeFile(docker, `#!/bin/sh
if [ "$1" = image ]; then printf '${fakeDigest}\\n'; exit 0; fi
if [ "$1" = network ] && [ "$2" = create ]; then printf 'network-id\\n'; exit 0; fi
if [ "$1" = network ] && [ "$2" = connect ]; then exit 0; fi
if [ "$1" = network ] && [ "$2" = rm ]; then exit 0; fi
if [ "$1" = exec ]; then exit 0; fi
if [ "$1" = run ] && printf '%s' "$*" | grep -q -- ' -d '; then printf 'relay-id\\n'; exit 0; fi
if [ "$1" = rm ]; then printf 'cleaned\\n' > "${marker}"; exit 0; fi
trap 'exit 124' TERM
while :; do :; done
`);
    await chmod(docker, 0o755);
    const workspace = join(dir, "workspace");
    await mkdir(workspace);
    const originalPath = process.env.PATH;
    process.env.PATH = `${binDir}:${originalPath ?? "/usr/bin:/bin"}`;
    try {
      const result = await runDockerCommand({
        image: "aob-mock:s2", argv: ["echo", "http://aob-relay:8080/v1"], env: {}, workdir: workspace,
      }, describeDockerProxyRoute("http://host.docker.internal:1234", "aob-123-456"), join(dir, "out"), 0.05);
      expect(result.exitCode).toBe(124);
      expect(await readFile(marker, "utf8")).toBe("cleaned\n");
    } finally {
      process.env.PATH = originalPath;
    }
  });

  it("returns a Docker timeout even when a killed client leaves output pipes open", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-docker-pipe-timeout-"));
    const binDir = join(dir, "bin");
    await mkdir(binDir);
    const docker = join(binDir, "docker");
    await writeFile(docker, `#!/bin/sh
if [ "$1" = image ]; then printf '${fakeDigest}\\n'; exit 0; fi
if [ "$1" = network ] && [ "$2" = create ]; then exit 0; fi
if [ "$1" = network ] && [ "$2" = connect ]; then exit 0; fi
if [ "$1" = network ] && [ "$2" = rm ]; then exit 0; fi
if [ "$1" = exec ]; then exit 0; fi
if [ "$1" = rm ]; then exit 0; fi
if [ "$1" = run ] && printf '%s' "$*" | grep -q -- ' -d '; then exit 0; fi
if [ "$1" = run ]; then (sleep 5) & while :; do :; done; fi
exit 0
`);
    await chmod(docker, 0o755);
    const workspace = join(dir, "workspace");
    await mkdir(workspace);
    const originalPath = process.env.PATH;
    process.env.PATH = `${binDir}:${originalPath ?? "/usr/bin:/bin"}`;
    try {
      const started = performance.now();
      const result = await runDockerCommand({
        image: "aob-mock:s2", argv: ["echo", "http://aob-relay:8080/v1"], env: {}, workdir: workspace,
      }, describeDockerProxyRoute("http://host.docker.internal:1234", "aob-123-456"), join(dir, "out"), 0.05);
      expect(result.exitCode).toBe(124);
      expect(performance.now() - started).toBeLessThan(2_000);
    } finally {
      process.env.PATH = originalPath;
    }
  });

  it("reports a missing Docker executable as configuration error", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-docker-missing-"));
    const binDir = join(dir, "bin");
    await mkdir(binDir);
    const workspace = join(dir, "workspace");
    await mkdir(workspace);
    const originalPath = process.env.PATH;
    process.env.PATH = binDir;
    try {
      await expect(runDockerCommand({
        image: "aob-mock:s2", argv: ["echo", "http://aob-relay:8080/v1"], env: {}, workdir: workspace,
      }, describeDockerProxyRoute("http://host.docker.internal:1234", "aob-123-456"), join(dir, "out"))).rejects.toBeInstanceOf(ConfigError);
    } finally {
      process.env.PATH = originalPath;
    }
  });

  it("cleans only validated runner-owned container names", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-docker-cleanup-"));
    const binDir = join(dir, "bin");
    await mkdir(binDir);
    const marker = join(dir, "cleanup-marker");
    const docker = join(binDir, "docker");
    await writeFile(docker, `#!/bin/sh
if [ "$1" = rm ] && [ "$2" = -f ] && { [ "$3" = aob-123-456 ] || [ "$3" = aob-verify-123-456 ]; }; then printf 'cleaned\\n' > "${marker}"; exit 0; fi
printf 'unexpected\\n' >&2
exit 1
`);
    await chmod(docker, 0o755);
    const originalPath = process.env.PATH;
    process.env.PATH = `${binDir}:${originalPath ?? "/usr/bin:/bin"}`;
    try {
      await cleanupDockerContainer("aob-123-456");
      expect(await readFile(marker, "utf8")).toBe("cleaned\n");
      await cleanupDockerContainer("aob-verify-123-456");
      await expect(cleanupDockerContainer("not-runner-owned")).rejects.toBeInstanceOf(ConfigError);
      await expect(cleanupDockerResources({ relayName: "aob-relay-not-runner" })).rejects.toBeInstanceOf(ConfigError);
      await expect(cleanupDockerResources({ networkName: "aob-net-not-runner" })).rejects.toBeInstanceOf(ConfigError);
    } finally {
      process.env.PATH = originalPath;
    }
  });
});

describe("host cell", () => {
  it("allows verification after a failed provider attempt is recovered", () => {
    expect(shouldSkipVerification({
      exitCode: 0, timedOut: false, measuredEventCount: 1, statusFailure: true,
      modelMismatch: null, missingProxyEvidence: false,
    })).toBe(false);
    expect(shouldSkipVerification({
      exitCode: 0, timedOut: false, measuredEventCount: 0, statusFailure: true,
      modelMismatch: null, missingProxyEvidence: false,
    })).toBe(true);
  });

  it("produces schema-valid run.json without derived metrics", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-cell-"));
    const taskDir = join(dir, "task");
    await mkdir(join(taskDir, "workspace"), { recursive: true });
    await writeFile(join(taskDir, "prompt.md"), "solve");
    await writeFile(
      join(taskDir, "verify.sh"),
      "#!/bin/sh\ntest -f \"$(dirname \"$0\")/workspace/SOLVED\" && test -f \"$(dirname \"$0\")/verification-started\"\n",
      { mode: 0o755 },
    );
    const mock = await startMockUpstream({ delayMs: 0, streamed: false, includeUsage: true, status: 200 });
    try {
      const run = await runHostCell({
        dir: join(dir, "out"),
        taskDir,
        upstream: mock.baseUrl,
        run_id: "cell-1",
        tool: "mock-agent",
        task_id: "echo",
        model: "mock",
        price_book: "openrouter-2026-08-27",
        condition: "default",
        rep: 2,
        task_source: "local-development",
        task_repository: "https://github.com/example/source.git",
        task_revision: "working-tree",
        task_regime: "short",
        priceRates: { input: 0.001, cached_input: 0.0001, output: 0.002 },
        onVerificationStart: () => writeFileSync(join(dir, "out", "verification-started"), "1\n"),
      });
      expect(run.outcome).toBe("completed");
      expect(run.condition).toBe("default");
      expect(run.rep).toBe(2);
      expect(run.task_source).toBe("local-development");
      expect(run.task_repository).toBe("https://github.com/example/source.git");
      expect(run.spend_usd_estimate).toBeNull();
      expect(run.verification.duration_ms).toBeGreaterThan(0);
      expect(await readFile(join(dir, "out", "verify.log"), "utf8")).toBe("");
      expect(run.adapter_result.artifacts.stdoutPath).toBe(join(dir, "out", "stdout.log"));
      expect(run.adapter_result.artifacts.stderrPath).toBe(join(dir, "out", "stderr.log"));
      expect(await readFile(join(dir, "out", "stdout.log"), "utf8")).toBeDefined();
      expect(await readFile(join(dir, "out", "verify.sh"), "utf8")).toContain("SOLVED");
      await expect(access(join(dir, "out", "workspace", "verify.sh"))).rejects.toThrow();
      validateC4Run(run);
      expect("harness_time" in run).toBe(false);
    } finally {
      await mock.close();
    }
  });

  it("records upstream HTTP failure as adapter_error even if the verifier passes", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-500-"));
    const taskDir = join(dir, "task");
    await mkdir(join(taskDir, "workspace"), { recursive: true });
    await writeFile(join(taskDir, "prompt.md"), "solve");
    await writeFile(join(taskDir, "verify.sh"), "#!/bin/sh\ntest -f \"$(dirname \"$0\")/workspace/SOLVED\"\n", { mode: 0o755 });
    const mock = await startMockUpstream({ status: 500, streamed: false, includeUsage: false });
    try {
      const run = await runHostCell({
        dir: join(dir, "out"), taskDir, upstream: mock.baseUrl, run_id: "cell-500",
        tool: "mock-agent", task_id: "echo", model: "mock", price_book: "openrouter-2026-08-27",
        task_source: "local-development", task_revision: "working-tree", task_regime: "short",
      });
      expect(run.outcome).toBe("adapter_error");
      expect(await readFile(join(dir, "out", "verify.log"), "utf8")).toBe("");
      validateC4Run(run);
    } finally {
      await mock.close();
    }
  });

  it("marks a pinned run as adapter_error when the upstream served a different model", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-model-mismatch-"));
    const taskDir = join(dir, "task");
    await mkdir(join(taskDir, "workspace"), { recursive: true });
    await writeFile(join(taskDir, "prompt.md"), "solve");
    await writeFile(join(taskDir, "verify.sh"), "#!/bin/sh\ntest -f \"$(dirname \"$0\")/workspace/SOLVED\"\n", { mode: 0o755 });
    const mock = await startMockUpstream({ servedModel: "provider/other-model" });
    try {
      const run = await runHostCell({
        dir: join(dir, "out"), taskDir, upstream: mock.baseUrl, run_id: "cell-model-mismatch",
        tool: "mock-agent", task_id: "echo", model: "openai/gpt-4.1-mini", price_book: "mock",
        task_source: "local-development", task_revision: "working-tree", task_regime: "short",
      });
      expect(run.outcome).toBe("adapter_error");
      expect(run.verification.exit).toBe(1);
      validateC4Run(run);
    } finally {
      await mock.close();
    }
  });

  it("rejects a successful pinned process that produced no proxy evidence", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-no-proxy-"));
    const taskDir = join(dir, "task");
    await mkdir(join(taskDir, "workspace"), { recursive: true });
    await writeFile(join(taskDir, "prompt.md"), "solve");
    await writeFile(join(taskDir, "verify.sh"), "#!/bin/sh\nexit 0\n", { mode: 0o755 });
    const silent = join(dir, "silent-claude.sh");
    await writeFile(silent, "#!/bin/sh\nif [ \"$1\" = \"--version\" ]; then echo '2.1.246 (Claude Code)'; fi\nexit 0\n", { mode: 0o755 });
    const oldBin = process.env.AOB_CLAUDE_BIN;
    process.env.AOB_CLAUDE_BIN = silent;
    const mock = await startMockUpstream();
    try {
      const run = await runHostCell({
        dir: join(dir, "out"), taskDir, upstream: mock.baseUrl, run_id: "cell-no-proxy",
        tool: "claude-code", task_id: "echo", model: "openai/gpt-4.1-mini", price_book: "mock",
        task_source: "local-development", task_revision: "working-tree", task_regime: "short",
      });
      expect(run.outcome).toBe("adapter_error");
    } finally {
      if (oldBin === undefined) delete process.env.AOB_CLAUDE_BIN;
      else process.env.AOB_CLAUDE_BIN = oldBin;
      await mock.close();
    }
  });
});

describe("versionOutputLines", () => {
  it("accepts a version banner written to stderr", () => {
    // pi --version writes to stderr and nothing to stdout, which the probe
    // reported as "empty output" and failed as version drift.
    expect(versionOutputLines(Buffer.from(""), Buffer.from("0.73.1\n"))).toEqual(["0.73.1"]);
  });

  it("prefers stdout so a tool printing to both stays pinned by its primary stream", () => {
    expect(versionOutputLines(Buffer.from("1.2.3\n"), Buffer.from("warning: update available\n")))
      .toEqual(["1.2.3", "warning: update available"]);
  });

  it("drops blank lines and trims whitespace from both streams", () => {
    expect(versionOutputLines(Buffer.from("  \n 1.0.0 \n\n"), Buffer.from("\n  2.0.0\n")))
      .toEqual(["1.0.0", "2.0.0"]);
  });
});

describe("image digest retry", () => {
  it("recovers from a transient inspect failure and still fails on a real one", async () => {
    // inspectImage runs before every cell, so one daemon hiccup aborted an
    // entire multi-hour matrix. Observed twice, both times on the first cell.
    const dir = await mkdtemp(join(tmpdir(), "aob-inspect-retry-"));
    const binDir = join(dir, "bin");
    await mkdir(binDir);
    await mkdir(join(dir, "workspace"));
    const counter = join(dir, "attempts");
    const docker = join(binDir, "docker");
    // Fail the first inspect, succeed afterwards; anything else is refused so
    // the test cannot pass by accident.
    await writeFile(docker, `#!/bin/sh
if [ "$1" = image ] && [ "$2" = inspect ]; then
  printf 'x' >> "${counter}"
  n=$(wc -c < "${counter}" | tr -d ' ')
  if [ "$n" -le 1 ]; then echo "daemon hiccup" >&2; exit 1; fi
  echo "sha256:${"a".repeat(64)}"
  exit 0
fi
if [ "$1" = rm ] || [ "$1" = network ]; then exit 0; fi
exit 1
`);
    await chmod(docker, 0o755);
    const originalPath = process.env.PATH;
    process.env.PATH = `${binDir}:${originalPath ?? "/usr/bin:/bin"}`;
    try {
      const route = describeDockerProxyRoute("http://host.docker.internal:1234", "aob-901-1");
      // A transient failure is absorbed: this gets past the digest lookup and
      // fails later, on the run itself, rather than at inspection.
      const recovered = await runDockerCommand({
        image: "aob-base:s2", argv: ["echo", `${route.clientUrl}/v1`], env: {}, workdir: join(dir, "workspace"),
      }, route, join(dir, "out")).then(() => "ran", (error: Error) => error.message);
      expect(recovered).not.toMatch(/cannot inspect Docker image/);
      expect((await readFile(counter, "utf8")).length).toBeGreaterThan(1);
    } finally {
      process.env.PATH = originalPath;
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("gives up after the bounded number of attempts", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-inspect-fail-"));
    const binDir = join(dir, "bin");
    await mkdir(binDir);
    await mkdir(join(dir, "workspace"));
    const counter = join(dir, "attempts");
    const docker = join(binDir, "docker");
    await writeFile(docker, `#!/bin/sh
if [ "$1" = image ] && [ "$2" = inspect ]; then printf 'x' >> "${counter}"; echo "no such image" >&2; exit 1; fi
if [ "$1" = rm ] || [ "$1" = network ]; then exit 0; fi
exit 1
`);
    await chmod(docker, 0o755);
    const originalPath = process.env.PATH;
    process.env.PATH = `${binDir}:${originalPath ?? "/usr/bin:/bin"}`;
    try {
      const route = describeDockerProxyRoute("http://host.docker.internal:1234", "aob-902-2");
      const message = await runDockerCommand({
        image: "aob-missing:s2", argv: ["echo", `${route.clientUrl}/v1`], env: {}, workdir: join(dir, "workspace"),
      }, route, join(dir, "out")).then(() => "ran", (error: Error) => error.message);
      // The relay image is resolved first, so that is the one that reports.
      expect(message).toMatch(/cannot inspect Docker image/);
      // The underlying daemon message is surfaced, not swallowed.
      expect(message).toMatch(/no such image/);
      expect((await readFile(counter, "utf8")).length).toBe(IMAGE_INSPECT_ATTEMPTS);
    } finally {
      process.env.PATH = originalPath;
      await rm(dir, { recursive: true, force: true });
    }
  });
});
