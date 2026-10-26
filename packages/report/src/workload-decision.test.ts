import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ConfigError } from "@aob/contracts";
import type { PriceRates } from "./aggregate.js";
import { analysisPopulationKey, type AnalysisAttempt } from "./analysis.js";
import { replayAnalysis } from "./analysis-replay.js";
import { validateTaskAudit } from "./task-audit.js";
import { comparisonGroups, REFERENCE_BOOK } from "./comparison-overview.js";
import { buildCollectionLedger } from "./collection-ledger.js";
import { summarizeRequests } from "./request-analysis.js";
import { buildValidityDiagnostics, type ValidityDiagnostics } from "./validity-diagnostics.js";
import { buildDecisionCard, buildDecisionCards, buildDecisionRows, type DecisionInput } from "./workload-decision.js";

const rates: PriceRates = { input: 1, cached_input: 0, output: 0 };
const hash = (s: string) => `sha256:${createHash("sha256").update(s).digest("hex")}`;
const taskKey = (task: string) => JSON.stringify([task, "base"]);
const harnessKey = (harness: string, version = "v1") => JSON.stringify([harness, version]);
function attempt(harness: string, task: string, rep: number, minutes: number, outcome: AnalysisAttempt["outcome"]): AnalysisAttempt {
  const id = `${harness}:${task}:${rep}`, ms = minutes * 60_000;
  const requests: AnalysisAttempt["requests"] = [{ seq: 0, t_start_ms: 0, t_end_ms: ms / 2, duration_ms: ms / 2,
    wait_ms: 0, transfer_ms: ms / 2, gap_before_ms: null, status: 200, streamed: true, successful: true,
    input_tokens: minutes, cached_input_tokens: 0, output_tokens: 2 * minutes, cost_usd: minutes, token_floor_usd: minutes }];
  return { run_id: id, harness, version: "v1", task, rep, outcome, host: { os: "linux", cpu: "fixture", ram_gb: 16 }, condition: "pinned",
    model: "fixture-model", price_book: "original", source: { repository: null, name: "fixture", revision: "source" }, regime: "short",
    routing: null, configuration: null, ori_version: null, task_base_revision: "base", verifier_image: "image", environment: "env",
    started_iso: "2026-09-29T00:00:00Z", visibility: "partial", hashes: { run: hash(`run:${id}`), events: hash(`events:${id}`) },
    timing: { end_to_end: ms, startup: 0, model_time: ms / 2, non_model_time: ms / 2, tool_time: null, harness_time: null,
      sum_request_durations: ms / 2, parallelism: 1, first_byte_ms: 0, unreconciled: false }, timing_unavailable: null,
    turns: 1, input_tokens: minutes, output_tokens: minutes * 2, cached_percent: 0, usage_unavailable: null,
    cost_usd: minutes, token_floor_usd: minutes, cost_unavailable: null, requests, request_summary: summarizeRequests(requests) };
}
function panel(): AnalysisAttempt[] {
  return ["a", "b"].flatMap(h => [1, 2, 3, 4, 20].map((m, rep) => attempt(h, "task", rep, m,
    h === "a" && rep === 0 ? "verify_error" : h === "a" && rep === 1 ? "timeout" : "completed")));
}
function fixture(attempts = panel(), prices: PriceRates | null = rates): DecisionInput {
  const dataset = "fixture", analysis_sha256 = hash(JSON.stringify(attempts));
  const population_key = analysisPopulationKey(prices === null ? attempts[0]! : { ...attempts[0]!, price_book: REFERENCE_BOOK });
  const diagnostics = buildValidityDiagnostics({ dataset, analysis_sha256, attempts, population_key, rates: prices, audit: null, audit_dataset: null,
    collection: buildCollectionLedger({ selected: attempts, superseded: [], interrupted: [], selected_dataset: dataset, prior_dataset: null, rates: prices }) });
  return { analysis_sha256, attempts, rates: prices, diagnostics, audit: null, audit_dataset: null,
    scope: { id: "all", label: "All selected tasks", task_keys: [...new Set(attempts.map(a => taskKey(a.task)))] },
    selection: { population_key, workload_id: "all", reference_harness: harnessKey("a") } };
}
it("builds reference alternatives together without changing signs, counts or reference validation", () => {
  const cards = buildDecisionCards(fixture(), [harnessKey("a"), harnessKey("b")]);
  expect(cards.map(c => c.differences.map(d => d.pass_pp))).toEqual([[0, 40], [-40, 0]]);
  expect(cards.map(c => c.rows.map(r => [r.passes, r.selected]))).toEqual([[[3, 5], [5, 5]], [[3, 5], [5, 5]]]);
  expect(() => buildDecisionCards(fixture(), [harnessKey("missing")])).toThrow(ConfigError);
  cards[0]!.rows[0]!.passes = 99;
  expect(cards[1]!.rows[0]!.passes).toBe(3);
});
describe("workload rows with explicit outcome and metric denominators", () => {
  it("includes failures in cost and all-outcome timing while separating successful timing", () => {
    const rows = buildDecisionRows(fixture()), a = rows[0]!;
    expect(rows.map(row => [row.harness, row.version])).toEqual([["a", "v1"], ["b", "v1"]]);
    expect(a).toMatchObject({ selected: 5, passes: 3, outcomes: { completed: 3, verify_error: 1, timeout: 1, adapter_error: 0 },
      reference_cost: { complete_mean_usd: 6, known_lower_bound_usd: 30, measured: 5, missing: 0 },
      agent_e2e_all: { n: 5, missing: 0, median: 180_000 }, agent_e2e_pass: { n: 3, missing: 0, median: 240_000 },
      reference_cost_interval: { estimate: 6, lower: null, upper: null, measured: 5, missing: 0, task_clusters: 1 },
      input_tokens: { median: 3 }, input_tokens_mean_interval: { estimate: 6 },
      request_count: { median: 1, n: 5 }, api_active_ms: { median: 90_000 }, non_model_ms: { median: 90_000 },
      visibility: { none: 0, partial: 5, full: 0 } });
    expect(a.run_ids).toEqual([0, 1, 2, 3, 4].map(rep => `a:task:${rep}`));
    expect(a.failure_labels.map(row => row.category)).toEqual(["verification-unknown", "timeout", "pass", "pass", "pass"]);
  });
  it("keeps a zero-pass workload's successful timing unavailable", () => {
    const attempts = panel(); for (const a of attempts) if (a.harness === "a") a.outcome = "verify_error";
    const [row] = buildDecisionRows(fixture(attempts));
    expect(row).toMatchObject({ passes: 0, agent_e2e_all: { n: 5, median: 180_000 }, agent_e2e_pass: { n: 0, missing: 0, median: null, q1: null, q3: null, min: null, max: null } });
  });
  it("reports missing timing without treating it as a zero-duration attempt", () => {
    const attempts = panel(); attempts[4]!.timing = null; attempts[4]!.timing_unavailable = "unreconciled";
    const [row] = buildDecisionRows(fixture(attempts));
    expect(row).toMatchObject({ agent_e2e_all: { n: 4, missing: 1, median: 150_000 }, agent_e2e_pass: { n: 2, missing: 1, median: 210_000 },
      api_active_ms: { n: 4, missing: 1 }, non_model_ms: { n: 4, missing: 1 } });
  });
  it("keeps known cost and coverage when one selected failure has incomplete accounting", () => {
    const attempts = panel(); attempts[0]!.cost_unavailable = "incomplete-accounting";
    const [row] = buildDecisionRows(fixture(attempts));
    expect(row).toMatchObject({ reference_cost: { complete_mean_usd: null, known_lower_bound_usd: 30, measured: 4, missing: 1 },
      reference_cost_interval: { estimate: null, lower: null, upper: null, measured: 4, missing: 1 }, input_tokens_mean_interval: { estimate: 6 } });
  });
  it("does not relabel original prices when shared rates are unavailable", () => {
    const [row] = buildDecisionRows(fixture(panel(), null));
    expect(row).toMatchObject({ reference_cost: { complete_mean_usd: null, known_lower_bound_usd: null, measured: 0, missing: 5 },
      reference_cost_interval: { estimate: null, measured: 0, missing: 5 } });
  });
  it("weights task means equally and computes intervals only over the chosen scope", () => {
    const attempts = ["a", "b"].flatMap(h => [attempt(h, "one", 0, 1, "completed"),
      ...[3, 5, 7].map((cost, rep) => attempt(h, "two", rep, cost, "completed"))]);
    const f = fixture(attempts), [all] = buildDecisionRows(f);
    expect(all!.reference_cost).toEqual({ complete_mean_usd: 3, known_lower_bound_usd: 16, measured: 4, missing: 0 });
    expect(all!.reference_cost_interval).toMatchObject({ estimate: 3, lower: 1, upper: 5, task_clusters: 2 });
    f.scope = { id: "two", label: "Task two", task_keys: [taskKey("two")] }; f.selection.workload_id = "two";
    const [two] = buildDecisionRows(f);
    expect(two).toMatchObject({ selected: 3, reference_cost: { complete_mean_usd: 5, known_lower_bound_usd: 15 }, reference_cost_interval: { task_clusters: 1, lower: null, upper: null } });
    expect(two!.run_ids).toEqual([0, 1, 2].map(rep => `a:two:${rep}`));
  });
  it("retains distinct versions with unambiguous reference choices and does not mutate inputs", () => {
    const attempts = panel(), other = attempts.filter(a => a.harness === "a").map(a => ({ ...structuredClone(a), version: "v2", run_id: `${a.run_id}:v2`, hashes: { run: hash(`${a.run_id}:v2`), events: hash(`${a.run_id}:v2:events`) } }));
    const f = fixture([...attempts, ...other]), before = JSON.stringify(f);
    expect(buildDecisionRows(f).map(row => [row.harness, row.version])).toEqual([["a", "v1"], ["a", "v2"], ["b", "v1"]]);
    expect(JSON.stringify(f)).toBe(before);
  });
  it.each(["duplicate-member", "missing-member", "empty-scope", "wrong-scope", "source-hash", "population", "model", "configuration", "duplicate-slot", "unmatched-grid", "reference", "diagnostic-label", "diagnostic-artifact"])("rejects %s drift instead of changing denominators", change => {
    const f = fixture();
    if (change === "duplicate-member") f.scope.task_keys.push(f.scope.task_keys[0]!);
    if (change === "missing-member") f.scope.task_keys.push(taskKey("missing"));
    if (change === "empty-scope") f.scope.task_keys = [];
    if (change === "wrong-scope") f.selection.workload_id = "other";
    if (change === "source-hash") f.diagnostics.analysis_sha256 = hash("different");
    if (change === "population") f.selection.population_key = "other";
    if (change === "model") f.attempts[0]!.model = "other";
    if (change === "configuration") f.attempts[0]!.configuration = "other";
    if (change === "duplicate-slot") f.attempts = [...f.attempts, f.attempts[0]!];
    if (change === "unmatched-grid") f.attempts = f.attempts.slice(1);
    if (change === "reference") f.selection.reference_harness = "a";
    if (change === "diagnostic-label") f.diagnostics.failures[0]!.original_outcome = "completed";
    if (change === "diagnostic-artifact") f.diagnostics.collection.items.find(row => row.class === "selected")!.events_sha256 = hash("different");
    expect(() => buildDecisionRows(f)).toThrow(ConfigError);
  });
});

