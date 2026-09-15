#!/usr/bin/env sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
OUT=${1:-scratch/s5-kill-resume}
TASKS="$ROOT/packages/tasks/dry-run-fixtures/dry-run-1,$ROOT/packages/tasks/dry-run-fixtures/dry-run-2"
LOG=$(mktemp /tmp/aob-kill-resume-XXXXXX)
trap 'rm -f "$LOG"' EXIT HUP INT TERM

set +e
AOB_MOCK_DELAY_MS=500 node --experimental-strip-types --no-warnings --experimental-loader "$ROOT/scripts/ts-source-loader.mjs" "$ROOT/packages/runner/src/cli.ts" \
  --out "$OUT" --tasks "$TASKS" --tools mock-agent,mock-agent-secondary \
  --conditions pinned --reps 2 --model mock --price-book openrouter-2026-08-27 --mode host >"$LOG" 2>&1 &
RUNNER_PID=$!
for _ in $(seq 1 100); do
  [ -f "$OUT/state.json" ] && break
  sleep 0.05
done
sleep 0.15
kill -KILL "$RUNNER_PID" 2>/dev/null
wait "$RUNNER_PID" 2>/dev/null
set -e

node - "$OUT/state.json" <<'NODE'
const fs = require("node:fs");
const state = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
if (state.cells.length !== 8 || state.cells.every((cell) => cell.status === "done")) {
  throw new Error("kill/resume smoke did not observe an interrupted matrix");
}
NODE

node --experimental-strip-types --no-warnings --experimental-loader "$ROOT/scripts/ts-source-loader.mjs" "$ROOT/packages/runner/src/cli.ts" \
  --out "$OUT" --tasks "$TASKS" --tools mock-agent,mock-agent-secondary \
  --conditions pinned --reps 2 --model mock --price-book openrouter-2026-08-27 --mode host

node - "$OUT/state.json" "$OUT/results" <<'NODE'
const fs = require("node:fs");
const path = require("node:path");
const state = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
if (state.cells.length !== 8 || !state.cells.every((cell) => cell.status === "done") || new Set(state.cells.map((cell) => cell.id)).size !== 8) {
  throw new Error("kill/resume did not recover exactly eight done cells");
}
const runs = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name);
    if (fs.statSync(file).isDirectory()) walk(file);
    else if (name === "run.json") runs.push(file);
  }
}
walk(process.argv[3]);
if (runs.length !== 8) throw new Error(`expected 8 run artifacts, found ${runs.length}`);
console.log(JSON.stringify({ cells: state.cells.length, runArtifacts: runs.length }));
NODE
