# S6 — Provider-attempt timing correction

**Status (2026-08-29):** implemented and verified.

## Goal

Count the full wall interval of every identifiable model API attempt in
`model_time`, including failed HTTP and network attempts, while keeping token
usage, cost, and successful-turn counts restricted to successful responses.
This preserves the design definition that model time includes provider queue
and streaming time without inventing usage for failed requests.

## Scope

- Use the existing C1 endpoint/method/protocol predicate for timing intervals.
- Keep `isSuccessfulModelEvent` for usage, cost, spend reconciliation, and
  successful-run evidence where a successful response is required.
- Add regression coverage for 429/network-failed model attempts and for
  metadata/unknown traffic remaining outside model time.
- Update the S6 measurement-integrity record to supersede its earlier
  successful-only timing wording.

No new dependency is needed.

## Acceptance

- `deriveFromC1` includes eligible 2xx, non-2xx, and errored model endpoint
  intervals in the model-time union.
- Metadata and unknown/mismatched endpoint events remain excluded.
- Report usage and cost do not count failed attempts and do not guess missing
  usage.
- A completed C4 run still requires at least one successful model event; a
  failed or timed-out run can retain identifiable failed-attempt timing for
  anomaly review.
- Contract, report, typecheck, lint, and full repository tests pass.

## Out of scope

Changing the C1/C4 schemas, adding an `error_time` derived metric, changing
the headline visibility policy, selecting tasks, or running paid calibration.

## TDD tasks

1. Add failing contract/report tests proving the timing and successful-usage
   predicates are intentionally different.
2. Change report derivation to use endpoint eligibility for timing only.
3. Run focused and full verification, then update the prior S6 plan wording.
