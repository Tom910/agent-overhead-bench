import { analysisPopulationKey, type AnalysisAttempt, type AnalysisExport, type AnalysisPopulation } from "./analysis.js";
import { costUsd, type PriceRates } from "./aggregate.js";
import { referencePricing, type ReferencePricing } from "./reference-pricing.js";
export { REFERENCE_BOOK } from "./reference-pricing.js";
import type { OverviewRow } from "./overview.js";

export type ComparisonGroup = {
  key: string; attempts: AnalysisAttempt[]; originals: AnalysisPopulation[];
  rates: PriceRates | null; reference_book: string | null;
};

/** Hypothetical same-rate price, not a replacement for original recorded costs. */
export function referenceCost(attempt: AnalysisAttempt, rates: PriceRates): number | null {
  if (attempt.usage_unavailable !== null || attempt.cost_unavailable === "incomplete-accounting") return null;
  const requests = attempt.requests.filter(request => request.successful);
  if (requests.length === 0) return null;
  let total = 0;
  for (const request of requests) {
    if (request.input_tokens === null || request.cached_input_tokens === null || request.output_tokens === null) return null;
    total += costUsd({ input: request.input_tokens, cached_input: request.cached_input_tokens, output: request.output_tokens }, rates)!;
  }
  return total;
}

/** Price-book differences alone do not split the token/reference-cost overview. */
export function comparisonGroups(data: AnalysisExport): ComparisonGroup[] {
  const prices = new Map<string, ReferencePricing | null>();
  const groups = new Map<string, ComparisonGroup>();
  for (const population of data.populations) {
    const ids = new Set(population.attempts);
    const attempts = data.attempts.filter(attempt => ids.has(attempt.run_id));
    const first = attempts[0];
    if (!first) continue;
    if (!prices.has(first.model)) prices.set(first.model, referencePricing(first.model));
    const pricing = prices.get(first.model)!, rates = pricing?.rates ?? null;
    // Temporary key projection only. Original attempts, prices and identities stay untouched.
    const key = rates === null ? population.key : analysisPopulationKey({ ...first, price_book: pricing!.reference_book });
    const group = groups.get(key) ?? { key, attempts: [], originals: [], rates, reference_book: pricing?.reference_book ?? null };
    group.attempts.push(...attempts);
    group.originals.push(population);
    groups.set(key, group);
  }
  return [...groups.values()];
}

export type RelativeMetric = "pass" | "cost" | "benchmark" | "cache" | "input" | "output";
export function relativeMetricScore(row: OverviewRow, rows: OverviewRow[], key: RelativeMetric): number | null {
  const value = (r: OverviewRow) => key === "pass" ? r.pass_rate : r[key].n === r.selected ? r[key].value : null;
  const current = value(row);
  const values = rows.map(value).filter((v): v is number => v !== null);
  if (current === null || values.length === 0) return null;
  if (key === "pass" || key === "cache") {
    const best = Math.max(...values);
    return best === 0 ? null : current / best * 100;
  }
  const best = Math.min(...values);
  return current === 0 ? 100 : best / current * 100;
}
