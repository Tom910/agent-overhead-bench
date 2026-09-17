import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { analyzeAttempts, type AnalysisAttempt } from "./analysis.js";
import { summarizeRequests } from "./request-analysis.js";
import { renderAnalysisHtml, renderAnalysisMarkdown } from "./analysis-render.js";
import { replayAnalysis, writeAnalysisReplay } from "./analysis-replay.js";

function attempt(): AnalysisAttempt {
  const requests = [0, 1].map((seq) => ({
    seq, t_start_ms: seq * 400, t_end_ms: seq * 400 + 300, duration_ms: 300,
    wait_ms: 20, transfer_ms: 280, gap_before_ms: seq === 0 ? null : 100,
    status: 200, streamed: true, successful: true,
    input_tokens: 50, cached_input_tokens: 10, output_tokens: 25, cost_usd: 0.05, token_floor_usd: 0.1,
  }));
  return {
    run_id: "one", harness: "test-tool", version: "1", task: "task", rep: 0, outcome: "completed",
    host: { os: "linux", cpu: "cpu", ram_gb: 16 }, condition: "pinned", model: "mock", price_book: "mock-book",
    source: { repository: null, name: "local-development", revision: "working-tree" }, regime: "short",
    routing: { ignored_providers: ["relace"], only_provider: "test/provider", allow_fallbacks: false },
    configuration: null, ori_version: null, task_base_revision: null, verifier_image: "host", environment: "runner-default",
    started_iso: "2026-09-14T00:00:00.000Z", visibility: "full",
    hashes: { run: `sha256:${"a".repeat(64)}`, events: `sha256:${"b".repeat(64)}` },
    timing: { end_to_end: 1000, startup: 100, model_time: 600, tool_time: 100, harness_time: 200,
      non_model_time: 300, parallelism: 1, first_byte_ms: 20, sum_request_durations: 600, unreconciled: false },
    timing_unavailable: null, turns: 2, input_tokens: 100, output_tokens: 50, cached_percent: 20,
    usage_unavailable: null, cost_usd: 0.1, token_floor_usd: 0.2, cost_unavailable: null,
    requests, request_summary: {
      n: 2, n_success: 2, n_error: 0, median_duration_ms: 300, median_wait_ms: 20,
      median_transfer_ms: 280, median_gap_before_ms: 100, largest_duration_ms: 300,
      largest_gap_before_ms: 100, time_after_last_ms: 200, share_after_last: 2 / 9,
      share_in_gaps: 1 / 9, cumulative_input: 100, cumulative_cached_input: 20,
      cumulative_output: 50, cumulative_cost_usd: 0.1,
    },
  };
}

it("recomputes forged summaries and notes from validated attempts", () => {
  const original = analyzeAttempts([attempt()]);
  const forged = { ...original, notes: ["PRIVATE SENTINEL"], populations: [{ private_prompt: "PRIVATE SENTINEL" }] };
  expect(replayAnalysis(forged)).toEqual(original);
  expect(JSON.stringify(replayAnalysis(forged))).not.toContain("PRIVATE SENTINEL");
  expect(replayAnalysis(analyzeAttempts([]))).toEqual(analyzeAttempts([]));
});

it.each(["attempt", "host", "source", "routing", "hashes", "timing"])("rejects unknown %s fields rather than republishing them", (where) => {
  const a = attempt();
  const target = where === "attempt" ? a : (a as unknown as Record<string, unknown>)[where];
  Object.assign(target!, { private_prompt: "PRIVATE SENTINEL" });
  expect(() => replayAnalysis({ schema_version: 2, scope: "loaded-attempts", notes: [], populations: [], annotated_runs: [], attempts: [a] })).toThrow(/unknown field/);
});

