import type { AnalysisAttempt, AnalysisExport, AnalysisMetric, AnalysisPopulation, MatchedComparison, TaskDistribution } from "./analysis.js";
import type { AnalysisRequest } from "./request-analysis.js";
import { median } from "./derive.js";
import { summarizeOverview, overviewValue, type OverviewRow } from "./overview.js";

type Table = { headers: string[]; rows: string[][]; outcomes?: AnalysisAttempt["outcome"][] };

const explanation = [
  "Pass = completed native verification; verification failure = verify_error; other = timeout or adapter_error. verify_error alone does not distinguish task failure from verifier infrastructure failure. Failure timing stays separate and is not ranked against passes.",
  "Coverage counts all selected attempts. Each metric has its own valid n and missing n; timing, usage, caching and cost denominators can differ. Unavailable is not zero.",
  "IQR tasks counts successful timing tasks with at least two eligible repetitions, out of all successful timing tasks. Headline spread is the median measurable within-task IQR, not pooled spread.",
  "Outcome spend is the sum of selected static estimates. When any costs are missing, the displayed amount is only a known subtotal. Failed attempts and other outcomes are reported separately from pass spend.",
  "Distributions describe repetitions within one task, harness/version and outcome. Q1–Q3 and min–max describe observed samples, not confidence intervals; singleton quartiles are unavailable.",
  "Matched comparisons include only common successful task identities. Each task contributes one within-task median; summary times are medians across those task medians. The descriptive ratio is the median of right / left task ratios, not a causal effect or ratio of unrelated headline medians.",
  "Task identity includes base revision, verifier image and environment. Repetitions are not paired seeds; execution windows can differ. Recorded host fields do not establish machine identity.",
  "Request metrics come from sanitized C1 model attempts. Wait is first-byte minus request start; transfer is last-byte minus first-byte. Synthetic first-byte markers from network failures are unavailable. Gaps exclude overlapping model intervals; time after last is reconciled adapter end minus the latest response end. Request summary duration, wait, transfer and gap columns are medians of within-run medians, with metric-specific available and missing run counts.",
];

