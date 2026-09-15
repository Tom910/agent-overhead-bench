# S3 DeepSWE report-path compatibility follow-up

**Status (2026-08-28): implemented and verified.**

## Goal

Make the prepared DeepSWE native verifier's authoritative JUnit reports match
the pinned DeepSWE node-id whitelist when the benchmark mounts the workspace at
`/work/workspace`. DeepSWE's checked-in config records the source verifier's
`/app` path, while the immutable benchmark image uses `/app` as a symlink to
the mounted `/work/workspace` path; pytest therefore emits the latter in
parameterized node IDs. Without this translation, valid reference patches are
incorrectly graded as reward zero because hundreds of pass-to-pass IDs appear
missing.

## Scope and invariants

- Modify only the generated DeepSWE verifier report boundary, before the
  source-owned grader reads JUnit XML.
- Translate `/work/workspace/` to `/app/` in report node IDs; do not alter test
  selection, source tests, hidden tests, patches, or reward semantics.
- Keep the change dependency-free and inside the immutable verifier image.
- No C1–C4 fields, derived metrics, or run-time network access change.

## Acceptance tests

- The source-preparation regression test requires the generated verifier to
  contain the report-path normalization loop.
- A prepared DeepSWE task's reference patch has no missing path-parameterized
  pass-to-pass IDs and receives reward `1` when the source grader is run.
- Pristine validation remains nonzero and generic task-pack behavior is
  unchanged.
- Full tests, strict typecheck, lint, shell syntax, and diff checks pass.

The prepared `psd-tools-blend-range-api` task now passes all 979/979 selected
pass-to-pass tests and 45/45 fail-to-pass tests after report normalization,
with source reward `1`. Its pristine verifier still fails closed. The same
normalization is generated for every selected DeepSWE task.

## Out of scope

- Rewriting DeepSWE configs or changing any upstream task/verifier files.
- Approving the source for S7; source review, two-CLI calibration, and
  maintainer sign-off remain separate gates.
