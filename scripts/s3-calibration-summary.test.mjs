import { mkdtemp, mkdir, symlink, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

const root = fileURLToPath(new URL("..", import.meta.url));
const script = join(root, "scripts/s3-calibration-summary.mjs");

function runSummary(...args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script, ...args], { cwd: root, encoding: "utf8" });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("close", (status) => resolve({ status, stdout, stderr }));
  });
}

function runRecord(overrides = {}) {
  return {
    v: 1,
    run_id: "pinned:codex:task-one:0",
    tool: "codex",
    task_id: "task-one",
    task_source: "deep-swe",
    task_repository: "https://github.com/example/repo.git",
    task_revision: "source-revision",
    task_regime: "short",
    condition: "pinned",
    rep: 0,
    model: "z-ai/glm-5.3-flash",
    price_book: "openrouter-2026-08-27",
    verification: { exit: 0 },
    adapter_result: { exitCode: 0 },
    spend_usd_estimate: 0.12,
    outcome: "completed",
    ...overrides,
  };
}

test("summarizes final and retry C4 records without reading private artifacts", async () => {
  const output = await mkdtemp(join(tmpdir(), "aob-summary-"));
  const results = join(output, "results", "pinned", "codex", "task-one", "rep-0");
  const retry = join(results, ".attempts", "attempt-0");
  const other = join(output, "results", "pinned", "hermes", "task-one", "rep-0");
  await mkdir(retry, { recursive: true });
  await mkdir(other, { recursive: true });
  await writeFile(join(output, "state.json"), JSON.stringify({ spentUsd: 0.42 }));
  await writeFile(join(results, "run.json"), JSON.stringify(runRecord()));
  await writeFile(join(retry, "run.json"), JSON.stringify(runRecord({ outcome: "timeout", verification: { exit: 1 }, adapter_result: { exitCode: 124 }, spend_usd_estimate: 0.2 })));
  await writeFile(join(other, "run.json"), JSON.stringify(runRecord({ run_id: "pinned:hermes:task-one:0", tool: "hermes", outcome: "verify_error", verification: { exit: 1 }, spend_usd_estimate: 0.1 })));
  await writeFile(join(results, "prompt.md"), "do not include this private prompt");

  const summary = await runSummary(output);
  assert.equal(summary.status, 0, summary.stderr);
  const data = JSON.parse(summary.stdout);
  assert.equal(data.v, 1);
  assert.equal(data.state_spent_usd, 0.42);
  assert.equal(data.records.length, 3);
  assert.match(data.records[0].run_sha256, /^sha256:[0-9a-f]{64}$/);
  assert.match(data.roots[0].root_sha256, /^sha256:[0-9a-f]{64}$/);
  assert.equal(data.records[0].attempt, null);
  assert.equal(data.records[1].attempt, 0);
  assert.equal(data.candidates.length, 1);
  assert.deepEqual(data.candidates[0].tools, [
    { tool: "codex", attempts: 2, passed: false, outcomes: { completed: 1, timeout: 1 }, spend_usd: 0.32 },
    { tool: "hermes", attempts: 1, passed: false, outcomes: { verify_error: 1 }, spend_usd: 0.1 },
  ]);
  assert.equal(data.candidates[0].two_cli_pass, false);
  assert.equal(data.candidates[0].calibration_groups.length, 1);
  assert.deepEqual(data.candidates[0].calibration_groups[0].identity, {
    task_id: "task-one",
    task_source: "deep-swe",
    task_repository: "https://github.com/example/repo.git",
    task_revision: "source-revision",
    task_regime: "short",
    model: "z-ai/glm-5.3-flash",
    condition: "pinned",
    price_book: "openrouter-2026-08-27",
  });
  assert.doesNotMatch(summary.stdout, /private prompt/);
});

