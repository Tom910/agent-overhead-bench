import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import assert from "node:assert/strict";
import test from "node:test";

const root = dirname(fileURLToPath(import.meta.url));

function run(script, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn("sh", [join(root, script), ...args], {
      cwd: join(root, ".."),
      env: { ...process.env, OPENROUTER_API_KEY: "", ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (code) => resolve({ code, stderr }));
  });
}

test("run-all rejects a cap above the official maximum before execution", async () => {
  const result = await run("run-all.sh", ["/tmp/aob-cap-boundary-run-all", "z-ai/glm-5.3-flash", "1"], { AOB_CAP_USD: "1500.01" });
  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /1500|cap/i);
});

test("S7 preflight rejects a cap above the official maximum before credentials", async () => {
  const result = await run("s7-preflight.sh", ["/tmp/aob-cap-boundary-preflight/results", "z-ai/glm-5.3-flash"], { AOB_CAP_USD: "1500.01" });
  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /1500|cap/i);
});

test("the direct runner CLI rejects a cap above the official maximum", async () => {
  const result = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [
      join(root, "../packages/runner/src/cli-wrapper.mjs"),
      "--mode", "host", "--tasks", "packages/tasks/suite/py-small-bugfix-1", "--tools", "mock-agent", "--reps", "1", "--cap-usd", "1500.01",
    ], {
      cwd: join(root, ".."),
      env: { ...process.env, OPENROUTER_API_KEY: "" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (code) => resolve({ code, stderr }));
  });
  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /1500|cap/i);
});

test("public budget instructions distinguish recorded spend from live billing", async () => {
  const help = await readFile(join(root, "run-all.sh"), "utf8");
  const methodology = await readFile(join(root, "../METHODOLOGY.md"), "utf8");
  assert.match(help, /recorded-spend cap/i);
  assert.match(methodology, /cannot cancel.*provider|provider.*cannot.*cancel/i);
});

test("Activity Export cross-check requires an explicit reviewed window", async () => {
  const result = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(root, "s7-activity-crosscheck.mjs"), "results", "missing.csv", "summary.json", "z-ai/glm-5.3-flash", "openrouter-2026-08-27"], {
      cwd: join(root, ".."),
      env: { ...process.env, OPENROUTER_API_KEY: "" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (code) => resolve({ code, stderr }));
  });
  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /usage|window/i);
});

test("Activity Export cross-check rejects an impossible calendar window before reading inputs", async () => {
  const result = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(root, "s7-activity-crosscheck.mjs"), "results", "missing.csv", "summary.json", "z-ai/glm-5.3-flash", "openrouter-2026-08-27", "state.json", "2026-02-31T00:00:00.000Z", "2026-03-01T00:00:00.000Z"], {
      cwd: join(root, ".."),
      env: { ...process.env, OPENROUTER_API_KEY: "" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (code) => resolve({ code, stderr }));
  });
  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /calendar|ISO|window/i);
});

