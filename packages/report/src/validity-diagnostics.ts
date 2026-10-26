import { ConfigError } from "@aob/contracts";
import { analysisPopulationKey, type AnalysisAttempt } from "./analysis.js";
import type { AuditSummary } from "./task-audit.js";
import type { CollectionLedger } from "./collection-ledger.js";
import type { PriceRates } from "./aggregate.js";
import { pairwiseConfidence, taskClusterMeanBounds, validateComparisonGrid } from "./comparison-confidence.js";
import { referenceCost } from "./comparison-overview.js";
import { referenceBookForAttempts } from "./reference-pricing.js";

export type RepeatBin = { passes: number; repetitions: number; tasks: number };
export type TaskReliability = { harness: string; version: string; task: string; task_key: string;
  passes: number; repetitions: number; run_ids: string[]; verifier_images: string[]; environments: string[] };
export type LeaveOneTaskOut = { left: string; right: string; task_key: string; omitted_difference_pp: number };
export type Sensitivity = { left: string; right: string; difference_pp: number; omitted: LeaveOneTaskOut[];
  min_pp: number | null; max_pp: number | null };
export type RepeatDiagnostics = { reliability: TaskReliability[];
  repeat_bins: Array<{ harness: string; version: string; bins: RepeatBin[] }>; sensitivity: Sensitivity[] };
export type Interval = { estimate: number | null; lower: number | null; upper: number | null;
  task_clusters: number; measured: number; missing: number; method: "task-cluster-percentile-10000" };
export type HarnessUncertainty = { harness: string; version: string;
  reference_cost_mean: Interval; input_tokens_mean: Interval; output_tokens_mean: Interval };

const fail = (message: string): never => { throw new ConfigError(`validity diagnostics: ${message}`); };
const taskKey = (attempt: AnalysisAttempt): string => JSON.stringify([attempt.task, attempt.task_base_revision]);
const harnessKey = (attempt: Pick<AnalysisAttempt, "harness" | "version">): string => JSON.stringify([attempt.harness, attempt.version]);
const sorted = (values: Iterable<string>): string[] => [...new Set(values)].sort();

/** Input attempts have already passed canonical replay validation; this checks comparison eligibility. */
function groupedAttempts(attempts: readonly AnalysisAttempt[], population: string, rates: PriceRates | null): Map<string, Map<string, AnalysisAttempt[]>> {
  if (rates !== null && ![rates.input, rates.cached_input, rates.output].every(value => Number.isFinite(value) && value >= 0)) return fail("invalid reference rates");
  const book = referenceBookForAttempts(attempts, rates);
  const groups = new Map<string, Map<string, AnalysisAttempt[]>>(), slots = new Set<string>(), ids = new Set<string>();
  for (const attempt of attempts) {
    const key = analysisPopulationKey(rates === null ? attempt : { ...attempt, price_book: book! });
    if (key !== population) return fail("attempt differs from comparison population");
    if (!Number.isSafeInteger(attempt.rep) || attempt.rep < 0) return fail("invalid repetition");
    const task = taskKey(attempt), harness = harnessKey(attempt), slot = JSON.stringify([harness, task, attempt.rep]);
    if (slots.has(slot) || ids.has(attempt.run_id)) return fail("duplicate slot or run ID");
    slots.add(slot); ids.add(attempt.run_id);
    const tasks = groups.get(harness) ?? new Map<string, AnalysisAttempt[]>();
    const rows = tasks.get(task) ?? []; rows.push(attempt); tasks.set(task, rows); groups.set(harness, tasks);
  }
  return new Map([...groups].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([harness, tasks]) => [harness,
    new Map([...tasks].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([task, rows]) => [task, rows.sort((a, b) => a.rep - b.rep)]))]));
}

/** Admission checks shared with diagnostics, without computing unused statistics. */
export function validateDiagnosticPopulation(input: { attempts: readonly AnalysisAttempt[]; population_key: string; rates: PriceRates | null }): void {
  groupedAttempts(input.attempts, input.population_key, input.rates);
  validateComparisonGrid(input.attempts.map(a => ({ harness: harnessKey(a), task: taskKey(a), rep: a.rep, outcome: a.outcome })));
}

