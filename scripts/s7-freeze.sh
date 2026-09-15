#!/usr/bin/env sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
OFFICIAL_SCOPE=$(node "$ROOT/scripts/s7-profile.mjs" "${AOB_OFFICIAL_PROFILE:-}" scope)
OFFICIAL_TOOLS=$(node "$ROOT/scripts/s7-official-scope.mjs" "$OFFICIAL_SCOPE") || { printf 'S7 freeze: official tool scope is malformed\n' >&2; exit 1; }
OFFICIAL_TOOL_COUNT=$(printf '%s' "$OFFICIAL_TOOLS" | awk -F, '{ print NF }')
OFFICIAL_MIN_CELLS=$((8 * OFFICIAL_TOOL_COUNT * 4))
RESULTS=${1:?usage: scripts/s7-freeze.sh RESULTS_DIR ARCHIVE_PATH}
ARCHIVE=${2:?usage: scripts/s7-freeze.sh RESULTS_DIR ARCHIVE_PATH [EXPECTED_CELLS] [ANOMALY_REVIEW] [TASK_MANIFEST] [SOURCE_MANIFEST] [ACTIVITY_SUMMARY] [RERUN_RESULTS] [RERUN_STATE] [ACTIVITY_EXPORT.csv] [RERUN_WINDOW_LEDGER]}
EXPECTED_CELLS=${3:-${AOB_EXPECTED_CELLS:-}}
ANOMALY_REVIEW=${4:-${AOB_ANOMALY_REVIEW:-}}
TASK_MANIFEST=${5:-${AOB_TASK_MANIFEST:-}}
SOURCE_MANIFEST=${6:-${AOB_SOURCE_MANIFEST:-}}
ACTIVITY_SUMMARY=${7:-${AOB_ACTIVITY_SUMMARY:-}}
RERUN_RESULTS=${8:-${AOB_RERUN_RESULTS:-}}
RERUN_STATE=${9:-${AOB_RERUN_STATE:-}}
ACTIVITY_EXPORT=${10:-${AOB_ACTIVITY_EXPORT:-}}
RERUN_WINDOW_LEDGER=${11:-${AOB_RERUN_WINDOW_LEDGER:-}}
CALIBRATION_ATTESTATION=${12:-${AOB_CALIBRATION_ATTESTATION:-}}
CALIBRATION_SUMMARY=${13:-${AOB_CALIBRATION_SUMMARY:-}}
PACKAGE_DIR=$(mktemp -d /tmp/aob-s7-package-XXXXXX)
MANIFEST=$(mktemp /tmp/aob-s7-manifest-XXXXXX)
trap 'rm -rf "$PACKAGE_DIR" "$MANIFEST"' EXIT HUP INT TERM

[ -d "$RESULTS" ] && [ ! -L "$RESULTS" ] || { printf 'S7 freeze: results directory is missing or is a symlink: %s\n' "$RESULTS" >&2; exit 1; }
find "$RESULTS" \( -type d -name .attempts -prune \) -o \( -type f -name run.json -print -quit \) | grep -q . || { printf 'S7 freeze: no current run.json files found\n' >&2; exit 1; }
case "$EXPECTED_CELLS" in
  ''|*[!0-9]*) printf 'S7 freeze: provide EXPECTED_CELLS as argument 3 or AOB_EXPECTED_CELLS\n' >&2; exit 1 ;;
  0) printf 'S7 freeze: EXPECTED_CELLS must be positive\n' >&2; exit 1 ;;
esac
if [ "${AOB_ALLOW_NONOFFICIAL_FREEZE:-0}" != "1" ] && [ "$EXPECTED_CELLS" -lt "$OFFICIAL_MIN_CELLS" ]; then
  printf 'S7 freeze: official archives require at least 8 tasks x %s adapters x 4 repetitions; use AOB_ALLOW_NONOFFICIAL_FREEZE=1 only for dry runs\n' "$OFFICIAL_TOOL_COUNT" >&2
  exit 1
fi
ACTUAL_CELLS=$(find "$RESULTS" \( -type d -name .attempts -prune \) -o \( -type f -name run.json -print \) | wc -l | tr -d '[:space:]')
[ "$ACTUAL_CELLS" -eq "$EXPECTED_CELLS" ] || {
  printf 'S7 freeze: expected %s run.json cells, found %s\n' "$EXPECTED_CELLS" "$ACTUAL_CELLS" >&2
  exit 1
}
STATE=$(dirname "$RESULTS")/state.json
[ -f "$STATE" ] || { printf 'S7 freeze: runner state is missing: %s\n' "$STATE" >&2; exit 1; }
RUN_WINDOW_LEDGER=$(dirname "$STATE")/provenance/run-window-ledger.json
LEDGER_ARG=
if [ "${AOB_ALLOW_NONOFFICIAL_FREEZE:-0}" != "1" ]; then LEDGER_ARG=$RUN_WINDOW_LEDGER; fi
if [ -n "$RERUN_RESULTS" ]; then
  [ -d "$RERUN_RESULTS" ] && [ ! -L "$RERUN_RESULTS" ] || { printf 'S7 freeze: rerun results directory is missing or is a symlink: %s\n' "$RERUN_RESULTS" >&2; exit 1; }
  [ -f "$RERUN_STATE" ] && [ ! -L "$RERUN_STATE" ] || { printf 'S7 freeze: rerun state is missing or is a symlink: %s\n' "$RERUN_STATE" >&2; exit 1; }
  if [ "${AOB_ALLOW_NONOFFICIAL_FREEZE:-0}" != "1" ]; then
    [ -f "$RERUN_WINDOW_LEDGER" ] && [ ! -L "$RERUN_WINDOW_LEDGER" ] || { printf 'S7 freeze: official replacement archives require a separate rerun window ledger\n' >&2; exit 1; }
  fi
elif [ -n "$RERUN_STATE" ]; then
  printf 'S7 freeze: rerun state requires rerun results\n' >&2
  exit 1
fi
if [ -z "$RERUN_RESULTS" ] && [ -n "$RERUN_WINDOW_LEDGER" ]; then
  printf 'S7 freeze: rerun window ledger requires rerun results\n' >&2
  exit 1
