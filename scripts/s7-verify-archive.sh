#!/usr/bin/env sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
REQUIRE_OFFICIAL=0
if [ "${1:-}" = "--official" ]; then
  REQUIRE_OFFICIAL=1
  shift
fi
ARCHIVE=${1:?usage: scripts/s7-verify-archive.sh [--official] ARCHIVE_PATH}
CHECKOUT=$(mktemp -d /tmp/aob-s7-verify-XXXXXX)
LIST=$(mktemp /tmp/aob-s7-entries-XXXXXX)
DETAILS=$(mktemp /tmp/aob-s7-details-XXXXXX)
trap 'rm -rf "$CHECKOUT"; rm -f "$LIST" "$DETAILS"' EXIT HUP INT TERM

[ -f "$ARCHIVE" ] || { printf 'S7 archive is missing: %s\n' "$ARCHIVE" >&2; exit 1; }
[ -f "${ARCHIVE}.sha256" ] || { printf 'S7 archive sidecar checksum is missing: %s.sha256\n' "$ARCHIVE" >&2; exit 1; }
EXPECTED_ARCHIVE_SHA=$(awk 'NF { print $1; exit }' "${ARCHIVE}.sha256")
[ "${#EXPECTED_ARCHIVE_SHA}" -eq 64 ] || { printf 'S7 archive sidecar checksum is malformed\n' >&2; exit 1; }
if command -v sha256sum >/dev/null 2>&1; then
  ACTUAL_ARCHIVE_SHA=$(sha256sum "$ARCHIVE" | awk '{print $1}')
else
  ACTUAL_ARCHIVE_SHA=$(shasum -a 256 "$ARCHIVE" | awk '{print $1}')
fi
[ "$ACTUAL_ARCHIVE_SHA" = "$EXPECTED_ARCHIVE_SHA" ] || { printf 'S7 archive sidecar checksum does not match\n' >&2; exit 1; }
tar -tzf "$ARCHIVE" > "$LIST"
while IFS= read -r entry; do
  case "$entry" in
    SHA256SUMS|results/|results/*|report/|report/*|review/|review/anomaly-review.json|provenance/|provenance/runner-state.json|provenance/run-window-ledger.json|provenance/release-manifest.json|provenance/official-tool-scope.json|provenance/archive-binding.json|provenance/task-manifest.json|provenance/source-manifest.json|provenance/review-evidence.json|provenance/calibration-attestation.json|provenance/calibration-summary.json|provenance/activity-export-summary.json|provenance/resolved-replacements.json|provenance/anomalies/|provenance/anomalies/*|provenance/retries/|provenance/retries/*|provenance/reruns/|provenance/reruns/*|provenance/rerun-state/|provenance/rerun-state/*|provenance/validation/|provenance/validation/state.json|provenance/validation/results/|provenance/validation/results/*) ;;
    *) printf 'S7 archive contains an unexpected path: %s\n' "$entry" >&2; exit 1 ;;
  esac
  case "$entry" in
    /*|../*|*/../*|*/..|.. ) printf 'S7 archive contains a traversal path: %s\n' "$entry" >&2; exit 1 ;;
  esac
done < "$LIST"
tar -tvzf "$ARCHIVE" > "$DETAILS"
while IFS= read -r detail; do
  type=${detail%${detail#?}}
  case "$type" in
    -|d) ;;
    *) printf 'S7 archive contains a non-regular entry\n' >&2; exit 1 ;;
  esac