const corruptions: Array<[string, (a: AnalysisAttempt) => void]> = [
  ["fractional repetition", (a) => { a.rep = 0.5; }],
  ["negative turns", (a) => { a.turns = -1; }],
  ["nonfinite RAM", (a) => { a.host.ram_gb = Infinity; }],
  ["nonfinite timing", (a) => { a.timing!.end_to_end = NaN; }],
  ["negative timing", (a) => { a.timing!.startup = -1; }],
  ["forged timing sum", (a) => { a.timing!.non_model_time = 301; }],
  ["forged parallelism", (a) => { a.timing!.parallelism = 3; }],
  ["forged full visibility split", (a) => { a.timing!.harness_time = 250; }],
  ["forged partial visibility", (a) => { a.visibility = "partial"; }],
  ["unreconciled timing", (a) => { a.timing!.unreconciled = true; }],
  ["missing timing reason", (a) => { a.timing = null; }],
  ["spurious timing reason", (a) => { a.timing_unavailable = "unreconciled"; }],
  ["missing usage reason", (a) => { a.input_tokens = null; }],
  ["spurious usage reason", (a) => { a.usage_unavailable = "incomplete-usage"; }],
  ["missing cost reason", (a) => { a.cost_usd = null; a.token_floor_usd = null; }],
  ["partial unknown cost", (a) => { a.cost_usd = null; a.cost_unavailable = "unpriced-model"; }],
  ["negative cost", (a) => { a.cost_usd = -1; }],
  ["invalid cache percentage", (a) => { a.cached_percent = 101; }],
  ["invalid hash", (a) => { a.hashes.events = "forged"; }],
  ["invalid date", (a) => { a.started_iso = "yesterday"; }],
  ["invalid enum", (a) => { Object.assign(a, { outcome: "pretend-pass" }); }],
  ["coerced enum", (a) => { Object.assign(a, { condition: ["pinned"] }); }],
  ["invalid provider fallback", (a) => { Object.assign(a.routing!, { allow_fallbacks: true }); }],
  ["duplicate excluded providers", (a) => { a.routing!.ignored_providers = ["relace", "relace"]; }],
  ["missing required field", (a) => { Reflect.deleteProperty(a, "turns"); }],
];
it.each(corruptions)("rejects %s", (_label, corrupt) => {
  const a = attempt();
  expect(replayAnalysis(analyzeAttempts([a]))).toEqual(analyzeAttempts([a]));
  corrupt(a);
  expect(() => replayAnalysis({ schema_version: 2, scope: "loaded-attempts", notes: [], populations: [], annotated_runs: [], attempts: [a] })).toThrow(/invalid analysis export/);
});

it("preserves explicit missing values and validates duplicate IDs", () => {
  const a = attempt();
  Object.assign(a, {
    timing: null, timing_unavailable: "unreconciled", input_tokens: null, output_tokens: null, cached_percent: null,
    usage_unavailable: "incomplete-usage", cost_usd: null, token_floor_usd: null, cost_unavailable: "incomplete-usage",
  });
  Object.assign(a.requests[0]!, { input_tokens: null, cached_input_tokens: null, output_tokens: null, cost_usd: null, token_floor_usd: null });
  a.request_summary = summarizeRequests(a.requests);
  expect(replayAnalysis(analyzeAttempts([a]))).toEqual(analyzeAttempts([a]));
  const duplicate = analyzeAttempts([a]);
  duplicate.attempts.push(a);
  expect(() => replayAnalysis(duplicate)).toThrow(/duplicate/);
  expect(() => replayAnalysis({ ...analyzeAttempts([]), private_prompt: "secret" })).toThrow(/unknown field/);
});

