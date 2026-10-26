# Agent Overhead Bench

Measure where coding-agent CLIs spend time and money: model calls, harness work,
and tools. Explore pass rates, token usage, cache rates and reference costs from
the completed Linux collection below.

This is a descriptive snapshot, not a capabilities leaderboard or the frozen v1
dataset. See [METHODOLOGY.md](./METHODOLOGY.md) for measurement boundaries.
Official v1 results are unpublished until the v1 dataset ships.

<!-- CURRENT-CAMPAIGN:START -->
## Linux results — report-generated descriptive snapshot

**Model: `deepseek/deepseek-v4.1-flash-1017` · one Linux host · 80/80 attempts.**
8 tasks × two repetitions per CLI: 16 runs each. 44 native passes and 36 failures. Rows are alphabetical. This is not the frozen v1 dataset.

80 completion-selected outcomes across two tool cohorts; 83 observed paid primary attempts and 52 prerequisites. This is a descriptive snapshot, not one randomized five-CLI experiment. Full experiment cost is unknown. Three partial native captures retain valid required grade artifacts. Native tool timing remains partial.

Cline: **37.5% estimated (6/16)**. [Method notes](evidence/linux-results-2026-10-24/cline-workflow-audit.json).

Each column has its own baseline. Higher pass/cache rates and lower costs/token usage score higher. Relative scores describe the displayed values.

| Harness | Pass rate | Avg cost / task | Whole benchmark | Cache rate | Tokens in | Tokens out |
| --- | --- | --- | --- | --- | --- | --- |
| cline | 37.5% estimated (6/16) · **46.2%** | $0.308 · **20.2%** | $4.931 · **20.2%** | 96.4% · **97.4%** | 12.67M · **35.1%** | 163.4K · **35.6%** |
| codex | 81.3% (13/16) · **100.0%** | $0.077 · **80.8%** | $1.235 · **80.8%** | 98.6% · **99.5%** | 6.83M · **65.0%** | 73.6K · **79.2%** |
| hermes | 56.3% (9/16) · **69.2%** | $0.103 · **60.6%** | $1.645 · **60.6%** | 98.9% · **99.9%** | 9.50M · **46.8%** | 74.9K · **77.7%** |
| pi | 81.3% (13/16) · **100.0%** | $0.062 · **100.0%** | $0.997 · **100.0%** | 98.4% · **99.3%** | 4.44M · **100.0%** | 58.3K · **100.0%** |
| qwen | 56.3% (9/16) · **69.2%** | $0.080 · **77.9%** | $1.280 · **77.9%** | 99.0% · **100.0%** | 8.04M · **55.3%** | 70.1K · **83.1%** |

All harnesses combined: $10.088 for 80 selected runs at the shared reference prices.

**Cost per task** averages each task's repetitions, then the tasks. **Whole benchmark** sums selected runs per CLI, including failures. Cache and tokens are medians per attempt; input includes cached tokens. **Reference cost:** selected reference estimates total **$10.088272872** using `deepseek-v41-1017-reference-2026-10-18`: $0.15/M uncached input, $0.003/M cached input and $0.6/M output. These are estimates, not actual billing.

The 3 extra attempts have $2.284068444 in known prefix reference estimates and unknown full costs. The 52 prerequisites have a known reference subtotal of $5.283952392; full cost is unknown. Reserves are not charges. See [extra attempts](evidence/linux-results-2026-10-24/extra-attempts.json) and [cohorts and collection windows](evidence/linux-results-2026-10-24/cohorts.json).

**Comparison confidence:** 8 task clusters. Repeated runs are not independent tasks. Relative scores describe observed measurements; they do not establish causality or a universal winner. Recorded image and environment differences limit interpretation. Non-model time includes unobserved tools and harness work.

[**Open the interactive website →**](https://tom910.github.io/agent-overhead-bench/) · [Report data](evidence/linux-results-2026-10-24/report.json) · [Result interpretation](https://github.com/Tom910/agent-overhead-bench/blob/main/docs/snapshots/2026-10-24-five-cli.md) · [Detailed report](evidence/linux-results-2026-10-24/analysis.html) · [Canonical data](evidence/linux-results-2026-10-24/analysis.json) · [Source and reproduction](evidence/linux-results-2026-10-24/README.md) · [Historical snapshot](evidence/linux-results-2026-09-19-r1/README.md) · [Earlier mixed-host snapshot](evidence/nonclaude-results-2026-09-14/README.md)

The current-campaign pointer selects the validated source. Original outcomes are unchanged. Collection is complete as of 2026-10-24T08:12:53.079Z; official release status remains false.

```sh
npm run report:build
npm run report:check
```
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

The [interactive results website](https://tom910.github.io/agent-overhead-bench/)
uses the validated data in the table above. It includes task filters, independent
metric comparisons and a pass-rate/cost chart. Read the
[result interpretation and native workflow findings](docs/snapshots/2026-10-24-five-cli.md)
for the verified Cline commit-check detail and comparison limits.

`npm run report:build` generates `report.json` from validated inputs, then builds
the page from that file. The same report supplies the README and detailed report
overview values. Use `npm run site:build` to rebuild the page from an existing
report, or `npm run report:check` to check saved output. Do not edit generated HTML.

To refresh and preview it locally (no API keys or model calls):

```bash
npm run report:build
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

The experimental Codex subscription route has been retired after an
[independent review](docs/reviews/2026-09-29-codex-integration-audit.md).
The Codex CLI harness remains available through the normal API-backed runner.

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
