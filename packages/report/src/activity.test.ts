import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseActivityExportCsv } from "./activity.js";
import { activityBinding, archivedActivityBinding, runActivityCrosscheck } from "./activity-cli.js";
import { copySanitizedProvenance, copySanitizedResults } from "./freeze.js";

describe("parseActivityExportCsv", () => {
  it("parses quoted CSV, currency values, and sums only the requested model", () => {
    const result = parseActivityExportCsv(
      "Model,Spend\n\"z-ai/glm-5.3-flash\",\"$1.25\"\nother,0.50\n\"z-ai/glm-5.3-flash\",0.75\n",
      "z-ai/glm-5.3-flash",
    );
    expect(result).toEqual({ rowCount: 3, matchingRowCount: 2, spendUsd: 2 });
  });

  it("accepts common header aliases and escaped quotes", () => {
    const result = parseActivityExportCsv(
      "Model Name,Total Spend\r\n\"z-ai/glm-5.3-\"\"flash\"\"\",\"$1,234.50\"\r\n",
      "z-ai/glm-5.3-\"flash\"",
    );
    expect(result.spendUsd).toBe(1234.5);
    expect(result.matchingRowCount).toBe(1);
  });

  it("accepts OpenRouter generation-export model_permaslug and cost_total headers", () => {
    const result = parseActivityExportCsv(
      "generation_id,created_at,cost_total,model_permaslug\ngen-1,2026-09-14 10:00:00,0.25,deepseek/deepseek-v4.1-flash-20260910\ngen-2,2026-09-14 10:01:00,0.50,other/model\n",
      "deepseek/deepseek-v4.1-flash-20260910",
    );
    expect(result).toEqual({ rowCount: 2, matchingRowCount: 1, spendUsd: 0.25 });
  });

  it("matches a price-book canonical snapshot slug without treating GLM Flash as the same model", () => {
    const csv = [
      "model_permaslug,cost_total",
      "deepseek/deepseek-v4.1-flash-20260910,0.25",
      "z-ai/glm-5.3-flash,4.00",
      "deepseek/deepseek-v4.1-flash,0.10",
      "",
    ].join("\n");
    expect(parseActivityExportCsv(csv, "deepseek/deepseek-v4.1-flash")).toEqual({
      rowCount: 3, matchingRowCount: 1, spendUsd: 0.10,
    });
    expect(parseActivityExportCsv(csv, "deepseek/deepseek-v4.1-flash", ["deepseek/deepseek-v4.1-flash-20260910"])).toEqual({
      rowCount: 3, matchingRowCount: 2, spendUsd: 0.35,
    });
  });

  it("cross-checks DeepSeek pin rows billed under the price-book canonical snapshot", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-activity-canonical-"));
    try {
      const results = join(root, "results");
      const cell = join(results, "pinned", "codex", "task", "rep-0");
      const run = JSON.parse(readFileSync("../contracts/fixtures/c4.run.valid.json", "utf8")) as Record<string, unknown>;
      const event = JSON.parse(readFileSync("../contracts/fixtures/c1.event.valid.json", "utf8")) as Record<string, unknown>;
      mkdirSync(cell, { recursive: true });
      const model = "deepseek/deepseek-v4.1-flash";
      const spend = (48213 - 31400) * 1.5e-7 + 31400 * 3e-9 + 512 * 6e-7;
      run.run_id = "activity-canonical-run";
      run.model = model;
      run.price_book = "deepseek-v41-low-2026-09-10";
      run.spend_usd_estimate = spend;
      event.run_id = run.run_id;
      event.seq = 0;
      event.model_requested = model;
      event.model_served = model;
      writeFileSync(join(cell, "run.json"), JSON.stringify(run));
      writeFileSync(join(cell, "events.jsonl"), `${JSON.stringify(event)}\n`);
      const exportCsv = join(root, "activity.csv");
      writeFileSync(exportCsv, [
        "model_permaslug,cost_total",
        `deepseek/deepseek-v4.1-flash-20260910,${spend}`,
        "z-ai/glm-5.3-flash,4.00",
        "",
      ].join("\n"));
      const summary = runActivityCrosscheck({
        resultsDir: results,
        exportCsv,
        output: join(root, "summary.json"),
        model,
        priceBook: "deepseek-v41-low-2026-09-10",
      });
      expect(summary.within_tolerance).toBe(true);
      expect(summary.activity_export.matching_row_count).toBe(1);
      expect(summary.activity_export.row_count).toBe(2);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects missing or ambiguous required columns", () => {
    expect(() => parseActivityExportCsv("Model\nz-ai/glm-5.3-flash\n", "z-ai/glm-5.3-flash")).toThrow(/spend column/i);
    expect(() => parseActivityExportCsv("Model,Spend,Cost\na,1,1\n", "a")).toThrow(/ambiguous/i);
  });

  it("rejects invalid UTF-8 instead of hashing lossy decoded text", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-activity-utf8-"));
    try {
      const csv = join(root, "activity.csv");
      writeFileSync(csv, Buffer.concat([Buffer.from("Model,Spend,Notes\nz-ai/glm-5.3-flash,0,"), Buffer.from([0x80]), Buffer.from("\n")]));
      expect(() => runActivityCrosscheck({
        resultsDir: join(root, "missing-results"), exportCsv: csv, output: join(root, "summary.json"),
        model: "z-ai/glm-5.3-flash", priceBook: "openrouter-2026-08-27",
      })).toThrow(/encoding|utf|decode|encoded/i);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("reconstructs the source Activity binding from sanitized current and retry evidence", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-activity-archive-binding-"));
    try {
      const results = join(root, "source", "results");
      const cell = join(results, "pinned", "opencode", "task", "rep-0");
      const retry = join(cell, ".attempts", "attempt-0");
      mkdirSync(retry, { recursive: true });
      const run = JSON.parse(readFileSync("../../scripts/test-fixtures/cap-pinned-opencode/run.json", "utf8")) as Record<string, unknown>;
      const event = JSON.parse(readFileSync("../../scripts/test-fixtures/cap-pinned-opencode/events.jsonl", "utf8")) as Record<string, unknown>;
      run.run_id = "pinned:opencode:task:0";
      run.task_id = "task";
      event.run_id = run.run_id;
      for (const directory of [cell, retry]) {
        writeFileSync(join(directory, "run.json"), `${JSON.stringify(run)}\n`);
        writeFileSync(join(directory, "events.jsonl"), `${JSON.stringify(event)}\n`);
        writeFileSync(join(directory, "stdout.log"), "stdout\n");
        writeFileSync(join(directory, "stderr.log"), "stderr\n");
        writeFileSync(join(directory, "verify.log"), "verified\n");
      }
      const state = join(root, "source", "state.json");
      writeFileSync(state, '{"version":1,"spentUsd":0,"cells":[]}\n');
      const expected = activityBinding(results, state);
      const packageRoot = join(root, "package");
      mkdirSync(join(packageRoot, "results"), { recursive: true });
      copySanitizedResults(results, join(packageRoot, "results"));
      copySanitizedProvenance(results, state, join(packageRoot, "provenance"));
      expect(archivedActivityBinding(packageRoot)).toEqual(expected);
      expect(readFileSync(join(packageRoot, "provenance", "runner-state.json"))).toEqual(readFileSync(state));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects malformed CSV and invalid spend values", () => {
    expect(() => parseActivityExportCsv("Model,Spend\n\"unterminated,1\n", "unterminated")).toThrow(/CSV/i);
    expect(() => parseActivityExportCsv("Model,Spend\n\"closed\"suffix,1\n", "closedsuffix")).toThrow(/CSV/i);
    expect(() => parseActivityExportCsv("Model,Spend\na,\"$1,23\"\n", "a")).toThrow(/spend/i);
    expect(() => parseActivityExportCsv("Model,Spend\na,-1\n", "a")).toThrow(/spend/i);
    expect(() => parseActivityExportCsv("Model,Spend\na,not-a-number\n", "a")).toThrow(/spend/i);
  });

  it("cross-checks a pinned result tree without exposing raw export rows", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-activity-test-"));
    try {
      const results = join(root, "results");
      const cell = join(results, "pinned", "aider", "task", "rep-0");
      const run = JSON.parse(readFileSync("../contracts/fixtures/c4.run.valid.json", "utf8")) as Record<string, unknown>;
      const event = JSON.parse(readFileSync("../contracts/fixtures/c1.event.valid.json", "utf8")) as Record<string, unknown>;
      mkdirSync(cell, { recursive: true });
      run.run_id = "activity-crosscheck-run";
      run.model = "z-ai/glm-5.3-flash";
      run.spend_usd_estimate = 0.001859975;
      event.run_id = run.run_id;
      event.seq = 0;
      event.model_requested = run.model;
      event.model_served = run.model;
      writeFileSync(join(cell, "run.json"), JSON.stringify(run));
      writeFileSync(join(cell, "events.jsonl"), `${JSON.stringify(event)}\n`);
      const exportCsv = join(root, "activity.csv");
      writeFileSync(exportCsv, "Model,Spend\nz-ai/glm-5.3-flash,0.001859975\nother,4.00\n");
      const summaryPath = join(root, "summary.json");
      writeFileSync(summaryPath, "old\n", { mode: 0o644 });
      chmodSync(summaryPath, 0o644);

      const summary = runActivityCrosscheck({
        resultsDir: results,
        exportCsv,
        output: summaryPath,
        model: "z-ai/glm-5.3-flash",
        priceBook: "openrouter-2026-08-27",
        window: { startIso: "2026-08-24T00:00:00.000Z", endIso: "2026-08-26T00:00:00.000Z" },
      });

      expect(summary.within_tolerance).toBe(true);
      expect(summary.window).toEqual({ start_iso: "2026-08-24T00:00:00.000Z", end_iso: "2026-08-26T00:00:00.000Z", operator_supplied: true });
      expect(summary.binding.run_ids_sha256).toMatch(/^sha256:[0-9a-f]{64}$/);
      expect(summary.binding.results_sha256).toMatch(/^sha256:[0-9a-f]{64}$/);
      expect(summary.binding.state_sha256).toBeNull();
      expect(summary.local.run_count).toBe(1);
      expect(summary.local.usage_event_count).toBe(1);
      expect(readFileSync(summaryPath, "utf8")).not.toContain("other");
      expect(readFileSync(summaryPath, "utf8")).not.toContain("activity.csv");
      expect(statSync(summaryPath).mode & 0o777).toBe(0o600);

      const beforeResultBinding = summary.binding.results_sha256;
      event.t_req_start = 152341;
      event.duration_ms = 8859;
      writeFileSync(join(cell, "events.jsonl"), `${JSON.stringify(event)}\n`);
      const changed = runActivityCrosscheck({
        resultsDir: results,
        exportCsv,
        output: summaryPath,
        model: "z-ai/glm-5.3-flash",
        priceBook: "openrouter-2026-08-27",
        window: { startIso: "2026-08-24T00:00:00.000Z", endIso: "2026-08-26T00:00:00.000Z" },
      });
      expect(changed.binding.results_sha256).not.toBe(beforeResultBinding);
      expect(activityBinding(results).run_ids_sha256).toBe(summary.binding.run_ids_sha256);

      expect(() => runActivityCrosscheck({
        resultsDir: results,
        exportCsv,
        output: summaryPath,
        model: "z-ai/glm-5.3-flash",
        priceBook: "openrouter-2026-08-27",
        window: { startIso: "2026-08-26T00:00:00.000Z", endIso: "2026-08-24T00:00:00.000Z" },
      })).toThrow(/window/i);

      expect(() => runActivityCrosscheck({
        resultsDir: results,
        exportCsv,
        output: summaryPath,
        model: "z-ai/glm-5.3-flash",
        priceBook: "openrouter-2026-08-27",
        window: { startIso: "2026-02-30T00:00:00.000Z", endIso: "2026-03-01T00:00:00.000Z" },
      })).toThrow(/calendar|ISO|window/i);

      event.model_requested = null;
      event.model_served = run.model;
      writeFileSync(join(cell, "events.jsonl"), `${JSON.stringify(event)}\n`);
      expect(runActivityCrosscheck({
        resultsDir: results,
        exportCsv,
        output: summaryPath,
        model: "z-ai/glm-5.3-flash",
        priceBook: "openrouter-2026-08-27",
      }).within_tolerance).toBe(true);

      event.model_requested = "other";
      event.model_served = "other";
      writeFileSync(join(cell, "events.jsonl"), `${JSON.stringify(event)}\n`);
      expect(() => runActivityCrosscheck({
        resultsDir: results,
        exportCsv,
        output: summaryPath,
        model: "z-ai/glm-5.3-flash",
        priceBook: "openrouter-2026-08-27",
      })).toThrow(/model/i);

      event.model_requested = run.model;
      event.model_served = run.model;
      writeFileSync(join(cell, "events.jsonl"), `${JSON.stringify(event)}\n`);

      run.spend_usd_estimate = 0.41;
      writeFileSync(join(cell, "run.json"), JSON.stringify(run));
      expect(() => runActivityCrosscheck({
        resultsDir: results,
        exportCsv,
        output: summaryPath,
        model: "z-ai/glm-5.3-flash",
        priceBook: "openrouter-2026-08-27",
      })).toThrow(/spend/i);

      run.spend_usd_estimate = 0.001859975;
      writeFileSync(join(cell, "run.json"), JSON.stringify(run));

      writeFileSync(exportCsv, "Model,Spend\nother,0.001\n");
      expect(() => runActivityCrosscheck({
        resultsDir: results,
        exportCsv,
        output: summaryPath,
        model: "z-ai/glm-5.3-flash",
        priceBook: "openrouter-2026-08-27",
      })).toThrow(/matching|model/i);

      writeFileSync(exportCsv, "Model,Spend\nz-ai/glm-5.3-flash,0.50\n");
      const mismatch = runActivityCrosscheck({
        resultsDir: results,
        exportCsv,
        output: summaryPath,
        model: "z-ai/glm-5.3-flash",
        priceBook: "openrouter-2026-08-27",
      });
      expect(mismatch.within_tolerance).toBe(false);
      expect(mismatch.delta_usd).toBeGreaterThan(mismatch.tolerance_usd);

      rmSync(summaryPath);
      symlinkSync(join(root, "missing-summary.json"), summaryPath);
      expect(() => runActivityCrosscheck({
        resultsDir: results,
        exportCsv,
        output: summaryPath,
        model: "z-ai/glm-5.3-flash",
        priceBook: "openrouter-2026-08-27",
      })).toThrow(/symlink/i);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects a missing C4 spend when successful C1 usage is priced", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-activity-missing-spend-"));
    try {
      const results = join(root, "results");
      const cell = join(results, "pinned", "aider", "task", "rep-0");
      const run = JSON.parse(readFileSync("../contracts/fixtures/c4.run.valid.json", "utf8")) as Record<string, unknown>;
      const event = JSON.parse(readFileSync("../contracts/fixtures/c1.event.valid.json", "utf8")) as Record<string, unknown>;
      mkdirSync(cell, { recursive: true });
      run.run_id = "activity-missing-spend";
      run.model = "z-ai/glm-5.3-flash";
      run.spend_usd_estimate = null;
      event.run_id = run.run_id;
      event.seq = 0;
      event.model_requested = run.model;
      event.model_served = run.model;
      writeFileSync(join(cell, "run.json"), JSON.stringify(run));
      writeFileSync(join(cell, "events.jsonl"), `${JSON.stringify(event)}\n`);
      const exportCsv = join(root, "activity.csv");
      writeFileSync(exportCsv, "Model,Spend\nz-ai/glm-5.3-flash,0.001859975\n");
      expect(() => runActivityCrosscheck({
        resultsDir: results,
        exportCsv,
        output: join(root, "summary.json"),
        model: "z-ai/glm-5.3-flash",
        priceBook: "openrouter-2026-08-27",
      })).toThrow(/spend/i);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("includes preserved retries and interrupted spend in the local accounting total", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-activity-retries-"));
    try {
      const results = join(root, "results");
      const cell = join(results, "pinned", "aider", "task", "rep-0");
      const retry = join(cell, ".attempts", "attempt-0");
      const run = JSON.parse(readFileSync("../contracts/fixtures/c4.run.valid.json", "utf8")) as Record<string, unknown>;
      const event = JSON.parse(readFileSync("../contracts/fixtures/c1.event.valid.json", "utf8")) as Record<string, unknown>;
      mkdirSync(retry, { recursive: true });
      run.run_id = "activity-retry";
      run.model = "z-ai/glm-5.3-flash";
      run.spend_usd_estimate = 0.001859975;
      event.run_id = run.run_id;
      event.seq = 0;
      event.model_requested = run.model;
      event.model_served = run.model;
      for (const directory of [cell, retry]) {
        writeFileSync(join(directory, "run.json"), `${JSON.stringify(run)}\n`);
        writeFileSync(join(directory, "events.jsonl"), `${JSON.stringify(event)}\n`);
      }
      const statePath = join(root, "state.json");
      writeFileSync(statePath, JSON.stringify({
        version: 1,
        spentUsd: 0.00471995,
        cells: [{ id: run.run_id, interruptedSpendUsd: 0.001, status: "done" }],
      }));
      const exportCsv = join(root, "activity.csv");
      writeFileSync(exportCsv, "Model,Spend\nz-ai/glm-5.3-flash,0.00471995\n");
      const summary = runActivityCrosscheck({
        resultsDir: results,
        statePath,
        exportCsv,
        output: join(root, "summary.json"),
        model: "z-ai/glm-5.3-flash",
        priceBook: "openrouter-2026-08-27",
      });
      expect(summary.local.run_count).toBe(2);
      expect(summary.local.retry_run_count).toBe(1);
      expect(summary.local.interrupted_spend_usd).toBeCloseTo(0.001, 7);
      expect(summary.local.spend_usd).toBeCloseTo(0.00471995, 10);
      expect(summary.within_tolerance).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects a preserved retry with a different model or price book", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-activity-retry-identity-"));
    try {
      const results = join(root, "results");
      const cell = join(results, "pinned", "aider", "task", "rep-0");
      const retry = join(cell, ".attempts", "attempt-0");
      const run = JSON.parse(readFileSync("../contracts/fixtures/c4.run.valid.json", "utf8")) as Record<string, unknown>;
      const event = JSON.parse(readFileSync("../contracts/fixtures/c1.event.valid.json", "utf8")) as Record<string, unknown>;
      mkdirSync(retry, { recursive: true });
      run.run_id = "activity-retry-identity";
      run.model = "z-ai/glm-5.3-flash";
      run.spend_usd_estimate = 0.001859975;
      event.run_id = run.run_id;
      event.seq = 0;
      event.model_requested = run.model;
      event.model_served = run.model;
      writeFileSync(join(cell, "run.json"), `${JSON.stringify(run)}\n`);
      writeFileSync(join(cell, "events.jsonl"), `${JSON.stringify(event)}\n`);
      writeFileSync(join(retry, "run.json"), `${JSON.stringify({ ...run, model: "other-model" })}\n`);
      writeFileSync(join(retry, "events.jsonl"), `${JSON.stringify(event)}\n`);
      const exportCsv = join(root, "activity.csv");
      writeFileSync(exportCsv, "Model,Spend\nz-ai/glm-5.3-flash,0.001859975\n");
      expect(() => runActivityCrosscheck({
        resultsDir: results,
        exportCsv,
        output: join(root, "summary.json"),
        model: "z-ai/glm-5.3-flash",
        priceBook: "openrouter-2026-08-27",
      })).toThrow(/retry.*artifact|model|price book/i);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("binds selected replacement runs and their preserved retries while reconciling original state separately", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-activity-replacement-"));
    try {
      const results = join(root, "results");
      const reruns = join(root, "reruns");
      const cell = join(results, "pinned", "aider", "task", "rep-0");
      const replacement = join(reruns, "pinned", "aider", "task", "rep-0");
      const replacementRetry = join(replacement, ".attempts", "attempt-0");
      const run = JSON.parse(readFileSync("../contracts/fixtures/c4.run.valid.json", "utf8")) as Record<string, unknown>;
      const event = JSON.parse(readFileSync("../contracts/fixtures/c1.event.valid.json", "utf8")) as Record<string, unknown>;
      mkdirSync(cell, { recursive: true });
      mkdirSync(replacementRetry, { recursive: true });
      run.run_id = "activity-original";
      run.model = "z-ai/glm-5.3-flash";
      run.spend_usd_estimate = 0.001859975;
      event.run_id = run.run_id;
      event.seq = 0;
      event.model_requested = run.model;
      event.model_served = run.model;
      writeFileSync(join(cell, "run.json"), `${JSON.stringify(run)}\n`);
      writeFileSync(join(cell, "events.jsonl"), `${JSON.stringify(event)}\n`);

      const replacementRun = { ...run, run_id: "activity-replacement", spend_usd_estimate: 0.001859975 };
      const replacementEvent = { ...event, run_id: replacementRun.run_id };
      for (const directory of [replacement, replacementRetry]) {
        writeFileSync(join(directory, "run.json"), `${JSON.stringify(replacementRun)}\n`);
        writeFileSync(join(directory, "events.jsonl"), `${JSON.stringify(replacementEvent)}\n`);
      }
      const statePath = join(root, "state.json");
      writeFileSync(statePath, JSON.stringify({ version: 1, spentUsd: 0.001859975, cells: [{ id: run.run_id, interruptedSpendUsd: 0 }] }));
      const replacementStatePath = join(root, "rerun-state.json");
      writeFileSync(replacementStatePath, JSON.stringify({ version: 1, spentUsd: 0.00421995, cells: [{ id: replacementRun.run_id, interruptedSpendUsd: 0.0005 }] }));
      const exportCsv = join(root, "activity.csv");
      writeFileSync(exportCsv, "Model,Spend\nz-ai/glm-5.3-flash,0.006079925\n");
      const args = {
        resultsDir: results, statePath, exportCsv, output: join(root, "summary.json"),
        model: "z-ai/glm-5.3-flash", priceBook: "openrouter-2026-08-27",
        replacementResultsDir: reruns, replacementStatePath, replacementRunIds: [replacementRun.run_id],
      };
      expect(() => runActivityCrosscheck({
        resultsDir: results, statePath, exportCsv, output: join(root, "missing-state-summary.json"),
        model: "z-ai/glm-5.3-flash", priceBook: "openrouter-2026-08-27",
        replacementResultsDir: reruns, replacementRunIds: [replacementRun.run_id],
      })).toThrow(/replacement.*state|rerun.*state/i);
      const summary = runActivityCrosscheck(args);
      expect(summary.local.run_count).toBe(3);
      expect(summary.local.retry_run_count).toBe(1);
      expect(summary.local.interrupted_spend_usd).toBeCloseTo(0.0005, 10);
      expect(summary.local.replacement_spend_usd).toBeCloseTo(0.00421995, 10);
      expect(summary.local.replacement_runner_spend_usd).toBeCloseTo(0.00421995, 10);
      expect(summary.local.spend_usd).toBeCloseTo(0.006079925, 10);
      expect(summary.within_tolerance).toBe(true);
      expect(summary.binding.results_sha256).toBe(activityBinding(results, statePath, reruns, [replacementRun.run_id], replacementStatePath).results_sha256);
      expect(summary.binding.replacement_state_sha256).toMatch(/^sha256:[0-9a-f]{64}$/);
      expect(summary.binding.results_sha256).not.toBe(activityBinding(results, statePath).results_sha256);
      const extraReplacement = join(reruns, "pinned", "aider", "task", "rep-1");
      mkdirSync(extraReplacement, { recursive: true });
      const extraRun = { ...replacementRun, run_id: "activity-unselected-replacement", rep: 1 };
      writeFileSync(join(extraReplacement, "run.json"), `${JSON.stringify(extraRun)}\n`);
      writeFileSync(join(extraReplacement, "events.jsonl"), `${JSON.stringify({ ...replacementEvent, run_id: extraRun.run_id })}\n`);
      expect(() => runActivityCrosscheck(args)).toThrow(/exactly.*selected|unselected/i);
      rmSync(extraReplacement, { recursive: true });
      const originalStateBinding = summary.binding.state_sha256;
      writeFileSync(statePath, `${readFileSync(statePath, "utf8")}\n`);
      expect(activityBinding(results, statePath, reruns, [replacementRun.run_id], replacementStatePath).state_sha256).not.toBe(originalStateBinding);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
