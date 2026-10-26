import { ConfigError } from "@aob/contracts";
import type { AnalysisAttempt } from "./analysis.js";
import type { PriceRates } from "./aggregate.js";
import { summarizeBenchmarkCosts } from "./benchmark-cost.js";
import { referenceBookForAttempts } from "./reference-pricing.js";

export type LedgerItem = { run_id: string; run_sha256: string | null; events_sha256: string;
  class: "selected" | "superseded" | "interrupted"; cost_status: "complete" | "known-lower-bound" | "unknown";
  known_reference_usd: number | null; source_dataset: string };
export type CollectionLedger = { reference_book: string | null; items: LedgerItem[];
  selected_count: number; superseded_count: number; interrupted_count: number;
  known_reference_usd: number | null; missing_cost_count: number; complete_total_usd: number | null;
  historical_excluded_scope: "unknown"; historical_excluded_count: null; historical_excluded_cost_usd: null };
const fail = (message: string): never => { throw new ConfigError(`collection ledger: ${message}`); };
const hash = (value: string): boolean => /^sha256:[a-f0-9]{64}$/.test(value);
const dataset = (value: string): boolean => /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value);

/** Inventory only validated selected/prior inputs; historical completeness is unknown. */
export function buildCollectionLedger(input: { selected: readonly AnalysisAttempt[]; superseded: readonly AnalysisAttempt[];
  interrupted: readonly { run_id: string; events_sha256: string; event_count: number }[];
  selected_dataset: string; prior_dataset: string | null; rates: PriceRates | null }): CollectionLedger {
  if (!dataset(input.selected_dataset) || (input.prior_dataset !== null && !dataset(input.prior_dataset)) ||
    (input.superseded.length > 0 && (input.prior_dataset === null || input.prior_dataset === input.selected_dataset))) return fail("invalid source dataset");
  if (input.rates !== null && ![input.rates.input, input.rates.cached_input, input.rates.output].every(v => Number.isFinite(v) && v >= 0)) return fail("invalid reference rates");
  const full = new Map<string, LedgerItem>(), byEvents = new Map<string, LedgerItem[]>();
  for (const role of ["selected", "superseded"] as const) for (const attempt of input[role]) {
    if (!attempt.run_id || !hash(attempt.hashes.run) || !hash(attempt.hashes.events)) return fail("invalid artifact identity");
    const cost = input.rates === null ? null : summarizeBenchmarkCosts([attempt], input.rates)[0]!;
    const known = cost?.known_usd ?? null;
    if (known !== null && (!Number.isFinite(known) || known < 0)) return fail("invalid cost");
    const item: LedgerItem = { run_id: attempt.run_id, run_sha256: attempt.hashes.run, events_sha256: attempt.hashes.events,
      class: role, source_dataset: role === "selected" ? input.selected_dataset : input.prior_dataset!,
      cost_status: cost?.complete_attempts === 1 ? "complete" : known === null ? "unknown" : "known-lower-bound", known_reference_usd: known };
    const previous = full.get(attempt.hashes.run);
    // A run hash binds its ID, event hash and facts. Identical copies count once.
    if (previous) {
      if (JSON.stringify(previous) !== JSON.stringify(item)) return fail("conflicting full artifact identity, role or cost");
      continue;
    }
    full.set(attempt.hashes.run, item);
    const matches = byEvents.get(item.events_sha256) ?? []; matches.push(item); byEvents.set(item.events_sha256, matches);
  }
  const eventsOnly = new Map<string, { run_id: string; events_sha256: string; event_count: number }>();
  for (const event of input.interrupted) {
    if (!event.run_id || !hash(event.events_sha256) || !Number.isSafeInteger(event.event_count) || event.event_count < 0) return fail("invalid interrupted identity");
    const previous = eventsOnly.get(event.events_sha256);
    if (previous && (previous.run_id !== event.run_id || previous.event_count !== event.event_count)) return fail("conflicting event identity");
    eventsOnly.set(event.events_sha256, event);
  }
  const items = [...full.values()];
  for (const event of eventsOnly.values()) {
    const matches = byEvents.get(event.events_sha256);
    if (matches) {
      if (matches.length !== 1 || matches[0]!.run_id !== event.run_id) return fail("ambiguous full/event identity");
      // Exact bytes identify the stream. Analysis turns are NOT raw event count.
      continue;
    }
    items.push({ run_id: event.run_id, run_sha256: null, events_sha256: event.events_sha256, class: "interrupted",
      cost_status: "unknown", known_reference_usd: null, source_dataset: input.selected_dataset });
  }
  const key = (item: LedgerItem) => JSON.stringify([item.class, item.run_id, item.run_sha256, item.events_sha256]);
  items.sort((a, b) => key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0);
  const known = items.filter(item => item.known_reference_usd !== null);
  return { reference_book: referenceBookForAttempts([...input.selected, ...input.superseded], input.rates), items,
    selected_count: items.filter(item => item.class === "selected").length,
    superseded_count: items.filter(item => item.class === "superseded").length,
    interrupted_count: items.filter(item => item.class === "interrupted").length,
    known_reference_usd: known.length ? known.reduce((sum, item) => sum + item.known_reference_usd!, 0) : null,
    missing_cost_count: items.filter(item => item.cost_status !== "complete").length,
    complete_total_usd: null, historical_excluded_scope: "unknown", historical_excluded_count: null, historical_excluded_cost_usd: null };
}
