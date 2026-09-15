# S7 documentation consistency implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status (2026-08-29):** implemented and verified.

**Goal:** Keep stage records and operational examples aligned with the implemented DeepSWE review-evidence and S7 freeze interfaces.

**Architecture:** Documentation-only correction. The executable validators and freeze logic remain authoritative; stage plans will describe their current file names, source decision, and dynamic expected-cell-count behavior without changing approval gates or measurement semantics.

**Tech Stack:** Markdown and JSON evidence references; no runtime dependencies.

**Spec:** `/Users/tom910/dev/visa-case/agent-overhead-benchmark-design.md` §4.3–§8 and `/Users/tom910/dev/visa-case/agent-overhead-benchmark-implementation-roadmap.md` S3–S8.

## Global Constraints

- Do not change C1–C4 schemas, timing equations, or source-review flags.
- Do not turn pending source/calibration/sign-off evidence into approval.
- DeepSWE remains the selected candidate; earlier public-pack and PolyBench records remain historical audit material.
- S7 examples must include every required environment variable and use a caller-supplied exact cell count.
- No new npm dependency and no provider spend.

## Files

- Modify `plans/S3-review-evidence-plan.md` to describe `plans/s3-deepswe-review.json`.
- Modify `plans/S3-tasks-plan.md` to remove superseded placeholder wording.
- Modify `plans/S3-polybench-replacement-plan.md` to mark the rejected candidate historical.
- Modify `plans/S7-runs-protocol.md` to make the preflight and freeze examples executable for the current interfaces.
- Modify `METHODOLOGY.md` to remove stale candidate-category claims and record the latest diagnostic accurately.
- Modify `plans/README.md` to keep the stage index wording current.

## Tasks

### Task 1: Correct stale evidence and source status records

- [x] Replace the S3 review-evidence plan's source-audit path with the structured review record and its actual pending-state contract.
- [x] Mark the old coding-agent-benchmark and PolyBench sections as historical/superseded rather than current source decisions.
- [x] Correct the stale S3 task-plan placeholder correction and source-index wording.

### Task 2: Correct executable S7 examples and methodology wording

- [x] Add `AOB_SOURCE_MANIFEST` to the S7 preflight example.
- [x] Replace the fixed `192` freeze example with `<expected-cell-count>` and explain that the value must equal the selected six-tool pinned Cartesian matrix.
- [x] Replace obsolete Python-enhancement/TypeScript-bugfix wording with the current native all-`feature_request` DeepSWE status and the recorded extended diagnostic.

### Task 3: Verify and record

- [x] Run `git diff --check`, Markdown/reference searches, and the no-spend test suite.
- [x] Commit the isolated documentation correction.

## Acceptance

No tracked document may claim that generated manifests use the obsolete
`s3-deepswe-source-audit.json` evidence interface, that an earlier source is
current, or that `192` is universal. S7 remains fail-closed until source review,
calibration, and sign-off are actually complete.