fi
node --experimental-strip-types --no-warnings --experimental-loader "$ROOT/scripts/ts-source-loader.mjs" - "$ROOT" "$STATE" "$RESULTS" "$EXPECTED_CELLS" "$ANOMALY_REVIEW" "$TASK_MANIFEST" "$SOURCE_MANIFEST" "$ACTIVITY_SUMMARY" "$RERUN_RESULTS" "$RERUN_STATE" "$ACTIVITY_EXPORT" "$PACKAGE_DIR" "$RERUN_WINDOW_LEDGER" "$CALIBRATION_ATTESTATION" "$CALIBRATION_SUMMARY" "$OFFICIAL_SCOPE" <<'NODE'
(async () => {
const fs = require("node:fs");
const { createHash } = require("node:crypto");
const path = require("node:path");
const { isDeepStrictEqual } = require("node:util");
const { pathToFileURL } = require("node:url");
const root = process.argv[2];
const state = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
const results = path.resolve(process.argv[4]);
const expected = Number(process.argv[5]);
const anomalyReviewPath = process.argv[6] || "";
const taskManifestPath = process.argv[7] || "";
const sourceManifestPath = process.argv[8] || "";
const activitySummaryPath = process.argv[9] || "";
const rerunResultsPath = process.argv[10] || "";
const rerunStatePath = process.argv[11] || "";
const activityExportPath = process.argv[12] || "";
const packageDir = process.argv[13];
const rerunWindowLedgerPath = process.argv[14] || "";
const calibrationAttestationPath = process.argv[15] || "";
const calibrationSummaryPath = process.argv[16] || "";
const nonOfficial = process.env.AOB_ALLOW_NONOFFICIAL_FREEZE === "1";
const definition = state.definition_key === undefined ? null : JSON.parse(state.definition_key);
if (definition !== null && (typeof definition !== "object" || Array.isArray(definition))) throw new Error("runner matrix definition is malformed");
const executionProtocol = definition?.executionProtocol;
if (executionProtocol !== undefined && executionProtocol !== "tool-batches-v1") throw new Error("runner execution protocol is unsupported");
const batchProtocol = executionProtocol === "tool-batches-v1";
const primaryWindowOptions = {
  expectedCellIds: new Set((state.cells ?? []).map((cell) => cell.id)),
  expectedRetryCounts: new Map((state.cells ?? []).map((cell) => [cell.id, cell.retries])),
  ...(batchProtocol ? { executionProtocol, expectedCellTools: new Map((state.cells ?? []).map((cell) => [cell.id, cell.tool])) } : {}),
};
const scope = JSON.parse(fs.readFileSync(process.argv[17], "utf8"));
const { validateOfficialScope, assertProfileConditions } = await import(pathToFileURL(path.join(root, "scripts/official-profiles.mjs")).href);
validateOfficialScope(scope);
if (!nonOfficial) assertProfileConditions(scope.profile, definition?.model, definition?.priceBook, definition?.providerRouting);
const officialTools = new Set(scope.tools);

if (!Number.isFinite(state.spentUsd) || state.spentUsd < 0 || state.spentUsd > 1500 + Number.EPSILON) throw new Error("runner state spend exceeds the official $1,500 maximum");
const { loadResultsTree, reviewAnomalies } = await import(pathToFileURL(path.join(root, "packages/report/src/from-results.ts")).href);
const { c4MeasurementIdentity, validateC4Run } = await import(pathToFileURL(path.join(root, "packages/contracts/src/index.ts")).href);
let primaryLedger = null;
if (!nonOfficial) {
  const ledgerPath = path.join(path.dirname(path.resolve(process.argv[3])), "provenance", "run-window-ledger.json");
  if (!fs.existsSync(ledgerPath) || !fs.lstatSync(ledgerPath).isFile() || fs.lstatSync(ledgerPath).isSymbolicLink()) throw new Error("official archive requires a run-window ledger");
  const { assertOfficialRunWindow, assertRetryEvidenceCoverage, bindRunWindowResults, digestText } = await import(pathToFileURL(path.join(root, "packages/runner/src/window-ledger.ts")).href);
  const expectedRetryCounts = new Map((state.cells ?? []).map((cell) => [cell.id, cell.retries]));
  const ledger = assertOfficialRunWindow(JSON.parse(fs.readFileSync(ledgerPath, "utf8")), {
    ...primaryWindowOptions,
    resultsRoot: results,
  });
  primaryLedger = ledger;
  if (state.run_window_session_id !== ledger.session_id || state.run_window_ledger !== "provenance/run-window-ledger.json") throw new Error("run-window ledger session/path is not bound to runner state");
  assertRetryEvidenceCoverage(results, expectedRetryCounts);
  if (ledger.state_sha256 !== digestText(fs.readFileSync(process.argv[3]))) throw new Error("run-window ledger state binding does not match runner state");
  const resultBinding = bindRunWindowResults(results);
  if (resultBinding === null || JSON.stringify(resultBinding) !== JSON.stringify(ledger.results_binding)) throw new Error("run-window ledger result binding does not match results");
}
if (!Array.isArray(state.cells) || state.cells.length !== expected) throw new Error("runner state does not contain the expected matrix");
if (state.cells.some((cell) => cell.status !== "done" && cell.status !== "task_failed" && cell.status !== "quarantined")) throw new Error("runner state contains non-terminal cells");
const loaded = loadResultsTree(results);
const runs = loaded.map((cell) => cell.run);
const { assertProviderRoutingMatches, assertNativeTaskFailureStates } = await import(pathToFileURL(path.join(root, "packages/report/src/campaign-validation.ts")).href);
assertProviderRoutingMatches(runs, definition);
assertNativeTaskFailureStates(state, loaded, definition);
if (batchProtocol) {
  const { validateCampaignValidation } = await import(pathToFileURL(path.join(root, "packages/report/src/campaign-validation.ts")).href);
  const validationRoot = path.join(path.dirname(path.resolve(process.argv[3])), "provenance", "validation");
  const validation = validateCampaignValidation(validationRoot, definition, results, primaryLedger?.window.start_iso);
  if (!Number.isFinite(definition.validationSpendUsd) || Math.abs(definition.validationSpendUsd - validation.spent_usd) > 1e-9) throw new Error("campaign validation reserved spend does not match verified evidence");
  const replacementSpend = rerunStatePath === "" ? 0 : JSON.parse(fs.readFileSync(path.resolve(rerunStatePath), "utf8")).spentUsd;
  const combinedSpend = state.spentUsd + validation.spent_usd + replacementSpend;
  if (!Number.isFinite(replacementSpend) || replacementSpend < 0 || !Number.isFinite(definition.capUsd) || definition.capUsd <= 0 || definition.capUsd > 1500 || combinedSpend > definition.capUsd + 1e-9 || combinedSpend > 1500 + Number.EPSILON) throw new Error("combined campaign validation, original, and replacement spend exceeds the campaign cap or $1,500 maximum");
}
if (!nonOfficial && runs.some((run) => run.model !== scope.model)) throw new Error("official archive contains a run outside the configured pinned model");
const currentRunIds = new Set(runs.map((run) => run.run_id));
const reviewIdentity = (run) => c4MeasurementIdentity(run);
const rerunLoaded = rerunResultsPath === "" ? [] : loadResultsTree(path.resolve(rerunResultsPath));
const rerunRuns = rerunLoaded.map((cell) => cell.run);
if (rerunRuns.some((run) => currentRunIds.has(run.run_id))) throw new Error("rerun results contain a current result run_id");
if (new Set(runs.map((run) => JSON.stringify(run.host))).size !== 1) throw new Error("official results contain multiple host identities");
for (const run of rerunRuns) {
  if (!runs.some((current) => reviewIdentity(current) === reviewIdentity(run))) throw new Error(`rerun result does not match a current cell: ${run.run_id}`);
}
if (!nonOfficial && rerunResultsPath !== "") {
  if (rerunWindowLedgerPath === "" || rerunStatePath === "") throw new Error("official replacement archive requires rerun window ledger and state");
  const rerunState = JSON.parse(fs.readFileSync(path.resolve(rerunStatePath), "utf8"));
  const { assertOfficialRunWindow, assertRetryEvidenceCoverage, assertOfficialRunWindowsDoNotOverlap, bindRunWindowResults, digestText } = await import(pathToFileURL(path.join(root, "packages/runner/src/window-ledger.ts")).href);
  const expectedRetryCounts = new Map((rerunState.cells ?? []).map((cell) => [cell.id, cell.retries]));
  const rerunLedger = assertOfficialRunWindow(JSON.parse(fs.readFileSync(path.resolve(rerunWindowLedgerPath), "utf8")), {
    expectedCellIds: new Set((rerunState.cells ?? []).map((cell) => cell.id)),
    expectedRetryCounts,
    resultsRoot: path.resolve(rerunResultsPath),
  });
  if (rerunState.run_window_session_id !== rerunLedger.session_id || rerunState.run_window_ledger !== "provenance/run-window-ledger.json") throw new Error("replacement rerun ledger session/path is not bound to rerun state");
  assertRetryEvidenceCoverage(path.resolve(rerunResultsPath), expectedRetryCounts);
  if (primaryLedger !== null && rerunLedger.session_id === primaryLedger.session_id) throw new Error("replacement rerun must use a separate window session");
  if (primaryLedger !== null) assertOfficialRunWindowsDoNotOverlap(primaryLedger, rerunLedger, primaryWindowOptions);
  const comparableHost = (value) => JSON.stringify({ ...value, image_digests: [] });
  if (primaryLedger !== null && comparableHost(rerunLedger.host_start) !== comparableHost(primaryLedger.host_start)) throw new Error("replacement rerun host identity does not match the primary session");
  if (rerunLedger.state_sha256 !== digestText(fs.readFileSync(path.resolve(rerunStatePath)))) throw new Error("replacement rerun ledger state binding does not match rerun state");
  const resultBinding = bindRunWindowResults(path.resolve(rerunResultsPath));
  if (resultBinding === null || JSON.stringify(resultBinding) !== JSON.stringify(rerunLedger.results_binding)) throw new Error("replacement rerun ledger result binding does not match rerun results");
}
const requireRegularJson = (file, label) => {
  if (!fs.existsSync(file) || fs.lstatSync(file).isSymbolicLink() || !fs.lstatSync(file).isFile()) throw new Error(`${label} is unavailable or is a symlink`);
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { throw new Error(`${label} is not valid JSON`); }
};
if (!nonOfficial) {
  if (taskManifestPath === "" || sourceManifestPath === "" || activitySummaryPath === "" || activityExportPath === "") {
    throw new Error("official archive requires task manifest, source manifest, Activity Export summary, and private raw Activity Export");
  }
  const taskManifest = requireRegularJson(path.resolve(taskManifestPath), "task manifest");
  const sourceManifest = requireRegularJson(path.resolve(sourceManifestPath), "source manifest");
  const activity = requireRegularJson(path.resolve(activitySummaryPath), "Activity Export summary");
  const { activityBinding, activityBounds, activityLocalAccounting, runActivityCrosscheck } = await import(pathToFileURL(path.join(root, "packages/report/src/activity-cli.ts")).href);
  const taskIds = [...new Set(runs.map((run) => run.task_id))];
  const { validateSelectedLocalTaskManifest, validateDeepSWEManifest } = await import(pathToFileURL(path.join(root, "packages/tasks/src/source.ts")).href);
  validateSelectedLocalTaskManifest(path.dirname(path.resolve(taskManifestPath)), taskManifest, taskIds, sourceManifest);
  const review = taskManifest.source_provenance?.review;
  const reviewFlags = ["source_reviewed", "reference_results_verified", "calibration_complete", "maintainer_signed_off"];
  if (!review || reviewFlags.some((key) => review[key] !== true)) throw new Error("official archive source review gates are incomplete");
  if (calibrationAttestationPath === "" || calibrationSummaryPath === "") throw new Error("official archive requires calibration attestation and summary");
  const safeReviewPath = (value) => typeof value === "string" && value.length > 0 && !path.isAbsolute(value) && !value.split(/[\\/]/).some((part) => part === "" || part === "." || part === "..");
  if (!safeReviewPath(review.evidence_file) || !safeReviewPath(review.calibration_attestation_file)) throw new Error("official archive review evidence paths must be safe relative paths");
  const evidenceCandidates = [
    path.resolve(root, review.evidence_file),
    path.resolve(path.dirname(path.resolve(sourceManifestPath)), review.evidence_file),
  ];
  const reviewEvidencePath = evidenceCandidates.find((candidate) => fs.existsSync(candidate) && fs.lstatSync(candidate).isFile() && !fs.lstatSync(candidate).isSymbolicLink());
  if (reviewEvidencePath === undefined) throw new Error("official archive source review evidence is unavailable");
  const reviewEvidenceBytes = fs.readFileSync(reviewEvidencePath);
  const reviewEvidenceHash = `sha256:${require("node:crypto").createHash("sha256").update(reviewEvidenceBytes).digest("hex")}`;
  if (reviewEvidenceHash !== review.evidence_sha256) throw new Error("official archive source review evidence checksum does not match");
  let reviewEvidence;
  try { reviewEvidence = JSON.parse(reviewEvidenceBytes.toString("utf8")); } catch { throw new Error("official archive source review evidence is not valid JSON"); }
  if (reviewEvidence.source_repository !== sourceManifest.repository || reviewEvidence.source_revision !== sourceManifest.revision ||
    reviewEvidence.reviewer !== review.reviewer || reviewEvidence.reviewed_at !== review.reviewed_at ||
    !reviewEvidence.review || reviewFlags.some((key) => reviewEvidence.review[key] !== review[key]) ||
    JSON.stringify(reviewEvidence.selected_task_ids) !== JSON.stringify(review.reviewed_task_ids) ||
    JSON.stringify(reviewEvidence.calibration_adapters) !== JSON.stringify(review.calibration_adapters) ||
    reviewEvidence.review.calibration_attestation_file !== review.calibration_attestation_file ||
    reviewEvidence.review.calibration_attestation_sha256 !== review.calibration_attestation_sha256) {
    throw new Error("official archive source review evidence does not match provenance");
  }
  fs.writeFileSync(path.join(packageDir, ".review-evidence.json"), reviewEvidenceBytes, { mode: 0o600 });
  const calibrationCandidates = [
    path.resolve(root, review.calibration_attestation_file ?? ""),
    path.resolve(path.dirname(path.resolve(sourceManifestPath)), review.calibration_attestation_file ?? ""),
    path.resolve(calibrationAttestationPath),
  ];
  const calibrationPath = calibrationCandidates.find((candidate) => fs.existsSync(candidate) && fs.lstatSync(candidate).isFile() && !fs.lstatSync(candidate).isSymbolicLink());
  if (calibrationPath === undefined) throw new Error("official archive calibration attestation is unavailable");
  const calibrationBytes = fs.readFileSync(calibrationPath);
  const calibrationHash = `sha256:${require("node:crypto").createHash("sha256").update(calibrationBytes).digest("hex")}`;
  if (calibrationHash !== review.calibration_attestation_sha256) throw new Error("official archive calibration attestation checksum does not match");
  let calibration;
  try { calibration = JSON.parse(calibrationBytes.toString("utf8")); } catch { throw new Error("official archive calibration attestation is not valid JSON"); }
  if (calibration.model !== scope.model || calibration.condition !== "pinned" || calibration.task_source !== runs[0].task_source || calibration.source_repository !== (runs[0].task_repository ?? "") || calibration.source_revision !== runs[0].task_revision || calibration.task_regime !== runs[0].task_regime || calibration.price_book !== runs[0].price_book) {
    throw new Error("official archive calibration attestation does not match the configured release identity");
  }
  const sorted = (value) => Array.isArray(value) ? [...value].sort() : value;
  if (calibration.v !== 1 || calibration.source_repository !== sourceManifest.repository || calibration.source_revision !== sourceManifest.revision ||
    JSON.stringify(sorted(calibration.selected_task_ids)) !== JSON.stringify(sorted(review.reviewed_task_ids)) ||
    JSON.stringify(sorted(calibration.included_tools)) !== JSON.stringify(sorted(review.calibration_adapters)) ||
    !Array.isArray(calibration.tasks) || calibration.tasks.length !== review.reviewed_task_ids.length) {
    throw new Error("official archive calibration attestation does not match source-review provenance");
  }
  const calibrationSummaryFile = requireRegularJson(path.resolve(calibrationSummaryPath), "calibration summary");
  const calibrationSummaryBytes = fs.readFileSync(path.resolve(calibrationSummaryPath));
  if (`sha256:${require("node:crypto").createHash("sha256").update(calibrationSummaryBytes).digest("hex")}` !== calibration.calibration_summary_sha256 ||
    calibrationSummaryFile.v !== 1 || !Array.isArray(calibrationSummaryFile.records)) {
    throw new Error("official archive calibration summary does not match the attestation");
  }
  const summaryByRunId = new Map();
  for (const record of calibrationSummaryFile.records) {
    if (!record || typeof record.run_id !== "string" || summaryByRunId.has(record.run_id)) throw new Error("official archive calibration summary contains duplicate run IDs");
    summaryByRunId.set(record.run_id, record);
  }
  const attestedRunIds = new Set();
  for (const task of calibration.tasks) {
    for (const qualifying of task.qualifying_runs) {
      if (attestedRunIds.has(qualifying.run_id)) throw new Error("official archive calibration attestation reuses a run ID");
      attestedRunIds.add(qualifying.run_id);
      const record = summaryByRunId.get(qualifying.run_id);
      if (!record || record.run_sha256 !== qualifying.run_sha256 || record.passed !== true || !Array.isArray(record.validation_issues) || record.validation_issues.length !== 0 || record.tool !== qualifying.tool || record.task_id !== task.task_id || record.task_source !== calibration.task_source || record.task_repository !== calibration.source_repository || record.task_revision !== calibration.source_revision || record.task_regime !== calibration.task_regime || record.model !== calibration.model || record.condition !== calibration.condition || record.price_book !== calibration.price_book) {
        throw new Error(`official archive calibration summary does not prove ${qualifying.run_id}`);
      }
    }
  }
  fs.writeFileSync(path.join(packageDir, ".calibration-summary.json"), calibrationSummaryBytes, { mode: 0o600 });
  fs.writeFileSync(path.join(packageDir, ".calibration-attestation.json"), calibrationBytes, { mode: 0o600 });
  if (sourceManifest.source_adapter === "deepswe") {
    const checkedSource = validateDeepSWEManifest(sourceManifest);
    const sourceTasks = new Map(checkedSource.tasks.map((task) => [task.id, task]));
    for (const run of runs) {
      const task = sourceTasks.get(run.task_id);
      const expectedImage = task?.agent_images?.[run.tool];
      if (task === undefined || expectedImage === undefined) throw new Error(`official archive is missing DeepSWE image provenance for ${run.tool}/${run.task_id}`);
      if (run.container.image_digest !== expectedImage.image_digest || run.task_environment.agent_image !== expectedImage.image || run.task_environment.agent_image_digest !== expectedImage.image_digest) {
        throw new Error(`official archive DeepSWE agent image identity mismatch for ${run.tool}/${run.task_id}`);
      }
      if (run.container.verifier_image_digest !== task.verifier_image_digest) {
        throw new Error(`official archive DeepSWE verifier image identity mismatch for ${run.task_id}`);
      }
    }
  }
  const spendClose = (left, right) => typeof left === "number" && typeof right === "number" &&
    Math.abs(left - right) <= Math.max(0.000001, Math.max(Math.abs(left), Math.abs(right)) * 0.000001);
  let replacementRunIds = [];
  if (anomalyReviewPath !== "") {
    const reviewForBinding = requireRegularJson(path.resolve(anomalyReviewPath), "anomaly review record");
    if (Array.isArray(reviewForBinding.cells)) {
      replacementRunIds = reviewForBinding.cells
        .filter((entry) => entry && entry.disposition === "rerun" && typeof entry.replacement_run_id === "string")
        .map((entry) => entry.replacement_run_id);
    }
  }
  if ((rerunResultsPath === "") !== (replacementRunIds.length === 0)) {
    throw new Error("Activity Export replacement binding requires rerun results and reviewed replacement run IDs together");
  }
  const selectedReplacementRunIds = replacementRunIds.length === 0 ? undefined : replacementRunIds;
  const activityWindow = activity.window;
  const windowStart = typeof activityWindow?.start_iso === "string" ? Date.parse(activityWindow.start_iso) : NaN;
  const windowEnd = typeof activityWindow?.end_iso === "string" ? Date.parse(activityWindow.end_iso) : NaN;
  const windowValid = Number.isFinite(windowStart) && Number.isFinite(windowEnd) &&
    new Date(windowStart).toISOString() === activityWindow?.start_iso && new Date(windowEnd).toISOString() === activityWindow?.end_iso && windowStart < windowEnd;
  const binding = activityBinding(results, path.resolve(process.argv[3]), rerunResultsPath === "" ? undefined : path.resolve(rerunResultsPath), selectedReplacementRunIds, rerunStatePath === "" ? undefined : path.resolve(rerunStatePath));
  const bounds = activityBounds(results, rerunResultsPath === "" ? undefined : path.resolve(rerunResultsPath), selectedReplacementRunIds);
  const expectedLocal = activityLocalAccounting({
    resultsDir: results,
    statePath: path.resolve(process.argv[3]),
    model: runs[0]?.model,
    priceBook: runs[0]?.price_book,
    ...(rerunResultsPath === "" ? {} : { replacementResultsDir: path.resolve(rerunResultsPath), replacementStatePath: path.resolve(rerunStatePath), replacementRunIds }),
  });
  const recomputedPath = path.join(packageDir, ".activity-recomputed.json");
  let recomputed;
  try {
    recomputed = runActivityCrosscheck({
      resultsDir: results,
      statePath: path.resolve(process.argv[3]),
      exportCsv: path.resolve(activityExportPath),
      output: recomputedPath,
      model: runs[0]?.model,
      priceBook: runs[0]?.price_book,
      window: { startIso: activityWindow?.start_iso, endIso: activityWindow?.end_iso },
      ...(rerunResultsPath === "" ? {} : { replacementResultsDir: path.resolve(rerunResultsPath), replacementStatePath: path.resolve(rerunStatePath), replacementRunIds }),
    });
  } finally {
    fs.rmSync(recomputedPath, { force: true });
  }
  if (!isDeepStrictEqual(recomputed, activity)) throw new Error("official archive Activity Export summary does not match private raw Activity Export recomputation");
  fs.writeFileSync(path.join(packageDir, ".validated-activity-summary.json"), `${JSON.stringify(recomputed, null, 2)}\n`, { mode: 0o600 });
  fs.writeFileSync(path.join(packageDir, ".validated-task-manifest.json"), `${JSON.stringify(taskManifest, null, 2)}\n`, { mode: 0o600 });
  fs.writeFileSync(path.join(packageDir, ".validated-source-manifest.json"), `${JSON.stringify(sourceManifest, null, 2)}\n`, { mode: 0o600 });
  const replacementState = rerunStatePath === "" ? null : requireRegularJson(path.resolve(rerunStatePath), "rerun state");
  if (expectedLocal.spend_usd > 1500 + Number.EPSILON) throw new Error("combined original and rerun spend exceeds the official $1,500 maximum");
  const boundsInWindow = windowValid && bounds.start_ms >= windowStart && bounds.end_ms <= windowEnd;
  const expectedTolerance = typeof activity.local?.spend_usd === "number" ? Math.max(0.01, Math.abs(activity.local.spend_usd) * 0.01) : NaN;
  const arithmeticValid = typeof activity.local?.spend_usd === "number" && Number.isFinite(activity.local.spend_usd) && activity.local.spend_usd >= 0 &&
    typeof activity.local?.replacement_spend_usd === "number" && Number.isFinite(activity.local.replacement_spend_usd) && activity.local.replacement_spend_usd >= 0 &&
    typeof activity.activity_export?.spend_usd === "number" && Number.isFinite(activity.activity_export.spend_usd) && activity.activity_export.spend_usd >= 0 &&
    typeof activity.delta_usd === "number" && Number.isFinite(activity.delta_usd) && typeof activity.tolerance_usd === "number" && Number.isFinite(activity.tolerance_usd) &&
    spendClose(activity.delta_usd, activity.activity_export.spend_usd - activity.local.spend_usd) && spendClose(activity.tolerance_usd, expectedTolerance) &&
    activity.within_tolerance === (Math.abs(activity.delta_usd) <= activity.tolerance_usd) &&
    Number.isInteger(activity.activity_export.row_count) && activity.activity_export.row_count >= 1 && Number.isInteger(activity.activity_export.matching_row_count) &&
    activity.activity_export.matching_row_count >= 1 && activity.activity_export.matching_row_count <= activity.activity_export.row_count &&
    typeof activity.binding?.run_ids_sha256 === "string" && /^sha256:[0-9a-f]{64}$/.test(activity.binding.run_ids_sha256) &&
    typeof activity.binding?.results_sha256 === "string" && /^sha256:[0-9a-f]{64}$/.test(activity.binding.results_sha256) &&
    typeof activity.binding?.state_sha256 === "string" && /^sha256:[0-9a-f]{64}$/.test(activity.binding.state_sha256) &&
    (rerunStatePath === "" ? activity.binding?.replacement_state_sha256 === null : typeof activity.binding?.replacement_state_sha256 === "string" && /^sha256:[0-9a-f]{64}$/.test(activity.binding.replacement_state_sha256));
  const localMatchesEvidence = activity.local?.run_count === expectedLocal.run_count && activity.local?.retry_run_count === expectedLocal.retry_run_count &&
    activity.local?.usage_event_count === expectedLocal.usage_event_count && spendClose(activity.local?.interrupted_spend_usd, expectedLocal.interrupted_spend_usd) &&
    spendClose(activity.local?.replacement_spend_usd, expectedLocal.replacement_spend_usd) && spendClose(activity.local?.spend_usd, expectedLocal.spend_usd) &&
    spendClose(activity.local?.runner_spend_usd, expectedLocal.runner_spend_usd) &&
    (expectedLocal.replacement_runner_spend_usd === null ? activity.local?.replacement_runner_spend_usd === null : spendClose(activity.local?.replacement_runner_spend_usd, expectedLocal.replacement_runner_spend_usd)) &&
    (replacementState === null || spendClose(expectedLocal.replacement_runner_spend_usd, replacementState.spentUsd));
  if (activity.version !== 1 || activity.within_tolerance !== true || activity.model !== runs[0]?.model || activity.price_book !== runs[0]?.price_book ||
    !arithmeticValid || !localMatchesEvidence || activityWindow?.operator_supplied !== true || !boundsInWindow ||
    activity.binding?.run_ids_sha256 !== binding.run_ids_sha256 || activity.binding?.results_sha256 !== binding.results_sha256 ||
    activity.binding?.state_sha256 !== binding.state_sha256 || activity.binding?.replacement_state_sha256 !== binding.replacement_state_sha256 ||
    !spendClose(activity.local?.runner_spend_usd, state.spentUsd)) {
    throw new Error("official archive requires a passing Activity Export summary matching the result identity");
  }
}
const allRunPaths = [];
const collectRunPaths = (directory) => {
  for (const name of fs.readdirSync(directory)) {
    const candidate = path.join(directory, name);
    const info = fs.lstatSync(candidate);
    if (info.isSymbolicLink()) throw new Error(`results tree contains a symlink: ${candidate}`);
    if (info.isDirectory()) {
      if (name !== "workspace") collectRunPaths(candidate);
    } else if (info.isFile() && name === "run.json") {
      allRunPaths.push(candidate);
    }
  }
};
collectRunPaths(results);
let artifactSpend = 0;
for (const runPath of allRunPaths) {
  const artifact = validateC4Run(JSON.parse(fs.readFileSync(runPath, "utf8")));
  if (!currentRunIds.has(artifact.run_id)) throw new Error(`attempt artifact does not match a current result: ${runPath}`);
  if (artifact.spend_usd_estimate === null) {
    if (!nonOfficial) throw new Error(`cannot reconcile unavailable spend in result artifact: ${runPath}`);
  } else {
    artifactSpend += artifact.spend_usd_estimate;
  }
}
artifactSpend += state.cells.reduce((total, cell) => total + (cell.interruptedSpendUsd ?? 0), 0);
if (Math.abs(artifactSpend - state.spentUsd) > 1e-9) throw new Error(`runner state spend does not reconcile with result artifacts: state=${state.spentUsd}, artifacts=${artifactSpend}`);
const stateIds = new Set(state.cells.map((cell) => cell.id));
const runIds = new Set(runs.map((run) => run.run_id));
if (stateIds.size !== state.cells.length || runIds.size !== runs.length || stateIds.size !== runIds.size || [...stateIds].some((id) => !runIds.has(id))) {
  throw new Error("runner state and result files do not describe the same complete matrix");
}
if (!nonOfficial) {
  const tasks = new Set();
  const reps = new Set();
  const combinations = new Set();
  for (const run of runs) {
    if (!officialTools.has(run.tool) || run.condition !== "pinned" || !Number.isInteger(run.rep) || run.rep < 0) {
      throw new Error("official archive contains a non-official tool, condition, or repetition");
    }
    tasks.add(run.task_id);
    reps.add(run.rep);
    const combination = `${run.tool}\u0000${run.task_id}\u0000${run.rep}`;
    if (combinations.has(combination)) throw new Error(`official archive contains a duplicate matrix combination: ${combination}`);
    combinations.add(combination);
  }
  if (tasks.size < 8 || tasks.size > 10) throw new Error("official archive must contain 8 to 10 tasks");
  if (reps.size < (batchProtocol ? 5 : 4) || [...reps].sort((a, b) => a - b).some((rep, index) => rep !== index)) throw new Error(`official archive repetitions must be contiguous and at least ${batchProtocol ? "five" : "four"}`);
  const expectedCartesian = officialTools.size * tasks.size * reps.size;
  if (expected !== expectedCartesian || combinations.size !== expectedCartesian) throw new Error("official archive does not contain the exact configured-tool pinned Cartesian matrix");
  const globalIdentities = new Set(runs.map((run) => [run.model, run.condition, run.task_source, run.task_repository ?? "", run.task_revision, run.task_regime, run.price_book, run.ori_version].join("\u0000")));
  if (globalIdentities.size !== 1) throw new Error("official archive mixes model, condition, source, regime, price-book, or Ori identities");
  for (const tool of officialTools) {
    const toolRuns = runs.filter((run) => run.tool === tool);
    const toolVersions = new Set(toolRuns.map((run) => run.tool_version));
    if (toolVersions.size !== 1) throw new Error(`official archive mixes tool versions for ${tool}`);
  }
  if (batchProtocol) {
    const sameSet = (left, right) => Array.isArray(left) && new Set(left).size === left.length && left.length === right.size && left.every((item) => right.has(item));
    if (!sameSet(definition.tools, officialTools) || !sameSet(definition.tasks?.map((task) => task.id), tasks) || definition.reps !== reps.size) throw new Error("official batch definition does not match the full configured Cartesian matrix");
    const seen = new Set();
    let previous;
    for (const cell of state.cells) {
      if (cell.tool !== previous && seen.has(cell.tool)) throw new Error("official batch state is not grouped by tool");
      seen.add(cell.tool); previous = cell.tool;
    }
  } else {
    for (let index = 0; index < state.cells.length; index += officialTools.size) {
      const block = state.cells.slice(index, index + officialTools.size);
      if (block.length !== officialTools.size) throw new Error("official archive state has an incomplete randomization block");
      const blockKey = `${block[0].condition}\u0000${block[0].task_id}\u0000${block[0].rep}`;
      if (block.some((cell) => `${cell.condition}\u0000${cell.task_id}\u0000${cell.rep}` !== blockKey || !officialTools.has(cell.tool)) || new Set(block.map((cell) => cell.tool)).size !== officialTools.size) {
        throw new Error("official archive state is not block-randomized by task and repetition");
      }
    }
  }
}
const anomalies = reviewAnomalies(loaded);
const anomalyGroupKey = (run) => [run.tool, run.task_id, run.task_repository ?? "", run.task_source, run.task_revision,
  run.task_regime, run.condition, run.model, run.price_book].join("\u0000");
const replacementAnomalies = (original, replacement) => {
  const peers = loaded.filter((cell) => cell.run.run_id !== original.run_id && anomalyGroupKey(cell.run) === anomalyGroupKey(original));
  return reviewAnomalies([...peers, replacement]);
};
function validateReview(review) {
  if (review.version !== 1 || !Array.isArray(review.cells)) throw new Error("anomaly review record is malformed");
  const entries = new Map();
  const anomalyIds = new Set(anomalies.map((anomaly) => anomaly.runId));
  const replacementIds = new Set();
  for (const entry of review.cells) {
    if (!entry || typeof entry.run_id !== "string" || (entry.disposition !== "explained" && entry.disposition !== "rerun") || typeof entry.note !== "string" || entry.note.trim() === "") throw new Error("anomaly review entries require run_id, disposition, and note");
    if (entries.has(entry.run_id)) throw new Error(`duplicate anomaly review entry: ${entry.run_id}`);
    if (!runIds.has(entry.run_id)) throw new Error(`anomaly review references an unknown run: ${entry.run_id}`);
    if (!anomalyIds.has(entry.run_id)) throw new Error(`anomaly review contains a non-anomalous run: ${entry.run_id}`);
    if (entry.disposition === "explained" && entry.replacement_run_id !== undefined) throw new Error(`explained anomaly must not name a replacement: ${entry.run_id}`);
    if (entry.disposition === "rerun" && typeof entry.replacement_run_id === "string") {
      if (replacementIds.has(entry.replacement_run_id)) throw new Error(`replacement run is assigned more than once: ${entry.replacement_run_id}`);
      replacementIds.add(entry.replacement_run_id);
    }
    entries.set(entry.run_id, entry);
  }
  for (const anomaly of anomalies) {
    const entry = entries.get(anomaly.runId);
    if (!entry) throw new Error(`anomaly review does not cover ${anomaly.runId}`);
    if (entry.disposition === "rerun") {
      if (typeof entry.replacement_run_id !== "string" || entry.replacement_run_id.length === 0) throw new Error(`rerun disposition requires replacement_run_id for ${anomaly.runId}`);
      const replacement = rerunRuns.find((run) => run.run_id === entry.replacement_run_id);
      const original = runs.find((run) => run.run_id === anomaly.runId);
      if (!replacement || !original || replacement.run_id === original.run_id || reviewIdentity(replacement) !== reviewIdentity(original) || replacement.outcome !== "completed") {
        throw new Error(`rerun disposition has no valid completed replacement for ${anomaly.runId}`);
      }
      const replacementCell = rerunLoaded.find((cell) => cell.run.run_id === replacement.run_id);
      if (!replacementCell || replacementAnomalies(original, replacementCell).some((candidate) => candidate.runId === replacement.run_id)) {
        throw new Error(`rerun disposition replacement is anomalous for ${anomaly.runId}`);
      }
    }
  }
  return entries;
}
if (anomalyReviewPath) {
  const reviewFile = path.resolve(anomalyReviewPath);
  if (!fs.existsSync(reviewFile) || fs.lstatSync(reviewFile).isSymbolicLink() || !fs.lstatSync(reviewFile).isFile()) throw new Error("anomaly review record is unavailable or is a symlink");
  const validatedReview = JSON.parse(fs.readFileSync(reviewFile, "utf8"));
  validateReview(validatedReview);
  fs.writeFileSync(path.join(packageDir, ".validated-anomaly-review.json"), `${JSON.stringify(validatedReview, null, 2)}\n`, { mode: 0o600 });
} else if (anomalies.length > 0) {
  throw new Error("official archive contains unresolved anomalies; provide an anomaly review record");
}
for (const run of runs) {
  const cell = state.cells.find((candidate) => candidate.id === run.run_id);
  if (!cell || cell.tool !== run.tool || cell.task_id !== run.task_id || cell.condition !== run.condition || cell.rep !== run.rep) {
    throw new Error(`result does not match runner state: ${run.run_id}`);
  }
}
})().catch((error) => { throw error; });
NODE
[ ! -e "$ARCHIVE" ] && [ ! -L "$ARCHIVE" ] || { printf 'S7 freeze: archive path already exists; frozen archives are immutable: %s\n' "$ARCHIVE" >&2; exit 1; }
[ ! -e "${ARCHIVE}.sha256" ] && [ ! -L "${ARCHIVE}.sha256" ] || { printf 'S7 freeze: archive checksum path already exists: %s.sha256\n' "$ARCHIVE" >&2; exit 1; }