function html(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function md(value: string): string {
  return html(value).replace(/[\\`*_[\]]/g, "\\$&").replace(/\|/g, "&#124;").replace(/[\r\n]+/g, " ");
}

function number(value: number | null): string {
  return value === null ? "unavailable" : String(Number(value.toPrecision(7)));
}

function duration(value: number | null): string {
  if (value === null) return "unavailable";
  if (value < 1000) return `${number(value)} ms`;
  const seconds = Math.round(value / 10) / 100;
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${Number((seconds % 60).toFixed(2))}s`;
}

function outcome(value: AnalysisAttempt["outcome"]): string {
  return value === "completed" ? "Pass (completed)" : value === "verify_error" ? "Verification failure (verify_error)" : `Other (${value})`;
}

function identity(population: AnalysisPopulation): Array<[string, string]> {
  return [
    ["Condition", population.condition], ["Model", population.model], ["Price book", population.price_book],
    ["Host OS", population.host.os], ["Host CPU", population.host.cpu], ["Host RAM (GiB; rounded)", population.host.ram_gb.toFixed(2)],
    ["Source", population.source.name], ["Repository", population.source.repository ?? "unavailable"],
    ["Source revision", population.source.revision], ["Regime", population.regime],
    ["Ignored providers", population.routing === null ? "unavailable" : population.routing.ignored_providers.join(", ") || "none"],
    ["Only provider", population.routing?.only_provider ?? "unavailable"],
    ["Allow fallbacks", population.routing?.allow_fallbacks === undefined ? "unavailable" : String(population.routing.allow_fallbacks)],
    ["Configuration", population.configuration ?? "unavailable"], ["ORI version", population.ori_version ?? "unavailable"],
  ];
}

function populationAttempts(data: AnalysisExport, population: AnalysisPopulation): AnalysisAttempt[] {
  const ids = new Set(population.attempts);
  return data.attempts.filter((attempt) => ids.has(attempt.run_id));
}

function timingEligible(attempt: AnalysisAttempt): boolean {
  return attempt.timing !== null && !attempt.timing.unreconciled;
}

function coverage(attempts: AnalysisAttempt[], distributions: TaskDistribution[]): Table {
  const groups = new Map<string, AnalysisAttempt[]>();
  for (const attempt of attempts) {
    const key = JSON.stringify([attempt.harness, attempt.version]);
    const group = groups.get(key) ?? [];
    group.push(attempt);
    groups.set(key, group);
  }
  const tasks = (runs: AnalysisAttempt[]) => new Set(runs.map((run) => JSON.stringify([run.task, run.task_base_revision, run.verifier_image, run.environment]))).size;
  return {
    headers: ["Harness @ version", "Selected", "Pass", "Verify fail", "Other", "Tasks", "Timing n", "Timing tasks", "Turns n", "Input n", "Output n", "Cache n", "Cost n", "IQR tasks / successful timing tasks"],
    rows: [...groups.values()].map((runs) => {
      const timed = runs.filter(timingEligible);
      const successfulTasks = distributions.filter((row) => row.harness === runs[0]!.harness && row.version === runs[0]!.version && row.outcome === "completed" && row.metrics.end_to_end.n > 0);
      return [`${runs[0]!.harness} @ ${runs[0]!.version}`, String(runs.length),
        String(runs.filter((run) => run.outcome === "completed").length), String(runs.filter((run) => run.outcome === "verify_error").length),
        String(runs.filter((run) => run.outcome !== "completed" && run.outcome !== "verify_error").length),
        String(tasks(runs)), String(timed.length), String(tasks(timed)), String(runs.length),
        ...(["input_tokens", "output_tokens", "cached_percent", "cost_usd"] as const).map((metric) => String(runs.filter((run) => run[metric] !== null).length)),
        `${successfulTasks.filter((row) => row.metrics.end_to_end.n >= 2).length} / ${successfulTasks.length}`];
    }),
  };
}

function outcomeCosts(attempts: AnalysisAttempt[]): Table {
  const groups = new Map<string, AnalysisAttempt[]>();
  for (const attempt of attempts) {
    const key = JSON.stringify([attempt.harness, attempt.version, attempt.outcome]);
    const group = groups.get(key) ?? [];
    group.push(attempt);
    groups.set(key, group);
  }
  const rows = [...groups.values()];
  return {
    headers: ["Harness @ version", "Outcome", "Selected", "Priced n", "Missing n", "Selected static spend (USD)"],
    outcomes: rows.map((runs) => runs[0]!.outcome),
    rows: rows.map((runs) => {
      const priced = runs.filter((run) => run.cost_usd !== null);
      const missing = runs.length - priced.length;
      const amount = number(priced.reduce((sum, run) => sum + run.cost_usd!, 0));
      return [`${runs[0]!.harness} @ ${runs[0]!.version}`, outcome(runs[0]!.outcome), String(runs.length), String(priced.length), String(missing),
        priced.length === 0 ? "unavailable" : missing > 0 ? `Known subtotal: ${amount}` : `Total: ${amount}`];
    }),
  };
}

const metricLabels: Array<[AnalysisMetric, string]> = [
  ["end_to_end", "End-to-end (ms)"], ["model_time", "Model (ms)"], ["non_model_time", "Non-model (ms)"],
  ["startup", "Startup (ms)"], ["first_byte_ms", "First byte (ms)"], ["turns", "API turns"],
  ["input_tokens", "Input tokens"], ["output_tokens", "Output tokens"], ["cached_percent", "Cached input (%)"], ["cost_usd", "Static cost (USD)"],
  ["request_n", "Model request count"], ["median_duration_ms", "Within-run median request duration (ms)"],
  ["median_wait_ms", "Within-run median request wait (ms)"], ["median_transfer_ms", "Within-run median request transfer (ms)"],
  ["median_gap_before_ms", "Within-run median inter-request gap (ms)"], ["largest_duration_ms", "Largest request duration (ms)"],
  ["largest_gap_before_ms", "Largest inter-request gap (ms)"], ["time_after_last_ms", "Time after last model response (ms)"],
];

function distributionTable(row: TaskDistribution, readableTime = false): Table {
  return {
    headers: ["Metric", "Valid n", "Missing n", "Median", "Q1", "Q3", "Min", "Max"],
    rows: metricLabels.map(([key, label]) => {
      const value = row.metrics[key];
      const display = readableTime && label.endsWith("(ms)") ? duration : number;
      return [readableTime ? label.replace(" (ms)", "") : label, String(value.n), String(value.missing), display(value.median), display(value.q1), display(value.q3), display(value.min), display(value.max)];
    }),
  };
}

function comparisonTable(pair: MatchedComparison, readableTime = false): Table {
  const display = readableTime ? duration : number;
  return {
    headers: ["Common successful task", "Left n", readableTime ? "Left median" : "Left median (ms)", "Right n", readableTime ? "Right median" : "Right median (ms)", "Right / left"],
    rows: pair.tasks.map((task) => [task.task, String(task.left_n), display(task.left_ms), String(task.right_n), display(task.right_ms),
      number(task.left_ms === 0 ? null : task.right_ms / task.left_ms)]),
  };
}

function comparisonSummary(pair: MatchedComparison, readableTime = false): string {
  const display = readableTime ? duration : (value: number | null) => value === null ? "unavailable" : `${number(value)} ms`;
  return `Common successful tasks: ${pair.tasks.length}. Left median of task medians: ${display(pair.left_ms)}. Right median of task medians: ${display(pair.right_ms)}. Median task ratio (right / left): ${number(pair.median_task_ratio)}.`;
}

function markdownTable(table: Table): string {
  const row = (values: string[]) => `| ${values.map(md).join(" | ")} |`;
  return [row(table.headers), row(table.headers.map(() => "---")), ...table.rows.map(row)].join("\n");
}

function htmlTable(table: Table): string {
  return `<div class="table-scroll"><table><thead><tr>${table.headers.map((value) => `<th scope="col">${html(value)}</th>`).join("")}</tr></thead><tbody>${table.rows.map((row, index) => `<tr${table.outcomes?.[index] === undefined ? "" : ` data-outcome="${html(table.outcomes[index]!)}"`}>${row.map((value) => `<td>${html(value)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

const overviewNote = "All selected outcomes. Task coverage can differ; these are descriptive summaries, not a ranking. Cost, cache and tokens are medians per measured attempt. Cost is a static estimate, not billing. Cache rate is the median attempt cached-input percentage, not a pooled token ratio. Input includes cached tokens; token counters cover successful model responses. Missing measurements are not zero.";
const primaryMetrics = [
  ["cost", "Median cost / attempt", "cost"], ["cache", "Cache rate", "percent"],
  ["input", "Tokens in", "tokens"], ["output", "Tokens out", "tokens"],
] as const;

function overviewCoverage(row: OverviewRow, n: number): string {
  return `${n}/${row.selected} measured${n < row.selected ? " · partial" : ""}`;
}

function overviewMarkdown(attempts: AnalysisAttempt[]): string {
  return markdownTable({
    headers: ["Harness", "Pass rate", ...primaryMetrics.map(([, label]) => label), "Tasks"],
    rows: summarizeOverview(attempts).map((row) => [
      `${row.harness} @ ${row.version}`, `${overviewValue(row.pass_rate, "percent")} · ${row.passes}/${row.selected}`,
      ...primaryMetrics.map(([key, , kind]) => `${overviewValue(row[key].value, kind)} (${overviewCoverage(row, row[key].n)})`), String(row.tasks),
    ]),
  });
}

function overviewHtml(attempts: AnalysisAttempt[]): string {
  const rows = summarizeOverview(attempts);
  const maximum = (key: "cost" | "input" | "output") => Math.max(0, ...rows.map((row) => row[key].value ?? 0));
  const bar = (value: number | null, max: number) => value === null ? "" : `<span class="metric-track" aria-hidden="true"><span style="width:${max === 0 ? 0 : (value / max * 100).toFixed(2)}%"></span></span>`;
  return `<div class="metric-overview"><div class="overview-heading"><h3>At a glance</h3><span class="snapshot-label">Descriptive snapshot</span></div><p class="overview-note">All selected outcomes · task coverage can differ · medians over measured attempts</p><div class="overview-rows">${rows.map((row) =>
    `<div class="overview-row" data-name="${html(row.harness + " @ " + row.version)}" data-pass="${row.pass_rate}" ${primaryMetrics.map(([key]) => `data-${key}="${row[key].value ?? ""}"`).join(" ")}>
<div class="harness-label"><strong>${html(row.harness)}</strong><span>${html(row.version)}</span><small>${row.tasks} tasks · ${row.selected} attempts</small></div>
<div class="primary-metric" data-metric="pass"><span class="metric-label">Pass rate</span><strong>${overviewValue(row.pass_rate, "percent")}</strong>${bar(row.pass_rate, 100)}<small>${row.passes}/${row.selected} passed</small></div>
${primaryMetrics.map(([key, label, kind]) => `<div class="primary-metric" data-metric="${key}"><span class="metric-label">${label}</span><strong tabindex="0" title="${html(row[key].value === null ? "No measured values" : String(row[key].value))}" aria-label="${html(label + ': ' + (row[key].value === null ? 'Unavailable' : String(row[key].value)))}">${overviewValue(row[key].value, kind)}</strong>${bar(row[key].value, key === "cache" ? 100 : maximum(key))}<small>${overviewCoverage(row, row[key].n)}</small></div>`).join("")}</div>`).join("")}</div><details><summary>Metric definitions</summary><p>${overviewNote}</p><p>Cache rate is the median attempt cached-input percentage, not a pooled token ratio. K = 1,000; M = 1,000,000. Focus a value for its exact accessible value. Sorting is descriptive; no winners are inferred from unequal samples. Overview values include every selected outcome and do not change with the detail outcome filter.</p></details></div>`;
}

export function renderAnalysisMarkdown(data: AnalysisExport): string {
  const lines = ["# Selected-attempt analysis", "", `Selected attempts: ${data.attempts.length}. Populations: ${data.populations.length}.`, "", overviewNote, ""];
  if (data.attempts.length === 0) lines.push("No selected attempts.", "");
  for (const [index, population] of data.populations.entries()) {
    const attempts = populationAttempts(data, population);
    lines.push(`## Population ${index + 1}: ${md(population.model)} · ${md(population.host.os)} · ${md(population.price_book)}`, "", "### At a glance", "", overviewMarkdown(attempts), "");
    lines.push("### Recorded population identity", "", markdownTable({ headers: ["Recorded identity", "Value"], rows: identity(population) }), "", "### Coverage", "", markdownTable(coverage(attempts, population.distributions)), "", "### Selected spend by outcome", "", markdownTable(outcomeCosts(attempts)), "", "### Request-level summaries", "", markdownTable(requestCoverage(attempts)), "", "### Common successful tasks", "");
    if (population.comparisons.length === 0) lines.push("No cross-harness pairs in this population.", "");
    for (const pair of population.comparisons) {
      lines.push(`#### ${md(pair.left)} (left) vs ${md(pair.right)} (right)`, "", md(comparisonSummary(pair)), "",
        pair.tasks.length === 0 ? "No common successful tasks; comparison unavailable." : markdownTable(comparisonTable(pair)), "");
    }
    lines.push("### Per-task outcome distributions", "");
    for (const row of population.distributions) {
      lines.push(`#### ${md(row.task)} — ${md(row.harness)} @ ${md(row.version)} — ${outcome(row.outcome)}`, "",
        `Selected attempts: ${row.attempts.length}. Task identity: ${md(row.task_key)}.`, "", markdownTable(distributionTable(row)), "");
    }
    const annotated = data.annotated_runs.filter((item) => attempts.some((attempt) => attempt.run_id === item.run_id));
    if (annotated.length > 0) {
      lines.push("### Annotated request timelines", "");
      for (const item of annotated) {
        const attempt = attempts.find((row) => row.run_id === item.run_id);
        if (attempt === undefined) continue;
        lines.push(`#### ${md(attempt.run_id)} — ${md(item.reason)}`, "",
          `${md(attempt.harness)} @ ${md(attempt.version)} · ${md(attempt.task)} · ${outcome(attempt.outcome)}. Calls ${attempt.request_summary.n} (${attempt.request_summary.n_success} successful). Median duration ${duration(attempt.request_summary.median_duration_ms)}; largest gap ${duration(attempt.request_summary.largest_gap_before_ms)}; time after last ${duration(attempt.request_summary.time_after_last_ms)}.`, "");
      }
    }
  }
  lines.push("## Measurement notes", "", ...[...explanation, ...data.notes].flatMap((note) => [md(note), ""]));
  return lines.join("\n");
}

function timingDots(attempts: AnalysisAttempt[], distributions: TaskDistribution[]): string {
  const eligible = attempts.filter(timingEligible);
  if (eligible.length === 0) return "<p>No eligible timing observations.</p>";
  const maximum = Math.max(...eligible.map((run) => run.timing!.end_to_end), 1);
  const charts = distributions.map((row) => {
    const ids = new Set(row.attempts);
    const runs = eligible.filter((run) => ids.has(run.run_id));
    if (runs.length === 0) return "";
    const label = `${row.task} · ${row.harness} @ ${row.version} · ${outcome(row.outcome)} · n=${runs.length}`;
    const dots = runs.map((run, index) => {
      const value = run.timing!.end_to_end;
      const title = `${run.run_id} · ${run.outcome} · ${number(value)} ms (${duration(value)}) · ${run.harness} @ ${run.version} · ${run.task}`;
      return `<circle cx="${(30 + value / maximum * 740).toFixed(2)}" cy="${16 + (index % 3) * 12}" r="5" tabindex="0" data-run-id="${html(run.run_id)}" aria-label="${html(title)}"><title>${html(title)}</title></circle>`;
    }).join("");
    return `<figure data-outcome="${html(row.outcome)}"><figcaption>${html(label)}</figcaption><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 80" role="img" aria-label="${html(label)}"><title>${html(label)}</title><line x1="30" x2="770" y1="55" y2="55" stroke="#aab6c6"/><text x="30" y="75">0 ms</text><text x="770" y="75" text-anchor="end">${duration(maximum)}</text>${dots}</svg></figure>`;
  }).join("");
  return `<p>One dot per timing-eligible run; hover or focus for run ID, outcome and duration. All rows in this population share an end-to-end duration axis. Vertical offsets separate repeated observations; they have no quantitative meaning.</p>${charts}`;
}

function requestCoverage(attempts: AnalysisAttempt[]): Table {
  const groups = new Map<string, AnalysisAttempt[]>();
  for (const attempt of attempts) {
    const key = JSON.stringify([attempt.harness, attempt.version, attempt.outcome]);
    const group = groups.get(key) ?? [];
    group.push(attempt);
    groups.set(key, group);
  }
  return {
    headers: ["Harness @ version", "Outcome", "Runs", "Median calls", "Median of run median durations", "Median of run median waits", "Median of run median transfers", "Median of run median gaps", "Median time after last"],
    outcomes: [...groups.values()].map((runs) => runs[0]!.outcome),
    rows: [...groups.values()].map((runs) => {
      const first = runs[0]!;
      const pick = (select: (run: AnalysisAttempt) => number | null, format = duration) => {
        const values = runs.map(select).filter((value): value is number => value !== null);
        return `${format(values.length ? median(values) : null)} (available n=${values.length}; missing n=${runs.length - values.length})`;
      };
      return [
        `${first.harness} @ ${first.version}`, outcome(first.outcome), String(runs.length),
        pick((run) => run.request_summary.n, number),
        pick((run) => run.request_summary.median_duration_ms),
        pick((run) => run.request_summary.median_wait_ms),
        pick((run) => run.request_summary.median_transfer_ms),
        pick((run) => run.request_summary.median_gap_before_ms),
        pick((run) => run.request_summary.time_after_last_ms),
      ];
    }),
  };
}

function requestAxisEnd(attempt: AnalysisAttempt): number {
  const latest = Math.max(0, ...attempt.requests.map((request) => request.t_end_ms));
  return timingEligible(attempt) ? Math.max(latest, attempt.timing!.end_to_end - attempt.timing!.startup) : latest;
}

function requestTimeline(attempt: AnalysisAttempt, label: string): string {
  const requests = attempt.requests;
  if (requests.length === 0) return "<p>No model requests.</p>";
  const end = requestAxisEnd(attempt);
  const scale = end === 0 ? 1 : end;
  const latest = Math.max(...requests.map((request) => request.t_end_ms));
  const tail = timingEligible(attempt) && end > latest
    ? `<rect data-tail-ms="${end - latest}" x="${(40 + latest / scale * 720).toFixed(2)}" y="12" width="${((end - latest) / scale * 720).toFixed(2)}" height="30" fill="#e3e7ed"><title>After last model response: ${duration(end - latest)}</title></rect>` : "";
  const bars = requests.map((request) => {
    const x = 40 + request.t_start_ms / scale * 720;
    const width = request.duration_ms / scale * 720;
    const title = `seq ${request.seq} · ${duration(request.duration_ms)} · wait ${duration(request.wait_ms)} · transfer ${duration(request.transfer_ms)} · gap ${duration(request.gap_before_ms)}`;
    return `<rect x="${x.toFixed(2)}" y="18" width="${width.toFixed(2)}" height="18" fill="${request.successful ? "#2763ad" : "#b42318"}"><title>${html(title)}</title></rect>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 70" data-axis-end-ms="${end}" role="img" aria-label="${html(label)}"><title>${html(label)}</title><line x1="40" x2="760" y1="50" y2="50" stroke="#aab6c6"/>${tail}${bars}<text x="40" y="66">0</text><text x="760" y="66" text-anchor="end">${duration(end)}</text></svg>`;
}

type CurveMetric = { key: string; label: string; value: (request: AnalysisRequest) => number | null; cost?: boolean };

const curveMetrics: CurveMetric[] = [
  { key: "cost", label: "Static cost (USD)", value: (request) => request.cost_usd, cost: true },
  { key: "input", label: "Input tokens", value: (request) => request.input_tokens },
  { key: "cached-input", label: "Cached input tokens", value: (request) => request.cached_input_tokens },
  { key: "uncached-input", label: "Uncached input tokens", value: (request) => request.input_tokens === null || request.cached_input_tokens === null ? null : request.input_tokens - request.cached_input_tokens },
  { key: "output", label: "Output tokens", value: (request) => request.output_tokens },
];

function cumulativeCurve(attempt: AnalysisAttempt, metric: CurveMetric, label: string): string {
  // Responses can finish out of request-start order, so observations accrue at completion.
  const requests = attempt.requests.filter((request) => metric.cost || request.successful)
    .sort((a, b) => a.t_end_ms - b.t_end_ms || a.seq - b.seq);
  const observations = requests.map((request) => ({ request, value: metric.value(request) }));
  const known = observations.filter((observation) => observation.value !== null);
  const missing = observations.length - known.length;
  const total = known.length === 0 ? null : known.reduce((sum, observation) => sum + observation.value!, 0);
  const end = requestAxisEnd(attempt);
  const x = (time: number) => (40 + time / (end === 0 ? 1 : end) * 720).toFixed(2);
  const y = (value: number) => (50 - value / (total === null || total === 0 ? 1 : total) * 32).toFixed(2);
  const totalLabel = total === null ? "unavailable" : `${metric.cost ? "$" : ""}${number(total)}`;
  const scope = metric.cost ? "calls" : "successful calls";
  const status = `${missing > 0 ? "Known cumulative subtotal" : "Cumulative total"}: ${totalLabel}; available ${scope}: ${known.length}; missing ${scope}: ${missing}.`;
  let cumulative = 0;
  const points = ["40,50"];
  const markers: string[] = [];
  for (const { request, value } of observations) {
    if (value === null) {
      markers.push(`<line data-missing-seq="${request.seq}" x1="${x(request.t_end_ms)}" x2="${x(request.t_end_ms)}" y1="12" y2="52" stroke="#b42318" stroke-dasharray="3 2"><title>seq ${request.seq}: ${html(metric.label)} unavailable at ${duration(request.t_end_ms)}</title></line>`);
      continue;
    }
    points.push(`${x(request.t_end_ms)},${y(cumulative)}`);
    cumulative += value;
    points.push(`${x(request.t_end_ms)},${y(cumulative)}`);
    markers.push(`<circle data-completed-seq="${request.seq}" cx="${x(request.t_end_ms)}" cy="${y(cumulative)}" r="2"><title>seq ${request.seq}: known cumulative ${html(metric.label)} ${number(cumulative)} at ${duration(request.t_end_ms)}</title></circle>`);
  }
  points.push(`${x(end)},${y(cumulative)}`);
  const line = total === null ? "" : `<polyline fill="none" stroke="#2763ad" stroke-width="2" points="${points.join(" ")}"/>`;
  return `<figure data-series="${metric.key}"><figcaption>${html(metric.label)} — ${html(status)}</figcaption><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 70" data-axis-end-ms="${end}" data-total="${total ?? "null"}" role="img" aria-label="${html(`${label} ${metric.label}: ${status}`)}"><title>${html(`${metric.label}: ${status}`)}</title><line x1="40" x2="760" y1="50" y2="50" stroke="#aab6c6"/>${line}${markers.join("")}<text x="40" y="66">0</text><text x="760" y="66" text-anchor="end">${duration(end)}</text></svg></figure>`;
}

function annotatedSection(data: AnalysisExport, attempts: AnalysisAttempt[]): string {
  const items = data.annotated_runs.map((item) => {
    const attempt = attempts.find((row) => row.run_id === item.run_id);
    if (attempt === undefined) return "";
    const label = `${attempt.run_id} · ${item.reason}`;
    return `<article data-outcome="${html(attempt.outcome)}"><h4>${html(attempt.run_id)}</h4><p>${html(item.reason)}. ${html(attempt.harness)} @ ${html(attempt.version)} · ${html(attempt.task)} · ${outcome(attempt.outcome)}. Calls ${attempt.request_summary.n} (${attempt.request_summary.n_success} successful, ${attempt.request_summary.n_error} failed). Median duration ${duration(attempt.request_summary.median_duration_ms)}; largest gap ${duration(attempt.request_summary.largest_gap_before_ms)}; time after last ${duration(attempt.request_summary.time_after_last_ms)}.</p><figure data-series="requests"><figcaption>Model-request intervals; gray area = after last model response</figcaption>${requestTimeline(attempt, label)}</figure>${curveMetrics.map((metric) => cumulativeCurve(attempt, metric, label)).join("")}</article>`;
  }).filter(Boolean).join("");
  return items.length === 0 ? "" : `<h3>Annotated request timelines</h3><p>Deterministic exemplars from this export, not a ranking. Blue bars are successful model calls; red bars are unsuccessful ones. Gray marks time after the latest response through reconciled adapter end. Every curve uses the full timeline, with observations added in response-completion order. Dashed red markers identify missing per-call observations; a flat known subtotal across a marker does not mean zero usage or cost.</p><p>Successful-response usage only: input, cached input, uncached input and output trajectories exclude unsuccessful calls. Missing successful usage remains unavailable; curves show only known subtotals when incomplete. Static costs use known per-call estimates and identify every missing call cost.</p>${items}`;
}

const filterScript = `
const populationFilter = document.getElementById('population-filter');
const outcomeFilter = document.getElementById('outcome-filter');
function applyFilters() {
  for (const section of document.querySelectorAll('[data-population]')) {
    section.hidden = populationFilter.value !== 'all' && section.dataset.population !== populationFilter.value;
  }
  for (const row of document.querySelectorAll('[data-outcome]')) {
    row.hidden = outcomeFilter.value !== 'all' && row.dataset.outcome !== outcomeFilter.value;
  }
}
populationFilter.addEventListener('change', applyFilters);
outcomeFilter.addEventListener('change', applyFilters);
applyFilters();
const overviewSort = document.getElementById('overview-sort');
function sortOverview() {
  const key = overviewSort.value;
  for (const container of document.querySelectorAll('.overview-rows')) {
    const rows = Array.from(container.children);
    rows.sort((a, b) => {
      if (key === 'name') return a.dataset.name.localeCompare(b.dataset.name);
      const left = a.dataset[key], right = b.dataset[key];
      if (left === '' || right === '') return left === right ? a.dataset.name.localeCompare(b.dataset.name) : left === '' ? 1 : -1;
      return (Number(left) - Number(right)) * (key === 'pass' || key === 'cache' ? -1 : 1) || a.dataset.name.localeCompare(b.dataset.name);
    });
    for (const row of rows) container.appendChild(row);
  }
}
overviewSort.addEventListener('change', sortOverview);
`;

export function renderAnalysisHtml(data: AnalysisExport): string {
  const populations = data.populations.map((population, index) => {
    const attempts = populationAttempts(data, population);
    const comparisonOverview: Table = {
      headers: ["Left", "Right", "Common tasks", "Left median of task medians", "Right median of task medians", "Median task ratio (right / left)"],
      rows: population.comparisons.map((pair) => [pair.left, pair.right, String(pair.tasks.length), duration(pair.left_ms), duration(pair.right_ms), number(pair.median_task_ratio)]),
    };
    const comparisons = population.comparisons.length === 0 ? "<p>No cross-harness pairs in this population.</p>" :
      `<h4>Comparison overview</h4>${htmlTable(comparisonOverview)}<p>Descriptive common-success-task comparisons. Open a pair for task names and per-side sample counts. A zero common-task count means no comparison is available.</p>` + population.comparisons.map((pair) =>
        `<details><summary>${html(pair.left)} (left) vs ${html(pair.right)} (right) · ${pair.tasks.length} common tasks</summary><p>${html(comparisonSummary(pair, true))}</p>${pair.tasks.length === 0 ? "<p>No common successful tasks; comparison unavailable.</p>" : htmlTable(comparisonTable(pair, true))}</details>`).join("");
    const distributions = population.distributions.map((row) => `<div data-outcome="${html(row.outcome)}"><details><summary>${html(row.task)} · ${html(row.harness)} @ ${html(row.version)} · ${outcome(row.outcome)} · selected ${row.attempts.length}, timing n=${row.metrics.end_to_end.n}, missing=${row.metrics.end_to_end.missing}, median ${duration(row.metrics.end_to_end.median)}</summary><p class="identity">Task identity: ${html(row.task_key)}</p>${htmlTable(distributionTable(row, true))}</details></div>`).join("");
    return `<section class="population" data-population="${index}"><h2>Population ${index + 1}: ${html(population.model)} · ${html(population.host.os)}</h2>${overviewHtml(attempts)}<details><summary>Recorded population identity</summary><dl>${identity(population).map(([name, value]) => `<dt>${html(name)}</dt><dd>${html(value)}</dd>`).join("")}</dl></details><details class="secondary-details"><summary>Explore timing, outcomes and request evidence</summary><h3>Coverage</h3><p>All selected outcomes; these denominators remain visible when outcome filters are applied.</p>${htmlTable(coverage(attempts, population.distributions))}<h3>Selected spend by outcome</h3>${htmlTable(outcomeCosts(attempts))}<h3>Request-level summaries</h3>${htmlTable(requestCoverage(attempts))}<h3>Common successful tasks</h3>${comparisons}<details><summary>Individual run timings</summary>${timingDots(attempts, population.distributions)}</details><h3>Per-task outcome distributions</h3>${distributions}${annotatedSection(data, attempts)}</details></section>`;
  }).join("\n");
  const options = data.populations.map((population, index) => `<option value="${index}">Population ${index + 1}: ${html(population.model)} · ${html(population.price_book)} · ${html(population.host.os)} · ${html(population.condition)}</option>`).join("");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Selected-attempt analysis</title><style>
body{font:15px/1.5 system-ui,sans-serif;color:#182639;background:#f6f8fb;margin:0}main{max-width:1200px;margin:auto;padding:2rem}h1,h2,h3{line-height:1.2}section{margin:2rem 0;padding:1.5rem;background:white;border:1px solid #dce2ec;border-radius:12px}table{border-collapse:collapse;width:100%;font-size:.88rem}th,td{text-align:left;padding:.5rem;border-bottom:1px solid #dce2ec;white-space:nowrap}th{background:#edf2f8}.table-scroll{overflow:auto;margin:1rem 0}details{margin:.8rem 0;padding:.6rem;border:1px solid #dce2ec;border-radius:6px}summary{cursor:pointer;font-weight:600}dl{display:grid;grid-template-columns:minmax(120px,1fr) 3fr;gap:.3rem 1rem}dt{font-weight:600}dd{margin:0;overflow-wrap:anywhere}.identity{overflow-wrap:anywhere}figure{margin:1rem 0}figcaption{font-size:.85rem}svg{display:block;width:100%;max-height:100px}circle{fill:#2763ad;stroke:white;stroke-width:1}circle:focus{stroke:#111;stroke-width:3}svg text{font-size:12px;fill:#48566a}.filters{display:flex;flex-wrap:wrap;gap:1rem;margin:1rem 0}select{font:inherit;max-width:100%;padding:.3rem}[hidden]{display:none!important}article{border-left:3px solid #dce2ec;padding-left:1rem}@media(max-width:600px){main{padding:1rem}section{padding:.7rem}dl{display:block}dd{margin-bottom:.5rem}}

body{background:#f7f7f2;color:#18232b}main{max-width:1400px}h1{font-size:clamp(2rem,4vw,3.8rem);letter-spacing:-.045em;margin:.3em 0}.eyebrow{font:700 .72rem ui-monospace,monospace;letter-spacing:.14em;color:#52645d}.intro{font-size:1.15rem;color:#52645d}.population{border-radius:4px;padding:1.6rem}.population h2{font-size:1.1rem;color:#52645d}.overview-heading{display:flex;align-items:center;justify-content:space-between;gap:1rem}.overview-heading h3{font-size:1.7rem;margin:.6rem 0}.snapshot-label{font-size:.75rem;background:#edf2ec;padding:.3rem .6rem;border-radius:3px}.overview-note{font-size:.82rem;color:#59665f}.overview-row{display:grid;grid-template-columns:minmax(150px,1.35fr) repeat(5,minmax(0,1fr));gap:1.2rem;padding:1.5rem 0;border-top:1px solid #e0e4dc}.harness-label{display:flex;flex-direction:column;gap:.25rem;overflow-wrap:anywhere}.harness-label>strong{font-size:1.2rem}.harness-label>span{font-size:.72rem;color:#59665f}.primary-metric{display:flex;flex-direction:column;gap:.4rem;min-width:0}.metric-label{font-size:.72rem;color:#59665f}.primary-metric>strong{font:600 clamp(.95rem,1.6vw,1.35rem) ui-monospace,monospace;letter-spacing:-.05em;overflow-wrap:anywhere}.primary-metric small,.harness-label small{font-size:.69rem;color:#59665f}.metric-track{display:block;height:5px;background:#edf0ea;border-radius:2px;overflow:hidden}.metric-track>span{display:block;height:100%;background:#397763}[data-metric=cost] .metric-track>span{background:#c97a36}[data-metric=cache] .metric-track>span{background:#528397}[data-metric=input] .metric-track>span,[data-metric=output] .metric-track>span{background:#7974a7}.secondary-details{margin-top:1.8rem}select{border:1px solid #cbd4c9;border-radius:4px;background:white;padding:.5rem}.filters label{font-size:.8rem;display:flex;flex-direction:column;gap:.3rem;min-width:0}.filters{align-items:end}:focus-visible{outline:2px solid #397763;outline-offset:3px}@media(max-width:900px){.overview-row{grid-template-columns:repeat(3,minmax(0,1fr))}.harness-label{grid-column:1/-1}}@media(max-width:600px){.overview-row{grid-template-columns:repeat(2,minmax(0,1fr));gap:1.2rem}.population{padding:1rem}.overview-heading{align-items:flex-start;flex-direction:column;gap:0}.primary-metric>strong{font-size:1.4rem}.filters{display:grid;grid-template-columns:minmax(0,1fr)}main{padding:.7rem}}
</style></head><body><main><p class="eyebrow">AGENT OVERHEAD BENCH / CAMPAIGN SNAPSHOT</p><h1>Every attempt, at a glance.</h1><p class="intro">Pass rate. Cost. Cache. Tokens. Explore the measurements behind each harness.</p><p>Selected attempts: ${data.attempts.length}. Populations: ${data.populations.length}.</p><div class="filters"><label>Population <select id="population-filter"><option value="all">All populations</option>${options}</select></label><label>Sort overview <select id="overview-sort"><option value="name">Harness name</option><option value="pass">Pass rate · high to low</option><option value="cost">Cost · low to high</option><option value="cache">Cache rate · high to low</option><option value="input">Input tokens · low to high</option><option value="output">Output tokens · low to high</option></select></label><label>Outcome distributions and dots <select id="outcome-filter"><option value="all">All outcomes</option><option value="completed">Pass</option><option value="verify_error">Verification failure</option><option value="timeout">Timeout</option><option value="adapter_error">Adapter error</option></select></label></div>${data.attempts.length === 0 ? "<p>No selected attempts.</p>" : ""}${populations}<details><summary>How to read this analysis</summary>${[...explanation, ...data.notes].map((note) => `<p>${html(note)}</p>`).join("")}</details></main><script>${filterScript}</script></body></html>\n`;
}
