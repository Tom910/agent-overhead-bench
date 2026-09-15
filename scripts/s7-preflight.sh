#!/usr/bin/env sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
RESULTS=${1:-"$ROOT/results"}
MODEL=${2:-${AOB_PINNED_MODEL:-}}
PRICE_BOOK=${3:-openrouter-2026-08-27}
OFFICIAL_SCOPE=$(node "$ROOT/scripts/s7-profile.mjs" "${AOB_OFFICIAL_PROFILE:-}" scope)
OFFICIAL_TOOLS=$(node "$ROOT/scripts/s7-official-scope.mjs" "$OFFICIAL_SCOPE" "$MODEL" "${AOB_UPSTREAM:-https://openrouter.ai/api}") || { printf 'S7 preflight: official tool scope is malformed or does not match the requested model/upstream\n' >&2; exit 1; }
TOOLS=${4:-${AOB_TOOLS:-$OFFICIAL_TOOLS}}
CONDITIONS=${5:-${AOB_CONDITIONS:-pinned}}
TASKS=${6:-${AOB_TASKS:-}}
TASK_MANIFEST=${7:-${AOB_TASK_MANIFEST:-}}
SOURCE_MANIFEST=${8:-${AOB_SOURCE_MANIFEST:-}}
CAP=${AOB_CAP_USD:-1500}
REGIME=${9:-${AOB_RUN_REGIME:-short}}
UPSTREAM=${AOB_UPSTREAM:-https://openrouter.ai/api}
PROFILE_ELIGIBILITY=$(node "$ROOT/scripts/s7-profile.mjs" "${AOB_OFFICIAL_PROFILE:-}" eligibility)
PROFILE_DECISION=$(node "$ROOT/scripts/s7-profile.mjs" "${AOB_OFFICIAL_PROFILE:-}" decision)
ELIGIBILITY_MANIFEST=${AOB_ELIGIBILITY_MANIFEST:-"$PROFILE_ELIGIBILITY"}
node "$ROOT/scripts/s7-profile.mjs" "${AOB_OFFICIAL_PROFILE:-}" assert "$MODEL" "$PRICE_BOOK" "${AOB_ONLY_PROVIDER:-}" "${AOB_IGNORED_PROVIDERS:-}" \
  || { printf 'S7 preflight: requested conditions differ from approved profile\n' >&2; exit 1; }
CALIBRATION_ATTESTATION=${AOB_CALIBRATION_ATTESTATION:-}
CALIBRATION_SUMMARY=${AOB_CALIBRATION_SUMMARY:-}
CALIBRATION_ROOT=${AOB_CALIBRATION_ROOT:-}
CALIBRATION_TASK_SOURCE=${AOB_CALIBRATION_TASK_SOURCE:-public-task-pack}
EXECUTION_PROTOCOL=${AOB_EXECUTION_PROTOCOL:-}
VALIDATION_ONLY=${AOB_VALIDATION_ONLY:-0}

# Diagnostic validation is separate evidence, never an official batch campaign.
case "$EXECUTION_PROTOCOL" in
  ''|tool-batches-v1) ;;
  *) printf 'S7 preflight: unsupported execution protocol\n' >&2; exit 1 ;;
esac
case "$VALIDATION_ONLY" in
  0|1) ;;
  *) printf 'S7 preflight: AOB_VALIDATION_ONLY must be 0 or 1\n' >&2; exit 1 ;;
esac
if [ "$VALIDATION_ONLY" = "1" ] && [ -n "$EXECUTION_PROTOCOL" ]; then
  printf 'S7 preflight: diagnostic validation cannot use the batch execution protocol\n' >&2; exit 1
fi

case "$REGIME" in
  short|long|extended) ;;
  *) printf 'S7 preflight: regime must be short, long, or extended\n' >&2; exit 1 ;;
esac

node -e 'const n=Number(process.argv[1]); if (!Number.isFinite(n) || n <= 0 || n > 1500) process.exit(1)' "$CAP" \
  || { printf 'S7 preflight: AOB_CAP_USD must be positive and no greater than the official $1,500 maximum\n' >&2; exit 1; }

[ "$TOOLS" = "$OFFICIAL_TOOLS" ] || { printf 'S7 preflight: official v1 requires the configured pinned tool scope\n' >&2; exit 1; }
[ "$CONDITIONS" = "pinned" ] || { printf 'S7 preflight: official v1 requires pinned condition only\n' >&2; exit 1; }
if [ "$VALIDATION_ONLY" = "1" ]; then
  [ "${AOB_REPS:-1}" = "1" ] || { printf 'S7 preflight: diagnostic validation requires exactly one repetition\n' >&2; exit 1; }
