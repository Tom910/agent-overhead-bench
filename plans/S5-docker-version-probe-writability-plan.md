# S5 — Docker version-probe writability

## Goal

Allow container-only adapters whose version command initializes a user cache
(currently OpenCode) to pass the runner’s preflight version check without
weakening the measured container’s read-only policy.

## Scope and invariants

- Apply the change only to the unmeasured `--version` probe.
- Keep the probe network-disabled, read-only, capability-free, and bounded.
- Give the probe the existing bounded `/tmp` tmpfs and set `HOME=/tmp`, so
  cache writes cannot touch the image or host filesystem.
- Do not change adapter commands, proxy routing, timing, C1–C4 contracts, or
  the official tool set.
- Add no dependencies.

## TDD tasks

1. Add a Docker-runner regression test whose fake version command fails unless
   the probe provides the bounded tmpfs and temporary home.
2. Confirm the test fails with the current probe arguments.
3. Add the probe-only tmpfs and `HOME=/tmp` arguments.
4. Run focused and full no-spend verification, then record the implemented
   status here and in `plans/README.md`.

## Acceptance

- An OpenCode-like read-only version command succeeds in the Docker runner.
- The version probe includes `--read-only`, `--network none`, the bounded
  `/tmp` tmpfs, and `HOME=/tmp`.
- The measured agent command remains unchanged and still receives its normal
  invocation environment.
- All existing tests, typecheck, lint, and shell syntax checks pass.

## Status

Implemented and locally verified (2026-08-28). The Docker version probe now
uses the existing bounded `/tmp` tmpfs and `HOME=/tmp` while remaining
read-only, network-disabled, capability-free, and outside measured timing.
