# S3 — Make generated review evidence self-consistent

**Status (2026-08-29):** superseded and replaced by the structured review record.

## Goal

Ensure a generated DeepSWE calibration manifest points at the structured,
checked-in review record `plans/s3-deepswe-review.json` with its actual
SHA-256, while keeping all review flags false until the required review is
complete. The longer `s3-deepswe-source-audit.json` remains supporting audit
narrative and is not the preflight evidence interface.

## Scope

- Keep the generated evidence path and hash bound to
  `plans/s3-deepswe-review.json`.
- Require the structured record to carry source identity, reviewer metadata,
  selected task IDs, calibration adapters, and all four pending/approval flags.
- Add no-spend launcher/preparation regression assertions for that shape.

No review flag is changed, and no source is approved by this change.

## Acceptance

- Generated manifests reference `plans/s3-deepswe-review.json` and carry its
  current SHA-256.
- The source-audit narrative is not emitted as the structured review record.
- Focused task-source tests, strict typecheck, and shell syntax pass.

## Out of scope

Selecting tasks, marking review flags true, paid calibration, or executing S7.

## Human review

The maintainer must replace the pending structured record with signed review
evidence before enabling any official S7 gate.
