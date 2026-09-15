# S7 Eligible Official Tool Scope Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for regression tests before implementation changes.

**Goal:** Make the official GLM Flash run executable with the reviewed eligible tool set while documenting Claude Code’s protocol exclusion.

**Decision:** The official pinned profile contains five tools: `codex`, `hermes`, `aider`, `opencode`, and `qwen`. Claude Code remains a retained S2 candidate but is excluded from this GLM Flash/OpenRouter release profile because the Anthropic Messages route returned `404 unrecognized_model`. The design permits a 5–7 tool v1 set and requires documented exclusions.

**Architecture:** One checked-in scope declaration is consumed by launcher/preflight and archive validation. Every official matrix and freeze derives its expected Cartesian set from that declaration. Selected DeepSWE tasks need image provenance only for selected tools; no adapter or measurement equation changes.

## Tasks

- [x] Add the five-tool scope declaration and no-spend tests for launcher, preflight, and freeze/archive matrix validation; confirm the old six-tool assumptions fail.
- [x] Update launcher/preflight/image provenance checks and official freeze/archive guards to use the five-tool scope.
- [x] Update eligibility evidence and operational documentation to record the explicit Claude exclusion and five-tool profile.
- [x] Run the complete no-spend suite, typecheck, lint, shell syntax, and diff checks; obtain an independent subagent review.
- [x] Commit the scope change and run the no-spend official preflight against the real prepared source to confirm the next blocker is calibration/source approval rather than tool eligibility.

## Constraints

- Keep the model pinned to `z-ai/glm-5.3-flash` and the upstream pinned to OpenRouter.
- Do not bypass eligibility, source review, calibration, budget, clock, or archive gates.
- No provider spend is part of this implementation stage.
