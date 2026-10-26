import type { Distribution } from "./analysis.js";
import { escapeEvidence as esc } from "./comparison-report.js";
import type { Interval } from "./validity-diagnostics.js";
import type { DecisionCard, DecisionRow } from "./workload-decision.js";

export const rowIdentity = (row: { harness: string; version: string }): string => JSON.stringify([row.harness, row.version]);
export const rowLabel = (row: { harness: string; version: string }): string => `${row.harness} @ ${row.version}`;
export type DecisionLinks = { analysis: string; diagnostics: string; report: string; audit: string | null; source: string };
const number = (n: number) => Number(n.toPrecision(4)).toLocaleString("en-US", { maximumFractionDigits: 6 });
const money = (n: number) => `$${n === 0 ? "0" : n.toPrecision(4)}`;
const time = (n: number) => Math.abs(n) >= 60_000 ? `${number(n / 60_000)} min` : `${number(n / 1_000)} s`;
const signed = (n: number | null, format: (n: number) => string): string => n === null ? "Unavailable" : `${n > 0 ? "+" : n < 0 ? "−" : ""}${format(Math.abs(n))}`;
const coverage = (n: number, missing: number) => `n=${n}; missing=${missing}`;
const measured = (d: Distribution, format: (n: number) => string, spread = false): string =>
  `<strong>${d.median === null ? "Unavailable" : esc(format(d.median))}</strong><small>${coverage(d.n, d.missing)}</small>` +
  (spread ? `<small>Q1–Q3: ${d.q1 === null || d.q3 === null ? "Unavailable" : esc(`${format(d.q1)} to ${format(d.q3)}`)}; range: ${d.min === null || d.max === null ? "Unavailable" : esc(`${format(d.min)} to ${format(d.max)}`)}</small>` : "");
