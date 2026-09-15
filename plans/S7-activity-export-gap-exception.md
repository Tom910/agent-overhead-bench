# S7 — Accepted DeepSeek Activity export completeness exception

The operator chose to keep the private OpenRouter generation export
`scratch/openrouter_activity_2026-09-14.csv` without re-exporting.

That file is DeepSeek-only: 24,999 rows, billed `cost_total` **$50.701287**,
model slug `deepseek/deepseek-v4.1-flash-20260910` (price-book
`canonical_model` of the pin `deepseek/deepseek-v4.1-flash`). GLM Flash and
other dashboard models are not in the file.

The Activity dashboard DeepSeek V4.1 Flash total was **$52.1**. The **~$1.40**
shortfall is accepted as a 25,000-row export cap, not as missing other-model
spend. Account usage (~$64.22) includes earlier GLM 5.3 Flash (~$9.41) and
other non-campaign probes; those remain outside this export.

This exception is written operator policy. It does not invent rows, put the
CSV in git, or create an official freeze archive.

## Verification

The CSV remains gitignored. METHODOLOGY records the accepted totals. Launch
check stays `pilot`.
