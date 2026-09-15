#!/usr/bin/env sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
OUT=scratch/s1-clock-calibration.txt
if [ "$#" -gt 0 ]; then
  OUT=$1
  shift
fi
exec node --experimental-strip-types --no-warnings --experimental-loader "$ROOT/scripts/ts-source-loader.mjs" \
  "$ROOT/packages/proxy/src/clock-calibrate-cli.ts" --out "$OUT" "$@"
