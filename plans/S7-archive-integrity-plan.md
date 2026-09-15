# S7 Archive-Integrity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure an official S7 archive contains only a complete, block-randomized, identity-consistent matrix with every detected anomaly reviewed and the review record included in the archive.

**Architecture:** The freezer reuses the report loader’s C1/C4 validation and derives the same unreconciled and 3× outlier conditions used by S6. It checks state order in contiguous tool blocks, validates global and per-tool provenance identities, requires structured dispositions for every anomaly, and copies the supplied review record into the immutable archive.

**Tech Stack:** POSIX shell, Node.js, existing TypeScript report loader, tar/SHA-256, Vitest/integration shell checks.

**Spec:** S7 in `/Users/tom910/dev/visa-case/agent-overhead-benchmark-implementation-roadmap.md`, `plans/S7-runs-protocol.md`, and the S6 outlier rule.

## Global Constraints

- No new npm dependency, network request, API key, or token spend.
- Do not alter C1–C4 fields or S6 equations.
- Official archives remain six pinned adapters, 8–10 tasks, and at least four repetitions.
- A rerun disposition must identify a replacement run in the same matrix cell; an explanation must carry a nonempty written note.
- Archive paths remain regular files/directories with no symlinks, traversal, staged workspaces, prompts, or solution content.

## Files and interfaces

- Modify `scripts/s7-freeze.sh` for anomaly derivation, identity/order gates, review validation, and review packaging.
- Modify `scripts/s7-verify-archive.sh` to accept and verify the packaged review directory.
- Add/update zero-spend freeze integration assertions using the existing dry-run/archive flow.
- Modify `plans/README.md` and this plan.

## Tasks

### Task 1: Add failing archive-gate checks

- [x] Generate a synthetic reduced archive fixture and mutate a completed result into an unreconciled or >3× outlier; assert the freezer refuses it without a review record.
- [x] Mutate a result’s model, task source/revision, price book, or image digest; assert the official freezer refuses the inconsistent archive.
- [x] Supply an anomaly review and assert the resulting tar contains the review JSON; assert a `rerun` entry without a replacement ID is rejected.
- [x] Run the existing no-spend freeze smoke and record the failing assertions before implementation.

### Task 2: Implement S7 anomaly and identity gates

- [x] Load validated cells through `packages/report/src/from-results.ts` and reproduce the fixed unreconciled/outlier rule for the freeze set.
- [x] Require review coverage for every anomaly, require `explained` notes, and require `rerun` replacement IDs that exist, match the same cell identity, are completed, and are not themselves anomalous.
- [x] Require one global model/condition/source/revision/regime/price-book identity and stable tool/version/image/verifier-image identities per tool.
- [x] Check `state.cells` in contiguous blocks of the six official tools, with each block containing one tool for one task, repetition, condition, and source order.
- [x] Copy a validated anomaly review to `review/anomaly-review.json` before computing archive checksums.

### Task 3: Verify the archive contract

- [x] Allow only `review/` and its regular JSON record in `s7-verify-archive.sh` and validate the packaged review file’s JSON shape.
- [x] Run full workspace tests, typechecks, lint, shell syntax, the reduced dry-run, official-freeze rejection, nonofficial override, and archive verification.
- [x] Mark this plan complete only after a clean committed tree passes all gates.

## Out of scope

- Selecting tasks or approving source review.
- Performing the human anomaly review, paid run, provider export cross-check, or publication.
- Creating replacement run artifacts without an actual rerun.

**Status (2026-08-27):** Implemented and verified. Official source approval, paid execution, and maintainer sign-off remain external gates.
