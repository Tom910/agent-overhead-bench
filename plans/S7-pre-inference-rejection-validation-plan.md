# S7 — Known rejection validation implementation plan

Status: Implemented and independently reviewed (2026-09-10).

**Goal:** Apply the reviewed S1/S5 rejection distinction consistently at native
outcome and campaign validation gates.

**Architecture:** Consume `isPreInferenceRejection` from contracts; require
matching requested model and finite timing on every attempt. Known rejections
contribute no inference tokens while remaining failed intervals. Require at
least one fully successful response with complete identity and usage. Preserve
all other provenance, verifier, price, state and archive checks.

**Spec:** [S5 accounting](./S5-pre-inference-rejection-accounting-plan.md).
**Tech stack:** Existing strict TypeScript and offline Vitest; no dependencies.

## Task 1: Validate recovered known rejection without admitting unknown failures

Files: `packages/contracts/src/native-task-failure.ts`,
`packages/report/src/campaign-validation.ts`,
`packages/report/src/campaign-validation.test.ts`.

- [x] Add failing fixtures for successful and completed native task-failure
  validation containing one known rejection plus a successful DeepSeek response.
  Use a temporary offline price book with the fixture's original token rates.
- [x] Verify the positive fixture fails before changes; ordinary HTTP 520,
  absent success, incorrect requested model and changed rejection detail fail.
- [x] Check identity/timing before allowing the shared rejection predicate to
  skip successful-usage checks. Count successful responses separately and require
  at least one before accepting either native failure or campaign validation.
- [x] Verify original C1 bytes, failed interval accounting and C4 spend remain
  intact after validation and sanitized archive copying. The diagnostic sidecar
  remains private and is not required to interpret the C1 classification.
- [x] Run report/runner/contracts suites, workspace typecheck and lint. Request
  an independent bounded review before using the campaign gate.

## Boundaries

No raw artifact rewrites, metric/schema changes, new retry policy, provider
fallback, verifier relaxation or permission changes. S3 calibration already
counts successful responses without requiring every attempt to succeed and
therefore needs no behavior change for this classification.

## Verification

Positive fixtures failed at the old gate (2/42); all 42 campaign tests passed
after implementation and also passed in independent review. No actionable
review findings remain. The normal full `npm test` passed 702 tests with two
existing opt-in Docker skips. Workspace typechecking and lint passed.

An earlier combined root-level Vitest invocation used the wrong working
directory for six existing Activity fixtures and hit one timing-sensitive
Docker log test. The normal repository command passed all of these unchanged.
