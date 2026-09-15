import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const script = join(root, "scripts/s3-calibration-attestation.mjs");
const MODEL = "z-ai/glm-5.3-flash";
const PRICE_BOOK = "openrouter-2026-08-27";
const SOURCE_REPOSITORY = "https://github.com/datacurve-ai/deep-swe.git";
const SOURCE_REVISION = "a".repeat(40);
const TASKS = ["task-one", "task-two"];
const TOOLS = ["codex", "hermes"];

function digest(bytes) {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function sourceContentDigest(source) {
  const { review: _review, ...content } = source;
  return digest(Buffer.from(canonicalJson(content)));
}

function runRecord(tool, taskId, overrides = {}) {
  return {
    v: 1,
    run_id: `pinned:${tool}:${taskId}:0`,
    tool,
    task_id: taskId,
    task_source: "public-task-pack",
    task_repository: SOURCE_REPOSITORY,
    task_revision: SOURCE_REVISION,
    task_regime: "short",
    condition: "pinned",
    rep: 0,
    model: MODEL,
    price_book: PRICE_BOOK,
    outcome: "completed",
    verification: { exit: 0 },
    adapter_result: { exitCode: 0 },
    ...overrides,
  };
}

async function writeRun(rootDir, tool, taskId, record) {
  const directory = join(rootDir, "results", "pinned", tool, taskId, "rep-0");
  await mkdir(directory, { recursive: true });
  const bytes = Buffer.from(`${JSON.stringify(record)}\n`);
  await writeFile(join(directory, "run.json"), bytes);
  return {
    root_index: 0,
    path: `results/pinned/${tool}/${taskId}/rep-0/run.json`,
    kind: "final",
    attempt: null,
    run_id: record.run_id,
    tool: record.tool,
    task_id: record.task_id,
    task_source: record.task_source,
    task_repository: record.task_repository,
    condition: record.condition,
    rep: record.rep,
    task_revision: record.task_revision,
    task_regime: record.task_regime,
    model: record.model,
    price_book: record.price_book,
    outcome: record.outcome,
    verification_exit: record.verification.exit,
    adapter_exit_code: record.adapter_result.exitCode,
    spend_usd: 0.01,
    validation_issues: [],
    passed: true,
    run_sha256: digest(bytes),
  };
}

async function fixture(regime = "short", overrides = {}) {
  const directory = await mkdtemp(join(tmpdir(), "aob-attestation-"));
  const records = [];
  for (const taskId of TASKS) {
    for (const tool of TOOLS) records.push(await writeRun(directory, tool, taskId, runRecord(tool, taskId, { task_regime: regime, ...overrides })));
  }
  const rootHash = createHash("sha256");
  for (const record of [...records].sort((left, right) => left.path.localeCompare(right.path))) {
    rootHash.update(record.path);
    rootHash.update("\0");
    rootHash.update(await readFile(join(directory, record.path)));
    rootHash.update("\0");
  }
  const summaryPath = join(directory, "summary.json");
  await writeFile(summaryPath, JSON.stringify({ v: 1, roots: [{ root_index: 0, root_sha256: `sha256:${rootHash.digest("hex")}`, record_count: records.length }], records }, null, 2));
  const sourceManifestPath = join(directory, "source-manifest.json");
  await writeFile(sourceManifestPath, JSON.stringify({
    version: 1,
    source_adapter: "deepswe",
    repository: SOURCE_REPOSITORY,
    source_dataset: "deep-swe",
    revision: SOURCE_REVISION,
    review: { reviewed_task_ids: TASKS },
    tasks: TASKS.map((id) => ({ id })),
  }, null, 2));
  return { directory, summaryPath, sourceManifestPath };
}

function invoke(...args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script, ...args], { cwd: root });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("close", (status) => resolve({ status, stdout, stderr }));
  });
}

