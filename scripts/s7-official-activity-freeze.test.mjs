import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { chmod, cp, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { dirname, join, relative } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import test from "node:test";

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL("..", import.meta.url));
const MODEL = "z-ai/glm-5.3-flash";
const PRICE_BOOK = "openrouter-2026-08-27";
const SOURCE_REPOSITORY = "https://example.invalid/aob-task-pack.git";
const SOURCE_REVISION = "a".repeat(40);
const LICENSE = "MIT test task pack";
const SPEND_PER_CELL = 0.00000125;
// Derive the fixture's adapters from the official scope rather than freezing a
// lineup here. These tests assert freeze/archive behaviour, not which tools are
// in the profile, and a hardcoded list silently breaks every time the scope
// changes - which is exactly what happened when aider was removed.
const TOOLS = JSON.parse(readFileSync(join(root, "plans", "s7-official-tool-scope.json"), "utf8")).tools;
const EXPECTED_CELLS = String(8 * TOOLS.length * 4);

import { canonicalJson, sourceContentSha256, taskChecksum, createTaskPack, createOfficialRun, bindCalibrationReview, createRunWindowLedger, createReplacementLedger, checksumFiles } from "./test-fixtures/official-campaign.mjs";

test("official freeze recomputes raw Activity evidence and archives only sanitized material", async () => {
  const temp = await mkdtemp(join(tmpdir(), "aob-official-activity-freeze-"));
  try {
    const { sourcePath, taskPath, taskIds } = await createTaskPack(join(temp, "tasks"));
    const cells = [];
    for (const taskId of taskIds) {
      for (let rep = 0; rep < 4; rep++) {
      for (const tool of TOOLS) cells.push(await createOfficialRun(temp, tool, taskId, rep, cells.length * 200));
      }
    }
    const { attestationPath: calibrationAttestationPath, calibrationSummaryPath } = await bindCalibrationReview(temp, sourcePath, taskPath, taskIds);
    await writeFile(join(temp, "state.json"), `${JSON.stringify({ version: 1, seed: 1, spentUsd: SPEND_PER_CELL * cells.length, cells, run_window_session_id: "session-official-fixture", run_window_ledger: "provenance/run-window-ledger.json" })}\n`);
    await createRunWindowLedger(temp, cells, join(temp, "state.json"));
    const rawMarker = "RAW_ACTIVITY_MUST_NOT_ENTER_ARCHIVE";
    const rawExport = join(temp, "raw-activity.csv");
    await writeFile(rawExport, `Model,Spend,PrivateNote\n${MODEL},${SPEND_PER_CELL * cells.length},${rawMarker}\n`);
    const firstRun = JSON.parse(await readFile(join(temp, "results", "pinned", TOOLS[0], taskIds[0], "rep-0", "run.json"), "utf8"));
    const firstEvent = JSON.parse(await readFile(join(temp, "results", "pinned", TOOLS[0], taskIds[0], "rep-0", "events.jsonl"), "utf8"));
    assert.equal(firstEvent.run_id, firstRun.run_id);
    const summary = join(temp, "activity-summary.json");
    await execFileAsync("node", ["scripts/s7-activity-crosscheck.mjs", join(temp, "results"), rawExport, summary, MODEL, PRICE_BOOK, join(temp, "state.json"), "2026-08-29T00:00:00.000Z", "2026-08-31T00:00:00.000Z"], { cwd: root });

    const environment = {
      ...process.env, AOB_TASK_MANIFEST: taskPath, AOB_SOURCE_MANIFEST: sourcePath,
      AOB_ACTIVITY_SUMMARY: summary, AOB_ACTIVITY_EXPORT: rawExport,
      AOB_CALIBRATION_ATTESTATION: calibrationAttestationPath,
      AOB_CALIBRATION_SUMMARY: calibrationSummaryPath,
    };
    const missingRaw = await execFileAsync("sh", [join(root, "scripts/s7-freeze.sh"), join(temp, "results"), join(temp, "missing-raw-archive"), EXPECTED_CELLS], { cwd: root, env: { ...environment, AOB_ACTIVITY_EXPORT: "" } }).then(() => null, (error) => error);
    assert.ok(missingRaw);
    assert.match(`${missingRaw.stderr ?? ""}${missingRaw.stdout ?? ""}`, /raw Activity Export/i);

    const stale = JSON.parse(await readFile(summary, "utf8"));
    stale.activity_export.sha256 = `sha256:${"f".repeat(64)}`;
    const staleSummary = join(temp, "stale-summary.json");
    await writeFile(staleSummary, `${JSON.stringify(stale)}\n`);
    const staleResult = await execFileAsync("sh", [join(root, "scripts/s7-freeze.sh"), join(temp, "results"), join(temp, "stale-archive"), EXPECTED_CELLS], { cwd: root, env: { ...environment, AOB_ACTIVITY_SUMMARY: staleSummary } }).then(() => null, (error) => error);
    assert.ok(staleResult);
    assert.match(`${staleResult.stderr ?? ""}${staleResult.stdout ?? ""}`, /raw Activity Export|summary does not match/i);

    const staleBinding = JSON.parse(await readFile(summary, "utf8"));
    staleBinding.binding.results_sha256 = `sha256:${"f".repeat(64)}`;
    const staleBindingSummary = join(temp, "stale-binding-summary.json");
    await writeFile(staleBindingSummary, `${JSON.stringify(staleBinding)}\n`);
    const staleBindingResult = await execFileAsync("sh", [join(root, "scripts/s7-freeze.sh"), join(temp, "results"), join(temp, "stale-binding-archive"), EXPECTED_CELLS], { cwd: root, env: { ...environment, AOB_ACTIVITY_SUMMARY: staleBindingSummary } }).then(() => null, (error) => error);
    assert.ok(staleBindingResult);
    assert.match(`${staleBindingResult.stderr ?? ""}${staleBindingResult.stdout ?? ""}`, /summary does not match|result identity|binding/i);

    const outsideWindow = JSON.parse(await readFile(summary, "utf8"));
    outsideWindow.window = { start_iso: "2026-09-01T00:00:00.000Z", end_iso: "2026-09-02T00:00:00.000Z", operator_supplied: true };
    const outsideWindowSummary = join(temp, "outside-window-summary.json");
    await writeFile(outsideWindowSummary, `${JSON.stringify(outsideWindow)}\n`);
    const outsideWindowResult = await execFileAsync("sh", [join(root, "scripts/s7-freeze.sh"), join(temp, "results"), join(temp, "outside-window-archive"), EXPECTED_CELLS], { cwd: root, env: { ...environment, AOB_ACTIVITY_SUMMARY: outsideWindowSummary } }).then(() => null, (error) => error);
    assert.ok(outsideWindowResult);
    assert.match(`${outsideWindowResult.stderr ?? ""}${outsideWindowResult.stdout ?? ""}`, /result identity|Activity Export|window/i);

    const { stdout, stderr } = await execFileAsync("sh", [join(root, "scripts/s7-freeze.sh"), join(temp, "results"), join(temp, "archive"), EXPECTED_CELLS], { cwd: root, env: environment });
    assert.match(`${stdout}\n${stderr}`, /S7 archive verified/);
    const listing = (await execFileAsync("tar", ["-tzf", join(temp, "archive")], { cwd: root })).stdout;
    assert.match(listing, /provenance\/archive-binding\.json/);
    assert.match(listing, /provenance\/review-evidence\.json/);
    assert.match(listing, /provenance\/calibration-attestation\.json/);
    assert.match(listing, /provenance\/calibration-summary\.json/);
    assert.match(listing, /provenance\/official-tool-scope\.json/);
    assert.doesNotMatch(listing, /raw-activity\.csv/);
    const unpacked = join(temp, "unpacked");
    await mkdir(unpacked);
    await execFileAsync("tar", ["-xzf", join(temp, "archive"), "-C", unpacked]);
    for (const file of await checksumFiles(unpacked)) assert.doesNotMatch(await readFile(join(unpacked, file), "utf8"), new RegExp(rawMarker));
    const releaseManifest = JSON.parse(await readFile(join(unpacked, "provenance/release-manifest.json"), "utf8"));
    const archivedScope = JSON.parse(await readFile(join(unpacked, "provenance/official-tool-scope.json"), "utf8"));
    assert.deepEqual(releaseManifest.tools, TOOLS.slice().sort());
    assert.deepEqual(archivedScope.tools, TOOLS);
    assert.match(releaseManifest.tool_scope_sha256, /^sha256:[0-9a-f]{64}$/);
  } finally {
    if (process.env.AOB_KEEP_OFFICIAL_FIXTURE !== "1") await rm(temp, { recursive: true, force: true });
    else console.error(`kept fixture: ${temp}`);
  }
});

