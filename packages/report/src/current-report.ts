import { existsSync, lstatSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { ConfigError } from "@aob/contracts";
import { loadValidatedCurrentCampaign } from "./current-campaign.js";
import { snapshotHash, snapshotJson } from "./current-1017-snapshot.js";
import { loadSnapshotPassAudit } from "./snapshot-pass-audit.js";
import { prepareSnapshotReport, renderSnapshotDetails, REPORT_FILE } from "./snapshot-report.js";
import { renderPublishedReport, type PublishedReport } from "./report-document.js";
import { prepare1017Publication } from "./current-1017-publication.js";

export const REPORT_DOWNLOADS = ["analysis.json", "analysis.md", "analysis.html", "index.html", "report.html", "README.md",
  "summary.json", "provenance.json", "comparison.json", "diagnostics.json", "decision-cards.json", "extra-attempts.json",
  "cohorts.json", "native-evidence.json", "collection-ledger.json", "source.json", "cline-workflow-audit.json", REPORT_FILE];

/** Reproduce the report from admitted facts; adjacent mutable provenance cannot approve edits. */
export function loadPublishedReport(root: string): PublishedReport {
  return loadReportBundle(root).report;
}
function loadReportBundle(root: string) {
  try {
    const campaign = loadValidatedCurrentCampaign(root, "derive");
    if (!campaign.publication.snapshot) throw new ConfigError("published report is not available for this source profile");
    const dir = join(root, "evidence", campaign.dataset), path = join(dir, REPORT_FILE);
    const info = lstatSync(path);
    if (!info.isFile() || info.isSymbolicLink() || info.size > 16 * 1024 * 1024) throw new ConfigError("published report must be a bounded regular file");
    const bytes = readFileSync(path);
    const expected = prepareSnapshotReport(campaign, loadSnapshotPassAudit(dir));
    const hash = snapshotHash(bytes);
    if (hash !== campaign.publication.artifacts[REPORT_FILE] || hash !== snapshotHash(snapshotJson(expected))) {
      throw new ConfigError("published report binding or reproducibility differs; run npm run report:refresh");
    }
    if (snapshotHash(renderPublishedReport(expected)) !== campaign.publication.provenance.site_index_sha256) {
      throw new ConfigError("published report page binding differs; run npm run report:refresh");
    }
    const report = JSON.parse(bytes.toString("utf8")) as PublishedReport;
    return { report, campaign, generated: prepare1017Publication(campaign, report).outputs };
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    throw new ConfigError(`published report is unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/** Rebuild the primary page from report.json; saved index HTML is not an input. */
export function buildPublishedSite(root: string, output: string): void {
  const target = resolve(output), rel = relative(resolve(root), target);
  if (!rel || rel.includes(sep) || rel === ".." || ["evidence", "packages", "scripts", "site", "plans", "docs", ".git"].includes(rel) ||
      existsSync(target) && (lstatSync(target).isSymbolicLink() || rel !== "_site")) {
    throw new ConfigError("site output must be an isolated build directory");
  }
  const { report, campaign, generated } = loadReportBundle(root);
  rmSync(target, { recursive: true, force: true }); mkdirSync(join(target, "data"), { recursive: true });
  const dir = join(root, "evidence", report.dataset);
  writeFileSync(join(target, "index.html"), renderPublishedReport(report));
  const originalDetailed = renderSnapshotDetails(report, campaign.analysis);
  let detailed = originalDetailed;
  for (const name of ["extra-attempts.json", "cohorts.json", "collection-ledger.json", "cline-workflow-audit.json"]) {
    detailed = detailed.replaceAll(`href="${name}"`, `href="data/${name}"`);
  }
  writeFileSync(join(target, "report.html"), detailed);
  for (const file of REPORT_DOWNLOADS) {
    if (file === "index.html") writeFileSync(join(target, "data", file), renderPublishedReport(report, { downloadPrefix: "" }));
    else if (file === "analysis.html" || file === "report.html") writeFileSync(join(target, "data", file), originalDetailed);
    else {
      const path = join(dir, file), info = lstatSync(path);
      if (!info.isFile() || info.isSymbolicLink() || info.size > 32 * 1024 * 1024) throw new ConfigError(`unsafe report download: ${file}`);
      const bytes = readFileSync(path);
      if (file !== "provenance.json" && snapshotHash(bytes) !== campaign.publication.artifacts[file]) throw new ConfigError(`report download binding differs: ${file}`);
      if (file !== "provenance.json" && generated.has(file) && bytes.toString("utf8") !== generated.get(file)) throw new ConfigError(`report download reproducibility differs: ${file}`);
      writeFileSync(join(target, "data", file), bytes);
    }
  }
}
