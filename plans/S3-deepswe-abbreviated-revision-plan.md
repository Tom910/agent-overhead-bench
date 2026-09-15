# S3 — Resolve abbreviated DeepSWE upstream revisions

**Status (2026-08-28):** implemented and verified.

## Goal

Accept DeepSWE task metadata that uses a valid abbreviated Git commit, resolve it
against the freshly cloned upstream repository, and record the resulting full
40-character commit in every prepared task manifest and Docker build argument.

## Scope

- Accept Git commit abbreviations of 7–40 hexadecimal characters at input.
- Resolve the abbreviation after checkout and fail closed if the object is not
  available or is ambiguous.
- Pass the resolved revision to the environment image and native verifier.
- Keep the generated DeepSWE source manifest compatible with the full-revision
  provenance contract.

## Acceptance

- A valid abbreviated source pin is resolved before checkout.
- Generated `upstream_revision` values remain full commit SHAs.
- Focused task-source tests and shell syntax pass.

## Out of scope

Changing source metadata, adding remote APIs, weakening provenance validation, or
approving a task for S7.

## Human review

The maintainer must still review the upstream repository, task semantics, and
license before any resolved task enters the official subset.
