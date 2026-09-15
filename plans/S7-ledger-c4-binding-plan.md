# S7 — Bind run-window attempts to C4 evidence

**Status (2026-08-31):** Implemented and verified.

## Goal

Make the official run-window ledger prove that each recorded current/retry
attempt corresponds to the C4 evidence it claims to cover. The existing ledger
checks cell/retry counts and result-tree bytes, but those checks do not bind an
attempt’s `run_id` or scheduler interval to a particular C4 envelope.

## Contract

- Official validation receives the exact current results tree and validates
  every current and retained retry `run.json` with the existing C4 validator.
- For each ledger attempt, the corresponding C4 run ID and matrix identity must
  match. A retry artifact is selected from `.attempts/attempt-N/run.json`; the
  final current artifact is the cell-root `run.json`.
- The adapter interval, projected through its own C4 adapter anchor, must lie
  within the ledger attempt interval. This is a provenance containment check,
  not a replacement timing or S6 derivation model.
- Missing, duplicate, extra, mismatched, or out-of-interval C4 evidence fails
  closed. Interrupted/state-only attempts remain ineligible for official
  publication rather than receiving an inferred interval.
- The same binding is applied to an official replacement session. Primary and
  replacement ledgers must also have non-overlapping wall-clock windows.
- Non-official fixtures may continue to validate the structural ledger without
  a result root; official freeze/archive paths must provide it.

## TDD tasks

1. [x] Add failing runner tests for a valid C4-bound attempt, a run-ID mismatch,
   missing retry evidence, and adapter timing outside the scheduler interval.
2. [x] Implement a typed result-tree C4 binding helper in
   `packages/runner/src/window-ledger.ts`, using safe regular-file traversal
   and `validateC4Run`; add the official option that requires a result root.
3. [x] Pass the primary and replacement result roots from S7 freeze and archive
   verification. Add an explicit primary/replacement window non-overlap check.
4. [x] Update the official no-spend fixture timings and add adversarial coverage
   for the new gates.
5. [x] Run the full no-spend verification suite and record the result here and in
   `plans/CURRENT-REVIEW-AND-NEXT.md`.

## Acceptance

- Official freeze cannot pass when a ledger attempt is not bound to its C4
  artifact and adapter interval.
- Official replacement freeze cannot pass with an overlapping primary window.
- Sanitized archives bind retry C4 evidence from their separate
  `provenance/retries` roots rather than rejecting a legitimate retry.
- Existing S0–S6 contracts and S6 derivation remain unchanged.
- No provider call is made by tests; full test/typecheck/lint/shell/diff gates
  pass.

## Out of scope

- Inferring exact end times for interrupted processes.
- Counting provider errors as model time or changing visibility semantics.
- Approving a task source, calibration result, or official paid run.

## Verification result

- `npm test`: 32 script tests and all workspace suites passed.
- `npm run typecheck`: all workspaces passed.
- `npm run lint --silent`: passed.
- `sh -n scripts/*.sh images/*.sh`: passed.
- `git diff --check`: passed.
- The official 192-cell fixture passed with C4 interval binding enabled; no
  provider calls were made.
- The runner ledger suite also passed a sanitized retry-root fixture; the
  archive verifier now supplies both current and retry evidence roots.