elif [ "$EXECUTION_PROTOCOL" = "tool-batches-v1" ]; then
  [ "${AOB_REPS:-5}" -ge 5 ] 2>/dev/null || { printf 'S7 preflight: tool batches require at least five repetitions\n' >&2; exit 1; }
else
  [ "${AOB_REPS:-4}" -ge 4 ] 2>/dev/null || { printf 'S7 preflight: official v1 requires at least four repetitions\n' >&2; exit 1; }
fi
[ "$UPSTREAM" = "https://openrouter.ai/api" ] || { printf 'S7 preflight: official v1 requires the OpenRouter upstream\n' >&2; exit 1; }

fail() {
  printf 'S7 preflight: %s\n' "$1" >&2
  exit 1
}
CALIBRATION_TMP=
trap 'if [ -n "${CALIBRATION_TMP:-}" ]; then rm -f "$CALIBRATION_TMP"; fi' EXIT HUP INT TERM

[ -n "$TASKS" ] || fail "AOB_TASKS is required; the checked-in local fixture suite is not an official source"
[ -n "$TASK_MANIFEST" ] || fail "AOB_TASK_MANIFEST is required for provenance validation"
[ -n "$SOURCE_MANIFEST" ] || fail "AOB_SOURCE_MANIFEST is required for original source-manifest binding"

node "$ROOT/scripts/s7-source-policy.mjs" "$ROOT" "$SOURCE_MANIFEST" \
  || fail "source lineage is not permitted for official runs"

# Check protocol eligibility before opening any review/calibration files.
node "$ROOT/scripts/s7-model-eligibility.mjs" "$ELIGIBILITY_MANIFEST" "$MODEL" "$UPSTREAM" "$TOOLS" \
  || fail "adapter/model/protocol eligibility is not approved"

CALIBRATION_REQUIRED=$(node - "$TASK_MANIFEST" "$SOURCE_MANIFEST" <<'NODE'
const fs = require("node:fs");
const taskManifest = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const sourceManifest = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
const taskReview = taskManifest.source_provenance?.review;
const sourceReview = sourceManifest.review;
if (taskReview?.calibration_complete === true || sourceReview?.calibration_complete === true) process.stdout.write("1");
else process.stdout.write("0");
NODE
)
if [ "$CALIBRATION_REQUIRED" = "1" ] && [ "$VALIDATION_ONLY" != "1" ]; then
  [ -n "$CALIBRATION_ATTESTATION" ] || fail "calibration-complete review requires AOB_CALIBRATION_ATTESTATION"
  [ -n "$CALIBRATION_SUMMARY" ] || fail "calibration-complete review requires AOB_CALIBRATION_SUMMARY"
  [ -n "$CALIBRATION_ROOT" ] || fail "calibration-complete review requires AOB_CALIBRATION_ROOT"
  CALIBRATION_TOOLS=$(node - "$TASK_MANIFEST" <<'NODE'
const fs = require("node:fs");
const review = JSON.parse(fs.readFileSync(process.argv[2], "utf8")).source_provenance?.review;
if (!Array.isArray(review?.calibration_adapters) || review.calibration_adapters.length < 2) process.exit(1);
process.stdout.write([...review.calibration_adapters].sort().join(","));
NODE
  ) || fail "calibration-complete review has no valid two-CLI adapter set"
  CALIBRATION_ATTESTATION_PATH=$(node -e 'const path=require("node:path"); process.stdout.write(path.resolve(process.argv[1], process.argv[2]));' "$ROOT" "$CALIBRATION_ATTESTATION")
  CALIBRATION_SUMMARY_PATH=$(node -e 'const path=require("node:path"); process.stdout.write(path.resolve(process.argv[1], process.argv[2]));' "$ROOT" "$CALIBRATION_SUMMARY")
  CALIBRATION_ROOT_PATH=$(node -e 'const path=require("node:path"); process.stdout.write(path.resolve(process.argv[1], process.argv[2]));' "$ROOT" "$CALIBRATION_ROOT")
  CALIBRATION_TMP=$(mktemp "${TMPDIR:-/tmp}/aob-calibration-attestation.XXXXXX")
  node "$ROOT/scripts/s3-calibration-attestation.mjs" \
    "$CALIBRATION_SUMMARY_PATH" "$SOURCE_MANIFEST" "$CALIBRATION_TASK_SOURCE" "$MODEL" "$REGIME" "$CONDITIONS" "$PRICE_BOOK" "$CALIBRATION_TOOLS" \
    --root "$CALIBRATION_ROOT_PATH" --out "$CALIBRATION_TMP" \
    || fail "calibration attestation does not prove two-CLI passing evidence"
  cmp -s "$CALIBRATION_TMP" "$CALIBRATION_ATTESTATION_PATH" \
    || fail "calibration attestation differs from the review-approved bytes"
  node - "$TASK_MANIFEST" "$SOURCE_MANIFEST" "$CALIBRATION_ATTESTATION_PATH" "$CALIBRATION_ATTESTATION" "$CALIBRATION_TASK_SOURCE" <<'NODE' \
    || fail "calibration attestation provenance is not bound to the approved review"
