# S3 — Bind calibration C4 records to the prepared workspace revision

**Status (2026-08-31):** Implemented and verified

## Goal

Make the no-spend calibration summary validate the revision that actually
appears in C4. DeepSWE provenance has two distinct revisions: the original
upstream repository commit and the sanitized prepared workspace commit used by
the measured cell. C4 records the latter as `task_base_revision`.

## Invariants

- `task_revision` remains the pinned DeepSWE source revision.
- `task_base_revision` must match the prepared manifest `workspace_revision`.
- The manifest's `upstream_revision` remains provenance and must not be silently
  substituted for the measured workspace revision.
- A mismatch keeps the calibration record invalid; it cannot become a pass.
- No C1–C4 schema or timing-model change and no provider spend in tests.

## TDD tasks

- [x] Add a regression fixture with different upstream and workspace revisions
  and observe the summary reject the old comparison.
- [x] Compare C4 `task_base_revision` with manifest `workspace_revision`.
- [x] Run the focused script test and the full repository verification suite.
- [x] Record the real-run finding and close this plan after verification.

The one-task Hermes/Flash diagnostic exposed this mismatch in practice. After
the fix, both final and retry C4 records summarize without provenance/status
validation issues. The cell is still diagnostic-only: it timed out once, then
the retry's verifier failed because the agent rewrote the workspace Git history
and removed the prepared base object. That is task-run evidence, not a
calibration pass.

## Out of scope

Approving the DeepSWE task, changing calibration guardrails, or treating the
failed one-task diagnostic as publication evidence.