function commandPaths(fixtureValue, outPath, tools = TOOLS.join(","), regime = "short") {
  return [fixtureValue.summaryPath, fixtureValue.sourceManifestPath, "public-task-pack", MODEL, regime, "pinned", PRICE_BOOK, tools, "--root", fixtureValue.directory, "--out", outPath];
}

test("emits a portable attestation for every selected task with two distinct passing CLIs", async () => {
  const value = await fixture();
  const out = join(value.directory, "attestation.json");
  const result = await invoke(...commandPaths(value, out));
  assert.equal(result.status, 0, result.stderr);
  const attestation = JSON.parse(await readFile(out, "utf8"));
  assert.equal(attestation.v, 1);
  assert.deepEqual(attestation.selected_task_ids, TASKS);
  assert.deepEqual(attestation.included_tools, TOOLS);
  assert.equal(attestation.tasks.length, TASKS.length);
  const source = JSON.parse(await readFile(value.sourceManifestPath, "utf8"));
  assert.equal(attestation.source_manifest_sha256, sourceContentDigest(source));
  for (const task of attestation.tasks) {
    assert.deepEqual(task.qualifying_runs.map((run) => run.tool), TOOLS);
    assert.ok(task.qualifying_runs.every((run) => /^sha256:[0-9a-f]{64}$/.test(run.run_sha256)));
  }
});

test("ignores private workspace dependency symlinks while discovering attestation evidence", async () => {
  const value = await fixture();
  const workspace = join(value.directory, "results", "pinned", "codex", "task-one", "rep-0", "workspace");
  await mkdir(workspace, { recursive: true });
  await symlink(tmpdir(), join(workspace, "toolchain"));
  const result = await invoke(...commandPaths(value, join(value.directory, "attestation.json")));
  assert.equal(result.status, 0, result.stderr);
});

test("rejects a symlink used as the private workspace boundary", async () => {
  const value = await fixture();
  const workspace = join(value.directory, "results", "pinned", "codex", "task-one", "rep-0", "workspace");
  await symlink(tmpdir(), workspace);
  const result = await invoke(...commandPaths(value, join(value.directory, "attestation.json")));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /symlink/i);
});

test("rejects an attestation when a selected task has only one passing CLI", async () => {
  const value = await fixture();
  const summary = JSON.parse(await readFile(value.summaryPath, "utf8"));
  summary.records = summary.records.filter((record) => !(record.task_id === "task-two" && record.tool === "hermes"));
  await writeFile(value.summaryPath, JSON.stringify(summary));
  const result = await invoke(...commandPaths(value, join(value.directory, "attestation.json")));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /two distinct|two-cli|task-two/i);
});

test("rejects stale run digests and mixed calibration identities", async () => {
  const value = await fixture();
  const summary = JSON.parse(await readFile(value.summaryPath, "utf8"));
  summary.records[0].run_sha256 = digest(Buffer.from("stale"));
  const mixed = summary.records.find((record) => record.task_id === "task-two" && record.tool === "hermes");
  mixed.model = "z-ai/other-model";
  await writeFile(value.summaryPath, JSON.stringify(summary));
  const result = await invoke(...commandPaths(value, join(value.directory, "attestation.json")));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /digest|identity|model/i);
});

test("rejects task-source or source-revision identity drift", async () => {
  const sourceDrift = await fixture();
  const sourceSummary = JSON.parse(await readFile(sourceDrift.summaryPath, "utf8"));
  sourceSummary.records[0].task_source = "different-source";
  await writeFile(sourceDrift.summaryPath, JSON.stringify(sourceSummary));
  const sourceResult = await invoke(...commandPaths(sourceDrift, join(sourceDrift.directory, "attestation.json")));
  assert.notEqual(sourceResult.status, 0);
  assert.match(sourceResult.stderr, /task_source/i);

  const revisionDrift = await fixture();
  const revisionSummary = JSON.parse(await readFile(revisionDrift.summaryPath, "utf8"));
  revisionSummary.records[0].task_revision = "b".repeat(40);
  await writeFile(revisionDrift.summaryPath, JSON.stringify(revisionSummary));
  const revisionResult = await invoke(...commandPaths(revisionDrift, join(revisionDrift.directory, "attestation.json")));
  assert.notEqual(revisionResult.status, 0);
  assert.match(revisionResult.stderr, /task_revision/i);
});

