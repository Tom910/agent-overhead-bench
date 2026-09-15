# S5 provenance and task-environment plan

Status: implemented; publication gates remain open

## Goal

Make the runner output sufficient to audit both sides of a timed cell and carry
the canonical C2 task environment all the way to execution. The C4 record must
identify the verifier image independently of the agent image. Source adapters
must preserve an authoritative source verifier; they may not synthesize a
generic hidden-test runner for a public task pack.

## Scope

- Add the verifier image digest to the C4 container provenance.
- Carry the C2 environment through `MatrixTask` and `CellSpec`, and record the
  environment kind and network policy in raw C4 metadata.
- Require a task-pack entry to provide a source-owned native verifier
  descriptor. Reject packs that only expose test files and would require a
  generated wrapper.
- Keep the existing local fixture's script verifier for zero-spend tests.

## Acceptance

- Host and Docker C4 runs validate with separate agent/verifier digests and
  task-environment metadata.
- Matrix definition keys include environment metadata, so resume cannot mix
  task environments.
- A task-pack without `verifier.json` is rejected before materialization; a
  source-owned descriptor is copied unchanged and remains outside the agent
  workspace.
- Existing unit, type, lint, shell, and Docker route checks remain green.

## Constraints

- No derived values are added to `run.json`.
- No new npm dependency.
- Verifier execution remains network-isolated (`network: none`).
- This plan does not approve the currently rejected public task candidate or
  waive source review, calibration, or maintainer sign-off.