test("S7 freeze rejects persisted spend above the official maximum", async () => {
  const temp = await mkdtemp(join(tmpdir(), "aob-cap-freeze-"));
  try {
    const cell = join(temp, "results", "pinned", "opencode", "py-small-bugfix-1", "rep-0");
    await mkdir(cell, { recursive: true });
    const fixture = join(root, "test-fixtures/cap-pinned-opencode");
    await cp(join(fixture, "run.json"), join(cell, "run.json"));
    await cp(join(fixture, "events.jsonl"), join(cell, "events.jsonl"));
    await cp(join(fixture, "stdout.log"), join(cell, "stdout.log"));
    await cp(join(fixture, "stderr.log"), join(cell, "stderr.log"));
    await cp(join(fixture, "verify.log"), join(cell, "verify.log"));
    const runRecord = JSON.parse(await readFile(join(cell, "run.json"), "utf8"));
    await writeFile(join(temp, "state.json"), JSON.stringify({
      version: 1, seed: 1, spentUsd: 1500.01,
      cells: [{ id: runRecord.run_id, tool: runRecord.tool, task_id: runRecord.task_id, condition: runRecord.condition, rep: runRecord.rep, status: "done", retries: 0 }],
    }));
    const result = await run("s7-freeze.sh", [join(temp, "results"), join(temp, "archive"), "1"], { AOB_ALLOW_NONOFFICIAL_FREEZE: "1" });
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /1500|spend|cap/i);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test("S7 freeze applies the official maximum to combined original and rerun accounting", async () => {
  const script = await readFile(join(root, "s7-freeze.sh"), "utf8");
  assert.match(script, /expectedLocal\.spend_usd\s*>\s*1500/);
  assert.match(script, /combined original and rerun spend/i);
});

test("official replacement freezes require a separately bound rerun window ledger", async () => {
  const script = await readFile(join(root, "s7-freeze.sh"), "utf8");
  assert.match(script, /RERUN_WINDOW_LEDGER/);
  assert.match(script, /rerun-state/);
  assert.match(script, /expectedRetryCounts/);
});

test("official S7 freeze requires and privately recomputes the raw Activity Export", async () => {
  const script = await readFile(join(root, "s7-freeze.sh"), "utf8");
  assert.match(script, /ACTIVITY_EXPORT=.*AOB_ACTIVITY_EXPORT/);
  assert.match(script, /official archive requires.*raw Activity Export/i);
  assert.match(script, /runActivityCrosscheck/);
  assert.doesNotMatch(script, /cp\s+"?\$ACTIVITY_EXPORT"?/);
  assert.doesNotMatch(script, /cp\s+"?\$ACTIVITY_SUMMARY"?/);
  assert.match(script, /\.validated-activity-summary\.json/);
});

test("S7 freeze rejects state and artifact spend divergence", async () => {
  const temp = await mkdtemp(join(tmpdir(), "aob-reconcile-freeze-"));
  try {
    const cell = join(temp, "results", "pinned", "opencode", "py-small-bugfix-1", "rep-0");
    await mkdir(cell, { recursive: true });
    const fixture = join(root, "test-fixtures/default-mock");
    await cp(fixture, cell, { recursive: true });
    const runRecord = JSON.parse(await readFile(join(cell, "run.json"), "utf8"));
    const spend = Number(runRecord.spend_usd_estimate ?? 0) + 0.01;
    await writeFile(join(temp, "state.json"), JSON.stringify({
      version: 1, seed: 1, spentUsd: spend,
      cells: [{ id: runRecord.run_id, tool: runRecord.tool, task_id: runRecord.task_id, condition: runRecord.condition, rep: runRecord.rep, status: "done", retries: 0 }],
    }));
    const result = await run("s7-freeze.sh", [join(temp, "results"), join(temp, "archive"), "1"], { AOB_ALLOW_NONOFFICIAL_FREEZE: "1" });
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /reconcile|artifact|spend/i);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

  test("S7 freeze counts current cells once when retry artifacts are preserved", async () => {
  const temp = await mkdtemp(join(tmpdir(), "aob-retry-freeze-"));
  try {
    const cell = join(temp, "results", "default", "mock-agent", "dry-run-1", "rep-0");
    await mkdir(cell, { recursive: true });
    const fixture = join(root, "test-fixtures/default-mock");
    await cp(fixture, cell, { recursive: true });
    const currentRunPath = join(cell, "run.json");
    const currentRun = JSON.parse(await readFile(currentRunPath, "utf8"));
    currentRun.adapter_result.artifacts.stdoutPath = join(cell, "stdout.log");
    currentRun.adapter_result.artifacts.stderrPath = join(cell, "stderr.log");
    await writeFile(currentRunPath, JSON.stringify(currentRun));
    const retry = join(cell, ".attempts", "attempt-0");
    await mkdir(retry, { recursive: true });
    await cp(currentRunPath, join(retry, "run.json"));
    for (const name of ["events.jsonl", "stdout.log", "stderr.log", "verify.log"]) {
      await cp(join(cell, name), join(retry, name));
    }
    const runRecord = currentRun;
    const spend = Number(runRecord.spend_usd_estimate ?? 0);
    await writeFile(join(temp, "state.json"), JSON.stringify({
      version: 1, seed: 1, spentUsd: spend * 2,
      cells: [{ id: runRecord.run_id, tool: runRecord.tool, task_id: runRecord.task_id, condition: runRecord.condition, rep: runRecord.rep, status: "done", retries: 1 }],
    }));
    const result = await run("s7-freeze.sh", [join(temp, "results"), join(temp, "archive"), "1"], { AOB_ALLOW_NONOFFICIAL_FREEZE: "1" });
    assert.equal(result.code, 0, result.stderr);
    await readFile(join(temp, "archive"));
    await readFile(join(temp, "archive.sha256"));
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
