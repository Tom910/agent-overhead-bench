import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ConfigError } from "@aob/contracts";
import { analysisPopulationKey, type AnalysisAttempt } from "./analysis.js";
import { replayAnalysis } from "./analysis-replay.js";
import { comparisonGroups, REFERENCE_BOOK } from "./comparison-overview.js";
import { emptyRequestSummary } from "./request-analysis.js";
import { buildRepeatDiagnostics, buildValidityDiagnostics, diagnosticIntervals } from "./validity-diagnostics.js";

import { buildCollectionLedger } from "./collection-ledger.js";
import { validateTaskAudit } from "./task-audit.js";

const rates = { input: 1, cached_input: 0, output: 0 };
function attempt(harness: string, task: string, rep: number, pass: boolean): AnalysisAttempt {
  const run_id = `${harness}:${task}:${rep}`;
  return { run_id, harness, version: "v1", task, rep, outcome: pass ? "completed" : "verify_error",
    host: { os: "linux", cpu: "fixture", ram_gb: 16 }, condition: "pinned", model: "fixture", price_book: "original",
    source: { repository: null, name: "fixture", revision: "source-1" }, regime: "short", routing: null,
    configuration: null, ori_version: null, task_base_revision: "base-1", verifier_image: "image-1", environment: "env-1",
    started_iso: "2026-09-29T00:00:00Z", visibility: "partial", hashes: { run: `sha256:${createHash("sha256").update(`run:${run_id}`).digest("hex")}`, events: `sha256:${createHash("sha256").update(`events:${run_id}`).digest("hex")}` },
    timing: null, timing_unavailable: "unreconciled", turns: 0, input_tokens: null, output_tokens: null, cached_percent: null,
    usage_unavailable: "no-successful-usage", cost_usd: null, token_floor_usd: null, cost_unavailable: "incomplete-usage",
    requests: [], request_summary: emptyRequestSummary() };
}
function panel(counts: number[][], reps: number): AnalysisAttempt[] {
  return counts.flatMap((tasks, h) => tasks.flatMap((passes, task) =>
    Array.from({ length: reps }, (_, rep) => attempt(String.fromCharCode(97 + h), `task-${task}`, rep, rep < passes))));
}
function input(attempts: AnalysisAttempt[]) {
  return { attempts, rates, population_key: analysisPopulationKey({ ...attempts[0]!, price_book: REFERENCE_BOOK }) };
}
const key = (harness: string, version = "v1") => JSON.stringify([harness, version]);

