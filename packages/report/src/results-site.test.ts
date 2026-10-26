import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { expect, it } from "vitest";
import type { AnalysisExport } from "./analysis.js";
import { buildSiteData, buildResultsExplorer, renderCampaignResultsSite, renderResultsSite } from "./results-site.js";
import { siteCampaign } from "./results-site.test-fixtures.js";
import { loadValidatedCampaignRegistry } from "./validated-campaign-registry.js";
const data = JSON.parse(readFileSync(new URL("../../../evidence/linux-results-2026-09-19-r1/analysis.json", import.meta.url), "utf8")) as AnalysisExport;
it("reuses selected benchmark costs and preserves task scope and relative baselines", () => {
  const site = buildSiteData(data);
  expect(site.views).toHaveLength(9);
  const all = site.views[0]!;
  expect(all.rows.reduce((n, r) => n + r.selected, 0)).toBe(200);
  expect(all.rows.find(r => r.harness === "codex")!.cost.value).toBeCloseTo(3.798 / 40, 4);
  expect(all.rows.find(r => r.harness === "qwen")!.scores.pass).toBe(100);
  expect(all.rows.reduce((n, r) => n + r.benchmark.value!, 0)).toBeCloseTo(27.185, 3);
  for (const view of site.views.slice(1)) {
    expect(view.rows.every(r => r.selected === 5)).toBe(true);
    expect(view.rows[0]!.cost.value! * 5).toBeCloseTo(view.rows[0]!.benchmark.value!, 9);
  }
});
it("renders readable static results and safely embeds arbitrary labels", () => {
  const changed = structuredClone(data);
  const task = changed.attempts[0]!.task;
  for (const a of changed.attempts) if (a.task === task) a.task = '</script><img src=x onerror=alert(1)>';
  const html = renderResultsSite(changed, "linux-results-2026-09-19-r1", "2026-09-19");
  expect(html).not.toContain('</script><img');
  expect(html).toContain('id="results-body"');
  expect(html).toContain('62.5%');
  expect(html).toContain('report.html');
  expect(html).toContain('data/analysis.json');
});
it("renders task counts and exploratory comparison intervals without JavaScript", () => {
  const site = buildSiteData(data);
  expect(site.views[0]!.confidence).toHaveLength(10);
  expect(site.views[1]!.confidence.every(p => p.interval === null)).toBe(true);
  const html = renderResultsSite(data, "linux-results-2026-09-19-r1", "2026-09-19").split('<script')[0]!;
  expect(html).toContain("Exploratory 95% interval");
  expect(html).toContain("No clear separation");
  expect(html).toContain("5 / 5");
  expect(html).toContain('id="confidence-baseline"');
});
it("labels partial medians and costs without treating missing measurements as zero", () => {
  const changed = structuredClone(data);
  const run = changed.attempts.find(a => a.harness === "codex")!;
  run.input_tokens = null; run.cached_percent = null; run.cost_unavailable = "incomplete-accounting";
  const row = buildSiteData(changed).views[0]!.rows.find(r => r.harness === "codex")!;
  expect(row.display.input).toContain("39/40 measured");
  expect(row.display.cache).toContain("39/40 measured");
  expect(row.display.cost).toMatch(/^≥ /);
  expect(row.scores.input).toBeNull(); expect(row.scores.cost).toBeNull();
  expect(row.cost.n).toBe(39);
  const html = renderResultsSite(changed, "linux-results-2026-09-19-r1", "2026-09-19");
  expect(html.slice(0, html.indexOf('<script'))).toContain("39/40 measured");
  for (const a of changed.attempts.filter(a => a.harness === "codex")) a.output_tokens = null;
  expect(buildSiteData(changed).views[0]!.rows.find(r => r.harness === "codex")!.display.output).toBe("Unavailable");
});
it("describes measured task, harness and repetition counts instead of assuming the historical matrix", () => {
  const small = structuredClone(data), tasks = [...new Set(small.attempts.map(a => a.task))].slice(0, 2);
  small.attempts = small.attempts.filter(a => ["cline", "codex"].includes(a.harness) && tasks.includes(a.task) && a.rep < 2);
  const html = renderResultsSite(small, "fixture", "2026-09-29");
  expect(html).toContain("All 2 tasks · 4 runs per harness");
  expect(html).toContain("2 harnesses, 2 tasks");
  expect(html).toContain("2 task clusters · original verification");
  expect(html).not.toMatch(/All eight tasks|all five harnesses|five repetitions|task’s five runs|Eight task clusters/);
});
it("renders workload outcomes, distinct timing denominators and evidence after the primary six metrics without JavaScript", () => {
  const campaign = siteCampaign("alpha", ["cline", "codex"], undefined, a => ({ ...a,
    outcome: a.rep === 0 ? "verify_error" : "completed", timing: { ...a.timing!, end_to_end: a.rep === 0 ? 60_000 : 240_000 } }));
  const html = renderCampaignResultsSite([campaign], "2026-09-29").split("<script")[0]!;
  expect(html.indexOf('id="workload-decision"')).toBeGreaterThan(html.indexOf('id="results-table"'));
  expect(html).toContain("2 / 4 passes");
  expect(html).toContain("All-outcome agent time");
  expect(html).toContain("Successful agent time");
  expect(html).toContain("2.5 min"); expect(html).toContain("4 min");
  expect(html).toContain("n=4; missing=0"); expect(html).toContain("n=2; missing=0");
  expect(html).toContain("2 verification failures");
  expect(html).toContain("Exploratory 95%");
  expect(html).toContain("including transport");
  expect(html).toContain("unobserved tools and harness work");
  for (const link of ["data/analysis.json", "data/diagnostics.json", "report.html"]) expect(html).toContain(`href="${link}"`);
});
it("shows missing-cost subtotals without presenting them as a comparable mean", () => {
  const campaign = siteCampaign("alpha", ["cline", "codex"], undefined, a => ({ ...a, cost_unavailable: a.rep === 0 ? "incomplete-accounting" : a.cost_unavailable }));
  const html = renderCampaignResultsSite([campaign], "2026-09-29").split("<script")[0]!;
  expect(html).toContain("Known selected-attempt subtotal");
  expect(html).toContain("n=2; missing=2");
  expect(html).toContain("Mean unavailable");
});
it("shows all-outcome and successful elapsed-time quartiles and ranges in the explanation", () => {
  const campaign = siteCampaign("alpha", ["cline", "codex"], undefined, a => ({ ...a,
    outcome: a.rep === 0 ? "verify_error" : "completed", timing: { ...a.timing!, end_to_end: a.rep === 0 ? 60_000 : 240_000 } }));
  const details = renderCampaignResultsSite([campaign], "2026-09-29").split('<details id="decision-explanation"')[1]!.split("</details>")[0]!;
  const all = details.match(/<dt>All-outcome agent time · median<\/dt><dd>(.*?)<\/dd>/)?.[1] ?? "";
  const successful = details.match(/<dt>Successful agent time · median<\/dt><dd>(.*?)<\/dd>/)?.[1] ?? "";
  expect(all).toContain("n=4; missing=0"); expect(all).toContain("Q1–Q3: 1 min to 4 min; range: 1 min to 4 min");
  expect(successful).toContain("n=2; missing=0"); expect(successful).toContain("Q1–Q3: 4 min to 4 min; range: 4 min to 4 min");
});
it.each(["zero passes", "missing timing"])("keeps unavailable elapsed-time spreads explicit for %s", reason => {
  const campaign = siteCampaign("alpha", ["cline", "codex"], undefined, a => ({ ...a,
    outcome: reason === "zero passes" ? "verify_error" : "completed", timing: reason === "missing timing" ? null : a.timing }));
  const details = renderCampaignResultsSite([campaign], "2026-09-29").split('<details id="decision-explanation"')[1]!.split("</details>")[0]!;
  const successful = details.match(/<dt>Successful agent time · median<\/dt><dd>(.*?)<\/dd>/)?.[1] ?? "";
  expect(successful).toContain(reason === "zero passes" ? "n=0; missing=0" : "n=0; missing=4");
  expect(successful).toContain("Q1–Q3: Unavailable; range: Unavailable");
  if (reason === "missing timing") {
    const all = details.match(/<dt>All-outcome agent time · median<\/dt><dd>(.*?)<\/dd>/)?.[1] ?? "";
    expect(all).toContain("n=0; missing=4"); expect(all).toContain("Q1–Q3: Unavailable; range: Unavailable");
  }
});
it("keeps model prices, harness versions and evidence links together in separate explorer panels", () => {
  const panels = buildResultsExplorer([siteCampaign("alpha"), siteCampaign("beta", ["pi", "qwen"], { input: 0.000004, cached_input: 0.000002, output: 0.000006 })]);
  expect(panels.map(p => p.model)).toEqual(["alpha", "beta"]);
  expect(panels.map(p => p.views[0]!.rows.map(r => r.harness))).toEqual([["cline", "codex"], ["pi", "qwen"]]);
  expect(panels[1]!.pricing).toContain("$4 per million");
  expect(panels[1]!.links.analysis).toContain("fixture-beta/analysis.json");
  expect(panels[1]!.links.diagnostics).toContain("fixture-beta/diagnostics.json");
  expect(panels[1]!.links.comparison).toContain("fixture-beta/comparison.json");
  expect(panels[1]!.links.provenance).toContain("fixture-beta/provenance.json");
  expect(panels[1]!.links.summary).toContain("fixture-beta/summary.json");
  expect(panels[1]!.views[0]!.rows.every(r => r.id.includes(r.version))).toBe(true);
});
it("escapes measured model and task names in controls, cards and embedded data", () => {
  const model = '</script><img src=x onerror=alert(1)>', campaign = siteCampaign(model, ["cline", "codex"], undefined, a => ({ ...a, task: a.task + model }));
  const html = renderCampaignResultsSite([campaign], "2026-09-29");
  expect(html).not.toContain('</script><img');
  expect(html).toContain('&lt;/script&gt;&lt;img');
  const payload = JSON.parse(html.match(/<script id="site-data" type="application\/json">([\s\S]*?)<\/script>/)![1]!);
  expect(payload.panels[0].model).toBe(model);
});
it("preserves original passes while showing the separate bound audit revision and replay coverage", () => {
  const root = mkdtempSync(join(tmpdir(), "aob-historical-site-"));
  let html: string;
  try {
    for (const name of ["linux-results-2026-09-19", "linux-results-2026-09-19-r1", "linux-conditions-2026-09-21", "task-verification-2026-09-21"]) cpSync(new URL(`../../../evidence/${name}`, import.meta.url), join(root, "evidence", name), { recursive: true });
    cpSync(new URL("../../../task-revisions", import.meta.url), join(root, "task-revisions"), { recursive: true });
    writeFileSync(join(root, "evidence/current-campaign.json"), JSON.stringify({ dataset: "linux-results-2026-09-19-r1", conditions_dataset: "linux-conditions-2026-09-21", audit_dataset: "task-verification-2026-09-21" }));
    html = renderCampaignResultsSite(loadValidatedCampaignRegistry(root), "2026-09-29").split("<script")[0]!;
  } finally { rmSync(root, { recursive: true, force: true }); }
  expect(html).toContain("Original grades unchanged");
  expect(html).toContain("33/75"); expect(html).toContain("13/25");
  expect(html).toContain("42 unavailable");
  expect(html).toContain("4 confirmed verifier false negatives");
  expect(html).toContain('href="data/task-audit.json"');
});
it("does not pool task revisions or CLI versions in the primary views and confidence controls", () => {
  const changed = structuredClone(data);
  changed.attempts = changed.attempts.filter(a => ["cline", "codex"].includes(a.harness));
  for (const a of changed.attempts) { a.version = a.harness === "cline" ? "v1" : "v2"; a.harness = "same-cli"; a.task_base_revision = a.rep < 2 ? "base-a" : "base-b"; }
  const site = buildSiteData(changed);
  expect(site.views).toHaveLength(17);
  expect(Object.keys(site.views[0]!.confidenceByBaseline)).toEqual(['["same-cli","v1"]', '["same-cli","v2"]']);
  expect(site.views[1]!.task).toContain("base-a");
});
