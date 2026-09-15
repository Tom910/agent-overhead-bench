# S3 — Calibration evidence identity binding

**Status (2026-08-31):** Implemented and verified, including complete-evidence
validation after the release review.

## Goal

Ensure the no-spend DeepSWE calibration summary cannot combine passes from
different experimental identities or incomplete artifacts into a false
two-CLI calibration result.

## Contract

Calibration evidence is grouped by the complete identity:

`task_id + task_source + task_repository + task_revision + task_regime + model + condition + price_book`

Two-CLI success is true only when two distinct included tools pass within the
same identity group. Records from another model, source revision, regime,
condition, repository, or price book remain visible evidence but cannot satisfy
the guardrail.
A record is a calibration pass only after its C4 shape, C1 event file,
verifier log, source manifest binding, and native image provenance are present
and internally consistent. Missing evidence remains visible with validation
issues and cannot satisfy the guardrail.

## Implementation and verification

- [x] Require and retain all identity fields in `s3-calibration-summary.mjs`.
- [x] Emit identity groups while preserving the task-level candidate view.
- [x] Add negative tests for mixed model/regime/source identity records.
- [x] Validate retained C4/C1 evidence, native verifier logs, DeepSWE source
  binding, and image provenance before setting `passed`.
- [x] Run the script test, full no-spend test suite, typecheck, lint, shell
  syntax checks, and `git diff --check`.

## Out of scope

This utility does not approve tasks, alter C4 contracts, or infer a release
regime. The source-review and maintainer-sign-off gates remain independent.
