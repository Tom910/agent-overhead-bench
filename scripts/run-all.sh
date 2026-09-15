#!/usr/bin/env sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  cat <<'USAGE'
Usage: scripts/run-all.sh OUTPUT_ROOT PINNED_MODEL CONSERVATIVE_CELL_USD [PRICE_BOOK]

Runs the pinned official Docker matrix after no-spend preflight. The matrix can
spend provider money. OUTPUT_ROOT must be empty, and the estimate must be a
conservative upper bound for one cell; the recorded-spend cap is $1,500 by default.

Set AOB_ONLY_PROVIDER=z-ai/fp8 to pin one endpoint with fallbacks disabled.
Provider routing defaults to AOB_IGNORED_PROVIDERS=relace for every tool. An
explicit empty value selects the original unrouted condition; validation and
campaign routing must match. Nonempty lists must be sorted and unique.

Set AOB_OFFICIAL_PROFILE=deepseek-v4.1-flash-openrouter for the separately approved
DeepSeek profile. Omission preserves the historical GLM profile.

Optional environment: AOB_OFFICIAL_PROFILE, AOB_TOOLS, AOB_TASKS, AOB_TASK_MANIFEST, AOB_SOURCE_MANIFEST, AOB_ELIGIBILITY_MANIFEST, AOB_REPS, AOB_CONDITIONS, AOB_CAP_USD, AOB_RUN_REGIME, AOB_SESSION_ID. AOB_RUN_REGIME defaults to `short`; set it explicitly to `long` for the separate DeepSWE long-horizon release regime. AOB_TASKS, AOB_TASK_MANIFEST, and AOB_SOURCE_MANIFEST are required and must point at a reviewed public-source preparation plus its original Git manifest; the checked-in local fixture suite is never an official default. The runner still receives the API key only through its declared adapter environment; this script never prints the key. Preflight currently refuses `default` until native/default behavior has its own S2 evidence, and stops before credentials/Docker when the reviewed adapter/model/protocol eligibility manifest rejects a combination. A non-OpenRouter remote requires explicit `AOB_ALLOW_CUSTOM_UPSTREAM=1` for diagnostic use.
USAGE
  exit 0
fi

OUT=${1:?usage: scripts/run-all.sh OUTPUT_ROOT PINNED_MODEL CONSERVATIVE_CELL_USD [PRICE_BOOK]}
MODEL=${2:?usage: scripts/run-all.sh OUTPUT_ROOT PINNED_MODEL CONSERVATIVE_CELL_USD [PRICE_BOOK]}
ESTIMATE=${3:?usage: scripts/run-all.sh OUTPUT_ROOT PINNED_MODEL CONSERVATIVE_CELL_USD [PRICE_BOOK]}
PRICE_BOOK=${4:-openrouter-2026-08-27}
CAP=${AOB_CAP_USD:-1500}
PROTOCOL=${AOB_EXECUTION_PROTOCOL:-}
VALIDATION_ONLY=${AOB_VALIDATION_ONLY:-0}
# Maintainer-approved September 8 routing condition; explicit empty restores
# an unrouted diagnostic and cannot reuse routed validation evidence.
export AOB_IGNORED_PROVIDERS="${AOB_IGNORED_PROVIDERS-relace}"
case "$PROTOCOL:$VALIDATION_ONLY" in
  :0) REPS=${AOB_REPS:-4} ;;
  :1) REPS=${AOB_REPS:-1} ;;
  tool-batches-v1:0) REPS=${AOB_REPS:-5} ;;
  *) printf 'run-all: incompatible execution protocol or validation mode\n' >&2; exit 1 ;;
