# S5 — Failed-attempt cost completeness implementation plan

**Status:** Implemented and independently reviewed (2026-09-06).

**Goal:** Keep capped execution stopped whenever retained model attempts do not establish complete spend.

**Architecture:** A shared runner spend helper checks all recognized model attempts before applying existing successful-event pricing. An unsuccessful upstream attempt makes spend unavailable, including when usage was partially observed or recovered. Host execution, Docker execution, and interrupted recovery use the same helper.

**Tech stack:** Existing strict TypeScript, C1/C4 contracts, Vitest, local HTTP fixtures. No dependency or schema changes.

## Contract and scope

- A recognized model attempt is `isModelRequestAttempt(event)`; missing model identity does not exempt a recognized endpoint.
- Any such attempt that fails `isSuccessfulModelEvent(event)` makes C4/interrupted spend `null`, except `error.kind === "proxy_refused"`, which proves the harness refused forwarding.
- Apply this guard before default-condition or unavailable-rate fallbacks; failures must not become zero because there were no successful events.
- Metadata requests and local proxy refusals add no billable usage. Successful-only numeric pricing, missing-usage nulls, and request-free zero behavior remain intact.
- Preserve existing attempt timing, successful-event token metrics, and verifier eligibility after CLI recovery; report completeness checks remain unchanged. This tightens completeness of the runner spend estimate; it does not invent failed-request usage or a second measurement model.
- Existing reports reject null C4 spend against a numeric successful subtotal; official campaign validation also rejects incomplete attempts. No S6 changes are needed for this fail-closed fix.
- No provider calls, raw artifact edits, paid retries, new npm dependencies, or derived C4 metrics.

## Implementation and acceptance

Files: `packages/runner/src/budget.ts`, `cell.ts`, `matrix.ts`, and `spend-completeness.test.ts`; index this plan in `plans/README.md`.

- [x] Write offline regression tests and demonstrate RED: successful recovery after HTTP 429/500 still reaches a passing verifier but has null C4 spend; failure-only/no-rates and aborted model attempts cannot become zero.
- [x] Add `estimateRunSpendUsd(events: C1Event[], condition: "pinned" | "default", rates: BudgetRates | undefined): number | null` in `budget.ts`. Return null when `events.some(event => isModelRequestAttempt(event) && !isSuccessfulModelEvent(event) && event.error?.kind !== "proxy_refused")`; otherwise filter successful events and retain existing rates/default pricing.
- [x] Replace duplicated spend expressions in both cell executors and interrupted recovery with that helper.
- [x] Demonstrate GREEN with positive controls for numeric successful spend, unavailable successful usage, request-free/default/no-rate behavior, metadata GETs, and local proxy refusals. Include failed events with recovered usage to prove the guard is conservative.
- [x] Prove capped interrupted resume refuses before execution, repeatedly and without changing retained artifacts; retain existing returned-null C4 preservation/resume tests.
- [x] Run runner tests, workspace typecheck, and diff checks; record evidence and commit for independent review.

Commands: `npm run test --workspace @aob/runner -- src/spend-completeness.test.ts`; `npm run test --workspace @aob/runner`; `npm run typecheck`; `git diff --check` (all executed through the required `rtk` wrapper).

## Verification evidence

- RED: six new offline integration regressions failed against the prior runner. Recovered 429/500 returned 0.02 instead of null; failure-only 500 without rates and aborted requests returned zero; interrupted resume reached the execution callback instead of raising `BudgetExceeded`.
- GREEN: the same six regressions passed with the shared guard. Sixteen accounting controls also passed (22 new tests total).
- Full runner suite: 139 tests passed across 10 files, including host/Docker adapter integration and existing returned-null C4 capped-resume protection.
- Workspace typecheck passed; lint passed (171 JavaScript/shell files); `git diff --check` passed.
- Tests use local HTTP fixtures and synthetic retained events only. No provider calls or retained validation artifact changes.
- Final repository verification: 448 workspace tests and 135 script tests passed. Independent review is clean, including a separate 22-test focused run. The typed fixture-error follow-up also passed those 22 tests.
