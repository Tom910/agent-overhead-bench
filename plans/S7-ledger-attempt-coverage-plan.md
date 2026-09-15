# S7 — Exact ledger attempt coverage

**Status (2026-08-30):** Implemented and verified.

## Goal

Make the official run-window ledger prove the complete current/retry schedule
represented by the runner state, rather than merely proving that every cell
appeared at least once.

## Contract

For every expected state cell, an official ledger must contain exactly one
`current` attempt and exactly `state.retries` `retry` attempts. Unknown cell
IDs and replacement/interrupted attempts are rejected in the primary official
session. Replacement evidence requires a separately bound session policy.

## Implementation and verification

- [x] Extend the ledger assertion with expected retry counts.
- [x] Pass runner-state retry counts from official freeze and archive verify.
- [x] Add missing-retry, extra-retry, and unknown-cell regression tests.
- [x] Run the complete no-spend verification suite.

## Out of scope

This does not silently infer interrupted or replacement durations and does not
replace the separate replacement-session evidence decision.
