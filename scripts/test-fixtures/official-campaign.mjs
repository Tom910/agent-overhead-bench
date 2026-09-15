import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { chmod, cp, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { dirname, join, relative } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL("../..", import.meta.url));
export const MODEL = "z-ai/glm-5.3-flash";
export const PRICE_BOOK = "openrouter-2026-08-27";
export const SOURCE_REPOSITORY = "https://example.invalid/aob-task-pack.git";
export const SOURCE_REVISION = "a".repeat(40);
const LICENSE = "MIT test task pack";
export const SPEND_PER_CELL = 0.00000125;
// Derive the fixture's adapters from the official scope rather than freezing a
// lineup here. These tests assert freeze/archive behaviour, not which tools are
// in the profile, and a hardcoded list silently breaks every time the scope
// changes - which is exactly what happened when aider was removed.
export const TOOLS = JSON.parse(readFileSync(join(root, "plans", "s7-official-tool-scope.json"), "utf8")).tools;
const EXPECTED_CELLS = String(8 * TOOLS.length * 4);

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

export function sourceContentSha256(value) {
  const { review: _review, ...content } = value;
  return `sha256:${createHash("sha256").update(canonicalJson(content)).digest("hex")}`;
}

export async function taskChecksum(directory) {
  const files = [];
  const visit = async (current) => {
    for (const name of (await readdir(current)).sort()) {
      const path = join(current, name);
      const info = await stat(path);
      if (info.isDirectory()) await visit(path);
      else if (info.isFile()) files.push(path);
    }
  };
  await visit(directory);
  const digest = createHash("sha256");
  for (const file of files) {
    digest.update(relative(directory, file).replaceAll("\\", "/"));
    digest.update("\0");
    digest.update(await readFile(file));
    digest.update("\0");
  }
  return `sha256:${digest.digest("hex")}`;
}

