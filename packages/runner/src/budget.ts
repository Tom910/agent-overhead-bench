import { BudgetExceeded, ConfigError, isPreInferenceRejection, isModelRequestAttempt, isSuccessfulModelEvent, type C1Event } from "@aob/contracts";

export type BudgetRates = {
  input: number;
  cached_input: number;
  output: number;
};

export function estimateEventsUsd(
  events: Array<{ usage: { input: number; cached_input: number; output: number } | null }>,
  rates: BudgetRates,
): number | null {
  let total = 0;
  for (const event of events) {
    if (event.usage === null) return null;
    if (!Number.isFinite(event.usage.input) || !Number.isFinite(event.usage.cached_input) ||
      !Number.isFinite(event.usage.output) || event.usage.input < 0 || event.usage.cached_input < 0 ||
      event.usage.output < 0 || event.usage.cached_input > event.usage.input) {
      throw new ConfigError("cannot price invalid token counts");
    }
    const uncached = Math.max(0, event.usage.input - event.usage.cached_input);
    total += uncached * rates.input;
    total += event.usage.cached_input * rates.cached_input;
    total += event.usage.output * rates.output;
  }
  return total;
}

/** Preserve unknown upstream failure spend without assigning failed-request usage. */
export function estimateRunSpendUsd(
  events: C1Event[],
  condition: "pinned" | "default",
  rates: BudgetRates | undefined,
): number | null {
  if (events.some((event) => isModelRequestAttempt(event) &&
      !isSuccessfulModelEvent(event) && !isPreInferenceRejection(event) && event.error?.kind !== "proxy_refused")) return null;
  const measuredEvents = events.filter(isSuccessfulModelEvent);
  if (condition !== "pinned" || rates === undefined) return measuredEvents.length === 0 ? 0 : null;
  return estimateEventsUsd(measuredEvents, rates);
}

export function assertBudget(spentUsd: number, nextUsd: number | null, capUsd: number): void {
  if (nextUsd === null) {
    throw new BudgetExceeded("cannot estimate cell spend because C1 usage is unavailable");
  }
  if (spentUsd + nextUsd > capUsd) {
    throw new BudgetExceeded(`budget cap ${capUsd.toFixed(2)} USD would be exceeded`);
  }
}
