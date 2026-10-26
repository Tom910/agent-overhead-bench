import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ConfigError } from "@aob/contracts";
import type { AnalysisAttempt, AnalysisExport } from "./analysis.js";
import { REFERENCE_BOOK } from "./comparison-overview.js";
import { buildCollectionLedger } from "./collection-ledger.js";

const rates = { input: 0.01, cached_input: 0.001, output: 0.02 };
const hash = (s: string) => `sha256:${createHash("sha256").update(s).digest("hex")}`;
const template = (JSON.parse(readFileSync(new URL("../../../evidence/linux-results-2026-09-19-r1/analysis.json", import.meta.url), "utf8")) as AnalysisExport).attempts[0]!;
function attempt(id: string, cost: number, partial = false): AnalysisAttempt {
  const row = structuredClone(template);
  return { ...row, run_id: id, hashes: { run: hash(`run:${id}`), events: hash(`events:${id}`) },
    usage_unavailable: null, cost_unavailable: partial ? "incomplete-accounting" : null,
    // Deliberately different original prices: this ledger must reprice requests.
    cost_usd: 999, requests: [{ ...row.requests[0]!, successful: true, input_tokens: cost * 100, cached_input_tokens: 0, output_tokens: 0 }] };
}
function fixture() {
  return { selected: [attempt("a", 1), attempt("b", 2)], superseded: [attempt("old", 0.25, true)],
    interrupted: [{ run_id: "startup", events_sha256: hash("startup"), event_count: 12 }],
    selected_dataset: "selected", prior_dataset: "prior", rates: { ...rates } };
}
describe("collection inventory and known reference cost", () => {
  it("counts selected, superseded and interrupted observations without claiming full collection cost", () => {
    const result = buildCollectionLedger(fixture());
    expect(result).toMatchObject({ reference_book: REFERENCE_BOOK, selected_count: 2, superseded_count: 1, interrupted_count: 1,
      known_reference_usd: 3.25, missing_cost_count: 2, complete_total_usd: null,
      historical_excluded_scope: "unknown", historical_excluded_count: null, historical_excluded_cost_usd: null });
    expect(result.items).toHaveLength(4);
    expect(result.items.find(row => row.run_id === "old")).toMatchObject({ class: "superseded", source_dataset: "prior", cost_status: "known-lower-bound", known_reference_usd: 0.25 });
    expect(result.items.find(row => row.run_id === "startup")).toMatchObject({ class: "interrupted", source_dataset: "selected", run_sha256: null, cost_status: "unknown", known_reference_usd: null });
    expect(result.items.filter(row => row.class === "selected").map(row => row.cost_status)).toEqual(["complete", "complete"]);
  });
  it("deduplicates copies, coalesces full event evidence, and is independent of input order", () => {
    const f = fixture(); const expected = buildCollectionLedger(f);
    f.selected.push(structuredClone(f.selected[0]!)); f.superseded.push(structuredClone(f.superseded[0]!));
    f.interrupted.push(structuredClone(f.interrupted[0]!), { run_id: "a", events_sha256: f.selected[0]!.hashes.events, event_count: 50 });
    f.selected.reverse(); f.superseded.reverse(); f.interrupted.reverse();
    expect(buildCollectionLedger(f)).toEqual(expected);
  });
  it("preserves distinct attempts with a reused run ID but different artifact hashes", () => {
    const f = fixture(); const other = attempt("other", 4); other.run_id = "a"; f.selected.push(other);
    expect(buildCollectionLedger(f)).toMatchObject({ selected_count: 3, known_reference_usd: 7.25 });
  });
  it.each(["run-hash", "run-id", "role", "cost", "event-count", "event-run-id", "full-event-run-id"])("rejects conflicting %s identity", change => {
    const f = fixture(); const first = f.selected[0]!;
    if (change === "run-hash") f.selected.push({ ...first, hashes: { ...first.hashes, events: hash("changed") } });
    if (change === "run-id") f.selected.push({ ...first, run_id: "different" });
    if (change === "role") f.superseded.push(first);
    if (change === "cost") f.selected.push({ ...first, requests: [] });
    if (change === "event-count") f.interrupted.push({ ...f.interrupted[0]!, event_count: 13 });
    if (change === "event-run-id") f.interrupted.push({ ...f.interrupted[0]!, run_id: "different" });
    if (change === "full-event-run-id") f.interrupted.push({ run_id: "different", events_sha256: first.hashes.events, event_count: 50 });
    expect(() => buildCollectionLedger(f)).toThrow(ConfigError);
  });
  it("keeps historical totals unknown even when every enumerated attempt is priced", () => {
    const f = fixture(); f.superseded = []; f.interrupted = [];
    expect(buildCollectionLedger(f)).toMatchObject({ known_reference_usd: 3, missing_cost_count: 0, complete_total_usd: null });
  });
  it("uses cached request prices for lower bounds and distinguishes measured zero from missing", () => {
    const f = fixture(); f.selected = [attempt("zero", 0)]; f.interrupted = [];
    f.superseded[0]!.requests[0]!.cached_input_tokens = 20;
    expect(buildCollectionLedger(f)).toMatchObject({ known_reference_usd: 0.07, missing_cost_count: 1 });
    expect(buildCollectionLedger(f).items.find(row => row.run_id === "zero")).toMatchObject({ known_reference_usd: 0, cost_status: "complete" });
    f.selected[0]!.requests = [];
    expect(buildCollectionLedger(f).items.find(row => row.run_id === "zero")).toMatchObject({ known_reference_usd: null, cost_status: "unknown" });
  });
  it("does not use original costs without shared reference rates", () => {
    expect(buildCollectionLedger({ ...fixture(), rates: null })).toMatchObject({ reference_book: null, known_reference_usd: null, missing_cost_count: 4 });
  });
  it.each(["hash", "count", "dataset", "rates"])("rejects malformed %s input", change => {
    const f = fixture();
    if (change === "hash") f.selected[0]!.hashes.run = "bad";
    if (change === "count") f.interrupted[0]!.event_count = -1;
    if (change === "dataset") f.prior_dataset = "";
    if (change === "rates") f.rates.input = NaN;
    expect(() => buildCollectionLedger(f)).toThrow(ConfigError);
  });
});
