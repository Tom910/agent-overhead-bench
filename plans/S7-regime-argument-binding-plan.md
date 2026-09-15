# S7 — Preflight regime argument binding

**Status (2026-08-30):** Implemented and verified.

## Finding

`run-all.sh` passes `AOB_RUN_REGIME` as the ninth positional argument to
`s7-preflight.sh`, but preflight read positional argument 10. An explicit long
run could therefore be validated using the default short regime.

## Fix

Read the ninth argument in `s7-preflight.sh`, retaining the environment
fallback for direct invocations. Add a no-spend subprocess regression test that
passes an invalid regime in position 9 and requires the regime error before any
task, Docker, or credential checks.

## Verification

- The focused regime test fails before the fix and passes after it.
- Full workspace tests, strict typecheck, lint, shell syntax, and diff checks
  pass.
