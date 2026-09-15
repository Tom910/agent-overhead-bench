# S7 — GPT Sol follow-up integrity fixes

**Status (2026-08-30):** implemented and locally verified.

## Goal

Close the independently identified release-integrity defects exposed by the
2026-08-30 DeepSWE diagnostic without changing the measurement equations or
guessing unavailable provider spend.

## Scope and invariants

- A capped cell with incomplete spend preserves its schema-valid C4 and C1
  artifacts; it is never represented as an untouched `$0` pending cell.
- A preserved incomplete-spend cell cannot be resumed under a cap, and its
  known spend is never silently charged as complete spend.
- Activity and archive validation accept an eligible event whose requested
  model is unavailable when the served model proves the pinned model, while
  rejecting every non-null model mismatch.
- Retry/archive identity includes all C4 measurement and task-environment
  provenance fields required to prevent cross-condition substitution.
- Official current results share one host identity; a replacement rerun must
  match the current host and surrounding cell identity.
- Outlier replacement is checked against its corresponding current-cell
  population, not as a one-element population.
- No new dependency, provider spend, or derived metric in `run.json`.

## Implementation order (TDD)

1. [x] Add failing runner, report, and archive tests for the five findings.
2. [x] Implement the smallest typed fixes and shared identity/model predicates.
3. [x] Record the diagnostic and review disposition in the stage plans.
4. [x] Run focused tests, the full no-spend verification gate, and a fresh
   independent review before any additional paid run.

## Acceptance

- The interrupted/incomplete-spend regression retains `run.json`, leaves the
  cell non-runnable under the armed cap, and records no fabricated total.
- Activity cross-check tests cover `model_requested: null` with a matching
  `model_served` value.
- Archive tests reject mismatched retry model/price/source/host/environment
  identity and reject an anomalous replacement relative to current peers.
- Existing tests and all repository verification gates pass.

## Implementation record

The runner now preserves a returned C4 when a capped cell has unavailable or
over-cap spend and marks the executed cell failed; a capped resume stops at
that preserved evidence. Activity and archive checks use the shared C4
measurement identity and model-identity predicate. The freeze boundary checks
one host identity and evaluates a replacement against its peer population.
Focused runner/report/contracts/archive tests pass; the full no-spend gate is
recorded with the commit that closes this plan.