const fs = require("node:fs");
const crypto = require("node:crypto");
const taskManifest = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const sourceManifest = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
const attestationPath = process.argv[4];
const declaredPath = process.argv[5];
const declaredTaskSource = process.argv[6];
const review = taskManifest.source_provenance?.review;
const sourceReview = sourceManifest.review;
const bytes = fs.readFileSync(attestationPath);
const attestation = JSON.parse(bytes.toString("utf8"));
const sha = `sha256:${crypto.createHash("sha256").update(bytes).digest("hex")}`;
const sorted = (value) => Array.isArray(value) ? [...value].sort() : value;
const canonical = (value) => Array.isArray(value) ? `[${value.map(canonical).join(",")}]` : value !== null && typeof value === "object" ? `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}` : JSON.stringify(value);
if (!review || !sourceReview || canonical(review) !== canonical(sourceReview) ||
  review.calibration_attestation_file !== declaredPath || review.calibration_attestation_sha256 !== sha ||
  attestation.v !== 1 || attestation.task_source !== declaredTaskSource ||
  attestation.source_repository !== sourceManifest.repository ||
  attestation.source_revision !== sourceManifest.revision ||
  JSON.stringify(sorted(attestation.selected_task_ids)) !== JSON.stringify(sorted(review.reviewed_task_ids)) ||
  JSON.stringify(sorted(attestation.included_tools)) !== JSON.stringify(sorted(review.calibration_adapters))) process.exit(1);
NODE
  rm -f "$CALIBRATION_TMP"
fi

case ",$TOOLS," in
  *,,*) fail "at least one adapter must be selected and adapter names cannot be empty" ;;
esac
seen_tools=
for selected_tool in $(printf '%s' "$TOOLS" | tr ',' ' '); do
  case " $seen_tools " in
    *" $selected_tool "*) fail "duplicate adapter selection: $selected_tool" ;;
  esac
  seen_tools="$seen_tools $selected_tool"
done

has_key_value() {
  case "${1:-}" in
    *[![:space:]]*) return 0 ;;
    *) return 1 ;;
  esac
}

OS=$(uname -s)
case "$OS" in
  Linux|Darwin) ;;
  *) fail "official runs require Linux or macOS with Docker Desktop; this host is $OS" ;;
esac
KEY_PRESENT=0
if has_key_value "${OPENROUTER_API_KEY:-}"; then
  KEY_PRESENT=1
elif [ -f "$ROOT/.env" ]; then
  file_key=$(awk -F= '$1 == "OPENROUTER_API_KEY" { print substr($0, index($0, "=") + 1); exit }' "$ROOT/.env")
  case "$file_key" in
    \"*\") file_key=${file_key#\"}; file_key=${file_key%\"} ;;
    \'*\') file_key=${file_key#\'}; file_key=${file_key%\'} ;;
  esac
  has_key_value "$file_key" && KEY_PRESENT=1
fi
[ "$KEY_PRESENT" -eq 1 ] || fail "OPENROUTER_API_KEY is not available (value is never printed)"
command -v docker >/dev/null 2>&1 || fail "docker is not on PATH"
DOCKER_INFO_TIMEOUT_MS=${AOB_S7_DOCKER_INFO_TIMEOUT_MS:-10000}
node "$ROOT/scripts/command-timeout.mjs" "$DOCKER_INFO_TIMEOUT_MS" docker info >/dev/null 2>&1 || fail "Docker daemon is unavailable"
"$ROOT/scripts/s5-docker-route-smoke.sh" >/dev/null 2>&1 || fail "Docker-to-host measurement proxy route smoke failed"
AOB_IMAGE_TOOLS=$(printf '%s' "$TOOLS" | tr ',' ' ') "$ROOT/scripts/s5-build-images.sh" --check >/dev/null 2>&1 || fail "selected Docker images failed build, entrypoint, or version validation"
CONTAINER_CLOCK_REPORT=${AOB_CONTAINER_CLOCK_CALIBRATION_REPORT:-"$ROOT/scratch/s7-container-clock-calibration.txt"}
CONTAINER_CLOCK_SAMPLES=${AOB_S7_CONTAINER_CLOCK_SAMPLES:-20}
CONTAINER_CLOCK_MAX_OFFSET_MS=${AOB_S7_CONTAINER_CLOCK_MAX_OFFSET_MS:-10}
CONTAINER_CLOCK_TIMEOUT_MS=${AOB_S7_CONTAINER_CLOCK_TIMEOUT_MS:-10000}
case "$CONTAINER_CLOCK_SAMPLES" in
  ''|*[!0-9]*|0) fail "AOB_S7_CONTAINER_CLOCK_SAMPLES must be a positive integer" ;;
