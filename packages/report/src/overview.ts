import type { AnalysisAttempt } from "./analysis.js";
import { median } from "./derive.js";

type Measurement = { value: number | null; n: number };
export type OverviewRow = {
  harness: string; version: string; selected: number; passes: number; pass_rate: number; tasks: number;
  cost: Measurement; cache: Measurement; input: Measurement; output: Measurement;
};

/** Caller supplies one recorded population; summaries include all selected outcomes. */
export function summarizeOverview(attempts: AnalysisAttempt[], costForAttempt: (attempt: AnalysisAttempt) => number | null = attempt => attempt.cost_usd): OverviewRow[] {
  const groups = new Map<string, AnalysisAttempt[]>();
  for (const attempt of attempts) {
    const key = JSON.stringify([attempt.harness, attempt.version]);
    const rows = groups.get(key) ?? [];
    rows.push(attempt);
    groups.set(key, rows);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, rows]) => {
    const measured = (key: "cost_usd" | "cached_percent" | "input_tokens" | "output_tokens"): Measurement => {
      const values = rows.map((row) => key === "cost_usd" ? costForAttempt(row) : row[key]).filter((value): value is number => value !== null);
      return { value: values.length === 0 ? null : median(values), n: values.length };
    };
    const passes = rows.filter((row) => row.outcome === "completed").length;
    return {
      harness: rows[0]!.harness, version: rows[0]!.version, selected: rows.length,
      passes, pass_rate: passes / rows.length * 100,
      tasks: new Set(rows.map((row) => JSON.stringify([row.task, row.task_base_revision, row.verifier_image, row.environment]))).size,
      cost: measured("cost_usd"), cache: measured("cached_percent"), input: measured("input_tokens"), output: measured("output_tokens"),
    };
  });
}

export function overviewValue(value: number | null, kind: "cost" | "percent" | "tokens"): string {
  if (value === null) return "Unavailable";
  if (kind === "cost") return value > 0 && value < 0.001 ? "$" + value.toPrecision(2) : `$${value.toFixed(3)}`;
  if (kind === "percent") return `${value.toFixed(1)}%`;
  return value >= 1e6 ? `${(value / 1e6).toFixed(2)}M` : value >= 1e3 ? `${(value / 1e3).toFixed(1)}K` : String(value);
}
