# S4 tool timing qualification implementation plan

> For agentic workers: use subagent-driven-development and verification-before-completion.

**Goal:** Make timing coverage and qualification explicit before attributing residual time to a harness.

**Architecture:** An offline qualification command runs known-duration event scenarios through the production native-event parsers and compares observed intervals with independently recorded expected intervals. A strict qualification result binds adapter/parser identity, scenario and coverage. This supplements C1–C4; it does not replace their timing model or upgrade historical visibility.

**Tech stack:** Existing Node/TypeScript/child-process/Vitest, no dependencies or provider calls.

**Spec:** Audit package 4. Native tool completeness is still unknown until the corresponding actual CLI is qualified.

## Global constraints

No generation. Timestamp receipt is not silently relabeled execution. Mock emitter/parser qualification is explicitly different from native CLI qualification. Missing/zero-duration/buffered events, unobserved child sessions and incomplete interval coverage cannot qualify full visibility. No derived fields in run.json.

## Review focus

Monotonic clocks, independently expected intervals, overlap, complete scenario membership, lost/split/buffered events, explicit instrumentation boundary and observer overhead.

### Task 1: Executable timing qualification

**Files:** `packages/adapters/src/timing-qualification.ts` and tests; existing parser tests/helpers only as needed; `scripts/s4-qualify-timing.mjs`; qualification documentation.

- [ ] Test known serial and parallel intervals, split JSON, buffered same-tick events, missing child events, duplicate samples and reversed clocks. Expected intervals must come from a separate trace rather than repeating the parser's calculations.
- [ ] Implement typed qualification with explicit duration/alignment error and coverage counts; missing evidence yields unqualified. Reuse production parsers. The mock command must use no upstream/API credentials and bound process lifetime.
- [ ] Run actual controlled emitters with monotonic start/end timestamps; save a small public allowlisted report of counts/error/timing provenance, excluding command bodies.
- [ ] Keep all current campaign attempts partial. State which real native CLI qualifications remain unavailable rather than certifying them from mocks.
- [ ] Run adapter tests/typecheck; commit and report.
