import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { PriceRates } from "./aggregate.js";
import { analysisPopulationKey, analyzeAttempts, type AnalysisAttempt, type AnalysisExport } from "./analysis.js";
import { buildCollectionLedger } from "./collection-ledger.js";
import { REFERENCE_BOOK } from "./comparison-overview.js";
import { buildValidityDiagnostics } from "./validity-diagnostics.js";
import type { ValidatedCampaign } from "./validated-campaign-registry.js";

const canonical = JSON.parse(readFileSync(new URL("../../../evidence/linux-results-2026-09-19-r1/analysis.json", import.meta.url), "utf8")) as AnalysisExport;
const hash = (s: string) => `sha256:${createHash("sha256").update(s).digest("hex")}`;
export function siteCampaign(model: string, harnesses = ["cline", "codex"],
  rates: PriceRates = { input: 0.000001, cached_input: 0.0000001, output: 0.000002 },
  transform: (a: AnalysisAttempt) => AnalysisAttempt = a => a): ValidatedCampaign {
  const tasks = [...new Set(canonical.attempts.map(a => a.task))].sort().slice(0, 2);
  const attempts = canonical.attempts.filter(a => harnesses.includes(a.harness) && tasks.includes(a.task) && a.rep < 2).map(original => {
    const a = transform(structuredClone(original)), run_id = `${model}:${a.run_id}`;
    return { ...a, model, run_id, hashes: { run: hash(run_id), events: hash(`events:${run_id}`) } };
  });
  const analysis = analyzeAttempts(attempts), analysis_sha256 = hash(JSON.stringify(analysis));
  const key = analysisPopulationKey({ ...attempts[0]!, price_book: REFERENCE_BOOK }), dataset = `fixture-${model.replace(/[^A-Za-z0-9._-]/g, "_")}`;
  return { dataset, analysis_sha256, analysis,
    diagnostics: buildValidityDiagnostics({ dataset, analysis_sha256, attempts, population_key: key, rates, audit: null, audit_dataset: null,
      collection: buildCollectionLedger({ selected: attempts, superseded: [], interrupted: [], selected_dataset: dataset, prior_dataset: null, rates }) }),
    evidence: { audit: null, audit_dataset: null, conditions: null, conditions_dataset: null },
    groups: [{ key, attempts, originals: analysis.populations, rates, reference_book: REFERENCE_BOOK }] };
}
