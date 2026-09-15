#!/usr/bin/env sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  cat <<'USAGE'
Usage: scripts/s3-deepswe-calibration.sh DEEPSWE_CHECKOUT OUTPUT_ROOT TASK_ID...

Runs a bounded, diagnostic-only DeepSWE calibration slice. It prepares the
selected task IDs before timing, then uses the normal pinned Docker runner.
This command does not satisfy S7 approval and its output is not publication
data.

Defaults:
  AOB_CALIBRATION_TOOLS=codex,hermes
  AOB_CALIBRATION_REPS=1
  AOB_CALIBRATION_MODEL=z-ai/glm-5.3-flash
  AOB_CALIBRATION_PRICE_BOOK=openrouter-2026-08-27
  AOB_CALIBRATION_CAP_USD=0.25
  AOB_CALIBRATION_ESTIMATE_CELL_USD=0.05
  AOB_CALIBRATION_REGIME=short
  AOB_CALIBRATION_TIMEOUT_S=300
  AOB_CALIBRATION_EXPECTED_MINUTES_FILE=/path/to/task-duration-ranges.json
  AOB_CALIBRATION_UPSTREAM=https://openrouter.ai/api

 Runner invariants: --conditions pinned --mode docker --cap-usd CAP.

  Set AOB_CALIBRATION_REGIME=long and AOB_CALIBRATION_TIMEOUT_S up to 900 for
  an explicitly separate long-regime diagnostic; it is never short-regime or
  S7 evidence.

  Set AOB_CALIBRATION_REGIME=extended and AOB_CALIBRATION_TIMEOUT_S from 901 up
  to the source's declared 10800-second agent budget for an explicitly separate
  extended-regime diagnostic; it is never short- or long-regime or S7 evidence.

The output root must be empty. OPENROUTER_API_KEY may be supplied in the
environment or in the repository .env file. Only that key is read from .env.
Provide AOB_CALIBRATION_EXPECTED_MINUTES_FILE as a JSON object mapping every
selected task ID to its reviewed [minimum_minutes, maximum_minutes] range.
USAGE
  exit 0
fi

SOURCE=${1:?usage: scripts/s3-deepswe-calibration.sh DEEPSWE_CHECKOUT OUTPUT_ROOT TASK_ID...}
OUTPUT_ARG=${2:?usage: scripts/s3-deepswe-calibration.sh DEEPSWE_CHECKOUT OUTPUT_ROOT TASK_ID...}
shift 2

fail() {
  printf 'S3 DeepSWE calibration: %s\n' "$1" >&2
  exit 1
}

[ "$#" -gt 0 ] || fail "at least one DeepSWE task id is required"
[ -d "$SOURCE/.git" ] || fail "DeepSWE checkout must contain .git"

for task_id in "$@"; do
  case "$task_id" in
    ''|*[!A-Za-z0-9._-]*) fail "unsafe or empty task id: $task_id" ;;
  esac
done

# Resolve the output root before preparation so the runner and the manifest
# copy use the same path even when the caller supplied a relative path.
mkdir -p "$(dirname -- "$OUTPUT_ARG")"
if [ -e "$OUTPUT_ARG" ] || [ -L "$OUTPUT_ARG" ]; then
  [ ! -L "$OUTPUT_ARG" ] || fail "output root is a symlink: $OUTPUT_ARG"
  [ -d "$OUTPUT_ARG" ] || fail "output root is not a directory: $OUTPUT_ARG"
  [ -z "$(find "$OUTPUT_ARG" -mindepth 1 -print -quit 2>/dev/null)" ] || fail "output root must be empty: $OUTPUT_ARG"
fi
OUTPUT_PARENT=$(CDPATH= cd -P -- "$(dirname -- "$OUTPUT_ARG")" && pwd)
OUTPUT="$OUTPUT_PARENT/$(basename -- "$OUTPUT_ARG")"
mkdir -p "$OUTPUT"

TOOLS=${AOB_CALIBRATION_TOOLS:-codex,hermes}
REPS=${AOB_CALIBRATION_REPS:-1}
MODEL=${AOB_CALIBRATION_MODEL:-z-ai/glm-5.3-flash}
PRICE_BOOK=${AOB_CALIBRATION_PRICE_BOOK:-openrouter-2026-08-27}
CAP=${AOB_CALIBRATION_CAP_USD:-0.25}
ESTIMATE=${AOB_CALIBRATION_ESTIMATE_CELL_USD:-0.05}
REGIME=${AOB_CALIBRATION_REGIME:-short}
TIMEOUT_S=${AOB_CALIBRATION_TIMEOUT_S:-300}
EXPECTED_MINUTES_FILE=${AOB_CALIBRATION_EXPECTED_MINUTES_FILE:-${AOB_TASK_EXPECTED_MINUTES_FILE:-}}
UPSTREAM=${AOB_CALIBRATION_UPSTREAM:-https://openrouter.ai/api}

case "$REPS" in
  ''|*[!0-9]*) fail "AOB_CALIBRATION_REPS must be a positive integer" ;;
