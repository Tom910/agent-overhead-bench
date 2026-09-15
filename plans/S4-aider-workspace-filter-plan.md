# S4 — Aider workspace context boundary

## Goal

Ensure the Aider container recipe passes only task workspace files as editable
context. Prepared public repositories retain `.git` metadata for provenance and
verification, but Git internals are not task source and must not be sent as
model context.

## Contracts consumed and produced

- Consumes the S3 prepared workspace and the S4 `ContainerInvocation` contract.
- Produces the same Aider invocation shape with a corrected, bounded file list.
- No C1–C4 or measurement-model changes.

## Acceptance tests written before implementation

1. A workspace containing `.git` metadata produces an Aider argv that excludes
   `.git/**` while retaining ordinary source files.
2. Existing setup/config files remain excluded and symlink rejection remains
   fail-closed.
3. The focused adapter suite and full no-spend repository gate pass.

## Implementation tasks

1. Add the failing `.git` exclusion assertion to the existing Aider recipe
   test and confirm the current implementation fails it.
2. Exclude the `.git` directory during recursive workspace enumeration.
3. Record the correction and verify all gates.

## Human-review points

- Confirm that excluding Git metadata does not alter the task workspace or
  verifier boundary; it changes only Aider's editable context list.
- Confirm that no task source files outside `.git` are excluded.

## Out of scope

- Changing Aider flags, model pinning, timeout policy, proxy routing, task
  preparation, verifier behavior, or tool visibility.
- Adding dependencies or changing the official task subset.

## Status

Implemented and locally verified (2026-08-28). Aider now excludes `.git/**`
from its editable file list while retaining all ordinary task files; the
focused regression test fails before the change and passes after it.
