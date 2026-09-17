import { ConfigError, type C4Run } from "@aob/contracts";
import { median, type DerivedRun, type ToolVisibility } from "./derive.js";
import type { AnalysisRequest, RequestSummary } from "./request-analysis.js";
export type { AnalysisRequest, RequestSummary } from "./request-analysis.js";

/** An allowlist of report facts. No C1 payloads, log paths or adapter artifacts. */
export type AnalysisAttempt = {
  run_id: string; harness: string; version: string; task: string; rep: number;
  outcome: C4Run["outcome"]; host: C4Run["host"]; condition: C4Run["condition"];
  model: string; price_book: string;
  source: { repository: string | null; name: string; revision: string };
  regime: C4Run["task_regime"]; routing: NonNullable<C4Run["provider_routing"]> | null;
  configuration: string | null; ori_version: string | null;
  task_base_revision: string | null; verifier_image: string; environment: string;
  started_iso: string; visibility: ToolVisibility;
  hashes: { run: string; events: string };
  timing: DerivedRun | null; timing_unavailable: "unreconciled" | null;
  turns: number; input_tokens: number | null; output_tokens: number | null;
  cached_percent: number | null; usage_unavailable: "no-successful-usage" | "incomplete-usage" | null;
  cost_usd: number | null; token_floor_usd: number | null;
  cost_unavailable: "unpriced-model" | "incomplete-accounting" | "incomplete-usage" | null;
  requests: AnalysisRequest[];
  request_summary: RequestSummary;
};

export type Distribution = { n: number; missing: number; median: number | null; q1: number | null; q3: number | null; min: number | null; max: number | null };
const metrics = ["end_to_end", "model_time", "non_model_time", "startup", "first_byte_ms", "turns", "input_tokens", "output_tokens", "cached_percent", "cost_usd",
  "request_n", "median_duration_ms", "median_wait_ms", "median_transfer_ms", "median_gap_before_ms", "largest_duration_ms", "largest_gap_before_ms", "time_after_last_ms"] as const;
export type AnalysisMetric = typeof metrics[number];
export type TaskDistribution = {
  harness: string; version: string; task: string; task_key: string; outcome: AnalysisAttempt["outcome"];
  attempts: string[]; metrics: Record<AnalysisMetric, Distribution>;
};
export type MatchedComparison = {
  left: string; right: string; left_ms: number | null; right_ms: number | null;
  median_task_ratio: number | null;
  tasks: Array<{ task: string; task_key: string; left_n: number; right_n: number; left_ms: number; right_ms: number }>;
};
export type AnalysisPopulation = {
  key: string; condition: string; host: C4Run["host"]; model: string; price_book: string;
  source: AnalysisAttempt["source"]; regime: string; routing: AnalysisAttempt["routing"];
  configuration: string | null; ori_version: string | null;
  attempts: string[]; distributions: TaskDistribution[]; comparisons: MatchedComparison[];
};
export type AnnotatedRun = { run_id: string; reason: string };
export type AnalysisExport = {
  schema_version: 2;
  scope: "loaded-attempts";
  notes: string[];
  attempts: AnalysisAttempt[];
  populations: AnalysisPopulation[];
  annotated_runs: AnnotatedRun[];
};

/** Same linear interpolation used by the existing S6 IQR. Singleton spread is unknown. */
export function distribution(values: Array<number | null>): Distribution {
  const xs = values.filter((v): v is number => v !== null).sort((a, b) => a - b);
  const quantile = (p: number): number | null => {
    if (xs.length < 2) return null;
    const position = (xs.length - 1) * p;
    const lo = Math.floor(position);
    return xs[lo]! + (xs[Math.ceil(position)]! - xs[lo]!) * (position - lo);
  };
  return { n: xs.length, missing: values.length - xs.length, median: xs.length ? median(xs) : null,
    q1: quantile(0.25), q3: quantile(0.75), min: xs[0] ?? null, max: xs.at(-1) ?? null };
}