mkdir -p "$PACKAGE_DIR/results" "$PACKAGE_DIR/report"
node --experimental-strip-types --no-warnings --experimental-loader "$ROOT/scripts/ts-source-loader.mjs" \
  "$ROOT/packages/report/src/freeze-cli.ts" "$RESULTS" "$PACKAGE_DIR/results" "$STATE" "$PACKAGE_DIR/provenance" "$RERUN_RESULTS" "$ANOMALY_REVIEW" "$LEDGER_ARG"
node --experimental-strip-types --no-warnings --experimental-loader "$ROOT/scripts/ts-source-loader.mjs" \
  --input-type=module - "$ROOT" "$STATE" "$PACKAGE_DIR" <<'NODE'
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
const [root, statePath, packageDir] = process.argv.slice(2);
const state = JSON.parse(readFileSync(statePath, "utf8"));
const definition = state.definition_key === undefined ? null : JSON.parse(state.definition_key);
if (definition?.executionProtocol === "tool-batches-v1") {
  const { copySanitizedValidation } = await import(pathToFileURL(join(root, "packages/report/src/freeze.ts")).href);
  copySanitizedValidation(join(dirname(statePath), "provenance", "validation"), join(packageDir, "provenance", "validation"), definition, join(packageDir, "results"));
}
NODE
if [ "${AOB_ALLOW_NONOFFICIAL_FREEZE:-0}" != "1" ]; then
  [ -f "$PACKAGE_DIR/.review-evidence.json" ] || { printf 'S7 freeze: validated source review evidence is missing\n' >&2; exit 1; }
  mv "$PACKAGE_DIR/.review-evidence.json" "$PACKAGE_DIR/provenance/review-evidence.json"
