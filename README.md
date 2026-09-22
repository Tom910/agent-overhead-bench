# Agent Overhead Bench

Measure where coding-agent CLIs spend time and money: model calls, harness work,
and tools. Explore pass rates, token usage, cache rates and reference costs from
one completed Linux campaign below.

This is a descriptive snapshot, not a capabilities leaderboard or the frozen v1
dataset. See [METHODOLOGY.md](./METHODOLOGY.md) for measurement boundaries.

<!-- CURRENT-CAMPAIGN:START -->
## Linux results — completed campaign

**Model: `deepseek/deepseek-v4.1-flash` · one Linux host · 200/200 attempts.**
Eight tasks × five repetitions per harness. 105 passes and 95 verification failures.
Collection is complete; Claude CLI is excluded. Rows are alphabetical.

Actual measurements come first; **bold percentages compare each metric with its
observed best (100%)**. Each column has its own baseline. Higher pass/cache rates
score higher; lower cost/token usage scores higher.

| Harness | Pass rate | Avg cost / task | Whole benchmark | Cache rate | Tokens in | Tokens out |
| --- | --- | --- | --- | --- | --- | --- |
| cline | 45.0% (18/40) · **72.0%** | $0.205 · **46.4%** | $8.191 · **46.4%** | 96.4% · **97.2%** | 9.77M · **87.4%** | 158.2K · **54.1%** |
| codex | 50.0% (20/40) · **80.0%** | $0.095 · **100.0%** | $3.798 · **100.0%** | 99.2% · **100.0%** | 8.54M · **100.0%** | 89.0K · **96.2%** |
| hermes | 47.5% (19/40) · **76.0%** | $0.167 · **56.8%** | $6.688 · **56.8%** | 99.2% · **99.9%** | 15.31M · **55.8%** | 119.4K · **71.7%** |
| pi | 57.5% (23/40) · **92.0%** | $0.103 · **92.0%** | $4.128 · **92.0%** | 98.3% · **99.1%** | 9.46M · **90.2%** | 86.7K · **98.7%** |
| qwen | 62.5% (25/40) · **100.0%** | $0.109 · **86.7%** | $4.380 · **86.7%** | 99.2% · **99.9%** | 10.55M · **80.9%** | 85.6K · **100.0%** |

All harnesses combined: $27.185 for 200 selected runs at the shared reference prices.

**Cost per task** is the average across each task’s five runs, then across the eight
tasks. **Whole benchmark** sums all 40 runs per harness, including failures.
Cache and tokens are medians per attempt; input includes cached tokens.
Costs use shared token-based reference prices, not actual billing.

**Comparison confidence:** eight task clusters; repeated runs are not 40 independent tasks.
“Best = 100%” describes the observed result, not statistical certainty.
Recorded model/provider facts match, but request settings, enforced resource/network controls and cache policy are incomplete; verifier images differ.
The [separate verification audit](evidence/task-verification-2026-09-21/README.md) finds 4 Textual false negatives. Original outcomes above remain unchanged.


[**Explore the interactive website →**](https://tom910.github.io/agent-overhead-bench/) ·
[Detailed tables](evidence/linux-results-2026-09-19-r1/analysis.md) · [Canonical data](evidence/linux-results-2026-09-19-r1/analysis.json)

<details>
<summary>Conditions, provenance and how to refresh</summary>

Four user-authorized replacements repaired incomplete accounting. The benchmark columns cover the selected 200 runs. The four superseded runs consumed **at least $0.673** in additional reference cost (codex: ≥ $0.067; hermes: ≥ $0.468; pi: ≥ $0.138), excluded from those columns. Their full costs remain unknown. [Original measurements](evidence/linux-results-2026-09-19/analysis.json) and [replacement mapping](evidence/linux-results-2026-09-19-r1/summary.json) remain available. Replacements are selected for complete accounting, regardless of pass/fail outcome.

One additional Hermes recovery startup was interrupted by a model-metadata capture issue. Its extra spend is also outside the selected benchmark columns and is not included in the lower bound above; its raw evidence is retained on Linux.

**Reference cost:** $0.15/M uncached input + $0.003/M cached input + $0.6/M output, from `deepseek-v41-low-2026-09-10`. Exact request tokens are priced across all selected requests. Lower token usage alone does not establish better task performance. K = 1,000; M = 1,000,000.

[Full interactive report](evidence/linux-results-2026-09-19-r1/analysis.html) · [Provenance and reproduction](evidence/linux-results-2026-09-19-r1/README.md)

All 200 selected slots are from the same Linux host. The original collection reused 104 attempts and filled 96 missing slots. Four incomplete-measurement slots were subsequently rerun with explicit user authorization; all other slots are unchanged.
Model routing is
pinned to DeepSeek through OpenRouter, with fallbacks disabled and Relace excluded.
Original accounting books remain provenance; they do not split this model overview.

Retained and rebuilt verifier images occur in this dataset. Detailed comparisons
preserve their identities; the overview is not an image-matched controlled
experiment. Tool visibility is partial, so non-model time is not pure harness
overhead. This is not the frozen v1 dataset or a capabilities leaderboard.

One pointer, [current-campaign.json](evidence/current-campaign.json), selects the
canonical export. This table, the website and both detailed views are generated from its
validated attempt facts. The selection summary binds raw evidence hashes.
Snapshot exported at 2026-09-19T22:14:30.347Z.

Refresh every current view offline, without API keys or model calls:

```bash
npm run report:refresh
npm run report:check
```

The check fails when any generated view is stale. Earlier
[partial Linux](evidence/linux-results-2026-09-18/README.md) and
[mixed-host](evidence/nonclaude-results-2026-09-14/README.md) snapshots remain historical.

</details>
<!-- CURRENT-CAMPAIGN:END -->

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

## Results website

The [interactive results site](https://tom910.github.io/agent-overhead-bench/) is
published to GitHub Pages on pushes to `main`. It uses the same validated report
as the table above, with task filters, independent metric comparisons and a
pass-rate/cost chart.

To refresh and preview it locally (no API keys or model calls):

```bash
npm run report:refresh
npm run site:build
python3 -m http.server 8000 --directory _site
```

Open `http://localhost:8000`. The build uploads only the generated website and
sanitized report artifacts. GitHub Pages must use **GitHub Actions** as its source
in repository Settings → Pages.

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
