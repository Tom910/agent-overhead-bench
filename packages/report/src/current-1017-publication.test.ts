import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it } from "vitest";
import { publishCurrentCampaign, loadValidatedCurrentCampaign } from "./current-campaign.js";
import { loadPublishedReport, buildPublishedSite } from "./current-report.js";
import { renderPublishedReport } from "./report-document.js";

const roots: string[] = [], dataset = "linux-results-2026-10-24";
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "aob-1017-publish-")); roots.push(root);
  const dir = join(root, "evidence", dataset);
  cpSync(new URL(`../../../evidence/${dataset}`, import.meta.url), dir, { recursive: true });
  writeFileSync(join(root, "evidence/current-campaign.json"), JSON.stringify({ schema_version: 2, kind: "five-cli-1017-descriptive-snapshot", dataset }));
  writeFileSync(join(root, "README.md"), "Intro\n<!-- CURRENT-CAMPAIGN:START -->\nstale\n<!-- CURRENT-CAMPAIGN:END -->\nFooter\n");
  return { root, dir, run: (check = false) => publishCurrentCampaign(root, check) };
}
it("publishes truthful80 default views, limits and local downloads from the exact source", () => {
  const f = fixture(); f.run(); f.run(true);
  const readme = readFileSync(join(f.root, "README.md"), "utf8"), site = readFileSync(join(f.root, "site/index.html"), "utf8");
  for (const text of ["deepseek/deepseek-v4.1-flash-1017", "80/80", "two repetitions", "16 runs", "44 native passes", "36 failures", "completion-selected", "two tool cohorts", "83", "52", "10.088272872", "deepseek-v41-1017-reference-2026-10-18", "linux-results-2026-09-19-r1", "Intro", "Footer"]) expect(readme).toContain(text);
  for (const text of ["80 completion-selected", "two tool cohorts", "83 observed", "52 prerequisites", "Full experiment cost is unknown", "10,800.372", "Native tool timing remains partial", "Selection summary", "data/README.md", "data/source.json"]) expect(site).toContain(text);
  expect(site).toContain('content="Explore coding-agent measurements from two tool cohorts. Descriptive snapshot; full experiment cost is unknown."');
  expect(site).not.toContain("Replacement mapping");
  expect(site).not.toContain(`https://github.com/Tom910/agent-overhead-bench/tree/main/evidence/${dataset}`);
  expect(site).not.toContain("data/task-audit.json");
  const html = readFileSync(join(f.dir, "analysis.html"), "utf8");
  for (const text of ["80 completion-selected", "83 observed", "52 prerequisites", "10,800.372", "budget-interrupted", "interrupted", "unknown"]) expect(html).toContain(text);
  const comparison = JSON.parse(readFileSync(join(f.dir, "comparison.json"), "utf8"));
  expect(comparison.pairwise).toHaveLength(10); expect(comparison.audit).toBeNull();
  const provenance = JSON.parse(readFileSync(join(f.dir, "provenance.json"), "utf8"));
  for (const [name, hash] of Object.entries(provenance.artifacts)) expect("sha256:" + createHash("sha256").update(readFileSync(join(f.dir, name))).digest("hex")).toBe(hash);
  for (const page of [site, readFileSync(join(f.dir, "index.html"), "utf8"), html]) {
    for (const match of page.matchAll(/href="([^"#]+)"/g)) {
      const target = match[1]!; if (/^(https?:|mailto:)/.test(target) || target === "./") continue;
      expect(existsSync(join(f.dir, target.replace(/^data\//, ""))), target).toBe(true);
    }
  }
});
it("checks without writes, repairs generated views, and preserves every immutable byte", () => {
  const f = fixture(); f.run();
  const files = ["source.json", "analysis.json", "summary.json", "cohorts.json", "extra-attempts.json", "native-evidence.json", "collection-ledger.json", "cline-workflow-audit.json"];
  const original = files.map(name => readFileSync(join(f.dir, name)));
  for (const file of [join(f.root, "site/index.html"), join(f.dir, "diagnostics.json"), join(f.dir, "index.html"), join(f.dir, "decision-cards.json")]) {
    writeFileSync(file, "stale"); expect(() => f.run(true)).toThrow(/stale/);
    expect(readFileSync(file, "utf8")).toBe("stale"); f.run(); f.run(true);
  }
  expect(loadValidatedCurrentCampaign(f.root).analysis.attempts).toHaveLength(80);
  for (const [i, file] of files.entries()) expect(readFileSync(join(f.dir, file)).equals(original[i]!)).toBe(true);
  writeFileSync(join(f.dir, "analysis.json"), readFileSync(join(f.dir, "analysis.json"), "utf8") + "\n");
  expect(() => f.run()).toThrow(/immutable/); expect(() => f.run(true)).toThrow(/immutable/);
}, 30000);

it("shows compact Cline estimates for each scope without replacing native grades", () => {
  const f = fixture(), original = readFileSync(join(f.dir, "analysis.json")); f.run();
  for (const path of [join(f.root, "README.md"), join(f.root, "site/index.html"), ...["README.md", "analysis.md", "analysis.html", "report.html", "index.html"].map(name => join(f.dir, name))]) {
    const page = readFileSync(path, "utf8");
    expect(page, path).not.toContain("Cline verifier correction");
    expect(page, path).not.toContain('id="cline-workflow-correction"');
    expect(page, path).not.toContain("Do not use Cline's recorded pass rate");
    expect(page, path).toContain("37.5%");
    expect(page, path).toContain("estimated");
    expect(page, path).toContain("cline-workflow-audit.json");
    expect(page, path).not.toContain("No separate corrected-verifier audit is bound.");
  }
  expect(readFileSync(join(f.dir, "analysis.json")).equals(original)).toBe(true);
  const data = loadValidatedCurrentCampaign(f.root).analysis.attempts;
  expect(data.filter(a => a.harness === "cline" && a.outcome === "completed")).toHaveLength(0);
  const html = readFileSync(join(f.root, "site/index.html"), "utf8");
  const panels = JSON.parse(html.match(/<script id="site-data" type="application\/json">([\s\S]*?)<\/script>/)![1]!).panels;
  const views = panels[0].views;
  const all = views[0].rows.find((r: { harness: string }) => r.harness === "cline");
  expect(all.pass_rate).toBe(37.5); expect(all.scores.pass).toBeCloseTo(6 / 13 * 100);
  expect(all.recorded).toEqual({ passes: 0, pass_rate: 0, pass_score: 0 });
  expect(all.pass_estimate).toEqual({ passed: 6, total: 16, rate: 37.5 });
  expect(all.pass_display).toEqual({ passed: 6, rate: 37.5, estimated: true, score: 6 / 13 * 100 });
  expect(all.display.pass).toBe("37.5%");
  for (const view of views.slice(1)) {
    const row = view.rows.find((r: { harness: string }) => r.harness === "cline");
    expect(row.pass_estimate.total).toBe(2);
    const passed = view.task.startsWith("psd-tools") || view.task.startsWith("superjson") ? 2
      : view.task.startsWith("textual") || view.task.startsWith("true-myth") ? 1 : 0;
    expect(row.pass_estimate.passed).toBe(passed);
    expect(row.pass_estimate.rate).toBe(passed / 2 * 100);
  }
  expect(views[0].rows.filter((r: { harness: string; pass_estimate: unknown }) => r.harness !== "cline").every((r: { pass_estimate: unknown }) => r.pass_estimate === null)).toBe(true);
  const table = html.split('<tbody id="results-body">')[1]!.split('</tbody>')[0]!;
  expect(table).toContain('<span class="value">37.5%</span>');
  expect(table).toContain("estimated");
  expect(table).toContain("6/16");
  const cline = table.split("cline @ 3.0.61")[1]!.split("</tr>")[0]!;
  expect(cline).not.toContain('class="value">0.0%');
  const overview = readFileSync(join(f.dir, "analysis.html"), "utf8").split('data-name="cline @ 3.0.61"')[1]!.split('class="overview-row"')[0]!;
  expect(overview).toContain('data-pass="37.5"');
  expect(overview).toContain("37.5%");
  expect(overview).toContain("estimated");
  expect(readFileSync(join(f.dir, "analysis.html"), "utf8")).toContain('<details><summary>Recorded pass-rate comparisons</summary><p>Uses recorded grades; estimates are excluded.</p>');
  expect(readFileSync(join(f.root, "README.md"), "utf8")).toContain("37.5% estimated (6/16)");
});

it("rejects an edited Cline trace dossier instead of approving a new pass count", () => {
  const f = fixture();
  const path = join(f.dir, "cline-workflow-audit.json");
  writeFileSync(path, readFileSync(path, "utf8") + "\n");
  expect(() => f.run()).toThrow(/Cline.*audit/);
  expect(() => f.run(true)).toThrow(/Cline.*audit/);
});

it("builds page output from the bound report even after saved HTML is removed", () => {
  const f = fixture(); f.run();
  const report = loadPublishedReport(f.root);
  expect(report.dataset).toBe(dataset);
  expect(JSON.parse(readFileSync(join(f.dir, "report.json"), "utf8"))).toEqual(report);
  rmSync(join(f.root, "site/index.html")); rmSync(join(f.dir, "index.html"));
  rmSync(join(f.dir, "analysis.html")); rmSync(join(f.dir, "report.html"));
  const out = join(f.root, "built"); buildPublishedSite(f.root, out);
  expect(readFileSync(join(out, "index.html"), "utf8")).toBe(renderPublishedReport(report));
  expect(readFileSync(join(out, "data/report.json"), "utf8")).toBe(readFileSync(join(f.dir, "report.json"), "utf8"));
});

it("rejects a forged report even when adjacent provenance is updated to match", () => {
  const f = fixture(); f.run();
  const path = join(f.dir, "report.json"), report = JSON.parse(readFileSync(path, "utf8"));
  report.panels[0].views[0].rows[0].display.pass = "100.0%";
  const bytes = JSON.stringify(report, null, 2) + "\n"; writeFileSync(path, bytes);
  const provenance = JSON.parse(readFileSync(join(f.dir, "provenance.json"), "utf8"));
  provenance.artifacts["report.json"] = "sha256:" + createHash("sha256").update(bytes).digest("hex");
  writeFileSync(join(f.dir, "provenance.json"), JSON.stringify(provenance));
  expect(() => loadPublishedReport(f.root)).toThrow(/report.*(differ|reproduc|binding)/i);
});

it("rejects forged derived downloads with matching adjacent hashes", () => {
  const f = fixture(); f.run();
  const file = "diagnostics.json", bytes = '{"forged":true}\n';
  writeFileSync(join(f.dir, file), bytes);
  const provenance = JSON.parse(readFileSync(join(f.dir, "provenance.json"), "utf8"));
  provenance.artifacts[file] = "sha256:" + createHash("sha256").update(bytes).digest("hex");
  writeFileSync(join(f.dir, "provenance.json"), JSON.stringify(provenance));
  expect(() => buildPublishedSite(f.root, join(f.root, "built"))).toThrow(/download reproducibility differs/);
});

it("rejects unsafe output locations and symlinked downloads", () => {
  const f = fixture(); f.run();
  const original = readFileSync(join(f.dir, "analysis.json"));
  for (const target of [f.root, join(f.root, "evidence"), join(f.root, "scripts"), join(f.root, "..", "outside")]) {
    expect(() => buildPublishedSite(f.root, target)).toThrow(/isolated build directory/);
  }
  symlinkSync(f.dir, join(f.root, "_site"));
  expect(() => buildPublishedSite(f.root, join(f.root, "_site"))).toThrow(/isolated build directory/);
  rmSync(join(f.root, "_site"));
  const path = join(f.dir, "analysis.md"), elsewhere = join(f.root, "elsewhere.md");
  writeFileSync(elsewhere, readFileSync(path)); rmSync(path); symlinkSync(elsewhere, path);
  expect(() => buildPublishedSite(f.root, join(f.root, "built"))).toThrow(/unsafe report download/);
  expect(readFileSync(join(f.dir, "analysis.json"))).toEqual(original);
}, 30000);
