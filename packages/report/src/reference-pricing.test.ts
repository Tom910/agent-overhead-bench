import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { ConfigError } from "@aob/contracts";
import { referenceBookForAttempts } from "./reference-pricing.js";
import { analyzeAttempts, type AnalysisAttempt } from "./analysis.js";
import { summarizeRequests } from "./request-analysis.js";
import { comparisonGroups, referenceCost } from "./comparison-overview.js";
import { buildCollectionLedger } from "./collection-ledger.js";
import { buildValidityDiagnostics } from "./validity-diagnostics.js";
import { buildDecisionRows } from "./workload-decision.js";
import { buildDecisionSiteData } from "./validated-campaign-registry.js";
import { renderAnalysisHtml } from "./analysis-render.js";

const io = vi.hoisted(() => ({ original: null as typeof import("node:fs").readFileSync | null }));
vi.mock("node:fs", async () => {
  const actual = await vi.importActual<typeof import("node:fs")>("node:fs");
  io.original = actual.readFileSync;
  return { ...actual, readFileSync: vi.fn(actual.readFileSync) };
});
afterEach(() => { vi.mocked(readFileSync).mockReset().mockImplementation(io.original!); });

const MODEL = "deepseek/deepseek-v4.1-flash-1017", BOOK = "deepseek-v41-1017-reference-2026-10-18";
const hash = (value: string) => `sha256:${createHash("sha256").update(value).digest("hex")}`;
function fixture(): AnalysisAttempt[] {
  return ["cline", "codex"].flatMap(harness => ["one", "two"].flatMap(task => [0, 1].map(rep => {
    const id = `${harness}:${task}:${rep}`;
    const requests: AnalysisAttempt["requests"] = [{ seq: 0, t_start_ms: 0, t_end_ms: 50, duration_ms: 50, wait_ms: 10,
      transfer_ms: 40, gap_before_ms: null, status: 200, streamed: true, successful: true,
      input_tokens: 1_000_000, cached_input_tokens: 800_000, output_tokens: 100_000, cost_usd: 7, token_floor_usd: 8 }];
    return { run_id: id, harness, version: "v1", task, rep, outcome: harness === "cline" ? "verify_error" : "completed",
      host: { os: "linux", cpu: "fixture", ram_gb: 16 }, condition: "pinned", model: MODEL, price_book: "original-source-book",
      source: { repository: null, name: "fixture", revision: "source" }, regime: "extended", routing: null, configuration: null,
      ori_version: null, task_base_revision: "base", verifier_image: "image", environment: "env", started_iso: "2026-10-24T00:00:00Z",
      visibility: "partial", hashes: { run: hash(id), events: hash(`events:${id}`) },
      timing: { end_to_end: 100, startup: 0, model_time: 50, non_model_time: 50, tool_time: null, harness_time: null,
        sum_request_durations: 50, parallelism: 1, first_byte_ms: 10, unreconciled: false }, timing_unavailable: null,
      turns: 1, input_tokens: 1_000_000, output_tokens: 100_000, cached_percent: 80, usage_unavailable: null,
      cost_usd: 7, token_floor_usd: 8, cost_unavailable: null, requests, request_summary: summarizeRequests(requests) };
  })));
}
function pipeline(attempts = fixture()) {
  const analysis = analyzeAttempts(attempts), group = comparisonGroups(analysis)[0]!;
  expect(group.rates, "1017 must use its approved reference book").not.toBeNull();
  const dataset = "fixture-1017", analysis_sha256 = hash(JSON.stringify(analysis));
  const collection = buildCollectionLedger({ selected: attempts, superseded: [], interrupted: [], selected_dataset: dataset, prior_dataset: null, rates: group.rates });
  const diagnostics = buildValidityDiagnostics({ dataset, analysis_sha256, attempts, population_key: group.key, rates: group.rates, collection, audit: null, audit_dataset: null });
  return { attempts, analysis, group, dataset, analysis_sha256, collection, diagnostics };
}
describe("approved 1017 reference costs", () => {
  it("carries exact cached-token prices and book identity through every report boundary", () => {
    const attempts = fixture(), before = JSON.stringify(attempts), f = pipeline(attempts);
    expect(f.group.reference_book).toBe(BOOK); expect(referenceCost(attempts[0]!, f.group.rates!)).toBeCloseTo(0.0924, 12);
    expect(f.collection.reference_book).toBe(BOOK); expect(f.collection.known_reference_usd).toBeCloseTo(0.7392, 12);
    expect(f.diagnostics.reference_book).toBe(BOOK);
    expect(f.diagnostics.uncertainty.map(row => row.reference_cost_mean.estimate)).toEqual([0.0924, 0.0924]);
    const rows = buildDecisionRows({ analysis_sha256: f.analysis_sha256, attempts, rates: f.group.rates, diagnostics: f.diagnostics,
      audit: null, audit_dataset: null, scope: { id: "all", label: "All", task_keys: [JSON.stringify(["one", "base"]), JSON.stringify(["two", "base"])] },
      selection: { population_key: f.group.key, workload_id: "all", reference_harness: JSON.stringify(["cline", "v1"]) } });
    expect(rows.map(row => row.reference_cost.complete_mean_usd)).toEqual([0.0924, 0.0924]);
    expect(rows.map(row => row.passes)).toEqual([0, 4]);
    const { panels } = buildDecisionSiteData([{ dataset: f.dataset, analysis_sha256: f.analysis_sha256, analysis: f.analysis, diagnostics: f.diagnostics,
      evidence: { audit: null, audit_dataset: null, conditions: null, conditions_dataset: null }, groups: [f.group] }]);
    expect(panels).toHaveLength(1); expect(panels[0]!.reference_book).toBe(BOOK);
    expect(panels[0]!.cards[0]!.rows[0]!.reference_cost.complete_mean_usd).toBeCloseTo(0.0924, 12);
    expect(renderAnalysisHtml(f.analysis)).toContain(BOOK);
    expect(JSON.stringify(attempts)).toBe(before);
  });
});