export async function createTaskPack(rootDir) {
  const prepared = [];
  const sourceTasks = [];
  for (let index = 0; index < 8; index++) {
    const id = `official-task-${index + 1}`;
    const language = index < 4 ? "python" : "typescript";
    const shape = index % 3 === 0 ? "bugfix" : index % 3 === 1 ? "feature" : "refactor";
    const size = index < 2 ? "medium" : "small";
    const taskDir = join(rootDir, id);
    await mkdir(join(taskDir, "workspace"), { recursive: true });
    await writeFile(join(taskDir, "task.yaml"), `id: ${id}
source:
  kind: public-task-pack
  repository: ${SOURCE_REPOSITORY}
  revision: ${SOURCE_REVISION}
  task_id: ${id}
  license_notes: ${LICENSE}
language: ${language}
size: ${size}
shape: ${shape}
timeout_s: 300
expected_minutes: [1, 5]
description: official fixture task
`);
    await writeFile(join(taskDir, "prompt.md"), "Make the measured fixture change.\n");
    await writeFile(join(taskDir, "verify.sh"), "#!/bin/sh\nexit 1\n");
    await chmod(join(taskDir, "verify.sh"), 0o755);
    await writeFile(join(taskDir, "workspace", language === "python" ? "main.py" : "main.ts"), "export const value = 1;\n");
    const checksum = await taskChecksum(taskDir);
    const task = {
      id, path: id, source_task_id: id, language, shape, size, timeout_s: 300,
      expected_minutes: [1, 5], test_runners: [language === "python" ? "python-basic" : "node-basic"], checksum,
    };
    sourceTasks.push(task);
    prepared.push({ id, source: { kind: "public-task-pack", repository: SOURCE_REPOSITORY, revision: SOURCE_REVISION, task_id: id, license_notes: LICENSE }, checksum });
  }
  const review = {
    source_reviewed: true, reference_results_verified: true, calibration_complete: true, maintainer_signed_off: true,
    reviewer: "fixture-maintainer", reviewed_at: "2026-08-30T00:00:00.000Z", evidence_file: "review-evidence.json",
    evidence_sha256: "", reviewed_task_ids: sourceTasks.map((task) => task.id), calibration_adapters: [TOOLS[0], TOOLS[1]],
  };
  const reviewEvidence = {
    source_repository: SOURCE_REPOSITORY, source_revision: SOURCE_REVISION,
    reviewer: review.reviewer, reviewed_at: review.reviewed_at,
    review: {
      source_reviewed: review.source_reviewed, reference_results_verified: review.reference_results_verified,
      calibration_complete: review.calibration_complete, maintainer_signed_off: review.maintainer_signed_off,
    },
    selected_task_ids: review.reviewed_task_ids, calibration_adapters: review.calibration_adapters,
  };
  const reviewEvidenceBytes = `${JSON.stringify(reviewEvidence, null, 2)}\n`;
  review.evidence_sha256 = `sha256:${createHash("sha256").update(reviewEvidenceBytes).digest("hex")}`;
  await writeFile(join(rootDir, review.evidence_file), reviewEvidenceBytes);
  const sourceManifest = { version: 1, source_adapter: "git-taskpack", repository: SOURCE_REPOSITORY, revision: SOURCE_REVISION, license_notes: LICENSE, review, tasks: sourceTasks };
  const sourceManifestSha256 = `sha256:${createHash("sha256").update(canonicalJson(sourceManifest)).digest("hex")}`;
  const { review: _review, ...sourceContent } = sourceManifest;
  const sourceContentSha256 = `sha256:${createHash("sha256").update(canonicalJson(sourceContent)).digest("hex")}`;
  const taskManifest = {
    version: 1, source_adapter: "local-prepared", source_provenance: {
      source_adapter: "git-taskpack", repository: SOURCE_REPOSITORY, revision: SOURCE_REVISION, license_notes: LICENSE,
      source_manifest_sha256: sourceManifestSha256, review,
    },
    tasks: prepared.map((entry) => ({ ...entry, preparation: "copy-task-yaml-prompt-workspace-verifier", source_binding: { path: entry.id, source_task_id: entry.id, source_checksum: entry.checksum } })),
  };
  const sourcePath = join(rootDir, "source-manifest.json");
  const taskPath = join(rootDir, "task-manifest.json");
  await writeFile(sourcePath, `${JSON.stringify(sourceManifest, null, 2)}\n`);
  await writeFile(taskPath, `${JSON.stringify(taskManifest, null, 2)}\n`);
  return { sourcePath, taskPath, taskIds: sourceTasks.map((task) => task.id) };
}

