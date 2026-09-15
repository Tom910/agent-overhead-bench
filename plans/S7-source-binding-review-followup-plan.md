# S7 Source-Binding Review Follow-up Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for regression tests before implementation changes.

**Goal:** Close the two findings from the final independent review of the S7 source-binding hardening.

**Scope:** Preserve symlink rejection for all evidence paths, allow only real `workspace/` directories to be excluded, and make official archive verification cross-check both source-binding declarations against a stable canonical source-content digest. Review metadata is excluded from that digest because source review records the attestation file digest and would otherwise create a cyclic commitment.

## Tasks

- [x] Add direct regressions for a symlink named `workspace` in attestation and summary result trees; confirm they fail before implementation.
- [x] Restrict the workspace exclusion to actual directories in both scanners and make the regressions pass.
- [x] Add an official archive mutation regression that changes the source manifest and updates both task-manifest and portable archive bindings while leaving calibration attestation unchanged; confirm verification fails before implementation.
- [x] Require the archived calibration attestation `source_manifest_sha256` to equal the stable canonical source-content digest, then make the mutation regression pass.
- [x] Run focused and complete no-spend verification, update the handoff/index, and commit.

## Constraints

- No provider spend, Docker cells, new dependencies, or measurement-model changes.
- Do not read or publish private workspace contents.
