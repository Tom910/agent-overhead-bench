import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ConfigError } from "@aob/contracts";
import { analyzeAttempts } from "./analysis.js";
import { replayAnalysis } from "./analysis-replay.js";
import { comparisonGroups, referenceCost } from "./comparison-overview.js";
import { REFERENCE_1017_BOOK } from "./reference-pricing.js";
import { buildValidityDiagnostics } from "./validity-diagnostics.js";
import type { CurrentCampaign } from "./current-campaign.js";
import type { CollectionLedger } from "./collection-ledger.js";
import type { AnalysisRequest } from "./request-analysis.js";

export const SNAPSHOT_DATASET = "linux-results-2026-10-24";
export const SNAPSHOT_KIND = "five-cli-1017-descriptive-snapshot";
// Approved S6 facts, independently reviewed before S8 admission. Adjacent mutable
// provenance cannot reapprove a coherent rewrite of these immutable sources.
const APPROVED_SOURCE = "sha256:df6381aaa6b6b53ef0d9e0cd3f344cbe101a142a48721d1691e2aaad7c654dee";
const SOURCES = ["analysis.json", "summary.json", "cohorts.json", "native-evidence.json", "extra-attempts.json", "collection-ledger.json"];
const TOOLS = ["cline", "codex", "hermes", "pi", "qwen"];
const MODEL = "deepseek/deepseek-v4.1-flash-1017";
export const snapshotHash = (bytes: string | Buffer): string => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
export const snapshotJson = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;
export function requireSnapshot(valid: boolean, message: string): asserts valid {
  if (!valid) throw new ConfigError(`1017 snapshot: ${message}`);
}
export type SnapshotSummary = {
  schema_version: number; kind: string; status: string; as_of: string; official_release: boolean;
  model: string; regime: string; reference_book: string; expected_slots: number; selected_slots: number;
  observed_primary_attempts: number; native_passes: number; native_failures: number; partial_native_captures: number;
  prerequisite_attempts: number; prerequisite_reserved_usd: number; prerequisite_known_reference_cost_subtotal_usd: number;
  selected_reference_cost_usd: number; extra_known_reference_cost_lower_bound_usd: number;
  full_experiment_measured_cost_usd: null; billing_reconciliation_claimed: boolean; selection_basis: string; collection: string;
  slots: { run_id: string; harness: string; task: string; rep: number; outcome: string; host: string; price_book: string; run_sha256: string; events_sha256: string }[];
};
export type SnapshotExtra = { run_id: string; cell_id: string; outcome: string; adapter_wall_ms: number | null;
  ledger_start_iso?: string; ledger_end_iso?: null; measured_cost_usd: null; selected: boolean;
  run_sha256?: string; events_sha256: string; captured_events: number; successful_captured_responses: number;
  known_reference_cost_lower_bound_usd: number; captured_requests: AnalysisRequest[] };
type Cohort = { id: string; tools: string[]; selected_slots: number; native_passes: number; native_failures: number;
  analysis_sha256: string; run_ids: string[]; schedule_sha256: string; reps: number; seed: number; task_ids: string[];
  retained_imports: { run_id: string; run_sha256: string; events_sha256: string }[]; fresh_run_ids: string[] };
type CohortSource = { cohorts: Cohort[]; collection_windows: { start_iso: string; end_iso: string | null; attempt_count: number; ledger_sha256: string }[];
  source_lineage: { source_adapter: string; source_dataset: string; revision: string; review: { source_reviewed: boolean; reference_results_verified: boolean; calibration_complete: boolean; maintainer_signed_off: boolean; reviewer: string } };
  native_qualification_criterion: string; official_release: boolean };
type NativeProof = { run_id: string; run_sha256: string; events_sha256: string; native_manifest_sha256: string; native_reward: number; capture_status: string };
export type SnapshotFacts = { summary: SnapshotSummary; extras: SnapshotExtra[]; cohorts: CohortSource; collection: CollectionLedger; source_sha256: string };
const hashShape = (value: string): boolean => /^sha256:[a-f0-9]{64}$/.test(value);
const equal = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);
const close = (a: number, b: number): boolean => Number.isFinite(a) && Math.abs(a - b) < 1e-9;