export async function createOfficialRun(rootDir, tool, taskId, rep, offsetMs = 0) {
  const cell = join(rootDir, "results", "pinned", tool, taskId, `rep-${rep}`);
  await mkdir(cell, { recursive: true });
  const runId = `pinned:${tool}:${taskId}:${rep}`;
  const digest = `sha256:${"a".repeat(64)}`;
  const anchorIso = new Date(Date.parse("2026-08-30T00:00:00.000Z") + offsetMs).toISOString();
  const run = {
    v: 1, run_id: runId, tool, tool_version: `fixture-${tool}`, task_id: taskId, task_source: "public-task-pack",
    task_repository: SOURCE_REPOSITORY, task_revision: SOURCE_REVISION, task_regime: "short", condition: "pinned", rep,
    model: MODEL, ori_version: null, tool_visibility: "partial",
    anchors: { adapter: { wall_clock_iso: anchorIso, monotonic_zero: 0 }, proxy: { wall_clock_iso: anchorIso, monotonic_zero: 0 } },
    adapter_result: { exitCode: 0, tStart: 0, tEnd: 100, anchor: { wall_clock_iso: anchorIso, monotonic_zero: 0 }, artifacts: { stdoutPath: "stdout.log", stderrPath: "stderr.log" } },
    events_file: "events.jsonl", verification: { exit: 0, duration_ms: 1, logPath: "verify.log" },
    container: { image_digest: digest, verifier_image_digest: digest, started_iso: anchorIso },
    task_environment: { kind: "prepared-task-pack", network: "disabled" }, host: { os: "linux", cpu: "x86_64", ram_gb: 16 },
    spend_usd_estimate: SPEND_PER_CELL, price_book: PRICE_BOOK, outcome: "completed",
  };
  const event = { v: 1, run_id: runId, seq: 0, t_req_start: 10, t_req_body_end: 11, t_upstream_sent: 12, t_first_byte: 20, t_last_byte: 30, duration_ms: 20, method: "POST", path: "/v1/responses", protocol: "openai_responses", model_requested: MODEL, model_served: null, status: 200, streamed: false, usage: { input: 10, cached_input: 0, output: 2, reasoning_output: 0 }, usage_source: "response_body", error: null };
  await writeFile(join(cell, "run.json"), `${JSON.stringify(run)}\n`);
  await writeFile(join(cell, "events.jsonl"), `${JSON.stringify(event)}\n`);
  await writeFile(join(cell, "stdout.log"), "fixture stdout\n");
  await writeFile(join(cell, "stderr.log"), "fixture stderr\n");
  await writeFile(join(cell, "verify.log"), "fixture verified\n");
  return { id: runId, tool, task_id: taskId, condition: "pinned", rep, status: "done", retries: 0 };
}

export async function bindCalibrationReview(rootDir, sourcePath, taskPath, taskIds) {
  const source = JSON.parse(await readFile(sourcePath, "utf8"));
  const tools = [TOOLS[0], TOOLS[1]];
  const qualifying = [];
  const summaryRecords = [];
  for (const taskId of taskIds) {
    const runs = [];
    for (const tool of tools) {
      const path = join(rootDir, "results", "pinned", tool, taskId, "rep-0", "run.json");
      const bytes = await readFile(path);
      const run = JSON.parse(bytes);
      runs.push({
        tool, run_id: run.run_id, run_sha256: `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
        root_index: 0, path: relative(rootDir, path).replaceAll("\\", "/"),
        identity: {
          task_id: taskId, task_source: run.task_source, task_repository: run.task_repository,
          task_revision: run.task_revision, task_regime: run.task_regime, model: run.model,
          condition: run.condition, price_book: run.price_book,
        },
      });
      summaryRecords.push({
        root_index: 0, path: relative(rootDir, path).replaceAll("\\", "/"), kind: "final", attempt: null,
        run_id: run.run_id, tool: run.tool, task_id: run.task_id, task_source: run.task_source,
        task_repository: run.task_repository, task_revision: run.task_revision, task_regime: run.task_regime,
        condition: run.condition, rep: run.rep, model: run.model, price_book: run.price_book,
        outcome: run.outcome, verification_exit: run.verification.exit, adapter_exit_code: run.adapter_result.exitCode,
        spend_usd: run.spend_usd_estimate, validation_issues: [], passed: true,
        run_sha256: `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
      });
    }
    qualifying.push({ task_id: taskId, identity: runs[0].identity, qualifying_runs: runs });
  }
  const calibrationSummary = { v: 1, roots: [{ root_index: 0, root_sha256: `sha256:${"f".repeat(64)}`, record_count: summaryRecords.length }], records: summaryRecords };
  const calibrationSummaryBytes = `${JSON.stringify(calibrationSummary, null, 2)}\n`;
  const calibrationSummaryPath = join(dirname(sourcePath), "calibration-summary.json");
  await writeFile(calibrationSummaryPath, calibrationSummaryBytes);
  const attestation = {
    v: 1, source_adapter: source.source_adapter, source_repository: source.repository,
    source_revision: source.revision, task_source: "public-task-pack", model: MODEL,
    task_regime: "short", condition: "pinned", price_book: PRICE_BOOK,
    included_tools: tools, selected_task_ids: taskIds, calibration_summary_sha256: `sha256:${createHash("sha256").update(calibrationSummaryBytes).digest("hex")}`,
    source_manifest_sha256: sourceContentSha256(source), tasks: qualifying,
  };
  const attestationBytes = `${JSON.stringify(attestation, null, 2)}\n`;
  const attestationPath = join(dirname(sourcePath), "calibration-attestation.json");
  await writeFile(attestationPath, attestationBytes);
  const attestationSha256 = `sha256:${createHash("sha256").update(attestationBytes).digest("hex")}`;
  const review = { ...source.review, calibration_attestation_file: "calibration-attestation.json", calibration_attestation_sha256: attestationSha256 };
  const reviewEvidence = {
    source_repository: source.repository, source_revision: source.revision, reviewer: review.reviewer, reviewed_at: review.reviewed_at,
    review: {
      source_reviewed: review.source_reviewed, reference_results_verified: review.reference_results_verified,
      calibration_complete: review.calibration_complete, maintainer_signed_off: review.maintainer_signed_off,
      calibration_attestation_file: review.calibration_attestation_file, calibration_attestation_sha256: review.calibration_attestation_sha256,
    },
    selected_task_ids: review.reviewed_task_ids, calibration_adapters: review.calibration_adapters,
  };
  const reviewEvidenceBytes = `${JSON.stringify(reviewEvidence, null, 2)}\n`;
  review.evidence_sha256 = `sha256:${createHash("sha256").update(reviewEvidenceBytes).digest("hex")}`;
  await writeFile(join(dirname(sourcePath), review.evidence_file), reviewEvidenceBytes);
  source.review = review;
  await writeFile(sourcePath, `${JSON.stringify(source, null, 2)}\n`);
  const taskManifest = JSON.parse(await readFile(taskPath, "utf8"));
  taskManifest.source_provenance.review = review;
  taskManifest.source_provenance.source_manifest_sha256 = `sha256:${createHash("sha256").update(canonicalJson(source)).digest("hex")}`;
  await writeFile(taskPath, `${JSON.stringify(taskManifest, null, 2)}\n`);
  return { attestationPath, calibrationSummaryPath };
}