export function analysisPopulationKey(a: AnalysisAttempt): string {
  return JSON.stringify([a.host.os, a.host.cpu, a.host.ram_gb, a.condition, a.model, a.price_book,
    a.source.repository, a.source.name, a.source.revision, a.regime,
    a.routing === null ? null : [[...a.routing.ignored_providers].sort(), a.routing.only_provider ?? null, a.routing.allow_fallbacks ?? null],
    a.configuration, a.ori_version]);
}

function taskKey(a: AnalysisAttempt): string {
  return JSON.stringify([a.task, a.task_base_revision, a.verifier_image, a.environment]);
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const id = key(item);
    const group = groups.get(id) ?? [];
    group.push(item);
    groups.set(id, group);
  }
  return new Map([...groups].sort(([a], [b]) => a.localeCompare(b)));
}

function metricValue(a: AnalysisAttempt, key: AnalysisMetric): number | null {
  switch (key) {
    case "end_to_end": case "model_time": case "non_model_time": case "startup": case "first_byte_ms": return a.timing?.[key] ?? null;
    case "request_n": return a.request_summary.n;
    case "median_duration_ms": return a.request_summary.median_duration_ms;
    case "median_wait_ms": return a.request_summary.median_wait_ms;
    case "median_transfer_ms": return a.request_summary.median_transfer_ms;
    case "median_gap_before_ms": return a.request_summary.median_gap_before_ms;
    case "largest_duration_ms": return a.request_summary.largest_duration_ms;
    case "largest_gap_before_ms": return a.request_summary.largest_gap_before_ms;
    case "time_after_last_ms": return a.request_summary.time_after_last_ms;
    default: return a[key];
  }
}

function annotateRuns(attempts: AnalysisAttempt[]): AnnotatedRun[] {
  const pick = (reason: string, score: (a: AnalysisAttempt) => number | null, extra: (a: AnalysisAttempt) => boolean = () => true): AnnotatedRun | null => {
    let best: AnalysisAttempt | null = null;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (const attempt of attempts) {
      if (!extra(attempt)) continue;
      const value = score(attempt);
      if (value === null || value <= bestScore) continue;
      best = attempt;
      bestScore = value;
    }
    return best === null ? null : { run_id: best.run_id, reason };
  };
  const selected: AnnotatedRun[] = [];
  const seen = new Set<string>();
  for (const item of [
    pick("most model calls among passes", (a) => a.request_summary.n, (a) => a.outcome === "completed"),
    pick("largest inter-request gap among passes", (a) => a.request_summary.largest_gap_before_ms, (a) => a.outcome === "completed"),
    pick("longest tail after last model response among passes", (a) => a.request_summary.time_after_last_ms, (a) => a.outcome === "completed"),
    pick("longest single model call among passes", (a) => a.request_summary.largest_duration_ms, (a) => a.outcome === "completed"),
    pick("most model calls among verification failures", (a) => a.request_summary.n, (a) => a.outcome === "verify_error"),
    pick("most failed model calls among verification failures", (a) => a.request_summary.n_error, (a) => a.outcome === "verify_error"),
  ]) {
    if (item === null || seen.has(item.run_id)) continue;
    seen.add(item.run_id);
    selected.push(item);
  }
  return selected;
}

