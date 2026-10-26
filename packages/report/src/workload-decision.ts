import { ConfigError } from "@aob/contracts";
import type { PriceRates } from "./aggregate.js";
import { distribution, type AnalysisAttempt, type Distribution } from "./analysis.js";
import { summarizeBenchmarkCosts } from "./benchmark-cost.js";
import { referenceBookForAttempts } from "./reference-pricing.js";
import { pairwiseConfidence } from "./comparison-confidence.js";
import type { AuditSummary } from "./task-audit.js";
import { buildFailureDiagnostics, validateDiagnosticPopulation, diagnosticIntervals, type ValidityDiagnostics, type Interval, type FailureLabel } from "./validity-diagnostics.js";

export type WorkloadScope = { id: string; label: string; task_keys: string[] };
export type DecisionSelection = { population_key: string; workload_id: string; reference_harness: string };
export type CostCell = { complete_mean_usd: number | null;
  /** Known total across selected attempts, not a partial-observation mean. */
  known_lower_bound_usd: number | null; measured: number; missing: number };
export type DecisionRow = { harness: string; version: string; selected: number; passes: number;
  outcomes: { completed: number; verify_error: number; timeout: number; adapter_error: number };
  reference_cost: CostCell; agent_e2e_all: Distribution; agent_e2e_pass: Distribution;
  reference_cost_interval: Interval; input_tokens_mean_interval: Interval; output_tokens_mean_interval: Interval;
  failure_labels: FailureLabel[]; request_count: Distribution; api_active_ms: Distribution; non_model_ms: Distribution;
  cached_percent: Distribution; input_tokens: Distribution; output_tokens: Distribution;
  visibility: { none: number; partial: number; full: number }; run_ids: string[] };
export type DecisionDifference = { harness: string; reference_harness: string; pass_pp: number;
  pass_interval_pp: [number, number] | null; cost_usd: number | null; cost_percent: number | null;
  e2e_all_median_ms: number | null; e2e_all_percent: number | null; coverage_note: string };
export type DecisionCard = { population_key: string; workload: WorkloadScope; original_grades: true;
  rows: DecisionRow[]; differences: DecisionDifference[]; audit: AuditSummary | null; audit_dataset: string | null;
  diagnostic_dataset: string; evidence_note: string };
export type DecisionInput = { analysis_sha256: string; attempts: readonly AnalysisAttempt[]; scope: WorkloadScope;
  selection: DecisionSelection; rates: PriceRates | null; diagnostics: ValidityDiagnostics; audit: AuditSummary | null; audit_dataset: string | null };

const fail = (message: string): never => { throw new ConfigError(`workload decision: ${message}`); };
const taskKey = (a: AnalysisAttempt) => JSON.stringify([a.task, a.task_base_revision]);
const harnessKey = (a: Pick<AnalysisAttempt, "harness" | "version">) => JSON.stringify([a.harness, a.version]);

function selectedAttempts(input: DecisionInput): AnalysisAttempt[] {
  const { diagnostics: d, scope, selection, attempts } = input;
  if (d.schema_version !== 1 || !d.original_grades || input.analysis_sha256 !== d.analysis_sha256 ||
    !/^sha256:[a-f0-9]{64}$/.test(input.analysis_sha256) || d.population_key !== selection.population_key ||
    d.reference_book !== referenceBookForAttempts(attempts, input.rates)) return fail("diagnostics source or population differs");
  if (!scope.id || selection.workload_id !== scope.id || scope.task_keys.length === 0 || new Set(scope.task_keys).size !== scope.task_keys.length) return fail("invalid workload membership");
  const keys = new Set(attempts.map(taskKey));
  if (scope.task_keys.some(key => !keys.has(key))) return fail("missing workload task");
  // Validate the entire supplied population before narrowing a workload. This
  // preserves matched grids and does not pair repetition numbers as random seeds.
  validateDiagnosticPopulation({ attempts, population_key: selection.population_key, rates: input.rates });
  if (!attempts.some(a => harnessKey(a) === selection.reference_harness)) return fail("unknown reference harness version");
  const ledger = d.collection.items.filter(item => item.class === "selected");
  const byId = new Map(ledger.map(item => [item.run_id, item]));
  const labels = new Map(d.failures.map(label => [label.run_id, label]));
  if (ledger.length !== attempts.length || byId.size !== attempts.length || labels.size !== attempts.length || d.failures.length !== attempts.length) return fail("diagnostics attempt coverage differs");
  for (const a of attempts) {
    const item = byId.get(a.run_id), label = labels.get(a.run_id);
    if (!item || item.run_sha256 !== a.hashes.run || item.events_sha256 !== a.hashes.events || item.source_dataset !== d.dataset ||
      !label || label.original_outcome !== a.outcome) return fail("diagnostics attempt evidence differs");
  }
  const failure = buildFailureDiagnostics(input);
  if (JSON.stringify(failure.failures) !== JSON.stringify(d.failures) || JSON.stringify(failure.audit_coverage) !== JSON.stringify(d.audit_coverage)) return fail("diagnostics audit labels or coverage differ");
  const members = new Set(scope.task_keys);
  return attempts.filter(a => members.has(taskKey(a))).sort((a, b) => taskKey(a) < taskKey(b) ? -1 : taskKey(a) > taskKey(b) ? 1 : a.rep - b.rep);
}