done < "$DETAILS"
tar -xzf "$ARCHIVE" -C "$CHECKOUT"
[ -f "$CHECKOUT/SHA256SUMS" ] || { printf 'S7 archive has no SHA256SUMS\n' >&2; exit 1; }
[ -d "$CHECKOUT/results" ] || { printf 'S7 archive has no results directory\n' >&2; exit 1; }
[ -d "$CHECKOUT/report" ] || { printf 'S7 archive has no report directory\n' >&2; exit 1; }
[ -f "$CHECKOUT/report/README.md" ] || { printf 'S7 archive has no report README\n' >&2; exit 1; }
[ -f "$CHECKOUT/report/index.html" ] || { printf 'S7 archive has no report HTML\n' >&2; exit 1; }
[ ! -e "$CHECKOUT/provenance" ] || {
  [ -d "$CHECKOUT/provenance" ] || { printf 'S7 archive provenance path is not a directory\n' >&2; exit 1; }
  [ -f "$CHECKOUT/provenance/runner-state.json" ] || { printf 'S7 archive runner state is missing\n' >&2; exit 1; }
  [ -f "$CHECKOUT/provenance/release-manifest.json" ] || { printf 'S7 archive release manifest is missing\n' >&2; exit 1; }
  node - "$CHECKOUT/provenance/release-manifest.json" "$REQUIRE_OFFICIAL" <<'NODE' || { printf 'S7 archive release manifest is malformed or not official\n' >&2; exit 1; }
const fs = require("node:fs");
const marker = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const requireOfficial = process.argv[3] === "1";
if (marker.version !== 1 || typeof marker.official !== "boolean" || !Number.isInteger(marker.expected_cells) || marker.expected_cells <= 0 ||
  typeof marker.task_source !== "string" || typeof marker.task_repository !== "string" || typeof marker.task_revision !== "string" ||
  !["short", "long", "extended"].includes(marker.task_regime) || typeof marker.model !== "string" ||
  (marker.condition !== "pinned" && marker.condition !== "default") || typeof marker.price_book !== "string" ||
  (marker.official && (!Array.isArray(marker.tools) || marker.tools.length < 5 || marker.tools.length > 7 || marker.tools.some((tool) => typeof tool !== "string"))) ||
  (marker.official && (typeof marker.tool_scope_sha256 !== "string" || !/^sha256:[0-9a-f]{64}$/.test(marker.tool_scope_sha256))) ||
  ("execution_protocol" in marker && marker.execution_protocol !== "tool-batches-v1") ||
  (marker.run_window_session_id !== null && typeof marker.run_window_session_id !== "string") ||
  (requireOfficial && marker.official !== true)) process.exit(1);
NODE
if [ "$REQUIRE_OFFICIAL" = "1" ]; then
    [ -f "$CHECKOUT/provenance/run-window-ledger.json" ] || { printf 'S7 official archive run-window ledger is missing\n' >&2; exit 1; }
    [ -f "$CHECKOUT/provenance/official-tool-scope.json" ] || { printf 'S7 official archive tool scope is missing\n' >&2; exit 1; }
  elif node -e 'const fs=require("node:fs"); const v=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); process.exit(v.run_window_session_id ? 0 : 1)' "$CHECKOUT/provenance/runner-state.json"; then
    [ -f "$CHECKOUT/provenance/run-window-ledger.json" ] || { printf 'S7 archive run-window ledger is missing\n' >&2; exit 1; }
  fi
  [ -f "$CHECKOUT/provenance/archive-binding.json" ] || { printf 'S7 archive portable binding is missing\n' >&2; exit 1; }
  node -e 'const fs=require("node:fs"); const p=process.argv[1]; const v=JSON.parse(fs.readFileSync(p,"utf8")); if (v.version !== 1 || !Array.isArray(v.cells) || typeof v.spentUsd !== "number") process.exit(1);' "$CHECKOUT/provenance/runner-state.json" || { printf 'S7 archive runner state is malformed\n' >&2; exit 1; }
  if [ -e "$CHECKOUT/provenance/rerun-state" ]; then
    [ -f "$CHECKOUT/provenance/rerun-state/runner-state.json" ] || { printf 'S7 archive rerun state is missing\n' >&2; exit 1; }
    node -e 'const fs=require("node:fs"); const p=process.argv[1]; const v=JSON.parse(fs.readFileSync(p,"utf8")); if(v.version!==1||!Array.isArray(v.cells)||typeof v.spentUsd!=="number") process.exit(1);' "$CHECKOUT/provenance/rerun-state/runner-state.json" || { printf 'S7 archive rerun state is malformed\n' >&2; exit 1; }
  fi
  if [ -e "$CHECKOUT/provenance/task-manifest.json" ] || [ -e "$CHECKOUT/provenance/source-manifest.json" ] || [ -e "$CHECKOUT/provenance/activity-export-summary.json" ]; then
    [ -f "$CHECKOUT/provenance/task-manifest.json" ] || { printf 'S7 archive task manifest is missing\n' >&2; exit 1; }
    [ -f "$CHECKOUT/provenance/source-manifest.json" ] || { printf 'S7 archive source manifest is missing\n' >&2; exit 1; }
    [ -f "$CHECKOUT/provenance/review-evidence.json" ] || { printf 'S7 archive source review evidence is missing\n' >&2; exit 1; }
    [ -f "$CHECKOUT/provenance/calibration-attestation.json" ] || { printf 'S7 archive calibration attestation is missing\n' >&2; exit 1; }
    [ -f "$CHECKOUT/provenance/calibration-summary.json" ] || { printf 'S7 archive calibration summary is missing\n' >&2; exit 1; }
    [ -f "$CHECKOUT/provenance/activity-export-summary.json" ] || { printf 'S7 archive Activity Export summary is missing\n' >&2; exit 1; }
    node -e 'const fs=require("node:fs"); const v=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); const state=JSON.parse(fs.readFileSync(process.argv[2],"utf8")); const rerun=fs.existsSync(process.argv[3])?JSON.parse(fs.readFileSync(process.argv[3],"utf8")):null; const sha=x=>typeof x==="string"&&/^sha256:[0-9a-f]{64}$/.test(x); const n=x=>typeof x==="number"&&Number.isFinite(x); const close=(a,b)=>n(a)&&n(b)&&Math.abs(a-b)<=Math.max(1e-6,Math.max(Math.abs(a),Math.abs(b))*1e-6); const start=Date.parse(v.window?.start_iso??""); const end=Date.parse(v.window?.end_iso??""); const local=v.local; const ext=v.activity_export; const expectedTol=n(local?.spend_usd)?Math.max(.01,Math.abs(local.spend_usd)*.01):NaN; const rerunValid=rerun===null?local?.replacement_runner_spend_usd===null&&v.binding?.replacement_state_sha256===null:close(local?.replacement_runner_spend_usd,rerun.spentUsd)&&close(local?.replacement_spend_usd,rerun.spentUsd)&&sha(v.binding?.replacement_state_sha256); const arithmetic=close(local?.runner_spend_usd,state.spentUsd)&&n(local?.replacement_spend_usd)&&n(local?.spend_usd)&&close(local.spend_usd,state.spentUsd+(rerun?.spentUsd??0))&&local.spend_usd<=1500+Number.EPSILON&&n(ext?.spend_usd)&&ext.spend_usd>=0&&sha(ext?.sha256)&&n(v.delta_usd)&&close(v.delta_usd,ext.spend_usd-local.spend_usd)&&n(v.tolerance_usd)&&close(v.tolerance_usd,expectedTol)&&v.within_tolerance===(Math.abs(v.delta_usd)<=v.tolerance_usd); const counts=Number.isInteger(ext?.row_count)&&ext.row_count>=1&&Number.isInteger(ext?.matching_row_count)&&ext.matching_row_count>=1&&ext.matching_row_count<=ext.row_count; if(v.version!==1||v.within_tolerance!==true||typeof v.model!=="string"||v.model===""||typeof v.price_book!=="string"||v.price_book===""||v.window?.operator_supplied!==true||!Number.isFinite(start)||!Number.isFinite(end)||new Date(start).toISOString()!==v.window.start_iso||new Date(end).toISOString()!==v.window.end_iso||start>=end||!sha(v.binding?.run_ids_sha256)||!sha(v.binding?.results_sha256)||!sha(v.binding?.state_sha256)||!rerunValid||!arithmetic||!counts) process.exit(1);' "$CHECKOUT/provenance/activity-export-summary.json" "$CHECKOUT/provenance/runner-state.json" "$CHECKOUT/provenance/rerun-state/runner-state.json" || { printf 'S7 archive Activity Export summary is malformed, inconsistent, or failing\n' >&2; exit 1; }
  fi
}
[ ! -e "$CHECKOUT/review" ] || {
  [ -d "$CHECKOUT/review" ] || { printf 'S7 archive review path is not a directory\n' >&2; exit 1; }
  [ -f "$CHECKOUT/review/anomaly-review.json" ] || { printf 'S7 archive review record is missing\n' >&2; exit 1; }
  node -e 'const fs=require("node:fs"); const p=process.argv[1]; const v=JSON.parse(fs.readFileSync(p,"utf8")); if (v.version !== 1 || !Array.isArray(v.cells)) process.exit(1);' "$CHECKOUT/review/anomaly-review.json" || { printf 'S7 archive review record is malformed\n' >&2; exit 1; }
}
find "$CHECKOUT/results" -type f -name run.json -print -quit | grep -q . || { printf 'S7 archive has no run.json\n' >&2; exit 1; }
# Re-run the same C4/C1 loader against the extracted tree. This is independent
# of the tar filename checks and catches malformed or path-escaping records.
node --experimental-strip-types --no-warnings --experimental-loader "$ROOT/scripts/ts-source-loader.mjs" \
  --input-type=module - "$ROOT" "$CHECKOUT" "$CHECKOUT/results" <<'NODE'