test("ignores workspace dependency symlinks while discovering C4 records", async () => {
  const output = await mkdtemp(join(tmpdir(), "aob-summary-workspace-links-"));
  const result = join(output, "results", "pinned", "codex", "task-one", "rep-0");
  await mkdir(join(result, "workspace"), { recursive: true });
  await symlink(tmpdir(), join(result, "workspace", "toolchain"));
  await writeFile(join(result, "run.json"), JSON.stringify(runRecord({ outcome: "timeout", verification: { exit: 124 }, adapter_result: { exitCode: 124 } })));

  const summary = await runSummary(output);
  assert.equal(summary.status, 0, summary.stderr);
  const data = JSON.parse(summary.stdout);
  assert.equal(data.records.length, 1);
  assert.equal(data.records[0].outcome, "timeout");
});

test("rejects a symlink used as the private workspace boundary", async () => {
  const output = await mkdtemp(join(tmpdir(), "aob-summary-workspace-link-"));
  const result = join(output, "results", "pinned", "codex", "task-one", "rep-0");
  await mkdir(result, { recursive: true });
  await symlink(tmpdir(), join(result, "workspace"));
  await writeFile(join(result, "run.json"), JSON.stringify(runRecord()));

  const summary = await runSummary(output);
  assert.notEqual(summary.status, 0);
  assert.match(summary.stderr, /symlink/i);
});

test("does not combine passes from incompatible calibration identities", async () => {
  const output = await mkdtemp(join(tmpdir(), "aob-summary-identity-"));
  const codex = join(output, "results", "pinned", "codex", "task-one", "rep-0");
  const hermes = join(output, "results", "pinned", "hermes", "task-one", "rep-0");
  await mkdir(codex, { recursive: true });
  await mkdir(hermes, { recursive: true });
  await writeFile(join(codex, "run.json"), JSON.stringify(runRecord()));
  await writeFile(join(hermes, "run.json"), JSON.stringify(runRecord({
    run_id: "pinned:hermes:task-one:0",
    model: "z-ai/other-model",
  })));

  const summary = await runSummary(output);
  assert.equal(summary.status, 0, summary.stderr);
  const data = JSON.parse(summary.stdout);
  assert.equal(data.candidates[0].two_cli_pass, false);
  assert.equal(data.candidates[0].calibration_groups.length, 2);
  assert.equal(data.candidates[0].calibration_groups.every((group) => group.tools.length === 1), true);
});

test("does not summarize a C4 record without calibration identity fields", async () => {
  const output = await mkdtemp(join(tmpdir(), "aob-summary-invalid-"));
  const result = join(output, "results", "pinned", "codex", "task-one", "rep-0");
  await mkdir(result, { recursive: true });
  const record = runRecord();
  delete record.model;
  await writeFile(join(result, "run.json"), JSON.stringify(record));

  const summary = await runSummary(output);
  assert.notEqual(summary.status, 0);
  assert.match(summary.stderr, /model/);
});