fi
if [ -n "$RERUN_RESULTS" ]; then
  mkdir -p "$PACKAGE_DIR/provenance/reruns"
  node --experimental-strip-types --no-warnings --experimental-loader "$ROOT/scripts/ts-source-loader.mjs" \
    "$ROOT/packages/report/src/freeze-cli.ts" "$RERUN_RESULTS" "$PACKAGE_DIR/provenance/reruns" "$RERUN_STATE" "$PACKAGE_DIR/provenance/rerun-state" "" "" "$RERUN_WINDOW_LEDGER"
  rm -rf "$PACKAGE_DIR/provenance/reruns/provenance" "$PACKAGE_DIR/provenance/reruns/report"
fi
if [ "${AOB_ALLOW_NONOFFICIAL_FREEZE:-0}" != "1" ]; then
  mv "$PACKAGE_DIR/.validated-task-manifest.json" "$PACKAGE_DIR/provenance/task-manifest.json"
  mv "$PACKAGE_DIR/.validated-source-manifest.json" "$PACKAGE_DIR/provenance/source-manifest.json"
  mv "$PACKAGE_DIR/.validated-activity-summary.json" "$PACKAGE_DIR/provenance/activity-export-summary.json"
  mv "$PACKAGE_DIR/.calibration-attestation.json" "$PACKAGE_DIR/provenance/calibration-attestation.json"
  mv "$PACKAGE_DIR/.calibration-summary.json" "$PACKAGE_DIR/provenance/calibration-summary.json"
  cp "$OFFICIAL_SCOPE" "$PACKAGE_DIR/provenance/official-tool-scope.json"