/** Scope-specific rows; original failures stay in cost and all-outcome timing. */
export function buildDecisionRows(input: DecisionInput): DecisionRow[] {
  const selected = selectedAttempts(input), labels = new Map(input.diagnostics.failures.map(label => [label.run_id, label]));
  return diagnosticIntervals(selected, input.rates).map(uncertainty => {
    const attempts = selected.filter(a => harnessKey(a) === harnessKey(uncertainty));
    const outcomes = { completed: 0, verify_error: 0, timeout: 0, adapter_error: 0 }, visibility = { none: 0, partial: 0, full: 0 };
    for (const a of attempts) { outcomes[a.outcome]++; visibility[a.visibility]++; }
    const cost = input.rates === null ? null : summarizeBenchmarkCosts(attempts, input.rates)[0]!;
    const value = (select: (a: AnalysisAttempt) => number | null) => distribution(attempts.map(select));
    const e2e = (a: AnalysisAttempt) => a.timing?.end_to_end ?? null;
    return { harness: uncertainty.harness, version: uncertainty.version, selected: attempts.length, passes: outcomes.completed,
      outcomes, reference_cost: { complete_mean_usd: cost?.complete_attempts === attempts.length ? cost.average_usd : null,
        known_lower_bound_usd: cost?.known_usd ?? null, measured: cost?.complete_attempts ?? 0, missing: attempts.length - (cost?.complete_attempts ?? 0) },
      agent_e2e_all: value(e2e), agent_e2e_pass: distribution(attempts.filter(a => a.outcome === "completed").map(e2e)),
      reference_cost_interval: uncertainty.reference_cost_mean, input_tokens_mean_interval: uncertainty.input_tokens_mean, output_tokens_mean_interval: uncertainty.output_tokens_mean,
      failure_labels: attempts.map(a => ({ ...labels.get(a.run_id)!, evidence: [...labels.get(a.run_id)!.evidence] })),
      request_count: value(a => a.request_summary.n), api_active_ms: value(a => a.timing?.model_time ?? null), non_model_ms: value(a => a.timing?.non_model_time ?? null),
      cached_percent: value(a => a.cached_percent), input_tokens: value(a => a.input_tokens), output_tokens: value(a => a.output_tokens), visibility,
      run_ids: attempts.map(a => a.run_id) };
  });
}