import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
const root = process.argv[2];
const checkout = process.argv[3];
const results = process.argv[4];
const { loadResultsTree } = await import(pathToFileURL(join(root, "packages/report/src/from-results.ts")).href);
const { c4MeasurementIdentity } = await import(pathToFileURL(join(root, "packages/contracts/src/index.ts")).href);
const { sourceManifestSha256 } = await import(pathToFileURL(join(root, "packages/tasks/src/source.ts")).href);
const { computePortableArchiveBinding } = await import(pathToFileURL(join(root, "packages/report/src/archive-binding.ts")).href);
const { archivedActivityBinding } = await import(pathToFileURL(join(root, "packages/report/src/activity-cli.ts")).href);
const { assertOfficialRunWindow, assertRetryEvidenceCoverage, bindRunWindowResults, digestText } = await import(pathToFileURL(join(root, "packages/runner/src/window-ledger.ts")).href);
const releaseManifest = JSON.parse(readFileSync(join(checkout, "provenance", "release-manifest.json"), "utf8"));
let officialTools = null;
let archivedScope = null;
let primaryLedger = null;
const archiveBindingPath = join(checkout, "provenance", "archive-binding.json");
const archivedBinding = JSON.parse(readFileSync(archiveBindingPath, "utf8"));
const activitySummaryPath = join(checkout, "provenance", "activity-export-summary.json");
const activitySummary = existsSync(activitySummaryPath) ? JSON.parse(readFileSync(activitySummaryPath, "utf8")) : null;
const replacementPath = join(checkout, "provenance", "resolved-replacements.json");
let replacementRunIds = new Set();
let anomalyEvidenceRoot = null;
if (existsSync(replacementPath)) {
  const mapping = JSON.parse(readFileSync(replacementPath, "utf8"));
  if (Array.isArray(mapping.replacements)) {
    replacementRunIds = new Set(mapping.replacements.map((entry) => entry?.replacement_run_id).filter((id) => typeof id === "string"));
    anomalyEvidenceRoot = join(checkout, "provenance", "anomalies");
  }
}
if (activitySummary !== null && JSON.stringify(archivedActivityBinding(checkout)) !== JSON.stringify(activitySummary.binding)) {
  throw new Error("archive Activity binding does not match sanitized C1/C4/state evidence");
}
const expectedArchiveBinding = computePortableArchiveBinding(checkout, activitySummary?.binding ?? null);
if (JSON.stringify(archivedBinding) !== JSON.stringify(expectedArchiveBinding)) {
  throw new Error("archive binding manifest or source Activity binding does not match sanitized contents");
}
if (releaseManifest.official === true) {
  const scopePath = join(checkout, "provenance", "official-tool-scope.json");
  if (!existsSync(scopePath) || !lstatSync(scopePath).isFile() || lstatSync(scopePath).isSymbolicLink()) throw new Error("official archive tool scope is missing");
  archivedScope = JSON.parse(readFileSync(scopePath, "utf8"));
  const scope = archivedScope;
  const { validateOfficialScope } = await import(pathToFileURL(join(root, "scripts/official-profiles.mjs")).href);
  validateOfficialScope(scope);
  if (`sha256:${createHash("sha256").update(readFileSync(scopePath)).digest("hex")}` !== releaseManifest.tool_scope_sha256) throw new Error("official archive tool scope checksum does not match the release manifest");
  const scopeSorted = (value) => [...value].sort();
  if (JSON.stringify(scopeSorted(releaseManifest.tools ?? [])) !== JSON.stringify(scopeSorted(scope.tools))) throw new Error("official archive release manifest tool scope does not match the archived scope");
  officialTools = new Set(scope.tools);
  const taskManifestPath = join(checkout, "provenance", "task-manifest.json");
  const sourceManifestPath = join(checkout, "provenance", "source-manifest.json");
  const reviewEvidencePath = join(checkout, "provenance", "review-evidence.json");
  const calibrationAttestationPath = join(checkout, "provenance", "calibration-attestation.json");
  if (![taskManifestPath, sourceManifestPath, reviewEvidencePath, calibrationAttestationPath].every((file) => existsSync(file) && lstatSync(file).isFile() && !lstatSync(file).isSymbolicLink())) {
    throw new Error("official archive source-review provenance is incomplete");
  }
const taskManifest = JSON.parse(readFileSync(taskManifestPath, "utf8"));
const sourceManifest = JSON.parse(readFileSync(sourceManifestPath, "utf8"));
const canonical = (value) => Array.isArray(value) ? `[${value.map(canonical).join(",")}]` : value !== null && typeof value === "object" ? `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}` : JSON.stringify(value);
const sourceContentSha256 = (value) => {
  const { review: _review, ...content } = value;
  return `sha256:${createHash("sha256").update(canonical(content)).digest("hex")}`;
};
if (taskManifest.source_provenance?.source_manifest_sha256 !== sourceManifestSha256(sourceManifest)) {
  throw new Error("official archive task manifest is not bound to the archived source manifest");
}
  const review = taskManifest.source_provenance?.review;
  const sourceReview = sourceManifest.review;
  const reviewEvidenceBytes = readFileSync(reviewEvidencePath);
  const reviewEvidence = JSON.parse(reviewEvidenceBytes.toString("utf8"));
  const calibrationBytes = readFileSync(calibrationAttestationPath);
  const calibration = JSON.parse(calibrationBytes.toString("utf8"));
  if (calibration.source_manifest_sha256 !== sourceContentSha256(sourceManifest)) {
    throw new Error("official archive calibration attestation is not bound to the archived source content");
  }
  if (calibration.model !== releaseManifest.model || calibration.condition !== releaseManifest.condition || calibration.task_source !== releaseManifest.task_source || calibration.source_repository !== releaseManifest.task_repository || calibration.source_revision !== releaseManifest.task_revision || calibration.task_regime !== releaseManifest.task_regime || calibration.price_book !== releaseManifest.price_book) {
    throw new Error("official archive calibration attestation does not match the archived release identity");
  }
  const taskIds = [...new Set((loadResultsTree(results)).map((cell) => cell.run.task_id))].sort();
  const sorted = (value) => Array.isArray(value) ? [...value].sort() : value;
  if (!review || !sourceReview || ["source_reviewed", "reference_results_verified", "calibration_complete", "maintainer_signed_off"].some((key) => review[key] !== true) ||
    canonical(review) !== canonical(sourceReview) ||
    reviewEvidence.source_repository !== sourceManifest.repository || reviewEvidence.source_revision !== sourceManifest.revision ||
    reviewEvidence.reviewer !== review.reviewer || reviewEvidence.reviewed_at !== review.reviewed_at ||
    !reviewEvidence.review || ["source_reviewed", "reference_results_verified", "calibration_complete", "maintainer_signed_off"].some((key) => reviewEvidence.review[key] !== review[key]) ||
    reviewEvidence.review.calibration_attestation_file !== review.calibration_attestation_file ||
    reviewEvidence.review.calibration_attestation_sha256 !== review.calibration_attestation_sha256 ||
    JSON.stringify(sorted(reviewEvidence.selected_task_ids)) !== JSON.stringify(sorted(review.reviewed_task_ids)) ||
    JSON.stringify(sorted(reviewEvidence.calibration_adapters)) !== JSON.stringify(sorted(review.calibration_adapters)) ||
    `sha256:${createHash("sha256").update(reviewEvidenceBytes).digest("hex")}` !== review.evidence_sha256 ||
    `sha256:${createHash("sha256").update(calibrationBytes).digest("hex")}` !== review.calibration_attestation_sha256 ||
    taskIds.some((id) => !review.reviewed_task_ids.includes(id))) {
    throw new Error("official archive source review evidence does not match the archived manifests or results");
  }
  const calibrationSummaryPath = join(checkout, "provenance", "calibration-summary.json");
  const calibrationSummaryBytes = readFileSync(calibrationSummaryPath);
  const calibrationSummary = JSON.parse(calibrationSummaryBytes.toString("utf8"));
  if (`sha256:${createHash("sha256").update(calibrationSummaryBytes).digest("hex")}` !== calibration.calibration_summary_sha256 || calibrationSummary.v !== 1 || !Array.isArray(calibrationSummary.records)) {
    throw new Error("official archive calibration summary does not match the attestation");
  }
  const summaryByRunId = new Map();
  for (const record of calibrationSummary.records) {
    if (!record || typeof record.run_id !== "string" || summaryByRunId.has(record.run_id)) throw new Error("official archive calibration summary contains duplicate run IDs");
    summaryByRunId.set(record.run_id, record);
  }
  const calibrationTools = sorted(review.calibration_adapters);
  const calibrationTaskIds = sorted(review.reviewed_task_ids);
  const calibrationIdentity = {
    source_adapter: sourceManifest.source_adapter,
    source_repository: sourceManifest.repository,
    source_revision: sourceManifest.revision,
    task_source: calibration.task_source,
    model: calibration.model,
    task_regime: calibration.task_regime,
    condition: calibration.condition,
    price_book: calibration.price_book,
  };
  if (calibration.v !== 1 || calibration.source_adapter !== calibrationIdentity.source_adapter ||
    calibration.source_repository !== calibrationIdentity.source_repository || calibration.source_revision !== calibrationIdentity.source_revision ||
    !["short", "long", "extended"].includes(calibration.task_regime) || !["pinned", "default"].includes(calibration.condition) ||
    typeof calibration.task_source !== "string" || typeof calibration.model !== "string" || typeof calibration.price_book !== "string" ||
    JSON.stringify(sorted(calibration.included_tools)) !== JSON.stringify(calibrationTools) ||
    JSON.stringify(sorted(calibration.selected_task_ids)) !== JSON.stringify(calibrationTaskIds) ||
    !Array.isArray(calibration.tasks) || calibration.tasks.length !== calibrationTaskIds.length) {
    throw new Error("official archive calibration attestation identity is invalid");
  }
  const attestedTasks = new Map();
  for (const task of calibration.tasks) {
    if (!task || typeof task.task_id !== "string" || attestedTasks.has(task.task_id) || !Array.isArray(task.qualifying_runs) || task.qualifying_runs.length < 2) {
      throw new Error("official archive calibration attestation task evidence is invalid");
    }
    if (!calibrationTaskIds.includes(task.task_id)) throw new Error("official archive calibration attestation selects an unreviewed task");
    const tools = new Set();
    for (const qualifying of task.qualifying_runs) {
      if (!qualifying || typeof qualifying.run_id !== "string" || typeof qualifying.tool !== "string" || tools.has(qualifying.tool) || !calibrationTools.includes(qualifying.tool) || typeof qualifying.run_sha256 !== "string" || !/^sha256:[0-9a-f]{64}$/.test(qualifying.run_sha256)) {
        throw new Error("official archive calibration attestation qualifying run is invalid");
      }
      const record = summaryByRunId.get(qualifying.run_id);
      if (!record || record.run_sha256 !== qualifying.run_sha256 || record.passed !== true || !Array.isArray(record.validation_issues) || record.validation_issues.length !== 0 || record.tool !== qualifying.tool || record.task_id !== task.task_id || record.task_source !== calibration.task_source || record.task_repository !== calibration.source_repository || record.task_revision !== calibration.source_revision || record.model !== calibration.model || record.task_regime !== calibration.task_regime || record.condition !== calibration.condition || record.price_book !== calibration.price_book) {
        throw new Error(`official archive calibration summary does not prove ${qualifying.run_id}`);
      }
      tools.add(qualifying.tool);
    }
    if (tools.size < 2) throw new Error(`official archive calibration task lacks two distinct CLIs: ${task.task_id}`);
    attestedTasks.set(task.task_id, task);
  }
  if (attestedTasks.size !== calibrationTaskIds.length || calibrationTaskIds.some((id) => !attestedTasks.has(id))) {
    throw new Error("official archive calibration attestation does not cover every reviewed task");
  }
}
const cells = loadResultsTree(results);
if (cells.length === 0) throw new Error("archive has no validated result cells");
const state = JSON.parse(readFileSync(join(checkout, "provenance", "runner-state.json"), "utf8"));
const definition = state.definition_key === undefined ? null : JSON.parse(state.definition_key);
if (releaseManifest.official === true && archivedScope !== null) {
  const { assertProfileConditions } = await import(pathToFileURL(join(root, "scripts/official-profiles.mjs")).href);
  assertProfileConditions(archivedScope.profile, releaseManifest.model, releaseManifest.price_book, definition?.providerRouting);
}
if (definition !== null && (typeof definition !== "object" || Array.isArray(definition))) throw new Error("archive runner definition is malformed");
const { assertNativeTaskFailureStates } = await import(pathToFileURL(join(root, "packages/report/src/campaign-validation.ts")).href);
assertNativeTaskFailureStates(state, [...cells, ...(anomalyEvidenceRoot === null ? [] : loadResultsTree(anomalyEvidenceRoot))], definition);
const executionProtocol = definition?.executionProtocol;
if ((executionProtocol !== undefined && executionProtocol !== "tool-batches-v1") || releaseManifest.execution_protocol !== executionProtocol) throw new Error("archive release execution protocol does not match runner definition");
const batchProtocol = executionProtocol === "tool-batches-v1";
const primaryWindowOptions = {
  expectedCellIds: new Set(state.cells.map((cell) => cell.id)),
  expectedRetryCounts: new Map(state.cells.map((cell) => [cell.id, cell.retries])),
  ...(batchProtocol ? { executionProtocol, expectedCellTools: new Map(state.cells.map((cell) => [cell.id, cell.tool])) } : {}),
};

