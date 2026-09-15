# S7 — Bound Docker readiness preflight

**Status:** implemented and verified.

## Goal

Ensure the official S7 preflight cannot hang indefinitely while waiting for a
wedged Docker daemon. A daemon readiness failure must stop before credentials,
image checks, or provider requests are used.

## Scope and invariants

- Replace only the unbounded `docker info` readiness check in
  `scripts/s7-preflight.sh` with the existing command-timeout helper.
- Default to a finite 10-second timeout, with a finite test override.
- Preserve the existing S7 validation order and failure semantics.
- Do not change measured agent-cell timeouts, Docker execution flags, or C1–C4
  measurement semantics.
- No new dependency and no provider spend in tests.

## TDD implementation order

1. Add a source regression test requiring S7 preflight to invoke
   `command-timeout.mjs` for `docker info`.
2. Observe the test fail against the direct readiness command.
3. Add the bounded invocation and document the timeout.
4. Run focused and full verification, then commit the isolated fix.

All four steps are complete. The preflight uses the existing process-group
timeout helper with a 10-second default; the override is finite-validated by
that helper. No provider or measured cell is started by the regression tests.

## Acceptance

- The S7 script contains no unbounded Docker readiness invocation.
- The default timeout is 10 seconds and remains finite when overridden.
- Existing regime, source, and no-spend preflight tests pass.
- Workspace tests, typecheck, lint, shell syntax, and diff checks pass.

## Out of scope

Official S7 execution, source approval, task selection, and Docker image build
or measured-cell behavior.
