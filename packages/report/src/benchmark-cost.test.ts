import { expect, it } from "vitest";
import { summarizeBenchmarkCosts } from "./benchmark-cost.js";
import type { AnalysisAttempt } from "./analysis.js";
import type { AnalysisRequest } from "./request-analysis.js";
const rates = { input: 0.000001, cached_input: 0.0000001, output: 0.000002 };
function attempt(task: string, input: number, extra: Partial<AnalysisAttempt> = {}): AnalysisAttempt {
  return { harness: "alpha", version: "1", task, task_base_revision: "base", usage_unavailable: null,
    cost_unavailable: null, outcome: "completed",
    requests: [{ successful: true, input_tokens: input, cached_input_tokens: 0, output_tokens: 0 } as AnalysisRequest],
    ...extra } as AnalysisAttempt;
}
it("sums every repetition and failure instead of taking the median", () => {
  const [row] = summarizeBenchmarkCosts([attempt("one", 1000000), attempt("one", 9000000, { outcome: "verify_error" }), attempt("two", 2000000)], rates);
  expect(row?.known_usd).toBe(12);
  expect(row?.total_usd).toBe(12);
  expect(row?.selected).toBe(3);
  expect(row?.average_usd).toBe(3.5);
  expect(row?.tasks[0]?.average_usd).toBe(5);
  expect(row?.tasks.map(t => [t.task, t.known_usd, t.selected])).toEqual([["one", 10, 2], ["two", 2, 1]]);
});
it("keeps known request costs inside incomplete runs without claiming a complete total", () => {
  const incomplete = attempt("one", 2000000, { usage_unavailable: "incomplete-usage", cost_unavailable: "incomplete-usage" });
  incomplete.requests.push({ successful: true, input_tokens: null, cached_input_tokens: null, output_tokens: null } as AnalysisRequest);
  const [row] = summarizeBenchmarkCosts([attempt("one", 1000000), incomplete], rates);
  expect(row?.known_usd).toBe(3);
  expect(row?.total_usd).toBeNull();
  expect(row?.complete_attempts).toBe(1);
  expect(row?.average_usd).toBe(1.5);
  expect(row?.tasks[0]?.total_usd).toBeNull();
});
it("preserves cached-token pricing and ambiguous accounting; no observations are not zero", () => {
  const a = attempt("one", 1000000, { cost_unavailable: "incomplete-accounting" });
  a.requests[0]!.cached_input_tokens = 500000;
  const [row] = summarizeBenchmarkCosts([a], rates);
  expect(row?.known_usd).toBeCloseTo(0.55);
  expect(row?.total_usd).toBeNull();
  expect(summarizeBenchmarkCosts([attempt("one", 0, { requests: [], usage_unavailable: "no-successful-usage" })], rates)[0]?.known_usd).toBeNull();
  expect(summarizeBenchmarkCosts([attempt("one", 0)], rates)[0]?.total_usd).toBe(0);
});
