import type { AnalysisAttempt } from "./analysis.js";
import { costUsd, type PriceRates } from "./aggregate.js";
import { referenceCost } from "./comparison-overview.js";

export type CostSummary = {
  selected: number; complete_attempts: number;
  known_usd: number | null; total_usd: number | null; average_usd: number | null;
};
export type TaskCostSummary = CostSummary & { task: string; base_revision: string | null };
export type BenchmarkCostSummary = CostSummary & {
  harness: string; version: string; tasks: TaskCostSummary[];
};

function summarize(attempts: AnalysisAttempt[], rates: PriceRates | null): CostSummary {
  let known = 0; let observations = 0; let complete = 0;
  for (const attempt of attempts) {
    if (rates === null) {
      if (attempt.cost_usd !== null) { known += attempt.cost_usd; observations++; complete++; }
      continue;
    }
    if (referenceCost(attempt, rates) !== null) complete++;
    for (const request of attempt.requests) {
      if (!request.successful || request.input_tokens === null || request.cached_input_tokens === null || request.output_tokens === null) continue;
      known += costUsd({ input: request.input_tokens, cached_input: request.cached_input_tokens, output: request.output_tokens }, rates)!;
      observations++;
    }
  }
  const subtotal = observations === 0 ? null : known;
  return {
    selected: attempts.length, complete_attempts: complete, known_usd: subtotal,
    total_usd: complete === attempts.length ? subtotal : null,
    // A partial mean is a lower bound over ALL selected runs, not a mean that
    // drops costly/incomplete runs. Presentation must retain the partial label.
    average_usd: subtotal === null ? null : subtotal / attempts.length,
  };
}

/** Descriptive costs by task name/base; image variants remain in detailed evidence. */
export function summarizeBenchmarkCosts(attempts: AnalysisAttempt[], rates: PriceRates | null): BenchmarkCostSummary[] {
  const harnesses = new Map<string, AnalysisAttempt[]>();
  for (const a of attempts) {
    const key = JSON.stringify([a.harness, a.version]);
    const found = harnesses.get(key) ?? []; found.push(a); harnesses.set(key, found);
  }
  return [...harnesses.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, runs]) => {
    const tasks = new Map<string, AnalysisAttempt[]>();
    for (const a of runs) {
      const key = JSON.stringify([a.task, a.task_base_revision]);
      const found = tasks.get(key) ?? []; found.push(a); tasks.set(key, found);
    }
    const summaries = [...tasks.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, values]) => ({
      task: values[0]!.task, base_revision: values[0]!.task_base_revision, ...summarize(values, rates),
    }));
    const summary = summarize(runs, rates);
    return { harness: runs[0]!.harness, version: runs[0]!.version, ...summary, tasks: summaries,
      // Equal task weighting: each task's mean across its repetitions gets one vote.
      average_usd: summaries.some(t => t.average_usd === null) ? null : summaries.reduce((sum, t) => sum + t.average_usd!, 0) / summaries.length,
    };
  });
}