esac
export AOB_REPS="$REPS"
OFFICIAL_SCOPE=$(node "$ROOT/scripts/s7-profile.mjs" "${AOB_OFFICIAL_PROFILE:-}" scope)
OFFICIAL_TOOLS=$(node "$ROOT/scripts/s7-official-scope.mjs" "$OFFICIAL_SCOPE") || { printf 'run-all: official tool scope is malformed\n' >&2; exit 1; }
TOOLS=${AOB_TOOLS:-$OFFICIAL_TOOLS}
CONDITIONS=${AOB_CONDITIONS:-pinned}
UPSTREAM=${AOB_UPSTREAM:-https://openrouter.ai/api}
REGIME=${AOB_RUN_REGIME:-short}
OUT=$(node -e 'process.stdout.write(require("node:path").resolve(process.argv[1],process.argv[2]))' "$ROOT" "$OUT")
SESSION_ID=${AOB_SESSION_ID:-aob-$(date -u +%Y%m%dT%H%M%SZ)-$$}
if [ "$PROTOCOL" = "tool-batches-v1" ]; then
  : "${AOB_CAP_USD:?tool batches require an explicit campaign cap}"
  : "${AOB_BATCH_TOOL:?tool batches require AOB_BATCH_TOOL}"
  : "${AOB_BATCH_CAP_USD:?tool batches require AOB_BATCH_CAP_USD}"
  : "${AOB_VALIDATION_ROOT:?tool batches require AOB_VALIDATION_ROOT}"
  case ",$OFFICIAL_TOOLS," in
    *",$AOB_BATCH_TOOL,"*) ;;
    *) printf 'run-all: batch tool is outside official scope\n' >&2; exit 1 ;;
  esac
  node -e 'const n=Number(process.argv[1]);if(!Number.isFinite(n)||n<=0||n>Number(process.argv[2]))process.exit(1)' "$AOB_BATCH_CAP_USD" "$CAP" \
    || { printf 'run-all: tool cap must be positive and at most the campaign cap\n' >&2; exit 1; }
  if [ -f "$OUT/provenance/run-window-ledger.json" ]; then
    PRIOR_SESSION=$(node -e 'const l=JSON.parse(require("node:fs").readFileSync(process.argv[1],"utf8"));if(l.execution_protocol!=="tool-batches-v1"||typeof l.session_id!=="string")process.exit(1);process.stdout.write(l.session_id)' "$OUT/provenance/run-window-ledger.json")
    [ -z "${AOB_SESSION_ID:-}" ] || [ "$AOB_SESSION_ID" = "$PRIOR_SESSION" ] || { printf 'run-all: campaign session id cannot change\n' >&2; exit 1; }
    SESSION_ID=$PRIOR_SESSION
  fi
fi

case "$REGIME" in
  short|long|extended) ;;
  *) printf 'run-all: AOB_RUN_REGIME must be short, long, or extended\n' >&2; exit 1 ;;
esac

[ "$TOOLS" = "$OFFICIAL_TOOLS" ] || { printf 'run-all: official v1 requires the configured pinned tool scope\n' >&2; exit 1; }
[ "$CONDITIONS" = "pinned" ] || { printf 'run-all: official v1 requires pinned condition only\n' >&2; exit 1; }
[ "$UPSTREAM" = "https://openrouter.ai/api" ] || { printf 'run-all: official v1 requires the OpenRouter upstream\n' >&2; exit 1; }
case "$REPS" in
  ''|*[!0-9]*) printf 'run-all: AOB_REPS must be an integer of at least 4\n' >&2; exit 1 ;;
esac
if [ "$VALIDATION_ONLY" = "1" ]; then
  [ "$REPS" -eq 1 ] || { printf 'run-all: validation requires exactly one repetition\n' >&2; exit 1; }
elif [ "$PROTOCOL" = "tool-batches-v1" ]; then
  [ "$REPS" -ge 5 ] || { printf 'run-all: tool campaigns require at least five repetitions\n' >&2; exit 1; }
else
  [ "$REPS" -ge 4 ] || { printf 'run-all: official v1 requires at least four repetitions\n' >&2; exit 1; }
fi

has_key_value() {
  case "${1:-}" in
    *[![:space:]]*) return 0 ;;
    *) return 1 ;;
  esac
}

node -e 'const n=Number(process.argv[1]); if (!Number.isFinite(n) || n <= 0) process.exit(1)' "$ESTIMATE" \
  || { printf 'run-all: conservative cell estimate must be a positive decimal\n' >&2; exit 1; }
case "$CAP" in
  ''|*[!0-9.]*|.*.*) printf 'run-all: AOB_CAP_USD must be a positive decimal\n' >&2; exit 1 ;;
esac
node -e 'const n=Number(process.argv[1]); if (!Number.isFinite(n) || n <= 0 || n > 1500) process.exit(1)' "$CAP" \
  || { printf 'run-all: AOB_CAP_USD must be positive and no greater than the official $1,500 maximum\n' >&2; exit 1; }

if [ -n "${AOB_TASK_MANIFEST:-}" ]; then
  TASK_MANIFEST=$AOB_TASK_MANIFEST
