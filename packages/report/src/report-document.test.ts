import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { buildPublishedReport, renderPublishedReport, reportOverviewRows, reportEstimateSummary } from "./report-document.js";
import { siteCampaign } from "./results-site.test-fixtures.js";

it("builds static and interactive page values from one serializable report", () => {
  const campaign = siteCampaign("alpha", ["cline", "codex"]);
  const original = structuredClone(campaign.analysis);
  const runs = campaign.analysis.attempts.filter(a => a.harness === "cline");
  const make = (passed: number) => buildPublishedReport([campaign], {
    exported: "2026-10-26T00:00:00Z", passEstimates: new Map(runs.map((a, i) => [a.run_id, i < passed])),
  });
  const first = make(1), next = make(3);
  const row = (report: typeof first) => report.panels[0]!.views[0]!.rows.find(r => r.harness === "cline")!;
  expect(row(first).pass_display.rate).toBe(25);
  expect(row(next).pass_display.rate).toBe(75);
  expect(row(first).pass_rate).toBe(25); expect(row(next).pass_rate).toBe(75);
  for (const report of [first, next]) {
    const restored = JSON.parse(JSON.stringify(report)) as typeof report;
    const html = renderPublishedReport(restored);
    const payload = JSON.parse(html.match(/<script id="site-data" type="application\/json">([\s\S]*?)<\/script>/)![1]!);
    expect(payload.panels).toEqual(report.panels);
    const table = html.split('<tbody id="results-body">')[1]!.split('</tbody>')[0]!;
    expect(table).toContain(`<span class="value">${row(report).display.pass}</span>`);
    expect(reportOverviewRows(report)[0]!.rows.find(r => r.harness === "cline")!.pass_rate).toBe(row(report).pass_display.rate);
    expect(reportEstimateSummary(report)).toContain(`${row(report).pass_display.rate}%`);
  }
  expect(campaign.analysis).toEqual(original);
});

it("renders the page without reading saved page files or recalculating report metrics", () => {
  const report = buildPublishedReport([siteCampaign("alpha")], { exported: "2026-10-26T00:00:00Z" });
  const copy = JSON.parse(JSON.stringify(report)) as typeof report;
  copy.panels[0]!.views[0]!.rows[0]!.display.cost = "$123.456";
  expect(renderPublishedReport(copy)).toContain("$123.456");
  expect(readFileSync(new URL("./results-site-client.js", import.meta.url), "utf8")).not.toContain("37.5");
});

it("changes download paths without rewriting report labels or values", () => {
  const campaign = siteCampaign("alpha", ["cline", "codex"], undefined, a => ({ ...a, harness: a.harness === "cline" ? "data/tool" : a.harness }));
  const report = buildPublishedReport([campaign], { exported: "2026-10-26T00:00:00Z" });
  const html = renderPublishedReport(report, { downloadPrefix: "" });
  expect(html).toContain('href="analysis.json"');
  expect(html).not.toContain('href="data/analysis.json"');
  const payload = JSON.parse(html.match(/<script id="site-data" type="application\/json">([\s\S]*?)<\/script>/)![1]!);
  expect(payload.panels[0].views[0].rows.find((r: { harness: string }) => r.harness === "data/tool").label).toContain("data/tool");
});
