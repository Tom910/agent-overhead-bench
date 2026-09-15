import { describe, expect, it } from "vitest";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import {
  assertOfficialRunWindow,
  assertOfficialRunWindowsDoNotOverlap,
  assertRetryEvidenceCoverage,
  createRunWindowLedger,
  RunWindowWriter,
  validateRunWindowLedger,
  type RunWindowLedger,
} from "./window-ledger.js";

const digest = (letter: string) => `sha256:${letter.repeat(64)}`;

function ledger(overrides: Partial<RunWindowLedger> = {}): RunWindowLedger {
  return {
    version: 1,
    session_id: "session-20260830-a",
    anchor: { wall_clock_iso: "2026-08-30T10:00:00.000Z", monotonic_zero: 100 },
    window: { start_iso: "2026-08-30T10:00:00.000Z", end_iso: "2026-08-30T10:00:03.000Z" },
    host_start: { os: "darwin", cpu: "Apple M3", ram_gb: 16, docker: "27.5.1", image_digests: [digest("a")] },
    host_end: { os: "darwin", cpu: "Apple M3", ram_gb: 16, docker: "27.5.1", image_digests: [digest("a")] },
    matrix_definition_sha256: digest("b"),
    segments: [{
      id: "segment-0",
      anchor: { wall_clock_iso: "2026-08-30T10:00:00.000Z", monotonic_zero: 100 },
      start_ms: 100,
      end_ms: 3_100,
      start_iso: "2026-08-30T10:00:00.000Z",
      end_iso: "2026-08-30T10:00:03.000Z",
      attempts: [{
        id: "attempt-0",
        cell_id: "pinned:codex:t1:0",
        run_id: "pinned:codex:t1:0",
        kind: "current",
        start_ms: 200,
        end_ms: 2_900,
        start_iso: "2026-08-30T10:00:00.100Z",
        end_iso: "2026-08-30T10:00:02.800Z",
        status: "completed",
      }],
    }],
    results_binding: { run_ids_sha256: digest("c"), results_bytes_sha256: digest("d") },
    state_sha256: digest("e"),
    replacement_state_sha256: null,
    ...overrides,
  };
}

function createBoundResult(root: string, runId = "pinned:mock-agent:dry-run-1:0", interval = { start: 200, end: 2_900 }): string {
  const cell = join(root, "pinned", "mock-agent", "dry-run-1", "rep-0");
  mkdirSync(cell, { recursive: true });
  const fixture = join(dirname(fileURLToPath(import.meta.url)), "../../../scripts/test-fixtures/default-mock");
  cpSync(fixture, cell, { recursive: true });
  const runPath = join(cell, "run.json");
  const run = JSON.parse(readFileSync(runPath, "utf8")) as {
    run_id: string;
    task_id: string;
    condition: string;
    anchors: { adapter: { wall_clock_iso: string; monotonic_zero: number } };
    adapter_result: { tStart: number; tEnd: number; anchor: unknown };
  };
  const eventPath = join(cell, "events.jsonl");
  const event = JSON.parse(readFileSync(eventPath, "utf8")) as { run_id: string };
  run.run_id = runId;
  run.task_id = "dry-run-1";
  run.condition = "pinned";
  run.anchors.adapter.wall_clock_iso = "2026-08-30T10:00:00.000Z";
  run.anchors.adapter.monotonic_zero = 100;
  run.adapter_result.anchor = run.anchors.adapter;
  run.adapter_result.tStart = interval.start;
  run.adapter_result.tEnd = interval.end;
  run.adapter_result.anchor = run.anchors.adapter;
  event.run_id = runId;
  writeFileSync(runPath, `${JSON.stringify(run)}\n`);
  writeFileSync(eventPath, `${JSON.stringify(event)}\n`);
  return cell;
}

