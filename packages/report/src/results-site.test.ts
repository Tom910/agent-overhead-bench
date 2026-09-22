import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import type { AnalysisExport } from "./analysis.js";
import { buildSiteData, renderResultsSite } from "./results-site.js";
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