else
  printf 'run-all: AOB_TASK_MANIFEST is required for official provenance validation\n' >&2
  exit 1
fi
if [ -n "${AOB_SOURCE_MANIFEST:-}" ]; then
  SOURCE_MANIFEST=$AOB_SOURCE_MANIFEST
else
  printf 'run-all: AOB_SOURCE_MANIFEST is required for original source-manifest binding\n' >&2
  exit 1
fi
node "$ROOT/scripts/s7-source-policy.mjs" "$ROOT" "$SOURCE_MANIFEST" \
  || { printf 'run-all: source lineage is not permitted for official runs\n' >&2; exit 1; }

# Preflight may accept a key stored in the gitignored .env. Load only the one
# expected key, without sourcing arbitrary shell code or printing its value.
if ! has_key_value "${OPENROUTER_API_KEY:-}" && [ -f "$ROOT/.env" ]; then
  runner_key=$(awk -F= '$1 == "OPENROUTER_API_KEY" { print substr($0, index($0, "=") + 1); exit }' "$ROOT/.env")
  case "$runner_key" in
    \"*\") runner_key=${runner_key#\"}; runner_key=${runner_key%\"} ;;
    \'*\') runner_key=${runner_key#\'}; runner_key=${runner_key%\'} ;;
  esac
  if has_key_value "$runner_key"; then
    export OPENROUTER_API_KEY="$runner_key"
  fi
fi

RESULTS="$OUT/results"
if [ -e "$OUT" ] || [ -L "$OUT" ]; then
  [ ! -L "$OUT" ] || { printf 'run-all: output root is a symlink: %s\n' "$OUT" >&2; exit 1; }
  [ -d "$OUT" ] || { printf 'run-all: output root is not a directory: %s\n' "$OUT" >&2; exit 1; }
  [ "$PROTOCOL" = "tool-batches-v1" ] || [ -z "$(find "$OUT" -mindepth 1 -print -quit 2>/dev/null)" ] || { printf 'run-all: output root must be empty, including runner state: %s\n' "$OUT" >&2; exit 1; }
fi
if [ -n "${AOB_TASKS:-}" ]; then
  TASKS=$AOB_TASKS
else
  printf 'run-all: AOB_TASKS is required; the checked-in local fixture suite is not an official source\n' >&2
  exit 1
fi
set --
if [ "$PROTOCOL" = "tool-batches-v1" ]; then
  VALIDATION_SPEND=$(node "$ROOT/scripts/s7-validate-campaign.mjs" "$ROOT" "$TASKS" "$TOOLS" "$MODEL" "$PRICE_BOOK" "$REPS" "$AOB_VALIDATION_ROOT" "$OUT")
  set -- --stop-on-failure --execution-protocol "$PROTOCOL" --batch-tool "$AOB_BATCH_TOOL" --batch-cap-usd "$AOB_BATCH_CAP_USD" --validation-spend-usd "$VALIDATION_SPEND"
elif [ "$VALIDATION_ONLY" = "1" ]; then
  set -- --stop-on-failure
fi
if [ -n "${AOB_IGNORED_PROVIDERS:-}" ]; then
  set -- "$@" --ignored-providers "$AOB_IGNORED_PROVIDERS"
fi
if [ -n "${AOB_ONLY_PROVIDER:-}" ]; then
  set -- "$@" --only-provider "$AOB_ONLY_PROVIDER"
fi
"$ROOT/scripts/s7-preflight.sh" "$RESULTS" "$MODEL" "$PRICE_BOOK" "$TOOLS" "$CONDITIONS" "$TASKS" "$TASK_MANIFEST" "$SOURCE_MANIFEST" "$REGIME"

exec node --experimental-strip-types --no-warnings --experimental-loader "$ROOT/scripts/ts-source-loader.mjs" \
  "$ROOT/packages/runner/src/cli.ts" \
  --out "$OUT" \
  --tasks "$TASKS" \
  --tools "$TOOLS" \
  --conditions "$CONDITIONS" \
  --reps "$REPS" \
  --model "$MODEL" \
  --price-book "$PRICE_BOOK" \
  --mode docker \
  --cap-usd "$CAP" \
  --estimate-cell-usd "$ESTIMATE" \
  --upstream "$UPSTREAM" \
  --window-ledger "$OUT/provenance/run-window-ledger.json" \
  --session-id "$SESSION_ID" \
  "$@"
