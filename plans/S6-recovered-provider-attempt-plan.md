# S6 — Recovered provider-attempt classification

**Status (2026-08-30):** Implemented and verified.

## Goal

Keep failed provider attempts in C1/model-time while allowing the verifier to
judge a run when the CLI recovered internally and exited successfully.

## Contract

- A failed or aborted identifiable provider attempt remains timing evidence.
- Usage and cost remain successful-event-only.
- A nonzero CLI exit, timeout, model mismatch, missing pinned proxy evidence,
  or an all-failed request sequence suppresses verification.
- A zero-exit CLI with at least one successful pinned model response proceeds to
  the native verifier even if earlier provider attempts failed.

This observes the CLI's retry behavior instead of converting recoverable
provider availability into an unconditional adapter error.

## Implementation and verification

- [x] Add a pure classification helper with deterministic recovery tests.
- [x] Apply the helper to host and Docker cell execution.
- [x] Preserve the existing all-failed HTTP failure behavior.
- [x] Run runner tests plus the complete no-spend verification suite.

## Out of scope

This does not invent usage for failed requests, add an `error_time` metric, or
change the S6 timing union equation.
