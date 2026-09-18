import { readFileSync } from "node:fs";
import { ConfigError } from "@aob/contracts";
import { analysisPopulationKey, type AnalysisAttempt, type AnalysisExport, type AnalysisPopulation } from "./analysis.js";
import { costUsd, type PriceRates } from "./aggregate.js";
import { priceBookPath } from "./price-books.js";
import type { OverviewRow } from "./overview.js";

export const REFERENCE_BOOK = "deepseek-v41-low-2026-09-10";
export type ComparisonGroup = {
  key: string; attempts: AnalysisAttempt[]; originals: AnalysisPopulation[];
  rates: PriceRates | null; reference_book: string | null;
};

function referenceModels(): Record<string, PriceRates> {
  try {
    const book = JSON.parse(readFileSync(priceBookPath(REFERENCE_BOOK), "utf8")) as { id: string; models: Record<string, PriceRates> };
    if (book.id !== REFERENCE_BOOK || !book.models || typeof book.models !== "object" || Array.isArray(book.models)) throw new ConfigError("Invalid reference price book");
    for (const rates of Object.values(book.models)) {
      if (!rates || ![rates.input, rates.cached_input, rates.output].every(v => typeof v === "number" && Number.isFinite(v) && v >= 0)) throw new ConfigError("Invalid reference rates");
    }
    return book.models;
  } catch (error) {
    throw new ConfigError(`Cannot load reference price book: ${error instanceof Error ? error.message : String(error)}`);
  }
}

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
  const models = referenceModels();
  const groups = new Map<string, ComparisonGroup>();
  for (const population of data.populations) {
    const ids = new Set(population.attempts);
    const attempts = data.attempts.filter(attempt => ids.has(attempt.run_id));
    const first = attempts[0];
    if (!first) continue;
    const rates = Object.hasOwn(models, first.model) ? models[first.model]! : null;
    // Temporary key projection only. Original attempts, prices and identities stay untouched.
    const key = rates === null ? population.key : analysisPopulationKey({ ...first, price_book: REFERENCE_BOOK });
    const group = groups.get(key) ?? { key, attempts: [], originals: [], rates, reference_book: rates === null ? null : REFERENCE_BOOK };
    group.attempts.push(...attempts);
    group.originals.push(population);
    groups.set(key, group);
  }
  return [...groups.values()];
}

export type RelativeMetric = "pass" | "cost" | "cache" | "input" | "output";
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
