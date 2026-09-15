# S3 — Explicit DeepSWE lineage policy

**Status:** implemented and verified.

## Decision

DeepSWE is the maintainer-selected public source. Its pinned upstream manifest
declares `source_dataset: swe-bench-ultra`; that lineage is provenance, not a
direct SWE-bench task import. Official selection may therefore accept the
exact DeepSWE-declared lineage while continuing to reject direct
Terminal-Bench, Vetta, and other unapproved SWE-bench lineage labels.

The source adapter, repository, revision, native categories, verifier, and
license evidence remain independently validated. This policy does not approve
the source for paid S7 execution by itself.

## Scope

- Update the DeepSWE validator and cheap S7 preflight check to allow the
  selected `swe-bench-ultra` lineage only as DeepSWE provenance.
- Continue rejecting `terminal-bench`, `vetta`, and noncanonical SWE-bench
  labels.
- Update repository instructions and stage records so a later agent does not
  reintroduce the blanket rejection or silently treat DeepSWE as direct import.
- No change to C1–C4, task contents, verifier behavior, or pricing.

## TDD order

1. [x] Change source-policy tests to accept the selected DeepSWE lineage and keep
   direct/relabelled restricted lineages failing.
2. [x] Implement the narrow validator and preflight policy.
3. [x] Update documentation, run all local gates, and commit.

## Acceptance

- The selected pinned DeepSWE source passes lineage validation when all other
  official composition gates pass.
- Terminal-Bench, Vetta, and noncanonical SWE-bench labels fail closed.
- The S7 early check and the TypeScript validator agree.
- No provider request is made by the policy tests.

The source validator, S7 early check, documentation, full test suite,
typecheck, lint, shell syntax, and diff checks now satisfy these conditions.
