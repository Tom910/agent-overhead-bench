# S4 adapter timeout process-tree follow-up

**Status (2026-08-28): implemented and verified.**

## Goal

Ensure a timed-out host adapter cell terminates the CLI and descendants that
inherit its output pipes. A CLI can launch a child process and exit while that
child keeps stdout/stderr open; waiting for the parent `close` event then
extends a nominal 300-second cell beyond its contract.

## Scope and invariants

- Apply only to adapter subprocess lifecycle and timeout cleanup.
- On POSIX, launch the adapter in its own process group and signal the group;
  retain direct-child behavior on Windows.
- Preserve C3 exit code `124`, monotonic timestamps, redaction, and captured
  artifacts.
- No changes to prompts, model routing, C1–C4 fields, or timeout durations.

## Acceptance tests

- A helper CLI that exits while a descendant holds inherited output pipes must
  return C3 exit `124` promptly and leave no descendant alive.
- Existing adapter timeout, failure, integration, full tests, strict
  typecheck, lint, shell syntax, and diff checks pass.

The first real cattrs calibration exposed the failure mode: a timed-out CLI
descendant kept the captured pipes open and left the runner past its bound.
The adapter now uses a dedicated POSIX process group and kills that group on
timeout. The regression helper reproduces the inherited-pipe case and passes.

## Out of scope

- Changing the runner retry/quarantine policy or task timeout values.
- Killing processes outside the adapter's own process group.