describe("run-window ledger contract", () => {
  it("accepts a closed, ordered ledger", () => {
    expect(validateRunWindowLedger(ledger())).toEqual(ledger());
  });

  it("rejects reversed windows, overlapping attempts, and duplicate cell IDs", () => {
    expect(() => validateRunWindowLedger(ledger({ window: { start_iso: "2026-08-30T10:00:03.000Z", end_iso: "2026-08-30T10:00:00.000Z" } }))).toThrow(/window/i);
    const overlapping = ledger({ segments: [{ ...ledger().segments[0]!, attempts: [
      ledger().segments[0]!.attempts[0]!,
      { ...ledger().segments[0]!.attempts[0]!, id: "attempt-1", start_ms: 2_000, end_ms: 2_950, start_iso: "2026-08-30T10:00:01.900Z", end_iso: "2026-08-30T10:00:02.850Z" },
    ] }] });
    expect(() => validateRunWindowLedger(overlapping)).toThrow(/overlap/i);
    const duplicate = ledger({ segments: [{ ...ledger().segments[0]!, attempts: [
      ledger().segments[0]!.attempts[0]!,
      { ...ledger().segments[0]!.attempts[0]!, id: "attempt-1", start_ms: 2_950, end_ms: 3_000, start_iso: "2026-08-30T10:00:02.850Z", end_iso: "2026-08-30T10:00:02.900Z" },
    ] }] });
    expect(() => validateRunWindowLedger(duplicate)).toThrow(/cell|duplicate/i);
  });

  it("rejects stale bindings, credentials, and a gap in the official segment", () => {
    expect(() => validateRunWindowLedger({ ...ledger(), matrix_definition_sha256: "sha256:stale" })).toThrow(/digest/i);
    expect(() => validateRunWindowLedger({ ...ledger(), session_id: "OPENROUTER_API_KEY=secret" })).toThrow(/session/i);
    const gapped = ledger({ segments: [
      ledger().segments[0]!,
      { ...ledger().segments[0]!, id: "segment-1", start_ms: 4_000, end_ms: 5_000, start_iso: "2026-08-30T10:00:04.000Z", end_iso: "2026-08-30T10:00:05.000Z", attempts: [] },
    ] });
    expect(() => assertOfficialRunWindow(gapped)).toThrow(/segment|gap|contiguous/i);
  });

  it("requires every official attempt to be closed and host identity to remain stable", () => {
    expect(() => assertOfficialRunWindow(ledger({ host_end: { ...ledger().host_end!, docker: "28.0.0" } }))).toThrow(/host/i);
    expect(() => assertOfficialRunWindow(ledger({
      window: { start_iso: "2026-08-30T10:00:00.000Z", end_iso: null },
      host_end: null,
      state_sha256: null,
      segments: [{ ...ledger().segments[0]!, end_ms: null, end_iso: null, attempts: [{ ...ledger().segments[0]!.attempts[0]!, end_ms: null, end_iso: null, status: "interrupted", kind: "interrupted" }] }],
    }))).toThrow(/closed|interrupt/i);
  });

  it("requires the ledger attempt multiset to match current and retry state", () => {
    const cell = "pinned:codex:t1:0";
    expect(() => assertOfficialRunWindow(ledger(), {
      expectedCellIds: new Set([cell]),
      expectedRetryCounts: new Map([[cell, 1]]),
    })).toThrow(/coverage|retry/i);
    expect(() => assertOfficialRunWindow(ledger(), {
      expectedCellIds: new Set([cell, "pinned:hermes:unknown:0"]),
    })).toThrow(/missing cell|unknown/i);
    expect(() => assertOfficialRunWindow(ledger(), {
      expectedCellIds: new Set([cell]),
      expectedRetryCounts: new Map([[cell, 0]]),
    })).not.toThrow();
  });

  it("rejects official evidence whose C4 run ID is not the ledger attempt", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-window-c4-binding-"));
    try {
      createBoundResult(root, "pinned:mock-agent:wrong-cell:0");
      expect(() => assertOfficialRunWindow(ledger(), { resultsRoot: root })).toThrow(/evidence|run.?id|ledger|attempt/i);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects official evidence whose adapter interval escapes its ledger attempt", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-window-c4-interval-"));
    try {
      createBoundResult(root, "pinned:codex:t1:0", { start: 0, end: 3_200 });
      expect(() => assertOfficialRunWindow(ledger(), { resultsRoot: root })).toThrow(/interval|outside|attempt/i);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects overlapping primary and replacement official windows", () => {
    const primary = ledger();
    const replacement = ledger({
      session_id: "session-20260830-replacement",
      window: { start_iso: "2026-08-30T10:00:01.000Z", end_iso: "2026-08-30T10:00:04.000Z" },
      anchor: { wall_clock_iso: "2026-08-30T10:00:01.000Z", monotonic_zero: 100 },
      segments: [{
        ...primary.segments[0]!,
        anchor: { wall_clock_iso: "2026-08-30T10:00:01.000Z", monotonic_zero: 100 },
        start_iso: "2026-08-30T10:00:01.000Z",
        end_iso: "2026-08-30T10:00:04.000Z",
        attempts: [{
          ...primary.segments[0]!.attempts[0]!,
          start_iso: "2026-08-30T10:00:01.100Z",
          end_iso: "2026-08-30T10:00:03.800Z",
        }],
      }],
    });
    expect(() => assertOfficialRunWindowsDoNotOverlap(primary, replacement)).toThrow(/overlap/i);
  });

  it("binds retries from the sanitized provenance retry root", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-window-archive-retry-"));
    const retryRoot = mkdtempSync(join(tmpdir(), "aob-window-archive-retry-evidence-"));
    try {
      const cell = createBoundResult(root, "pinned:codex:t1:0");
      const retryCell = join(retryRoot, "retries", "pinned", "mock-agent", "dry-run-1", "rep-0", "attempt-0");
      mkdirSync(retryCell, { recursive: true });
      cpSync(join(cell, "run.json"), join(retryCell, "run.json"));
      const retryRun = JSON.parse(readFileSync(join(retryCell, "run.json"), "utf8")) as {
        anchors: { adapter: { wall_clock_iso: string }; proxy: { wall_clock_iso: string } };
        adapter_result: { anchor: { wall_clock_iso: string } };
      };
      retryRun.anchors.adapter.wall_clock_iso = "2026-08-30T10:00:03.000Z";
      retryRun.anchors.proxy.wall_clock_iso = "2026-08-30T10:00:03.000Z";
      retryRun.adapter_result.anchor.wall_clock_iso = "2026-08-30T10:00:03.000Z";
      writeFileSync(join(cell, "run.json"), `${JSON.stringify({
        ...retryRun,
        anchors: { adapter: retryRun.anchors.adapter, proxy: retryRun.anchors.proxy },
        adapter_result: { ...retryRun.adapter_result, tStart: 200, tEnd: 2_900 },
      })}\n`);
      const base = ledger();
      const first = base.segments[0]!.attempts[0]!;
      const second = { ...first, id: "attempt-1", kind: "retry" as const, start_ms: 3_200, end_ms: 5_900, start_iso: "2026-08-30T10:00:03.100Z", end_iso: "2026-08-30T10:00:05.800Z" };
      const official = ledger({
        window: { start_iso: "2026-08-30T10:00:00.000Z", end_iso: "2026-08-30T10:00:06.000Z" },
        segments: [{ ...base.segments[0]!, end_ms: 6_100, end_iso: "2026-08-30T10:00:06.000Z", attempts: [first, second] }],
      });
      expect(() => assertOfficialRunWindow(official, { resultsRoot: root, retryResultsRoots: [retryRoot] })).not.toThrow();
    } finally {
      rmSync(root, { recursive: true, force: true });
      rmSync(retryRoot, { recursive: true, force: true });
    }
  });

  it("requires retained retry evidence to match the state retry multiset", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-window-retry-evidence-"));
    try {
      const cell = "pinned:codex:t1:0";
      const retry = join(root, "pinned", "codex", "t1", "rep-0", ".attempts", "attempt-0");
      mkdirSync(retry, { recursive: true });
      writeFileSync(join(retry, "run.json"), JSON.stringify({ run_id: cell }));
      expect(() => assertRetryEvidenceCoverage(root, new Map([[cell, 1]]))).not.toThrow();
      expect(() => assertRetryEvidenceCoverage(root, new Map([[cell, 0]]))).toThrow(/retry evidence|expected/i);
      expect(() => assertRetryEvidenceCoverage(root, new Map([["pinned:hermes:t1:0", 1]]))).toThrow(/unknown|retry evidence/i);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("creates a minimally valid open session without provider access", () => {
    const created = createRunWindowLedger({
      sessionId: "session-20260830-b",
      now: { wall_clock_iso: "2026-08-30T11:00:00.000Z", monotonic_zero: 42, now_ms: 42 },
      host: { os: "linux", cpu: "x86_64", ram_gb: 8, docker: "28.0.0", image_digests: [] },
      matrixDefinitionSha256: digest("f"),
    });
    expect(created.segments).toHaveLength(1);
    expect(created.segments[0]?.end_ms).toBeNull();
    expect(created.state_sha256).toBeNull();
  });

  it("durably records an attempt before execution and closes a normal session", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-window-test-"));
    try {
      const host = { os: "linux", cpu: "x86_64", ram_gb: 8, docker: "28.0.0", image_digests: [] };
      let index = 0;
      const times = [0, 100, 3_100].map((now_ms) => ({ wall_clock_iso: "2026-08-30T12:00:00.000Z", monotonic_zero: 0, now_ms }));
      const writer = RunWindowWriter.open({ path: join(root, "run-window-ledger.json"), sessionId: "session-20260830-c", clock: () => times[index++] ?? times.at(-1)!, host, matrixDefinitionSha256: digest("a") });
      const attempt = writer.startAttempt("cell-1", "cell-1", "current");
      expect(writer.ledger.segments[0]?.attempts[0]?.id).toBe(attempt);
      writer.finishAttempt(attempt, "completed");
      const closed = writer.finish(host, digest("b"), { run_ids_sha256: digest("c"), results_bytes_sha256: digest("d") });
      expect(() => assertOfficialRunWindow(closed)).not.toThrow();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("uses one writer-lifetime monotonic anchor for the default clock", async () => {
    const root = mkdtempSync(join(tmpdir(), "aob-window-clock-"));
    try {
      const host = { os: "linux", cpu: "x86_64", ram_gb: 8, docker: "28.0.0", image_digests: [] };
      const writer = RunWindowWriter.open({ path: join(root, "ledger.json"), sessionId: "session-20260830-clock", host, matrixDefinitionSha256: digest("a") });
      const attempt = writer.startAttempt("cell-1", "cell-1", "current");
      await new Promise((resolve) => setTimeout(resolve, 8));
      writer.finishAttempt(attempt, "completed");
      const observed = writer.ledger.segments[0]?.attempts[0];
      expect(observed?.end_ms).not.toBeNull();
      expect((observed?.end_ms ?? 0) - observed!.start_ms).toBeGreaterThan(0);
      writer.finish(host, digest("b"), null);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("preserves an open interrupted attempt and starts an explicit continuation segment on resume", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-window-resume-"));
    try {
      const path = join(root, "run-window-ledger.json");
      const host = { os: "linux", cpu: "x86_64", ram_gb: 8, docker: "28.0.0", image_digests: [] };
      let firstNow = 0;
      const first = RunWindowWriter.open({ path, sessionId: "session-20260830-d", clock: () => ({ wall_clock_iso: "2026-08-30T13:00:00.000Z", monotonic_zero: 0, now_ms: firstNow++ * 100 }), host, matrixDefinitionSha256: digest("a") });
      first.startAttempt("cell-1", "cell-1", "current");
      let secondNow = 0;
      const resumed = RunWindowWriter.open({ path, sessionId: "session-20260830-d", clock: () => ({ wall_clock_iso: "2026-08-30T13:01:00.000Z", monotonic_zero: 0, now_ms: secondNow++ * 100 }), host, matrixDefinitionSha256: digest("a") });
      expect(resumed.ledger.segments).toHaveLength(2);
      expect(resumed.ledger.segments[0]?.attempts[0]?.status).toBe("open");
      expect(() => assertOfficialRunWindow(resumed.ledger, { requireResultBinding: false })).toThrow(/segment|closed/i);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});


function batchLedger(tools = ["codex", "hermes"]): RunWindowLedger {
  const base = ledger();
  const segments = tools.map((tool, index) => {
    const wall = `2026-08-30T10:0${index}:00.000Z`;
    const zero = index === 0 ? 100 : 50_000;
    const cell = `pinned:${tool}:t${index + 1}:0`;
    return {
      ...base.segments[0]!, id: `segment-${index}`,
      anchor: { wall_clock_iso: wall, monotonic_zero: zero },
      start_ms: zero, end_ms: zero + 3_000,
      start_iso: wall, end_iso: wall.replace("00.000Z", "03.000Z"),
      batch_tool: tool, batch_cap_usd: 10, host_start: base.host_start, host_end: base.host_end,
      attempts: [{ ...base.segments[0]!.attempts[0]!, id: `attempt-${index}`, cell_id: cell, run_id: cell,
        start_ms: zero + 100, end_ms: zero + 2_800,
        start_iso: wall.replace("00.000Z", "00.100Z"), end_iso: wall.replace("00.000Z", "02.800Z"),
      }],
    };
  });
  return { ...base, execution_protocol: "tool-batches-v1", segments, window: { start_iso: segments[0]!.start_iso, end_iso: segments.at(-1)!.end_iso } };
}

function batchOptions(value: RunWindowLedger) {
  const expectedCellTools = new Map(value.segments.flatMap((segment) => segment.attempts.map((attempt) => [attempt.cell_id, segment.batch_tool!] as const)));
  return { executionProtocol: "tool-batches-v1" as const, expectedCellTools, expectedCellIds: new Set(expectedCellTools.keys()) };
}

describe("tool batch run-window ledger", () => {
  it("accepts separate monotonic anchors only through explicit batch validation", () => {
    const value = batchLedger();
    expect(validateRunWindowLedger(value)).toEqual(value);
    expect(() => assertOfficialRunWindow(value, batchOptions(value))).not.toThrow();
    expect(() => assertOfficialRunWindow(value)).toThrow(/one contiguous segment|protocol/i);
    expect(() => assertOfficialRunWindow(batchLedger(["codex"]))).toThrow(/protocol/i);
    expect(validateRunWindowLedger(ledger())).not.toHaveProperty("execution_protocol");
    expect(validateRunWindowLedger(ledger()).segments[0]).not.toHaveProperty("batch_tool");
  });

  it("requires protocol, complete metadata, and exact expected tool mapping", () => {
    const value = batchLedger();
    expect(() => assertOfficialRunWindow(ledger(), batchOptions(value))).toThrow(/protocol/i);
    expect(() => assertOfficialRunWindow(value, { executionProtocol: "tool-batches-v1" })).toThrow(/mapping/i);
    const extra = batchOptions(value);
    extra.expectedCellTools.set("unknown", "codex");
    expect(() => assertOfficialRunWindow(value, extra)).toThrow(/mapping|keys/i);
    const missing = batchLedger();
    delete missing.segments[0]!.host_start;
    expect(() => validateRunWindowLedger(missing)).toThrow(/host/i);
    const legacyMetadata = { ...value, execution_protocol: undefined };
    expect(() => validateRunWindowLedger(legacyMetadata)).toThrow(/protocol|metadata/i);
    for (const cap of [0, -1, NaN, Infinity]) {
      const bad = batchLedger(); bad.segments[0]!.batch_cap_usd = cap;
      expect(() => validateRunWindowLedger(bad)).toThrow(/cap/i);
    }
    const bad = batchLedger(); bad.segments[0]!.batch_tool = "KEY=secret";
    expect(() => validateRunWindowLedger(bad)).toThrow(/tool/i);
  });

  it("rejects mixed tools, reentry, host drift, missing attempts, and unclosed segments", () => {
    const mixed = batchLedger();
    const options = batchOptions(mixed);
    mixed.segments[1]!.batch_tool = "codex";
    expect(() => assertOfficialRunWindow(mixed, options)).toThrow(/tool/i);
    const reordered = batchLedger(["codex", "hermes", "codex"]);
    expect(() => assertOfficialRunWindow(reordered, batchOptions(reordered))).toThrow(/tool|order/i);
    const drift = batchLedger(); drift.segments[0]!.host_end = { ...drift.host_start, cpu: "different" };
    expect(() => assertOfficialRunWindow(drift, batchOptions(drift))).toThrow(/host/i);
    const missing = batchLedger(); missing.segments[1]!.attempts = [];
    expect(() => assertOfficialRunWindow(missing, options)).toThrow(/missing cell/i);
    const open = batchLedger(); open.segments[0]!.end_ms = null; open.segments[0]!.end_iso = null; open.segments[0]!.host_end = null;
    expect(() => assertOfficialRunWindow(open, batchOptions(open))).toThrow(/closed/i);
    const same = batchLedger(["codex", "codex"]);
    expect(() => assertOfficialRunWindow(same, batchOptions(same))).not.toThrow();
  });

  it("retains exact current/retry coverage across batch segments", () => {
    const value = batchLedger(["codex", "codex"]);
    const first = value.segments[0]!.attempts[0]!;
    const last = value.segments[1]!.attempts[0]!;
    last.cell_id = first.cell_id; last.run_id = first.run_id; last.kind = "retry";
    const options = { ...batchOptions(value), expectedRetryCounts: new Map([[first.cell_id, 1]]) };
    expect(() => assertOfficialRunWindow(value, options)).not.toThrow();
    expect(() => assertOfficialRunWindow(value, { ...options, expectedRetryCounts: new Map() })).toThrow(/coverage/i);
    last.kind = "current";
    expect(() => assertOfficialRunWindow(value, options)).toThrow(/coverage/i);
  });

  it("checks replacement overlap with an explicitly validated batch campaign", () => {
    const value = batchLedger();
    expect(() => assertOfficialRunWindowsDoNotOverlap(value, ledger(), batchOptions(value))).toThrow(/overlap/i);
  });

  it("binds C4 tools and intervals across independently anchored batches", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-batch-c4-"));
    try {
      const value = batchLedger();
      const paths = value.segments.map((segment, index) => {
        const attempt = segment.attempts[0]!;
        const cell = createBoundResult(join(root, `batch-${index}`), attempt.run_id, { start: attempt.start_ms, end: attempt.end_ms! });
        const path = join(cell, "run.json");
        const run = JSON.parse(readFileSync(path, "utf8"));
        run.tool = segment.batch_tool;
        run.anchors.adapter = segment.anchor;
        run.adapter_result.anchor = segment.anchor;
        writeFileSync(path, JSON.stringify(run));
        return path;
      });
      const options = { ...batchOptions(value), resultsRoot: root };
      expect(() => assertOfficialRunWindow(value, options)).not.toThrow();
      const run = JSON.parse(readFileSync(paths[1]!, "utf8"));
      run.tool = "codex";
      writeFileSync(paths[1]!, JSON.stringify(run));
      expect(() => assertOfficialRunWindow(value, options)).toThrow(/C4.*tool|tool.*C4/i);
      run.tool = "hermes"; run.adapter_result.tEnd += 1_000;
      writeFileSync(paths[1]!, JSON.stringify(run));
      expect(() => assertOfficialRunWindow(value, options)).toThrow(/interval/i);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it("rejects metadata without a protocol and malformed creation options", () => {
    const value = batchLedger();
    delete value.execution_protocol;
    expect(() => validateRunWindowLedger(value)).toThrow(/metadata.*protocol/i);
    const base = { sessionId: "batch-session", now: { wall_clock_iso: "2026-08-30T10:00:00.000Z", monotonic_zero: 0, now_ms: 0 }, host: ledger().host_start, matrixDefinitionSha256: digest("a") };
    expect(() => createRunWindowLedger({ ...base, batch: { tool: "KEY=secret", capUsd: 1 } })).toThrow(/tool/i);
    expect(() => createRunWindowLedger({ ...base, batch: { tool: "codex", capUsd: 0 } })).toThrow(/cap/i);
  });

  it("persists batch snapshots and only resumes clean matching sessions", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-batch-writer-"));
    try {
      const path = join(root, "ledger.json");
      const host = ledger().host_start;
      let ms = 100;
      const options = { path, sessionId: "batch-session", host, matrixDefinitionSha256: digest("a"), batch: { tool: "codex", capUsd: 10 },
        clock: () => ({ wall_clock_iso: "2026-08-30T10:00:00.000Z", monotonic_zero: 100, now_ms: ms += 100 }) };
      const writer = RunWindowWriter.open(options);
      expect(writer.ledger.execution_protocol).toBe("tool-batches-v1");
      expect(() => RunWindowWriter.open({ ...options, allowContinuation: true })).toThrow(/closed|unclean/i);
      writer.finish(host, digest("b"), null);
      expect(writer.ledger.segments[0]!.host_end).toEqual(host);
      expect(() => RunWindowWriter.open(options)).toThrow(/closed/i);
      const { batch: _batch, ...legacyOptions } = options;
      expect(() => RunWindowWriter.open({ ...legacyOptions, allowContinuation: true })).toThrow(/protocol/i);
      expect(() => RunWindowWriter.open({ ...options, allowContinuation: true, host: { ...host, cpu: "changed" } })).toThrow(/host/i);
      const next = RunWindowWriter.open({ ...options, allowContinuation: true });
      expect(next.ledger.segments).toHaveLength(2);
      next.finish(host, digest("b"), null);
      const third = RunWindowWriter.open({ ...options, allowContinuation: true, batch: { tool: "hermes", capUsd: 20 } });
      expect(third.ledger.segments[2]!.batch_tool).toBe("hermes");
      third.finish(host, digest("b"), null);
      const beforeReentry = readFileSync(path, "utf8");
      expect(() => RunWindowWriter.open({ ...options, allowContinuation: true })).toThrow(/tool.*order|earlier tool/i);
      expect(readFileSync(path, "utf8")).toBe(beforeReentry);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
});