fi
if [ "${AOB_ALLOW_NONOFFICIAL_FREEZE:-0}" != "1" ] && [ -n "$RERUN_RESULTS" ]; then
  node --experimental-strip-types --no-warnings --experimental-loader "$ROOT/scripts/ts-source-loader.mjs" \
    --input-type=module - "$ROOT" "$PACKAGE_DIR/provenance/rerun-state/run-window-ledger.json" "$PACKAGE_DIR/provenance/reruns" <<'NODE'
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const root = process.argv[2];
const ledgerPath = process.argv[3];
const resultsPath = process.argv[4];
const { assertOfficialRunWindow, bindRunWindowResults } = await import(pathToFileURL(join(root, "packages/runner/src/window-ledger.ts")).href);
const ledger = assertOfficialRunWindow(JSON.parse(readFileSync(ledgerPath, "utf8")));
const resultBinding = bindRunWindowResults(resultsPath);
if (resultBinding === null) throw new Error("sanitized replacement results have no binding");
writeFileSync(ledgerPath, `${JSON.stringify(assertOfficialRunWindow({ ...ledger, results_binding: resultBinding }), null, 2)}\n`, { mode: 0o600 });
NODE
fi
if [ -n "$ANOMALY_REVIEW" ]; then
  mkdir -p "$PACKAGE_DIR/review"
  mv "$PACKAGE_DIR/.validated-anomaly-review.json" "$PACKAGE_DIR/review/anomaly-review.json"
