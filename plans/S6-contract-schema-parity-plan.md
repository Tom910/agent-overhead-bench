# S6 C4 contract-schema parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the checked-in C4 JSON Schema accept exactly the prepared-image provenance that runtime C4 validation and Docker cells already emit.

**Architecture:** Extend only the `task_environment` schema object with optional paired
`agent_image` and `agent_image_digest` properties. Keep the existing runtime validator
as the semantic authority for the pair invariant and add contract tests that assert the
schema declares the same fields and constraints, including rejection of an unpaired
identity by a schema consumer.

**Tech Stack:** JSON Schema draft-07, TypeScript strict, Vitest, existing contract fixtures; no new dependencies.

**Spec:** `/Users/tom910/dev/visa-case/agent-overhead-benchmark-design.md`,
`/Users/tom910/dev/visa-case/agent-overhead-benchmark-implementation-roadmap.md`,
`plans/S6-measurement-integrity-plan.md`, and `packages/contracts/src/c4.ts`.

## Global Constraints

- No derived metrics in `run.json`.
- Preserve C1–C4 field names and runtime semantics; this is schema parity only.
- TypeScript strict and typed contract errors; no new npm dependency.
- Prepared image identity fields must be supplied together and use immutable digest syntax.
- CI and tests must not hold API keys or spend provider tokens.

### Task 1: Specify the missing schema behavior with failing tests

**Files:**
- Modify: `packages/contracts/src/validate.test.ts`

**Interfaces:**
- Consumes: `c4.run.schema.json` and the existing valid C4 fixture.
- Produces: regression assertions for optional prepared-image identity fields,
  digest validation metadata, and paired-field semantics.

- [x] **Step 1: Add the failing schema-parity assertions**

  Extend the existing C4 schema alignment test to require `agent_image` and
  `agent_image_digest` in `task_environment.properties`, require the digest
  pattern `^sha256:[0-9a-f]{64}$`, and assert the schema contains a conditional
  that rejects exactly one of the two fields. Add a runtime test proving a
  valid pair is accepted and an unpaired field is rejected.

- [x] **Step 2: Run the focused contract test and verify RED**

  Run:

  ```sh
  npm run test --workspace=@aob/contracts -- src/validate.test.ts
  ```

  Expected: the new schema assertions fail because the checked-in C4 schema
  currently declares only `kind` and `network`; the runtime pair test remains
  green and confirms the test is targeting schema parity rather than inventing
  a new runtime contract.

### Task 2: Update the C4 JSON Schema minimally

**Files:**
- Modify: `packages/contracts/schemas/c4.run.schema.json`

**Interfaces:**
- Consumes: the runtime `C4Run.task_environment` shape in `packages/contracts/src/c4.ts`.
- Produces: a draft-07 schema accepting legacy `{kind, network}` and prepared
  `{kind, network, agent_image, agent_image_digest}` forms while rejecting an
  unpaired image identity or malformed immutable digest.

- [x] **Step 1: Add the two optional properties**

  Add `agent_image` as a non-empty string and `agent_image_digest` as a string
  matching `^sha256:[0-9a-f]{64}$` under `task_environment.properties`. Do not
  add them to `required`, preserving compatibility with legacy/local fixtures.

- [x] **Step 2: Add the paired-field conditional**

  Add an `allOf` entry under `task_environment` using `if`/`then`/`else` (or
  equivalent draft-07 `oneOf`) so the object is valid when both optional fields
  are absent or both are present, and invalid when only one is present. Keep
  `additionalProperties: false` and `network: disabled` unchanged.

- [x] **Step 3: Run the focused contract test and verify GREEN**

  Run:

  ```sh
  npm run test --workspace=@aob/contracts -- src/validate.test.ts
  npm run typecheck --workspace=@aob/contracts
  ```

  Expected: all contract tests pass, including legacy and prepared-image C4
  cases, with no runtime dependency or measurement-model change.

### Task 3: Record and verify the completed stage

**Files:**
- Modify: `plans/README.md`
- Modify: `plans/S6-measurement-integrity-plan.md`
- Modify: `plans/S6-contract-schema-parity-plan.md`

**Interfaces:**
- Consumes: the schema and regression tests from Tasks 1–2.
- Produces: an auditable stage record showing the runtime/schema contradiction
  is closed without approving S7.

- [x] **Step 1: Mark the plan and stage index accurately**

  Record the implementation date, changed schema fields, focused test result,
  and the fact that S7 source review/calibration/launch gates remain open.

- [x] **Step 2: Run the repository no-spend verification gate**

  Run:

  ```sh
  npm test
  npm run typecheck
  npm run lint --silent
  sh -n scripts/*.sh images/*.sh
  node --test scripts/command-timeout.test.mjs scripts/runner-entrypoint.test.mjs
  git diff --check
  ```

- [x] **Step 3: Commit the isolated stage**

  ```sh
  git add --sparse packages/contracts/schemas/c4.run.schema.json \
    packages/contracts/src/validate.test.ts plans/README.md \
    plans/S6-measurement-integrity-plan.md plans/S6-contract-schema-parity-plan.md
  git commit -m "fix: align C4 schema with prepared image provenance"
  ```

## Verification gate

This plan is complete only when the focused schema tests demonstrate both legacy
and prepared-image C4 forms, the pair invariant and digest pattern are enforced,
the complete no-spend repository gate passes, and the stage is committed. This
does not make any S3 review flag true or authorize an official S7 run.

## Out of scope

Changing C1 model-event classification, adding tool visibility, changing clock
projection, modifying runner timing, changing task selection, or spending tokens.

## Human review

Review that the schema remains backward-compatible for local fixtures, that the
optional pair exactly matches the runtime C4 type, and that image provenance is
not interpreted as a derived metric.

**Implementation status (2026-08-28):** Tasks 1–3 are complete. The focused
contract test observed the intended RED failure before the schema change, then
passed with the prepared-image pair and legacy fixture after the change. The
full no-spend gate passed and the isolated stage is committed.
