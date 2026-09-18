import { describe, expect, it } from "vitest";
import type { AnalysisAttempt } from "./analysis.js";
import { summarizeOverview } from "./overview.js";

const row = (overrides: Partial<AnalysisAttempt> = {}) => ({
  harness: "alpha", version: "v1", task: "one", task_base_revision: "base",
  verifier_image: "image", environment: "env", outcome: "completed",
  cost_usd: 1, cached_percent: 50, input_tokens: 100, output_tokens: 10,
  ...overrides,
} as AnalysisAttempt);

describe("overview summaries", () => {
  it("includes non-passes and computes measured medians rather than success-only statistics", () => {
    const [summary] = summarizeOverview([
      row(), row({ outcome: "verify_error", cost_usd: 9, cached_percent: 90, input_tokens: 900 }),
      row({ outcome: "timeout", cost_usd: null, cached_percent: null, input_tokens: null, output_tokens: null }),
    ]);
    expect(summary!.pass_rate).toBeCloseTo(100 / 3);
    expect(summary).toMatchObject({ selected: 3, passes: 1,
      cost: { value: 5, n: 2 }, cache: { value: 70, n: 2 }, input: { value: 500, n: 2 }, output: { value: 10, n: 2 } });
  });

  it("keeps versions and task identities distinct and does not fabricate unknown measurements", () => {
    const summaries = summarizeOverview([
      row({ version: "v2", cost_usd: null }),
      row({ cost_usd: null }), row({ task_base_revision: "other", cost_usd: null }),
    ]);
    expect(summaries).toHaveLength(2);
    expect(summaries[0]).toMatchObject({ version: "v1", tasks: 2, cost: { value: null, n: 0 } });
    expect(summaries[1]).toMatchObject({ version: "v2", selected: 1 });
    expect(summarizeOverview([])).toEqual([]);
  });
});