export async function createRunWindowLedger(rootDir, cells, statePath) {
  const digest = (value) => `sha256:${createHash("sha256").update(value).digest("hex")}`;
  const files = [];
  const visit = async (directory) => {
    for (const name of (await readdir(directory)).sort()) {
      const path = join(directory, name);
      const info = await stat(path);
      if (info.isDirectory()) {
        if (name !== "workspace") await visit(path);
      } else if (info.isFile()) files.push(path);
    }
  };
  const results = join(rootDir, "results");
  await visit(results);
  const entries = [];
  const runIds = [];
  for (const path of files) {
    const bytes = await readFile(path);
    const relativePath = relative(results, path).replaceAll("\\", "/");
    entries.push({ path: relativePath, sha256: digest(bytes) });
    if (relativePath.endsWith("/run.json")) runIds.push(JSON.parse(bytes).run_id);
  }
  entries.sort((left, right) => left.path.localeCompare(right.path));
  runIds.sort();
  const start = Date.parse("2026-08-30T00:00:00.000Z");
  const iso = (ms) => new Date(start + ms).toISOString();
  const attempts = cells.map((cell, index) => ({ id: `segment-0:attempt-${index}`, cell_id: cell.id, run_id: cell.id, kind: "current", start_ms: index * 200, end_ms: index * 200 + 100, start_iso: iso(index * 200), end_iso: iso(index * 200 + 100), status: "completed" }));
  const host = { os: "linux", cpu: "x86_64", ram_gb: 16, docker: "28.0.0;fixture", image_digests: [`sha256:${"a".repeat(64)}`] };
  const ledger = {
    version: 1, session_id: "session-official-fixture", anchor: { wall_clock_iso: "2026-08-30T00:00:00.000Z", monotonic_zero: 0 },
    window: { start_iso: iso(0), end_iso: iso(cells.length * 200) }, host_start: host, host_end: host,
    matrix_definition_sha256: `sha256:${"b".repeat(64)}`,
    segments: [{ id: "segment-0", anchor: { wall_clock_iso: "2026-08-30T00:00:00.000Z", monotonic_zero: 0 }, start_ms: 0, end_ms: cells.length * 200, start_iso: iso(0), end_iso: iso(cells.length * 200), attempts }],
    results_binding: { run_ids_sha256: digest(JSON.stringify(runIds)), results_bytes_sha256: digest(JSON.stringify(entries)) },
    state_sha256: digest(await readFile(statePath)), replacement_state_sha256: null,
  };
  await mkdir(join(rootDir, "provenance"), { recursive: true });
  await writeFile(join(rootDir, "provenance", "run-window-ledger.json"), `${JSON.stringify(ledger, null, 2)}\n`);
}

