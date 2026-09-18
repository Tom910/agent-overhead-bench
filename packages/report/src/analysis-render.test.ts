import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { analyzeAttempts, type AnalysisAttempt } from "./analysis.js";
import { emptyRequestSummary, summarizeRequests, type AnalysisRequest } from "./request-analysis.js";
import { renderAnalysisHtml, renderAnalysisMarkdown } from "./analysis-render.js";

function attempt(id: string, harness: string, ms: number, extra: Partial<AnalysisAttempt> = {}): AnalysisAttempt {
  return {
    run_id: id, harness, version: "v1", task: "shared", rep: 0, outcome: "completed",
    host: { os: "linux", cpu: "example-cpu", ram_gb: 16 }, condition: "pinned", model: "mock-model",
    price_book: "fixture-book", source: { repository: "https://example.test/repo", name: "fixture", revision: "revision-one" },
    regime: "short", routing: { ignored_providers: ["excluded"], only_provider: "selected", allow_fallbacks: false },
    configuration: "fixture-config", ori_version: "ori-1", task_base_revision: "base-1", verifier_image: "verifier-1", environment: "fixture-env",
    started_iso: "2026-09-14T00:00:00.000Z", visibility: "partial", hashes: { run: "run-hash", events: "events-hash" },
    timing: { end_to_end: ms, startup: 1, model_time: ms - 2, non_model_time: 1, tool_time: null, harness_time: null,
      parallelism: 1, first_byte_ms: 1, sum_request_durations: ms - 2, unreconciled: false },
    timing_unavailable: null, turns: 3, input_tokens: 100, output_tokens: 20, cached_percent: 50,
    usage_unavailable: null, cost_usd: 0.2, token_floor_usd: 0.3, cost_unavailable: null,
    requests: [], request_summary: emptyRequestSummary(), ...extra,
  };
}

