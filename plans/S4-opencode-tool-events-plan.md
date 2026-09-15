# S4 — OpenCode structured tool-events implementation plan

**Status (2026-08-31):** Implemented partial capture; real smoke completed.

## Goal

Capture OpenCode's documented `run --format json` tool records, convert its
child-process wall timestamps through the adapter clock anchor into C3
monotonic intervals, and keep the adapter at `partial` until a real smoke
proves complete positive-duration coverage.

## Scope and invariants

- The OpenCode invocation uses the documented raw JSON event mode and ends
  option parsing before the task prompt.
- Only completed `tool_use` records with a valid `part.state.time.start/end`
  pair become C3 tool events; text, step, and lifecycle records are ignored.
- Epoch timestamps are projected through the adapter's captured wall/monotonic
  anchor. Intervals before the adapter anchor, reversed intervals, or
  out-of-envelope timestamps fail closed.
- A malformed structured stream makes only that adapter result fail; the raw
  redacted stream remains available for diagnosis and the matrix can retry or
  quarantine the cell.
- Child-session/subagent activity not emitted by the parent stream is not
  inferred. OpenCode remains `partial` unless a real smoke establishes the
  full-visibility requirement.
- No prompt or tool output is added to `run.json`; existing redaction and
  sanitized-artifact boundaries remain unchanged.
- No new dependency and no provider calls in tests.

## Implementation order

1. Add parser tests for split JSONL, positive-duration tool records, ignored
   lifecycle records, malformed records, and invalid timing.
2. Implement the pure parser and export it from the adapters package.
3. Add `--format json` and parser wiring to the OpenCode container invocation;
   extend Docker format dispatch.
4. Run no-spend adapter/Docker tests and document the real-smoke visibility
   decision.

All four implementation steps are complete. A release-review follow-up also
added prompt option termination, adapter-anchor lower-bound validation, and
cell-level handling of malformed structured output. A real bounded Docker smoke on
the pinned Flash model produced four OpenCode `tool_use` records (`glob`,
`read`, `write`, and `bash`) with positive source durations of 32, 22, 24,
and 4 ms. The proxy recorded six successful provider responses, all serving
the requested model. This confirms the parser and C3 Docker propagation on a
completed run, but it does not prove that child sessions or every possible
OpenCode tool path are visible; the capability therefore remains `partial`.

## Human/release gate

This stage does not promote OpenCode to `full`. A completed real task through
the pinned proxy must demonstrate complete tool coverage, positive durations,
and no missing child-session activity before the capability label changes.

## Out of scope

Changing the measurement equations, deriving tool time in the adapter,
instrumenting OpenCode's private database, or claiming a harness-share result
without full visibility evidence.
