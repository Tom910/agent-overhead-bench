# S7 Run-Window Ledger Implementation Plan

**Status:** Implemented in runner/freeze/archive paths; final full-suite verification and release-review follow-up remain.

**Goal:** Make the official contiguous-run window a verifiable provenance artifact
that binds the host session, runner scheduling, Docker execution, retries, and
selected anomaly replacements without creating a second timing model.

**Authority:** `plans/S7-runs-protocol.md`, the north-star design's S7 window
requirements, and the existing C1–C4 contracts. This plan only adds provenance
and validation; S6 derivation remains unchanged.

## Scope and invariants

- Record one operator-created run-session ID and an explicit UTC start/end
  window outside `run.json`.
- Capture host identity and runtime facts at session start and end: OS, CPU,
  memory, Docker version/context, and selected image digests. Secret-bearing
  environment values are never recorded.
- Record monotonic scheduler intervals for every current cell, preserved retry,
  interrupted attempt, and selected replacement. Every runner process segment
  has its own runner clock anchor; scheduler timestamps are never projected
  through an adapter or proxy anchor.
- Require one contiguous official segment. A restart creates an explicit new
  segment, and the official freeze rejects multi-segment ledgers. A SIGKILL has
  no recoverable exact end time, so its attempt remains open/interrupted rather
  than being assigned a fabricated end timestamp.
- Bind the ledger to the exact matrix definition, runner state hash, result
  binding, and replacement-state binding already produced by S7 Activity work.
- Keep provider calls out of tests and preflight. No API keys or raw Activity
  exports enter the ledger or archive.

## Proposed artifact

`provenance/run-window-ledger.json`:

```json
{
  "version": 1,
  "session_id": "operator-created-id",
  "window": { "start_iso": "...", "end_iso": "..." },
  "host_start": { "os": "...", "cpu": "...", "ram_gb": 0, "docker": "...", "image_digests": [] },
  "host_end": { "os": "...", "cpu": "...", "ram_gb": 0, "docker": "...", "image_digests": [] },
  "matrix_definition_sha256": "sha256:...",
  "segments": [{ "id": "segment-0", "start_iso": "...", "end_iso": "...", "cells": [] }],
  "results_binding": { "run_ids_sha256": "sha256:...", "results_bytes_sha256": "sha256:..." },
  "state_sha256": "sha256:...",
  "replacement_state_sha256": null
}
```

The exact schema may be refined during Task 1, but all fields remain
provenance-only and are excluded from `run.json`.

`results_bytes_sha256` is intentionally named differently from the S7 Activity
Export binding's portable `results_sha256`: the runner binding covers exact
pre-freeze result-tree bytes, while the archive freezer recomputes the former
over its sanitized result tree. The two must not be presented as the same
identity.

The runner's raw binding is pre-freeze evidence. The freezer validates it before
copying, then recomputes the same raw-byte binding over the sanitized archive
tree. S7's portable Activity `results_sha256` remains a separate binding and is
not conflated with this field.

## TDD tasks

### Task 1: Freeze the ledger contract

- Add typed ledger definitions and strict validation for ISO timestamps,
  session IDs, host snapshots, segment ordering, duplicate attempt identities,
  and digest formats.
- Add tests for reversed windows, gaps, overlapping segments, missing cells,
  stale bindings, and secret-shaped fields. Repeated cell IDs are allowed across
  current/retry/interrupted attempts; attempt identity is unique.
- Add the JSON Schema artifact if the existing contract governance requires it;
  runtime validation must remain aligned with the schema.

### Task 2: Capture runner/session evidence

- Add a no-provider session-start record before the first cell and a terminal
  session-end record after the last cell.
- Extend the existing atomic state writes with ledger references, preserving
  crash recovery and existing budget semantics.
- Record scheduler monotonic start/end for each execution attempt, including
  interrupted attempts and retries; do not infer missing intervals.
- Add runner tests for normal completion, process interruption/resume, and a
  restart that crosses the declared window.

Implemented: `RunWindowWriter` persists the ledger before every external cell
execution, records current/retry attempts, closes normal sessions, and creates
an explicitly anchored continuation segment on resume. A hard kill leaves an
open attempt; it is never assigned a fabricated end time. `state.json` records
the session and relative ledger path without creating a state↔ledger hash cycle.
Replacement reruns remain separate sessions, matching the existing S7 rerun
tree/state model; they are not falsely represented as part of the primary
contiguous segment.

### Task 3: Validate at preflight and freeze

- Require a fresh ledger for official runs and reject stale or reused session
  IDs, host drift, matrix-definition drift, missing cells, and intervals outside
  the declared window.
- Include current, retry, replacement, and state-only interrupted evidence in
  the interval coverage check.
- Copy only the sanitized ledger into the archive and include it in the
  existing portable archive binding/checksum manifest.
- Add an official-style no-spend freeze fixture with a valid ledger plus stale,
  host-drift, gap, and out-of-window mutations.

Implemented: official freeze requires a closed single-segment ledger, validates
its state/result bindings and expected cells, copies it into the sanitized
archive, and archive verification revalidates it. Non-official fixture freezes
remain usable without a ledger; official runner state is session-bound and
cannot be archived without one.

### Task 4: Operator documentation and review

- Document the quiescent-host procedure, AC power requirement, Docker Desktop
  caveat on macOS, restart/segment rule, and exact preflight/freeze commands.
- Record which host facts are observational and which are enforceable gates.
- Run the full verification suite and request an independent GPT Sol review
  before marking the plan implemented.

Independent GPT Sol and Claude Opus reviews were run without provider benchmark
calls. They identified and led to fixes for the default-clock projection bug,
fresh end-host capture, closed-ledger reopening, path derivation, error masking,
and the distinction between raw result-byte and portable Activity bindings.

## Acceptance

- An official archive cannot pass without one valid session-bound ledger.
- Every billable/request-bearing current or retry attempt is covered by the
  primary ledger. A state-only interrupted attempt remains explicitly open and
  causes a fail-closed official archive; replacement reruns require their own
  separately bound session evidence.
- A changed host, matrix, state/result binding, segment boundary, or declared
  window causes preflight or freeze rejection.
- The ledger contains no credentials, prompts, solutions, raw Activity export,
  or derived S6 metrics.
- Full tests, typecheck, lint, shell syntax, and diff checks pass with zero
  provider calls.
