import type { CurrentCampaign } from "./current-campaign.js";
import { requireSnapshot } from "./current-1017-snapshot.js";
import { buildPublishedReport } from "./report-document.js";
import { reportOverviewRows, reportEstimateSummary, type PublishedReport } from "./report-document.js";
import { renderAnalysisHtml } from "./analysis-render.js";
import type { AnalysisExport } from "./analysis.js";
import { confidenceTable } from "./comparison-report.js";
import { CONFIDENCE_METHOD } from "./comparison-confidence.js";
import { loadSnapshotPassAudit } from "./snapshot-pass-audit.js";

export const REPORT_FILE = "report.json";
export const HISTORY = "https://github.com/Tom910/agent-overhead-bench/tree/main/evidence/linux-results-2026-09-19-r1";
export const INTERPRETATION = "https://github.com/Tom910/agent-overhead-bench/blob/main/docs/snapshots/2026-10-24-five-cli.md";
const words = (n: number) => ["zero", "one", "two", "three", "four", "five"][n] ?? String(n);
const html = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const seconds = (ms: number) => (ms / 1000).toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });

export function snapshotScope(campaign: CurrentCampaign): string {
  const facts = campaign.publication.snapshot;
  requireSnapshot(facts !== undefined, "snapshot facts required for report");
  const s = facts.summary;
  return `${s.selected_slots} completion-selected outcomes across ${words(facts.cohorts.cohorts.length)} tool cohorts; ${s.observed_primary_attempts} observed paid primary attempts and ${s.prerequisite_attempts} prerequisites. This is a descriptive snapshot, not one randomized five-CLI experiment. Full experiment cost is unknown. ${words(s.partial_native_captures).replace(/^./, c => c.toUpperCase())} partial native captures retain valid required grade artifacts. Native tool timing remains partial.`;
}

export function extraAttemptMarkdown(campaign: CurrentCampaign): string {
  const facts = campaign.publication.snapshot;
  requireSnapshot(facts !== undefined, "snapshot facts required for report");
  return `## Original incomplete attempts\n\n${words(facts.extras.length).replace(/^./, c => c.toUpperCase())} extra attempts are outside the selected ${facts.summary.selected_slots}. Prefix estimates do not give complete charges.\n\n| Attempt | Outcome | Adapter time | Known prefix reference estimate | Full cost |\n|---|---|---|---|---|\n${facts.extras.map(e => `| ${e.cell_id} | ${e.outcome} | ${e.adapter_wall_ms === null ? "unknown" : `${seconds(e.adapter_wall_ms)} s`} | $${e.known_reference_cost_lower_bound_usd.toFixed(9)} | unknown |`).join("\n")}\n\nSee [all extra attempts](extra-attempts.json), [cohorts and windows](cohorts.json), and [collection ledger](collection-ledger.json). Reserves are not charges.\n`;
}

export function prepareSnapshotReport(campaign: CurrentCampaign, audit: ReturnType<typeof loadSnapshotPassAudit>) {
  const facts = campaign.publication.snapshot;
  requireSnapshot(facts !== undefined, "validated snapshot required for report");
  const s = facts.summary, scope = snapshotScope(campaign);
  const extraRows = facts.extras.map(e => `<tr><td>${html(e.cell_id)}</td><td>${html(e.outcome)}</td><td>${e.adapter_wall_ms === null ? "unknown" : `${seconds(e.adapter_wall_ms)} s`}</td><td>$${e.known_reference_cost_lower_bound_usd.toFixed(9)}</td><td>unknown</td></tr>`).join("");
  const appendix = `<section id="extra-attempts" style="width:100%;max-width:1280px;margin:auto;padding:24px;box-sizing:border-box"><h2>Original incomplete attempts: time, reliability and cost</h2><p>${words(facts.extras.length).replace(/^./, c => c.toUpperCase())} extra attempts are outside the selected ${s.selected_slots}. Prefix estimates do not give complete charges.</p><div style="max-width:100%;overflow:auto"><table><tr><th>Attempt</th><th>Outcome</th><th>Adapter time</th><th>Known prefix reference estimate</th><th>Full cost</th></tr>${extraRows}</table></div><p><a href="data/extra-attempts.json">All extra attempt facts and captured request series</a> · <a href="data/cohorts.json">Original cohorts and collection windows</a> · <a href="data/collection-ledger.json">Collection ledger</a> · <a href="${HISTORY}">Historical snapshot</a></p></section>`;
  return buildPublishedReport([campaign], {
    exported: s.as_of, passEstimates: audit.passEstimates,
    sourceBindings: { "source.json": facts.source_sha256, "analysis.json": campaign.analysis_sha256,
      "native-evidence.json": campaign.publication.artifacts["native-evidence.json"] as string, [audit.file]: audit.hash },
    estimateEvidence: { file: audit.file, sha256: audit.hash }, appendixHtml: appendix,
    context: {
      description: "Explore coding-agent measurements from two tool cohorts. Descriptive snapshot; full experiment cost is unknown.",
      noticeHtml: `<p>${html(scope)} <a href="${INTERPRETATION}">Read result interpretation and native workflow findings</a>.</p>`,
      reportData: "data/report.json", source: "data/source.json", readme: "data/README.md", summaryLabel: "Selection summary",
      limitsHtml: "This is a completion-selected descriptive snapshot across original tool cohorts. It is not the frozen v1 dataset.",
    },
  });
}

export function renderSnapshotDetails(report: PublishedReport, analysis: AnalysisExport): string {
  const view = report.panels[0]!.views[0]!;
  const labels = new Map(view.rows.map(row => [row.id, row.label]));
  const pairs = view.confidence.map(pair => ({ ...pair, left: labels.get(pair.left)!, right: labels.get(pair.right)! }));
  const recorded = `<details><summary>Recorded pass-rate comparisons</summary><p>Uses recorded grades; estimates are excluded.</p>${confidenceTable(pairs, view.rows.at(-1)!.label)}<p>${CONFIDENCE_METHOD}</p></details>`;
  const methods = report.context?.methodologyHtml?.replaceAll('href="data/', 'href="') ?? "";
  return renderAnalysisHtml(analysis, { overviews: reportOverviewRows(report) })
    .replace("<main>", `<main>${report.context?.noticeHtml ?? ""}${reportEstimateSummary(report, "", "html")}`)
    .replace("</main>", `${recorded}${report.appendix_html.replaceAll('href="data/', 'href="')}${methods}</main>`);
}
