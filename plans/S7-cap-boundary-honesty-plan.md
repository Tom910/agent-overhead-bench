# S7 — State the spend-cap boundary precisely

**Status: implemented and verified.**

## Goal

Describe the implemented budget control accurately. The runner reserves a
conservative estimate before each cell, reconciles actual C1-derived spend
after each cell, and stops before starting another cell. It cannot cancel a
provider-side request at the exact dollar boundary or guarantee when external
billing becomes final.

## Scope

- Keep the existing `$1,500` maximum and budget enforcement unchanged.
- Replace public “hard cap” wording where it implies an exact live billing
  cutoff with “recorded-spend cap” or equivalent precise language.
- Keep the operational requirement that the operator supply a conservative
  per-cell upper-bound estimate.
- Do not change C1–C4, pricing, retries, or provider execution.

## TDD implementation order

1. Add a no-spend documentation assertion covering the launcher help and
   methodology wording.
2. Update launcher help, README, methodology, and S7 plans.
3. Run the complete verification gate.

All three steps are complete. Public instructions now describe the local
recorded-spend boundary and its provider-billing limitation precisely.

## Acceptance

- User-facing instructions do not claim exact live provider-billing
  cancellation.
- The `$1,500` recorded-spend boundary remains enforced at launcher, runner,
  and archive boundaries.