test("official archive rejects a source manifest mutation even when task and portable bindings are recomputed", async () => {
  const temp = await mkdtemp(join(tmpdir(), "aob-official-source-binding-"));
  try {
    const { sourcePath, taskPath, taskIds } = await createTaskPack(join(temp, "tasks"));
    const cells = [];
    for (const taskId of taskIds) {
      for (let rep = 0; rep < 4; rep++) {
        for (const tool of TOOLS) cells.push(await createOfficialRun(temp, tool, taskId, rep, cells.length * 200));
      }
    }
    const { attestationPath: calibrationAttestationPath, calibrationSummaryPath } = await bindCalibrationReview(temp, sourcePath, taskPath, taskIds);
    const statePath = join(temp, "state.json");
    await writeFile(statePath, `${JSON.stringify({ version: 1, seed: 1, spentUsd: SPEND_PER_CELL * cells.length, cells, run_window_session_id: "session-official-fixture", run_window_ledger: "provenance/run-window-ledger.json" })}\n`);
    await createRunWindowLedger(temp, cells, statePath);
    const rawExport = join(temp, "raw-activity.csv");
    await writeFile(rawExport, `Model,Spend\n${MODEL},${SPEND_PER_CELL * cells.length}\n`);
    const summary = join(temp, "activity-summary.json");
    await execFileAsync("node", ["scripts/s7-activity-crosscheck.mjs", join(temp, "results"), rawExport, summary, MODEL, PRICE_BOOK, statePath, "2026-08-29T00:00:00.000Z", "2026-08-31T00:00:00.000Z"], { cwd: root });
    const environment = {
      ...process.env, AOB_TASK_MANIFEST: taskPath, AOB_SOURCE_MANIFEST: sourcePath,
      AOB_ACTIVITY_SUMMARY: summary, AOB_ACTIVITY_EXPORT: rawExport,
      AOB_CALIBRATION_ATTESTATION: calibrationAttestationPath,
      AOB_CALIBRATION_SUMMARY: calibrationSummaryPath,
    };
    await execFileAsync("sh", [join(root, "scripts/s7-freeze.sh"), join(temp, "results"), join(temp, "archive"), EXPECTED_CELLS], { cwd: root, env: environment });

    const unpacked = join(temp, "unpacked");
    await mkdir(unpacked);
    await execFileAsync("tar", ["-xzf", join(temp, "archive"), "-C", unpacked]);
    const sourceInArchive = join(unpacked, "provenance/source-manifest.json");
    const mutatedSource = JSON.parse(await readFile(sourceInArchive, "utf8"));
    mutatedSource.tasks[0].checksum = `sha256:${"0".repeat(64)}`;
    await writeFile(sourceInArchive, `${JSON.stringify(mutatedSource, null, 2)}\n`);
    const taskInArchive = join(unpacked, "provenance/task-manifest.json");
    const mutatedTask = JSON.parse(await readFile(taskInArchive, "utf8"));
    mutatedTask.source_provenance.source_manifest_sha256 = `sha256:${createHash("sha256").update(canonicalJson(mutatedSource)).digest("hex")}`;
    await writeFile(taskInArchive, `${JSON.stringify(mutatedTask, null, 2)}\n`);
    await execFileAsync("node", ["--experimental-strip-types", "--no-warnings", "--experimental-loader", join(root, "scripts/ts-source-loader.mjs"), "--input-type=module", "-e", `import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const root = process.argv[1];
const packageDir = process.argv[2];
const activity = JSON.parse(readFileSync(join(packageDir, "provenance/activity-export-summary.json"), "utf8"));
    const { computePortableArchiveBinding } = await import(pathToFileURL(join(root, "packages/report/src/archive-binding.ts")).href);
writeFileSync(join(packageDir, "provenance/archive-binding.json"), JSON.stringify(computePortableArchiveBinding(packageDir, activity.binding), null, 2) + "\\n");
`, root, unpacked], { cwd: root });
    const bindingPath = join(unpacked, "provenance/archive-binding.json");
    const sourceHash = (await execFileAsync("shasum", ["-a", "256", sourceInArchive], { cwd: root })).stdout.trim().split(/\s+/)[0];
    const taskHash = (await execFileAsync("shasum", ["-a", "256", taskInArchive], { cwd: root })).stdout.trim().split(/\s+/)[0];
    const bindingHash = (await execFileAsync("shasum", ["-a", "256", bindingPath], { cwd: root })).stdout.trim().split(/\s+/)[0];
    const checksumLines = (await readFile(join(unpacked, "SHA256SUMS"), "utf8")).trimEnd().split("\n").map((line) =>
      line.endsWith("provenance/source-manifest.json") ? `${sourceHash}  provenance/source-manifest.json` :
        line.endsWith("provenance/task-manifest.json") ? `${taskHash}  provenance/task-manifest.json` :
        line.endsWith("provenance/archive-binding.json") ? `${bindingHash}  provenance/archive-binding.json` : line);
    await writeFile(join(unpacked, "SHA256SUMS"), `${checksumLines.join("\n")}\n`);
    const mutatedArchive = join(temp, "mutated.tar.gz");
    await execFileAsync("tar", ["-czf", mutatedArchive, "-C", unpacked, "results", "report", "provenance", "SHA256SUMS"], { cwd: root });
    const checksum = (await execFileAsync("shasum", ["-a", "256", mutatedArchive], { cwd: root })).stdout;
    await writeFile(`${mutatedArchive}.sha256`, checksum);
    const result = await execFileAsync("sh", [join(root, "scripts/s7-verify-archive.sh"), "--official", mutatedArchive], { cwd: root }).then(() => null, (error) => error);
    assert.ok(result);
    assert.match(`${result.stderr ?? ""}${result.stdout ?? ""}`, /source (manifest|content)|source-review|provenance/i);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test("official freeze exercises a separate replacement session and archive binding", async () => {
  const temp = await mkdtemp(join(tmpdir(), "aob-official-replacement-freeze-"));
  try {
    const { sourcePath, taskPath, taskIds } = await createTaskPack(join(temp, "tasks"));
    const cells = [];
    for (const taskId of taskIds) {
      for (let rep = 0; rep < 4; rep++) {
        for (const tool of TOOLS) cells.push(await createOfficialRun(temp, tool, taskId, rep, cells.length * 200));
      }
    }
    const { attestationPath: calibrationAttestationPath, calibrationSummaryPath } = await bindCalibrationReview(temp, sourcePath, taskPath, taskIds);
    const anomalyCell = join(temp, "results", "pinned", "codex", taskIds[0], "rep-0");
    const anomalyPath = join(anomalyCell, "run.json");
    const anomaly = JSON.parse(await readFile(anomalyPath, "utf8"));
    anomaly.outcome = "timeout";
    anomaly.adapter_result.exitCode = 124;
    anomaly.verification.exit = 1;
    await writeFile(anomalyPath, `${JSON.stringify(anomaly)}\n`);
    const statePath = join(temp, "state.json");
    await writeFile(statePath, `${JSON.stringify({ version: 1, seed: 1, spentUsd: SPEND_PER_CELL * cells.length, cells, run_window_session_id: "session-official-fixture", run_window_ledger: "provenance/run-window-ledger.json" })}\n`);
    await createRunWindowLedger(temp, cells, statePath);

    const replacement = join(temp, "reruns", "pinned", "codex", taskIds[0], "rep-0");
    await mkdir(replacement, { recursive: true });
    await cp(anomalyCell, replacement, { recursive: true });
    const replacementPath = join(replacement, "run.json");
    const replacementRun = JSON.parse(await readFile(replacementPath, "utf8"));
    replacementRun.run_id = "pinned:codex:official-task-1:replacement";
    replacementRun.outcome = "completed";
    replacementRun.adapter_result.exitCode = 0;
    replacementRun.verification.exit = 0;
    const replacementAnchor = "2026-08-31T00:00:00.000Z";
    replacementRun.anchors.adapter.wall_clock_iso = replacementAnchor;
    replacementRun.anchors.proxy.wall_clock_iso = replacementAnchor;
    replacementRun.adapter_result.anchor.wall_clock_iso = replacementAnchor;
    replacementRun.container.started_iso = replacementAnchor;
    await writeFile(replacementPath, `${JSON.stringify(replacementRun)}\n`);
    const replacementEventsPath = join(replacement, "events.jsonl");
    await writeFile(replacementEventsPath, (await readFile(replacementEventsPath, "utf8")).replaceAll(anomaly.run_id, replacementRun.run_id));
    const replacementStatePath = join(temp, "rerun-state.json");
    await writeFile(replacementStatePath, `${JSON.stringify({ version: 1, seed: 1, spentUsd: SPEND_PER_CELL, cells: [{ id: replacementRun.run_id, tool: replacementRun.tool, task_id: replacementRun.task_id, condition: replacementRun.condition, rep: replacementRun.rep, status: "done", retries: 0 }], run_window_session_id: "session-rerun-fixture", run_window_ledger: "provenance/run-window-ledger.json" })}\n`);
    const replacementLedgerPath = await createReplacementLedger(temp, join(temp, "reruns"), replacementStatePath, replacementRun);
    const rawExport = join(temp, "raw-activity.csv");
    await writeFile(rawExport, `Model,Spend\n${MODEL},${SPEND_PER_CELL * (cells.length + 1)}\n`);
    const summary = join(temp, "activity-summary.json");
    await execFileAsync("node", ["scripts/s7-activity-crosscheck.mjs", join(temp, "results"), rawExport, summary, MODEL, PRICE_BOOK, statePath, "2026-08-29T00:00:00.000Z", "2026-09-01T00:00:00.000Z", join(temp, "reruns"), replacementStatePath, replacementRun.run_id], { cwd: root });
    const reviewPath = join(temp, "review.json");
    await writeFile(reviewPath, `${JSON.stringify({ version: 1, cells: [{ run_id: anomaly.run_id, disposition: "rerun", replacement_run_id: replacementRun.run_id, note: "replacement completed" }] })}\n`);
    const environment = { ...process.env, AOB_TASK_MANIFEST: taskPath, AOB_SOURCE_MANIFEST: sourcePath, AOB_ACTIVITY_SUMMARY: summary, AOB_ACTIVITY_EXPORT: rawExport, AOB_CALIBRATION_ATTESTATION: calibrationAttestationPath, AOB_CALIBRATION_SUMMARY: calibrationSummaryPath };
    const { stdout, stderr } = await execFileAsync("sh", [join(root, "scripts/s7-freeze.sh"), join(temp, "results"), join(temp, "archive"), EXPECTED_CELLS, reviewPath, "", "", "", join(temp, "reruns"), replacementStatePath, rawExport, replacementLedgerPath], { cwd: root, env: environment });
    assert.match(`${stdout}\n${stderr}`, /S7 archive verified/);
    const unpacked = join(temp, "unpacked");
    await mkdir(unpacked);
    await execFileAsync("tar", ["-xzf", join(temp, "archive"), "-C", unpacked]);
    const published = JSON.parse(await readFile(join(unpacked, "results", "pinned", "codex", taskIds[0], "rep-0", "run.json"), "utf8"));
    assert.equal(published.run_id, replacementRun.run_id);
    assert.equal(JSON.parse(await readFile(join(unpacked, "provenance/anomalies/pinned/codex/official-task-1/rep-0/run.json"), "utf8")).run_id, anomaly.run_id);
    assert.match((await execFileAsync("tar", ["-tzf", join(temp, "archive")])).stdout, /provenance\/rerun-state\/run-window-ledger\.json/);
    assert.doesNotMatch((await execFileAsync("tar", ["-tzf", join(temp, "archive")])).stdout, /raw-activity\.csv/);
  } finally {
    if (process.env.AOB_KEEP_OFFICIAL_FIXTURE !== "1") await rm(temp, { recursive: true, force: true });
    else console.error(`kept replacement fixture: ${temp}`);
  }
});
