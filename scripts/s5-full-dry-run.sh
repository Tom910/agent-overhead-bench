#!/usr/bin/env sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
OUT=${1:-scratch/s5-full-dry-run}
MODE=${AOB_DRY_RUN_MODE:-docker}
TASKS="$ROOT/packages/tasks/dry-run-fixtures/dry-run-1,$ROOT/packages/tasks/dry-run-fixtures/dry-run-2"
if [ "$MODE" = "docker" ]; then
  command -v docker >/dev/null 2>&1 || { printf 'S5 full dry-run: docker is not on PATH\n' >&2; exit 1; }
  node "$ROOT/scripts/command-timeout.mjs" "${AOB_DRY_RUN_DOCKER_INFO_TIMEOUT_MS:-10000}" docker info >/dev/null 2>&1 \
    || { printf 'S5 full dry-run: Docker daemon is unavailable\n' >&2; exit 1; }
  if ! node "$ROOT/scripts/command-timeout.mjs" "${AOB_DRY_RUN_IMAGE_TIMEOUT_MS:-10000}" docker image inspect "aob-base:s2" >/dev/null 2>&1; then
    printf '%s\n' 'S5 full dry-run: building missing no-credential image aob-base:s2' >&2
    docker build -t aob-base:s2 -f "$ROOT/images/base.Dockerfile" "$ROOT/images"
  fi
fi
exec node --experimental-strip-types --no-warnings --experimental-loader "$ROOT/scripts/ts-source-loader.mjs" "$ROOT/packages/runner/src/cli.ts" \
  --out "$OUT" \
  --tasks "$TASKS" \
  --tools mock-agent,mock-agent-secondary \
  --conditions pinned,default \
  --reps 2 \
  --model mock \
  --price-book openrouter-2026-08-27 \
  --mode "$MODE"
