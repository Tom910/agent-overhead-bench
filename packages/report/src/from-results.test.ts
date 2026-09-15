import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import * as fs from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { ConfigError, PRE_INFERENCE_REJECTION_DETAIL } from "@aob/contracts";
import { generateReport, loadResultsTree, reviewAnomalies } from "./from-results.js";
import { deriveFromC1 } from "./derive.js";
import { copySanitizedResults } from "./freeze.js";

vi.mock("node:fs", async (importOriginal) => ({ ...await importOriginal<typeof import("node:fs")>() }));

it("separates routing policies in report medians and outlier baselines", () => {
  const root = mkdtempSync(join(tmpdir(),"aob-routing-report-"));
  try {
    const results = join(root,"results");
    for (let rep=0;rep<4;rep++) writeCell(results,`r${rep}`,"completed",false,{rep,tEnd:rep===3?50000:12500});
    const path = join(results,"r3/run.json");
    const run = JSON.parse(readFileSync(path,"utf8")); run.provider_routing={ignored_providers:["relace"]};
    writeFileSync(path,JSON.stringify(run));
    const report = generateReport(results,join(root,"report"));
    expect(report.markdown.match(/## Condition:/g)).toHaveLength(2);
    expect(report.markdown).toContain("excluded providers: relace");
    expect(report.markdown).toContain("excluded providers: none");
    expect(reviewAnomalies(loadResultsTree(results))).toEqual([]);
  } finally { rmSync(root,{recursive:true,force:true}); }
});

it("labels each pinned endpoint separately", () => {
  const root = mkdtempSync(join(tmpdir(),"aob-pin-report-"));
  try {
    const results = join(root,"results");
    for (const [rep,pin] of ["z-ai/fp8","gmicloud/fp8"].entries()) {
      writeCell(results,`r${rep}`,"completed",false,{rep});
      const path = join(results,`r${rep}/run.json`);
      const run = JSON.parse(readFileSync(path,"utf8"));
      run.provider_routing={ignored_providers:["relace"],only_provider:pin,allow_fallbacks:false};
      writeFileSync(path,JSON.stringify(run));
    }
    const report = generateReport(results,join(root,"report"));
    expect(report.markdown.match(/## Condition:/g)).toHaveLength(2);
    expect(report.markdown).toContain("only provider: z-ai/fp8; fallbacks: disabled");
    expect(report.markdown).toContain("only provider: gmicloud/fp8; fallbacks: disabled");
  } finally { rmSync(root,{recursive:true,force:true}); }
});

function writeCell(
  root: string,
  name: string,
  outcome: "completed" | "verify_error",
  toolEvents: boolean,
  overrides: { taskId?: string; taskRepository?: string; condition?: "pinned" | "default"; rep?: number; spend?: number | null; version?: string; image?: string; visibility?: "none" | "partial" | "full"; tEnd?: number; model?: string; regime?: "short" | "long" | "extended" } = {},
): void {
  const dir = join(root, name);
  mkdirSync(dir, { recursive: true });
  const toolStart = (overrides.tEnd ?? 12500) < 9200 ? 0 : 9200;
  const toolEnd = (overrides.tEnd ?? 12500) < 11000 ? Math.min(toolStart + 50, overrides.tEnd ?? 12500) : 11000;
  const run = {
    v: 1,
    run_id: name,
    tool: "tool-a",
    tool_version: overrides.version ?? "1.0.0",
    task_id: overrides.taskId ?? "t1",
    task_source: "local-development",
    task_revision: "working-tree",
    ...(overrides.taskRepository === undefined ? {} : { task_repository: overrides.taskRepository }),
    task_regime: overrides.regime ?? "short",
    condition: overrides.condition ?? "pinned",
    rep: overrides.rep ?? 0,
    model: overrides.model ?? "mock",
    ori_version: null,
    tool_visibility: overrides.visibility ?? (toolEvents ? "full" : "none"),
    anchors: {
      adapter: { wall_clock_iso: "2026-08-25T00:00:00.000Z", monotonic_zero: 0 },
      proxy: { wall_clock_iso: "2026-08-25T00:00:00.000Z", monotonic_zero: 0 },
    },
    adapter_result: {
      exitCode: 0,
      tStart: 0,
      tEnd: overrides.tEnd ?? 12500,
      anchor: { wall_clock_iso: "2026-08-25T00:00:00.000Z", monotonic_zero: 0 },
      artifacts: { stdoutPath: "stdout.log", stderrPath: "stderr.log" },
      ...(toolEvents ? { toolEvents: [{ tStart: toolStart, tEnd: toolEnd, kind: "shell" }] } : {}),
    },
    events_file: "events.jsonl",
    verification: { exit: outcome === "completed" ? 0 : 1, duration_ms: 1, logPath: "verify.log" },
    container: { image_digest: overrides.image ?? "host", verifier_image_digest: overrides.image ?? "host", started_iso: "2026-08-25T00:00:00.000Z" }, task_environment: { kind: "runner-default", network: "disabled" },
    host: { os: "linux", cpu: "x86_64", ram_gb: 16 },
    spend_usd_estimate: overrides.spend === undefined ? 0 : overrides.spend,
    price_book: "openrouter-2026-08-27",
    outcome,
  };
  writeFileSync(join(dir, "run.json"), JSON.stringify(run));
  writeFileSync(join(dir, "stdout.log"), "stdout\n");
  writeFileSync(join(dir, "stderr.log"), "stderr\n");
  writeFileSync(join(dir, "verify.log"), "verify\n");
  const events = [
    {
      v: 1,
      run_id: name,
      seq: 0,
      t_req_start: 2500,
      t_req_body_end: 2500,
      t_upstream_sent: 2500,
      t_first_byte: 2600,
      t_last_byte: 9000,
      duration_ms: 6500,
      method: "POST",
      path: "/v1/chat/completions",
      protocol: "openai_chat",
      model_requested: "m",
      model_served: "m",
      status: 200,
      streamed: false,
      usage: { input: 10, cached_input: 0, output: 2, reasoning_output: 0 },
      usage_source: "response_body",
      error: null,
    },
    {
      v: 1,
      run_id: name,
      seq: 1,
      t_req_start: 4000,
      t_req_body_end: 4000,
      t_upstream_sent: 4000,
      t_first_byte: 4100,
      t_last_byte: 8000,
      duration_ms: 4000,
      method: "POST",
      path: "/v1/chat/completions",
      protocol: "openai_chat",
      model_requested: "m",
      model_served: "m",
      status: 200,
      streamed: false,
      usage: { input: 10, cached_input: 0, output: 2, reasoning_output: 0 },
      usage_source: "response_body",
      error: null,
    },
  ];
  writeFileSync(join(dir, "events.jsonl"), events.map((e) => JSON.stringify(e)).join("\n") + "\n");
}

describe("generateReport", () => {
  it("discloses batch scheduling for raw and archived campaign state", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-batch-report-"));
    try {
      const results = join(root, "results");
      writeCell(results, "one", "completed", false);
      const state = { definition_key: JSON.stringify({ executionProtocol: "tool-batches-v1" }) };
      writeFileSync(join(root, "state.json"), JSON.stringify(state));
      const caveat = "Tool-by-tool batches were measured in separate windows; provider load and time-of-day may affect comparisons.";
      expect(generateReport(results, join(root, "report")).markdown).toContain(caveat);
      rmSync(join(root, "state.json"));
      mkdirSync(join(root, "provenance"));
      writeFileSync(join(root, "provenance", "runner-state.json"), JSON.stringify(state));
      const archived = generateReport(results, join(root, "report"));
      expect(archived.markdown).toContain(caveat);
      expect(archived.html).toContain(caveat);
      rmSync(join(root, "provenance"), { recursive: true });
      expect(generateReport(results, join(root, "report")).markdown).not.toContain(caveat);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it("keeps different task repositories in separate report sections", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-repository-identity-"));
    writeCell(root, "repo-a", "completed", false, { taskId: "same-task", taskRepository: "https://example.test/one.git" });
    writeCell(root, "repo-b", "completed", false, { taskId: "same-task-b", taskRepository: "https://example.test/two.git" });
    const { markdown } = generateReport(root, join(root, "out"));
    expect(markdown).toContain("https://example.test/one.git");
    expect(markdown).toContain("https://example.test/two.git");
    expect(markdown.match(/^## Condition:/gm)).toHaveLength(2);
  });

  it("reports missing or malformed result trees as typed configuration errors", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-invalid-results-"));
    expect(() => loadResultsTree(join(root, "missing"))).toThrow(ConfigError);
    mkdirSync(join(root, "cell"));
    writeFileSync(join(root, "cell", "run.json"), "{broken");
    expect(() => loadResultsTree(root)).toThrow(ConfigError);
  });

  it("rejects completed cells without model evidence or full tool instrumentation", () => {
    const missingModel = mkdtempSync(join(tmpdir(), "aob-missing-model-"));
    writeCell(missingModel, "cell", "completed", true);
    const eventPath = join(missingModel, "cell", "events.jsonl");
    writeFileSync(eventPath, readFileSync(eventPath, "utf8")
      .replaceAll('"model_requested":"m"', '"model_requested":null')
      .replaceAll('"protocol":"openai_chat"', '"protocol":"unknown"'));
    expect(() => loadResultsTree(missingModel)).toThrow(/model-request evidence/);

    const missingTools = mkdtempSync(join(tmpdir(), "aob-missing-tools-"));
    writeCell(missingTools, "cell", "completed", false, { visibility: "full" });
    expect(() => loadResultsTree(missingTools)).toThrow(/tool instrumentation/);

    const failedOnly = mkdtempSync(join(tmpdir(), "aob-failed-only-"));
    writeCell(failedOnly, "cell", "completed", false);
    const failedOnlyPath = join(failedOnly, "cell", "events.jsonl");
    const failedOnlyEvents = readFileSync(failedOnlyPath, "utf8").trim().split("\n")
      .map((line) => JSON.parse(line) as Record<string, unknown>);
    for (const event of failedOnlyEvents) {
      event.status = 429;
      event.model_served = null;
      event.error = { kind: "upstream_http", detail: "status 429" };
    }
    writeFileSync(failedOnlyPath, `${failedOnlyEvents.map((event) => JSON.stringify(event)).join("\n")}\n`);
    expect(() => loadResultsTree(failedOnly)).toThrow(/model-request evidence/);
  });

  it("rejects a missing C4 spend when C1 events have a priced cost", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-missing-spend-"));
    writeCell(root, "missing", "completed", false, { spend: null });
    expect(() => generateReport(root, join(root, "out"))).toThrow(/spend.*unavailable|spend.*disagrees/i);
  });

  it("keeps timing for a recognized model endpoint when request-model metadata is unavailable", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-null-model-"));
    writeCell(root, "cell", "completed", false, { visibility: "none", spend: null });
    const eventPath = join(root, "cell", "events.jsonl");
    const events = readFileSync(eventPath, "utf8")
      .replaceAll('"model_requested":"m"', '"model_requested":null')
      .replaceAll('"usage":{"input":10,"cached_input":0,"output":2,"reasoning_output":0}', '"usage":null')
      .replaceAll('"usage_source":"response_body"', '"usage_source":"unavailable"');
    writeFileSync(eventPath, events);
    const cells = loadResultsTree(root);
    expect(cells).toHaveLength(1);
    expect(cells[0]?.derived.model_time).toBe(6500);
    expect(cells[0]?.derived.non_model_time).toBe(3500);
    const { markdown } = generateReport(root, join(root, "out"));
    expect(markdown).toContain("| 2 | — | — | — |");
  });

  it("keeps usage and cost for a successful endpoint when request-model metadata is unavailable", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-null-model-usage-"));
    writeCell(root, "cell", "completed", false, {
      model: "z-ai/glm-5.3-flash",
      spend: 0.0065,
      visibility: "none",
    });
    const eventPath = join(root, "cell", "events.jsonl");
    writeFileSync(eventPath, readFileSync(eventPath, "utf8")
      .replaceAll('"model_requested":"m"', '"model_requested":null')
      .replaceAll('"usage":{"input":10,"cached_input":0,"output":2,"reasoning_output":0}', '"usage":{"input":10000,"cached_input":0,"output":10000,"reasoning_output":0}'));

    const { markdown } = generateReport(root, join(root, "out"));
    // $0.0065 was previously displayed as "$0.01" by two-decimal rounding,
    // which is a 54% overstatement of a real measurement.
    expect(markdown).toContain("| 2 | 20000/20000 | 0% | $0.0065 |");
  });

  it("does not publish usage or cost from only the priced repetitions", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-partial-usage-aggregate-"));
    writeCell(root, "complete", "completed", false, { rep: 0, model: "z-ai/glm-5.3-flash", spend: 0.0000025 });
    writeCell(root, "missing", "completed", false, { rep: 1, model: "z-ai/glm-5.3-flash", spend: null });
    const eventPath = join(root, "missing", "events.jsonl");
    writeFileSync(eventPath, readFileSync(eventPath, "utf8")
      .replaceAll('"usage":{"input":10,"cached_input":0,"output":2,"reasoning_output":0}', '"usage":null')
      .replaceAll('"usage_source":"response_body"', '"usage_source":"unavailable"'));

    const { markdown } = generateReport(root, join(root, "out"));
    expect(markdown).toContain("| 2 | — | — | — |");
    expect(markdown).not.toContain("| 2 | 20/4 | 0% | $0.01 |");
  });

  it("counts failed model attempts as turns with successful-only usage and unknown total cost", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-failed-model-attempt-"));
    writeCell(root, "cell", "completed", false, { spend: null });
    const eventPath = join(root, "cell", "events.jsonl");
    const events = readFileSync(eventPath, "utf8").trim().split("\n").map((line) => JSON.parse(line) as Record<string, unknown>);
    const failed = events[0];
    if (failed === undefined) throw new Error("fixture must contain a first event");
    failed.status = 429;
    failed.model_served = null;
    failed.error = { kind: "upstream_http", detail: "status 429" };
    writeFileSync(eventPath, `${events.map((event) => JSON.stringify(event)).join("\n")}\n`);

    const cells = loadResultsTree(root);
    expect(cells[0]?.derived.model_time).toBe(6500);
    const { markdown } = generateReport(root, join(root, "out"));
    expect(markdown).toContain("| 2 | 10/2 | 0%");
  });

  it.each([false, true])("preserves unknown upstream spend with prior successes=%s", (priorSuccess) => {
    const root = mkdtempSync(join(tmpdir(), "aob-unknown-failure-cost-"));
    try {
      writeCell(root, "cell", "verify_error", false, { spend: null });
      const eventPath = join(root, "cell", "events.jsonl");
      const events = readFileSync(eventPath, "utf8").trim().split("\n").map(line => JSON.parse(line));
      const failed = events.at(-1);
      Object.assign(failed, { status: 400, model_served: null, usage: null, usage_source: "unavailable", error: { kind: "upstream_http", detail: "status 400" } });
      if (!priorSuccess) { events.splice(0, 1); failed.seq = 0; }
      writeFileSync(eventPath, events.map(event => JSON.stringify(event)).join("\n") + "\n");
      expect(generateReport(root, join(root, "out")).markdown).toContain(priorSuccess ? "| 2 | 10/2 | 0% | — |" : "| 1 | — | — | — |");
      writeCell(root, "priced", "completed", false, { rep: 1 });
      expect(generateReport(root, join(root, "out")).markdown).not.toContain("$0");
      const runPath = join(root, "cell", "run.json");
      const run = JSON.parse(readFileSync(runPath, "utf8"));
      run.spend_usd_estimate = 0;
      writeFileSync(runPath, JSON.stringify(run));
      expect(() => generateReport(root, join(root, "out"))).toThrow(/C4 spend availability disagrees/);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it("rejects forged unavailable C4 spend for complete successful C1", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-forged-null-cost-"));
    try {
      writeCell(root, "cell", "completed", false, { spend: null });
      expect(() => generateReport(root, join(root, "out"))).toThrow(/C4 spend availability disagrees/);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it.each(["refusal", "proven-rejection", "unproven-rejection", "request-free"])("preserves cost availability for %s", (kind) => {
    const root = mkdtempSync(join(tmpdir(), "aob-failure-cost-exception-"));
    try {
      writeCell(root, "cell", "verify_error", false, { spend: kind === "unproven-rejection" ? null : 0 });
      const eventPath = join(root, "cell", "events.jsonl");
      const events = readFileSync(eventPath, "utf8").trim().split("\n").map(line => JSON.parse(line));
      const event = events[0];
      Object.assign(event, { status: 400, protocol: "anthropic_messages", path: "/v1/messages", model_requested: "deepseek/deepseek-v4.1-flash", model_served: null, usage: null, usage_source: "unavailable", usage_lookup: "not_attempted", error: { kind: kind === "refusal" ? "proxy_refused" : "upstream_rejected", detail: PRE_INFERENCE_REJECTION_DETAIL } });
      if (kind === "unproven-rejection") delete event.usage_lookup;
      writeFileSync(eventPath, kind === "request-free" ? "" : JSON.stringify(event) + "\n");
      const report = generateReport(root, join(root, "out"));
      expect(report.markdown).toContain(kind === "unproven-rejection" ? "| 1 | — | — | — |" : "$0");
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it("reads a results tree, drops failed verification from timing, writes html svg", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-res-"));
    writeCell(root, "ok", "completed", true);
    writeCell(root, "fail", "verify_error", true, { rep: 1 });
    const out = join(root, "out");
    const { markdown, html } = generateReport(root, out);
    expect(markdown).toContain("1–5 minute");
    expect(markdown).toContain("tool-a");
    expect(markdown).toMatch(/1\/2/);
    expect(markdown).toContain("| Turns |");
    expect(markdown).toContain("| Parallelism |");
    expect(markdown).toContain("First byte (med)");
    expect(markdown).toContain("100ms");
    expect(markdown).toContain("1.62");
    expect(markdown).toContain("| Tokens in/out |");
    expect(markdown).toContain("| Cached % |");
    expect(markdown).toContain("2 | 20/4 | 0%");
    expect(html).toContain("data-seg=\"startup\"");
    expect(html).toContain("data-chart=\"cost\"");
    expect(html).toContain("<table>");
    const written = readFileSync(join(out, "index.html"), "utf8");
    expect(written).toContain("<svg");
    expect(written).toBe(html);
  });

  it("names a long-only report as long-horizon and keeps mixed regimes separate", () => {
    const longRoot = mkdtempSync(join(tmpdir(), "aob-long-results-"));
    writeCell(longRoot, "long", "completed", false, { regime: "long", visibility: "partial" });
    const longReport = generateReport(longRoot, join(longRoot, "out"));
    expect(longReport.markdown).toContain("long-horizon selected public tasks");
    expect(longReport.markdown).toContain("regime: long");
    expect(longReport.markdown).not.toContain("short (1–5 minute)");

    const mixedRoot = mkdtempSync(join(tmpdir(), "aob-mixed-regime-results-"));
    writeCell(mixedRoot, "short", "completed", false, { regime: "short" });
    writeCell(mixedRoot, "long", "completed", false, { regime: "long", rep: 1 });
    const mixedReport = generateReport(mixedRoot, join(mixedRoot, "out"));
    expect(mixedReport.markdown).toContain("reporting materially different task regimes separately");
    expect(mixedReport.markdown.match(/## Condition: pinned/g)).toHaveLength(2);
  });

  it("names an extended-only report as extended-horizon instead of falling through to short", () => {
    // The single-regime positioning used to be a binary long/else test, so an
    // extended-regime table was published under the short "1-5 minute" claim.
    const extendedRoot = mkdtempSync(join(tmpdir(), "aob-extended-results-"));
    writeCell(extendedRoot, "extended", "completed", false, { regime: "extended", visibility: "partial" });
    const extendedReport = generateReport(extendedRoot, join(extendedRoot, "out"));
    expect(extendedReport.markdown).toContain("extended-horizon (16–180 minute) selected public tasks");
    expect(extendedReport.markdown).toContain("regime: extended");
    expect(extendedReport.markdown).not.toContain("short (1–5 minute)");
    expect(extendedReport.markdown).not.toContain("long-horizon selected public tasks");

    const mixedExtendedRoot = mkdtempSync(join(tmpdir(), "aob-mixed-extended-results-"));
    writeCell(mixedExtendedRoot, "short", "completed", false, { regime: "short" });
    writeCell(mixedExtendedRoot, "extended", "completed", false, { regime: "extended", rep: 1 });
    const mixedExtendedReport = generateReport(mixedExtendedRoot, join(mixedExtendedRoot, "out"));
    expect(mixedExtendedReport.markdown).toContain("reporting materially different task regimes separately");
    expect(mixedExtendedReport.markdown.match(/## Condition: pinned/g)).toHaveLength(2);
  });

  it("does not scan agent workspace internals for report artifacts", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-workspace-artifacts-"));
    writeCell(root, "cell", "verify_error", false);
    const workspace = join(root, "cell", "workspace");
    const outside = join(root, "workspace-target");
    mkdirSync(workspace);
    mkdirSync(outside);
    symlinkSync(outside, join(workspace, "tool-cache"));
    mkdirSync(join(root, "cell", ".attempts", "attempt-0"), { recursive: true });
    writeFileSync(join(root, "cell", ".attempts", "attempt-0", "run.json"), "not a current result");
    expect(loadResultsTree(root)).toHaveLength(1);
  });

  it("renders pinned and default conditions as separate tables", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-conditions-"));
    writeCell(root, "pinned", "completed", true, { condition: "pinned" });
    writeCell(root, "default", "completed", true, { condition: "default", model: "" });
    const { markdown, html } = generateReport(root, join(root, "out"));
    expect(markdown).toContain("## Condition: pinned");
    expect(markdown).toContain("## Condition: default");
    expect(markdown.match(/\| tool-a \|/g)).toHaveLength(4);
    expect(markdown).toContain("### Per-task drill-down");
    expect(markdown).toContain("| Harness | Task | Vis. | E2E (med/IQR)");
    expect(html.match(/id="hatch-/g)).toHaveLength(2);
  });

  it("preserves partial visibility from raw C4 metadata", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-partial-visibility-"));
    writeCell(root, "partial", "completed", false, { visibility: "partial" });
    const { markdown } = generateReport(root, join(root, "out"));
    expect(markdown).toContain("| partial |");
    expect(markdown).toMatch(/\| partial \|.*\| — \|/);
    expect(markdown).toContain("— (non-model 28%)");
  });

  it("surfaces unreconciled runs and retains the fixed 3x outlier rule", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-anomalies-"));
    writeCell(root, "normal-1", "completed", true);
    writeCell(root, "normal-2", "completed", true, { rep: 1 });
    writeCell(root, "outlier", "completed", true, { rep: 2, tEnd: 50000 });
    writeCell(root, "unreconciled", "completed", true, { rep: 3, tEnd: 100, visibility: "full" });
    const { markdown } = generateReport(root, join(root, "out"));
    expect(markdown).toContain("3× cell median");
    expect(markdown).toContain("`outlier`");
    expect(markdown).toContain("`unreconciled`: unreconciled timing buckets");
  });

  it("does not render zero timing for a tool with no valid timing cells", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-no-valid-timing-"));
    writeCell(root, "failed", "verify_error", true);
    const { markdown } = generateReport(root, join(root, "out"));
    expect(markdown).toContain("| tool-a |");
    expect(markdown).toContain("| — | — | — |");
    expect(markdown).not.toContain("0ms / 0ms");
  });

  it("accepts task-specific images while rejecting image drift within a task", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-task-images-"));
    try {
      for (const taskId of ["one", "two"]) {
        for (const rep of [0, 1]) writeCell(root, `${taskId}-${rep}`, "completed", true, { taskId, rep, image: `sha256:${taskId}` });
      }
      expect(generateReport(root, join(root, "out")).markdown).toContain("4/4");
      const path = join(root, "two-1/run.json");
      const run = JSON.parse(readFileSync(path, "utf8"));
      run.container.verifier_image_digest = "sha256:changed";
      writeFileSync(path, JSON.stringify(run));
      expect(() => generateReport(root, join(root, "out"))).toThrow(/verifier image digest differs/);
      run.container.verifier_image_digest = "sha256:two";
      run.container.image_digest = "sha256:changed";
      run.outcome = "verify_error";
      run.verification.exit = 1;
      writeFileSync(path, JSON.stringify(run));
      expect(() => generateReport(root, join(root, "out"))).toThrow(/image digest differs/);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it("rejects mixed tool versions and C4 spend mismatches", () => {
    const versions = mkdtempSync(join(tmpdir(), "aob-versions-"));
    writeCell(versions, "one", "completed", true, { version: "1.0.0" });
    writeCell(versions, "two", "completed", true, { rep: 1, version: "2.0.0" });
    expect(() => generateReport(versions, join(versions, "out"))).toThrow(/version differs/);

    const spend = mkdtempSync(join(tmpdir(), "aob-spend-"));
    writeCell(spend, "bad", "completed", true, { spend: 9 });
    expect(() => generateReport(spend, join(spend, "out"))).toThrow(/C4 spend disagrees/);

    const images = mkdtempSync(join(tmpdir(), "aob-images-"));
    writeCell(images, "one", "completed", true, { image: "sha256:one" });
    writeCell(images, "two", "completed", true, { rep: 1, image: "sha256:two" });
    expect(() => generateReport(images, join(images, "out"))).toThrow(/image digest differs/);
  });

  it("rejects C1 events attributed to a different C4 run", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-event-run-id-"));
    writeCell(root, "cell", "completed", true);
    const eventsPath = join(root, "cell", "events.jsonl");
    const events = readFileSync(eventsPath, "utf8").replaceAll('"run_id":"cell"', '"run_id":"other-cell"');
    writeFileSync(eventsPath, events);
    expect(() => generateReport(root, join(root, "out"))).toThrow(/run_id does not match/);
  });

  it("rejects duplicate C4 identities in the results tree", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-duplicate-results-"));
    writeCell(root, "first", "completed", true);
    writeCell(root, "second", "completed", true);
    for (const file of ["run.json", "events.jsonl"]) {
      const path = join(root, "second", file);
      writeFileSync(path, readFileSync(path, "utf8").replaceAll("second", "first"));
    }
    expect(() => loadResultsTree(root)).toThrow(/duplicate C4 run_id|duplicate result cell identity/);
  });

  it("rejects an events file that escapes the result cell", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-event-path-"));
    writeCell(root, "cell", "completed", true);
    writeFileSync(join(root, "outside-events.jsonl"), readFileSync(join(root, "cell", "events.jsonl")));
    const runPath = join(root, "cell", "run.json");
    const run = JSON.parse(readFileSync(runPath, "utf8")) as { events_file: string };
    run.events_file = "../outside-events.jsonl";
    writeFileSync(runPath, JSON.stringify(run));
    expect(() => loadResultsTree(root)).toThrow(/events file.*cell/i);
  });

  it("rejects C1 sequence gaps and duplicates", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-event-sequence-"));
    writeCell(root, "cell", "completed", true);
    const eventsPath = join(root, "cell", "events.jsonl");
    const events = readFileSync(eventsPath, "utf8").replace('"seq":1', '"seq":2');
    writeFileSync(eventsPath, events);
    expect(() => loadResultsTree(root)).toThrow(/sequence has a gap or duplicate/);
  });

  it("sanitizes release evidence and rejects symlinked artifacts", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-sanitize-"));
    writeCell(root, "cell", "completed", true);
    const destination = join(root, "sanitized");
    copySanitizedResults(root, destination);
    expect(existsSync(join(destination, "cell", "run.json"))).toBe(true);
    expect(existsSync(join(destination, "cell", "stdout.log"))).toBe(true);
    expect(existsSync(join(destination, "cell", "workspace"))).toBe(false);

    const outside = join(root, "outside.secret");
    writeFileSync(outside, "do not publish");
    rmSync(join(root, "cell", "stdout.log"));
    symlinkSync(outside, join(root, "cell", "stdout.log"));
    expect(() => copySanitizedResults(root, join(root, "rejected"))).toThrow(/symlink/);
  });

  it("rewrites machine-local artifact paths in the release copy", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-sanitize-paths-"));
    writeCell(root, "cell", "completed", true);
    const sourceCell = join(root, "cell");
    const runPath = join(sourceCell, "run.json");
    const run = JSON.parse(readFileSync(runPath, "utf8")) as { adapter_result: { artifacts: { stdoutPath: string; stderrPath: string } }; events_file: string; verification: { logPath: string } };
    run.adapter_result.artifacts.stdoutPath = join(sourceCell, "stdout.log");
    run.adapter_result.artifacts.stderrPath = join(sourceCell, "stderr.log");
    writeFileSync(runPath, JSON.stringify(run));
    const destination = join(root, "portable");
    copySanitizedResults(root, destination);
    const portable = JSON.parse(readFileSync(join(destination, "cell", "run.json"), "utf8")) as typeof run;
    expect(portable.adapter_result.artifacts.stdoutPath).toBe("stdout.log");
    expect(portable.adapter_result.artifacts.stderrPath).toBe("stderr.log");
    expect(portable.events_file).toBe("events.jsonl");
    expect(portable.verification.logPath).toBe("verify.log");
  });

  it("uses a reviewed replacement for the report-facing release results", () => {
    const current = mkdtempSync(join(tmpdir(), "aob-sanitize-current-"));
    const replacement = mkdtempSync(join(tmpdir(), "aob-sanitize-replacement-"));
    writeCell(current, "cell", "completed", false, { tEnd: 12500 });
    writeCell(replacement, "replacement", "completed", false, { tEnd: 20000 });
    const replacementCell = loadResultsTree(replacement)[0]!;
    const destination = join(current, "portable");
    copySanitizedResults(current, destination, new Map([["cell", replacementCell]]));
    const resolved = loadResultsTree(destination);
    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.run.run_id).toBe("replacement");
    expect(resolved[0]?.derived.end_to_end).toBe(20000);
  });

  it("rejects missing evidence and refuses to merge into a non-empty release directory", () => {
    const missing = mkdtempSync(join(tmpdir(), "aob-sanitize-missing-"));
    writeCell(missing, "cell", "completed", true);
    rmSync(join(missing, "cell", "verify.log"));
    expect(() => copySanitizedResults(missing, join(missing, "portable"))).toThrow(/evidence.*unavailable/i);

    const stale = mkdtempSync(join(tmpdir(), "aob-sanitize-stale-"));
    writeCell(stale, "cell", "completed", true);
    const destination = join(stale, "portable");
    mkdirSync(destination);
    writeFileSync(join(destination, "stale.txt"), "must not be merged\n");
    expect(() => copySanitizedResults(stale, destination)).toThrow(/destination.*empty/i);
  });

  it("redacts credential-shaped values from release logs", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-sanitize-secrets-"));
    writeCell(root, "cell", "verify_error", true);
    writeFileSync(join(root, "cell", "stdout.log"), "sk-or-supersecret-token\nBearer bearer-secret\nOPENAI_API_KEY=key-secret\n");
    const eventsPath = join(root, "cell", "events.jsonl");
    writeFileSync(eventsPath, readFileSync(eventsPath, "utf8").replaceAll('"model_served":"m"', '"model_served":"sk-or-event-secret"'));
    const destination = join(root, "portable");
    copySanitizedResults(root, destination);
    const log = readFileSync(join(destination, "cell", "stdout.log"), "utf8");
    expect(log).not.toContain("supersecret-token");
    expect(log).not.toContain("bearer-secret");
    expect(log).not.toContain("key-secret");
    expect(log).toContain("[redacted]");
    expect(readFileSync(join(destination, "cell", "events.jsonl"), "utf8")).not.toContain("event-secret");
  });

  it("freezes large logs without converting the whole output to a string", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-sanitize-large-"));
    try {
      writeCell(root, "cell", "completed", false);
      const contents = "x".repeat(2 * 1024 * 1024) + "\nBearer secret\nTAIL 😀\n";
      writeFileSync(join(root, "cell", "stdout.log"), contents);
      const original = Buffer.prototype.toString;
      const conversion = vi.spyOn(Buffer.prototype, "toString").mockImplementation(function (this: Buffer, ...args) {
        if (this.length > 1024 * 1024) throw new RangeError("Whole-log string conversion is forbidden");
        return original.apply(this, args);
      });
      const destination = join(root, "portable");
      try { copySanitizedResults(root, destination); } finally { conversion.mockRestore(); }
      expect(readFileSync(join(destination, "cell", "stdout.log"), "utf8")).toBe("x".repeat(2 * 1024 * 1024) + "\n[redacted]\nTAIL 😀\n");
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it("keeps descriptor close failures typed and attempts both closes", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-sanitize-close-"));
    try {
      writeCell(root, "cell", "completed", false);
      const closed: number[] = [];
      const original = fs.closeSync;
      const closer = vi.spyOn(fs, "closeSync").mockImplementation((fd) => {
        original(fd);
        closed.push(fd);
        throw new Error("injected close failure");
      });
      try { expect(() => copySanitizedResults(root, join(root, "portable"))).toThrow(ConfigError); }
      finally { closer.mockRestore(); }
      expect(closed).toHaveLength(2);
      for (const fd of closed) expect(() => fs.fstatSync(fd)).toThrow();
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it("keeps redacted JSON event records parseable when a credential is embedded in a string", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-sanitize-json-"));
    writeCell(root, "cell", "completed", false);
    const eventsPath = join(root, "cell", "events.jsonl");
    writeFileSync(eventsPath, readFileSync(eventsPath, "utf8").replaceAll('"model_served":"m"', '"model_served":"Bearer event-secret"'));
    const destination = join(root, "portable");
    copySanitizedResults(root, destination);
    const records = readFileSync(join(destination, "cell", "events.jsonl"), "utf8").trim().split("\n").map((line) => JSON.parse(line) as { model_served: string });
    expect(records[0]?.model_served).toBe("[redacted]");
  });

  it("projects adapter times onto the proxy clock when monotonic zeros differ", () => {
    const iso = "2026-08-25T00:00:00.000Z";
    const derived = deriveFromC1(
      { tStart: 100_000, tEnd: 112_500 },
      [
        {
          v: 1,
          run_id: "x",
          seq: 0,
          t_req_start: 2500,
          t_req_body_end: 2500,
          t_upstream_sent: 2500,
          t_first_byte: 2600,
          t_last_byte: 9000,
          duration_ms: 6500,
          method: "POST",
          path: "/v1/chat/completions",
          protocol: "openai_chat",
          model_requested: "m",
          model_served: "m",
          status: 200,
          streamed: false,
          usage: { input: 1, cached_input: 0, output: 1, reasoning_output: 0 },
          usage_source: "response_body",
          error: null,
        },
        {
          v: 1,
          run_id: "x",
          seq: 1,
          t_req_start: 4000,
          t_req_body_end: 4000,
          t_upstream_sent: 4000,
          t_first_byte: 4100,
          t_last_byte: 8000,
          duration_ms: 4000,
          method: "POST",
          path: "/v1/chat/completions",
          protocol: "openai_chat",
          model_requested: "m",
          model_served: "m",
          status: 200,
          streamed: false,
          usage: { input: 1, cached_input: 0, output: 1, reasoning_output: 0 },
          usage_source: "response_body",
          error: null,
        },
      ],
      [{ tStart: 109_200, tEnd: 111_000, kind: "shell" }],
      "full",
      {
        adapter: { wall_clock_iso: iso, monotonic_zero: 100_000 },
        proxy: { wall_clock_iso: iso, monotonic_zero: 50 },
      },
    );
    expect(derived.startup).toBe(2500);
    expect(derived.model_time).toBe(6500);
    expect(derived.tool_time).toBe(1800);
    expect(derived.harness_time).toBe(1700);
    expect(derived.unreconciled).toBe(false);
  });

  it("loadResultsTree uses C4 anchors so mismatched zeros still derive the overlap buckets", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-anch-"));
    const dir = join(root, "cell");
    mkdirSync(dir, { recursive: true });
    const iso = "2026-08-25T00:00:00.000Z";
    const run = {
      v: 1,
      run_id: "anch",
      tool: "tool-a",
      tool_version: "1.0.0",
      task_id: "t1",
      task_source: "local-development",
      task_revision: "working-tree",
      task_regime: "short",
      condition: "pinned",
      rep: 0,
      model: "mock",
      ori_version: null,
      tool_visibility: "full",
      anchors: {
        adapter: { wall_clock_iso: iso, monotonic_zero: 100000 },
        proxy: { wall_clock_iso: iso, monotonic_zero: 50 },
      },
      adapter_result: {
        exitCode: 0,
        tStart: 100000,
        tEnd: 112500,
        anchor: { wall_clock_iso: iso, monotonic_zero: 100000 },
        artifacts: { stdoutPath: "stdout.log", stderrPath: "stderr.log" },
        toolEvents: [{ tStart: 109200, tEnd: 111000, kind: "shell" }],
      },
      events_file: "events.jsonl",
      verification: { exit: 0, duration_ms: 1, logPath: "verify.log" },
      container: { image_digest: "host", verifier_image_digest: "host", started_iso: iso }, task_environment: { kind: "runner-default", network: "disabled" },
      host: { os: "linux", cpu: "x86_64", ram_gb: 16 },
      spend_usd_estimate: 0,
      price_book: "openrouter-2026-08-27",
      outcome: "completed",
    };
    writeFileSync(join(dir, "run.json"), JSON.stringify(run));
    const events = [
      {
        v: 1,
        run_id: "anch",
        seq: 0,
        t_req_start: 2500,
        t_req_body_end: 2500,
        t_upstream_sent: 2500,
        t_first_byte: 2600,
        t_last_byte: 9000,
        duration_ms: 6500,
        method: "POST",
        path: "/v1/chat/completions",
        protocol: "openai_chat",
        model_requested: "m",
        model_served: "m",
        status: 200,
        streamed: false,
        usage: { input: 10, cached_input: 0, output: 2, reasoning_output: 0 },
        usage_source: "response_body",
        error: null,
      },
      {
        v: 1,
        run_id: "anch",
        seq: 1,
        t_req_start: 4000,
        t_req_body_end: 4000,
        t_upstream_sent: 4000,
        t_first_byte: 4100,
        t_last_byte: 8000,
        duration_ms: 4000,
        method: "POST",
        path: "/v1/chat/completions",
        protocol: "openai_chat",
        model_requested: "m",
        model_served: "m",
        status: 200,
        streamed: false,
        usage: { input: 10, cached_input: 0, output: 2, reasoning_output: 0 },
        usage_source: "response_body",
        error: null,
      },
    ];
    writeFileSync(join(dir, "events.jsonl"), events.map((e) => JSON.stringify(e)).join("\n") + "\n");
    const cells = loadResultsTree(root);
    expect(cells).toHaveLength(1);
    expect(cells[0]?.derived.startup).toBe(2500);
    expect(cells[0]?.derived.model_time).toBe(6500);
    expect(cells[0]?.derived.tool_time).toBe(1800);
    expect(cells[0]?.derived.harness_time).toBe(1700);
    expect(cells[0]?.derived.unreconciled).toBe(false);
  });

  it("package bin aob-report is linked and generateReport writes the site", () => {
    const repo = join(dirname(fileURLToPath(import.meta.url)), "../../..");
    const pkg = JSON.parse(readFileSync(join(repo, "package.json"), "utf8")) as {
      bin: Record<string, string>;
    };
    expect(pkg.bin["aob-report"]).toBe("./scripts/aob-report.mjs");
    expect(existsSync(join(repo, "node_modules/.bin/aob-report"))).toBe(true);
    expect(existsSync(join(dirname(fileURLToPath(import.meta.url)), "cli.ts"))).toBe(true);
  });
});

it("separates Claude tool compatibility in report sections and anomaly baselines", () => {
  const root = mkdtempSync(join(tmpdir(), "aob-tool-config-report-"));
  try {
    const results = join(root, "results");
    for (let rep = 0; rep < 4; rep++) {
      writeCell(results, `r${rep}`, "completed", false, { rep, tEnd: rep === 3 ? 50000 : 12500 });
      const path = join(results, `r${rep}/run.json`);
      const run = JSON.parse(readFileSync(path, "utf8"));
      run.tool = "claude-code";
      if (rep === 3) run.tool_configuration = "claude-code-no-web-search";
      writeFileSync(path, JSON.stringify(run));
    }
    const report = generateReport(results, join(root, "report"));
    expect(report.markdown.match(/## Condition:/g)).toHaveLength(2);
    expect(report.markdown).toContain("claude-code-no-web-search");
    expect(report.markdown).toContain("default tools");
    expect(reviewAnomalies(loadResultsTree(results))).toEqual([]);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

it("previews unpriced model usage only when explicitly enabled", () => {
  const root = mkdtempSync(join(tmpdir(), "aob-unpriced-preview-"));
  try {
    writeCell(root, "one", "completed", false, { model: "unpriced-test-model", spend: null });
    expect(() => generateReport(root, join(root, "strict"))).toThrow(/no pricing rates/);
    const report = generateReport(root, join(root, "preview"), { allowUnpricedModels: true });
    expect(report.markdown).toContain("unpriced-test-model");
    expect(report.markdown).toContain("pricing unavailable");
    expect(report.rows[0]?.costUsd).toBeNull();
    expect(report.rows[0]?.inputTokens).toBeGreaterThan(0);
    expect(report.markdown).toContain("1/1");
    expect(report.markdown).not.toContain("$0.00");
    const path = join(root, "one/run.json");
    const run = JSON.parse(readFileSync(path, "utf8")); run.spend_usd_estimate = 1;
    writeFileSync(path, JSON.stringify(run));
    expect(() => generateReport(root, join(root, "forged"), { allowUnpricedModels: true })).toThrow(/spend availability/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
