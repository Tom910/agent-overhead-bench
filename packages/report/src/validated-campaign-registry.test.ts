import { createHash } from "node:crypto";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ConfigError } from "@aob/contracts";
import type { PriceRates } from "./aggregate.js";
import { analysisPopulationKey, analyzeAttempts, type AnalysisExport } from "./analysis.js";
import { buildCollectionLedger } from "./collection-ledger.js";
import { REFERENCE_BOOK } from "./comparison-overview.js";
import { buildValidityDiagnostics } from "./validity-diagnostics.js";
import { buildDecisionSiteData, loadValidatedCampaignRegistry, type ValidatedCampaign } from "./validated-campaign-registry.js";

const repo = new URL("../../../", import.meta.url), hash = (value: string | Buffer) => `sha256:${createHash("sha256").update(value).digest("hex")}`;
const canonical = JSON.parse(readFileSync(new URL("evidence/linux-results-2026-09-19-r1/analysis.json", repo), "utf8")) as AnalysisExport;
const rates: PriceRates = { input: 0.000001, cached_input: 0.0000001, output: 0.000002 };
function campaign(model: string, harnesses = ["cline", "codex"], prices: PriceRates | null = rates, configuration: string | null = null): ValidatedCampaign {
  const tasks = [...new Set(canonical.attempts.map(a => a.task))].sort().slice(0, 2);
  const attempts = canonical.attempts.filter(a => harnesses.includes(a.harness) && tasks.includes(a.task) && a.rep < 2).map(original => {
    const a = structuredClone(original), run_id = `${model}:${configuration}:${a.run_id}`;
    return { ...a, model, configuration, run_id, price_book: "fixture-book", hashes: { run: hash(run_id), events: hash(`events:${run_id}`) } };
  });
  const analysis = analyzeAttempts(attempts), analysis_sha256 = hash(JSON.stringify(analysis));
  const key = analysisPopulationKey(prices === null ? attempts[0]! : { ...attempts[0]!, price_book: REFERENCE_BOOK });
  const dataset = `fixture-${model}-${configuration ?? "default"}`;
  return { dataset, analysis_sha256, analysis,
    diagnostics: buildValidityDiagnostics({ dataset, analysis_sha256, attempts, population_key: key, rates: prices, audit: null, audit_dataset: null,
      collection: buildCollectionLedger({ selected: attempts, superseded: [], interrupted: [], selected_dataset: dataset, prior_dataset: null, rates: prices }) }),
    evidence: { audit: null, audit_dataset: null, conditions: null, conditions_dataset: null },
    groups: [{ key, attempts, originals: analysis.populations, rates: prices, reference_book: prices === null ? null : REFERENCE_BOOK }] };
}
const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
function diskFixture() {
  const root = mkdtempSync(join(tmpdir(), "aob-registry-")); roots.push(root);
  for (const name of ["linux-results-2026-09-19", "linux-results-2026-09-19-r1", "linux-conditions-2026-09-21", "task-verification-2026-09-21"]) {
    cpSync(new URL(`evidence/${name}`, repo), join(root, "evidence", name), { recursive: true });
  }
  cpSync(new URL("task-revisions", repo), join(root, "task-revisions"), { recursive: true });
  writeFileSync(join(root, "evidence/current-campaign.json"), JSON.stringify({ dataset: "linux-results-2026-09-19-r1", conditions_dataset: "linux-conditions-2026-09-21", audit_dataset: "task-verification-2026-09-21" }));
  return { root, dir: join(root, "evidence/linux-results-2026-09-19-r1") };
}
describe("validated campaign panels", () => {
  it("loads only the explicitly selected historical campaign from disk", () => {
    const f = diskFixture(), campaigns = loadValidatedCampaignRegistry(f.root);
    expect(campaigns.map(row => row.dataset)).toEqual(["linux-results-2026-09-19-r1"]);
    const { panels } = buildDecisionSiteData(campaigns);
    expect(panels).toHaveLength(1); expect(panels[0]!.model).toBe("deepseek/deepseek-v4.1-flash");
    expect(panels[0]!.scopes).toHaveLength(9);
    expect(panels[0]!.cards).toHaveLength(45);
    expect(new Set(panels[0]!.cards.map(card => card.differences[0]!.reference_harness)).size).toBe(5);
  });
  it("keeps different in-memory models, harness sets and reference prices in separate panels", () => {
    const first = campaign("alpha"), second = campaign("beta", ["pi", "qwen"], { ...rates, input: rates.input * 2 });
    const { panels } = buildDecisionSiteData([first, second]);
    expect(panels.map(panel => panel.model)).toEqual(["alpha", "beta"]);
    expect(panels.map(panel => panel.cards[0]!.rows.map(row => row.harness))).toEqual([["cline", "codex"], ["pi", "qwen"]]);
    expect(panels.every(panel => panel.cards.length === 6 && panel.scopes.length === 3)).toBe(true);
    expect(panels[0]!.source_sha256).toBe(first.analysis_sha256); expect(panels[1]!.source_sha256).toBe(second.analysis_sha256);
    for (const panel of panels) for (const card of panel.cards) {
      expect(card.population_key).toBe(panel.population_key);
      expect(card.rows.every(row => row.run_ids.every(id => id.startsWith(`${panel.model}:`)))).toBe(true);
    }
  });
  it("keeps configurations distinct and supplies no placeholder comparison for absent rates", () => {
    const { panels } = buildDecisionSiteData([campaign("alpha"), campaign("alpha", ["cline", "codex"], rates, "other"), campaign("unpriced", ["cline"], null)]);
    expect(panels).toHaveLength(2);
    expect(new Set(panels.map(panel => panel.population_key)).size).toBe(2);
    expect(panels.every(panel => panel.model === "alpha")).toBe(true);
  });
  it.each(["source", "model", "group", "duplicate"])("rejects invalid in-memory %s binding", change => {
    const c = campaign("alpha");
    if (change === "source") c.diagnostics.analysis_sha256 = hash("other");
    if (change === "model") c.analysis.attempts[0]!.model = "other";
    if (change === "group") c.groups[0]!.attempts = c.groups[0]!.attempts.slice(1);
    expect(() => buildDecisionSiteData(change === "duplicate" ? [c, c] : [c])).toThrow(ConfigError);
  });
  it.each(["analysis.json", "summary.json", "diagnostics.json", "provenance.json"])("rejects tampered %s before exposing a panel", name => {
    const f = diskFixture(), path = join(f.dir, name);
    if (name === "provenance.json") {
      const p = JSON.parse(readFileSync(path, "utf8")); p.artifacts["diagnostics.json"] = hash("different"); writeFileSync(path, JSON.stringify(p));
    } else writeFileSync(path, readFileSync(path, "utf8") + "\n");
    expect(() => loadValidatedCampaignRegistry(f.root)).toThrow(ConfigError);
  });
  it("rejects rehashed but unreproducible diagnostic values", () => {
    const f = diskFixture(), path = join(f.dir, "diagnostics.json");
    const d = JSON.parse(readFileSync(path, "utf8")); d.reliability[0].passes = 99; writeFileSync(path, JSON.stringify(d, null, 2) + "\n");
    const pp = join(f.dir, "provenance.json"), p = JSON.parse(readFileSync(pp, "utf8")); p.artifacts["diagnostics.json"] = hash(readFileSync(path)); writeFileSync(pp, JSON.stringify(p));
    expect(() => loadValidatedCampaignRegistry(f.root)).toThrow(/diagnostics/);
  });
});