if (releaseManifest.official === true) {
  if (officialTools === null || archivedScope === null) throw new Error("official archive tool scope is unavailable");
  if (releaseManifest.model !== archivedScope.model || releaseManifest.condition !== "pinned") throw new Error("official archive release manifest model or condition does not match the archived scope");
  const runs = cells.map((cell) => cell.run);
  if (runs.some((run) => run.model !== archivedScope.model || run.condition !== "pinned" || !officialTools.has(run.tool) || run.task_source !== releaseManifest.task_source || (run.task_repository ?? "") !== releaseManifest.task_repository || run.task_revision !== releaseManifest.task_revision || run.task_regime !== releaseManifest.task_regime || run.price_book !== releaseManifest.price_book)) {
    throw new Error("official archive result cells do not match the archived release identity or tool scope");
  }
  const tasks = new Set(runs.map((run) => run.task_id));
  const reps = new Set(runs.map((run) => run.rep));
  const combinations = new Set(runs.map((run) => `${run.tool}\u0000${run.task_id}\u0000${run.rep}`));
  if (tasks.size < 8 || tasks.size > 10 || reps.size < (batchProtocol ? 5 : 4) || [...reps].sort((a, b) => a - b).some((rep, index) => rep !== index) || combinations.size !== officialTools.size * tasks.size * reps.size || cells.length !== releaseManifest.expected_cells) {
    throw new Error("official archive result cells do not contain the exact archived-tool Cartesian matrix");
  }
  for (const cell of state.cells) {
    if (!officialTools.has(cell.tool) || cell.condition !== "pinned" || !Number.isInteger(cell.rep) || cell.rep < 0) throw new Error("official archive state contains a cell outside the archived tool scope");
  }
  if (batchProtocol) {
    const sameSet = (left, right) => Array.isArray(left) && new Set(left).size === left.length && left.length === right.size && left.every((item) => right.has(item));
    if (!sameSet(definition.tools, officialTools) || !sameSet(definition.tasks?.map((task) => task.id), tasks) || definition.reps !== reps.size) throw new Error("official archive batch definition does not match the full archived Cartesian matrix");
    if (state.cells.length !== cells.length || new Set(state.cells.map((cell) => cell.id)).size !== cells.length || !sameSet(state.cells.map((cell) => `${cell.tool}\u0000${cell.task_id}\u0000${cell.rep}`), combinations)) throw new Error("official archive batch state does not contain the exact result Cartesian matrix");
    const originalCells = anomalyEvidenceRoot === null ? [] : loadResultsTree(anomalyEvidenceRoot);
    const byRunId = new Map([...cells, ...originalCells].map((cell) => [cell.run.run_id, cell.run]));
    for (const cell of state.cells) {
      const run = byRunId.get(cell.id);
      if (run === undefined || cell.tool !== run.tool || cell.task_id !== run.task_id || cell.condition !== run.condition || cell.rep !== run.rep) throw new Error(`official archive batch state identity does not match C4 for ${cell.id}`);
    }
    const seen = new Set();
    let previous;
    for (const cell of state.cells) {
      if ((cell.status !== "done" && cell.status !== "task_failed" && cell.status !== "quarantined") || (cell.tool !== previous && seen.has(cell.tool))) throw new Error("official archive batch state is incomplete or is not grouped by tool");
      seen.add(cell.tool); previous = cell.tool;
    }
  } else {
    for (let index = 0; index < state.cells.length; index += officialTools.size) {
      const block = state.cells.slice(index, index + officialTools.size);
      if (block.length !== officialTools.size) throw new Error("official archive state has an incomplete randomization block");
      const blockKey = `${block[0].condition}\u0000${block[0].task_id}\u0000${block[0].rep}`;
      if (block.some((cell) => `${cell.condition}\u0000${cell.task_id}\u0000${cell.rep}` !== blockKey || !officialTools.has(cell.tool)) || new Set(block.map((cell) => cell.tool)).size !== officialTools.size) throw new Error("official archive state is not block-randomized by archived tool scope");
    }
  }
}
const ledgerPath = join(checkout, "provenance", "run-window-ledger.json");
if (existsSync(ledgerPath)) {
  const ledger = assertOfficialRunWindow(JSON.parse(readFileSync(ledgerPath, "utf8")), {
    ...primaryWindowOptions,
    resultsRoot: results,
    retryResultsRoots: [
      ...(existsSync(join(checkout, "provenance", "retries")) ? [join(checkout, "provenance", "retries")] : []),
      ...(anomalyEvidenceRoot !== null && existsSync(anomalyEvidenceRoot) ? [anomalyEvidenceRoot] : []),
    ],
    ignoredRunIds: replacementRunIds,
  });
  primaryLedger = ledger;
  if (releaseManifest.official === true && (state.run_window_session_id !== ledger.session_id || state.run_window_ledger !== "provenance/run-window-ledger.json")) throw new Error("archive primary ledger session/path is not bound to runner state");
  assertRetryEvidenceCoverage(join(checkout, "provenance", "retries"), new Map(state.cells.map((cell) => [cell.id, cell.retries])));
  if (ledger.state_sha256 !== digestText(readFileSync(join(checkout, "provenance", "runner-state.json")))) throw new Error("archive run-window ledger state binding does not match runner state");
  const ledgerResultsBinding = bindRunWindowResults(results);
  if (ledgerResultsBinding === null || JSON.stringify(ledger.results_binding) !== JSON.stringify(ledgerResultsBinding)) throw new Error("archive run-window ledger result binding does not match results");
} else if (state.run_window_session_id) {
  throw new Error("archive run-window ledger is required for a session-bound state");
} else if (releaseManifest.official === true) {
  throw new Error("official archive has no primary run-window ledger");
}
const { assertProviderRoutingMatches } = await import(pathToFileURL(join(root, "packages/report/src/campaign-validation.ts")).href);
assertProviderRoutingMatches(cells.map((cell) => cell.run), definition);
if (batchProtocol) {
  if (primaryLedger === null) throw new Error("batch archive requires a primary run-window ledger");
  const { validateCampaignValidation } = await import(pathToFileURL(join(root, "packages/report/src/campaign-validation.ts")).href);
  const validation = validateCampaignValidation(join(checkout, "provenance", "validation"), definition, results, primaryLedger.window.start_iso);
  if (!Number.isFinite(definition.validationSpendUsd) || Math.abs(definition.validationSpendUsd - validation.spent_usd) > 1e-9) throw new Error("archive campaign validation reserved spend does not match verified evidence");
  const replacementStatePath = join(checkout, "provenance", "rerun-state", "runner-state.json");
  const replacementSpend = existsSync(replacementStatePath) ? JSON.parse(readFileSync(replacementStatePath, "utf8")).spentUsd : 0;
  const combinedSpend = state.spentUsd + validation.spent_usd + replacementSpend;
  if (!Number.isFinite(state.spentUsd) || state.spentUsd < 0 || !Number.isFinite(replacementSpend) || replacementSpend < 0 || !Number.isFinite(definition.capUsd) || definition.capUsd <= 0 || definition.capUsd > 1500 || combinedSpend > definition.capUsd + 1e-9 || combinedSpend > 1500 + Number.EPSILON) throw new Error("archive combined campaign validation, original, and replacement spend exceeds the campaign cap or $1,500 maximum");
}
if (existsSync(replacementPath)) {
  const mapping = JSON.parse(readFileSync(replacementPath, "utf8"));
  if (mapping.version !== 1 || !Array.isArray(mapping.replacements) || mapping.replacements.length === 0) throw new Error("archive replacement mapping is malformed");
  const publishedIds = new Set(cells.map((cell) => cell.run.run_id));
  const anomalyDir = join(checkout, "provenance", "anomalies");
  const originals = existsSync(anomalyDir) ? loadResultsTree(anomalyDir) : [];
  const reruns = existsSync(join(checkout, "provenance", "reruns")) ? loadResultsTree(join(checkout, "provenance", "reruns")) : [];
  const rerunStatePath = join(checkout, "provenance", "rerun-state", "runner-state.json");
  if (!existsSync(rerunStatePath)) throw new Error("archive replacement mapping has no rerun state");
  const rerunState = JSON.parse(readFileSync(rerunStatePath, "utf8"));
  if (releaseManifest.official === true) {
    const rerunLedgerPath = join(checkout, "provenance", "rerun-state", "run-window-ledger.json");
    if (!existsSync(rerunLedgerPath)) throw new Error("official archive replacement mapping has no rerun window ledger");
    const { assertOfficialRunWindow, assertOfficialRunWindowsDoNotOverlap } = await import(pathToFileURL(join(root, "packages/runner/src/window-ledger.ts")).href);
    const rerunLedger = assertOfficialRunWindow(JSON.parse(readFileSync(rerunLedgerPath, "utf8")), {
      expectedCellIds: new Set((rerunState.cells ?? []).map((cell) => cell.id)),
      expectedRetryCounts: new Map((rerunState.cells ?? []).map((cell) => [cell.id, cell.retries])),
      resultsRoot: join(checkout, "provenance", "reruns"),
      retryResultsRoots: existsSync(join(checkout, "provenance", "rerun-state", "retries")) ? [join(checkout, "provenance", "rerun-state", "retries")] : [],
    });
    if (rerunState.run_window_session_id !== rerunLedger.session_id || rerunState.run_window_ledger !== "provenance/run-window-ledger.json") throw new Error("archive replacement ledger session/path is not bound to rerun state");
    assertRetryEvidenceCoverage(join(checkout, "provenance", "rerun-state", "retries"), new Map((rerunState.cells ?? []).map((cell) => [cell.id, cell.retries])));
    if (primaryLedger !== null && rerunLedger.session_id === primaryLedger.session_id) throw new Error("official replacement rerun reuses the primary window session");
    if (primaryLedger !== null) assertOfficialRunWindowsDoNotOverlap(primaryLedger, rerunLedger, primaryWindowOptions);
    const comparableHost = (value) => JSON.stringify({ ...value, image_digests: [] });
    if (primaryLedger !== null && comparableHost(rerunLedger.host_start) !== comparableHost(primaryLedger.host_start)) throw new Error("official replacement rerun host identity does not match the primary session");
    if (rerunLedger.state_sha256 !== digestText(readFileSync(rerunStatePath))) throw new Error("official replacement rerun ledger state binding does not match rerun state");
    const rerunBinding = bindRunWindowResults(join(checkout, "provenance", "reruns"));
    if (rerunBinding === null || JSON.stringify(rerunLedger.results_binding) !== JSON.stringify(rerunBinding)) throw new Error("official replacement rerun ledger result binding does not match archive reruns");
  }
  const originalIds = new Set(originals.map((cell) => cell.run.run_id));
  const stateIds = new Set(state.cells.map((cell) => cell.id));
  const mappedOriginalIds = new Set();
  const mappedReplacementIds = new Set();
  for (const entry of mapping.replacements) {
    const published = cells.find((cell) => cell.run.run_id === entry?.replacement_run_id);
    const original = originals.find((cell) => cell.run.run_id === entry?.original_run_id);
    const rerun = reruns.find((cell) => cell.run.run_id === entry?.replacement_run_id);
    if (!entry || typeof entry.original_run_id !== "string" || typeof entry.replacement_run_id !== "string" ||
      !stateIds.has(entry.original_run_id) || !originalIds.has(entry.original_run_id) ||
      !publishedIds.has(entry.replacement_run_id) || entry.original_run_id === entry.replacement_run_id ||
      published === undefined || original === undefined || rerun === undefined ||
      c4MeasurementIdentity(published.run) !== c4MeasurementIdentity(original.run) ||
      c4MeasurementIdentity(rerun.run) !== c4MeasurementIdentity(original.run) ||
      relative(results, published.runPath) !== relative(anomalyDir, original.runPath)) {
      throw new Error("archive replacement mapping is not bound to runner state, published, and original evidence");
    }
    if (mappedOriginalIds.has(entry.original_run_id) || mappedReplacementIds.has(entry.replacement_run_id)) throw new Error("archive replacement mapping is not one-to-one");
    mappedOriginalIds.add(entry.original_run_id);
    mappedReplacementIds.add(entry.replacement_run_id);
  }
  const reviewPath = join(checkout, "review", "anomaly-review.json");
  if (!existsSync(reviewPath)) throw new Error("archive replacement mapping has no anomaly review");
  const review = JSON.parse(readFileSync(reviewPath, "utf8"));
  const reviewed = new Set((review.cells ?? []).filter((entry) => entry?.disposition === "rerun").map((entry) => `${entry.run_id}\u0000${entry.replacement_run_id}`));
  const mapped = new Set(mapping.replacements.map((entry) => `${entry.original_run_id}\u0000${entry.replacement_run_id}`));
  const rerunIds = new Set(reruns.map((cell) => cell.run.run_id));
  const rerunStateIds = new Set((rerunState.cells ?? []).map((cell) => cell?.id));
  if (reviewed.size !== mapped.size || [...reviewed].some((entry) => !mapped.has(entry)) || originals.length !== mapped.size ||
    rerunIds.size !== mappedReplacementIds.size || [...rerunIds].some((id) => !mappedReplacementIds.has(id)) ||
    rerunStateIds.size !== mappedReplacementIds.size || [...rerunStateIds].some((id) => !mappedReplacementIds.has(id))) {
    throw new Error("archive replacement mapping disagrees with review, originals, reruns, or rerun state");
  }
} else if (existsSync(join(checkout, "provenance", "anomalies"))) {
  throw new Error("archive anomaly evidence has no replacement mapping");
} else if (existsSync(join(checkout, "provenance", "reruns")) || existsSync(join(checkout, "provenance", "rerun-state"))) {
  throw new Error("archive rerun evidence has no replacement mapping");
}
const credential = /(?<![A-Za-z0-9])sk-or-v1-[A-Za-z0-9_-]+|(?<![A-Za-z0-9])sk-or-[A-Za-z0-9_-]+|(?<![A-Za-z0-9])sk-[A-Za-z0-9_-]{8,}|Bearer\s+(?!\[redacted\])\S+|(?:OPENROUTER_API_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|API_KEY|authorization|x-api-key)\s*[:=]\s*(?!\[redacted\])["']?[^\s"',}]+/i;
function scan(directory) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    const info = lstatSync(path);
    if (info.isDirectory()) scan(path);
    else if (info.isFile() && credential.test(readFileSync(path, "utf8"))) {
      throw new Error(`credential-shaped content in ${path}`);
    }
  }
}
scan(results);
scan(join(checkout, "report"));
if (existsSync(join(checkout, "provenance", "reruns"))) {
  const reruns = loadResultsTree(join(checkout, "provenance", "reruns"));
  if (reruns.length === 0) throw new Error("archive rerun provenance is empty");
}
if (existsSync(join(checkout, "review"))) scan(join(checkout, "review"));
if (existsSync(join(checkout, "provenance"))) scan(join(checkout, "provenance"));
NODE
if find "$CHECKOUT" -type l -print -quit | grep -q .; then
  printf 'S7 archive contains a symlink\n' >&2
  exit 1
