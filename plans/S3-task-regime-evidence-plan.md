# S3 — Bind DeepSWE regime metadata per task

**Status: implemented and verified.**

## Goal

Prevent DeepSWE preparation from assigning one global expected-duration range
to every selected task. Each task must carry an explicit reviewed duration
range in the selected regime.

## Interface

`AOB_TASK_EXPECTED_MINUTES_FILE` is a JSON object mapping every selected task
ID to `[minimum_minutes, maximum_minutes]`. The preparation command rejects
missing, extra, duplicate, non-integer, or out-of-regime entries. Short entries
must fit `[1,5]`; long entries must fit `[6,15]`.

The calibration launcher passes the same input through
`AOB_CALIBRATION_EXPECTED_MINUTES_FILE`.

## Scope and invariants

- `task.yaml`, the suite manifest, and the original DeepSWE manifest all use
  the task-specific range.
- The launcher regime still controls timeout bounds and report separation; it
  does not invent task difficulty metadata.
- No C1–C4 field or timing equation changes.
- No provider spend occurs in tests.

## TDD implementation order

1. Add source and launcher contract assertions for the required duration map.
2. Validate the JSON map before any source checkout and use its task-specific
   values in every generated manifest.
3. Run the full verification gate and update operational documentation.

All three steps are complete. DeepSWE preparation now requires and propagates
an explicit per-task duration range.

## Acceptance

- A preparation without a complete duration map fails closed.
- Selected tasks retain distinct reviewed ranges through task and source
  manifests.
- Existing regime, typecheck, lint, shell, and zero-spend tests pass.