describe("repeat reliability and task sensitivity", () => {
  it("counts each task once in explicit zero-through-all-pass bins", () => {
    const attempts = panel([[0, 1, 3], [3, 1, 0]], 3);
    attempts[0]!.outcome = "timeout"; attempts[1]!.outcome = "adapter_error";
    attempts[0]!.verifier_image = "image-2"; attempts[1]!.environment = "env-2";
    const result = buildRepeatDiagnostics(input(attempts));
    expect(result.repeat_bins).toEqual(["a", "b"].map(harness => ({ harness, version: "v1", bins: [
      { passes: 0, repetitions: 3, tasks: 1 }, { passes: 1, repetitions: 3, tasks: 1 },
      { passes: 2, repetitions: 3, tasks: 0 }, { passes: 3, repetitions: 3, tasks: 1 },
    ] })));
    expect(result.reliability).toHaveLength(6);
    expect(result.reliability[0]).toEqual({ harness: "a", version: "v1", task: "task-0", task_key: '["task-0","base-1"]', passes: 0, repetitions: 3,
      run_ids: ["a:task-0:0", "a:task-0:1", "a:task-0:2"], verifier_images: ["image-1", "image-2"], environments: ["env-1", "env-2"] });
    expect(result.reliability.reduce((sum, row) => sum + row.repetitions, 0)).toBe(18);
    expect(buildRepeatDiagnostics(input([...attempts].reverse()))).toEqual(result);
  });
  it("has no fixed five-repetition assumption", () => {
    const result = buildRepeatDiagnostics(input(panel([[0, 1, 2], [2, 1, 0]], 2)));
    expect(result.repeat_bins[0]!.bins).toEqual([0, 1, 2].map(passes => ({ passes, repetitions: 2, tasks: 1 })));
  });
  it("reproduces hand-computed +100,0,-50 point differences and omit ranges", () => {
    const [result] = buildRepeatDiagnostics(input(panel([[2, 1, 0], [0, 1, 1]], 2))).sensitivity;
    expect(result).toMatchObject({ left: key("a"), right: key("b"), min_pp: -25, max_pp: 50 });
    expect(result!.difference_pp).toBeCloseTo(50 / 3, 12);
    expect(result!.omitted).toEqual([-25, 25, 50].map((omitted_difference_pp, i) => ({
      left: key("a"), right: key("b"), task_key: JSON.stringify([`task-${i}`, "base-1"]), omitted_difference_pp,
    })));
  });
  it("one task has a descriptive difference and no omission range", () => {
    expect(buildRepeatDiagnostics(input(panel([[2], [0]], 2))).sensitivity).toEqual([
      { left: key("a"), right: key("b"), difference_pp: 100, omitted: [], min_pp: null, max_pp: null },
    ]);
  });
  it("retains distinct base revisions and harness versions", () => {
    const first = panel([[1], [0]], 2);
    const extra = first.map(row => ({ ...row, run_id: `${row.run_id}:base2`, task_base_revision: "base-2" }));
    expect(buildRepeatDiagnostics(input([...first, ...extra])).reliability).toHaveLength(4);
    const a = first.filter(row => row.harness === "a");
    const versions = [...a, ...a.map(row => ({ ...row, version: "v2", run_id: `${row.run_id}:v2` }))];
    const result = buildRepeatDiagnostics(input(versions));
    expect(result.repeat_bins.map(row => row.version)).toEqual(["v1", "v2"]);
    expect(result.sensitivity[0]).toMatchObject({ left: key("a", "v1"), right: key("a", "v2"), difference_pp: 0 });
  });
  it("rejects duplicate slots and unmatched task or repetition grids", () => {
    const attempts = panel([[1, 2, 3], [1, 2, 3]], 3);
    expect(() => buildRepeatDiagnostics(input([...attempts, { ...attempts[0]!, run_id: "duplicate" }]))).toThrow(ConfigError);
    expect(() => buildRepeatDiagnostics(input(attempts.slice(1)))).toThrow(/coverage/);
    expect(() => buildRepeatDiagnostics(input(attempts.filter(row => !(row.harness === "b" && row.task === "task-0"))))).toThrow(/coverage/);
    const changed = structuredClone(attempts); changed[0]!.rep = 20;
    expect(() => buildRepeatDiagnostics(input(changed))).toThrow(/coverage/);
  });
  it.each([-1, 0.5, NaN])("rejects invalid repetition %s", rep => {
    const attempts = panel([[1], [1]], 2); attempts[0]!.rep = rep;
    expect(() => buildRepeatDiagnostics(input(attempts))).toThrow(ConfigError);
  });
  it.each([
    ["model", (row: AnalysisAttempt): void => { row.model = "another"; }],
    ["host", (row: AnalysisAttempt): void => { row.host.cpu = "another"; }],
    ["source", (row: AnalysisAttempt): void => { row.source.revision = "another"; }],
    ["regime", (row: AnalysisAttempt): void => { row.regime = "extended"; }],
    ["routing", (row: AnalysisAttempt): void => { row.routing = { ignored_providers: ["another"] }; }],
    ["configuration", (row: AnalysisAttempt): void => { row.configuration = "another"; }],
  ] as const)("rejects %s outside the supplied comparison population", (_field, change) => {
    const selected = input(panel([[1], [1]], 2)); change(selected.attempts[1]!);
    expect(() => buildRepeatDiagnostics(selected)).toThrow(/population/);
  });
  it("normalizes only the price-book component when reference rates exist", () => {
    const attempts = panel([[1], [1]], 2); attempts[0]!.price_book = "other-original";
    const before = JSON.stringify(attempts);
    expect(buildRepeatDiagnostics(input(attempts)).reliability).toHaveLength(2);
    expect(JSON.stringify(attempts)).toBe(before);
    expect(() => buildRepeatDiagnostics({ attempts, rates: null, population_key: analysisPopulationKey(attempts[0]!) })).toThrow(/population/);
  });
  it.each([{ dataset: "linux-results-2026-09-19-r1", reps: 5, passes: 105 }, { dataset: "linux-results-2026-10-24", reps: 2, passes: 44 }])("shows all pass bins for $dataset with $reps repetitions", ({ dataset, reps, passes }) => {
    const data = replayAnalysis(JSON.parse(readFileSync(new URL(`../../../evidence/${dataset}/analysis.json`, import.meta.url), "utf8")));
    const [group] = comparisonGroups(data);
    const result = buildRepeatDiagnostics({ attempts: group!.attempts, rates: group!.rates, population_key: group!.key });
    expect(result.repeat_bins).toHaveLength(5);
    for (const row of result.repeat_bins) {
      expect(row.bins.map(bin => bin.passes)).toEqual(Array.from({ length: reps + 1 }, (_, i) => i));
      expect(row.bins.every(bin => bin.repetitions === reps)).toBe(true);
      expect(row.bins.reduce((sum, bin) => sum + bin.tasks, 0)).toBe(8);
    }
    expect(result.reliability.reduce((sum, row) => sum + row.passes, 0)).toBe(passes);
    expect(result.reliability.reduce((sum, row) => sum + row.repetitions, 0)).toBe(5 * 8 * reps);
  });
});