esac
case "$CONTAINER_CLOCK_MAX_OFFSET_MS" in
  ''|*[!0-9]*) fail "AOB_S7_CONTAINER_CLOCK_MAX_OFFSET_MS must be a nonnegative integer" ;;
esac
[ "$CONTAINER_CLOCK_MAX_OFFSET_MS" -le 10 ] || fail "container-host clock bound cannot exceed the official 10ms maximum"
case "$CONTAINER_CLOCK_TIMEOUT_MS" in
  ''|*[!0-9]*|0) fail "AOB_S7_CONTAINER_CLOCK_TIMEOUT_MS must be a positive integer" ;;
esac
mkdir -p "$(dirname "$CONTAINER_CLOCK_REPORT")"
"$ROOT/scripts/s7-container-clock-calibrate.sh" "$CONTAINER_CLOCK_REPORT" \
  --samples "$CONTAINER_CLOCK_SAMPLES" --max-offset-ms "$CONTAINER_CLOCK_MAX_OFFSET_MS" \
  --timeout-ms "$CONTAINER_CLOCK_TIMEOUT_MS" >/dev/null \
  || fail "container-host clock calibration failed"
node - "$CONTAINER_CLOCK_REPORT" "$CONTAINER_CLOCK_SAMPLES" "$CONTAINER_CLOCK_MAX_OFFSET_MS" <<'NODE' \
  || fail "container-host clock calibration report is invalid"
const fs = require("node:fs");
const reportPath = process.argv[2];
const expectedSamples = Number(process.argv[3]);
const expectedMaxOffset = Number(process.argv[4]);
const text = fs.readFileSync(reportPath, "utf8");
const samples = Number(/^samples=(\d+)$/m.exec(text)?.[1] ?? "NaN");
const maxOffset = Number(/^max_abs_offset_ms=(\d+)$/m.exec(text)?.[1] ?? "NaN");
const maxConservativeBound = Number(/^max_conservative_bound_ms=(\d+)$/m.exec(text)?.[1] ?? "NaN");
const maxRoundTrip = Number(/^max_round_trip_ms=(\d+)$/m.exec(text)?.[1] ?? "NaN");
if (
  !/^version=1$/m.test(text) ||
  !/^method=container-host-epoch-ms$/m.test(text) ||
  samples !== expectedSamples ||
  !Number.isFinite(maxOffset) ||
  maxOffset > expectedMaxOffset ||
  !Number.isFinite(maxConservativeBound) ||
  maxConservativeBound > expectedMaxOffset ||
  !Number.isFinite(maxRoundTrip) ||
  maxRoundTrip > 20 ||
  !/^image=aob-base:s2$/m.test(text) ||
  !/^provider_requests=0$/m.test(text) ||
  !/^status=passed$/m.test(text)
) process.exit(1);
NODE
[ -n "$MODEL" ] || fail "provide a pinned model id as argument 2 or AOB_PINNED_MODEL"
APPROVED_MODEL=$(awk -F': ' '$1 == "pinned_model" { print $2; exit }' "$PROFILE_DECISION")
case "$APPROVED_MODEL" in
  \"*\") APPROVED_MODEL=${APPROVED_MODEL#\"}; APPROVED_MODEL=${APPROVED_MODEL%\"} ;;
esac
[ "$APPROVED_MODEL" != "" ] && [ "$APPROVED_MODEL" != "undecided" ] || fail "S2 has not recorded an approved pinned model"
[ "$MODEL" = "$APPROVED_MODEL" ] || fail "model $MODEL is not the S2-approved pinned model"
case ",$CONDITIONS," in
  *,default,*) fail "default condition is not yet evidenced as a native/default run" ;;
esac

