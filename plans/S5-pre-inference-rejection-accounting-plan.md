# S5 — Pre-inference rejection accounting implementation plan

Status: Implemented and independently reviewed (2026-09-10).

**Goal:** Preserve complete run accounting when DeepSeek rejects the observed
unsupported JSON-schema title request before inference.

**Architecture:** Consume S1's narrowly proven rejection via a shared C1
predicate. Keep the failed C1 event and null usage intact; price successful
inference with the existing pinned rates. Ambiguous upstream errors remain
unknown spend. No change to verifier eligibility or raw C4 shape.

**Tech stack:** Existing strict TypeScript, Node and Vitest; no dependencies.

**Spec:** [S1 upstream evidence](./S1-upstream-rejection-evidence-plan.md).

## Constraints

- Execute this S5 follow-up locally, one stage at a time.
- No derived metrics in run.json, hidden retries, parameter changes or historical
  artifact rewrites. All tests use local upstreams and spend no provider tokens.
- A rejected-only cell remains adapter_error, regardless of its known zero
  inference estimate. Unknown/default pricing cannot price successful requests.
- Reporting/campaign acceptance is a separate S7 follow-up.

## Task 1: Shared rejection predicate and existing spend estimator

Files: `packages/contracts/src/c1.ts`, `packages/contracts/src/index.ts`,
`packages/proxy/src/upstream-evidence.ts`, `packages/proxy/src/proxy.ts`,
`packages/runner/src/budget.ts`,
`packages/runner/src/pre-inference-rejection.test.ts`.

- [x] Add failing offline tests: rejection plus successful usage estimates the
  same $0.02 as the successful request alone; HTTP 520, wrong kind/detail/model,
  observed usage/served identity, wrong protocol, or attempted lookup stay null.
- [x] Add `isPreInferenceRejection(event: C1Event): boolean` and move the fixed
  detail constant to contracts. Require POST Messages, exact known path/model,
  status 400, non-streamed, null usage/served model, unavailable usage source,
  not_attempted lookup and the exact S1 kind/detail.
- [x] Exclude only that predicate from the ambiguous failure test:
  `!isSuccessfulModelEvent(event) && !isPreInferenceRejection(event)`.
  Keep successful-event filtering and the existing pricing calculation intact.
- [x] Exercise the actual host runner/proxy/verifier with a mocked external
  network boundary: known rejection + success yields completed C4 and numeric
  estimate; rejected-only yields adapter_error; 520 + success remains null.
- [x] Run focused tests, proxy/contracts/runner suites, workspace typecheck and
  diff check; obtain an independent bounded review before paid diagnostics.

## Results

331 proxy/contracts/runner tests passed; workspace typecheck and diff check
passed. Independent bounded review found no actionable issues and reran all
15 new tests successfully. The initial test run failed three expected numeric
accounting assertions before implementation.
