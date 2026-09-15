# S7 — Release-boundary provenance hardening

**Status (2026-08-31):** Implemented and verified

## Goal

Make an official archive impossible to construct from a result tree whose
selected public source, task workspace, prepared agent images, or independent
provider spend review is not bound to the frozen data. Keep report grouping
identity-complete so different public repositories cannot be pooled silently.

## Invariants

- No provider requests occur in tests.
- No derived metrics are added to `run.json`.
- Existing C1–C4 timing and visibility equations are unchanged.
- Prepared DeepSWE agent images are checked by exact local image digest before
  official execution.
- Freeze consumes sanitized provenance metadata and a passing Activity Export
  spend summary; secrets and prompts never enter the archive.
- Repository identity participates in report grouping and archive identity.

## TDD tasks

- [x] Add tests for report grouping and labels that distinguish task
  repositories.
- [x] Add tests requiring DeepSWE workspace `HEAD` and per-tool image digests to
  match source-manifest metadata during S7 preflight.
- [x] Add tests showing the freezer rejects missing/mismatched provenance and
  missing or failing Activity Export evidence.
- [x] Implement the checks and archive sanitized provenance/evidence. DeepSWE
  image identity is validated per `(task, tool)`; only tool versions are
  required to be globally stable.
- [x] Run focused tests, full tests, typecheck, lint, shell syntax, and diff
  checks.

## Out of scope

Changing the measurement model, promoting Codex visibility, approving the
DeepSWE source, or claiming that timeout diagnostics are calibration passes.