node - "$ROOT" "$TASKS" "$TASK_MANIFEST" <<'NODE' || fail "task selection is not an approved public-source preparation"
const fs = require("node:fs");
const path = require("node:path");
const root = process.argv[2];
const tasks = process.argv[3].split(",").filter(Boolean);
const manifestPath = path.resolve(root, process.argv[4]);
if (tasks.length === 0) { console.error("S7 preflight: AOB_TASKS is empty"); process.exit(1); }
if (!fs.existsSync(manifestPath) || !fs.lstatSync(manifestPath).isFile()) {
  console.error(`S7 preflight: task manifest is unavailable: ${manifestPath}`); process.exit(1);
}
const sourceRoots = new Set();
for (const task of tasks) {
  const dir = path.resolve(root, task);
  sourceRoots.add(path.dirname(dir));
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    console.error(`S7 preflight: task directory is unavailable: ${dir}`); process.exit(1);
  }
  for (const name of ["task.yaml", "prompt.md", "workspace"]) {
    const entry = path.join(dir, name);
    const info = fs.lstatSync(entry);
    const valid = name === "workspace" ? info.isDirectory() : info.isFile();
    if (!valid || info.isSymbolicLink()) {
      console.error(`S7 preflight: task entry is invalid: ${entry}`); process.exit(1);
    }
  }
  const script = path.join(dir, "verify.sh");
  const native = path.join(dir, "verifier.json");
  const hasScript = fs.existsSync(script) && fs.lstatSync(script).isFile() && !fs.lstatSync(script).isSymbolicLink() && (fs.lstatSync(script).mode & 0o111) !== 0;
  const hasNative = fs.existsSync(native) && fs.lstatSync(native).isFile() && !fs.lstatSync(native).isSymbolicLink();
  if (hasScript === hasNative) {
    console.error(`S7 preflight: task must contain exactly one executable verify.sh or verifier.json: ${dir}`); process.exit(1);
  }
  const yaml = fs.readFileSync(path.join(dir, "task.yaml"), "utf8");
  const kind = /^\s{2}kind:\s*(\S+)\s*$/m.exec(yaml)?.[1];
  if (!kind) { console.error(`S7 preflight: task source kind is missing: ${dir}`); process.exit(1); }
  if (kind === "local-development") {
    console.error(`S7 preflight: local-development task is not eligible for official v1: ${dir}`); process.exit(1);
  }
}
if (sourceRoots.size !== 1) { console.error("S7 preflight: selected task directories must share one source root"); process.exit(1); }
NODE
case "$PRICE_BOOK" in
  ''|*[!a-z0-9-]*) fail "price book id must be lowercase alphanumeric with dashes: $PRICE_BOOK" ;;
