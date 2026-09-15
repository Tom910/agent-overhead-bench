# Agent Overhead Bench

An independent measurement instrument that decomposes where coding-agent CLIs spend wall-clock time and money — model, harness, and tools — on selected real-repository tasks. Each task declares an explicit measurement regime — `short` (1–5 min), `long` (6–15 min), or `extended` (16–180 min) — and results are only ever compared within one regime. The checked-in suite is currently a local validation fixture; it is not a published v1 dataset. This is not a capabilities leaderboard or a vendor harness cost claim.

Results are unpublished until the v1 dataset ships. The snapshots below are not a frozen v1 dataset. See [METHODOLOGY.md](./METHODOLOGY.md) and [CONTRIBUTING.md](./CONTRIBUTING.md) for the correction path.

## Public-repository campaign snapshot — 14 September 2026

This is a completed non-Claude campaign snapshot, **not the frozen v1 dataset**. Source sign-off is recorded; the official archive freeze has not been run. Claude Code remains unresolved and excluded.

Selected condition: eight DeepSWE public-repository tasks × five harnesses × five repetitions (200 slots) in the `extended` regime, using `deepseek/deepseek-v4.1-flash` through OpenRouter pinned to the DeepSeek provider with fallbacks disabled and Relace excluded. Harnesses: Cline 3.0.61, Codex CLI 0.149.1, Hermes Agent v0.20.5, Pi 0.73.1, Qwen 0.22.2. Completing a slot means the CLI finished and the native task verifier ran. A verifier failure is a measured outcome, not a missing cell. Twenty completed recoveries replaced unresolved originals only.

These 200 slots are **not one comparable matrix**. Timing, tokens, and available static costs are reported only inside a host × price-book population:

| Population | Host | Price book | Selected outcomes |
|---|---|---|---:|
| macOS / DeepSeek book | macOS | `deepseek-v41-low-2026-09-10` | 136 |
| Linux / DeepSeek book | Linux | `deepseek-v41-low-2026-09-10` | 34 |
| Linux / OpenRouter book | Linux | `openrouter-2026-09-04` | 30 |

Linux cells ran on a dedicated Linux measurement host. macOS cells ran on the operator Mac. Across all populations, 102 of 200 selected attempts passed the native verifier and 98 failed it after a completed attempt. That count is coverage, not a harness ranking.

Use the host-separated [report-engine tables](evidence/nonclaude-results-2026-09-14/report-engine.md) for medians, model/non-model breakdowns, turns, tokens, caching, and available static cost estimates. The [campaign notes](evidence/nonclaude-results-2026-09-14/README.md) record per-task outcomes and limits. The [machine-readable summary](evidence/nonclaude-results-2026-09-14/summary.json) lists all 200 slot keys and retained C4/C1 hashes. Tool visibility is partial, so non-model time is not pure harness overhead. Hashes bind retained private run files; this checkout is not a verified official archive. An earlier [supplemental TOMLKit verifier pass](evidence/nonclaude-results-2026-09-14/supplemental-verification.json) is historical and is not in the selected 200.

## Earlier local fixture pilot

The following table is the separate, completed **192-cell local fixture pilot**,
not the public-repository campaign summarized above.

| Harness | vX.Y | Vis. | Source/regime | E2E (med/IQR) | Harness share (full only) | Non-model share (fallback) | Cold start | Parallelism | First byte (med) | Turns | Tokens in/out | Cached % | Cost/task | Cost vs. token floor | Success | Raw |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| claude-code | 2.1.246 (Claude Code) | partial | agent-overhead-bench / local-development@working-tree / short | 29.32s / 10.63s | — | — (non-model 1%) | 371ms | 1.24 | 4.79s | 6.75 | 126345.5/671 | 74% | $0.0040 | 0.4× | 32/32 | [run.json](evidence/pilot/pilot-report.tgz) |
| cline | 3.0.61 | partial | agent-overhead-bench / local-development@working-tree / short | 44.64s / 11.00s | — | — (non-model 3%) | 702ms | 1.00 | 3.75s | 6 | 40586.75/1123 | 74% | $0.0016 | 0.5× | 32/32 | [run.json](evidence/pilot/pilot-report.tgz) |
| codex | codex-cli 0.149.1 | partial | agent-overhead-bench / local-development@working-tree / short | 33.71s / 8.10s | — | — (non-model 16%) | 281ms | 1.00 | 5.25s | 4.5 | 41247.75/403 | 74% | $0.0014 | 0.4× | 32/32 | [run.json](evidence/pilot/pilot-report.tgz) |
| hermes | Hermes Agent v0.20.5 (2026.8.19) | partial | agent-overhead-bench / local-development@working-tree / short | 34.04s / 12.04s | — | — (non-model 2%) | 3.00s | 1.00 | 4.47s | 7 | 95119/436.5 | 88% | $0.0024 | 0.3× | 32/32 | [run.json](evidence/pilot/pilot-report.tgz) |
| pi | 0.73.1 | partial | agent-overhead-bench / local-development@working-tree / short | 17.20s / 4.20s | — | — (non-model 1%) | 447ms | 1.00 | 2.22s | 5.5 | 10715.25/322.75 | 91% | $0.0003 | 0.3× | 32/32 | [run.json](evidence/pilot/pilot-report.tgz) |
| qwen | 0.22.2 | partial | agent-overhead-bench / local-development@working-tree / short | 32.43s / 13.07s | — | — (non-model 1%) | 943ms | 1.00 | 5.45s | 5 | 114459.75/472.75 | 70% | $0.0034 | 0.4× | 32/32 | [run.json](evidence/pilot/pilot-report.tgz) |