it("keeps missing usage and unresolved failed charges out of complete means", () => {
  for (const missing of ["usage", "accounting"] as const) {
    const attempts = fixture();
    if (missing === "usage") { attempts[0]!.usage_unavailable = "incomplete-usage"; attempts[0]!.requests[0]!.input_tokens = null; }
    else attempts[0]!.cost_unavailable = "incomplete-accounting";
    const f = pipeline(attempts);
    expect(referenceCost(attempts[0]!, f.group.rates!)).toBeNull();
    expect(f.collection.missing_cost_count).toBe(1); expect(f.collection.complete_total_usd).toBeNull();
    expect(f.diagnostics.uncertainty[0]!.reference_cost_mean).toMatchObject({ estimate: null, missing: 1 });
  }
});
it("rejects a foreign diagnostic book, changed 1017 coefficients and mixed books", () => {
  const f = pipeline();
  expect(() => buildValidityDiagnostics({ dataset: f.dataset, analysis_sha256: f.analysis_sha256, attempts: f.attempts,
    population_key: f.group.key, rates: f.group.rates, collection: { ...f.collection, reference_book: "deepseek-v41-low-2026-09-10" }, audit: null, audit_dataset: null })).toThrow(ConfigError);
  expect(() => referenceBookForAttempts(f.attempts, { ...f.group.rates!, input: f.group.rates!.input * 2 })).toThrow(ConfigError);
  expect(() => referenceBookForAttempts([{ model: MODEL }, { model: "deepseek/deepseek-v4.1-flash" }], f.group.rates)).toThrow(ConfigError);
  expect(() => referenceBookForAttempts(f.attempts, { ...f.group.rates!, output: NaN })).toThrow(ConfigError);
});
it("preserves legacy book identity and explicit hypothetical rates", () => {
  const attempts = fixture().map(a => ({ ...a, model: "deepseek/deepseek-v4.1-flash", price_book: "original-book" }));
  const group = comparisonGroups(analyzeAttempts(attempts))[0]!;
  expect(group.reference_book).toBe("deepseek-v41-low-2026-09-10");
  expect(referenceCost(attempts[0]!, group.rates!)).toBeCloseTo(0.0924, 12);
  expect(referenceBookForAttempts([{ model: "legacy-custom-fixture" }], { input: 1, cached_input: 0, output: 2 })).toBe("deepseek-v41-low-2026-09-10");
  expect(comparisonGroups(analyzeAttempts([{ ...attempts[0]!, model: "unknown" }]))[0]!.rates).toBeNull();
});
it.each(["{", JSON.stringify({ id: "wrong-book", models: {} }), JSON.stringify({ id: BOOK, models: { [MODEL]: { input: -1, cached_input: 0, output: 1 } } })])("rejects invalid book content without relabeling it", content => {
  vi.mocked(readFileSync).mockReturnValueOnce(content);
  expect(() => comparisonGroups(analyzeAttempts(fixture()))).toThrow(ConfigError);
});
it("leaves a missing 1017 model price unavailable", () => {
  vi.mocked(readFileSync).mockReturnValueOnce(JSON.stringify({ id: BOOK, models: {} }));
  const group = comparisonGroups(analyzeAttempts(fixture()))[0]!;
  expect(group.rates).toBeNull(); expect(group.reference_book).toBeNull();
});