const intervalRates = { input: 0.1, cached_input: 0, output: 0 };
function pricedPanel(): AnalysisAttempt[] {
  return [1, 3, 5, 7].map((cost, i) => {
    const row = attempt("a", `task-${Math.floor(i / 2)}`, i % 2, i % 2 === 0);
    return { ...row, input_tokens: 10 * cost, output_tokens: 2 * cost, usage_unavailable: null, cost_unavailable: null,
      cost_usd: cost, requests: [{ successful: true, input_tokens: 10 * cost, cached_input_tokens: 0, output_tokens: 2 * cost } as AnalysisAttempt["requests"][number]] };
  });
}
describe("secondary task-cluster mean intervals", () => {
  it("reproduces hand-calculated means and two-task bootstrap endpoints", () => {
    const attempts = pricedPanel(), result = diagnosticIntervals(attempts, intervalRates);
    expect(result).toEqual([{ harness: "a", version: "v1",
      reference_cost_mean: { estimate: 4, lower: 2, upper: 6, task_clusters: 2, measured: 4, missing: 0, method: "task-cluster-percentile-10000" },
      input_tokens_mean: { estimate: 40, lower: 20, upper: 60, task_clusters: 2, measured: 4, missing: 0, method: "task-cluster-percentile-10000" },
      output_tokens_mean: { estimate: 8, lower: 4, upper: 12, task_clusters: 2, measured: 4, missing: 0, method: "task-cluster-percentile-10000" },
    }]);
    expect(JSON.stringify(diagnosticIntervals(attempts, intervalRates))).toBe(JSON.stringify(result));
    expect(diagnosticIntervals([...attempts].reverse(), intervalRates)).toEqual(result);
  });
  it("moves all repetitions together and weights tasks equally", () => {
    const attempts = pricedPanel(); attempts[1]!.task = "task-1"; attempts[1]!.rep = 2;
    const [result] = diagnosticIntervals(attempts, intervalRates);
    expect(result!.reference_cost_mean).toMatchObject({ estimate: 3, lower: 1, upper: 5, task_clusters: 2, measured: 4 });
    expect(result!.input_tokens_mean.estimate).toBe(30);
  });
  it("does not drop an incomplete cost from its task while keeping complete tokens", () => {
    const attempts = pricedPanel(); attempts[0]!.cost_unavailable = "incomplete-accounting";
    const [result] = diagnosticIntervals(attempts, intervalRates);
    expect(result!.reference_cost_mean).toMatchObject({ estimate: null, lower: null, upper: null, measured: 3, missing: 1, task_clusters: 2 });
    expect(result!.input_tokens_mean).toMatchObject({ estimate: 40, measured: 4, missing: 0 });
    expect(result!.output_tokens_mean.estimate).toBe(8);
  });
  it.each(["input_tokens", "output_tokens"] as const)("missing %s blocks only its own token metric", metric => {
    const attempts = pricedPanel(); attempts[0]![metric] = null;
    const [result] = diagnosticIntervals(attempts, intervalRates);
    const interval = metric === "input_tokens" ? result!.input_tokens_mean : result!.output_tokens_mean;
    const other = metric === "input_tokens" ? result!.output_tokens_mean : result!.input_tokens_mean;
    expect(interval).toMatchObject({ estimate: null, lower: null, upper: null, measured: 3, missing: 1 });
    expect(other).toMatchObject({ measured: 4, missing: 0 }); expect(other.estimate).not.toBeNull();
  });
  it("one distinct task has a point estimate but no bounds", () => {
    const [result] = diagnosticIntervals(pricedPanel().slice(0, 2), intervalRates);
    expect(result!.reference_cost_mean).toMatchObject({ estimate: 2, lower: null, upper: null, task_clusters: 1, measured: 2, missing: 0 });
  });
  it("does not relabel original costs as reference costs when rates are absent", () => {
    const [result] = diagnosticIntervals(pricedPanel(), null);
    expect(result!.reference_cost_mean).toMatchObject({ estimate: null, lower: null, upper: null, measured: 0, missing: 4 });
    expect(result!.input_tokens_mean.estimate).toBe(40);
  });
  it("keeps versions separate and rejects mixed populations or invalid observations", () => {
    const attempts = pricedPanel(), other = attempts.map(row => ({ ...row, version: "v2", run_id: `${row.run_id}:v2` }));
    expect(diagnosticIntervals([...attempts, ...other], intervalRates).map(row => row.version)).toEqual(["v1", "v2"]);
    other[0]!.model = "other";
    expect(() => diagnosticIntervals([...attempts, ...other], intervalRates)).toThrow(/population/);
    attempts[0]!.input_tokens = NaN;
    expect(() => diagnosticIntervals(attempts, intervalRates)).toThrow(ConfigError);
  });
});

