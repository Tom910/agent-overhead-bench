# Campaign closeout — 14 September 2026

**Historical 04:52 UTC paused snapshot, superseded by the [final closeout](../nonclaude-results-2026-09-14/README.md).** No benchmark jobs were active at this snapshot. This is a preliminary partial closeout, not the frozen v1 dataset. Claude Code remains unresolved and is excluded from the results below.

The selected DeepSWE-adapted public-repository campaign used `deepseek/deepseek-v4.1-flash`, pinned through OpenRouter to the DeepSeek provider with fallbacks disabled. These are extended-regime tasks: eight tasks × five repetitions per harness. Preserve the adapter’s upstream lineage and existing source/verifier gates; this closeout does not clear outstanding source-calibration or release gates.

## Completed outcomes and missing coverage

A native failure means the CLI finished and the task’s verifier ran and failed. It is a completed measurement outcome, not a passing solution. Unresolved slots have adapter/infrastructure failures or interruptions and are not assigned a success/failure verdict. Counts select one outcome per task/repetition; completed recoveries supersede unresolved originals only. Original attempts remain retained.

| Harness | Pinned version | Native pass | Native fail | Completed / planned | Unresolved |
|---|---|---:|---:|---:|---:|
| cline | 3.0.61 | 13 | 17 | 30/40 | 10 |
| codex | codex-cli 0.149.1 | 23 | 14 | 37/40 | 3 |
| hermes | Hermes Agent v0.20.5 (2026.8.19) | 18 | 22 | 40/40 | 0 |
| pi | 0.73.1 | 18 | 21 | 39/40 | 1 |
| qwen | 0.22.2 | 23 | 13 | 36/40 | 4 |

**Total: 182/200 non-Claude slots have native outcomes: 95 passes and 87 failures; 18 remain unresolved.** Only Hermes has complete native-outcome coverage. Cline, Codex, Pi and Qwen have partial coverage. Two completed Qwen recovery failures are included; interrupted retries add no completed outcomes. The active Qwen Ink repetition 2 was interrupted during the premature closeout; the maintainer then requested continued recovery. Fourteen queued recovery attempts were not started.

## Timing and usage

Use the [final standard report-engine output](../nonclaude-results-2026-09-14/report-engine.md) for timing and usage. This earlier draft's flat per-run medians were removed because they did not use the repository's task-level aggregation. The historical coverage, account snapshot and retained evidence hashes below remain unchanged.

## Per-task coverage

Each entry is **native passes / native failures / unresolved**, out of five slots.

| Task | Cline | Codex | Hermes | Pi | Qwen |
|---|---:|---:|---:|---:|---:|
| cattrs-partial-structuring-recovery | 3 / 1 / 1 | 5 / 0 / 0 | 4 / 1 / 0 | 2 / 3 / 0 | 5 / 0 / 0 |
| happy-dom-deterministic-intersectionobserver | 1 / 3 / 1 | 0 / 5 / 0 | 0 / 5 / 0 | 0 / 5 / 0 | 0 / 4 / 1 |
| ink-grid-box-layout | 0 / 4 / 1 | 2 / 3 / 0 | 1 / 4 / 0 | 1 / 3 / 1 | 1 / 2 / 2 |
| psd-tools-blend-range-api | 2 / 1 / 2 | 3 / 1 / 1 | 5 / 0 / 0 | 5 / 0 / 0 | 5 / 0 / 0 |
| superjson-error-stack-serialization | 0 / 4 / 1 | 1 / 3 / 1 | 1 / 4 / 0 | 0 / 5 / 0 | 2 / 3 / 0 |
| textual-richlog-follow-state | 1 / 2 / 2 | 3 / 1 / 1 | 0 / 5 / 0 | 1 / 4 / 0 | 2 / 3 / 0 |
| tomlkit-toml-table-converters | 4 / 0 / 1 | 5 / 0 / 0 | 4 / 1 / 0 | 4 / 1 / 0 | 5 / 0 / 0 |
| true-myth-iterable-collection-combinators | 2 / 2 / 1 | 4 / 1 / 0 | 3 / 2 / 0 | 5 / 0 / 0 | 3 / 1 / 1 |

## Why Claude is unresolved

Earlier Claude attempts returned successful responses with unknown model identity. Sixteen of nineteen such responses could be linked to WebSearch. A separate maintainer-approved `claude-code-no-web-search` recovery condition removed WebSearch from both local and pinned-container requests. That paid pilot had no unknown-model responses, but stopped at its budget guard after about 19 minutes without native verification. It does not establish that Claude is fixed.

The no-WebSearch pilot incurred **$0.761044188** in retrieved provider charges: $0.721409100 uncached input, $0.005177088 cached input, and $0.034458000 output. It processed 6,535,090 input tokens with only 26.4% cached. Its $0.75 allowance was exceeded by roughly 1.1¢ because account polling, in-flight work and delayed settlement do not form an exact invoice cap. The earlier ~$0.73 snapshot was preliminary. The workaround did not resolve the cost/completion issue, and these compatibility attempts are not pooled with default-tool records.

## Spending and evidence limits

Account snapshot at 2026-09-14T04:52:08.588175+00:00: **$58.009510 cumulative usage** against $64 funded. This account total includes earlier work and is not a cost for the table above. The additional $10 authorization began at $53.63381808; about **$4.38 used / $5.62 remaining** at closeout. Late settlement may update these figures.

Per-harness cost/task comparisons are withheld: partial costs, variable price windows, interrupted calls and an older ~$0.60 account discrepancy remain unresolved. Unknown C4 spend is not zero. The historical Claude $31 estimate was extrapolation from earlier attempts, not an invoice or approved budget.

The [machine-readable summary](summary.json) contains all 200 selected non-Claude slot outcomes, retained C4/C1 hashes, and recovery selection. Private raw logs, credentials, prompts and workspaces are not published by this closeout. Hashes bind the retained source files but this summary is not a verified release archive. Supplemental cross-host/verifier-only recovery does not repair missing original model/tool-timing evidence and is not promoted into this table.

The separate 192-cell local fixture pilot in the root README remains historical fixture evidence. Its 32/32 results must not be confused with this partial public-repository campaign.
