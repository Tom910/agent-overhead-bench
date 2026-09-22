import { readFileSync } from "node:fs";
import { ConfigError } from "@aob/contracts";
import type { AnalysisExport } from "./analysis.js";
import { benchmarkTotalNote, costOverview } from "./analysis-render.js";
import { comparisonGroups, relativeMetricScore, type RelativeMetric } from "./comparison-overview.js";
import { overviewValue } from "./overview.js";
import { CONFIDENCE_METHOD, pairwiseConfidence } from "./comparison-confidence.js";
import { confidenceRows, confidenceTable, evidenceHtml, type ComparisonEvidence } from "./comparison-report.js";

const metrics: { key: RelativeMetric; label: string; direction: string; kind: "percent" | "cost" | "tokens" }[] = [
  { key: "pass", label: "Pass rate", direction: "Higher is better", kind: "percent" },
  { key: "cost", label: "Avg cost / task", direction: "Lower is better", kind: "cost" },
  { key: "benchmark", label: "Whole benchmark", direction: "Lower is better", kind: "cost" },
  { key: "cache", label: "Cache rate", direction: "Higher is better", kind: "percent" },
  { key: "input", label: "Tokens in", direction: "Lower is better", kind: "tokens" },
  { key: "output", label: "Tokens out", direction: "Lower is better", kind: "tokens" },
];
const escape = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
export function buildSiteData(data: AnalysisExport) {
  const groups = comparisonGroups(data);
  if (groups.length !== 1) throw new ConfigError("Results site requires one comparable campaign");
  const group = groups[0]!;
  const tasks = [...new Set(group.attempts.map(a => a.task))].sort();
  const views = [null, ...tasks].map(task => {
    const attempts = task === null ? group.attempts : group.attempts.filter(a => a.task === task);
    const rows = costOverview(attempts, group.rates);
    const confidence = pairwiseConfidence(attempts);
    const confidenceByBaseline = Object.fromEntries(rows.map(row => [row.harness, confidenceRows(confidence, row.harness)]));
    return { task, confidence, confidenceByBaseline, total: benchmarkTotalNote(attempts, group.rates), rows: rows.map(row => ({ ...row,
      scores: Object.fromEntries(metrics.map(m => [m.key, relativeMetricScore(row, rows, m.key)])) as Record<RelativeMetric, number | null>,
      display: Object.fromEntries(metrics.map(m => {
        const value = m.key === "pass" ? row.pass_rate : row[m.key].value;
        const partial = m.key !== "pass" && row[m.key].n < row.selected;
        const lowerBound = partial && (m.key === "cost" || m.key === "benchmark") && value !== null;
        return [m.key, `${lowerBound ? "≥ " : ""}${overviewValue(value, m.kind)}${partial && value !== null && m.key !== "pass" ? ` (${row[m.key].n}/${row.selected} measured)` : ""}`];
      })) as Record<RelativeMetric, string>,
    })) };
  });
  return { model: group.attempts[0]!.model, rates: group.rates, metrics, views };
}
export function renderResultsSite(data: AnalysisExport, dataset: string, exported: string, auditNote = "", evidence: ComparisonEvidence = { conditions: null, audit: null, conditions_dataset: null, audit_dataset: null }): string {
  const site = buildSiteData(data);
  const all = site.views[0]!;
  const baseline = [...all.rows].sort((a, b) => b.pass_rate - a.pass_rate || a.harness.localeCompare(b.harness))[0]!.harness;
  const taskRows = site.views.slice(1).map(v => `<tr><th scope="row">${escape(v.task!)}</th>${v.rows.map(r => `<td>${r.passes} / ${r.selected}</td>`).join("")}</tr>`).join("");
  const source = `https://github.com/Tom910/agent-overhead-bench/tree/main/evidence/${encodeURIComponent(dataset)}`;
  const css = readFileSync(new URL("./results-site.css", import.meta.url), "utf8");
  const script = readFileSync(new URL("./results-site-client.js", import.meta.url), "utf8");
  const payload = JSON.stringify(site).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  const staticRows = all.rows.map(row => `<tr><th scope="row">${escape(row.harness)}</th>${metrics.map(m => `<td data-label="${m.label}"><span class="value">${escape(row.display[m.key])}</span></td>`).join("")}</tr>`).join("");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Explore coding-agent pass rates, reference costs, cache efficiency and token usage from one Linux benchmark campaign."><meta name="color-scheme" content="light"><title>Agent Overhead Bench — Results explorer</title><style>${css}</style></head>
<body><a class="skip" href="#comparison">Skip to results</a>
<header class="topbar"><a class="brand" href="./"><span class="brand-mark" aria-hidden="true">aob<span>▰</span></span> Agent Overhead Bench</a><nav aria-label="Main"><a href="#comparison">Results</a><a href="#methodology">Methodology</a><a href="https://github.com/Tom910/agent-overhead-bench">GitHub ↗</a></nav></header>
<main><section id="comparison" class="comparison"><div class="section-heading"><div><h1>The numbers, <span class="nowrap">side by side.</span></h1><p class="intro">Pass rate, cost, cache and tokens. Compare the harnesses on the same model.</p></div><a class="button secondary" href="data/analysis.json" download>Download data ↓</a></div>
<div class="model-context"><span class="model-label">MODEL</span><strong title="${escape(site.model)}">${escape(site.model === "deepseek/deepseek-v4.1-flash" ? "DeepSeek V4.1 Flash" : site.model)}</strong><span class="context-divider">/</span><span>Linux</span><a href="#methodology">Measurement notes ↗</a></div>
<div class="controls" hidden id="controls"><label class="task-label">Task scope<select id="task-select"><option value="0">All eight tasks</option>${site.views.slice(1).map((v,i) => `<option value="${i+1}">${escape(v.task!)}</option>`).join("")}</select></label><fieldset><legend>Show harnesses</legend><div id="harness-controls"></div></fieldset><button class="text-button" id="reset" type="button">Reset view ↺</button></div>
<p class="active-scope" id="active-scope" aria-live="polite">All eight tasks · 40 runs per harness</p>
${evidence.audit ? `<p class="audit-inline">Original campaign verification · <a href="#verification-audit">Separate audit: ${evidence.audit.changes.length} Textual false negatives</a></p>` : ""}

<div class="chart-card" id="chart-card" hidden><div class="chart-heading"><div><h2>Pass rate meets cost.</h2><p>Higher means more passes. Further left means lower cost.</p></div><label>Compare cost<select id="chart-metric"><option value="cost">Average per task</option><option value="benchmark">All selected runs</option></select></label></div><div class="chart-layout"><div id="chart" class="chart" aria-label="Pass rate versus reference cost"></div><div id="chart-detail" class="chart-detail" aria-live="polite"><span class="eyebrow">EXPLORE THE PLOT</span><h3>Cost meets outcome.</h3><p>Select a point to see its pass rate, cost and distance from the observed best.</p><p class="muted">Up = more passes<br>Left = lower cost</p></div></div><div class="legend" id="legend"></div></div>
<div class="table-card"><div class="table-heading"><p><strong>Best = 100%</strong> for each metric · no combined score</p><label class="mobile-sort">Sort by<select id="mobile-sort"><option value="harness">Harness name</option>${metrics.map(m => `<option value="${m.key}">${m.label}</option>`).join("")}</select></label><span class="desktop-sort-hint">Select a column to sort ↕</span></div><div class="table-scroll"><table id="results-table"><caption class="sr-only">Harness measurements for the selected task scope. Relative scores compare all five harnesses.</caption><thead><tr><th scope="col" aria-sort="ascending"><button data-sort="harness">Harness <span aria-hidden="true">↕</span></button></th>${metrics.map(m => `<th scope="col" aria-sort="none"><button data-sort="${m.key}">${m.label} <span aria-hidden="true">↕</span><small>${m.direction}</small></button></th>`).join("")}</tr></thead><tbody id="results-body">${staticRows}</tbody></table></div><div class="table-footer"><p id="total-note">${escape(all.total)}</p><p>Cache and tokens: medians per run. Input includes cached tokens. K = 1,000 · M = 1,000,000.</p></div></div>
<noscript><p class="scope-note">The full-campaign table is available above. Enable JavaScript for sorting, task filters and the interactive chart.</p></noscript>
<div class="metric-notes"><p><strong>Average cost / task</strong>Average each task’s five runs, then average across the selected tasks.</p><p><strong>Whole benchmark</strong>Sum all selected runs per harness, including verification failures.</p><p><strong>Relative to best</strong>Higher pass/cache rates and lower costs/token counts score higher. No combined score.</p></div>
</section>
<section id="confidence" class="confidence-section"><div class="section-heading"><div><h2>How clear is the difference?</h2><p>Compare pass rates with a reference harness. A range crossing zero means no clear separation. Differences use percentage points (pp).</p></div><label>Compare with<select id="confidence-baseline">${all.rows.map(r => `<option value="${escape(r.harness)}"${r.harness === baseline ? " selected" : ""}>${escape(r.harness)}</option>`).join("")}</select></label></div><p id="confidence-scope">Eight task clusters · original verification · exploratory intervals</p><div id="confidence-results">${confidenceTable(all.confidence, baseline)}</div><details class="confidence-method"><summary>What the interval means</summary><p>${CONFIDENCE_METHOD}</p><p>A narrow interval does not prove equal performance. “Best = 100%” is an observed relative index. Corrected audit results are separate and do not enter these intervals.</p></details><p><a href="data/comparison.json">Download comparison evidence ↓</a></p></section>
<section class="task-section" id="tasks"><div class="section-heading"><div><h2>Results by task.</h2></div></div><p class="section-intro">Native verifier passes across five repetitions. Select a task to explore its costs and token usage above.</p><div id="task-matrix"><table><caption class="sr-only">Passes per task out of five repetitions, all harnesses.</caption><thead><tr><th scope="col">Task</th>${all.rows.map(r => `<th scope="col">${escape(r.harness)}</th>`).join("")}</tr></thead><tbody>${taskRows}</tbody></table></div><a class="button secondary" href="report.html">Open detailed timing &amp; request report ↗</a></section>
${evidenceHtml(evidence)}
<section id="methodology" class="methodology"><div><h2>How we measure.</h2><p>Every view is generated from the same validated report. You can inspect the selected runs, reproduce the tables, and trace the evidence.</p><a href="${source}">Browse snapshot provenance ↗</a></div><div class="method-cards"><details open><summary>How the comparison works</summary><p>One Linux host, model <strong>${escape(site.model)}</strong>, DeepSeek routing through OpenRouter, fallbacks disabled. Five harnesses, eight tasks, five repetitions. Pass rate is native verifier passes divided by all selected attempts. A verification failure alone does not distinguish a task failure from verifier infrastructure failure.</p><p>Lower token usage alone does not establish better task performance. Relative scores use all five harnesses within the selected task scope, even when some are hidden. A ≥ cost is a known lower bound; incomplete metrics are excluded from relative scoring.</p></details><details><summary>Token-based reference pricing</summary><p>${site.rates === null ? "Original recorded price books." : `$${site.rates.input * 1e6} per million uncached input tokens, $${site.rates.cached_input * 1e6} per million cached input tokens, and $${site.rates.output * 1e6} per million output tokens.`} Exact request counters feed the existing report calculation. These are reference estimates, not actual billing.</p><p>Passes and failures both contribute to costs and token/cache summaries. Cost averages weight tasks equally. Filtering to one task shows its average across repetitions and sum across all five runs.</p></details><details><summary>Limitations &amp; recovery audit</summary><p>This is a completed campaign snapshot, not the frozen v1 dataset. Eight tasks are a small sample; five repetitions do not imply broad capability estimates. Retained and rebuilt verifier images occur in this snapshot, so the overview is not a controlled image-matched comparison. Detailed reports retain environment identities.</p><p>Tool visibility is partial; non-model time is not pure harness overhead. ${escape(auditNote.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*/g, ""))}</p><p><a href="data/summary.json">Replacement mapping</a> · <a href="${source}/README.md">Full audit and reproduction</a></p></details><details><summary>One source, reproducible views</summary><p>The current-campaign pointer selects the sanitized analysis export. The README, detailed report and this site share its validated measurements and calculation functions. CI checks generated output without API keys or model calls.</p><p>Snapshot: <code>${escape(dataset)}</code><br>Exported: ${escape(exported)}</p><p><a href="data/analysis.json">Canonical analysis JSON</a> · <a href="data/provenance.json">Artifact hashes</a> · <a href="https://github.com/Tom910/agent-overhead-bench/blob/main/METHODOLOGY.md">Full methodology</a></p></details></div></section>
</main><footer><span class="brand">Agent Overhead Bench</span><p>Open measurements. Reproducible results.</p><a href="https://github.com/Tom910/agent-overhead-bench">Source on GitHub ↗</a></footer>
<script id="site-data" type="application/json">${payload}</script><script>${script}</script></body></html>\n`;
}
