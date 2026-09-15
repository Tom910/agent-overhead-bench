# S6 model-endpoint eligibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure S6 measures only successful POST events whose recorded path and protocol identify the same supported model endpoint.

**Architecture:** Keep the existing C1 event shape and protocol values. Add one
contract-level path matcher for the three supported endpoint dialects and make
both request-attempt and successful-event classification require that match,
while preserving the existing HTTP status and error checks.

**Tech Stack:** TypeScript strict, Vitest, existing C1 contract; no new dependencies.

**Spec:** `/Users/tom910/dev/visa-case/agent-overhead-benchmark-design.md`,
`/Users/tom910/dev/visa-case/agent-overhead-benchmark-implementation-roadmap.md`,
and `plans/S6-measurement-integrity-plan.md`.

## Global Constraints

- No derived metrics in `run.json`.
- Keep monotonic timing and all C1–C4 field names unchanged.
- Exclude metadata, unknown paths, failed HTTP events, and protocol/path mismatches.
- Do not infer a model name or usage from a path; `model_requested: null` remains valid timing evidence for an eligible endpoint.
- No new npm dependency; CI and tests remain zero-spend.

### Task 1: Add failing path/protocol classification tests

**Files:**
- Modify: `packages/contracts/src/validate.test.ts`

**Interfaces:**
- Consumes: `isModelRequestAttempt` and `isSuccessfulModelEvent`.
- Produces: regression coverage for all supported endpoint families, query
  strings, and mismatched/unknown paths.

- [x] **Step 1: Add the failing tests**

  Pass `path` to the existing classifier tests. Assert that `/v1/messages`,
  `/chat/completions`, and `/v1/responses` match their protocols, that query
  strings do not change eligibility, and that a known protocol paired with a
  metadata or unrelated path is rejected. Keep the existing status/error
  assertions.

- [x] **Step 2: Run the focused test and verify RED**

  ```sh
  npm run test --workspace=@aob/contracts -- src/validate.test.ts
  ```

  Expected: the mismatched-path assertion fails because the current classifier
  checks only method and protocol.

### Task 2: Implement path-aware eligibility

**Files:**
- Modify: `packages/contracts/src/c1.ts`
- Modify: `packages/contracts/src/validate.test.ts`

**Interfaces:**
- Consumes: `C1Event.path` and `C1Event.protocol`.
- Produces: `isModelRequestAttempt(event: Pick<C1Event, "method" | "path" | "protocol">)`
  and `isSuccessfulModelEvent(event: Pick<C1Event, "method" | "path" | "protocol" | "status" | "error">)`.

- [x] **Step 1: Add the supported path matcher**

  Normalize only the query suffix, then match the same endpoint families used
  by the proxy: Anthropic `/v1/messages` or a path ending in `/messages`, OpenAI
  Chat paths containing `/chat/completions`, and Responses paths containing
  `/responses`. Unknown protocol remains ineligible.

- [x] **Step 2: Require protocol/path agreement in both classifiers**

  Make `isModelRequestAttempt` require POST, a known protocol, and the path
  matcher. Keep `isSuccessfulModelEvent` as that predicate plus a 2xx status and
  null error. Do not inspect `model_requested`, usage, or response body here.

- [x] **Step 3: Run focused tests and typecheck**

  ```sh
  npm run test --workspace=@aob/contracts -- src/validate.test.ts
  npm run typecheck --workspace=@aob/contracts
  ```

  Expected: all classifier and contract tests pass, including the existing
  `model_requested: null` timing fixture behavior.

### Task 3: Record and verify the completed stage

**Files:**
- Modify: `plans/README.md`
- Modify: `plans/S6-measurement-integrity-plan.md`
- Modify: `plans/S6-model-endpoint-eligibility-plan.md`

**Interfaces:**
- Consumes: path-aware C1 classifiers.
- Produces: an auditable S6 completion record without approving S7.

- [x] **Step 1: Update stage records**

  Mark the plan complete, document the endpoint families and mismatch behavior,
  and state that S3 review/calibration and S7 launch gates remain open.

- [x] **Step 2: Run the full no-spend gate**

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
  git add --sparse packages/contracts/src/c1.ts packages/contracts/src/validate.test.ts \
    plans/README.md plans/S6-measurement-integrity-plan.md \
    plans/S6-model-endpoint-eligibility-plan.md
  git commit -m "fix: require C1 model path protocol agreement"
  ```

## Verification gate

This plan is complete only when supported path/protocol pairs are accepted,
mismatches and unknown paths are excluded, the full no-spend gate passes, and
the stage is committed. It does not change C1–C4 fields or authorize S7.

## Out of scope

Changing proxy routing, usage extraction, model selection, task calibration,
tool visibility, clocks, or report derivation formulas.

## Human review

Review that the path patterns exactly match the proxy’s protocol detector and
that query-string normalization cannot broaden eligibility beyond those paths.

**Implementation status (2026-08-28):** Tasks 1–3 are complete. The focused
test failed before implementation on a known protocol paired with
`/v1/messages`, then passed after the classifier required path/protocol
agreement. An independent review also found overlapping path precedence; the
classifier now mirrors the proxy's first-match ordering and the overlap tests
pass. The full no-spend gate passed and the isolated stage is ready to commit.
