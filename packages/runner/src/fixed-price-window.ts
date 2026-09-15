import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { setTimeout as delay } from "node:timers/promises";
import { ConfigError, type ProviderRouting } from "@aob/contracts";
import type { BudgetRates } from "./budget.js";

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const WEEK = 7 * 1440;
const MODEL = "deepseek/deepseek-v4.1-flash";
export const FIXED_PRICE_BOOK = "deepseek-v41-low-2026-09-10";
function object(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new ConfigError("invalid fixed-price metadata object");
  return value as Record<string, unknown>;
}
function rate(value: unknown): number {
  if ((typeof value !== "string" && typeof value !== "number") || value === "" || !Number.isFinite(Number(value)) || Number(value) < 0) throw new ConfigError("invalid fixed-price rate");
  return Number(value);
}
function matches(value: Record<string, unknown>, rates: BudgetRates): boolean {
  return rate(value.prompt) === rates.input && rate(value.input_cache_read) === rates.cached_input && rate(value.completion) === rates.output;
}
function minute(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 2359 || value % 100 >= 60) throw new ConfigError("invalid UTC schedule clock");
  return Math.floor(value / 100) * 60 + value % 100;
}
/** Every UTC minute must have exactly one declared tier; no inferred base tier. */
export function compilePriceSchedule(value: unknown, rates: BudgetRates): boolean[] {
  if (!Array.isArray(value) || value.length === 0) throw new ConfigError("missing fixed-price schedule");
  const week: Array<boolean | undefined> = Array.from({ length: WEEK });
  for (const raw of value) {
    const entry = object(raw);
    if (!Array.isArray(entry.utc_days) || entry.utc_days.length === 0) throw new ConfigError("missing UTC schedule days");
    const wholeDay = entry.utc_start === undefined && entry.utc_end === undefined;
    const start = wholeDay ? 0 : minute(entry.utc_start);
    const end = wholeDay ? 1440 : entry.utc_end === 0 ? 1440 : minute(entry.utc_end);
    if (end <= start) throw new ConfigError("unsupported wrapping UTC schedule interval");
    const matching = matches(entry, rates);
    for (const day of entry.utc_days) {
      const dayIndex = DAYS.indexOf(String(day));
      if (dayIndex < 0) throw new ConfigError("invalid UTC schedule day");
      for (let i = dayIndex * 1440 + start; i < dayIndex * 1440 + end; i++) {
        if (week[i] !== undefined) throw new ConfigError("overlapping fixed-price schedule");
        week[i] = matching;
      }
    }
  }
  if (week.some((v) => v === undefined)) throw new ConfigError("incomplete fixed-price schedule");
  return week as boolean[];
}
/** Return the end of this uninterrupted matching window only if duration fits. */
export function matchingWindowEnd(week: boolean[], now: number, durationS: number): number | null {
  if (week.length !== WEEK || !Number.isFinite(now) || !Number.isFinite(durationS) || durationS <= 0 || durationS >= WEEK * 60) throw new ConfigError("invalid fixed-price window request");
  const date = new Date(now);
  const index = date.getUTCDay() * 1440 + date.getUTCHours() * 60 + date.getUTCMinutes();
  if (week[index] !== true) return null;
  let steps = 1;
  while (steps < WEEK && week[(index + steps) % WEEK] === true) steps++;
  const end = Math.floor(now / 60000) * 60000 + steps * 60000;
  return now + durationS * 1000 < end ? end : null;
}
export function validateLivePriceEndpoint(value: unknown, rawBook: unknown, rates: BudgetRates): Record<string, unknown> {
  const book = object(rawBook);
  const data = object(object(value).data);
  if (data.id !== MODEL || !Array.isArray(data.endpoints)) throw new ConfigError("fixed-price endpoint model mismatch");
  const candidates = data.endpoints.map(object).filter((entry) => entry.tag === "deepseek");
  const endpoint = candidates[0];
  if (candidates.length !== 1 || endpoint === undefined || endpoint.status !== 0 || endpoint.model_id !== MODEL || endpoint.name !== `DeepSeek | ${String(book.canonical_model)}`) throw new ConfigError("fixed-price provider endpoint unavailable or changed");
  const pricing = object(endpoint.pricing);
  if (!matches(pricing, rates) || (pricing.discount !== undefined && pricing.discount !== 0) || !isDeepStrictEqual(pricing.overrides, object(book.pricing_condition).provider_schedule)) throw new ConfigError("live fixed-price rates or schedule changed");
  // Unknown positive ancillary charges would invalidate the three-rate book.
  for (const [key, value] of Object.entries(pricing)) {
    if (!["prompt", "completion", "input_cache_read", "discount", "overrides"].includes(key) && rate(value) !== 0) throw new ConfigError(`unpriced endpoint charge: ${key}`);
  }
  return endpoint;
}
export function assertPriceDeadline(validUntil: number, timeoutS: number, now = Date.now()): void {
  if (!Number.isFinite(validUntil) || !Number.isFinite(timeoutS) || timeoutS <= 0 || now + (timeoutS + 300) * 1000 >= validUntil) throw new ConfigError("fixed-price admission expired during setup");
}
export function createFixedPriceGuard(rawBook: unknown, options: {
  model: string; upstream: string; routing?: ProviderRouting; evidencePath: string;
}): (cell: { id: string }, task: { timeoutS: number }) => Promise<() => void> {
  const book = object(rawBook);
  const policy = object(book.pricing_condition);
  if (book.id !== FIXED_PRICE_BOOK || options.model !== MODEL || book.provider !== "deepseek" || book.canonical_model !== "deepseek/deepseek-v4.1-flash-20260910" || policy.kind !== "fixed-provider-tier" || policy.required_guard !== "whole-cell-timeout-plus-margin" || !["https://openrouter.ai/api", "https://openrouter.ai/api/v1"].includes(options.upstream.replace(/\/$/, "")) || options.routing?.only_provider !== "deepseek" || options.routing.allow_fallbacks !== false || !isDeepStrictEqual(options.routing.ignored_providers, ["relace"])) throw new ConfigError("fixed-price book requires its approved model, policy and provider routing");
  const rawRates = object(object(book.models)[MODEL]);
  const rates = { input: rate(rawRates.input), cached_input: rate(rawRates.cached_input), output: rate(rawRates.output) };
  const week = compilePriceSchedule(policy.provider_schedule, rates);
  return async (cell, task) => {
    const duration = task.timeoutS + 300;
    if (!Number.isFinite(duration) || task.timeoutS <= 0 || !week.some(Boolean)) throw new ConfigError("cell cannot fit fixed-price schedule");
    let lastNotice = 0;
    for (;;) {
      const now = Date.now();
      const until = matchingWindowEnd(week, now, duration);
      if (until === null) {
        if (now - lastNotice >= 300000) {
          process.stderr.write(`Waiting for a matching provider price window: ${cell.id}\n`);
          lastNotice = now;
        }
        await delay(60000);
        continue;
      }
      let snapshot: unknown;
      try {
        const response = await fetch(`https://openrouter.ai/api/v1/models/${MODEL}/endpoints`, { signal: AbortSignal.timeout(15000), cache: "no-store" });
        if (!response.ok) throw new ConfigError(`endpoint catalog returned ${response.status}`);
        snapshot = await response.json();
      } catch (error) {
        throw new ConfigError(`fixed-price live check failed: ${error instanceof Error ? error.message : String(error)}`);
      }
      const endpoint = validateLivePriceEndpoint(snapshot, book, rates);
      const checkedAt = Date.now();
      const validUntil = matchingWindowEnd(week, checkedAt, duration);
      if (validUntil === null) continue;
      mkdirSync(dirname(options.evidencePath), { recursive: true });
      appendFileSync(options.evidencePath, `${JSON.stringify({ cell_id: cell.id, checked_at: new Date(checkedAt).toISOString(), valid_until: new Date(validUntil).toISOString(), timeout_s: task.timeoutS, margin_s: 300, price_book: book.id, endpoint })}\n`, { mode: 0o600 });
      return () => assertPriceDeadline(validUntil, task.timeoutS);
    }
  };
}
