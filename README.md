# Agent Overhead Bench

An independent measurement instrument that decomposes where coding-agent CLIs spend wall-clock time and money — model, harness, and tools — on selected real-repository tasks. Each task declares an explicit measurement regime — `short` (1–5 min), `long` (6–15 min), or `extended` (16–180 min) — and results are only ever compared within one regime. The checked-in suite is currently a local validation fixture; it is not a published v1 dataset. This is not a capabilities leaderboard or a vendor harness cost claim.

Results are unpublished until the v1 dataset ships. The snapshots below are not a frozen v1 dataset. See [METHODOLOGY.md](./METHODOLOGY.md) and [CONTRIBUTING.md](./CONTRIBUTING.md) for the correction path.

## Linux campaign snapshot — 18 September 2026

**Model: `deepseek/deepseek-v4.1-flash` · one Linux host · 107/200 attempts collected.**
The campaign is in progress: existing Linux attempts are retained, only missing
slots are queued, and Claude CLI is excluded. Rows are alphabetical.

Bold percentages compare each metric with its observed best (**100%**).
Actual measurements come first. Higher pass/cache rates score higher; lower
cost and token usage score higher. Each column has its own baseline.

| Harness | Pass rate | Reference cost | Cache rate | Tokens in | Tokens out |
|---|---:|---:|---:|---:|---:|
| cline | 45.0% (18/40) · **79.6%** | $0.167 · **43.4%** | 96.4% · **97.3%** | 9.77M · **74.7%** | 158.2K · **46.5%** |
| codex | 33.3% (1/3) · **59.0%** | $0.073 · **100.0%** | 99.2% · **100.0%** | 7.30M · **100.0%** | 73.5K · **100.0%** |
| hermes | 50.0% (20/40) · **88.5%** | $0.135 (38/40 measured) | 99.2% (39/40 measured) | 16.43M (39/40 measured) | 119.9K (39/40 measured) |
| pi | 0.0% (0/1) · **0.0%** | $0.110 · **66.2%** | 98.4% · **99.2%** | 10.59M · **68.9%** | 88.6K · **82.9%** |
| qwen | 56.5% (13/23) · **100.0%** | $0.090 · **80.4%** | 99.1% · **99.9%** | 9.86M · **74.0%** | 81.2K · **90.6%** |

Cost, cache and tokens are **medians per measured attempt**, including failed
outcomes. Pass rate is native verifier passes / selected attempts. Partial
measurements show their coverage and receive no relative score. Task coverage
is currently uneven (for example, Pi has only one attempt); these indices are
provisional descriptions, not a quality ranking. Lower tokens alone do not mean
better task performance.

**Reference cost** uses the same fixed rates for every row: **$0.15/M uncached
input + $0.003/M cached input + $0.60/M output**. We price each attempt's exact
request counters before taking the median. These are reference estimates, not
actual billing. Input includes cached tokens; cache rate is the median cached
input percentage per attempt. K = 1,000; M = 1,000,000.

[Interactive report](evidence/linux-results-2026-09-18/analysis.html) ·
[Full tables and sample counts](evidence/linux-results-2026-09-18/analysis.md) ·
[Data](evidence/linux-results-2026-09-18/analysis.json) ·
[Snapshot provenance and reproduction](evidence/linux-results-2026-09-18/README.md)

<details>
<summary>Collection conditions and earlier snapshots</summary>

The target is eight selected DeepSWE public-repository tasks × five harnesses ×
five repetitions, in the `extended` regime. OpenRouter routing is pinned to the
DeepSeek provider, with fallbacks disabled and Relace excluded. Harness versions
and original accounting books remain in the detailed evidence. The original
book name does not identify a different model.

Some task images were rebuilt after host cleanup. Original verifier-image
identities remain separate in detailed comparisons; the overview includes both
versions and is not a controlled image-matched experiment. The report's task
counts include distinct environment identities. Timing detail is secondary;
non-model time is not pure harness overhead when tool visibility is partial.

This is an in-progress snapshot, not the frozen v1 dataset. Source sign-off is
recorded; the official archive freeze has not been run. The earlier
[14 September mixed-host snapshot](evidence/nonclaude-results-2026-09-14/README.md)
and its [original reports](evidence/nonclaude-results-2026-09-14/analysis.md)
remain available as historical evidence.

Rebuild the Linux report offline, without API calls:

```bash
node scripts/s6-analysis-replay.mjs \
  evidence/linux-results-2026-09-18/analysis.json scratch/linux-analysis
```

</details>

## Earlier local fixture pilot

The following table is the separate, completed **192-cell local fixture pilot**,
not the public-repository campaign summarized above.

<details>
<summary>Show the earlier fixture pilot and detailed timing table</summary>

| Harness | vX.Y | Vis. | Source/regime | E2E (med/IQR) | Harness share (full only) | Non-model share (fallback) | Cold start | Parallelism | First byte (med) | Turns | Tokens in/out | Cached % | Cost/task | Cost vs. token floor | Success | Raw |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| claude-code | 2.1.246 (Claude Code) | partial | agent-overhead-bench / local-development@working-tree / short | 29.32s / 10.63s | — | — (non-model 1%) | 371ms | 1.24 | 4.79s | 6.75 | 126345.5/671 | 74% | $0.0040 | 0.4× | 32/32 | [run.json](evidence/pilot/pilot-report.tgz) |
| cline | 3.0.61 | partial | agent-overhead-bench / local-development@working-tree / short | 44.64s / 11.00s | — | — (non-model 3%) | 702ms | 1.00 | 3.75s | 6 | 40586.75/1123 | 74% | $0.0016 | 0.5× | 32/32 | [run.json](evidence/pilot/pilot-report.tgz) |
| codex | codex-cli 0.149.1 | partial | agent-overhead-bench / local-development@working-tree / short | 33.71s / 8.10s | — | — (non-model 16%) | 281ms | 1.00 | 5.25s | 4.5 | 41247.75/403 | 74% | $0.0014 | 0.4× | 32/32 | [run.json](evidence/pilot/pilot-report.tgz) |
| hermes | Hermes Agent v0.20.5 (2026.8.19) | partial | agent-overhead-bench / local-development@working-tree / short | 34.04s / 12.04s | — | — (non-model 2%) | 3.00s | 1.00 | 4.47s | 7 | 95119/436.5 | 88% | $0.0024 | 0.3× | 32/32 | [run.json](evidence/pilot/pilot-report.tgz) |
| pi | 0.73.1 | partial | agent-overhead-bench / local-development@working-tree / short | 17.20s / 4.20s | — | — (non-model 1%) | 447ms | 1.00 | 2.22s | 5.5 | 10715.25/322.75 | 91% | $0.0003 | 0.3× | 32/32 | [run.json](evidence/pilot/pilot-report.tgz) |
| qwen | 0.22.2 | partial | agent-overhead-bench / local-development@working-tree / short | 32.43s / 13.07s | — | — (non-model 1%) | 943ms | 1.00 | 5.45s | 5 | 114459.75/472.75 | 70% | $0.0034 | 0.4× | 32/32 | [run.json](evidence/pilot/pilot-report.tgz) |

The table above is a **pilot** measured on this repository's checked-in fixture suite, not the v1 public-source dataset. Complete matrix: 192 of 192 cells.

</details>

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
