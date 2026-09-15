# S3 Source-Manifest Binding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bind every prepared Git task to the exact reviewed source-manifest entry and make official preflight verify that binding against the original manifest.

**Architecture:** A Git preparation records a semantic SHA-256 of the validated source manifest plus the original task path, source task ID, and source-tree checksum in the local manifest. The local manifest remains sufficient for ordinary local validation, while official preflight additionally receives the original Git manifest and compares the selected entries before any run. No task files, verifier behavior, timing fields, or measurement calculations change.

**Tech Stack:** TypeScript strict, Node.js `crypto`/filesystem APIs, Vitest, shell preflight scripts, JSON Schema.

**Spec:** `plans/S3-tasks-plan.md`, `plans/S3-task-source-hardening-plan.md`, and the S3/C2/S7 sections of `/Users/tom910/dev/visa-case/agent-overhead-benchmark-implementation-roadmap.md`.

## Global Constraints

- Implement only the S3 provenance boundary; do not invent a second measurement model.
- No new npm dependency; use existing Node.js APIs and Vitest.
- Keep the source-owned verifier authoritative and keep private reference material out of the agent workspace.
- Preserve local-development fixtures without forcing them to claim public Git provenance.
- Use typed `ConfigError` failures and reject malformed or mismatched manifests before execution.
- CI and tests must not use API keys, network access, or model tokens.

## Files and interfaces

- Modify `packages/tasks/src/source.ts` to add `source_manifest_sha256`, per-task `source_binding`, semantic manifest hashing, and optional original-manifest comparison.
- Modify `packages/tasks/manifest.schema.json` to describe the new binding fields.
- Modify `packages/tasks/src/source.test.ts` with mutation and original-manifest comparison tests.
- Modify `scripts/s7-preflight.sh` to require an original source manifest for official validation and pass it to the TypeScript boundary.
- Modify `scripts/run-all.sh` and `README.md` to document/pass `AOB_SOURCE_MANIFEST`.
- Modify `plans/README.md` to index this plan.

## Tasks

### Task 1: Prove original-manifest binding with failing tests

**Files:** `packages/tasks/src/source.test.ts`

- [x] Add a test that prepares a Git task-pack fixture and asserts the local manifest contains a non-empty `source_manifest_sha256` and a binding with the original task path, source task ID, and source checksum.
- [x] Add a test that mutates the binding path, source task ID, or source checksum and asserts `validateLocalTaskManifest` rejects it with `ConfigError`.
- [x] Add a test that passes the original Git manifest to selected-manifest validation, then mutates the original manifest entry checksum or revision and asserts the comparison rejects it.
- [x] Run `npm test --workspace=@aob/tasks -- source.test.ts`; the new assertions failed before implementation and pass after implementation.

### Task 2: Implement semantic source-manifest and per-task bindings

**Files:** `packages/tasks/src/source.ts`, `packages/tasks/manifest.schema.json`

- [x] Define `SourceTaskBinding` as `{ path: string; source_task_id: string; source_checksum: string }` and add it to each local-manifest task entry when the source provenance is Git-backed.
- [x] Define `sourceManifestSha256(manifest)` using a recursive key-sorted JSON representation and SHA-256; return the existing `sha256:<64 hex>` format.
- [x] Require and validate `source_manifest_sha256` for Git-backed `source_provenance`; require and validate `source_binding` for each Git-backed local task entry.
- [x] During `prepareGitTaskPack` and `prepareGitTasks`, copy the corresponding validated original manifest entry into each prepared local entry without changing the materialized checksum.
- [x] During local-manifest validation, verify each binding agrees with the C2 source repository, revision, task ID, and local source provenance; retain the existing prepared-tree checksum check.
- [x] Add an optional `sourceManifest` parameter to `validateSelectedLocalTaskManifest`. When supplied, validate it as the matching Git manifest, compare semantic manifest hash, repository, revision, license notes, selected task path, source task ID, and original source checksum for every selected task.
- [x] Update the JSON schema with the required fields and `sha256:` patterns while keeping unprovenanced local fixtures valid.

### Task 3: Wire the original manifest through official preflight

**Files:** `scripts/s7-preflight.sh`, `scripts/run-all.sh`, `README.md`

- [x] Add the eighth preflight argument/environment variable `AOB_SOURCE_MANIFEST` and fail closed when it is absent for official runs.
- [x] Read the original JSON manifest and call `validateSelectedLocalTaskManifest(sourceRoot, localManifest, selectedIds, originalManifest)`; retain the existing review, composition, verifier-image, calibration, and pricing checks.
- [x] Pass `AOB_SOURCE_MANIFEST` from `run-all.sh` and document it beside `AOB_TASK_MANIFEST` in the guarded launcher instructions.
- [x] Add a no-key shell fixture assertion that omitting the original manifest fails before any provider execution.

### Task 4: Verify and record the stage

**Files:** `plans/README.md`, this plan

- [x] Run the focused task-source tests and typecheck.
- [x] Run the complete workspace tests, strict typechecks, lint, shell syntax, and `git diff --check`.
- [x] Run the no-spend dry-run/archive checks and verify the official preflight still rejects the explicitly non-approved source.
- [x] Mark this plan complete only after all checks pass and commit the implementation.

## Out of scope

- Selecting or approving an external task source.
- Fabricating review, calibration, reference results, or maintainer sign-off.
- Copying held-out tests or reference solutions into the repository.
- Changing C1/C3/C4 timing, usage, cost, or report derivation semantics.

**Status (2026-08-27):** Implemented and verified. Official source approval remains an external gate.
