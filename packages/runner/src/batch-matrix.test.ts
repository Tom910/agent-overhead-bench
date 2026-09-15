import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import type { C4Run } from "@aob/contracts";
import { runMatrix, type MatrixOptions } from "./matrix.js";
import { hasIncompleteCells, loadState } from "./state.js";

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "aob-batch-matrix-"));
  roots.push(root);
  let monotonic = 0;
  const anchor = { wall_clock_iso: "2026-09-05T10:00:00.000Z", monotonic_zero: 0 };
  const calls: string[] = [];
  const options: MatrixOptions = {
    resultsDir: join(root, "results"), statePath: join(root, "state.json"),
    tasks: ["t1", "t2"].map((id) => ({ id, dir: root, source: "local-development", revision: "working-tree", regime: "short", timeoutS: 60 })),
    tools: ["a", "b"], conditions: ["pinned"], reps: 2, model: "mock", priceBook: "mock",
    capUsd: 1, estimateCellUsd: () => 0.1,
    executionProtocol: "tool-batches-v1", batchTool: "a", batchCapUsd: 0.5,
    runWindow: { path: join(root, "provenance/run-window-ledger.json"), sessionId: "campaign-test",
      host: { os: "test", cpu: "test", ram_gb: 1, docker: "test", image_digests: [] },
      now: () => ({ ...anchor, now_ms: monotonic += 10 }) },
    executeCell: async (cell, task, dir) => {
      calls.push(cell.id);
      const run: C4Run = {
        v: 1, run_id: cell.id, tool: cell.tool, tool_version: "mock", task_id: task.id,
        task_source: "local-development", task_revision: "working-tree", task_regime: "short",
        condition: cell.condition, rep: cell.rep, model: "mock", ori_version: null, tool_visibility: "none",
        anchors: { adapter: anchor, proxy: anchor },
        adapter_result: { exitCode: 0, tStart: monotonic + 1, tEnd: monotonic + 2, anchor,
          artifacts: { stdoutPath: "stdout.log", stderrPath: "stderr.log" } },
        events_file: "events.jsonl", verification: { exit: 0, duration_ms: 1, logPath: "verify.log" },
        container: { image_digest: "mock", verifier_image_digest: "mock", started_iso: anchor.wall_clock_iso },
        task_environment: { kind: "runner-default", network: "disabled" },
        host: { os: "test", cpu: "test", ram_gb: 1 }, spend_usd_estimate: 0.1, price_book: "mock", outcome: "completed",
      };
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, "run.json"), JSON.stringify(run));
      return run;
    },
  };
  return { root, options, calls };
}

function nativeFixture() {
  const f = fixture();
  const { options } = f;
    options.tasks = options.tasks.map((task) => ({ ...task, source: "public-task-pack", sourceRepository: "https://github.com/datacurve-ai/deep-swe.git" }));
    options.priceRates = { input: 0.1, cached_input: 0, output: 0 };
    const execute = options.executeCell!;
    options.executeCell = async (...args) => {
      const run = await execute(...args);
      const failed: C4Run = { ...run, task_source: "public-task-pack", task_repository: "https://github.com/datacurve-ai/deep-swe.git", outcome: "verify_error", verification: { ...run.verification, exit: 1 } };
      writeFileSync(join(args[2], "run.json"), JSON.stringify(failed));
      writeFileSync(join(args[2], "verify.log"), '[verifier] reward.json={"reward":0,"f2p_total":2,"f2p_passed":1,"p2p_total":1,"p2p_passed":1,"f2p":0.5,"p2p":1,"partial":0.6666666666666666}\n');
      writeFileSync(join(args[2], "events.jsonl"), JSON.stringify({ v: 1, run_id: run.run_id, seq: 0, method: "POST", path: "/v1/chat/completions", protocol: "openai_chat", model_requested: "mock", model_served: "mock", status: 200, streamed: false, error: null, usage: { input: 1, cached_input: 0, output: 0, reasoning_output: 0 }, usage_source: "response_body", t_req_start: 1, t_req_body_end: 2, t_upstream_sent: 2, t_first_byte: 3, t_last_byte: 4, duration_ms: 3 }) + "\n");
      return failed;
    };
  return f;
}