/** Each task/base revision contributes once; failures and timeouts remain in its denominator. */
export function buildRepeatDiagnostics(input: { attempts: readonly AnalysisAttempt[]; population_key: string; rates: PriceRates | null }): RepeatDiagnostics {
  const groups = groupedAttempts(input.attempts, input.population_key, input.rates);
  // The existing owner enforces matched task/repetition grids. IDs name versions,
  // not random seeds; the task key deliberately retains mixed image evidence below.
  const pairs = pairwiseConfidence(input.attempts.map(attempt => ({ harness: harnessKey(attempt), task: taskKey(attempt), rep: attempt.rep, outcome: attempt.outcome })));
  const reliability: TaskReliability[] = [], repeat_bins: RepeatDiagnostics["repeat_bins"] = [];
  const byHarness = new Map<string, Map<string, TaskReliability>>();
  for (const [key, tasks] of groups) {
    const taskRows = new Map<string, TaskReliability>();
    for (const [task_key, attempts] of tasks) {
      const first = attempts[0]!;
      const row: TaskReliability = { harness: first.harness, version: first.version, task: first.task, task_key,
        passes: attempts.filter(attempt => attempt.outcome === "completed").length, repetitions: attempts.length,
        run_ids: attempts.map(attempt => attempt.run_id), verifier_images: sorted(attempts.map(attempt => attempt.verifier_image)),
        environments: sorted(attempts.map(attempt => attempt.environment)) };
      reliability.push(row); taskRows.set(task_key, row);
    }
    byHarness.set(key, taskRows);
    const rows = [...taskRows.values()], first = rows[0]!;
    const bins = [...new Set(rows.map(row => row.repetitions))].sort((a, b) => a - b).flatMap(repetitions =>
      Array.from({ length: repetitions + 1 }, (_, passes) => ({ passes, repetitions,
        tasks: rows.filter(row => row.repetitions === repetitions && row.passes === passes).length })));
    repeat_bins.push({ harness: first.harness, version: first.version, bins });
  }
  const sensitivity = pairs.map(pair => {
    const left = byHarness.get(pair.left)!, right = byHarness.get(pair.right)!;
    const differences = [...left].map(([task_key, row]) => ({ task_key,
      difference: 100 * (row.passes / row.repetitions - right.get(task_key)!.passes / right.get(task_key)!.repetitions) }));
    const total = differences.reduce((sum, row) => sum + row.difference, 0);
    const omitted: LeaveOneTaskOut[] = differences.length < 2 ? [] : differences.map(row => ({
      left: pair.left, right: pair.right, task_key: row.task_key, omitted_difference_pp: (total - row.difference) / (differences.length - 1),
    }));
    return { left: pair.left, right: pair.right, difference_pp: pair.difference_pp, omitted,
      min_pp: omitted.length ? Math.min(...omitted.map(row => row.omitted_difference_pp)) : null,
      max_pp: omitted.length ? Math.max(...omitted.map(row => row.omitted_difference_pp)) : null };
  });
  return { reliability, repeat_bins, sensitivity };
}

function meanInterval(tasks: Map<string, AnalysisAttempt[]>, value: (attempt: AnalysisAttempt) => number | null): Interval {
  let measured = 0, missing = 0;
  const means: number[] = [];
  for (const attempts of tasks.values()) {
    let total = 0, complete = 0;
    for (const attempt of attempts) {
      const observation = value(attempt);
      if (observation === null) { missing++; continue; }
      if (!Number.isFinite(observation) || observation < 0) return fail("invalid metric observation");
      measured++; complete++; total += observation;
    }
    // An incomplete task never becomes a smaller, selectively observed cluster.
    if (complete === attempts.length) means.push(total / complete);
  }
  const eligible = missing === 0 && means.length > 0;
  const bounds = eligible ? taskClusterMeanBounds(means) : null;
  return { estimate: eligible ? means.reduce((sum, mean) => sum + mean, 0) / means.length : null,
    lower: bounds?.[0] ?? null, upper: bounds?.[1] ?? null, task_clusters: tasks.size,
    measured, missing, method: "task-cluster-percentile-10000" };
}

/** Exploratory intervals for equal-task means; headline token medians are unchanged. */
export function diagnosticIntervals(attempts: readonly AnalysisAttempt[], rates: PriceRates | null): HarnessUncertainty[] {
  if (attempts.length === 0) return [];
  const first = attempts[0]!;
  const book = referenceBookForAttempts(attempts, rates);
  const population = analysisPopulationKey(rates === null ? first : { ...first, price_book: book! });
  return [...groupedAttempts(attempts, population, rates).values()].map(tasks => {
    const row = tasks.values().next().value![0]!;
    return { harness: row.harness, version: row.version,
      reference_cost_mean: meanInterval(tasks, attempt => rates === null ? null : referenceCost(attempt, rates)),
      input_tokens_mean: meanInterval(tasks, attempt => attempt.input_tokens),
      output_tokens_mean: meanInterval(tasks, attempt => attempt.output_tokens) };
  });
}

export type FailureLabel = { run_id: string; original_outcome: AnalysisAttempt["outcome"];
  category: "pass" | "timeout" | "adapter-observation" | "verification-unknown" | "confirmed-verifier-false-negative";
  audit_dataset: string | null; evidence: string[] };