fi
if [ "${AOB_ALLOW_NONOFFICIAL_FREEZE:-0}" != "1" ]; then
  node --experimental-strip-types --no-warnings --experimental-loader "$ROOT/scripts/ts-source-loader.mjs" \
    --input-type=module - "$ROOT" "$PACKAGE_DIR" <<'NODE'
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const root = process.argv[2];
const packageDir = process.argv[3];
const ledgerPath = join(packageDir, "provenance", "run-window-ledger.json");
const state = JSON.parse(readFileSync(join(packageDir, "provenance", "runner-state.json"), "utf8"));
const definition = state.definition_key === undefined ? null : JSON.parse(state.definition_key);
const options = {
  expectedCellIds: new Set(state.cells.map((cell) => cell.id)),
  expectedRetryCounts: new Map(state.cells.map((cell) => [cell.id, cell.retries])),
  ...(definition?.executionProtocol === "tool-batches-v1" ? { executionProtocol: "tool-batches-v1", expectedCellTools: new Map(state.cells.map((cell) => [cell.id, cell.tool])) } : {}),
};
const { assertOfficialRunWindow, bindRunWindowResults } = await import(pathToFileURL(join(root, "packages/runner/src/window-ledger.ts")).href);
const ledger = assertOfficialRunWindow(JSON.parse(readFileSync(ledgerPath, "utf8")), options);
const resultsBinding = bindRunWindowResults(join(packageDir, "results"));
if (resultsBinding === null) throw new Error("sanitized archive results have no binding");
writeFileSync(ledgerPath, `${JSON.stringify(assertOfficialRunWindow({ ...ledger, results_binding: resultsBinding }, options), null, 2)}\n`, { mode: 0o600 });
NODE
fi
node - "$RESULTS" "$STATE" "$EXPECTED_CELLS" "$PACKAGE_DIR/provenance" "$OFFICIAL_SCOPE" <<'NODE'
const fs = require("node:fs");
const { createHash } = require("node:crypto");
const path = require("node:path");
const results = path.resolve(process.argv[2]);
const state = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
const expectedCells = Number(process.argv[4]);
const provenance = path.resolve(process.argv[5]);
const officialScopePath = path.resolve(process.argv[6]);
const official = process.env.AOB_ALLOW_NONOFFICIAL_FREEZE !== "1";
const runs = [];
const visit = (directory) => {
  for (const name of fs.readdirSync(directory)) {
    const candidate = path.join(directory, name);
    const info = fs.lstatSync(candidate);
    if (info.isDirectory()) {
      if (name !== "workspace" && name !== ".attempts") visit(candidate);
    } else if (info.isFile() && name === "run.json") runs.push(JSON.parse(fs.readFileSync(candidate, "utf8")));
  }
};
visit(results);
const first = runs[0];
if (!first) throw new Error("release marker requires at least one current run");
const marker = {
  version: 1,
  official,
  expected_cells: expectedCells,
  task_source: first.task_source,
  task_repository: first.task_repository ?? "",
  task_revision: first.task_revision,
  task_regime: first.task_regime,
  model: first.model,
  condition: first.condition,
  price_book: first.price_book,
  tools: [...new Set(runs.map((run) => run.tool))].sort(),
  tool_scope_sha256: `sha256:${createHash("sha256").update(fs.readFileSync(officialScopePath)).digest("hex")}`,
  run_window_session_id: state.run_window_session_id ?? null,
  ...(state.definition_key !== undefined && JSON.parse(state.definition_key).executionProtocol === "tool-batches-v1" ? { execution_protocol: "tool-batches-v1" } : {}),
};
fs.mkdirSync(provenance, { recursive: true });
fs.writeFileSync(path.join(provenance, "release-manifest.json"), `${JSON.stringify(marker, null, 2)}\n`, { mode: 0o600 });
NODE
node --experimental-strip-types --no-warnings --experimental-loader "$ROOT/scripts/ts-source-loader.mjs" \
  "$ROOT/packages/report/src/cli.ts" "$PACKAGE_DIR/results" --out "$PACKAGE_DIR/report" >/dev/null
