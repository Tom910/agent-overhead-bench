# S5 — Bind prepared DeepSWE agent images to the source manifest

**Status (2026-08-28):** implemented and verified.

## Goal

Make the reviewed DeepSWE source manifest bind the exact per-tool composite
agent images used by a prepared task. S7 provenance validation must reject a
materialized `environment.json` whose image or digest differs from the source
manifest, even when the local task checksum is recomputed after the change.

## Scope

- Preserve optional per-tool `agent_images` identities in DeepSWE manifest
  entries.
- Emit those identities from the calibration preparer after composite images
  are built.
- Compare the materialized task environment with its bound DeepSWE entry during
  selected-task validation.
- Add focused tests for acceptance and image/digest drift.

No C1–C4 timing field or derivation rule changes; no new dependency.

## Acceptance

- A prepared DeepSWE task with matching per-tool image identities passes source
  binding validation.
- Changing an `environment.json` image or digest fails closed, even if the
  materialized task checksum is updated.
- Source manifests without an agent-image map remain valid for legacy fixtures;
  a generated calibration manifest records the map whenever tools were built.
- Focused tests, strict typecheck, full tests, lint, and shell checks pass.

## Out of scope

Selecting tasks, changing the short-regime timeout, running paid calibration,
or approving the source review flags.

## Human review

The maintainer still reviews the final selected image identities as part of the
DeepSWE source and S7 provenance review.

## Verification record

The focused source-manifest test observed the intended pre-implementation
failure for an `agent_images` field, then passed after implementation. The full
workspace tests (221 tests), strict typechecks, lint, shell syntax checks, and
Docker/entrypoint no-spend checks also pass. This closes the provenance gap; it
does not approve the DeepSWE source or make the timeout diagnostics calibration
evidence.
