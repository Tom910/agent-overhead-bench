import { ConfigError } from "@aob/contracts";
import { analysisPopulationKey, type AnalysisExport } from "./analysis.js";
import type { PriceRates } from "./aggregate.js";
import type { ComparisonGroup } from "./comparison-overview.js";
import { referenceBookForAttempts } from "./reference-pricing.js";
import type { ComparisonEvidence } from "./comparison-report.js";
import { loadValidatedCurrentCampaign } from "./current-campaign.js";
import { validateDiagnosticPopulation, type ValidityDiagnostics } from "./validity-diagnostics.js";
import { buildDecisionCards, type DecisionCard, type WorkloadScope } from "./workload-decision.js";

export type ValidatedCampaign = { dataset: string; analysis_sha256: string; analysis: AnalysisExport;
  diagnostics: ValidityDiagnostics; evidence: ComparisonEvidence; groups: ComparisonGroup[] };
export type DecisionPanel = { dataset: string; model: string; population_key: string; source_sha256: string;
  reference_book: string; rates: PriceRates; original_price_books: string[]; scopes: WorkloadScope[]; cards: DecisionCard[] };

/** No directory discovery or generic registry file can admit an unqualified campaign. */
export function loadValidatedCampaignRegistry(root: string): ValidatedCampaign[] {
  const { dataset, analysis_sha256, analysis, diagnostics, evidence, groups } = loadValidatedCurrentCampaign(root);
  return [{ dataset, analysis_sha256, analysis, diagnostics, evidence, groups }];
}
const fail = (message: string): never => { throw new ConfigError(`campaign registry: ${message}`); };
const taskKey = (task: string, revision: string | null) => JSON.stringify([task, revision]);

/** Only validated in-memory panels enter; production disk admission stays in its source owner. */
export function buildDecisionSiteData(campaigns: readonly ValidatedCampaign[]): { panels: DecisionPanel[] } {
  const panels: DecisionPanel[] = [], seen = new Set<string>();
  for (const campaign of campaigns) {
    const { analysis, diagnostics, analysis_sha256, dataset, evidence } = campaign;
    if (campaign.groups.length !== 1 || analysis.attempts.length === 0 || diagnostics.dataset !== dataset || diagnostics.analysis_sha256 !== analysis_sha256) return fail("campaign source binding differs");
    const group = campaign.groups[0]!, identity = JSON.stringify([dataset, group.key]);
    if (seen.has(identity)) return fail("duplicate campaign population"); seen.add(identity);
    if (group.key !== diagnostics.population_key || group.reference_book !== diagnostics.reference_book ||
      group.reference_book !== referenceBookForAttempts(group.attempts, group.rates)) return fail("diagnostics population or price binding differs");
    const byId = new Map(analysis.attempts.map(a => [a.run_id, a]));
    if (byId.size !== analysis.attempts.length || group.attempts.length !== analysis.attempts.length || new Set(group.attempts.map(a => a.run_id)).size !== byId.size ||
      group.attempts.some(a => JSON.stringify(a) !== JSON.stringify(byId.get(a.run_id)))) return fail("group attempt binding differs");
    if (new Set(analysis.attempts.map(a => a.model)).size !== 1 || analysis.attempts.some(a =>
      analysisPopulationKey(group.rates === null ? a : { ...a, price_book: group.reference_book! }) !== group.key)) return fail("mixed model/configuration population");
    validateDiagnosticPopulation({ attempts: group.attempts, population_key: group.key, rates: group.rates });
    // No common reference price means no joint comparative panel, not a row of invented prices.
    if (group.rates === null) continue;
    const tasks = new Map(group.attempts.map(a => [taskKey(a.task, a.task_base_revision), a.task]));
    const keys = [...tasks.keys()].sort();
    const scopes: WorkloadScope[] = [{ id: "all", label: `All ${keys.length} selected tasks`, task_keys: keys },
      ...keys.map(key => ({ id: key, label: tasks.get(key)!, task_keys: [key] }))];
    const harnesses = [...new Set(group.attempts.map(a => JSON.stringify([a.harness, a.version])))].sort();
    const cards = scopes.flatMap(scope => buildDecisionCards({ analysis_sha256,
      attempts: group.attempts, scope, selection: { population_key: group.key, workload_id: scope.id, reference_harness: harnesses[0]! },
      rates: group.rates, diagnostics, audit: evidence.audit, audit_dataset: evidence.audit_dataset }, harnesses));
    panels.push({ dataset, model: group.attempts[0]!.model, population_key: group.key, source_sha256: analysis_sha256,
      reference_book: group.reference_book!, rates: { ...group.rates }, original_price_books: [...new Set(group.attempts.map(a => a.price_book))].sort(), scopes, cards });
  }
  return { panels };
}