fi
node - "$CHECKOUT" <<'NODE'
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(process.argv[2]);
const manifestPath = path.join(root, "SHA256SUMS");
const lines = fs.readFileSync(manifestPath, "utf8").split("\n").filter((line) => line.length > 0);
const listed = new Set();
for (const line of lines) {
  const match = /^([0-9a-f]{64})  ([^\r\n]+)$/.exec(line);
  if (!match) throw new Error("SHA256SUMS contains a malformed entry");
  const relative = match[2];
  const parts = relative.split("/");
  if (path.isAbsolute(relative) || parts.some((part) => part === "" || part === "." || part === "..") || listed.has(relative)) {
    throw new Error("SHA256SUMS contains an unsafe or duplicate path");
  }
  const target = path.resolve(root, relative);
  if (path.relative(root, target).startsWith(`..${path.sep}`) || !fs.lstatSync(target).isFile() || fs.lstatSync(target).isSymbolicLink()) {
    throw new Error("SHA256SUMS path is outside the archive or is not a regular file");
  }
  listed.add(relative);
}
const expected = [];
const visit = (directory) => {
  if (!fs.existsSync(directory)) return;
  for (const name of fs.readdirSync(directory)) {
    const target = path.join(directory, name);
    const info = fs.lstatSync(target);
    if (info.isDirectory()) visit(target);
    else if (info.isFile()) expected.push(path.relative(root, target).split(path.sep).join("/"));
    else throw new Error("archive checksum tree contains a non-regular entry");
  }
};
for (const name of ["results", "report", "review", "provenance"]) visit(path.join(root, name));
if (expected.length !== listed.size || expected.some((file) => !listed.has(file))) {
  throw new Error("SHA256SUMS does not exactly cover the archived evidence files");
}
NODE
if command -v sha256sum >/dev/null 2>&1; then
  (cd "$CHECKOUT" && sha256sum -c SHA256SUMS >/dev/null)
else
  (cd "$CHECKOUT" && shasum -a 256 -c SHA256SUMS >/dev/null)
fi
if tar -tzf "$ARCHIVE" | grep -E '(^|/)(workspace|prompt\.md|verify\.sh)(/|$)|(^|/)SOLVED$' >/dev/null; then
  printf 'S7 archive contains staged or solution content\n' >&2
  exit 1
fi
printf 'S7 archive verified: %s\n' "$ARCHIVE"
