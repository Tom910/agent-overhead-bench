#!/usr/bin/env sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
OUT=${1:-scratch/s5-dry-run}
TASKS="$ROOT/packages/tasks/dry-run-fixtures/dry-run-1,$ROOT/packages/tasks/dry-run-fixtures/dry-run-2"
exec node --experimental-strip-types --no-warnings --experimental-loader "$ROOT/scripts/ts-source-loader.mjs" "$ROOT/packages/runner/src/cli.ts" \
  --out "$OUT" \
  --tasks "$TASKS" \
  --tools mock-agent,mock-agent-secondary \
  --conditions pinned \
  --reps 2 \
  --model mock \
  --price-book openrouter-2026-08-27 \
  --mode host