test("marks a completed record as passed only with complete bound evidence", async () => {
  const output = await mkdtemp(join(tmpdir(), "aob-summary-valid-"));
  const result = join(output, "results", "pinned", "codex", "task-one", "rep-0");
  await mkdir(result, { recursive: true });
  const agentDigest = `sha256:${"a".repeat(64)}`;
  const verifierDigest = `sha256:${"b".repeat(64)}`;
  const baseRevision = "c".repeat(40);
  const upstreamRevision = "d".repeat(40);
  const run = runRecord({
    task_source: "public-task-pack",
    task_revision: "source-revision",
    task_base_revision: baseRevision,
    tool_version: "codex-cli 0.149.1",
    ori_version: null,
    tool_visibility: "none",
    anchors: {
      adapter: { wall_clock_iso: "2026-08-31T00:00:00.000Z", monotonic_zero: 0 },
      proxy: { wall_clock_iso: "2026-08-31T00:00:00.000Z", monotonic_zero: 0 },
    },
    adapter_result: {
      exitCode: 0,
      tStart: 0,
      tEnd: 100,
      anchor: { wall_clock_iso: "2026-08-31T00:00:00.000Z", monotonic_zero: 0 },
      artifacts: { stdoutPath: "stdout.log", stderrPath: "stderr.log" },
    },
    events_file: "events.jsonl",
    verification: { exit: 0, duration_ms: 1, logPath: "verify.log" },
    container: { image_digest: agentDigest, verifier_image_digest: verifierDigest, started_iso: "2026-08-31T00:00:00.000Z" },
    task_environment: { kind: "prepared-local", network: "disabled", agent_image: "aob-task-codex:calibration", agent_image_digest: agentDigest },
    host: { os: "darwin", cpu: "arm64", ram_gb: 16 },
  });
  await writeFile(join(result, "run.json"), JSON.stringify(run));
  await writeFile(join(result, "verify.log"), "native verifier passed\n");
  const successfulEvent = {
    v: 1, run_id: run.run_id, seq: 0, t_req_start: 1, t_req_body_end: 2, t_upstream_sent: 2,
    t_first_byte: 3, t_last_byte: 6, duration_ms: 5, method: "POST", path: "/v1/chat/completions",
    protocol: "openai_chat", model_requested: run.model, model_served: null, status: 200,
    streamed: false, usage: null, usage_source: "unavailable", error: null,
  };
  const networkFailureEvent = {
    ...successfulEvent,
    seq: 1,
    t_req_start: 7,
    t_req_body_end: 8,
    t_upstream_sent: 8,
    t_first_byte: 9,
    t_last_byte: 10,
    duration_ms: 3,
    status: 0,
    error: { kind: "network", detail: "connection reset" },
  };
  await writeFile(join(result, "events.jsonl"), `${[successfulEvent, networkFailureEvent].map((event) => JSON.stringify(event)).join("\n")}\n`);
  await writeFile(join(output, "deepswe-source-manifest.json"), JSON.stringify({
    version: 1,
    source_adapter: "deepswe",
    repository: run.task_repository,
    revision: run.task_revision,
    tasks: [{
      id: run.task_id,
      upstream_revision: upstreamRevision,
      workspace_revision: baseRevision,
      agent_images: { codex: { image_digest: agentDigest } },
      verifier_image_digest: verifierDigest,
    }],
  }));

  const summary = await runSummary(output);
  assert.equal(summary.status, 0, summary.stderr);
  const data = JSON.parse(summary.stdout);
  assert.equal(data.records[0].validation_issues.length, 0);
  assert.equal(data.records[0].passed, true);
  assert.equal(data.candidates[0].two_cli_pass, false);
});

test("summarizes an extended-regime record instead of rejecting its enum", async () => {
  // The C4 enum check and the record validator both accepted only short and
  // long, so an extended calibration could not be summarized at all - and
  // without a summary there is no attestation and no calibration_complete.
  const output = await mkdtemp(join(tmpdir(), "aob-summary-extended-"));
  for (const tool of ["codex", "hermes"]) {
    const directory = join(output, "results", "pinned", tool, "task-one", "rep-0");
    await mkdir(directory, { recursive: true });
    const record = runRecord({ tool, run_id: `pinned:${tool}:task-one:0`, task_regime: "extended" });
    await writeFile(join(directory, "run.json"), `${JSON.stringify(record)}\n`);
  }

  const summary = await runSummary(output);
  assert.equal(summary.status, 0, summary.stderr);
  const data = JSON.parse(summary.stdout);
  const group = data.candidates[0].calibration_groups[0];
  assert.equal(group.identity.task_regime, "extended");
  // Both records were discovered and grouped rather than dropped as invalid.
  // They are not `passed` here only because this deliberately minimal fixture
  // carries no bound events/verifier evidence, which is a separate gate.
  assert.deepEqual(group.tools.map((entry) => entry.tool).sort(), ["codex", "hermes"]);
  for (const entry of group.tools) {
    assert.equal(entry.attempts, 1);
    assert.deepEqual(entry.outcomes, { completed: 1 });
  }
});

test("rejects compatibility C4 instead of erasing its calibration condition", async () => {
  const output = await mkdtemp(join(tmpdir(), "aob-compat-calibration-"));
  await writeFile(join(output, "run.json"), JSON.stringify(runRecord({ tool: "claude-code", tool_configuration: "claude-code-no-web-search" })));
  const summary = await runSummary(output);
  assert.notEqual(summary.status, 0);
  assert.match(summary.stderr, /compatibility/);
});
