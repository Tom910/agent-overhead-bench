# S5 resume spend accounting plan

Status: Implemented

## Goal

Recover the spend recorded by a schema-valid failed `run.json` when the
process dies after the cell artifact is written but before matrix state is
persisted. The recovery must charge that attempt exactly once, preserve it as
an attempt before retrying, and leave completed-artifact recovery unchanged.

## Contract boundary

- Consumes the existing C4 `run.json` and S5 matrix state.
- Produces only the existing matrix state transitions and `.attempts` archive;
  C1-C4 schemas and derived metrics are unchanged.
- A valid failed C4 outcome is charged using its existing
  `spend_usd_estimate` (unavailable spend remains unavailable under a hard
  cap, consistent with normal execution).

## Acceptance tests

1. A persisted failed C4 artifact with a `running` state is recovered,
   charged once, archived as the prior attempt, and retried.
2. The retry's spend is added to the recovered spend, so the final total is
   the sum of both attempts.
3. A completed persisted artifact still completes without executor invocation
   and is charged once.
4. A malformed or identity-mismatched artifact is rejected.

## Out of scope

- Changing the one-retry policy or spend formulas.
- Changing the C1-C4 contracts, visibility derivation, or official budget cap.

## Review point

Review the crash boundary between writing `run.json` and saving `state.json`:
the same artifact must not be charged again after the recovered failed state
has been persisted.
