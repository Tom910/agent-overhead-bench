# Non-Claude campaign results — 14 September 2026

Snapshot: 2026-09-14T16:09:23.683455+00:00. **200/200 slots have completed native outcomes: 102 passes, 98 failures, 0 unresolved.** Claude Code remains excluded and unresolved. This is not the frozen v1 dataset. Start with [INSIGHTS.md](INSIGHTS.md) or the [interactive analysis](analysis.html) (now includes request timelines).

The selected DeepSWE-adapted public-repository campaign uses eight tasks × five repetitions per harness, the extended regime, and `deepseek/deepseek-v4.1-flash` through OpenRouter pinned to the DeepSeek provider with fallbacks disabled. Existing upstream lineage, source review and verifier gates remain applicable. Completing native outcomes does not itself clear release/calibration/accounting gates.

## Coverage

A native failure means the CLI completed and the task verifier ran and failed; it remains a final result. Unresolved means adapter/infrastructure failure or interruption. Each task/repetition contributes at most one selected native outcome. Completed recoveries replace only unresolved slots; original attempts are retained.

| Harness | Pinned version | Native pass | Native fail | Completed / planned | Unresolved |
|---|---|---:|---:|---:|---:|
| cline | 3.0.61 | 17 | 23 | 40/40 | 0 |
| codex | codex-cli 0.149.1 | 24 | 16 | 40/40 | 0 |
| hermes | Hermes Agent v0.20.5 (2026.8.19) | 18 | 22 | 40/40 | 0 |
| pi | 0.73.1 | 18 | 22 | 40/40 | 0 |
| qwen | 0.22.2 | 25 | 15 | 40/40 | 0 |

## Execution closeout

All five non-Claude harnesses have all 40 native outcomes. Every queued recovery attempt is terminal and benchmark processes have stopped. The final fresh TOMLKit repetition 0 passed its native verifier, completing 200/200 selected measurements. Repetition numbers are zero-based.

The earlier [supplemental TOMLKit verifier pass](supplemental-verification.json) remains historical evidence. It is not pooled into the headline results; the new complete attempt supplies the selected outcome. No further retry is queued.

## Timing, usage and estimated costs

The [interpretation guide](INSIGHTS.md) explains what this snapshot supports.
The new [analysis tables](analysis.md), [interactive HTML view](analysis.html)
and [per-attempt JSON](analysis.json) expose matched task comparisons and separate
pass/fail distributions with explicit denominators. HTML is standalone: download
and open it locally. [Analysis provenance](provenance.json) binds these generated
artifacts to this snapshot's summary and selected C1/C4 hashes. The historical
report-engine files below remain unchanged.

The [standard report-engine output](report-engine.md) provides end-to-end medians/IQR, model/non-model breakdowns, startup, HTTP first byte, parallelism, turns, token counts, cached percentage and available static cost/task estimates. The [structured headline rows](report-engine.json) are returned by the same report implementation; no separate aggregation is substituted.

The engine aggregates repetitions within tasks and then across tasks. Timing is conditional on reconciled native passes; usage and cost summaries include selected completed native failures. Host, source and price-book conditions remain separate. Partial visibility does not identify pure harness overhead. Static prices are estimates for selected attempts, not a complete invoice; absent model pricing remains unavailable.


## Per-task outcomes

Entries are **native passes / native failures / unresolved**, out of five slots.

| Task | Cline | Codex | Hermes | Pi | Qwen |
|---|---:|---:|---:|---:|---:|
| cattrs-partial-structuring-recovery | 3 / 2 / 0 | 5 / 0 / 0 | 4 / 1 / 0 | 2 / 3 / 0 | 5 / 0 / 0 |
| happy-dom-deterministic-intersectionobserver | 2 / 3 / 0 | 0 / 5 / 0 | 0 / 5 / 0 | 0 / 5 / 0 | 1 / 4 / 0 |
| ink-grid-box-layout | 0 / 5 / 0 | 2 / 3 / 0 | 1 / 4 / 0 | 1 / 4 / 0 | 1 / 4 / 0 |
| psd-tools-blend-range-api | 3 / 2 / 0 | 4 / 1 / 0 | 5 / 0 / 0 | 5 / 0 / 0 | 5 / 0 / 0 |
| superjson-error-stack-serialization | 0 / 5 / 0 | 1 / 4 / 0 | 1 / 4 / 0 | 0 / 5 / 0 | 2 / 3 / 0 |
| textual-richlog-follow-state | 1 / 4 / 0 | 3 / 2 / 0 | 0 / 5 / 0 | 1 / 4 / 0 | 2 / 3 / 0 |
| tomlkit-toml-table-converters | 5 / 0 / 0 | 5 / 0 / 0 | 4 / 1 / 0 | 4 / 1 / 0 | 5 / 0 / 0 |
| true-myth-iterable-collection-combinators | 3 / 2 / 0 | 4 / 1 / 0 | 3 / 2 / 0 | 5 / 0 / 0 | 4 / 1 / 0 |

## Claude remains unresolved

Earlier successful Claude responses had unknown model identity linked to WebSearch in 16 of 19 cases. A separately labeled, maintainer-approved run with WebSearch disabled avoided unknown identity but stopped after about 19 minutes at its account-budget guard without native verification. Its retrieved charge was $0.761044188, with only 26.4% input caching; 94.8% of cost was uncached input. The workaround did not fix cost/completion. No compatibility attempt is pooled into the default-tool results. Account polling and delayed settlement permitted about 1.1 cents of overshoot beyond its $0.75 allowance.

## Spending and evidence boundaries

The private DeepSeek-only Activity export billed **$50.701287** (24,999 rows).
The dashboard DeepSeek V4.1 Flash total was **$52.1**. The maintainer accepted
the **~$1.40** gap as a 25,000-row export cap. Account usage **$64.219276**
includes earlier GLM 5.3 Flash and other non-campaign probes; those models are
not in the DeepSeek export. See `plans/S7-activity-export-gap-exception.md`.

Complete per-harness invoice attribution remains unavailable because of variable rates, interrupted requests, unavailable estimates and an older approximately $0.60 billing discrepancy. The standard report separately shows static selected-attempt cost estimates where the recorded price book supports them. Unknown C4 spend is not zero. Supplemental verifier-only results do not repair original missing model/tool-timing evidence and are not silently promoted.

[Machine-readable summary](summary.json) contains all 200 selected slot outcomes and retained C4/C1 hashes, recovery selection and timing-eligible sample counts. Private raw logs, credentials, prompts and workspaces are not published. Hashes bind retained source files; this is not a verified official release archive. The [earlier paused snapshot](../closeout-2026-09-14/README.md) is historical; the maintainer subsequently requested continuation. The root README’s 192-cell fixture pilot is a different dataset.