esac
[ "$REPS" -gt 0 ] || fail "AOB_CALIBRATION_REPS must be a positive integer"
[ -n "$MODEL" ] || fail "AOB_CALIBRATION_MODEL must not be empty"
[ -n "$PRICE_BOOK" ] || fail "AOB_CALIBRATION_PRICE_BOOK must not be empty"
[ -n "$UPSTREAM" ] || fail "AOB_CALIBRATION_UPSTREAM must not be empty"
case "$REGIME" in
  short)
    case "$TIMEOUT_S" in ''|*[!0-9]*) fail "AOB_CALIBRATION_TIMEOUT_S must be a positive integer" ;; esac
    [ "$TIMEOUT_S" -gt 0 ] && [ "$TIMEOUT_S" -le 300 ] || fail "short regime timeout must be between 1 and 300 seconds"
    ;;
  long)
    case "$TIMEOUT_S" in ''|*[!0-9]*) fail "AOB_CALIBRATION_TIMEOUT_S must be a positive integer" ;; esac
    [ "$TIMEOUT_S" -gt 300 ] && [ "$TIMEOUT_S" -le 900 ] || fail "long regime timeout must be between 301 and 900 seconds"
    ;;
  extended)
    case "$TIMEOUT_S" in ''|*[!0-9]*) fail "AOB_CALIBRATION_TIMEOUT_S must be a positive integer" ;; esac
    [ "$TIMEOUT_S" -gt 900 ] && [ "$TIMEOUT_S" -le 10800 ] || fail "extended regime timeout must be between 901 and 10800 seconds"
    ;;
  *) fail "AOB_CALIBRATION_REGIME must be short, long, or extended" ;;
esac
[ -n "$EXPECTED_MINUTES_FILE" ] || fail "AOB_CALIBRATION_EXPECTED_MINUTES_FILE is required"
[ -f "$EXPECTED_MINUTES_FILE" ] && [ ! -L "$EXPECTED_MINUTES_FILE" ] || fail "task duration map is unavailable or is a symlink: $EXPECTED_MINUTES_FILE"

node - "$TOOLS" "$CAP" "$ESTIMATE" "$#" "$REPS" <<'NODE' || fail "invalid tools, cap, estimate, or planned calibration budget"
const [toolsRaw, capRaw, estimateRaw, taskCountRaw, repsRaw] = process.argv.slice(2);
const tools = toolsRaw.split(",").map((value) => value.trim());
const cap = Number(capRaw);
const estimate = Number(estimateRaw);
const taskCount = Number(taskCountRaw);
const reps = Number(repsRaw);
if (tools.length === 0 || tools.some((value) => value.length === 0 || /\s/.test(value))) process.exit(1);
if (new Set(tools).size !== tools.length) process.exit(1);
if (!Number.isFinite(cap) || cap <= 0 || !Number.isFinite(estimate) || estimate <= 0) process.exit(1);
if (!Number.isInteger(taskCount) || taskCount <= 0 || !Number.isInteger(reps) || reps <= 0) process.exit(1);
if (estimate * tools.length * taskCount * reps > cap + Number.EPSILON) process.exit(1);
NODE

has_key_value() {
  case "${1:-}" in
    *[![:space:]]*) return 0 ;;
    *) return 1 ;;
  esac
}

KEYFILE=
PREP=
cleanup() {
  [ -z "$KEYFILE" ] || rm -f "$KEYFILE"
  [ -z "$PREP" ] || rm -rf "$PREP"
}
trap cleanup EXIT INT TERM

# Do not source .env: it is data, not shell code. The existing S2 parser also
# rejects duplicate keys and unexpected entries before the key is exported.
if ! has_key_value "${OPENROUTER_API_KEY:-}"; then
  [ -f "$ROOT/.env" ] || fail "OPENROUTER_API_KEY is not available"
  [ ! -L "$ROOT/.env" ] || fail ".env must not be a symlink"
  KEYFILE=$(mktemp "${TMPDIR:-/tmp}/aob-s3-key.XXXXXX")
  "$ROOT/scripts/s2-docker-env.sh" "$ROOT/.env" "$KEYFILE"
  OPENROUTER_API_KEY=$(awk -F= '$1 == "OPENROUTER_API_KEY" { print substr($0, index($0, "=") + 1); exit }' "$KEYFILE")
  export OPENROUTER_API_KEY
fi

PREP=$(mktemp -d "${TMPDIR:-/tmp}/aob-s3-deepswe.XXXXXX")
TASK_ROOT="$PREP/tasks"
AOB_TASK_TOOLS="$TOOLS" AOB_TASK_REGIME="$REGIME" AOB_TASK_TIMEOUT_S="$TIMEOUT_S" AOB_TASK_EXPECTED_MINUTES_FILE="$EXPECTED_MINUTES_FILE" \
  "$ROOT/scripts/prepare-deepswe-calibration.sh" "$SOURCE" "$TASK_ROOT" "$@"

TASKS=
for task_id in "$@"; do
  task_path="$TASK_ROOT/$task_id"
  [ -d "$task_path" ] || fail "preparation did not produce task: $task_id"
  TASKS="${TASKS:+$TASKS,}$task_path"
done

set +e
node "$ROOT/packages/runner/src/cli-wrapper.mjs" \
  --out "$OUTPUT" \
  --tasks "$TASKS" \
  --tools "$TOOLS" \
  --conditions pinned \
  --reps "$REPS" \
  --model "$MODEL" \
  --price-book "$PRICE_BOOK" \
  --mode docker \
  --cap-usd "$CAP" \
  --estimate-cell-usd "$ESTIMATE" \
  --upstream "$UPSTREAM"
RUNNER_STATUS=$?
set -e

SOURCE_MANIFEST="$TASK_ROOT/deepswe-source-manifest.json"
[ -f "$SOURCE_MANIFEST" ] || fail "preparation did not produce the DeepSWE source manifest"
cp "$SOURCE_MANIFEST" "$OUTPUT/deepswe-source-manifest.json"
printf 'S3 DeepSWE calibration artifacts: %s\n' "$OUTPUT"
exit "$RUNNER_STATUS"
