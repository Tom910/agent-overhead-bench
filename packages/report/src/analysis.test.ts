import { describe, expect, it } from "vitest";
import { analyzeAttempts, type AnalysisAttempt } from "./analysis.js";
import { emptyRequestSummary } from "./request-analysis.js";

function attempt(id: string, tool: string, task: string, ms: number, extra: Partial<AnalysisAttempt> = {}): AnalysisAttempt {
  return {
    run_id: id, harness: tool, version: "1", task, rep: 0, outcome: "completed",
    host: { os: "linux", cpu: "cpu", ram_gb: 16 }, condition: "pinned", model: "mock",
    price_book: "book", source: { repository: null, name: "fixture", revision: "1" },
    regime: "short", routing: null, configuration: null, ori_version: null,
    task_base_revision: null, verifier_image: "verifier", environment: "runner-default",
    started_iso: "2026-09-14T00:00:00.000Z", visibility: "partial",
    hashes: { run: "sha256:" + "a".repeat(64), events: "sha256:" + "b".repeat(64) },
    timing: { end_to_end: ms, startup: 1, model_time: ms - 2, non_model_time: 1,
      tool_time: null, harness_time: null, parallelism: 1, first_byte_ms: 1, sum_request_durations: ms - 2, unreconciled: false },
    timing_unavailable: null, turns: 3, input_tokens: 100, output_tokens: 20,
    cached_percent: 50, usage_unavailable: null, cost_usd: 0.2,
    token_floor_usd: 0.3, cost_unavailable: null, requests: [], request_summary: emptyRequestSummary(), ...extra,
  };
}

describe("analysis populations", () => {
  it("matches only common successful task identities and reports denominators", () => {
    const result = analyzeAttempts([
      attempt("a1", "a", "common", 100), attempt("a2", "a", "common", 300, { rep: 1 }),
      attempt("b1", "b", "common", 400), attempt("a3", "a", "unmatched", 10000),
      attempt("b2", "b", "unmatched", 1, { outcome: "verify_error" }),
    ]);
    const pair = result.populations[0]!.comparisons[0]!;
    expect(pair.tasks).toHaveLength(1);
    expect(pair.tasks[0]).toMatchObject({ task: "common", left_n: 2, right_n: 1, left_ms: 200, right_ms: 400 });
    expect(pair).toMatchObject({ left_ms: 200, right_ms: 400, median_task_ratio: 2 });
    const failure = result.populations[0]!.distributions.find((row) => row.harness === "b" && row.outcome === "verify_error")!;
    expect(failure.metrics.end_to_end).toMatchObject({ n: 1, median: 1, q1: null, q3: null });
  });

  it.each([
    { host: { os: "darwin", cpu: "cpu", ram_gb: 16 } }, { price_book: "other" },
    { routing: { ignored_providers: [], only_provider: "other", allow_fallbacks: false as const } },
    { source: { repository: null, name: "fixture", revision: "2" } }, { model: "other" },
  ])("does not compare different recorded populations: %j", (change) => {
    const result = analyzeAttempts([attempt("a", "a", "task", 100), attempt("b", "b", "task", 200, change)]);
    expect(result.populations).toHaveLength(2);
    expect(result.populations.flatMap((p) => p.comparisons)).toHaveLength(0);
  });

  it("does not match different task bases or verifier images", () => {
    for (const change of [{ task_base_revision: "other" }, { verifier_image: "other" }]) {
      const result = analyzeAttempts([attempt("a", "a", "task", 100), attempt("b", "b", "task", 200, change)]);
      expect(result.populations[0]!.comparisons[0]!.tasks).toHaveLength(0);
      expect(result.populations[0]!.comparisons[0]!.left_ms).toBeNull();
    }
  });

  it("retains missing timing and cost counts without substituting zero", () => {
    const result = analyzeAttempts([
      attempt("a", "a", "task", 100),
      attempt("b", "a", "task", 200, { rep: 1, timing: null, timing_unavailable: "unreconciled", cost_usd: null, cost_unavailable: "incomplete-accounting" }),
    ]);
    const row = result.populations[0]!.distributions[0]!;
    expect(row.metrics.end_to_end).toMatchObject({ n: 1, missing: 1, median: 100 });
    expect(row.metrics.cost_usd).toMatchObject({ n: 1, missing: 1, median: 0.2 });
    expect(row.attempts).toHaveLength(2);
  });

  it("rejects duplicate run identities", () => {
    expect(() => analyzeAttempts([attempt("same", "a", "t", 100), attempt("same", "a", "t", 200)])).toThrow(/duplicate/);
  });

  it("rejects double-counting one slot through different run IDs", () => {
    expect(() => analyzeAttempts([attempt("first", "a", "t", 100), attempt("replacement", "a", "t", 200)])).toThrow(/duplicate/);
  });

  it("does not claim matched-model comparisons when the model is unspecified", () => {
    const result = analyzeAttempts([
      attempt("a", "a", "task", 100, { model: "", condition: "default" }),
      attempt("b", "b", "task", 200, { model: "", condition: "default" }),
    ]);
    expect(result.populations[0]!.comparisons).toHaveLength(0);
  });
});