function interval(value: Interval, format: (n: number) => string): string {
  const bounds = value.lower === null || value.upper === null ? value.missing > 0 ? "Unavailable: incomplete coverage" : "Unavailable: one task" : `${format(value.lower)} to ${format(value.upper)}`;
  return `Mean ${value.estimate === null ? "unavailable" : esc(format(value.estimate))}; exploratory 95% interval: ${esc(bounds)}<small>${coverage(value.measured, value.missing)}; ${value.task_clusters} task clusters</small>`;
}
function rowHtml(row: DecisionRow): string {
  const c = row.reference_cost, o = row.outcomes;
  return `<article class="decision-row" data-decision-harness="${esc(rowIdentity(row))}"><h3>${esc(rowLabel(row))}</h3><dl class="decision-measures"><div><dt>Original passes</dt><dd><strong>${row.passes} / ${row.selected} passes</strong></dd></div><div><dt>All-attempt reference cost / task</dt><dd>${c.complete_mean_usd === null ? `<strong>Mean unavailable</strong><small>Known selected-attempt subtotal: ${c.known_lower_bound_usd === null ? "Unavailable" : `≥ ${money(c.known_lower_bound_usd)}`}</small>` : `<strong>${money(c.complete_mean_usd)}</strong>`}<small>${coverage(c.measured, c.missing)}</small></dd></div><div><dt>All-outcome agent time · median</dt><dd>${measured(row.agent_e2e_all, time)}</dd></div><div><dt>Successful agent time · median</dt><dd>${measured(row.agent_e2e_pass, time)}</dd></div></dl><p class="outcome-counts">${o.completed} completed · ${o.verify_error} verification failures · ${o.timeout} timeouts · ${o.adapter_error} adapter errors</p><p class="decision-interval">${interval(row.reference_cost_interval, money)}</p></article>`;
}
function explanation(row: DecisionRow, links: DecisionLinks): string {
  const labels = new Map<string, number>();
  for (const f of row.failure_labels) labels.set(f.category, (labels.get(f.category) ?? 0) + 1);
  return `<section data-decision-harness="${esc(rowIdentity(row))}"><h4>${esc(rowLabel(row))}</h4><dl class="decision-measures">${([
    ["All-outcome agent time", row.agent_e2e_all, time], ["Successful agent time", row.agent_e2e_pass, time],
    ["API-active union", row.api_active_ms, time], ["Non-model residual", row.non_model_ms, time],
    ["Requests per attempt", row.request_count, number], ["Cached input percent", row.cached_percent, (n: number) => `${number(n)}%`],
    ["Input tokens", row.input_tokens, number], ["Output tokens", row.output_tokens, number],
  ] as const).map(([label, d, format]) => `<div><dt>${label} · median</dt><dd>${measured(d, format, true)}</dd></div>`).join("")}</dl><p>Secondary input ${interval(row.input_tokens_mean_interval, number)}</p><p>Secondary output ${interval(row.output_tokens_mean_interval, number)}</p><p>Visibility: ${row.visibility.none} none, ${row.visibility.partial} partial, ${row.visibility.full} full. A visibility flag alone is not native timing qualification.</p><p>Evidence labels: ${[...labels].map(([label, count]) => `${count} ${esc(label.replace(/-/g, " "))}`).join("; ")}. Verification-unknown does not diagnose an agent or verifier cause.</p><p>Selected run IDs (image/environment identities and request timelines in the linked evidence):</p><ul class="run-evidence">${row.run_ids.map(id => `<li><code>${esc(id)}</code></li>`).join("")}</ul><p><a href="${esc(links.analysis)}">Inspect run identities and measurements</a> · <a href="${esc(links.diagnostics)}">Inspect bound failure evidence</a></p></section>`;
}
export function decisionDifferencesHtml(card: DecisionCard): string {
  const labels = new Map(card.rows.map(row => [rowIdentity(row), rowLabel(row)]));
  return card.differences.map(d => `<tr data-decision-harness="${esc(d.harness)}"><th scope="row">${esc(labels.get(d.harness)!)}${d.harness === d.reference_harness ? " (reference)" : ""}</th><td>${signed(d.pass_pp, n => `${number(n)} pp`)}<small>Exploratory 95%: ${d.harness === d.reference_harness ? "Reference" : d.pass_interval_pp === null ? "one task; interval unavailable" : d.pass_interval_pp.map(n => signed(n, v => `${number(v)} pp`)).join(" to ")}</small></td><td>${signed(d.cost_usd, money)}<small>${d.cost_percent === null ? "Percent unavailable" : `${signed(d.cost_percent, number)}%`}</small></td><td>${signed(d.e2e_all_median_ms, time)}<small>${d.e2e_all_percent === null ? "Percent unavailable" : `${signed(d.e2e_all_percent, number)}%`}</small></td><td>${esc(d.coverage_note)}</td></tr>`).join("");
}
export function decisionViewHtml(card: DecisionCard, links: DecisionLinks): string {
  const baseline = card.rows.find(r => rowIdentity(r) === card.differences[0]!.reference_harness)!;
  return `<h3>${esc(card.workload.label)}</h3><p>${esc(card.evidence_note)}</p><p>Time is agent end-to-end elapsed time, excluding setup and verification. All-outcome values include fast failures; successful timing uses only passes. Reference cost includes all selected outcomes and weights tasks equally. Unmeasured workflows: not measured.</p><div class="decision-grid">${card.rows.map(rowHtml).join("")}</div><div class="decision-table-scroll" tabindex="0" role="region" aria-label="Observed differences"><table class="decision-differences"><caption>Observed differences from <span id="decision-reference">${esc(rowLabel(baseline))}</span>. Reference stays fixed when hidden. Positive means more passes, higher cost or longer time.</caption><thead><tr><th scope="col">Harness version</th><th scope="col">Pass difference</th><th scope="col">Mean cost difference</th><th scope="col">All-outcome median time difference</th><th scope="col">Coverage</th></tr></thead><tbody id="decision-differences">${decisionDifferencesHtml(card)}</tbody></table></div><details id="decision-explanation" class="joint-explanation"><summary>Explain time, tokens and failure evidence together</summary><p>API-active union (<code>model_time</code>) is proxy-observed API-active time including transport, not provider compute. Non-model residual (<code>non_model_time</code>) includes unobserved tools and harness work. Timing correlation is a hypothesis, not a diagnosed cause; these observations do not establish a full tool/harness split.</p><p>These are observed median, quartile and min–max distributions, not confidence intervals. Secondary token mean intervals do not replace the headline token medians. No winner-selection or multiple-comparison correction is applied.</p>${card.rows.map(r => explanation(r, links)).join("")}<p><a href="${esc(links.report)}">Detailed timing report and request timelines</a> · <a href="${esc(links.diagnostics)}">Download diagnostics</a></p></details>`;
}