function evidenceNote(selected: AnalysisAttempt[]): string {
  const repetitions = new Map<string, number>(), identities = new Map<string, Set<string>>();
  for (const a of selected) {
    const task = taskKey(a), key = JSON.stringify([task, harnessKey(a)]);
    repetitions.set(key, (repetitions.get(key) ?? 0) + 1);
    const values = identities.get(task) ?? new Set<string>(); values.add(JSON.stringify([a.verifier_image, a.environment])); identities.set(task, values);
  }
  const counts = [...new Set(repetitions.values())].sort((a, b) => a - b);
  const count = counts.length === 1 ? String(counts[0]) : counts.join("/");
  const mismatch = [...identities.values()].some(values => values.size > 1);
  return `${identities.size} distinct task${identities.size === 1 ? "" : "s"}; ${count} repetitions per task and harness version. ` +
    "Pass differences and cost means use equal task weights; pass counts include every selected attempt. " +
    (mismatch ? "Verifier image/environment identities differ within tasks; this is not an image-matched comparison. " : "Recorded verifier image/environment identities match within each task. ") +
    (selected[0]!.configuration === null ? "Recorded configuration details are unavailable. " : "One recorded configuration identity; effective request settings and collection conditions may still differ. ") +
    "Observed differences are not causal and do not establish future superiority. " +
    "Exploratory 95% task-cluster intervals use 10,000 deterministic resamples; repetitions are not independent tasks or paired random seeds. " +
    "No correction for multiple comparisons or winner selection. Secondary cost/token intervals describe means, not headline token medians. " +
    "Original grades remain unchanged; corrected verification is a separate audit with limited replay coverage.";
}

/** Observed differences for one validated population and selected workload. */
export function buildDecisionCard(input: DecisionInput): DecisionCard {
  return buildDecisionCards(input, [input.selection.reference_harness])[0]!;
}

/** Share scope statistics across reference choices; no cache survives this call. */
export function buildDecisionCards(input: DecisionInput, references: readonly string[]): DecisionCard[] {
  const rows = buildDecisionRows(input);
  const members = new Set(input.scope.task_keys), selected = input.attempts.filter(a => members.has(taskKey(a)));
  const pairs = pairwiseConfidence(selected.map(a => ({ harness: harnessKey(a), task: taskKey(a), rep: a.rep, outcome: a.outcome })));
  return references.map(baseline => {
  const reference = rows.find(row => harnessKey(row) === baseline);
  if (!reference) return fail("unknown reference harness version");
  const differences = rows.map((row): DecisionDifference => {
    const key = harnessKey(row);
    const pair = pairs.find(pair => pair.left === key && pair.right === baseline || pair.right === key && pair.left === baseline);
    const sign = pair?.left === key ? 1 : -1;
    const pass_interval_pp: [number, number] | null = pair?.interval ? sign === 1 ? [...pair.interval] : [-pair.interval[1], -pair.interval[0]] : null;
    const cost = row.reference_cost.complete_mean_usd, referenceCost = reference.reference_cost.complete_mean_usd;
    const cost_usd = cost === null || referenceCost === null ? null : cost - referenceCost;
    const completeTiming = row.agent_e2e_all.missing === 0 && reference.agent_e2e_all.missing === 0;
    const time = row.agent_e2e_all.median, referenceTime = reference.agent_e2e_all.median;
    const e2e_all_median_ms = !completeTiming || time === null || referenceTime === null ? null : time - referenceTime;
    const notes = [key === baseline ? "Reference row; no comparison interval." : input.scope.task_keys.length === 1 ? "one task; interval unavailable." : "Exploratory task-cluster pass difference; equal task weights."];
    if (cost_usd === null) notes.push("Incomplete or unavailable reference cost coverage; cost difference unavailable.");
    else if (referenceCost === 0) notes.push("Reference cost is zero; percentage change unavailable.");
    if (e2e_all_median_ms === null) notes.push("Incomplete timing coverage; elapsed-time difference unavailable.");
    else if (referenceTime === 0) notes.push("Reference elapsed time is zero; percentage change unavailable.");
    return { harness: key, reference_harness: baseline, pass_pp: pair && pair.difference_pp !== 0 ? sign * pair.difference_pp : 0, pass_interval_pp,
      cost_usd, cost_percent: cost_usd !== null && referenceCost !== null && referenceCost > 0 ? cost_usd / referenceCost * 100 : null,
      e2e_all_median_ms, e2e_all_percent: e2e_all_median_ms !== null && referenceTime !== null && referenceTime > 0 ? e2e_all_median_ms / referenceTime * 100 : null,
      coverage_note: notes.join(" ") };
  });
  return { population_key: input.selection.population_key, workload: { ...input.scope, task_keys: [...input.scope.task_keys] }, original_grades: true,
    rows: structuredClone(rows), differences, audit: input.audit === null ? null : structuredClone(input.audit), audit_dataset: input.audit_dataset,
    diagnostic_dataset: input.diagnostics.dataset, evidence_note: evidenceNote(selected) };
  });
}
