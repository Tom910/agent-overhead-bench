# S6 — Publish first-byte latency

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task.

**Goal:** Expose the C1 first-byte timing submetric in generated reports so the timing data required by the design is visible without overstating it as token-level latency.

**Decision:** Derive `first_byte_ms = t_first_byte − t_req_start` for every identifiable model request attempt with a genuinely observed upstream byte, including failed HTTP attempts when a byte exists. Network-failed attempts remain in the model-time interval union, but their synthetic close marker is not treated as a first byte. Report the median across requests for each run and aggregate those run medians using the existing task/repetition median rules. Label the column `First byte (med)` because C1 observes bytes, not semantic tokens.

**Contracts consumed:** C1 request timestamps and existing `DerivedRun` report derivation.

**Contracts produced:** report-only `DerivedRun.first_byte_ms` plus headline/per-task Markdown columns. No C1/C4 schema change, no `run.json` derived field, no timing-equation change.

**Acceptance tests, written before implementation:**

- Derivation returns the median first-byte latency for a pair of requests.
- A generated report renders `First byte (med)` and the expected value.
- Missing first-byte inputs render `—`, and headline Markdown header/delimiter counts remain equal.

**Implementation tasks:**

- [x] Add failing derivation and renderer assertions and observe the expected failure.
- [x] Add the first-byte report derivation and median aggregation.
- [x] Render the metric in headline/per-task tables and update README/golden fixtures.
- [x] Document the byte-level limitation and run focused verification.
- [x] Obtain independent review and record its result here.

Independent review found and this patch fixes three honesty issues: synthetic
network-error byte markers were excluded from the first-byte metric, the README
placeholder row was made rectangular, and report tests now exercise row/header
shape invariants. The reviewer also confirmed the metric remains byte-level and
that clock/parallelism changes are consistent with the existing derivation.

**Human review point:** S6 derivation review must confirm that the metric is byte-level and does not get presented as semantic token latency.

**Out of scope:** Full tool visibility, default-condition evidence, task calibration, and changing C1–C4 schemas.
