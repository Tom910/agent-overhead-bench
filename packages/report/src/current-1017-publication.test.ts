import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it } from "vitest";
import { publishCurrentCampaign, loadValidatedCurrentCampaign } from "./current-campaign.js";

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
  const files = ["source.json", "analysis.json", "summary.json", "cohorts.json", "extra-attempts.json", "native-evidence.json", "collection-ledger.json"];
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
  expect(all.pass_rate).toBe(0); expect(all.scores.pass).toBe(0);
  expect(all.pass_estimate).toEqual({ passed: 6, total: 16, rate: 37.5 });
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
  expect(table).toContain("37.5% estimated");
  expect(table).toContain("6/16");
});

it("rejects an edited Cline trace dossier instead of approving a new pass count", () => {
  const f = fixture();
  const path = join(f.dir, "cline-workflow-audit.json");
  writeFileSync(path, readFileSync(path, "utf8") + "\n");
  expect(() => f.run()).toThrow(/Cline.*audit/);
  expect(() => f.run(true)).toThrow(/Cline.*audit/);
});
