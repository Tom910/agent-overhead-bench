#!/usr/bin/env sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
exec node "$ROOT/scripts/s7-container-clock-calibrate.mjs" "$@"