function diagnosticsFixture() {
  const bytes = readFileSync(new URL("../../../evidence/linux-results-2026-09-19-r1/analysis.json", import.meta.url));
  const data = replayAnalysis(JSON.parse(bytes.toString()));
  const group = comparisonGroups(data)[0]!;
  const document = JSON.parse(readFileSync(new URL("../../../evidence/task-verification-2026-09-21/audit.json", import.meta.url), "utf8"));
  const manifest = JSON.parse(readFileSync(new URL("../../../task-revisions/2026-09-21/manifest.json", import.meta.url), "utf8"));
  const hashes = Object.fromEntries(manifest.tasks.map((row: { task: string; amended_test_patch_sha256: string }) => [row.task, row.amended_test_patch_sha256]));
  const dataset = "linux-results-2026-09-19-r1";
  return { dataset, analysis_sha256: `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
    attempts: data.attempts, population_key: group.key, rates: group.rates,
    audit: validateTaskAudit(data.attempts, document, hashes), audit_dataset: "task-verification-2026-09-21",
    collection: buildCollectionLedger({ selected: data.attempts, superseded: [], interrupted: [], selected_dataset: dataset, prior_dataset: null, rates: group.rates }) };
}
describe("evidence-bound failure diagnostics", () => {
  it("labels only the four audited false negatives while preserving all original outcomes", () => {
    const f = diagnosticsFixture(), result = buildValidityDiagnostics(f);
    expect(result).toMatchObject({ schema_version: 1, dataset: f.dataset, analysis_sha256: f.analysis_sha256,
      population_key: f.population_key, reference_book: REFERENCE_BOOK, original_grades: true,
      audit_coverage: { audited: 75, reproduced: 33, corrected: 13, unavailable: 42, changed: 4 } });
    expect(result.failures.filter(row => row.category === "pass")).toHaveLength(105);
    const confirmed = result.failures.filter(row => row.category === "confirmed-verifier-false-negative");
    expect(confirmed).toHaveLength(4);
    for (const label of confirmed) {
      expect(label.original_outcome).toBe("verify_error"); expect(label.audit_dataset).toBe(f.audit_dataset);
      expect(label.evidence).toEqual(f.audit.changes.find(row => row.run_id === label.run_id)!.evidence);
    }
    expect(result.failures.find(row => row.run_id === "pinned:hermes:ink-grid-box-layout:2:hermes-linux-20260915")).toMatchObject({ original_outcome: "verify_error", category: "verification-unknown", audit_dataset: null, evidence: [] });
    expect(result.failures.filter(row => row.category === "verification-unknown")).toHaveLength(91);
    expect(result.reliability.reduce((sum, row) => sum + row.passes, 0)).toBe(105);
    expect(result.uncertainty).toHaveLength(5);
    expect(f.attempts.filter(row => row.outcome === "completed")).toHaveLength(105);
  });
  it("retains timeout/adapter observations and makes no causal guesses without an audit", () => {
    const attempts = panel([[1, 0]], 2); attempts[1]!.outcome = "timeout"; attempts[2]!.outcome = "adapter_error";
    const result = buildValidityDiagnostics({ ...input(attempts), dataset: "fixture", analysis_sha256: "sha256:" + "0".repeat(64), audit: null, audit_dataset: null,
      collection: buildCollectionLedger({ selected: attempts, superseded: [], interrupted: [], selected_dataset: "fixture", prior_dataset: null, rates }) });
    expect(result.failures.map(row => row.category)).toEqual(["pass", "timeout", "adapter-observation", "verification-unknown"]);
    expect(result.failures.every(row => row.audit_dataset === null && row.evidence.length === 0)).toBe(true);
    expect(result.audit_coverage).toBeNull();
  });
  it.each(["run_id", "run_sha256", "task", "harness", "rep", "verifier_image", "original", "corrected", "evidence", "duplicate", "audit_dataset", "collection", "reference_book"])("rejects detached %s evidence", field => {
    const f = diagnosticsFixture(), c = f.audit.changes[0]!;
    if (field === "run_id" || field === "run_sha256" || field === "task" || field === "harness" || field === "verifier_image") c[field] = "other";
    if (field === "rep") c.rep = 99;
    if (field === "original") c.original = 1;
    if (field === "corrected") c.corrected = 0;
    if (field === "evidence") c.evidence = [];
    if (field === "duplicate") f.audit.changes.push(c);
    if (field === "audit_dataset") f.audit_dataset = "other";
    if (field === "collection") f.collection.items[0]!.events_sha256 = "sha256:" + "0".repeat(64);
    if (field === "reference_book") f.collection.reference_book = null;
    expect(() => buildValidityDiagnostics(f)).toThrow(ConfigError);
  });
});
