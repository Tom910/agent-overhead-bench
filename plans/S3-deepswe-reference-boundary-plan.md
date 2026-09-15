# S3 DeepSWE reference-boundary plan

## Goal

Ensure a prepared DeepSWE measured workspace contains the pinned upstream base
checkout but never the upstream task-root `reference/` material. This is a
source-boundary fix, not a change to the measurement model or task verifier.

## Contracts

- The measured workspace contains ordinary public files from the upstream
  checkout at the resolved base commit and a fresh local Git base commit.
- The task-root directory named `reference/` is private source material and is
  excluded from the measured workspace.
- Nested directories named `reference/` inside the public checkout remain
  available; upstream repositories may legitimately use that name in public
  documentation or source paths.
- Hidden tests, solution patches, and verifier context remain outside the
  measured workspace.
- The source checkout's `.git` metadata is not copied; no source object can be
  queried with `git show` from the measured workspace.
- No new npm dependency and no compatibility promise is introduced.

## Implementation and verification

1. Add a reusable public-workspace copy entry point backed by the existing
   symlink and permission checks.
2. Add a failing test proving that a root private reference is omitted while a
   nested public reference directory is retained.
3. Make the DeepSWE preparation script use that entry point instead of raw
   recursive copying.
4. Regenerate the selected DeepSWE materialization and its checksums/evidence.
5. Run task validation, the complete TypeScript test suite, typecheck, lint, and
   shell checks; independently review the source boundary and prepared tree.

## Out of scope

- Approving DeepSWE for official S7 runs.
- Changing task difficulty, timeout regime, verifier semantics, or C1–C4
  derivation.
- Removing legitimate nested public paths named `reference/`.

## Human review

Before release, inspect the exact prepared task tree and source provenance to
confirm that any remaining `reference` paths are public nested paths rather
than held-out source material.
