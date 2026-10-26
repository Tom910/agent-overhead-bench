import { readFileSync } from "node:fs";
import { ConfigError } from "@aob/contracts";
import type { AnalysisExport } from "./analysis.js";
import { benchmarkTotalNote, costOverview } from "./analysis-render.js";
import { comparisonGroups, relativeMetricScore, type RelativeMetric, type ComparisonGroup } from "./comparison-overview.js";
import { overviewValue } from "./overview.js";
import { CONFIDENCE_METHOD, pairwiseConfidence } from "./comparison-confidence.js";
import { confidenceRows, confidenceTable, evidenceHtml, type ComparisonEvidence } from "./comparison-report.js";
import { buildDecisionSiteData, type ValidatedCampaign } from "./validated-campaign-registry.js";
import { decisionDifferencesHtml, decisionViewHtml, rowIdentity, rowLabel, type DecisionLinks } from "./results-decision.js";

const metrics: { key: RelativeMetric; label: string; direction: string; kind: "percent" | "cost" | "tokens" }[] = [
  { key: "pass", label: "Pass rate", direction: "Higher is better", kind: "percent" },
  { key: "cost", label: "Avg cost / task", direction: "Lower is better", kind: "cost" },
  { key: "benchmark", label: "Whole benchmark", direction: "Lower is better", kind: "cost" },
  { key: "cache", label: "Cache rate", direction: "Higher is better", kind: "percent" },
  { key: "input", label: "Tokens in", direction: "Lower is better", kind: "tokens" },
  { key: "output", label: "Tokens out", direction: "Lower is better", kind: "tokens" },
];
const escape = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
export function buildSiteData(data: AnalysisExport, validatedGroup?: ComparisonGroup) {
  const groups = validatedGroup ? [validatedGroup] : comparisonGroups(data);
  if (groups.length !== 1) throw new ConfigError("Results site requires one comparable campaign");
  const group = groups[0]!;
  const taskKey = (a: typeof group.attempts[number]) => JSON.stringify([a.task, a.task_base_revision]);
  const tasks = new Map(group.attempts.map(a => [taskKey(a), a]));
  const views = ["all", ...[...tasks.keys()].sort()].map(id => {
    const source = tasks.get(id);
    const task = source ? source.task + ([...tasks.values()].filter(a => a.task === source.task).length > 1 ? ` @ ${source.task_base_revision ?? "unknown revision"}` : "") : null;
    const attempts = id === "all" ? group.attempts : group.attempts.filter(a => taskKey(a) === id);
    const rows = costOverview(attempts, group.rates);
    const confidence = pairwiseConfidence(attempts.map(a => ({ ...a, task: taskKey(a), harness: rowIdentity(a) })));
    const labels = new Map(rows.map(row => [rowIdentity(row), rowLabel(row)]));
    const confidenceByBaseline = Object.fromEntries(rows.map(row => [rowIdentity(row), confidenceRows(confidence, rowIdentity(row)).map(r => ({ ...r, label: labels.get(r.harness)! }))]));
    return { id, task, confidence, confidenceByBaseline, total: benchmarkTotalNote(attempts, group.rates), rows: rows.map(row => ({ ...row, id: rowIdentity(row), label: rowLabel(row),
      scores: Object.fromEntries(metrics.map(m => [m.key, relativeMetricScore(row, rows, m.key)])) as Record<RelativeMetric, number | null>,
      display: Object.fromEntries(metrics.map(m => {
        const value = m.key === "pass" ? row.pass_rate : row[m.key].value;
        const partial = m.key !== "pass" && row[m.key].n < row.selected;
        const lowerBound = partial && (m.key === "cost" || m.key === "benchmark") && value !== null;
        return [m.key, `${lowerBound ? "≥ " : ""}${overviewValue(value, m.kind)}${partial && value !== null && m.key !== "pass" ? ` (${row[m.key].n}/${row.selected} measured)` : ""}`];
      })) as Record<RelativeMetric, string>,
    })), decision: null as null | { html: string; differences: Record<string, string> } };
  });
  return { model: group.attempts[0]!.model, rates: group.rates, metrics, views };
}
const sourceUrl = (dataset: string) => `https://github.com/Tom910/agent-overhead-bench/tree/main/evidence/${encodeURIComponent(dataset)}`;
const rawUrl = (dataset: string, file: string) => `https://raw.githubusercontent.com/Tom910/agent-overhead-bench/main/evidence/${encodeURIComponent(dataset)}/${file}`;
const emptyEvidence: ComparisonEvidence = { conditions: null, audit: null, conditions_dataset: null, audit_dataset: null };
const defaultBaseline = (site: ReturnType<typeof buildSiteData>) => [...site.views[0]!.rows].sort((a, b) => b.pass_rate - a.pass_rate || a.id.localeCompare(b.id))[0]!.id;
export type ResultsSiteContext = { noticeHtml: string; source: string; readme: string; summaryLabel: string; limitsHtml: string; description: string };
export function buildResultsExplorer(campaigns: readonly ValidatedCampaign[], context?: ResultsSiteContext) {
  return buildDecisionSiteData(campaigns).panels.map(panel => {
    const campaign = campaigns.find(c => c.dataset === panel.dataset && c.groups[0]!.key === panel.population_key)!;
    const local = panel.dataset === campaigns[0]!.dataset;
    const links: DecisionLinks & { comparison: string; summary: string; provenance: string; readme: string } = {
      comparison: local ? "data/comparison.json" : rawUrl(panel.dataset, "comparison.json"),
      summary: local ? "data/summary.json" : rawUrl(panel.dataset, "summary.json"),
      provenance: local ? "data/provenance.json" : rawUrl(panel.dataset, "provenance.json"), readme: local && context ? context.readme : sourceUrl(panel.dataset) + "/README.md", analysis: local ? "data/analysis.json" : rawUrl(panel.dataset, "analysis.json"),
      diagnostics: local ? "data/diagnostics.json" : rawUrl(panel.dataset, "diagnostics.json"),
      report: local ? "report.html" : sourceUrl(panel.dataset) + "/analysis.html", source: local && context ? context.source : sourceUrl(panel.dataset),
      audit: campaign.evidence.audit_dataset === null ? null : local ? "data/task-audit.json" : rawUrl(campaign.evidence.audit_dataset, "audit.json") };
    const site = buildSiteData(campaign.analysis, campaign.groups[0]!);
    const baseline = defaultBaseline(site), a = campaign.evidence.audit;
    const correctedTotal = campaign.analysis.attempts.filter(a => a.task === "textual-richlog-follow-state").length;
    const audit = a ? `<p class="audit-inline"><strong>Original grades unchanged.</strong> Separate audit revision <code>${escape(a.revision)}</code>: ${a.changes.length} confirmed verifier false negatives across the campaign. Original replay coverage ${a.reproduced}/${a.audited}; corrected Textual replay coverage ${a.corrected}/${correctedTotal}; ${a.unavailable} unavailable original images. These are campaign audit counts, not corrected workload results. <a href="${escape(links.audit!)}">Inspect bound audit data</a> · <a href="${sourceUrl(campaign.evidence.audit_dataset!)}/README.md">Read audit revision</a></p>` : `<p class="audit-inline">Original grades unchanged. No separate corrected-verifier audit is bound to this population.</p>`;
    const attempt = campaign.analysis.attempts[0]!;
    return { ...site, id: JSON.stringify([panel.dataset, panel.population_key]), dataset: panel.dataset, population_key: panel.population_key,
      label: `${panel.model} · ${attempt.configuration ?? "configuration not recorded"} · ${panel.dataset}`,
      context: `${attempt.host.os} · ${attempt.condition} · ${attempt.regime}`, baseline, links, audit,
      evidence: local ? evidenceHtml(campaign.evidence) : evidenceHtml(campaign.evidence).replaceAll('href="data/task-audit.json"', `href="${escape(links.audit ?? links.source)}"`),
      pricing: `$${panel.rates.input * 1e6} per million uncached input tokens, $${panel.rates.cached_input * 1e6} per million cached input tokens, and $${panel.rates.output * 1e6} per million output tokens. Reference estimates, not billing. Reference book: ${panel.reference_book}. Original books: ${panel.original_price_books.join(", ")}.`,
      provenance: `Dataset: ${panel.dataset}. Analysis: ${panel.source_sha256}.`,
      views: site.views.map(view => {
        const cards = panel.cards.filter(card => card.workload.id === view.id);
        const card = cards.find(card => card.differences[0]!.reference_harness === baseline)!;
        // One row/explanation rendering per scope; reference-dependent differences are small separate fragments.
        return { ...view, decision: { html: decisionViewHtml({ ...card, workload: { ...card.workload, label: view.task ?? card.workload.label } }, links),
          differences: Object.fromEntries(cards.map(c => [c.differences[0]!.reference_harness, decisionDifferencesHtml(c)])) } };
      }) };
  });
}
export function renderCampaignResultsSite(campaigns: readonly ValidatedCampaign[], exported: string, auditNote = "", context?: ResultsSiteContext): string {
  const first = campaigns[0];
  if (!first) throw new ConfigError("Results site requires a validated campaign");
  return renderResultsSite(first.analysis, first.dataset, exported, auditNote, first.evidence, buildResultsExplorer(campaigns, context), context);
}
export function renderResultsSite(data: AnalysisExport, dataset: string, exported: string, auditNote = "", evidence: ComparisonEvidence = emptyEvidence, panels?: ReturnType<typeof buildResultsExplorer>, context?: ResultsSiteContext): string {
  if (panels && panels.length === 0) throw new ConfigError("Results site requires eligible reference prices");
  const site = panels?.[0] ?? buildSiteData(data), active = panels?.[0];
  const all = site.views[0]!;
  const taskCount = site.views.length - 1, harnessCount = all.rows.length;
  const confidenceMethod = CONFIDENCE_METHOD.replace("Eight task clusters", `${taskCount} task clusters`);
  const baseline = defaultBaseline(site);
  const taskRows = site.views.slice(1).map(v => `<tr><th scope="row">${escape(v.task!)}</th>${v.rows.map(r => `<td>${r.passes} / ${r.selected}</td>`).join("")}</tr>`).join("");
  const source = context?.source ?? sourceUrl(dataset);
  const css = readFileSync(new URL("./results-site.css", import.meta.url), "utf8");
  const script = readFileSync(new URL("./results-site-client.js", import.meta.url), "utf8");
  const payload = JSON.stringify(panels ? { panels } : site).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  const staticRows = all.rows.map(row => `<tr><th scope="row">${escape(row.label)}</th>${metrics.map(m => `<td data-label="${m.label}"><span class="value">${escape(row.display[m.key])}</span></td>`).join("")}</tr>`).join("");
  const confidenceLabels = new Map(all.rows.map(r => [r.id, r.label]));
  const staticConfidence = confidenceTable(all.confidence.map(p => ({ ...p, left: confidenceLabels.get(p.left)!, right: confidenceLabels.get(p.right)! })), confidenceLabels.get(baseline)!);
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escape(context?.description ?? "Explore coding-agent pass rates, reference costs, cache efficiency and token usage from one Linux benchmark campaign.")}"><meta name="color-scheme" content="light"><title>Agent Overhead Bench — Results explorer</title><style>${css}</style></head>
<body><a class="skip" href="#comparison">Skip to results</a>
<header class="topbar"><a class="brand" href="./"><span class="brand-mark" aria-hidden="true">aob<span>▰</span></span> Agent Overhead Bench</a><nav aria-label="Main"><a href="#comparison">Results</a><a href="#methodology">Methodology</a><a href="https://github.com/Tom910/agent-overhead-bench">GitHub ↗</a></nav></header>
<main><section id="comparison" class="comparison">${context ? `<div class="audit-inline" role="note">${context.noticeHtml}</div>` : ""}<div class="section-heading"><div><h1>The numbers, <span class="nowrap">side by side.</span></h1><p class="intro">Pass rate, cost, cache and tokens. Compare the harnesses on the same model.</p></div><a class="button secondary" data-panel-link="analysis" href="data/analysis.json" download>Download data ↓</a></div>
<div class="model-context"><span class="model-label">MODEL</span><strong id="model-name" title="${escape(site.model)}">${escape(site.model === "deepseek/deepseek-v4.1-flash" ? "DeepSeek V4.1 Flash" : site.model)}</strong><span class="context-divider">/</span><span id="model-context">${escape(active?.context ?? "Recorded campaign")}</span><a href="#methodology">Measurement notes ↗</a></div>
<div class="controls" hidden id="controls">${panels ? `<label class="model-select-label">Model / configuration<select id="model-select">${panels.map((p, i) => `<option value="${i}">${escape(p.label)}</option>`).join("")}</select></label>` : ""}<label class="task-label">Task scope<select id="task-select"><option value="0">All ${taskCount} tasks</option>${site.views.slice(1).map((v,i) => `<option value="${i+1}">${escape(v.task!)}</option>`).join("")}</select></label><label>Reference harness / version<select id="confidence-baseline">${all.rows.map(r => `<option value="${escape(r.id)}"${r.id === baseline ? " selected" : ""}>${escape(r.label)}</option>`).join("")}</select></label><fieldset><legend>Show harnesses</legend><div id="harness-controls"></div></fieldset><button class="text-button" id="reset" type="button">Reset view ↺</button></div>
<p class="active-scope" id="active-scope" aria-live="polite">All ${taskCount} tasks · ${all.rows[0]!.selected} runs per harness</p>
${active ? `<div id="decision-audit">${active.audit}</div>` : evidence.audit ? `<p class="audit-inline">Original campaign verification · <a href="#verification-audit">Separate audit: ${evidence.audit.changes.length} Textual false negatives</a></p>` : ""}