node --experimental-strip-types --no-warnings --experimental-loader "$ROOT/scripts/ts-source-loader.mjs" \
  --input-type=module - "$ROOT" "$PACKAGE_DIR" <<'NODE'
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const root = process.argv[2];
const packageDir = process.argv[3];
const activityPath = join(packageDir, "provenance", "activity-export-summary.json");
const activity = existsSync(activityPath) ? JSON.parse(readFileSync(activityPath, "utf8")) : null;
const sourceBinding = activity?.binding ?? null;
const { computePortableArchiveBinding } = await import(pathToFileURL(join(root, "packages/report/src/archive-binding.ts")).href);
const binding = computePortableArchiveBinding(packageDir, sourceBinding);
writeFileSync(join(packageDir, "provenance", "archive-binding.json"), `${JSON.stringify(binding, null, 2)}\n`, { mode: 0o600 });
NODE
: > "$PACKAGE_DIR/SHA256SUMS"
(find "$PACKAGE_DIR/results" "$PACKAGE_DIR/report" -type f -print
if [ -d "$PACKAGE_DIR/provenance" ]; then find "$PACKAGE_DIR/provenance" -type f -print; fi
if [ -d "$PACKAGE_DIR/review" ]; then find "$PACKAGE_DIR/review" -type f -print; fi) |
sort |
while IFS= read -r file; do
  rel=${file#"$PACKAGE_DIR"/}
  if command -v sha256sum >/dev/null 2>&1; then
    (cd "$PACKAGE_DIR" && sha256sum "$rel") >> "$PACKAGE_DIR/SHA256SUMS"
  else
    (cd "$PACKAGE_DIR" && shasum -a 256 "$rel") >> "$PACKAGE_DIR/SHA256SUMS"
  fi
done
mkdir -p "$(dirname "$ARCHIVE")"
if [ -d "$PACKAGE_DIR/review" ]; then
  if [ -d "$PACKAGE_DIR/provenance" ]; then
    tar -czf "$ARCHIVE" -C "$PACKAGE_DIR" results report review provenance SHA256SUMS
  else
    tar -czf "$ARCHIVE" -C "$PACKAGE_DIR" results report review SHA256SUMS
  fi
elif [ -d "$PACKAGE_DIR/provenance" ]; then
  tar -czf "$ARCHIVE" -C "$PACKAGE_DIR" results report provenance SHA256SUMS
else
  tar -czf "$ARCHIVE" -C "$PACKAGE_DIR" results report SHA256SUMS
fi
if command -v sha256sum >/dev/null 2>&1; then
  sha256sum "$ARCHIVE" > "$MANIFEST"
else
  shasum -a 256 "$ARCHIVE" > "$MANIFEST"
fi
cp "$MANIFEST" "${ARCHIVE}.sha256"
if [ "${AOB_ALLOW_NONOFFICIAL_FREEZE:-0}" = "1" ]; then
  "$ROOT/scripts/s7-verify-archive.sh" "$ARCHIVE"
else
  "$ROOT/scripts/s7-verify-archive.sh" --official "$ARCHIVE"
fi
printf 'S7 archive: %s\n' "$ARCHIVE"
cat "$MANIFEST"