describe("analysis views", () => {
  it("leads with five primary metrics and keeps partial coverage next to the values", () => {
    const data = analyzeAttempts([
      attempt("pass", "alpha", 100, { cost_usd: 1, input_tokens: 1000000 }),
      attempt("fail", "alpha", 200, { rep: 1, outcome: "verify_error", cost_usd: null, input_tokens: 3000000 }),
    ]);
    const rendered = renderAnalysisHtml(data);
    expect(rendered).toContain('class="metric-overview"');
    expect(rendered).toContain("50.0%");
    expect(rendered).toContain("2.00M");
    expect(rendered).toContain("1/2 measured · partial");
    expect(rendered).toContain("Tokens out");
    expect(rendered.indexOf('class="metric-overview"')).toBeLessThan(rendered.indexOf("<h3>Coverage</h3>"));
    const markdown = renderAnalysisMarkdown(data);
    expect(markdown.indexOf("### At a glance")).toBeLessThan(markdown.indexOf("### Coverage"));
    expect(markdown).toContain("Median cost / attempt");
  });
  it("shows selected coverage and each distribution's actual denominators", () => {
    const data = analyzeAttempts([
      attempt("good", "alpha", 100),
      attempt("missing", "alpha", 200, { rep: 1, timing: null, timing_unavailable: "unreconciled", cost_usd: null,
        input_tokens: null, output_tokens: null, cached_percent: null, cost_unavailable: "incomplete-usage", usage_unavailable: "incomplete-usage" }),
      attempt("failed", "alpha", 300, { rep: 2, outcome: "verify_error" }),
      attempt("timeout", "alpha", 400, { rep: 3, outcome: "timeout" }),
    ]);
    const md = renderAnalysisMarkdown(data);
    expect(md).toContain("Selected attempts: 4");
    expect(md).toMatch(/\| alpha @ v1 \| 4 \| 2 \| 1 \| 1 \| 1 \| 3 \| 1 \| 4 \| 3 \| 3 \| 3 \| 3 \|/);
    expect(md).toContain("| End-to-end (ms) | 1 | 1 | 100 | unavailable | unavailable | 100 | 100 |");
    expect(md).toContain("| Static cost (USD) | 1 | 1 | 0.2 | unavailable | unavailable | 0.2 | 0.2 |");
    expect(md).toContain("Verification failure (verify_error)");
    expect(md).toContain("Other (timeout)");
    const html = renderAnalysisHtml(data);
    expect(html).toContain("<details>");
    expect(html).toContain("Valid n");
    expect(html).toContain("Missing n");
    expect(html).toContain("unavailable");
  });

  it("keeps population identities and timing points isolated", () => {
    const data = analyzeAttempts([
      attempt("linux-a", "alpha", 100), attempt("linux-b", "beta", 200),
      attempt("other-host", "alpha", 900, { host: { os: "other-os", cpu: "other-cpu", ram_gb: 32 } }),
    ]);
    const html = renderAnalysisHtml(data);
    const sections = [...html.matchAll(/<section class="population"[^>]*>([\s\S]*?)<\/section>/g)].map((match) => match[1]!);
    expect(sections).toHaveLength(2);
    const linux = sections.find((section) => section.includes("example-cpu"))!;
    expect(linux).toContain('data-run-id="linux-a"');
    expect(linux).toContain('data-run-id="linux-b"');
    expect(linux).not.toContain('data-run-id="other-host"');
    for (const value of ["mock-model", "fixture-book", "https://example.test/repo", "revision-one", "excluded", "selected", "false", "fixture-config", "ori-1"]) {
      expect(linux).toContain(value);
    }
  });

  it("labels common task medians and ratios with per-side sample counts and unmatched pairs", () => {
    const data = analyzeAttempts([
      attempt("a1", "alpha", 100), attempt("a2", "alpha", 300, { rep: 1 }), attempt("b", "beta", 400),
      attempt("c", "gamma", 50, { task: "different" }),
    ]);
    const md = renderAnalysisMarkdown(data);
    expect(md).toContain("| shared | 2 | 200 | 1 | 400 | 2 |");
    expect(md).toContain("Median task ratio (right / left): 2");
    expect(md).toContain("No common successful tasks");
    expect(md).toContain("alpha @ v1");
    expect(md).toContain("beta @ v1");
  });

  it("renders exactly one timing dot for each eligible run including failures", () => {
    const data = analyzeAttempts([
      attempt("pass-1", "alpha", 100), attempt("pass-2", "alpha", 100, { rep: 1 }),
      attempt("failure", "alpha", 200, { rep: 2, outcome: "verify_error" }),
      attempt("no-time", "alpha", 300, { rep: 3, timing: null, timing_unavailable: "unreconciled" }),
    ]);
    const html = renderAnalysisHtml(data);
    expect([...html.matchAll(/<circle\b/g)]).toHaveLength(3);
    expect(html).toMatch(/data-run-id="pass-1"[^>]*><title>[^<]*pass-1[^<]*completed[^<]*100 ms/);
    expect(html).toMatch(/data-run-id="failure"[^>]*><title>[^<]*failure[^<]*verify_error[^<]*200 ms/);
    expect(html).not.toContain('data-run-id="no-time"');
  });

  it("escapes untrusted text in HTML, SVG and Markdown without injecting scripts or table rows", () => {
    const attack = '</script><img src=x onerror="bad()">|\n# injected';
    const data = analyzeAttempts([attempt(attack, attack, 100, { task: attack, model: attack })]);
    data.notes.push(attack);
    const html = renderAnalysisHtml(data);
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
    expect([...html.matchAll(/<script>/g)]).toHaveLength(1);
    expect(html).not.toMatch(/<script[^>]+src=|<link[^>]+href=/);
    const md = renderAnalysisMarkdown(data);
    expect(md).not.toContain("<img");
    expect(md).not.toContain("\n# injected");
    expect(md).toContain("&#124;");
  });

  it("renders empty exports and all-unavailable timings explicitly", () => {
    expect(renderAnalysisMarkdown(analyzeAttempts([]))).toContain("No selected attempts");
    const html = renderAnalysisHtml(analyzeAttempts([attempt("missing", "alpha", 1, { timing: null, timing_unavailable: "unreconciled" })]));
    expect(html).toContain("No eligible timing observations");
    expect(html).not.toContain("<circle");
  });

  it("labels partially priced failure spend as a known subtotal and counts measurable IQR tasks", () => {
    const data = analyzeAttempts([
      attempt("p1", "alpha", 100), attempt("p2", "alpha", 200, { rep: 1 }),
      attempt("single", "alpha", 300, { task: "singleton" }),
      attempt("fail-priced", "alpha", 100, { rep: 2, outcome: "verify_error", cost_usd: 0.125 }),
      attempt("fail-unknown", "alpha", 100, { rep: 3, outcome: "verify_error", cost_usd: null, cost_unavailable: "incomplete-accounting" }),
    ]);
    const md = renderAnalysisMarkdown(data);
    expect(md).toContain("IQR tasks / successful timing tasks");
    expect(md).toContain("| 1 / 2 |");
    expect(md).toContain("| alpha @ v1 | Verification failure (verify\\_error) | 2 | 1 | 1 | Known subtotal: 0.125 |");
    const html = renderAnalysisHtml(data);
    expect(html).toContain("Known subtotal: 0.125");
    expect(html).toMatch(/<tr data-outcome="verify_error">/);
  });

  it("shows readable long durations and distinguishes same-host price books in population choices", () => {
    const data = analyzeAttempts([
      attempt("first", "alpha", 743360, { price_book: "price-a" }),
      attempt("second", "alpha", 743360, { price_book: "price-b" }),
    ]);
    const html = renderAnalysisHtml(data);
    expect(html).toContain("12m 23.36s");
    expect(html).toMatch(/<option value="0">[^<]*price-a/);
    expect(html).toMatch(/<option value="1">[^<]*price-b/);
  });

  it("shows pairwise overview while leaving per-task pair details collapsed", () => {
    const html = renderAnalysisHtml(analyzeAttempts([attempt("a", "alpha", 100), attempt("b", "beta", 200)]));
    expect(html).toContain("Comparison overview");
    expect(html).toMatch(/<tr><td>alpha @ v1<\/td><td>beta @ v1<\/td><td>1<\/td><td>100 ms<\/td><td>200 ms<\/td><td>2<\/td><\/tr>/);
    expect(html).toMatch(/<details><summary>alpha @ v1 \(left\) vs beta @ v1 \(right\)[^<]*<\/summary>[\s\S]*?Common successful task/);
  });

  it("applies local population and outcome filter changes to rendered sections and rows", () => {
    const html = renderAnalysisHtml(analyzeAttempts([
      attempt("pass", "alpha", 100), attempt("failed", "alpha", 200, { rep: 1, outcome: "verify_error" }),
      attempt("other", "alpha", 300, { price_book: "other-book" }),
    ]));
    const script = html.match(/<script>([\s\S]*?)<\/script>/)![1]!;
    const populationRows = [...html.matchAll(/data-population="(\d+)"/g)].map((match) => ({ hidden: false, dataset: { population: match[1] } }));
    const outcomeRows = [...html.matchAll(/data-outcome="([^"]+)"/g)].map((match) => ({ hidden: false, dataset: { outcome: match[1] } }));
    const listeners: Array<() => void> = [];
    const control = () => ({ value: "all", addEventListener: (_event: string, listener: () => void) => listeners.push(listener) });
    const population = control();
    const outcome = control();
    runInNewContext(script, { document: {
      getElementById: (id: string) => id === "population-filter" ? population : outcome,
      querySelectorAll: (selector: string) => selector === "[data-population]" ? populationRows : selector === "[data-outcome]" ? outcomeRows : [],
    } });
    expect(populationRows.every((row) => !row.hidden)).toBe(true);
    population.value = "1";
    outcome.value = "verify_error";
    listeners.forEach((listener) => listener());
    expect(populationRows.map((row) => row.hidden)).toEqual([true, false]);
    expect(outcomeRows.filter((row) => !row.hidden).every((row) => row.dataset.outcome === "verify_error")).toBe(true);
    expect(outcomeRows.some((row) => row.hidden)).toBe(true);
    outcome.value = "all";
    listeners.forEach((listener) => listener());
    expect(outcomeRows.every((row) => !row.hidden)).toBe(true);
  });

  it("sorts overview values at full precision with unknowns last and preserves separate populations", () => {
    const rendered = renderAnalysisHtml(analyzeAttempts([attempt("a", "alpha", 100)]));
    const script = rendered.match(/<script>([\s\S]*?)<\/script>/)![1]!;
    const listeners = new Map<string, () => void>();
    const controls = Object.fromEntries(["population-filter", "outcome-filter", "overview-sort"].map((id) => [id, {
      value: id === "overview-sort" ? "name" : "all",
      addEventListener: (_event: string, listener: () => void) => listeners.set(id, listener),
    }]));
    const a = { dataset: { name: "alpha", cost: "0.10004", pass: "50" } };
    const b = { dataset: { name: "beta", cost: "0.10001", pass: "75" } };
    const unknown = { dataset: { name: "missing", cost: "", pass: "0" } };
    const zero = { dataset: { name: "zero", cost: "0", pass: "0" } };
    const container = (children: typeof a[]) => ({ children, appendChild(row: typeof a) {
      this.children = this.children.filter((item) => item !== row).concat(row);
    } });
    const first = container([unknown, a, b, zero]);
    const second = container([{ dataset: { name: "other", cost: "0.001", pass: "100" } }]);
    runInNewContext(script, { document: {
      getElementById: (id: string) => controls[id],
      querySelectorAll: (selector: string) => selector === ".overview-rows" ? [first, second] : [],
    } });
    controls["overview-sort"]!.value = "cost";
    listeners.get("overview-sort")!();
    expect(first.children.map((row) => row.dataset.name)).toEqual(["zero", "beta", "alpha", "missing"]);
    expect(second.children.map((row) => row.dataset.name)).toEqual(["other"]);
    controls["overview-sort"]!.value = "pass";
    listeners.get("overview-sort")!();
    expect(first.children.slice(0, 2).map((row) => row.dataset.name)).toEqual(["beta", "alpha"]);
  });
});

