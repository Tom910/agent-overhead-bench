import { describe, expect, it } from "vitest";
import { analyzeAttempts, type AnalysisAttempt } from "./analysis.js";
import { emptyRequestSummary, type AnalysisRequest } from "./request-analysis.js";
import { referenceCost, comparisonGroups, relativeMetricScore } from "./comparison-overview.js";
import { renderAnalysisHtml, renderAnalysisMarkdown } from "./analysis-render.js";
import { summarizeOverview } from "./overview.js";

const rates = { input: 0.00000015, cached_input: 0.000000003, output: 0.0000006 };
const attempt = (extra: Partial<AnalysisAttempt> = {}): AnalysisAttempt => ({
  run_id: "a", harness: "alpha", version: "v1", task: "one", rep: 0, outcome: "completed",
  host: { os: "linux", cpu: "x64", ram_gb: 16 }, model: "deepseek/deepseek-v4.1-flash", price_book: "old-book",
  condition: "pinned", source: { repository: null, name: "fixture", revision: "one" }, regime: "extended",
  routing: null, configuration: null, ori_version: null, task_base_revision: "base", verifier_image: "verifier",
  environment: "env", started_iso: "2026-09-18T00:00:00Z", visibility: "partial", hashes: { run: "r", events: "e" },
  timing: null, timing_unavailable: "unreconciled", turns: 1, input_tokens: 1000000, output_tokens: 100000,
  cached_percent: 80, usage_unavailable: null, cost_usd: null, token_floor_usd: null, cost_unavailable: "unpriced-model",
  requests: [{ successful: true, input_tokens: 1000000, cached_input_tokens: 800000, output_tokens: 100000 } as AnalysisRequest],
  request_summary: emptyRequestSummary(), ...extra,
});

describe("token reference comparisons", () => {
  it("prices exact observed tokens even when the original book lacks the model, without changing evidence", () => {
    const a = attempt(); const before = JSON.stringify(a);
    expect(referenceCost(a, rates)).toBeCloseTo(0.0924, 12);
    expect(JSON.stringify(a)).toBe(before);
    expect(referenceCost(attempt({ cost_unavailable: "incomplete-accounting" }), rates)).toBeNull();
    expect(referenceCost(attempt({ usage_unavailable: "incomplete-usage" }), rates)).toBeNull();
    expect(referenceCost(attempt({ requests: [] }), rates)).toBeNull();
  });
  it("combines original books only under explicit reference prices and preserves host/model/routing boundaries", () => {
    const data = analyzeAttempts([attempt(), attempt({ run_id: "b", rep: 1, price_book: "other-book" }),
      attempt({ run_id: "host", host: { os: "darwin", cpu: "arm", ram_gb: 16 } }),
      attempt({ run_id: "model", model: "unknown" }),
      attempt({ run_id: "route", routing: { ignored_providers: ["one"] } }),
    ]);
    const groups = comparisonGroups(data);
    expect(groups).toHaveLength(4);
    expect(groups.find(g => g.attempts.length === 2)?.originals).toHaveLength(2);
    expect(data.populations).toHaveLength(5);
    expect(data.attempts[0]!.price_book).toBe("old-book");
  });
  it("scores metric directions independently and excludes incomplete coverage from the baseline", () => {
    const rows = summarizeOverview([
      attempt({ cost_usd: 0.1, cached_percent: 80, input_tokens: 100 }),
      attempt({ harness: "beta", cost_usd: 0.2, cached_percent: 40, input_tokens: 200, outcome: "verify_error" }),
      attempt({ harness: "partial", cost_usd: 0.001 }), attempt({ harness: "partial", cost_usd: null }),
    ]);
    expect(relativeMetricScore(rows[0]!, rows, "cost")).toBe(100);
    expect(relativeMetricScore(rows[1]!, rows, "cost")).toBe(50);
    expect(relativeMetricScore(rows[1]!, rows, "cache")).toBe(50);
    expect(relativeMetricScore(rows[1]!, rows, "input")).toBe(50);
    expect(relativeMetricScore(rows[2]!, rows, "cost")).toBeNull();
    const zeros = summarizeOverview([attempt({ cost_usd: 0, outcome: "verify_error" })]);
    expect(relativeMetricScore(zeros[0]!, zeros, "cost")).toBe(100);
    expect(relativeMetricScore(zeros[0]!, zeros, "pass")).toBeNull();
  });
});

it("renders a shared reference overview with original accounting below", () => {
  const data = analyzeAttempts([attempt(), attempt({ run_id: "b", rep: 1, price_book: "other-book" })]);
  const markdown = renderAnalysisMarkdown(data);
  const html = renderAnalysisHtml(data);
  expect(markdown.match(/## Comparison /g)).toHaveLength(1);
  expect(html.match(/class="population"/g)).toHaveLength(1);
  expect(markdown).toContain("100.0% of best");
  expect(markdown).toContain("$0.092");
  expect(markdown).toContain("old-book");
  expect(markdown).toContain("other-book");
  expect(html).toContain("Original accounting and detailed evidence");
});
