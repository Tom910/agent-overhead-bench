# S8 Launch Scaffolding Validation Plan

**Goal:** Turn the S8 local acceptance bullets into a bounded, no-network
preflight that proves the repository is safe to publish only as an unpublished
scaffold.

**Scope:** Validate `evidence/index.json`, required launch documents, and the
README's unpublished positioning. The command does not contact GitHub, create
releases, inspect provider data, or change any publication state.

## Tasks

- [x] Add a failing no-spend test for the pending evidence ledger and required
  launch documents.
- [x] Implement `scripts/s8-launch-check.mjs` with typed validation errors and
  an optional repository-root argument.
- [x] Reject malformed, symlinked, non-pending, or non-empty evidence ledgers.
- [x] Wire the check into the repository test suite and document its use in the
  S8 checklist and README.
- [x] Run full tests, typecheck, lint, shell checks, and diff validation.

## Invariants

- No provider key is read and no network or subprocess is required.
- A pending ledger must have `version: 1`, `status: "pending"`, and an empty
  `artifacts` array.
- The check must not infer that a frozen dataset, article, courtesy note, or
  external URL exists.

## Status

Implemented and verified: `scripts/s8-launch-check.mjs` validates the current
unpublished scaffold without network or provider access; the test suite and
README expose the command.
