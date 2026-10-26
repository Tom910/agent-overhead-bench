import { ConfigError } from "@aob/contracts";
import type { ValidatedCampaign } from "./validated-campaign-registry.js";
import { buildResultsExplorer, renderPreparedResultsSite, type ResultsSiteContext } from "./results-site.js";
import type { DisplayOverviewSource } from "./overview.js";

export type PublishedReport = {
  schema_version: 1; kind: "published-results-report"; dataset: string; exported: string;
  source_bindings: Record<string, string>;
  populations: { key: string; dataset: string; run_ids: string[] }[];
  panels: ReturnType<typeof buildResultsExplorer>;
  context?: Omit<ResultsSiteContext, "passEstimates">;
  estimate_evidence?: { file: string; sha256: string };
  appendix_html: string;
};
type ReportOptions = {
  exported: string; context?: ResultsSiteContext; passEstimates?: ReadonlyMap<string, boolean>;
  sourceBindings?: Record<string, string>; estimateEvidence?: PublishedReport["estimate_evidence"];
  appendixHtml?: string;
};
const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Prepare values once. Renderers consume this JSON contract, never select grades. */
export function buildPublishedReport(campaigns: readonly ValidatedCampaign[], options: ReportOptions): PublishedReport {
  const first = campaigns[0];
  if (!first) throw new ConfigError("published report requires a campaign");
  const estimateInputs = options.passEstimates ?? options.context?.passEstimates;
  const context = options.context ? { ...options.context, ...(estimateInputs ? { passEstimates: estimateInputs } : {}) } : undefined;
  if (context && options.estimateEvidence && (context.passEstimates?.size ?? 0) > 0) {
    context.auditHtml = "";
    context.limitsAuditHtml = "Pass-rate estimates and recorded results are identified in the report.";
  }
  // A context is optional for generic reports, but estimate inputs must still be applied.
  const panels = buildResultsExplorer(campaigns, context, options.passEstimates);
  const { passEstimates: _estimates, ...savedContext } = context ?? {};
  const report: PublishedReport = {
    schema_version: 1, kind: "published-results-report", dataset: first.dataset,
    exported: options.exported, source_bindings: options.sourceBindings ?? {}, panels,
    populations: campaigns.flatMap(campaign => campaign.groups.map(group => ({ key: group.key, dataset: campaign.dataset,
      run_ids: group.attempts.map(attempt => attempt.run_id) }))),
    ...(context ? { context: savedContext as Omit<ResultsSiteContext, "passEstimates"> } : {}),
    ...(options.estimateEvidence ? { estimate_evidence: options.estimateEvidence } : {}),
    appendix_html: options.appendixHtml ?? "",
  };
  if (report.context && report.estimate_evidence && panels.some(p => p.views[0]!.rows.some(r => r.pass_display.estimated))) {
    const file = report.estimate_evidence.file;
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*\.json$/.test(file)) throw new ConfigError("unsafe report estimate filename");
    report.context.auditHtml = "";
    report.context.limitsAuditHtml = "Pass-rate estimates and recorded results are identified in the report.";
    report.context.tableNoteHtml = '<p>Estimated pass rates use retained traces. <a href="#cline-result-notes">Method notes</a>.</p>';
    report.context.methodologyHtml = `<details id="cline-result-notes"><summary>Pass-rate method notes</summary><p>Estimated pass rates use the retained per-run audit. Other pass rates use recorded grades. Original results remain in the source data.</p><p><a href="data/${escape(file)}">Calculation and per-run evidence</a></p></details>`;
  }
  // The in-memory contract matches its JSON form, including normalized -0 and omitted optionals.
  return JSON.parse(JSON.stringify(report)) as PublishedReport;
}

export function renderPublishedReport(report: PublishedReport, options: { downloadPrefix?: "data/" | "" } = {}): string {
  if (report.schema_version !== 1 || report.kind !== "published-results-report" || report.panels.length === 0) throw new ConfigError("invalid published report");
  if (options.downloadPrefix === "") report = localDownloads(report);
  return renderPreparedResultsSite({ dataset: report.dataset, exported: report.exported,
    panels: report.panels, ...(report.context ? { context: report.context } : {}), appendixHtml: report.appendix_html });
}

/** Change only download URLs. Labels and measured values can contain the same text. */
function localDownloads(report: PublishedReport): PublishedReport {
  const url = (value: string) => value.startsWith("data/") ? value.slice(5) : value;
  const fragment = (value: string) => value.replaceAll('href="data/', 'href="');
  const context = report.context ? { ...report.context, source: url(report.context.source), readme: url(report.context.readme) } : undefined;
  if (context) {
    if (context.reportData) context.reportData = url(context.reportData);
    for (const key of ["noticeHtml", "limitsHtml", "tableNoteHtml", "methodologyHtml", "auditHtml", "limitsAuditHtml"] as const) {
      if (typeof context[key] === "string") context[key] = fragment(context[key]);
    }
  }
  return { ...report, ...(context ? { context } : {}), appendix_html: fragment(report.appendix_html),
    panels: report.panels.map(panel => ({ ...panel,
      links: Object.fromEntries(Object.entries(panel.links).map(([key, value]) => [key, value === null ? null : url(value)])) as typeof panel.links,
      audit: fragment(panel.audit), evidence: fragment(panel.evidence),
      views: panel.views.map(view => ({ ...view, decision: { html: fragment(view.decision.html),
        differences: Object.fromEntries(Object.entries(view.decision.differences).map(([key, value]) => [key, fragment(value)])) } })),
    })),
  };
}

/** Formatting projection of report rows; no second pass-rate calculation. */
export function reportOverviewRows(report: PublishedReport): DisplayOverviewSource["overviews"] {
  return report.panels.map(panel => ({ key: panel.population_key,
    run_ids: report.populations.find(population => population.dataset === panel.dataset && population.key === panel.population_key)!.run_ids,
    rows: panel.views[0]!.rows.map(row => ({ ...row, passes: row.pass_display.passed,
      pass_rate: row.pass_display.rate, estimated: row.pass_display.estimated })) }));
}

export function reportEstimateSummary(report: PublishedReport, prefix = "", format: "markdown" | "html" = "markdown"): string {
  const rows = report.panels[0]!.views[0]!.rows.filter(r => r.pass_display.estimated);
  const summaries = rows.map(row => {
    const name = row.harness.charAt(0).toUpperCase() + row.harness.slice(1);
    const value = `${row.pass_display.rate}% estimated (${row.pass_display.passed}/${row.selected})`;
    return format === "html" ? `${escape(name)}: <strong>${value}</strong>.` : `${name}: **${value}**.`;
  });
  if (summaries.length === 0) return "";
  const link = report.estimate_evidence ? `${prefix}${report.estimate_evidence.file}` : null;
  return format === "html" ? `<p class="scope-note">${summaries.join(" ")}${link ? ` <a href="${escape(link)}">Method notes</a>.` : ""}</p>`
    : `${summaries.join(" ")}${link ? ` [Method notes](${link}).` : ""}\n\n`;
}
