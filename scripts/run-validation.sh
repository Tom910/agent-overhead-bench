#!/usr/bin/env sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  cat <<'USAGE'
Usage: scripts/run-validation.sh OUTPUT_ROOT MODEL CELL_ESTIMATE_USD VALIDATION_CAP_USD [PRICE_BOOK]

Runs every selected task once with every official tool in a separate diagnostic
root (48 cells for the eight-task selection). Stops at the first failure without
retrying. The explicit recorded-spend cap applies to this validation only.
No grand campaign starts automatically. A failed or partial validation cannot
unlock a campaign. Source selection, pins, native verifier and reference-polarity
checks remain enabled; pending aggregate source approvals may be calibrated here.

Required environment: AOB_TASKS, AOB_TASK_MANIFEST, AOB_SOURCE_MANIFEST.
This command can spend provider money. Its results are diagnostic evidence.
USAGE
  exit 0
fi
[ "$#" -ge 4 ] && [ "$#" -le 5 ] || { printf 'run-validation: use --help for required arguments\n' >&2; exit 1; }
export AOB_VALIDATION_ONLY=1 AOB_REPS=1 AOB_CAP_USD="$4"
unset AOB_EXECUTION_PROTOCOL AOB_BATCH_TOOL AOB_BATCH_CAP_USD AOB_VALIDATION_ROOT
exec "$ROOT/scripts/run-all.sh" "$1" "$2" "$3" "${5:-openrouter-2026-08-27}"
