# S6 — Do not publish partial usage aggregates

**Status: implemented and verified.**

## Goal

Prevent tokens, cache percentage, cost, and token-floor medians from silently
dropping repetitions whose provider usage is unavailable.

## Contract and scope

- A usage/cost aggregate is available only when every repetition contributing
  to that task has a numeric value.
- A headline aggregate is available only when every selected task contributes
  a complete task aggregate.
- Missing usage remains `null`; no zero imputation and no change to C1–C4.
- Timing aggregation and visibility gating are unchanged.

## TDD implementation order

1. Add a two-repetition report test with one successful response missing usage;
   require tokens, cache percentage, and cost to render unavailable.
2. Change the existing nullable report aggregation helper to reject partial
   inputs rather than taking the median of present values.
3. Run the full verification gate and record the completed plan.

All three steps are complete. Nullable usage, cost, and token-floor
aggregates now require complete inputs instead of silently dropping missing
repetitions.

## Acceptance

- A partial usage set renders `—` for affected headline and task cost fields.
- Complete usage sets retain their existing medians.
- All tests, typecheck, lint, shell syntax, and diff checks pass.