/** Exact immutable snapshot only. Derivation never repairs or approves sources. */
export function loadValidated1017Snapshot(root: string, pointer: Record<string, unknown>, mode: "stored" | "derive"): CurrentCampaign {
  try {
    requireSnapshot(mode === "stored" || mode === "derive", "invalid loading mode");
    requireSnapshot(pointer.schema_version === 2 && pointer.kind === SNAPSHOT_KIND && pointer.dataset === SNAPSHOT_DATASET &&
      equal(Object.keys(pointer).sort(), ["dataset", "kind", "schema_version"]), "exact version2 pointer required; no historical audits");
    const dir = join(root, "evidence", SNAPSHOT_DATASET);
    const read = (name: string): Buffer => readFileSync(join(dir, name));
    const parse = <T>(name: string): T => JSON.parse(read(name).toString()) as T;
    const sourceBytes = read("source.json");
    requireSnapshot(snapshotHash(sourceBytes) === APPROVED_SOURCE, "approved source manifest hash mismatch");
    const source = JSON.parse(sourceBytes.toString()) as { schema_version: number; kind: string; dataset: string; artifacts: Record<string, string>; source_bindings: Record<string, string>; producer_sha256: string };
    requireSnapshot(source.schema_version === 2 && source.kind === SNAPSHOT_KIND && source.dataset === SNAPSHOT_DATASET &&
      equal(Object.keys(source.artifacts).sort(), [...SOURCES].sort()), "source manifest identity mismatch");
    for (const name of SOURCES) requireSnapshot(snapshotHash(read(name)) === source.artifacts[name], `immutable ${name} hash mismatch`);
    const provenance = parse<Record<string, unknown>>("provenance.json"), artifacts = provenance.artifacts as Record<string, string>;
    requireSnapshot(artifacts !== null && typeof artifacts === "object", "artifact bindings missing");
    for (const name of SOURCES) requireSnapshot(artifacts[name] === source.artifacts[name], `provenance ${name} mismatch`);
    requireSnapshot(equal(provenance.source_bindings, source.source_bindings) && provenance.producer_sha256 === source.producer_sha256, "original source proofs changed");
    const analysis = replayAnalysis(JSON.parse(read("analysis.json").toString()) as unknown), analysisSha = source.artifacts["analysis.json"]!;
    const summary = parse<SnapshotSummary>("summary.json"), cohorts = parse<CohortSource>("cohorts.json");
    const native = parse<NativeProof[]>("native-evidence.json"), extras = parse<SnapshotExtra[]>("extra-attempts.json");
    const collection = parse<CollectionLedger>("collection-ledger.json");
    requireSnapshot(summary.schema_version === 2 && summary.kind === SNAPSHOT_KIND && summary.status === "completed" && !summary.official_release &&
      summary.expected_slots === 80 && summary.selected_slots === 80 && analysis.attempts.length === 80 && summary.slots.length === 80 &&
      summary.model === MODEL && summary.regime === "extended" && summary.reference_book === REFERENCE_1017_BOOK && summary.selection_basis === "completion-selected" &&
      summary.observed_primary_attempts === 83 && summary.prerequisite_attempts === 52 && summary.partial_native_captures === 3 &&
      summary.full_experiment_measured_cost_usd === null && summary.billing_reconciliation_claimed === false, "completed descriptive80 metadata required");
    requireSnapshot(provenance.schema_version === 2 && provenance.kind === SNAPSHOT_KIND && provenance.selected_attempt_count === 80 && provenance.official_release === false &&
      provenance.as_of === summary.as_of && provenance.summary_sha256 === source.artifacts["summary.json"], "provenance selection mismatch");
    const byId = new Map(analysis.attempts.map(a => [a.run_id, a])), slots = new Map(summary.slots.map(s => [s.run_id, s]));
    const proofs = new Map(native.map(n => [n.run_id, n]));
    requireSnapshot(byId.size === 80 && slots.size === 80 && proofs.size === 80 && native.length === 80, "unique selected/native bindings required");
    const matrix = new Set<string>(), tasks = new Set<string>(), versions = new Map<string, Set<string>>();
    for (const a of analysis.attempts) {
      const slot = slots.get(a.run_id), proof = proofs.get(a.run_id);
      requireSnapshot(equal(slot, { run_id: a.run_id, harness: a.harness, task: a.task, rep: a.rep, outcome: a.outcome, host: a.host.os,
        price_book: a.price_book, run_sha256: a.hashes.run, events_sha256: a.hashes.events }), "selection binding mismatch");
      requireSnapshot(a.model === MODEL && a.price_book === REFERENCE_1017_BOOK && a.host.os === "linux" && a.regime === "extended" && a.condition === "pinned" &&
        TOOLS.includes(a.harness) && a.routing?.only_provider === "deepseek" && a.routing.allow_fallbacks === false && a.routing.ignored_providers.includes("relace"), "model/host/routing/book mismatch");
      requireSnapshot([0, 1].includes(a.rep) && ["completed", "verify_error"].includes(a.outcome) && a.usage_unavailable === null && a.cost_unavailable === null && a.cost_usd !== null, "unfinished outcome or incomplete accounting");
      requireSnapshot(proof !== undefined && proof.run_sha256 === a.hashes.run && proof.events_sha256 === a.hashes.events && hashShape(proof.native_manifest_sha256) &&
        proof.native_reward === (a.outcome === "completed" ? 1 : 0) && ["complete", "partial"].includes(proof.capture_status), "native outcome binding mismatch");
      matrix.add(JSON.stringify([a.harness, a.task, a.rep])); tasks.add(a.task);
      const found = versions.get(a.harness) ?? new Set<string>(); found.add(a.version); versions.set(a.harness, found);
    }
    requireSnapshot(matrix.size === 80 && tasks.size === 8 && versions.size === 5 && [...versions.values()].every(v => v.size === 1), "5 tools x8 tasks x2 repetitions required");
    requireSnapshot(analysis.attempts.filter(a => a.outcome === "completed").length === 44 && summary.native_passes === 44 && summary.native_failures === 36 && native.filter(n => n.capture_status === "partial").length === 3, "native counts mismatch");
    requireSnapshot(cohorts.cohorts.length === 2 && !cohorts.official_release && cohorts.collection_windows.length === 6 &&
      cohorts.collection_windows.reduce((n, w) => n + w.attempt_count, 0) === 83 && cohorts.collection_windows.at(-1)!.end_iso === summary.as_of &&
      cohorts.collection_windows.filter(w => w.end_iso === null).length === 2, "original cohort windows required");
    const members = new Set<string>();
    for (const [i, cohort] of cohorts.cohorts.entries()) {
      const ids = new Set(cohort.run_ids), facts = analysis.attempts.filter(a => ids.has(a.run_id));
      requireSnapshot(cohort.selected_slots === (i === 0 ? 32 : 48) && facts.length === cohort.selected_slots && ids.size === facts.length &&
        equal([...new Set(facts.map(a => a.harness))].sort(), i === 0 ? ["pi", "qwen"] : ["cline", "codex", "hermes"]) && cohort.reps === 2 &&
        cohort.task_ids.length === 8 && hashShape(cohort.schedule_sha256), "cohort population mismatch");
      requireSnapshot(snapshotHash(snapshotJson(analyzeAttempts(facts))) === cohort.analysis_sha256, "frozen cohort analysis changed");
      requireSnapshot(cohort.retained_imports.length === (i === 0 ? 18 : 41) && cohort.fresh_run_ids.length === (i === 0 ? 14 : 7), "import/fresh counts mismatch");
      const covered = new Set(cohort.fresh_run_ids);
      for (const imported of cohort.retained_imports) {
        const fact = byId.get(imported.run_id);
        requireSnapshot(fact !== undefined && ids.has(imported.run_id) && !covered.has(imported.run_id) && imported.run_sha256 === fact.hashes.run && imported.events_sha256 === fact.hashes.events, "retained import changed");
        covered.add(imported.run_id);
      }
      requireSnapshot(covered.size === ids.size && [...covered].every(id => ids.has(id)), "cohort import/fresh membership mismatch");
      for (const id of ids) { requireSnapshot(!members.has(id), "overlapping cohorts"); members.add(id); }
    }
    requireSnapshot(members.size === 80, "cohort coverage mismatch");
    const lineage = cohorts.source_lineage, review = lineage.review;
    requireSnapshot(lineage.source_adapter === "deepswe" && lineage.source_dataset === "swe-bench-ultra" && review.source_reviewed && review.reference_results_verified && review.calibration_complete &&
      review.maintainer_signed_off && review.reviewer.includes("not human review") && cohorts.native_qualification_criterion === "verified-native-outcomes", "source-specific qualification missing");
    const groups = comparisonGroups(analysis);
    requireSnapshot(groups.length === 1 && groups[0]!.reference_book === REFERENCE_1017_BOOK && groups[0]!.rates !== null, "one exact reference-price population required");
    const group = groups[0]!, selectedCost = analysis.attempts.reduce((n, a) => n + referenceCost(a, group.rates!)!, 0);
    requireSnapshot(close(selectedCost, 10.088272872) && close(selectedCost, summary.selected_reference_cost_usd), "selected reference total mismatch");
    requireSnapshot(extras.length === 3 && new Set(extras.map(e => e.events_sha256)).size === 3 && extras.every(e => !e.selected && e.measured_cost_usd === null && hashShape(e.events_sha256)) &&
      extras[0]!.outcome === "timeout" && extras[0]!.adapter_wall_ms === 10800372.153713003 && extras.slice(1).every(e => e.adapter_wall_ms === null && e.ledger_end_iso === null), "all three original incomplete attempts required");
    requireSnapshot(collection.reference_book === REFERENCE_1017_BOOK && collection.selected_count === 80 && collection.superseded_count === 1 && collection.interrupted_count === 2 && collection.items.length === 83 &&
      collection.complete_total_usd === null && collection.missing_cost_count === 3 && close(extras.reduce((n, e) => n + e.known_reference_cost_lower_bound_usd, 0), summary.extra_known_reference_cost_lower_bound_usd), "full cost remains unknown");
    for (const item of collection.items) {
      if (item.class === "selected") {
        const a = byId.get(item.run_id);
        requireSnapshot(a !== undefined && item.run_sha256 === a.hashes.run && item.events_sha256 === a.hashes.events && item.source_dataset === SNAPSHOT_DATASET && item.cost_status === "complete" && close(item.known_reference_usd!, referenceCost(a, group.rates!)!), "ledger selected binding mismatch");
      } else {
        const e = extras.find(e => e.events_sha256 === item.events_sha256);
        requireSnapshot(e !== undefined && item.run_id === e.run_id && (item.class === "superseded" ? item.run_sha256 === e.run_sha256 && item.source_dataset === cohorts.cohorts[1]!.id && item.cost_status === "known-lower-bound" && close(item.known_reference_usd!, e.known_reference_cost_lower_bound_usd) : item.run_sha256 === null && item.cost_status === "unknown" && item.known_reference_usd === null), "extra ledger binding mismatch");
      }
    }
    const evidence = { conditions: null, audit: null, conditions_dataset: null, audit_dataset: null };
    const diagnostics = buildValidityDiagnostics({ dataset: SNAPSHOT_DATASET, analysis_sha256: analysisSha, attempts: analysis.attempts, population_key: group.key, rates: group.rates, audit: null, audit_dataset: null, collection });
    if (mode === "stored") requireSnapshot(snapshotHash(read("diagnostics.json")) === artifacts["diagnostics.json"] && read("diagnostics.json").toString() === snapshotJson(diagnostics), "diagnostics binding/reproducibility mismatch");
    return { dataset: SNAPSHOT_DATASET, analysis_sha256: analysisSha, analysis, diagnostics, groups, evidence,
      publication: { exported: summary.as_of, replacementNote: "", collectionNote: summary.collection, provenance, artifacts, evidenceHashes: {},
        snapshot: { summary, extras, cohorts, collection, source_sha256: APPROVED_SOURCE } } };
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    throw new ConfigError(`1017 snapshot: ${error instanceof Error ? error.message : String(error)}`);
  }
}
