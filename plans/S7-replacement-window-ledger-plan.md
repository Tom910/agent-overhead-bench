# S7 — Replacement rerun window ledger

**Status (2026-08-31):** Implemented and verified. Adversarial review findings are closed; official replacement execution remains an operational gate, not an implementation gap.

## Goal

Bind every selected anomaly replacement rerun to its own runner session,
state, retry schedule, and sanitized result evidence so official freeze cannot
publish a replacement without scheduler-window provenance.

## Contract

- The primary matrix ledger remains one closed contiguous segment and covers
  exactly the primary state current/retry multiset.
- An official replacement rerun must provide a separate closed ledger with a
  distinct session, stable host identity, exact rerun-state current/retry
  multiset, and raw state/result bindings.
- The replacement ledger's result binding is recomputed after sanitized rerun
  evidence is copied into the archive.
- Missing, open, interrupted, multi-segment, stale, or mismatched replacement
  ledgers fail official freeze and archive verification.
- Nonofficial dry-run replacement fixtures may omit this gate because they are
  explicitly marked nonofficial and cannot pass `--official` verification.

## Implementation and verification

- [x] Add a rerun-ledger input to S7 freeze and require it for official
  replacement archives.
- [x] Validate raw rerun ledger state/result bindings and exact retries.
- [x] Copy and rebind the sanitized rerun ledger under `provenance/rerun-state`.
- [x] Validate the archived primary and rerun session bindings unconditionally in official mode.
- [x] Reconcile ledger retry counts with retained raw retry evidence.
- [x] Validate the archived rerun ledger and add regression coverage.
- [x] Run the complete no-spend verification suite.

The implementation is covered by the freeze/archive replacement fixtures and
the full repository verification suite (`npm test`, typecheck, lint, shell
syntax, and diff checks). It requires a separate operator-supplied rerun
ledger only when an official anomaly replacement is actually selected.
The replacement runner can be invoked with `--run-id-suffix replacement` so
its C4 run ID is distinct from the original without hand-editing evidence.

## Out of scope

This does not automatically create replacement sessions or infer anomaly
dispositions. The operator still runs the replacement matrix with
`--window-ledger --session-id <id> --run-id-suffix replacement` and supplies
the resulting path to freeze.
