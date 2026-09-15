# S6 API-turn accounting correction

> **Status:** Implemented and verified 2026-08-31.

**Goal:** Make the report’s `Turns` field match the design’s API-round-trip definition when a provider request fails and the CLI retries.

**Decision:** Count every identifiable model request attempt in `turns`, including non-2xx and aborted attempts. Keep token, cache, cost, and token-floor aggregates successful-only because failed responses do not provide trustworthy billable usage.

**Files:** `packages/report/src/from-results.ts`, `packages/report/src/from-results.test.ts`.

**Verification:** The regression fixture contains a failed 429 request followed by a successful request. It now renders `2` turns with successful-only `10/2` usage and zero-cost fixture accounting. Report tests and the full no-spend suite pass.

**Out of scope:** Changing C1 timing, provider billing reconciliation, or adding derived fields to `run.json`.