function auditedFixture(): DecisionInput {
  const root = new URL("../../../", import.meta.url);
  const read = (path: string) => JSON.parse(readFileSync(new URL(path, root), "utf8"));
  const data = replayAnalysis(read("evidence/linux-results-2026-09-19-r1/analysis.json")), group = comparisonGroups(data)[0]!;
  const diagnostics = read("evidence/linux-results-2026-09-19-r1/diagnostics.json") as ValidityDiagnostics;
  const manifest = read("task-revisions/2026-09-21/manifest.json");
  const hashes = Object.fromEntries(manifest.tasks.map((row: { task: string; amended_test_patch_sha256: string }) => [row.task, row.amended_test_patch_sha256]));
  const audit = validateTaskAudit(data.attempts, read("evidence/task-verification-2026-09-21/audit.json"), hashes);
  const textual = data.attempts.find(a => a.task === "textual-richlog-follow-state")!;
  return { analysis_sha256: diagnostics.analysis_sha256, attempts: data.attempts, diagnostics, audit, audit_dataset: audit.revision, rates: group.rates,
    scope: { id: "textual", label: "Textual", task_keys: [JSON.stringify([textual.task, textual.task_base_revision])] },
    selection: { population_key: group.key, workload_id: "textual", reference_harness: harnessKey(textual.harness, textual.version) } };
}
describe("workload differences and separate audit", () => {
  it("expresses signed differences against the selected reference in pp, dollars and milliseconds", () => {
    const attempts = panel().map(a => a.harness === "b" ? attempt("b", a.task, a.rep, [2, 4, 6, 8, 40][a.rep]!, "completed") : a);
    const f = fixture(attempts), card = buildDecisionCard(f);
    expect(card.differences.find(row => row.harness === harnessKey("b"))).toMatchObject({ reference_harness: harnessKey("a"),
      pass_pp: 40, pass_interval_pp: null, cost_usd: 6, cost_percent: 100, e2e_all_median_ms: 180_000, e2e_all_percent: 100 });
    expect(card.differences[0]!.coverage_note).toContain("Reference row");
    expect(card.differences[1]!.coverage_note).toContain("one task; interval unavailable");
    expect(card).toMatchObject({ population_key: f.selection.population_key, workload: f.scope, original_grades: true, audit: null, audit_dataset: null, diagnostic_dataset: "fixture" });
    f.selection.reference_harness = harnessKey("b");
    expect(buildDecisionCard(f).differences.find(row => row.harness === harnessKey("a"))).toMatchObject({ pass_pp: -40, cost_usd: -6, cost_percent: -50, e2e_all_median_ms: -180_000, e2e_all_percent: -50 });
  });
  it("uses paired task clusters and reverses confidence bounds with the reference", () => {
    const attempts = ["a", "b"].flatMap(h => ["one", "two"].flatMap(task => [0, 1].map(rep => attempt(h, task, rep, 1,
      task === "one" ? h === "a" ? "completed" : "verify_error" : h === "b" || rep === 0 ? "completed" : "verify_error"))));
    const f = fixture(attempts);
    expect(buildDecisionCard(f).differences[1]).toMatchObject({ pass_pp: -25, pass_interval_pp: [-100, 50] });
    f.selection.reference_harness = harnessKey("b");
    expect(buildDecisionCard(f).differences[0]).toMatchObject({ pass_pp: 25, pass_interval_pp: [-50, 100] });
  });
  it("keeps pass differences task weighted when tasks have different repetition counts", () => {
    const attempts = ["a", "b"].flatMap(h => [attempt(h, "one", 0, 1, h === "a" ? "completed" : "verify_error"),
      ...[0, 1, 2].map(rep => attempt(h, "two", rep, 1, h === "b" ? "completed" : "verify_error"))]);
    const card = buildDecisionCard(fixture(attempts));
    expect(card.rows.map(row => row.passes)).toEqual([1, 3]);
    expect(card.differences[1]).toMatchObject({ pass_pp: 0, pass_interval_pp: [-100, 100] });
    expect(card.evidence_note).toContain("equal task weights");
  });
  it("retains raw differences but does not divide by a zero baseline", () => {
    const attempts = panel().map(a => attempt(a.harness, a.task, a.rep, a.harness === "a" ? 0 : 2, a.outcome));
    const other = buildDecisionCard(fixture(attempts)).differences[1]!;
    expect(other).toMatchObject({ cost_usd: 2, cost_percent: null, e2e_all_median_ms: 120_000, e2e_all_percent: null });
    expect(other.coverage_note).toContain("zero");
  });
  it("does not compare incomplete cost or timing observations", () => {
    const attempts = panel(); attempts[0]!.cost_unavailable = "incomplete-accounting"; attempts[0]!.timing = null;
    const other = buildDecisionCard(fixture(attempts)).differences[1]!;
    expect(other).toMatchObject({ cost_usd: null, cost_percent: null, e2e_all_median_ms: null, e2e_all_percent: null });
    expect(other.coverage_note).toContain("cost coverage"); expect(other.coverage_note).toContain("timing coverage");
  });
  it("describes measured scope, repeat counts, mixed images and configuration uncertainty", () => {
    const attempts = panel(); attempts[1]!.verifier_image = "rebuilt-image";
    const card = buildDecisionCard(fixture(attempts));
    expect(card.evidence_note).toContain("1 distinct task"); expect(card.evidence_note).toContain("5 repetitions");
    expect(card.evidence_note).toContain("Verifier image/environment identities differ");
    expect(card.evidence_note).toContain("configuration details are unavailable");
    expect(card.evidence_note).toContain("not causal");
    expect(card.evidence_note).toContain("Exploratory 95%");
    expect(card.evidence_note).toContain("means, not headline token medians");
  });
  it("retains original Textual counts beside the bound partial-coverage audit", () => {
    const f = auditedFixture(), before = JSON.stringify(f), card = buildDecisionCard(f);
    expect(card.rows.map(row => [row.harness, row.passes, row.selected])).toEqual([["cline", 1, 5], ["codex", 0, 5], ["hermes", 1, 5], ["pi", 3, 5], ["qwen", 1, 5]]);
    expect(card.audit).toMatchObject({ revision: "task-verification-2026-09-21", audited: 75, reproduced: 33, corrected: 13, unavailable: 42 });
    expect(card.audit!.changes).toHaveLength(4);
    expect(card.rows.flatMap(row => row.failure_labels).filter(label => label.category === "confirmed-verifier-false-negative")).toHaveLength(4);
    expect(card.audit_dataset).toBe("task-verification-2026-09-21");
    expect(card.rows.reduce((sum, row) => sum + row.selected, 0)).toBe(25);
    expect(card.evidence_note).toContain("Original grades remain unchanged");
    expect(JSON.stringify(f)).toBe(before);
  });
  it.each(["no-audit", "audit-hash", "audit-dataset", "claim", "coverage"])("rejects an unbound %s claim", change => {
    const f = auditedFixture();
    if (change === "no-audit") { f.audit = null; f.audit_dataset = null; }
    if (change === "audit-hash") f.audit!.changes[0]!.run_sha256 = hash("other");
    if (change === "audit-dataset") f.audit_dataset = "other";
    if (change === "claim") f.diagnostics.failures.find(row => row.category === "confirmed-verifier-false-negative")!.evidence = [];
    if (change === "coverage") f.diagnostics.audit_coverage!.unavailable = 0;
    expect(() => buildDecisionCard(f)).toThrow(ConfigError);
  });
});
