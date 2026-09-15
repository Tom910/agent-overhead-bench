# Contributing / correction path

This project measures public coding-agent CLIs. It is not a capabilities leaderboard.

## Dispute a number

Open an issue with:

1. Tool name and version you believe we mis-measured
2. The `run_id` from a published `run.json`, or for the 2026-09-14 campaign snapshot the `run_id` in [evidence/nonclaude-results-2026-09-14/summary.json](evidence/nonclaude-results-2026-09-14/summary.json)
3. Evidence: your reproduction of **one cell** (command line, env except secrets, `events.jsonl` metadata). Raw campaign `run.json` files are retained privately and are not in this checkout; cite the summary hashes until a frozen archive ships.
4. What you think is wrong (invocation flags, proxy chaining, visibility)

A cell is reopened only with a reproduction, not a preference about ranking.

## Pull requests

Stage work must follow `plans/S<N>-*.md`. Do not add derived metrics to `run.json`. Do not add undeclared npm dependencies.