esac
PRICE_BOOK_FILE="$ROOT/packages/report/price-books/$PRICE_BOOK.json"
[ -f "$PRICE_BOOK_FILE" ] && [ ! -L "$PRICE_BOOK_FILE" ] || fail "price book $PRICE_BOOK is missing"
node --experimental-strip-types --no-warnings --experimental-loader "$ROOT/scripts/ts-source-loader.mjs" --input-type=module - "$ROOT" "$TASKS" "$TASK_MANIFEST" "$SOURCE_MANIFEST" "$REGIME" "$TOOLS" "$VALIDATION_ONLY" <<'NODE' || fail "task manifest validation failed"
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
const root = process.argv[2];
const tasks = process.argv[3].split(",").filter(Boolean).map((task) => path.resolve(root, task));
const manifestPath = path.resolve(root, process.argv[4]);
const sourceManifestPath = path.resolve(root, process.argv[5]);
const regime = process.argv[6];
const officialTools = process.argv[7].split(",").filter(Boolean);
const validationOnly = process.argv[8] === "1";
const sourceRoot = path.dirname(tasks[0]);
if (tasks.some((task) => path.dirname(task) !== sourceRoot)) process.exit(1);
const { validateSelectedLocalTaskManifest, validateVerifierSpec, validateOfficialTaskComposition, validateOfficialTaskPackSelection, validateDeepSWEManifest, validateDeepSWEReferencePolarity, validateOfficialDeepSWESelection, validateGitTaskPackManifest } = await import(pathToFileURL(path.join(root, "packages/tasks/src/source.ts")).href);
const { validateTaskRegime } = await import(pathToFileURL(path.join(root, "packages/tasks/src/regime.ts")).href);
const { loadTaskYaml } = await import(pathToFileURL(path.join(root, "packages/tasks/src/yaml.ts")).href);
const { validatePristineTasks } = await import(pathToFileURL(path.join(root, "packages/tasks/src/validate.ts")).href);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
if (!fs.existsSync(sourceManifestPath) || !fs.lstatSync(sourceManifestPath).isFile()) throw new Error(`original source manifest is unavailable: ${sourceManifestPath}`);
const sourceManifest = JSON.parse(fs.readFileSync(sourceManifestPath, "utf8"));
validateSelectedLocalTaskManifest(sourceRoot, manifest, tasks.map((task) => path.basename(task)), sourceManifest);
const selectedTaskMetadata = tasks.map((task) => loadTaskYaml(path.join(task, "task.yaml")));
validateTaskRegime(selectedTaskMetadata, regime);
if (manifest.source_provenance?.source_adapter !== "git-canonical" && manifest.source_provenance?.source_adapter !== "git-taskpack" && manifest.source_provenance?.source_adapter !== "deepswe") {
  throw new Error("official task manifest must retain reviewed public-source provenance");
}
const review = manifest.source_provenance?.review;
const reviewFlags = ["source_reviewed", "reference_results_verified", "calibration_complete", "maintainer_signed_off"];
// Diagnostics may establish pending approvals; their recorded metadata and
// evidence must still agree, and every source/image/verifier gate still runs.
if (!review || (!validationOnly && reviewFlags.some((key) => review[key] !== true))) {
  throw new Error("official task manifest review gates are incomplete");
}
if (!Array.isArray(review.reviewed_task_ids) || tasks.some((task) => !review.reviewed_task_ids.includes(path.basename(task)))) {
  throw new Error("official task manifest review does not cover every selected task");
}
const evidencePath = path.resolve(root, review.evidence_file);
const relativeEvidence = path.relative(root, evidencePath);
if (relativeEvidence.startsWith(`..${path.sep}`) || path.isAbsolute(relativeEvidence) || !fs.existsSync(evidencePath) || !fs.lstatSync(evidencePath).isFile()) {
  throw new Error("official task manifest review evidence is unavailable or outside the repository");
}
const evidenceHash = `sha256:${createHash("sha256").update(fs.readFileSync(evidencePath)).digest("hex")}`;
if (evidenceHash !== review.evidence_sha256) {
  throw new Error("official task manifest review evidence checksum does not match");
}
let evidence;
try {
  evidence = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
} catch {
  throw new Error("official task manifest review evidence is not valid JSON");
}
if (evidence.source_repository !== manifest.source_provenance.repository || evidence.source_revision !== manifest.source_provenance.revision || evidence.reviewer !== review.reviewer || evidence.reviewed_at !== review.reviewed_at) {
  throw new Error("official task manifest review evidence does not match source provenance");
}
if (!evidence.review || reviewFlags.some((key) => evidence.review[key] !== review[key])) {
  throw new Error("official task manifest review evidence does not match approval flags");
}
const evidenceTaskIds = Array.isArray(evidence.selected_task_ids) ? [...evidence.selected_task_ids].sort() : [];
const manifestTaskIds = [...review.reviewed_task_ids].sort();
if (JSON.stringify(evidenceTaskIds) !== JSON.stringify(manifestTaskIds)) {
  throw new Error("official task manifest review evidence does not match reviewed task IDs");
}
if (!Array.isArray(evidence.calibration_adapters) || JSON.stringify([...evidence.calibration_adapters].sort()) !== JSON.stringify([...review.calibration_adapters].sort())) {
  throw new Error("official task manifest review evidence does not match calibration adapters");
}
if (review.calibration_complete === true && (evidence.review?.calibration_attestation_file !== review.calibration_attestation_file || evidence.review?.calibration_attestation_sha256 !== review.calibration_attestation_sha256)) {
  throw new Error("official task manifest review evidence does not match calibration attestation");
}
if (!/^https:\/\//.test(manifest.source_provenance.repository)) throw new Error("official task source repository must use HTTPS");
const selectedIds = tasks.map((task) => path.basename(task));
const deepsweTasks = sourceManifest.source_adapter === "deepswe"
  ? new Map(validateDeepSWEManifest(sourceManifest).tasks.map((task) => [task.id, task]))
  : undefined;
if (sourceManifest.source_adapter === "deepswe") {
  const checkedDeepSWE = validateDeepSWEManifest(sourceManifest);
  validateOfficialDeepSWESelection(checkedDeepSWE, selectedIds);
  for (const selectedId of selectedIds) {
    const task = checkedDeepSWE.tasks.find((candidate) => candidate.id === selectedId);
    if (task === undefined || task.agent_images === undefined) {
      throw new Error(`DeepSWE selected task is missing prepared agent image identities: ${selectedId}`);
    }
    for (const tool of officialTools) {
      const image = task.agent_images[tool];
      if (image === undefined) throw new Error(`DeepSWE selected task is missing agent image for ${tool}: ${selectedId}`);
      let localImageId;
      try {
        localImageId = execFileSync("docker", ["image", "inspect", "--format", "{{.Id}}", image.image], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
      } catch {
        throw new Error(`DeepSWE prepared agent image is missing: ${image.image}`);
      }
      if (localImageId.toLowerCase() !== image.image_digest.toLowerCase()) {
        throw new Error(`DeepSWE prepared agent image identity drift for ${image.image}: expected ${image.image_digest}, found ${localImageId}`);
      }
    }
  }
} else if (sourceManifest.source_adapter === "git-taskpack") {
  validateOfficialTaskPackSelection(validateGitTaskPackManifest(sourceManifest), selectedIds);
} else {
  validateOfficialTaskComposition(tasks.map((task) => loadTaskYaml(path.join(task, "task.yaml"))));
}
for (const task of tasks) {
  const nativePath = path.join(task, "verifier.json");
  if (!fs.existsSync(nativePath)) {
    if (deepsweTasks !== undefined) throw new Error(`DeepSWE selected task is missing its native verifier: ${nativePath}`);
    continue;
  }
  const verifier = validateVerifierSpec(JSON.parse(fs.readFileSync(nativePath, "utf8")));
  if (verifier.kind !== "docker-command") throw new Error("native verifier must use a Docker command");
  let localVerifierImageId;
  try {
    localVerifierImageId = execFileSync("docker", ["image", "inspect", "--format", "{{.Id}}", verifier.image], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch {
    throw new Error(`native verifier image is missing: ${verifier.image}`);
  }
  if (localVerifierImageId.toLowerCase() !== verifier.image_digest.toLowerCase()) {
    throw new Error(`native verifier image identity drift for ${verifier.image}: expected ${verifier.image_digest}, found ${localVerifierImageId}`);
  }
  if (deepsweTasks !== undefined) {
    const sourceTask = deepsweTasks.get(path.basename(task));
    if (sourceTask === undefined) throw new Error(`DeepSWE source manifest is missing selected task: ${path.basename(task)}`);
    const polarityPath = path.join(sourceRoot, "reference-polarity", `${path.basename(task)}.json`);
    if (!fs.existsSync(polarityPath) || fs.lstatSync(polarityPath).isSymbolicLink() || !fs.lstatSync(polarityPath).isFile()) {
      throw new Error(`DeepSWE reference polarity evidence is missing: ${polarityPath}`);
    }
    const polarity = JSON.parse(fs.readFileSync(polarityPath, "utf8"));
    validateDeepSWEReferencePolarity(polarity, sourceTask);
    const polarityHash = `sha256:${createHash("sha256").update(fs.readFileSync(polarityPath)).digest("hex")}`;
    if (sourceTask.reference_polarity_sha256 !== polarityHash) throw new Error(`DeepSWE reference polarity evidence checksum does not match source manifest: ${path.basename(task)}`);
  }
}
const invalid = validatePristineTasks(tasks.map((task) => ({ id: path.basename(task), dir: task }))).filter((result) => !result.ok);
if (invalid.length > 0) {
  console.error(JSON.stringify(invalid));
  process.exit(1);
}
NODE
node -e '
const fs=require("node:fs");
const p=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
const rates=p.models?.[process.argv[3]];
if (p.id !== process.argv[2] || !rates || ![rates.input, rates.cached_input, rates.output].every((v)=>Number.isFinite(v) && v >= 0)) process.exit(1);
' "$PRICE_BOOK_FILE" "$PRICE_BOOK" "$MODEL" \
  || fail "price book $PRICE_BOOK does not contain valid rates for model $MODEL"

node --experimental-strip-types --no-warnings --experimental-loader "$ROOT/scripts/ts-source-loader.mjs" --input-type=module -e \
  'const { calibrate } = await import(process.argv[1]); const result = await calibrate(0, 10); if (!Number.isFinite(result.p99) || result.p99 > 5) throw new Error(`p99=${result.p99}ms`);' \
  "$ROOT/packages/proxy/src/calibrate.ts" \
  || fail "proxy calibration p99 exceeded 5ms"
CLOCK_REPORT=${AOB_CLOCK_CALIBRATION_REPORT:-"$ROOT/scratch/s7-clock-calibration.txt"}
mkdir -p "$(dirname "$CLOCK_REPORT")"
"$ROOT/scripts/s1-clock-calibrate.sh" "$CLOCK_REPORT" --samples 20 >/dev/null \
  || fail "cross-process clock calibration failed"
node - "$CLOCK_REPORT" <<'NODE' || fail "cross-process clock projection error exceeded 10ms"
const fs = require("node:fs");
const text = fs.readFileSync(process.argv[2], "utf8");
const samples = Number(/^samples=(\d+)$/m.exec(text)?.[1] ?? "NaN");
const bestRoundTrip = Number(/^best_round_trip_ms=([0-9]+(?:\.[0-9]+)?)$/m.exec(text)?.[1] ?? "NaN");
const maxRoundTrip = Number(/^max_round_trip_ms=([0-9]+(?:\.[0-9]+)?)$/m.exec(text)?.[1] ?? "NaN");
const bestBound = Number(/^best_projection_bound_ms=([0-9]+(?:\.[0-9]+)?)$/m.exec(text)?.[1] ?? "NaN");
const maxBound = Number(/^max_projection_bound_ms=([0-9]+(?:\.[0-9]+)?)$/m.exec(text)?.[1] ?? "NaN");
if (samples !== 20 || !Number.isFinite(bestRoundTrip) || !Number.isFinite(maxRoundTrip) || bestRoundTrip > maxRoundTrip || !Number.isFinite(bestBound) || bestBound > 10 || !Number.isFinite(maxBound) || !/^method=two-process-stdio-handshake$/m.test(text) || !/^provider_requests=0$/m.test(text)) process.exit(1);
NODE
node --experimental-strip-types --no-warnings --experimental-loader "$ROOT/scripts/ts-source-loader.mjs" --input-type=module -e \
  'const { getAdapter, verifyHostVersionPins } = await import(process.argv[1]); const selected = process.argv.slice(2).join(",").split(",").filter(Boolean); await verifyHostVersionPins(selected.filter((name) => getAdapter(name).containerInvocation === undefined));' \
  "$ROOT/packages/adapters/src/index.ts" \
  || fail "one or more host adapter versions do not match the S2 pins"
for tool in $(printf '%s' "$TOOLS" | tr ',' ' '); do
  image=
  case "$tool" in
    claude-code) image=aob-claude-code:s2 ;;
    codex) image=aob-codex:s2 ;;
    hermes) image=aob-hermes:s2 ;;
    aider) image=aob-aider:s2 ;;
    opencode) image=aob-opencode:s2 ;;
    qwen) image=aob-qwen:s2 ;;
  esac
  [ -z "$image" ] || docker image inspect "$image" >/dev/null 2>&1 || fail "Docker image is missing: $image"