<div class="chart-card" id="chart-card" hidden><div class="chart-heading"><div><h2>Pass rate meets cost.</h2><p>Higher means more passes. Further left means lower cost.</p></div><label>Compare cost<select id="chart-metric"><option value="cost">Average per task</option><option value="benchmark">All selected runs</option></select></label></div><div class="chart-layout"><div id="chart" class="chart" aria-label="Pass rate versus reference cost"></div><div id="chart-detail" class="chart-detail" aria-live="polite"><span class="eyebrow">EXPLORE THE PLOT</span><h3>Cost meets outcome.</h3><p>Select a point to see its pass rate, cost and distance from the observed best.</p><p class="muted">Up = more passes<br>Left = lower cost</p></div></div><div class="legend" id="legend"></div></div>
<div class="table-card"><div class="table-heading"><p><strong>Best = 100%</strong> for each metric · no combined score</p><label class="mobile-sort">Sort by<select id="mobile-sort"><option value="harness">Harness name</option>${metrics.map(m => `<option value="${m.key}">${m.label}</option>`).join("")}</select></label><span class="desktop-sort-hint">Select a column to sort ↕</span></div><div class="table-scroll"><table id="results-table"><caption class="sr-only">Harness measurements for the selected task scope. Relative scores compare all ${harnessCount} harnesses.</caption><thead><tr><th scope="col" aria-sort="ascending"><button data-sort="harness">Harness <span aria-hidden="true">↕</span></button></th>${metrics.map(m => `<th scope="col" aria-sort="none"><button data-sort="${m.key}">${m.label} <span aria-hidden="true">↕</span><small>${m.direction}</small></button></th>`).join("")}</tr></thead><tbody id="results-body">${staticRows}</tbody></table></div><div class="table-footer"><p id="total-note">${escape(all.total)}</p><p>Cache and tokens: medians per run. Input includes cached tokens. K = 1,000 · M = 1,000,000.</p></div></div>
<noscript><p class="scope-note">The full-campaign table is available above. Enable JavaScript for sorting, task filters and the interactive chart.</p></noscript>
<div class="metric-notes"><p><strong>Average cost / task</strong>Average each task’s runs, then average across the selected tasks.</p><p><strong>Whole benchmark</strong>Sum all selected runs per harness, including verification failures.</p><p><strong>Relative to best</strong>Higher pass/cache rates and lower costs/token counts score higher. No combined score.</p></div>
</section>
${active ? `<section id="workload-decision" class="decision-section" aria-labelledby="decision-heading"><h2 id="decision-heading">Compare outcomes, time and cost.</h2><p>Use the task scope and reference harness above. Each metric answers a separate question; no combined score or universal winner.</p><p id="decision-pricing">${escape(active.pricing)}</p><div id="decision-content">${all.decision?.html ?? ""}</div><p><a data-panel-link="analysis" href="${escape(active.links.analysis)}">Canonical analysis</a> · <a data-panel-link="diagnostics" href="${escape(active.links.diagnostics)}">Download diagnostics</a> · <a data-panel-link="report" href="${escape(active.links.report)}">Detailed report and request timelines</a></p></section>` : ""}
<section id="confidence" class="confidence-section"><div class="section-heading"><div><h2>How clear is the difference?</h2><p>Compare pass rates with a reference harness. A range crossing zero means no clear separation. Differences use percentage points (pp).</p></div><a href="#controls">Change reference harness ↑</a></div><p id="confidence-scope">${taskCount} task clusters · original verification · exploratory intervals</p><div id="confidence-results">${staticConfidence}</div><details class="confidence-method"><summary>What the interval means</summary><p id="confidence-method">${confidenceMethod}</p><p>A narrow interval does not prove equal performance. “Best = 100%” is an observed relative index. Corrected audit results are separate and do not enter these intervals.</p></details><p><a data-panel-link="comparison" href="data/comparison.json">Download comparison evidence ↓</a></p></section>
<section class="task-section" id="tasks"><div class="section-heading"><div><h2>Results by task.</h2></div></div><p class="section-intro">Native verifier passes with each task’s repetition count shown. Select a task to explore its costs and token usage above.</p><div id="task-matrix"><table><caption class="sr-only">Passes and selected repetitions per task, all measured harnesses.</caption><thead><tr><th scope="col">Task</th>${all.rows.map(r => `<th scope="col">${escape(r.label)}</th>`).join("")}</tr></thead><tbody>${taskRows}</tbody></table></div><a class="button secondary" data-panel-link="report" href="report.html">Open detailed timing &amp; request report ↗</a></section>
<div id="population-evidence">${active?.evidence ?? evidenceHtml(evidence)}</div>
<section id="methodology" class="methodology"><div><h2>How we measure.</h2><p>Every view is generated from the same validated report. You can inspect the selected runs, reproduce the tables, and trace the evidence.</p><a data-panel-link="source" href="${source}">Browse snapshot provenance ↗</a></div><div class="method-cards"><details open><summary>How the comparison works</summary><p><span id="method-population">Model <strong>${escape(site.model)}</strong>. ${harnessCount} harnesses, ${taskCount} tasks; repetition counts are shown for each task.</span> Routing, configuration and collection conditions are specific to the selected population and retained in its evidence. Pass rate is native verifier passes divided by all selected attempts. A verification failure alone does not distinguish a task failure from verifier infrastructure failure.</p><p>Lower token usage alone does not establish better task performance. Relative scores use all measured harness versions within the selected population and task scope, even when some are hidden. A ≥ cost is a known lower bound; incomplete metrics are excluded from relative scoring.</p></details><details><summary>Token-based reference pricing</summary><p id="method-pricing">${active ? escape(active.pricing) : site.rates === null ? "Original recorded price books." : `$${site.rates.input * 1e6} per million uncached input tokens, $${site.rates.cached_input * 1e6} per million cached input tokens, and $${site.rates.output * 1e6} per million output tokens.`} Exact request counters feed the existing report calculation. These are reference estimates, not actual billing.</p><p>Passes and failures both contribute to costs and token/cache summaries. Cost averages weight tasks equally. Filtering to one task shows its average across repetitions and sum across all selected runs.</p></details><details><summary>Limitations &amp; recovery audit</summary><p>${context?.limitsHtml ?? "This is a completed campaign snapshot, not the frozen v1 dataset."} The selected tasks do not establish broad capability estimates; repeated runs do not create independent tasks. Recorded image, environment and collection differences limit interpretation; inspect the selected population’s evidence before treating it as a controlled comparison. Detailed reports retain environment identities.</p><p>Non-model time includes unobserved tools and harness work. ${active ? context ? "See the bound collection diagnostics for this population. No separate corrected-verifier audit is bound." : "See the separate bound audit and collection diagnostics for this population." : escape(auditNote.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*/g, ""))}</p><p><a data-panel-link="summary" href="data/summary.json">${context?.summaryLabel ?? "Replacement mapping"}</a> · <a data-panel-link="readme" href="${context?.readme ?? source + "/README.md"}">Full audit and reproduction</a></p></details><details><summary>One source, reproducible views</summary><p>The current-campaign pointer selects the sanitized analysis export. The README, detailed report and this site share its validated measurements and calculation functions. CI checks generated output without API keys or model calls.</p><p><span id="method-provenance">Snapshot: <code>${escape(dataset)}</code></span><br>Exported: ${escape(exported)}</p><p><a data-panel-link="analysis" href="data/analysis.json">Canonical analysis JSON</a> · <a data-panel-link="provenance" href="data/provenance.json">Artifact hashes</a> · <a href="https://github.com/Tom910/agent-overhead-bench/blob/main/METHODOLOGY.md">Full methodology</a></p></details></div></section>
</main><footer><span class="brand">Agent Overhead Bench</span><p>Open measurements. Reproducible results.</p><a href="https://github.com/Tom910/agent-overhead-bench">Source on GitHub ↗</a></footer>
<script id="site-data" type="application/json">${payload}</script><script>${script}</script></body></html>\n`;
}