The table above is a **pilot** measured on this repository's checked-in fixture suite, not the v1 public-source dataset. Complete matrix: 192 of 192 cells.

Monthly re-runs will be announced here after v1.

Check that the repository is still a safe unpublished launch scaffold:

```bash
node scripts/s8-launch-check.mjs
```

## Develop

Requires Node 24+ (`engines.node` and `.nvmrc` pin 24).

```bash
npm install
npm run lint
npm run typecheck
npm test
```

Running the full comparison matrix (later stages) needs API keys and will cost money. CI never holds keys and never spends tokens.

## Local validation

The proxy self-overhead calibration uses only the checked-in mock upstream and
defaults to ten concurrent requests. It writes a report under the gitignored
`scratch/` directory and never contacts a provider:

```bash
scripts/s1-calibrate.sh scratch/s1-calibration.txt
```

The reduced zero-spend runner can be exercised twice to verify resume behavior:

```bash
scripts/s5-dry-run.sh scratch/s5-dry-run
scripts/s5-dry-run.sh scratch/s5-dry-run
scripts/s5-full-dry-run.sh scratch/s5-full-dry-run
```

Before an official window, run `scripts/s7-preflight.sh` on a quiescent Linux host
(preferred) or the available Mac with Docker Desktop. After the human anomaly
review, `scripts/s7-freeze.sh` creates an immutable sanitized results/report archive (the
third argument must be the expected complete cell count) and
`scripts/s7-verify-archive.sh` verifies its checksums.

After exporting the exact pinned-model grouping from the provider dashboard,
run the no-network cross-check with an operator-reviewed UTC window:

```bash
node scripts/s7-activity-crosscheck.mjs \
  results /private/path/activity-export.csv \
  review/activity-crosscheck.json \
  z-ai/glm-5.3-flash openrouter-2026-08-27 \
  state.json 2026-08-30T00:00:00.000Z 2026-08-31T00:00:00.000Z
```

For reviewed anomaly replacements, append the rerun results directory, its
separate `state.json`, and comma-separated replacement run IDs. Keep the raw
export outside the repo. Official freeze requires that private CSV as positional
argument 10 (or `AOB_ACTIVITY_EXPORT`), recomputes the
summary locally, and archives only the sanitized summary. Every archive carries
`provenance/archive-binding.json`, a deterministic manifest of the sanitized
results, report, review, and provenance bytes; archive verification recomputes it.

The tool-by-tool workflow starts with a separate one-repetition validation run,
then runs one tool per command in a shared campaign. Supply explicit recorded
spend limits and a conservative maximum estimate for one cell; these commands
can spend provider money:

```bash
scripts/run-validation.sh scratch/v1-validation z-ai/glm-5.3-flash <max-cell-usd> <validation-cap-usd>
scripts/run-tool-batch.sh scratch/v1-campaign claude-code z-ai/glm-5.3-flash <max-cell-usd> <tool-cap-usd> <campaign-cap-usd> scratch/v1-validation
node scripts/campaign-status.mjs scratch/v1-campaign
```

Repeat the batch command for each remaining tool with the same campaign root,
model, price book, and total cap. Each command stops after its selected tool;
a completed tool is a no-op. The default campaign is **8 tasks × 6 tools × 5
repetitions = 240 cells**. The preceding **48 validation cells** are separate,
rechecked before each batch, and included in the total budget. Validation stops
on its first failure and cannot start the campaign automatically.

Set `AOB_TASKS` to the comma-separated paths of the reviewed public-source task
preparation, `AOB_TASK_MANIFEST` to its generated manifest, and
`AOB_SOURCE_MANIFEST` to the original reviewed Git manifest before invoking this
command; the checked-in local fixtures are for validation only and are rejected
by the official preflight.

Prepare a reviewed Git source manifest into a public-input tree, then validate
the prepared tree before the run. DeepSWE preparation additionally requires
`AOB_TASK_EXPECTED_MINUTES_FILE`, a JSON object mapping each selected task ID to
its reviewed `[minimum_minutes, maximum_minutes]` range:
`npm exec --workspace=@aob/tasks -- aob-task-source /path/to/git-manifest.json /tmp/task-checkout /path/to/prepared TASK_ID ...`
followed by `npm exec --workspace=@aob/tasks -- aob-task-validate /path/to/prepared`. The preparation command
writes `suite-manifest.json` with the pinned source provenance; the plain
`aob-task-manifest` command is for local fixture manifests only.

The campaign uses pinned-only conditions and the six official adapters declared
in `plans/s7-official-tool-scope.json`. Preflight requires fresh container
descriptors, pinned images, and the existing source and calibration approvals.
Diagnostic validation may run while aggregate approvals are pending; it retains
source, verifier, reference-polarity, image, and eligibility checks. The legacy
`scripts/run-all.sh` still supports four-repetition single-window runs.
See `plans/S7-runs-protocol.md` for the combined freeze and archive workflow.

For one bounded cell, use the runner directly (also requires a valid model and
price-book entry and an exported `OPENROUTER_API_KEY`; this can spend money):

```bash
AOB_IMAGE_TOOLS=codex scripts/s5-build-images.sh
node --experimental-strip-types --no-warnings \
  --experimental-loader ./scripts/ts-source-loader.mjs \
  packages/runner/src/cli.ts --out results/one-cell \
  --tasks packages/tasks/suite/py-small-bugfix-1 \
  --tools codex --conditions pinned --reps 1 \
  --model z-ai/glm-5.3-flash --price-book openrouter-2026-08-27 --mode docker \
  --cap-usd 10 --estimate-cell-usd 10 \
  --upstream https://openrouter.ai/api
```
