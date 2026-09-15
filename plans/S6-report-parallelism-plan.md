# S6 — Publish parallelism in report tables

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task.

**Goal:** Publish the already-derived parallelism factor so the report exposes the S6 metric defined as `Σ request durations ÷ union duration`.

**Contracts consumed:** C1 event request intervals and the existing internal `DerivedRun.parallelism` value.

**Contracts produced:** README/headline and per-task report columns only. No derived metric is added to `run.json`, and no timing equation changes.

**Acceptance tests, written before implementation:**

- A report-rendering test requires a `Parallelism` column and a representative `1.62` value for the worked overlap fixture.
- The existing mixed-visibility test continues to require a blank harness share for partial/none rows.
- The checked-in golden fixture and README table header include the new column.

**Implementation tasks:**

- [x] Add the failing renderer assertions and observe the expected failure.
- [x] Add headline and per-task parallelism cells with an unavailable marker when timing is unavailable.
- [x] Update the README and golden report fixture.
- [x] Run report tests, full no-spend verification, typecheck, lint, shell syntax, and diff checks.
- [x] Obtain an independent GPT Sol review. It confirmed the union-based parallelism implementation and found a malformed 16-column Markdown delimiter, which was fixed with a structural regression assertion and corrected README/golden/renderer fixtures.

**Implementation status:** Complete and ready for the next release-evidence stage. The separate default-condition and TTFT decisions remain outside this narrow report correction.

**Human review point:** S6 derivation review must confirm that the displayed value is the existing union-based factor, not a sum-based replacement or a new measurement model.

**Out of scope:** TTFT distribution design, full tool visibility promotion, default-condition evidence, task approval, paid runs, and changing C1–C4.