done
node --experimental-strip-types --no-warnings --experimental-loader "$ROOT/scripts/ts-source-loader.mjs" --input-type=module -e \
  'const { getAdapter } = await import(process.argv[1]); const raw = process.argv.slice(2).join(","); const names = raw.split(","); if (names.length === 0 || names.some((name) => name.length === 0)) throw new Error("adapter selection is empty"); if (new Set(names).size !== names.length) throw new Error("adapter selection contains duplicates"); for (const name of names) { const adapter = getAdapter(name); if (adapter.containerInvocation === undefined) throw new Error(`${name} has no fresh-container descriptor`); }' \
  "$ROOT/packages/adapters/src/index.ts" "$TOOLS" \
  || fail "all selected official adapters must have fresh-container descriptors"
if [ -e "$RESULTS" ] || [ -L "$RESULTS" ]; then
  [ ! -L "$RESULTS" ] || fail "results path is a symlink: $RESULTS"
  [ -d "$RESULTS" ] || fail "results path is not a directory: $RESULTS"
  # The batch runner checks clean ledger continuation under its writer lock.
  # Preflight only permits the existing directory; it cannot authorize resume.
  if [ "$EXECUTION_PROTOCOL" != "tool-batches-v1" ]; then
    [ -z "$(find "$RESULTS" -mindepth 1 -print -quit 2>/dev/null)" ] || fail "results directory is not empty: $RESULTS"
  fi
fi

RESULTS_DESCRIPTION="empty results tree"
[ "$EXECUTION_PROTOCOL" != "tool-batches-v1" ] || RESULTS_DESCRIPTION="batch results tree (runner continuation checks required)"
PREFLIGHT_KIND="S7 preflight"
[ "$VALIDATION_ONLY" != "1" ] || PREFLIGHT_KIND="S7 diagnostic validation preflight"
if [ "$OS" = "Darwin" ]; then
  printf '%s passed: macOS Docker Desktop (virtualization limitation must be recorded), task suite, price book %s, %s\n' "$PREFLIGHT_KIND" "$PRICE_BOOK" "$RESULTS_DESCRIPTION"
else
  printf '%s passed: Linux Docker, task suite, price book %s, %s\n' "$PREFLIGHT_KIND" "$PRICE_BOOK" "$RESULTS_DESCRIPTION"
fi
