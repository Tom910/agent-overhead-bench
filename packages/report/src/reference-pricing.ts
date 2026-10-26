import { readFileSync } from "node:fs";
import { ConfigError } from "@aob/contracts";
import type { PriceRates } from "./aggregate.js";
import type { AnalysisAttempt } from "./analysis.js";
import { priceBookPath } from "./price-books.js";

export const REFERENCE_BOOK = "deepseek-v41-low-2026-09-10";
export const REFERENCE_1017_BOOK = "deepseek-v41-1017-reference-2026-10-18";
const MODEL_1017 = "deepseek/deepseek-v4.1-flash-1017";
export type ReferencePricing = { reference_book: string; rates: PriceRates };
const validRates = (rates: PriceRates): boolean => rates !== null && typeof rates === "object" &&
  [rates.input, rates.cached_input, rates.output].every(value => typeof value === "number" && Number.isFinite(value) && value >= 0);

function referenceModels(id: string): Record<string, PriceRates> {
  try {
    const book = JSON.parse(readFileSync(priceBookPath(id), "utf8")) as { id: string; models: Record<string, PriceRates> };
    if (book.id !== id || !book.models || typeof book.models !== "object" || Array.isArray(book.models)) throw new ConfigError("Invalid reference price book");
    if (Object.values(book.models).some(rates => !validRates(rates))) throw new ConfigError("Invalid reference rates");
    return book.models;
  } catch (error) {
    throw new ConfigError(`Cannot load reference price book: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/** Exact model support only; dated book identities are never interchangeable. */
export function referencePricing(model: string): ReferencePricing | null {
  const reference_book = model === MODEL_1017 ? REFERENCE_1017_BOOK : REFERENCE_BOOK;
  const models = referenceModels(reference_book);
  return Object.hasOwn(models, model) ? { reference_book, rates: { ...models[model]! } } : null;
}

/** Preserve legacy hypothetical rates; new 1017 labels require its approved rates. */
export function referenceBookForAttempts(attempts: readonly Pick<AnalysisAttempt, "model">[], rates: PriceRates | null): string | null {
  if (rates === null) return null;
  if (!validRates(rates)) throw new ConfigError("Invalid reference rates");
  const books = new Set(attempts.map(attempt => attempt.model === MODEL_1017 ? REFERENCE_1017_BOOK : REFERENCE_BOOK));
  if (books.size > 1) throw new ConfigError("Mixed reference books require separate populations");
  const book = books.values().next().value ?? REFERENCE_BOOK;
  if (book === REFERENCE_1017_BOOK) {
    const approved = referencePricing(MODEL_1017);
    if (approved === null || rates.input !== approved.rates.input || rates.cached_input !== approved.rates.cached_input || rates.output !== approved.rates.output) {
      throw new ConfigError("1017 reference rates differ from the approved book");
    }
  }
  return book;
}