it("writes deterministic offline views and discards saved derived text", () => {
  const root = mkdtempSync(join(tmpdir(), "aob-analysis-replay-"));
  try {
    const input = join(root, "analysis.json");
    const output = join(root, "out");
    const expected = analyzeAttempts([attempt()]);
    writeFileSync(input, JSON.stringify({ ...expected, notes: ["PRIVATE SENTINEL"], populations: [] }));
    writeAnalysisReplay(input, output);
    expect(readdirSync(output).sort()).toEqual(["analysis.html", "analysis.json", "analysis.md"]);
    expect(readFileSync(join(output, "analysis.json"), "utf8")).toBe(`${JSON.stringify(expected, null, 2)}\n`);
    expect(readFileSync(join(output, "analysis.md"), "utf8")).toBe(renderAnalysisMarkdown(expected));
    expect(readFileSync(join(output, "analysis.html"), "utf8")).toBe(renderAnalysisHtml(expected));
    const second = join(root, "second");
    writeAnalysisReplay(join(output, "analysis.json"), second);
    for (const name of readdirSync(output)) expect(readFileSync(join(second, name))).toEqual(readFileSync(join(output, name)));
    mkdirSync(join(root, "bad"));
    writeFileSync(input, "not json");
    expect(() => writeAnalysisReplay(input, join(root, "bad"))).toThrow(/invalid JSON/);
    expect(readdirSync(join(root, "bad"))).toEqual([]);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

const requestCorruptions: Array<[string, (a: AnalysisAttempt) => void, RegExp]> = [
  ["summary private object", a => { Object.assign(a.request_summary, { cumulative_input: { private_prompt: "PRIVATE_SENTINEL" } }); }, /request summary cumulative_input/],
  ["forged summary median", a => { a.request_summary.median_duration_ms = 999; }, /request summary median_duration_ms/],
  ["forged success count", a => { a.request_summary.n_success = 1; a.request_summary.n_error = 1; }, /request summary n_success/],
  ["fractional tokens", a => { a.requests[0]!.input_tokens = 0.5; }, /request input_tokens/],
  ["excess cached tokens", a => { a.requests[0]!.cached_input_tokens = 51; }, /request cached input/],
  ["inconsistent duration", a => { a.requests[0]!.duration_ms = 999; }, /request duration/],
  ["inconsistent wait", a => { a.requests[0]!.wait_ms = 30; }, /request wait\/transfer/],
  ["partial first byte", a => { a.requests[0]!.wait_ms = null; }, /request wait\/transfer/],
  ["duplicate sequence", a => { a.requests[1]!.seq = 0; }, /request sequence/],
  ["invalid status", a => { a.requests[0]!.status = 42; }, /request status/],
  ["success with failed status", a => { a.requests[0]!.status = 500; }, /request success status/],
  ["failed request usage", a => { a.requests[0]!.successful = false; }, /request unsuccessful accounting/],
  ["forged gap", a => { a.requests[1]!.gap_before_ms = 500; }, /request gap/],
  ["wrong origin", a => { a.requests[0]!.t_start_ms = 1; a.requests[0]!.t_end_ms = 301; }, /request origin/],
  ["wrong turn count", a => { a.turns = 3; }, /request turns/],
  ["wrong first-byte median", a => { a.timing!.first_byte_ms = 999; }, /request first-byte median/],
  ["wrong request duration sum", a => {
    Object.assign(a.timing!, { sum_request_durations: 700, parallelism: 7 / 6 });
  }, /request duration sum/],
  ["wrong request union", a => {
    Object.assign(a.timing!, { model_time: 500, non_model_time: 400, harness_time: 300, parallelism: 1.2 });
  }, /request interval union/],
  ["wrong request order", a => {
    const r = a.requests[1]!;
    a.requests.push({ ...r, seq: 4, t_start_ms: 200, t_end_ms: 500 });
  }, /request chronological order/],
  ["wrong attempt tokens", a => { a.input_tokens = 101; }, /request usage totals/],
  ["wrong attempt cost", a => { a.cost_usd = 0.2; }, /request cost total/],
  ["unknown request field", a => { Object.assign(a.requests[0]!, { private_prompt: "secret" }); }, /unknown field/],
];
it.each(requestCorruptions)("rejects v2 %s", (_name, corrupt, message) => {
  const a = attempt();
  expect(replayAnalysis(analyzeAttempts([a]))).toEqual(analyzeAttempts([a]));
  corrupt(a);
  expect(() => replayAnalysis(analyzeAttempts([a]))).toThrow(message);
});

it("accepts out-of-sequence concurrent calls and unknown first-byte timing", () => {
  const a = attempt();
  a.requests[0]!.seq = 3;
  Object.assign(a.requests[0]!, { wait_ms: null, transfer_ms: null });
  Object.assign(a.requests[1]!, { t_start_ms: 100, t_end_ms: 400, gap_before_ms: 0 });
  Object.assign(a.timing!, { model_time: 400, non_model_time: 500, harness_time: 400, parallelism: 1.5 });
  a.request_summary = summarizeRequests(a.requests, 900, 0);
  expect(replayAnalysis(analyzeAttempts([a]))).toEqual(analyzeAttempts([a]));
});

it("preserves successful usage and known total cost with an unpriced rejected call", () => {
  const a = attempt();
  Object.assign(a.requests[1]!, {
    status: 400, successful: false, input_tokens: null, cached_input_tokens: null,
    output_tokens: null, cost_usd: null, token_floor_usd: null,
  });
  Object.assign(a, { input_tokens: 50, output_tokens: 25, cost_usd: 0.05, token_floor_usd: 0.1 });
  Object.assign(a.request_summary, {
    n_success: 1, n_error: 1, cumulative_input: 50, cumulative_cached_input: 10,
    cumulative_output: 25, cumulative_cost_usd: null,
  });
  const result = replayAnalysis(analyzeAttempts([a]));
  expect(result.attempts[0]!.cost_usd).toBe(0.05);
  expect(result.attempts[0]!.request_summary.cumulative_input).toBe(50);
  expect(result.attempts[0]!.request_summary.cumulative_cost_usd).toBeNull();
});

it("preserves unavailable aggregate cost with known per-call estimates", () => {
  const a = attempt();
  Object.assign(a, { cost_usd: null, token_floor_usd: null, cost_unavailable: "incomplete-accounting" });
  const result = replayAnalysis(analyzeAttempts([a]));
  expect(result.attempts[0]!.cost_usd).toBeNull();
  expect(result.attempts[0]!.request_summary.cumulative_cost_usd).toBe(0.1);
});

it("rejects disappearing successful call prices when aggregate cost remains available", () => {
  const a = attempt();
  expect(replayAnalysis(analyzeAttempts([a]))).toEqual(analyzeAttempts([a]));
  Object.assign(a.requests[0]!, { cost_usd: null, token_floor_usd: null });
  a.request_summary.cumulative_cost_usd = null;
  expect(() => replayAnalysis(analyzeAttempts([a]))).toThrow(/request cost availability/);
});

it("rejects claimed missing usage when all successful usage remains available", () => {
  const a = attempt();
  expect(replayAnalysis(analyzeAttempts([a]))).toEqual(analyzeAttempts([a]));
  Object.assign(a, { input_tokens: null, output_tokens: null, cached_percent: null, usage_unavailable: "incomplete-usage" });
  expect(() => replayAnalysis(analyzeAttempts([a]))).toThrow(/request usage availability reason/);
});
