# S2 default-condition evidence boundary implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status (2026-08-29):** implemented and verified.

**Goal:** Record the roadmap-required default-condition decision for every S2 candidate without claiming native/default behavior that was not measured.

**Architecture:** Documentation-only S2 evidence correction. Each evidence form receives the exact `default_exclusion` value from the roadmap. Included tools remain `pinned_only` because their evidence proves only the uniform OpenRouter key+base-URL path; dropped candidates are explicitly excluded. Runner equations and S7 gates remain unchanged.

**Tech Stack:** Markdown evidence records; no runtime dependencies.

**Spec:** `/Users/tom910/dev/visa-case/agent-overhead-benchmark-implementation-roadmap.md` §S2 and `/Users/tom910/dev/visa-case/agent-overhead-benchmark-design.md` §5.

## Global Constraints

- Use only the roadmap values: `keep`, `pinned_only`, `default_only`, or `drop`.
- Do not infer native/default credentials, model identity, or price books from a pinned OpenRouter smoke.
- Keep the six-tool pinned model decision unchanged.
- Do not remove the S7 default guard or alter C1–C4 measurement semantics.
- No provider requests or new dependencies.

## Files

- Modify `plans/s2-evidence/_template.md` to include `default_exclusion`.
- Modify every candidate form under `plans/s2-evidence/*.md` to fill the field.
- Modify `plans/s2-decision-record.md` to explain the pinned-only boundary.
- Modify `plans/README.md` to index this stage record.

## Tasks

### Task 1: Extend the evidence template

- [x] Add `default_exclusion: keep | pinned_only | default_only | drop` beside the existing decision field.

### Task 2: Fill candidate decisions from existing evidence

- [x] Set the six included tools (`claude-code`, `codex`, `hermes`, `aider`, `opencode`, `qwen`) to `pinned_only`.
- [x] Set candidates outside the keep set to `drop` with their existing exclusion rationale; no candidate receives `default_only` without native evidence.
- [x] State in the decision record that default-condition support is an unmeasured follow-up, not a silently unpinned OpenRouter run.

### Task 3: Verify and record

- [x] Search every candidate form for the required field and validate the value set.
- [x] Run `git diff --check` and the no-spend repository gate.
- [x] Commit the isolated S2 evidence correction.

## Acceptance

Every S2 candidate evidence form contains exactly one valid `default_exclusion`
value. The included six are explicitly `pinned_only`; no official launcher or
preflight guard is weakened; and the decision record states what evidence is
still required before a native/default condition can be added.