export async function createReplacementLedger(rootDir, resultsRoot, statePath, run) {
  const digest = (value) => `sha256:${createHash("sha256").update(value).digest("hex")}`;
  const entries = [];
  const runIds = [];
  const visit = async (directory) => {
    for (const name of (await readdir(directory)).sort()) {
      const path = join(directory, name);
      const info = await stat(path);
      if (info.isDirectory()) await visit(path);
      else if (info.isFile()) {
        const relativePath = relative(resultsRoot, path).replaceAll("\\", "/");
        entries.push({ path: relativePath, sha256: digest(await readFile(path)) });
        if (relativePath.endsWith("/run.json")) runIds.push(JSON.parse(await readFile(path, "utf8")).run_id);
      }
    }
  };
  await visit(resultsRoot);
  entries.sort((left, right) => left.path.localeCompare(right.path));
  runIds.sort();
  const start = Date.parse(run.anchors.adapter.wall_clock_iso);
  const iso = (ms) => new Date(start + ms).toISOString();
  const host = { os: "linux", cpu: "x86_64", ram_gb: 16, docker: "28.0.0;fixture", image_digests: [`sha256:${"a".repeat(64)}`] };
  const ledger = {
    version: 1, session_id: "session-rerun-fixture", anchor: { wall_clock_iso: run.anchors.adapter.wall_clock_iso, monotonic_zero: 0 },
    window: { start_iso: iso(0), end_iso: iso(200) }, host_start: host, host_end: host,
    matrix_definition_sha256: `sha256:${"b".repeat(64)}`,
    segments: [{ id: "segment-0", anchor: { wall_clock_iso: run.anchors.adapter.wall_clock_iso, monotonic_zero: 0 }, start_ms: 0, end_ms: 200, start_iso: iso(0), end_iso: iso(200), attempts: [{ id: "segment-0:attempt-0", cell_id: run.run_id, run_id: run.run_id, kind: "current", start_ms: 0, end_ms: 100, start_iso: iso(0), end_iso: iso(100), status: "completed" }] }],
    results_binding: { run_ids_sha256: digest(JSON.stringify(runIds)), results_bytes_sha256: digest(JSON.stringify(entries)) },
    state_sha256: digest(await readFile(statePath)), replacement_state_sha256: null,
  };
  const ledgerPath = join(rootDir, "rerun-ledger.json");
  await writeFile(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);
  return ledgerPath;
}

export async function checksumFiles(directory, current = "") {
  const files = [];
  for (const name of (await readdir(join(directory, current))).sort()) {
    const relativePath = join(current, name);
    const info = await stat(join(directory, relativePath));
    if (info.isDirectory()) files.push(...await checksumFiles(directory, relativePath));
    else if (info.isFile() && relativePath !== "SHA256SUMS") files.push(relativePath);
  }
  return files;
}

