#!/usr/bin/env sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  cat <<'USAGE'
Usage: scripts/run-tool-batch.sh OUTPUT_ROOT TOOL MODEL CELL_ESTIMATE_USD TOOL_CAP_USD CAMPAIGN_CAP_USD VALIDATION_ROOT [PRICE_BOOK]

Runs only TOOL in a shared campaign after rechecking complete validation evidence
and official preflight. Defaults to five repetitions (40 cells per tool across
the eight selected tasks). Repeat with the same OUTPUT_ROOT for the next tool.
A completed tool is a no-op. Caps include retained attempts; the campaign cap
also includes the preceding validation spend. An in-flight cell may exceed its
estimate, so these are recorded-spend limits, not provider billing hard limits.

Required environment: AOB_TASKS, AOB_TASK_MANIFEST, AOB_SOURCE_MANIFEST and the
existing official review/calibration evidence. AOB_REPS may increase above five.
Use scripts/campaign-status.mjs OUTPUT_ROOT for a no-spend progress summary.
Completed native task failures are retained without retries. Infrastructure and accounting failures stop the batch.
This command can spend provider money. It never starts another tool implicitly.
USAGE
  exit 0
fi
[ "$#" -ge 7 ] && [ "$#" -le 8 ] || { printf 'run-tool-batch: use --help for required arguments\n' >&2; exit 1; }
export AOB_EXECUTION_PROTOCOL=tool-batches-v1 AOB_VALIDATION_ONLY=0
export AOB_BATCH_TOOL="$2" AOB_BATCH_CAP_USD="$5" AOB_CAP_USD="$6" AOB_VALIDATION_ROOT="$7"
export AOB_REPS=${AOB_REPS:-5}
exec "$ROOT/scripts/run-all.sh" "$1" "$3" "$4" "${8:-openrouter-2026-08-27}"