describe("tool-by-tool campaign", () => {
  it("runs one tool, stops, and combines later invocations without repeating completed cells", async () => {
    const { options, calls } = fixture();
    const first = await runMatrix(options);
    expect(first.cells).toHaveLength(8);
    expect(first.cells.filter((cell) => cell.status === "done")).toHaveLength(4);
    expect(calls.every((id) => id.startsWith("pinned:a:"))).toBe(true);
    const ledgerBefore = readFileSync(options.runWindow!.path, "utf8");
    await runMatrix(options);
    expect(calls).toHaveLength(4);
    expect(readFileSync(options.runWindow!.path, "utf8")).toBe(ledgerBefore);
    const second = await runMatrix({ ...options, batchTool: "b" });
    expect(second.cells.every((cell) => cell.status === "done")).toBe(true);
    expect(second.spentUsd).toBeCloseTo(0.8);
    expect(calls).toHaveLength(8);
    const ledger = JSON.parse(readFileSync(options.runWindow!.path, "utf8"));
    expect(ledger.execution_protocol).toBe("tool-batches-v1");
    expect(ledger.segments.map((segment: { batch_tool: string }) => segment.batch_tool)).toEqual(["a", "b"]);
  });

  it("preserves tool spend across pauses and refuses starting a different tool mid-batch", async () => {
    const { options, calls } = fixture();
    await expect(runMatrix({ ...options, batchCapUsd: 0.25 })).rejects.toThrow(/budget|cap/i);
    expect(calls).toHaveLength(2);
    await expect(runMatrix({ ...options, batchTool: "b" })).rejects.toThrow(/finish|incomplete|batch/i);
    await expect(runMatrix({ ...options, batchCapUsd: 0.25 })).rejects.toThrow(/budget|cap/i);
    expect(calls).toHaveLength(2);
    await runMatrix(options);
    expect(calls).toHaveLength(4);
    expect(loadState(options.statePath).spentUsd).toBeCloseTo(0.4);
  });

  it("keeps the campaign cap across tool switches and rejects changing it", async () => {
    const { options, calls } = fixture();
    const bounded = { ...options, capUsd: 0.55 };
    await runMatrix(bounded);
    await expect(runMatrix({ ...bounded, batchTool: "b", capUsd: 1 })).rejects.toThrow(/definition|cap|matrix/i);
    await expect(runMatrix({ ...bounded, batchTool: "b" })).rejects.toThrow(/budget|cap/i);
    expect(calls).toHaveLength(5);
    expect(loadState(options.statePath).spentUsd).toBeCloseTo(0.5);
  });

  it("reserves verified validation spend within the campaign cap", async () => {
    const { options, calls } = fixture();
    const bounded = { ...options, capUsd: 0.55, validationSpendUsd: 0.1 };
    await runMatrix(bounded);
    await expect(runMatrix({ ...bounded, batchTool: "b" })).rejects.toThrow(/budget|cap/i);
    expect(calls).toHaveLength(4);
    expect(loadState(options.statePath).spentUsd).toBeCloseTo(0.4);
    await expect(runMatrix({ ...bounded, batchTool: "b", validationSpendUsd: 0 })).rejects.toThrow(/definition|matrix/i);
  });

  it("stops validation at the first failed cell without retry or losing spend", async () => {
    const { options, calls } = fixture();
    const state = await runMatrix({ ...options, stopOnFailure: true, executeCell: async (...args) => {
      const run = await options.executeCell!(...args);
      const failed: C4Run = { ...run, outcome: "verify_error", verification: { ...run.verification, exit: 1 } };
      writeFileSync(join(args[2], "run.json"), JSON.stringify(failed));
      return failed;
    } });
    expect(calls).toHaveLength(1);
    expect(state.spentUsd).toBe(0.1);
    expect(state.cells.filter((cell) => cell.status === "failed")).toHaveLength(1);
    expect(state.cells.every((cell) => cell.retries === 0)).toBe(true);
  });

  it("retains completed native task failures and continues without retrying", async () => {
    const { options, calls } = nativeFixture();
    const state = await runMatrix({ ...options, stopOnFailure: true });
    expect(calls).toHaveLength(4);
    expect(state.cells.filter((cell) => String(cell.status) === "task_failed")).toHaveLength(4);
    expect(state.cells.every((cell) => cell.retries === 0)).toBe(true);
    expect(state.spentUsd).toBeCloseTo(0.4);
    await runMatrix(options);
    expect(calls).toHaveLength(4);
  });

  it.each(["failed", "running", "verifying", "staged"])("reconciles a retained native failure from %s exactly once", async (status) => {
    const { options, calls } = nativeFixture();
    delete options.executionProtocol; delete options.batchTool; delete options.batchCapUsd; delete options.runWindow;
    options.tools = ["a"]; options.reps = 1;
    await runMatrix(options);
    const original = loadState(options.statePath);
    const path = join(options.resultsDir, "pinned/a/t1/rep-0/run.json");
    const before = readFileSync(path, "utf8");
    const retained = { ...original, spentUsd: status === "failed" ? 0.2 : 0.1,
      cells: original.cells.map((cell, i) => i === 0 ? { ...cell, status } : cell) };
    writeFileSync(options.statePath, JSON.stringify(retained));
    const recovered = await runMatrix({ ...options, stopOnFailure: true });
    expect(calls).toHaveLength(2);
    expect(recovered.spentUsd).toBeCloseTo(0.2);
    expect(recovered.cells.every((cell) => String(cell.status) === "task_failed")).toBe(true);
    expect(readFileSync(path, "utf8")).toBe(before);
  });

  it.each(["missing-footer", "inconsistent-counts", "provider-error", "missing-usage", "wrong-model", "wrong-spend", "wrong-exit", "foreign-events"])("does not continue on %s", async (defect) => {
    const { options, calls } = nativeFixture();
    const execute = options.executeCell!;
    options.executeCell = async (...args) => {
      const run = await execute(...args);
      const eventPath = join(args[2], "events.jsonl");
      const event = JSON.parse(readFileSync(eventPath, "utf8"));
      if (defect === "provider-error") event.status = 500;
      if (defect === "missing-usage") event.usage = null;
      if (defect === "wrong-model") event.model_served = "different";
      if (defect === "foreign-events") event.run_id = "foreign";
      if (defect === "wrong-spend") run.spend_usd_estimate = 0.05;
      if (defect === "wrong-exit") run.verification.exit = 128;
      if (defect === "missing-footer") writeFileSync(join(args[2], "verify.log"), "grader crashed\n");
      if (defect === "inconsistent-counts") writeFileSync(join(args[2], "verify.log"), '[verifier] reward.json={"reward":0,"f2p_total":2,"f2p_passed":3,"p2p_total":1,"p2p_passed":1}\n');
      writeFileSync(eventPath, JSON.stringify(event) + "\n");
      writeFileSync(join(args[2], "run.json"), JSON.stringify(run));
      return run;
    };
    const state = await runMatrix({ ...options, stopOnFailure: true });
    expect(calls).toHaveLength(1);
    expect(state.cells[0]!.status).toBe("failed");
  });

  it("CLI completion accepts measured failures and ignores pending later tools", async () => {
    const { options } = nativeFixture();
    const state = await runMatrix({ ...options, stopOnFailure: true });
    expect(hasIncompleteCells(state, "a")).toBe(false);
    expect(hasIncompleteCells(state)).toBe(true);
    expect(hasIncompleteCells({ ...state, cells: state.cells.map((cell, i) => i === 0 ? { ...cell, status: "quarantined" as const } : cell) }, "a")).toBe(true);
  });

  it("rejects concurrent campaign writers before either can run another tool", async () => {
    const { options, calls } = fixture();
    let release!: () => void;
    let entered!: () => void;
    const waiting = new Promise<void>((resolve) => { release = resolve; });
    const started = new Promise<void>((resolve) => { entered = resolve; });
    const first = runMatrix({ ...options, executeCell: async (...args) => { entered(); await waiting; return options.executeCell!(...args); } });
    await started;
    try { await expect(runMatrix({ ...options, batchTool: "b" })).rejects.toThrow(/lock|already running/i); }
    finally { release(); await first; }
    expect(calls).toHaveLength(4);
    expect(existsSync(`${options.statePath}.lock`)).toBe(false);
  });

  it("rejects changed spend or result bytes before a resumed batch can overwrite checkpoint bindings", async () => {
    for (const tamper of ["state", "result"] as const) {
      const { options, calls } = fixture();
      await runMatrix({ ...options, capUsd: 0.6 });
      const ledger = readFileSync(options.runWindow!.path, "utf8");
      if (tamper === "state") {
        const state = loadState(options.statePath);
        writeFileSync(options.statePath, JSON.stringify({ ...state, spentUsd: 0 }));
      } else {
        const path = join(options.resultsDir, "pinned/a/t1/rep-0/run.json");
        const run = JSON.parse(readFileSync(path, "utf8"));
        writeFileSync(path, JSON.stringify({ ...run, spend_usd_estimate: 0 }));
      }
      await expect(runMatrix({ ...options, capUsd: 0.6, batchTool: "b" })).rejects.toThrow(/checkpoint|binding/i);
      await expect(runMatrix({ ...options, capUsd: 0.6 })).rejects.toThrow(/checkpoint|binding/i);
      expect(calls).toHaveLength(4);
      expect(readFileSync(options.runWindow!.path, "utf8")).toBe(ledger);
    }
  });

  it("refuses orphaned results when campaign state and ledger were removed", async () => {
    const { options, calls } = fixture();
    await runMatrix(options);
    const path = join(options.resultsDir, "pinned/a/t1/rep-0/run.json");
    const retained = readFileSync(path, "utf8");
    rmSync(options.statePath);
    rmSync(options.runWindow!.path);
    await expect(runMatrix(options)).rejects.toThrow(/checkpoint|prior evidence/i);
    expect(calls).toHaveLength(4);
    expect(readFileSync(path, "utf8")).toBe(retained);
  });

  it("requires an explicit selected tool, tool budget and ledger before creating state", async () => {
    const { options } = fixture();
    const { runWindow: _window, ...withoutWindow } = options;
    const { capUsd: _cap, ...withoutCap } = options;
    for (const invalid of [
      { ...options, batchTool: "other" }, { ...options, batchCapUsd: 0 }, withoutWindow, withoutCap,
    ]) {
      await expect(runMatrix(invalid)).rejects.toThrow(/batch|tool|cap|ledger/i);
      expect(existsSync(options.statePath)).toBe(false);
    }
  });
});
