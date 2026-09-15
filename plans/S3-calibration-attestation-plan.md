# S3 — Calibration attestation implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Make an approved DeepSWE task selection depend on portable evidence that every selected task has two distinct included CLIs passing under one complete calibration identity.

**Architecture:** Keep `scripts/s3-calibration-summary.mjs` as the sole producer of calibration summaries. Add a no-dependency validator that consumes the summary, selected source manifest, and declared identity, recomputes qualifying passes from retained C4/C1 evidence, and emits a small sanitized attestation containing the qualifying run IDs and SHA-256 digests. S7 preflight validates it before credentials or Docker; freeze copies both the attestation and sanitized summary into provenance; archive verification validates the copied bytes without confusing calibration evidence with the official measurement tree.

**Tech Stack:** Node.js ESM scripts, existing TypeScript source validators, POSIX shell launchers, Node test runner, SHA-256 from `node:crypto`.

**Spec:** `/Users/tom910/dev/visa-case/agent-overhead-benchmark-design.md` and `/Users/tom910/dev/visa-case/agent-overhead-benchmark-implementation-roadmap.md`, S3 calibration and S7 release gates.

## Global Constraints

- Do not change the C1–C4 measurement equations or add derived metrics to `run.json`.
- Calibration evidence must use the complete identity: task, source, repository, revision, regime, model, condition, and price book.
- A pass requires the existing summary's complete C4/C1/source/image evidence and native verifier exit 0.
- The review's declared calibration-adapter set is distinct from the six-tool
  official measurement set; at least two declared calibration CLIs must pass
  every selected task, and mixed identities cannot combine.
- No provider calls, Docker builds, API keys, or new npm dependencies are allowed in tests or CI.
- The attestation run digests commit to pre-freeze calibration evidence; the
  release archive carries the sanitized calibration summary and validates the
  digest/identity/qualifying-run relationship without claiming the sanitized
  official result tree is the calibration source.
- Preserve pending review flags until the maintainer has independently reviewed real evidence.

---

### Task 1: Define and test the attestation contract

**Files:**
- Create: `scripts/s3-calibration-attestation.mjs`
- Create: `scripts/s3-calibration-attestation.test.mjs`
- Modify: `scripts/s3-calibration-summary.mjs`
- Modify: `scripts/s3-calibration-summary.test.mjs`
- Modify: `plans/s3-deepswe-review.json` only if the contract needs a new pending field

**Interfaces:**
- Consumes a generated calibration summary, a source manifest, the declared task source/model/regime/condition/price book, and the included tool set.
- Produces a versioned JSON attestation with source identity, selected IDs, identity, distinct qualifying CLIs per task, and qualifying run IDs plus run-file SHA-256 digests. The summary producer retains each run-file digest without exposing absolute paths.
- Exits nonzero for missing files, stale hashes, missing tasks, one-CLI tasks, duplicate CLIs, mixed identity, failed evidence, or unexpected tools.

- [x] Step 1: Write failing no-spend tests for a valid two-task/two-CLI attestation and each rejection case: missing task, only one passing CLI, duplicate tool, mixed task source/model, wrong source revision, stale run digest, missing run file, and unselected tool.
- [x] Step 2: Run `node --test scripts/s3-calibration-attestation.test.mjs` and confirm the tests fail because the validator is absent.
- [x] Step 3: Implement the minimal validator using the existing summary `records[].passed`, `records[].run_id`, `records[].path`, and complete identity fields, while recomputing the run-file digest and checking the selected source manifest identity.
- [x] Step 4: Run the focused test and confirm all valid/rejection cases pass without network or Docker.
- [x] Step 5: Commit as `feat: add portable calibration attestation`.

### Task 2: Bind the attestation to S7 preflight and source review

**Files:**
- Modify: `scripts/s7-preflight.sh`
- Modify: `scripts/prepare-deepswe-calibration.sh`
- Modify: `packages/tasks/src/source.ts` only for typed review provenance fields if required
- Modify: `packages/tasks/src/source.test.ts`
- Modify: `plans/s3-deepswe-review.json` and its generated manifest path when the schema is frozen

**Interfaces:**
- Preflight receives `AOB_CALIBRATION_ATTESTATION` and validates it before credentials, Docker, or image checks.
- Approved review evidence names the attestation path and digest; pending review evidence remains valid without it.

- [x] Step 1: Add failing preflight/source tests showing `calibration_complete: true` without a valid attestation is rejected, while pending manifests remain accepted by generic validators.
- [x] Step 2: Run the focused tests and confirm the new gate fails for the right reason.
- [x] Step 3: Add the attestation path/digest to the review provenance contract, validate its exact source/selection/identity binding, and invoke the shared validator before credential checks.
- [x] Step 4: Run focused preflight and task-source tests and verify the checked-in pending manifest remains fail-closed.
- [x] Step 5: Commit as `feat: gate calibration approval on attestation`.

### Task 3: Retain and independently verify attestation in official archives

**Files:**
- Modify: `scripts/s7-freeze.sh`
- Modify: `scripts/s7-verify-archive.sh`
- Modify: `scripts/s7-official-activity-freeze.test.mjs`

**Interfaces:**
- Official freeze copies the validated attestation and sanitized calibration summary to `provenance/calibration-attestation.json` and `provenance/calibration-summary.json`, and records their digests in the sanitized manifests.
- Official archive verification rejects a missing, mutated, stale, or identity-inconsistent attestation and never uses the official measurement tree as a substitute for calibration evidence.

- [x] Step 1: Add fixture assertions for archive inclusion and add fail-closed archive validation for missing, mutated, and identity-inconsistent attestations.
- [x] Step 2: Run the official freeze fixture and confirm the assertions fail before implementation.
- [x] Step 3: Copy the exact attestation bytes during freeze and make archive verification validate its digest, selected IDs, identity, and qualifying runs.
- [x] Step 4: Run the focused freeze/archive tests and confirm the new archive validation fails closed for invalid attestation bytes.
- [x] Step 5: Commit as `feat: retain calibration attestation in official archives`.

### Task 4: Review, documentation, and full verification

**Files:**
- Modify: `plans/S3-calibration-attestation-plan.md`
- Modify: `plans/S3-deepswe-calibration-selection-plan.md`
- Modify: `plans/S7-runs-protocol.md`
- Modify: `plans/CURRENT-REVIEW-AND-NEXT.md`
- Modify: `plans/README.md`

- [x] Step 1: Ask an independent subagent to review the contract and implementation for identity confusion, path traversal, and archive portability. Claude Opus reviewed the resumed session; the GPT Sol delegate was unavailable due its provider session limit.
- [x] Step 2: Fix only verified findings with focused tests.
- [x] Step 3: Run `npm test`, `npm run typecheck`, `npm run lint --silent`, `sh -n scripts/*.sh images/*.sh`, and `git diff --check`.
- [x] Step 4: Record that the real DeepSWE calibration still needs maintainer approval and that no official run is authorized by synthetic fixtures.
- [x] Step 5: Commit documentation and verification results.

## Human review

The maintainer must still decide whether the real DeepSWE/Flash calibration
meets the source and regime guardrails. A valid attestation can prove what was
run; it cannot turn a timeout-only diagnostic into a pass.
