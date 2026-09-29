# S7 controlled evidence admission implementation plan

> For agentic workers: use subagent-driven-development and verification-before-completion.

**Goal:** Carry policy, schedule, task-assurance and condition evidence from collection through a portable validated release.

**Architecture:** Extend existing ledger, preflight and freeze gates for an explicit future controlled protocol. Validate private source bindings first; publish only allowlisted condition projections rebound to portable C1/C4 bytes. Preserve exact images in a private content-addressed archive using no-pull Docker export.

**Tech stack:** Existing TypeScript/Node/shell/Docker; no dependencies.

**Spec:** September 22 audit package 3, S5 controlled policy and S3 validity gate.

## Global constraints

No model calls, credential material in CI/public output, relaxed historical gates or invented observations. Open/interrupted ledger segments require an explicit disposition; they cannot silently qualify. Model defaults and provider cache stay unknown. Source lineage/review/calibration remain independently required. Private candidate patches and upstream bodies are never public artifacts.

## Review focus

Policy and schedule identity across clean continuations; one host; actual chronological first-attempt order; retained retries; sanitizer allowlists and hash rebinding; malformed/missing evidence rejection; archive image hashes and missing image behavior.

### Task 1: Controlled campaign admission and continuation

**Files:** `packages/runner/src/window-ledger.ts` and tests; `scripts/run-all.sh`, `s7-preflight.sh`, `s7-freeze.sh`, `s7-verify-archive.sh`; shared offline validation module/tests where appropriate.

- [ ] Write failing official-style fixture tests for two clean segments, wrong host/seed/policy/order, missing observations, invalid task assurance, interruption and overlapping attempts.
- [ ] Admit the new explicit protocol through existing entrypoints. Require policy/schedule sidecars and qualified task validity evidence for new controlled campaigns before model admission; no change to historical approval meaning.
- [ ] Reconcile actual chronological first attempts with the saved schedule and separately account for retry ownership. Require all started attempts and spend in existing ledgers. Preserve budget-paused resume without reshuffle.
- [ ] Run relevant runner and script tests/typechecks; commit and report.

### Task 2: Portable condition projections and private image retention

**Files:** `packages/report/src/freeze.ts` and tests; strict condition projection helper; private image archive command and tests under `scripts/`.

- [ ] Write failing tests for lost retry/replacement conditions, stale original bindings, unsafe strings, invalid private records and portable hash mismatch.
- [ ] Validate exact source C1/C4 bindings, then export allowlisted request settings/execution/policy metadata with new portable hashes and source linkage. Missing legacy evidence remains explicitly absent. Apply the same logic to selected, retry and replacement cells.
- [ ] Provide a bounded no-pull command to save each required image identity into a private archive, hash exported bytes and verify later retrieval. Reject missing images, symlinks and conflicting existing content. Do not claim image-byte retention from a digest alone.
- [ ] Validate archive fixtures offline and one small existing Linux image if practical; never bulk-export existing large images without a disk-space estimate. Run freeze/report/script checks, commit and report.