function request(seq: number, start: number, end: number, extra: Partial<AnalysisRequest> = {}): AnalysisRequest {
  return { seq, t_start_ms: start, t_end_ms: end, duration_ms: end - start, wait_ms: 1, transfer_ms: end - start - 1,
    gap_before_ms: seq === 0 ? null : 0, status: 200, streamed: true, successful: true,
    input_tokens: 10, cached_input_tokens: 4, output_tokens: 2, cost_usd: 0.1, token_floor_usd: 0.2, ...extra };
}

function annotated(requests: AnalysisRequest[], end = 100) {
  const row = attempt("annotated", "alpha", end + 1, { requests, request_summary: summarizeRequests(requests, end, 0) });
  const data = analyzeAttempts([row]);
  data.annotated_runs = [{ run_id: row.run_id, reason: "controlled exemplar" }];
  return data;
}

describe("request analysis views", () => {
  it("uses interpolated even-run medians with metric-specific available and missing counts", () => {
    const data = analyzeAttempts([
      attempt("a", "alpha", 100, { request_summary: { ...emptyRequestSummary(), n: 87, median_wait_ms: 10 } }),
      attempt("b", "alpha", 100, { rep: 1, request_summary: { ...emptyRequestSummary(), n: 93 } }),
    ]);
    const md = renderAnalysisMarkdown(data);
    expect(md).toContain("90 (available n=2; missing n=0)");
    expect(md).toContain("10 ms (available n=1; missing n=1)");
    expect(md).toContain("unavailable (available n=0; missing n=2)");
  });

  it("shows partially known costs as subtotals, marks missing calls and preserves completion order and full axis", () => {
    const data = annotated([request(0, 0, 40, { cost_usd: 0.2 }), request(1, 10, 20, { cost_usd: 0.1 }), request(2, 50, 80, { cost_usd: null })]);
    const html = renderAnalysisHtml(data);
    const cost = html.match(/<figure data-series="cost">([\s\S]*?)<\/figure>/)?.[1];
    expect(cost).toBeDefined();
    expect(cost).toContain("Known cumulative subtotal: $0.3");
    expect(cost).toContain("missing calls: 1");
    expect(cost).toContain('data-missing-seq="2"');
    expect(cost).toContain('data-axis-end-ms="100"');
    const completions = [...cost!.matchAll(/data-completed-seq="(\d+)"/g)].map((match) => Number(match[1]));
    expect(completions).toEqual([1, 0]);
    expect(cost).toMatch(/data-missing-seq="2"[^>]*x1="616.00"/);
  });

  it("keeps an all-zero cost curve at zero", () => {
    const html = renderAnalysisHtml(annotated([request(0, 0, 20, { cost_usd: 0 })]));
    const cost = html.match(/<figure data-series="cost">([\s\S]*?)<\/figure>/)?.[1];
    expect(cost).toContain("Cumulative total: $0");
    expect(cost).toContain('data-total="0"');
    expect(cost).not.toContain("1e-9");
    expect(cost).toMatch(/data-completed-seq="0"[^>]*cy="50.00"/);
  });

  it("renders all token trajectories on successful-response usage with missing-success markers", () => {
    const html = renderAnalysisHtml(annotated([
      request(0, 0, 20), request(1, 20, 40, { successful: false, status: 500, input_tokens: 999, cached_input_tokens: 999, output_tokens: 999 }),
      request(2, 50, 60, { input_tokens: null, cached_input_tokens: null, output_tokens: null }),
    ]));
    expect(html).toContain("Successful-response usage only");
    for (const [series, total] of [["input", 10], ["cached-input", 4], ["uncached-input", 6], ["output", 2]] as const) {
      const curve = html.match(new RegExp(`<figure data-series="${series}">([\\s\\S]*?)<\\/figure>`))?.[1];
      expect(curve).toContain(`data-total="${total}"`);
      expect(curve).toContain("Known cumulative subtotal");
      expect(curve).toContain("missing successful calls: 1");
      expect(curve).toContain('data-missing-seq="2"');
      expect(curve).not.toContain('data-completed-seq="1"');
    }
  });

  it("renders request distributions with unavailable denominators and includes largest gaps", () => {
    const data = analyzeAttempts([attempt("a", "alpha", 100)]);
    const md = renderAnalysisMarkdown(data);
    expect(md).toContain("| Model request count | 1 | 0 | 0 |");
    expect(md).toContain("| Within-run median request wait (ms) | 0 | 1 | unavailable |");
    expect(md).toContain("| Largest inter-request gap (ms) | 0 | 1 | unavailable |");
  });

  it("extends request timeline to adapter end and visibly separates the tail", () => {
    const html = renderAnalysisHtml(annotated([request(0, 0, 20)]));
    const timeline = html.match(/<figure data-series="requests">([\s\S]*?)<\/figure>/)?.[1];
    expect(timeline).toContain('data-axis-end-ms="100"');
    expect(timeline).toContain('data-tail-ms="80"');
    expect(timeline).toMatch(/data-tail-ms="80"[^>]*x="184.00"[^>]*width="576.00"/);
    expect(timeline).toContain("After last model response");
  });
});