export type ValidityDiagnostics = { schema_version: 1; dataset: string; analysis_sha256: string;
  population_key: string; reference_book: string | null; original_grades: true;
  reliability: TaskReliability[]; repeat_bins: RepeatDiagnostics["repeat_bins"]; sensitivity: Sensitivity[];
  uncertainty: HarnessUncertainty[]; failures: FailureLabel[];
  audit_coverage: { audited: number; reproduced: number; corrected: number; unavailable: number; changed: number } | null;
  collection: CollectionLedger };

/** Audit hashes are validated by the publisher/owner; recheck selected identity at composition. */
export function buildValidityDiagnostics(input: { dataset: string; analysis_sha256: string;
  attempts: readonly AnalysisAttempt[]; population_key: string; rates: PriceRates | null;
  audit: AuditSummary | null; audit_dataset: string | null; collection: CollectionLedger }): ValidityDiagnostics {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(input.dataset) || !/^sha256:[a-f0-9]{64}$/.test(input.analysis_sha256)) return fail("invalid source binding");
  const reference_book = referenceBookForAttempts(input.attempts, input.rates);
  if (input.collection.reference_book !== reference_book) return fail("collection reference book differs");
  const selected = input.collection.items.filter(item => item.class === "selected");
  const artifact = (run: string, events: string, id: string) => JSON.stringify([run, events, id]);
  const selectedKeys = new Set(selected.map(item => artifact(item.run_sha256!, item.events_sha256, item.run_id)));
  if (selected.length !== input.attempts.length || selectedKeys.size !== selected.length || input.collection.selected_count !== selected.length ||
    selected.some(item => item.source_dataset !== input.dataset) ||
    input.attempts.some(a => !selectedKeys.has(artifact(a.hashes.run, a.hashes.events, a.run_id)))) return fail("collection selected binding differs");
  return { schema_version: 1, dataset: input.dataset, analysis_sha256: input.analysis_sha256, population_key: input.population_key,
    reference_book, original_grades: true, ...buildRepeatDiagnostics(input), uncertainty: diagnosticIntervals(input.attempts, input.rates), ...buildFailureDiagnostics(input),
    collection: input.collection };
}

/** Shared owner for original-outcome labels and validated separate audit claims. */
export function buildFailureDiagnostics(input: { attempts: readonly AnalysisAttempt[]; audit: AuditSummary | null;
  audit_dataset: string | null }): Pick<ValidityDiagnostics, "failures" | "audit_coverage"> {
  const { audit, audit_dataset } = input;
  if ((audit === null) !== (audit_dataset === null) || (audit !== null && audit.revision !== audit_dataset)) return fail("audit dataset binding differs");
  const claims = new Map<string, AuditSummary["changes"][number]>();
  const byId = new Map(input.attempts.map(a => [a.run_id, a]));
  for (const change of audit?.changes ?? []) {
    const a = byId.get(change.run_id);
    if (!a || claims.has(change.run_id) || a.hashes.run !== change.run_sha256 || a.task !== change.task || a.harness !== change.harness ||
      a.rep !== change.rep || a.verifier_image !== change.verifier_image || change.original !== (a.outcome === "completed" ? 1 : 0) ||
      ![0, 1].includes(change.corrected) || change.corrected === change.original || change.evidence.length !== 8 ||
      change.evidence.some(ref => !/^audit\.json#\/attempts\/\d+\/(?:original_verify_log_sha256|(?:original_replay|corrected_replay)\/(?:patch_sha256|stdout_sha256|stderr_sha256|amended_test_patch_sha256))@sha256:[a-f0-9]{64}$/.test(ref))) return fail("audit change is not bound to selected attempt evidence");
    claims.set(change.run_id, change);
  }
  const failures: FailureLabel[] = [...input.attempts].sort((a, b) => a.run_id < b.run_id ? -1 : a.run_id > b.run_id ? 1 : 0).map(a => {
    const claim = claims.get(a.run_id);
    if (a.outcome === "verify_error" && claim?.original === 0 && claim.corrected === 1) return {
      run_id: a.run_id, original_outcome: a.outcome, category: "confirmed-verifier-false-negative", audit_dataset, evidence: [...claim.evidence] };
    return { run_id: a.run_id, original_outcome: a.outcome,
      category: a.outcome === "completed" ? "pass" : a.outcome === "timeout" ? "timeout" : a.outcome === "adapter_error" ? "adapter-observation" : "verification-unknown",
      audit_dataset: null, evidence: [] };
  });
  return { failures, audit_coverage: audit === null ? null : { audited: audit.audited, reproduced: audit.reproduced,
    corrected: audit.corrected, unavailable: audit.unavailable, changed: audit.changes.length } };
}
