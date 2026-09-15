# S7 Release Source-Binding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for the regression tests before changing the implementation.

**Goal:** Make calibration attestation and official archive verification safe for real Docker result trees and independently bind archived task provenance to the declared source-manifest digest.

**Architecture:** Evidence discovery will ignore private `workspace/` directories, while continuing to reject symlinks everywhere in the evidence tree. Official archive verification will recompute the task-manifest source binding from the archived source manifest and compare it with the archived task manifest before accepting the release.

**Tech Stack:** Node.js ESM scripts, shell release guards, Node test runner, SHA-256 digests.

**Spec:** `/Users/tom910/dev/visa-case/agent-overhead-benchmark-implementation-roadmap.md` S7 and the C2 provenance requirements.

## Global Constraints

- Do not change C1–C4 measurement equations or add derived fields to `run.json`.
- Do not read or publish prompts, solutions, credentials, or private workspace contents.
- Do not weaken official source, calibration, activity, or archive gates.
- No new dependency and no provider spend in tests.

## Tasks

### Task 1: Attestation workspace boundary

**Files:**
- Modify: `scripts/s3-calibration-attestation.mjs`
- Test: `scripts/s3-calibration-attestation.test.mjs`

- [x] Add a real-result-tree regression containing a dependency symlink below `workspace/` and assert attestation succeeds.
- [x] Run the focused attestation test and confirm it fails because the scanner traverses `workspace/`.
- [x] Skip private `workspace/` directories during attestation evidence discovery, preserving rejection for symlinks in evidence paths.
- [x] Run the focused attestation test and the existing calibration-summary tests.

### Task 2: Archived source-manifest binding

**Files:**
- Modify: `scripts/s7-verify-archive.sh`
- Test: `scripts/s7-official-activity-freeze.test.mjs`

- [x] Add an official-archive mutation case that changes the archived source manifest while leaving declared digests unchanged and assert verification fails.
- [x] Run the focused archive test and confirm the mutation currently passes or reaches the missing binding check.
- [x] Recompute the archived task-manifest source binding from the archived source manifest and reject mismatched `source_manifest_sha256` values before accepting the archive.
- [x] Run the focused archive test and the complete no-spend suite.

### Task 3: Verification and handoff

- [x] Run `npm test`, `npm run typecheck`, `npm run lint --silent`, `sh -n scripts/*.sh images/*.sh`, and `git diff --check`.
- [x] Update `plans/README.md` with the implemented plan status; final commit is reported in the handoff.
- [x] Commit the isolated S7 source-binding hardening change.

## Out of Scope

- Choosing a model or changing the six-tool official scope.
- Approving DeepSWE calibration or source review.
- Running provider-backed cells.
