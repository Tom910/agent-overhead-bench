# S3 Contract Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the current C1–C4 working contract explicit and auditable while deferring the final release freeze until the implementation, official run, and launch artifacts are complete.

**Architecture:** The existing TypeScript types, runtime validators, JSON Schemas, fixtures, and producer/consumer tests remain the single working contract surface. Governance records describe the current shape, but do not block necessary pre-release contract changes or promise backward compatibility.

**Tech Stack:** TypeScript strict, JSON Schema draft-07, Vitest, Markdown/YAML-style decision records; no new dependency.

**Spec:** `/Users/tom910/dev/visa-case/agent-overhead-benchmark-design.md` §2, §3; `/Users/tom910/dev/visa-case/agent-overhead-benchmark-implementation-roadmap.md` §2 and §4.2; `plans/README.md`.

## Global Constraints

- `packages/contracts` remains the single source of truth for C1–C4.
- No derived metrics enter `run.json`; no C1–C4 field names or semantics change.
- Contract changes remain allowed before final release; the final release record will capture the frozen shape and version.
- Source review, calibration, maintainer sign-off, and paid S7 execution remain separate gates.
- Tests and verification never hold API keys or spend provider tokens.

## Task 1: Audit the v1 contract surface

**Files:**
- Read: `packages/contracts/src/{c1,c2,c3,c4,validate}.ts`
- Read: `packages/contracts/schemas/*.json`
- Read: `packages/contracts/fixtures/*`
- Read: `packages/contracts/src/validate.test.ts`

**Interfaces:**
- Consumes: current runtime validators, schemas, fixtures, and tests.
- Produces: a checked list confirming all raw fields are represented and the
  existing schema/runtime parity tests cover the final C4 provenance fields.

- [x] **Step 1: Confirm no unfinished contract amendment exists**

  Verify that the only post-spike additions are raw provenance/capability fields
  already present in both runtime and schema validation: C4 `tool_visibility`,
  `task_environment.agent_image`, and `task_environment.agent_image_digest`.

- [x] **Step 2: Run the contract gate before governance edits**

  Run `npm test --workspace @aob/contracts` and
  `npm run typecheck --workspace @aob/contracts`. Both must pass before the
  governance record is changed.

## Task 2: Record development governance without changing the contract

**Files:**
- Modify: `packages/contracts/CHANGELOG.md`
- Modify: `plans/s2-decision-record.md`
- Modify: `plans/README.md`

**Interfaces:**
- Consumes: the audited v1 C1–C4 surface from Task 1.
- Produces: a dated development record stating that the final freeze is deferred
  until release, while explicitly leaving DeepSWE/S7 approval pending.

- [x] **Step 1: Record the unreleased working heading**

  Record the current raw provenance additions under an unreleased development
  heading, state that no derived metrics are part of the contract, and defer the
  final version/freeze until release. Do not claim that the task source or
  official results are approved.

- [x] **Step 2: Align the S2 decision record**

  Replace `contract_amendments: none — not frozen` with a precise statement that
  the final raw C4 provenance fields are included in the current working
  contract and that pre-release changes remain allowed. Keep model, source, and
  default-condition decisions unchanged.

- [x] **Step 3: Update the stage index**

  Add this plan to `plans/README.md` as implemented, without changing the
  still-open S3 review/calibration or S7 launch statuses.

## Task 3: Verify and commit the governance stage

**Files:**
- Verify: the files from Tasks 1–2 and the existing contract fixtures.

**Interfaces:**
- Consumes: the development governance records and unchanged contract implementation.
- Produces: an auditable, committed contract-governance checkpoint.

- [x] **Step 1: Run the full no-spend gate**

  Run `npm test --workspaces --if-present`, `npm run typecheck`,
  `npm run lint`, `sh -n scripts/*.sh images/*.sh`, and `git diff --check`.

- [x] **Step 2: Check the freeze boundary**

  Confirm the working tree has no result/API-key changes, all contract tests are
  green, and the decision record still lists the DeepSWE review flags as pending.

- [x] **Step 3: Commit the isolated stage**

  Commit the governance-only changes with
  `docs: defer contract freeze until release`.

## Acceptance

- Runtime validators, JSON Schemas, fixtures, and tests remain unchanged by the
  governance edit and pass their existing parity checks.
- `CHANGELOG.md` identifies the unreleased raw working contract and states that
  its final version/freeze is deferred until release.
- S2 records the current contract without marking source review, calibration,
  default behavior, or S7 complete.
- Full workspace no-spend verification passes and the stage is committed.

## Out of scope

Changing C1–C4 fields or derivation, adding a schema library, approving DeepSWE,
running paid calibration or the official matrix, enabling default conditions,
promoting Codex visibility, or publishing v1.

## Human review

The maintainer should confirm that the governance record covers only raw
contract fields, that the final release will receive an explicit version/freeze,
and that the pending source and run gates are not accidentally represented as
contract approval.

**Status (2026-08-29):** Implemented and verified as development governance.
The working contract remains unfrozen until the complete implementation and
release artifacts exist. DeepSWE source approval and official S7/S8 gates remain
open.