function compare(distributions: TaskDistribution[]): MatchedComparison[] {
  const tools = [...groupBy(distributions, (r) => JSON.stringify([r.harness, r.version])).entries()];
  const pairs: MatchedComparison[] = [];
  for (let i = 0; i < tools.length; i++) for (let j = i + 1; j < tools.length; j++) {
    const left = tools[i]![1];
    const right = tools[j]![1];
    // Do not imply that two versions of the same CLI are two harnesses.
    if (left[0]!.harness === right[0]!.harness) continue;
    const eligible = (r: TaskDistribution) => r.outcome === "completed" && r.metrics.end_to_end.n > 0;
    const rightTasks = new Map(right.filter(eligible).map((r) => [r.task_key, r]));
    const tasks: MatchedComparison["tasks"] = [];
    for (const l of left.filter(eligible)) {
      const r = rightTasks.get(l.task_key);
      if (!r) continue;
      tasks.push({ task: l.task, task_key: l.task_key, left_n: l.metrics.end_to_end.n, right_n: r.metrics.end_to_end.n,
        left_ms: l.metrics.end_to_end.median!, right_ms: r.metrics.end_to_end.median! });
    }
    pairs.push({ left: `${left[0]!.harness} @ ${left[0]!.version}`, right: `${right[0]!.harness} @ ${right[0]!.version}`, tasks,
      left_ms: tasks.length ? median(tasks.map((t) => t.left_ms)) : null,
      right_ms: tasks.length ? median(tasks.map((t) => t.right_ms)) : null,
      median_task_ratio: tasks.length && tasks.every((t) => t.left_ms > 0) ? median(tasks.map((t) => t.right_ms / t.left_ms)) : null });
  }
  return pairs;
}

export function analyzeAttempts(input: AnalysisAttempt[]): AnalysisExport {
  const attempts = [...input].sort((a, b) => a.run_id.localeCompare(b.run_id));
  const ids = new Set<string>();
  const slots = new Set<string>();
  for (const a of attempts) {
    if (ids.has(a.run_id)) throw new ConfigError(`duplicate analysis run identity: ${a.run_id}`);
    ids.add(a.run_id);
    const slot = JSON.stringify([analysisPopulationKey(a), a.harness, a.version, taskKey(a), a.rep]);
    if (slots.has(slot)) throw new ConfigError(`duplicate analysis slot: ${a.run_id}`);
    slots.add(slot);
  }
  const populations = [...groupBy(attempts, analysisPopulationKey)].map(([key, cells]): AnalysisPopulation => {
    const a = cells[0]!;
    const distributions = [...groupBy(cells, (c) => JSON.stringify([c.harness, c.version, taskKey(c), c.outcome]))].map(([, group]): TaskDistribution => {
      const first = group[0]!;
      return { harness: first.harness, version: first.version, task: first.task, task_key: taskKey(first), outcome: first.outcome,
        attempts: group.map((c) => c.run_id), metrics: Object.fromEntries(metrics.map((metric) => [metric, distribution(group.map((c) => metricValue(c, metric)))])) as Record<AnalysisMetric, Distribution> };
    });
    return { key, condition: a.condition, host: a.host, model: a.model, price_book: a.price_book, source: a.source,
      regime: a.regime, routing: a.routing, configuration: a.configuration, ori_version: a.ori_version,
      attempts: cells.map((c) => c.run_id), distributions, comparisons: a.model === "" ? [] : compare(distributions) };
  });
  return { schema_version: 2, scope: "loaded-attempts", notes: [
    "Timing uses the existing C1 interval-union derivation. Unreconciled timing is unavailable; outcome groups remain separate.",
    "Usage covers successful model responses; turns count identifiable API attempts. Static costs are not invoices and exclude attempts absent from this export.",
    "Matched comparisons use only common tasks with reconciled native passes on both sides. Repetition indices are not paired seeds. Samples and execution windows can differ.",
    "No matched-model comparison is produced when the recorded model is unspecified.",
    "Host fields describe recorded hardware, not unique machine identity. Same-host populations do not establish causal harness effects.",
    "Quartiles describe observed runs, not confidence intervals. Singleton spread is unavailable. Non-model time includes unobserved tool and harness work.",
    "Request series are sanitized C1 model attempts: duration, wait, transfer, gaps and per-call tokens/cost. Paths, bodies and logs are not exported. Relationships are within a run or matched task, not ratios of unrelated headline medians.",
  ], attempts, populations, annotated_runs: annotateRuns(attempts) };
}
