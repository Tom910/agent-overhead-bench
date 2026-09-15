# S3 — Cheap model comparison: Flash vs DeepSeek V4 Flash (2026-09-04)

## Question

The maintainer wants a cheap pinned model and asked whether
`deepseek/deepseek-v4-flash-0731` is a viable alternative to
`z-ai/glm-5.3-flash`, given that Flash's tail latency — not its capability —
is what breaks calibration runs. See [S3-flash-tail-latency-finding.md].

## Answer

**No. DeepSeek V4 Flash 0731 is materially worse for this workload.** Keep
`z-ai/glm-5.3-flash` as the cheap pin. This is a negative result for the
candidate, not for the cheap-model strategy.

## Pricing (OpenRouter, 2026-09-04)

DeepSeek is cheaper on paper, which is why it was worth testing:

| Model | input /M | cached /M | output /M | context |
|---|---|---|---|---|
| `z-ai/glm-5.3-flash` | `$0.075` | `$0.015` | `$0.250` | 1,310,720 |
| `deepseek/deepseek-v4-flash-0731` | `$0.065` | `$0.016` | `$0.180` | 1,310,720 |

Both are recorded in the `openrouter-2026-09-04` price book. Recording a model
does not pin it.

## Direct latency probe

The discriminating measurement isolates the model from the harness: an
identical 105,000-token code-like prompt, `max_tokens: 5`, straight to
OpenRouter with no proxy, no container, and no agent. Total wall time to
deliver a five-token answer:

| Model | n | median | p75 | max | ≥15 s | ≥40 s |
|---|---|---|---|---|---|---|
| `z-ai/glm-5.3-flash` | 12 | 4.8 s | 6.2 s | 28.6 s | 1/12 | **0/12** |
| `deepseek/deepseek-v4-flash-0731` | 12 | 10.8 s | 43.7 s | 47.4 s | 6/12 | **5/12** |

DeepSeek's failure mode is distinctive and bad: time-to-first-byte is often
*faster* than Flash (1.0–1.2 s), but the response then takes 40+ seconds to
deliver five tokens. Five of twelve requests did this. Flash never did.

Flash is not clean either — one request took 28.6 s for the same five tokens,
which is the same tail already documented at a 4.6 % rate. But Flash's tail is
roughly an order of magnitude rarer and shallower.

## Harness corroboration

A bounded two-CLI calibration of `ink-grid-box-layout` on DeepSeek (extended
regime, 1200 s, `openrouter-2026-09-04`) produced **one** successful completion
across both cells. Codex issued a single request that was still in flight when
the cell timed out; Hermes completed one 7.7 s request and then stalled the
same way. Both cells quarantined after their retries. Retained root:
`scratch/cal-deepseek-run1`, recorded spend `$0.0036068729`.

That run is weak evidence on its own (n=1 per CLI), which is why the direct
probe above was run to isolate the model. The two agree.

## Incidental confirmations from the same run

- The `/api/v1/models` proxy path fix works in production: Hermes's three
  `GET /api/v1/models` probes returned 200 where they previously returned 404.
- The new `usage_lookup` C1 field is being recorded (`not_attempted` on every
  event here, correctly: no successful request lost its body usage).
- The runner recorded spend and proceeded from Hermes to Codex rather than
  aborting, because no successful request had unavailable usage. The
  abort path was therefore not exercised, so the counter-family fix remains
  verified by test rather than in production.

## Conclusion

Keep `z-ai/glm-5.3-flash` pinned. The cheap-model strategy is sound; this
particular cheap alternative is not. Any future candidate should be screened
with the same direct large-prompt probe **before** any paid calibration cell —
it costs cents and takes minutes, against hours and dollars for a calibration
that the tail will sabotage anyway.

## Reproduction

`scripts/` does not carry this probe; it was run ad hoc. The shape is: POST an
identical ~105k-token prompt with `max_tokens: 5` to
`https://openrouter.ai/api/v1/chat/completions` for each candidate model,
recording `time_starttransfer` and `time_total`, repeated at least a dozen
times per model. Report the median and the frequency of the tail, not the mean.