test("rejects missing selected tasks and duplicate declared CLIs", async () => {
  const missing = await fixture();
  const source = JSON.parse(await readFile(missing.sourceManifestPath, "utf8"));
  source.review.reviewed_task_ids.push("missing-task");
  await writeFile(missing.sourceManifestPath, JSON.stringify(source));
  const missingResult = await invoke(...commandPaths(missing, join(missing.directory, "attestation.json")));
  assert.notEqual(missingResult.status, 0);
  assert.match(missingResult.stderr, /absent|source manifest|missing/i);

  const duplicate = await fixture();
  const duplicateResult = await invoke(...commandPaths(duplicate, join(duplicate.directory, "attestation.json"), "codex,codex"));
  assert.notEqual(duplicateResult.status, 0);
  assert.match(duplicateResult.stderr, /unique|duplicate/i);
});

test("rejects a missing run file and an unselected tool", async () => {
  const value = await fixture();
  const summary = JSON.parse(await readFile(value.summaryPath, "utf8"));
  await rm(join(value.directory, summary.records[0].path));
  await writeFile(value.summaryPath, JSON.stringify(summary));
  const missing = await invoke(...commandPaths(value, join(value.directory, "attestation.json")));
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /run file|missing|digest|path|root/i);

  const second = await fixture();
  const extra = await writeRun(second.directory, "aider", "task-one", runRecord("aider", "task-one"));
  const extraSummary = JSON.parse(await readFile(second.summaryPath, "utf8"));
  extraSummary.records.push(extra);
  const extraRootHash = createHash("sha256");
  for (const record of [...extraSummary.records].sort((left, right) => left.path.localeCompare(right.path))) {
    extraRootHash.update(record.path);
    extraRootHash.update("\0");
    extraRootHash.update(await readFile(join(second.directory, record.path)));
    extraRootHash.update("\0");
  }
  extraSummary.roots[0].root_sha256 = `sha256:${extraRootHash.digest("hex")}`;
  extraSummary.roots[0].record_count = extraSummary.records.length;
  await writeFile(second.summaryPath, JSON.stringify(extraSummary));
  const unselected = await invoke(...commandPaths(second, join(second.directory, "attestation.json")));
  assert.notEqual(unselected.status, 0);
  assert.match(unselected.stderr, /included|unexpected|tool/i);
});

test("attests an extended-regime calibration and still rejects a regime mismatch", async () => {
  // An extended calibration was unattestable: the REGIME argument accepted only
  // short and long, so calibration_complete could never be set for a release
  // run in the extended regime.
  const value = await fixture("extended");
  const out = join(value.directory, "attestation-extended.json");
  const result = await invoke(...commandPaths(value, out, TOOLS.join(","), "extended"));
  assert.equal(result.status, 0, result.stderr);
  const attestation = JSON.parse(await readFile(out, "utf8"));
  assert.equal(attestation.task_regime, "extended");

  // The declared regime must still match the recorded runs.
  const mismatch = await invoke(...commandPaths(value, join(value.directory, "mismatch.json"), TOOLS.join(","), "long"));
  assert.notEqual(mismatch.status, 0);

  // And an unknown regime is still refused.
  const unknown = await invoke(...commandPaths(value, join(value.directory, "unknown.json"), TOOLS.join(","), "overnight"));
  assert.notEqual(unknown.status, 0);
  assert.match(unknown.stderr, /REGIME must be short, long, or extended/);
});

test("rejects compatibility calibration despite matching raw hashes", async () => {
  const f = await fixture("short", { tool_configuration: "claude-code-no-web-search" });
  const result = await invoke(...commandPaths(f, join(f.directory, "attestation.json")));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /compatibility/);
});
