# S1 — Nullable Anthropic cache usage

Status: implemented, independently reviewed and live-verified (2026-09-07).

## Observed failure

The funded extended validation passed Pi/PSD, then recorded seven successful
Claude Code model responses with unavailable usage. The owned Claude cell was
stopped for investigation; original C1/C4/state/ledger remain retained, with
unknown spend unchanged. A separate 16-output-token synthetic Messages probe
returned complete input/output counters and nullable optional cache counters.
Replaying that retained response through `extractUsage` returns unavailable.
`checkedUsageBlob` currently rejects null cache counters as malformed numbers.

OpenRouter documents nullable cache fields in its Messages response example:
https://openrouter.ai/docs/api/api-reference/anthropic-messages/create-a-message
Private probe: `scratch/anthropic-usage-diagnostic-20260907` in the primary tree.

## Scope and behavior

Treat null Anthropic `cache_creation_input_tokens` and `cache_read_input_tokens`
as omitted optional counters. Preserve already observed stream counters when a
later delta omits/nulls them. Required input/output totals must still be present
and finite; malformed, negative or inconsistent counters remain unavailable.
Do not relax numeric checks for other protocols or rewrite retained C1/C4.
No dependency, schema, measurement equation or pricing change.

## Steps and verification

1. Add failing streamed and JSON cases with documented nullable cache fields,
   including cumulative stream preservation and required-total rejection.
2. Make the smallest protocol-scoped parser change.
3. Exercise the real proxy with a deterministic local upstream response and
   assert C1 contains body usage without a provider fallback.
4. Run focused tests, full offline tests/typecheck/lint and independent review.
5. Replay the private wire fixture and run a tiny funded real proxy smoke before
   fresh measured validation. Charge all calls against the shared $22.40 baseline.

## Verification evidence

Three new usage success cases and the real-proxy integration case failed before
the change. The fixed proxy passes 72 tests; full offline verification passes
622 tests, strict typecheck, lint and the S8 launch check (`status: pilot`).
The first full test run overlapped other checks and hit three existing timing
bounds; running the complete suite alone passed without changing those tests.
Independent review found no actionable defects and independently passed all
45 usage/proxy cases.

The retained direct wire replay now reports input 16, output 16 and reasoning 14.
A fresh live request through the actual fixed proxy returned HTTP 200, input 16,
output 16 and reasoning 16, with `usage_source: response_body` and
`usage_lookup: not_attempted`. Its small synthetic prompt and 16-token cap are
probe-only; measured task limits remain 10800 seconds. The two probe calls share
the maintainer's current $22.40 budget. Original measured evidence is unchanged.

Next, run a fresh Claude Code/PSD control with the unchanged three-hour task
preparation and normal native verifier before restarting the complete matrix.
The retained failed validation cannot resume with its null-spend C4. Refresh
remaining funds from the fixed shared provider baseline, never a new allowance.
