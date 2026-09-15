# S6 — Default-condition report pricing boundary

**Goal:** Keep reports usable when a default-condition run records the required
empty `run.model` and therefore has no pinned price-book rate.

**Constraints:** Never guess a default model price; preserve `null` cost/floor
when measured usage exists without a matching price; allow zero-cost fixtures
with no measured requests; do not change `run.json` or derivation semantics.

## Tasks

- [x] Return zero cost/floor for empty-model cells with no measured requests.
- [x] Return unavailable (`null`) cost/floor for empty-model cells with measured
  requests rather than looking up a fabricated rate.
- [x] Add a report regression for default-model cells and preserve pinned pricing.
- [x] Run report and full workspace verification.

**Status (2026-08-27):** Implemented and verified. Default-condition official
execution remains separately gated until native/default behavior is evidenced.
