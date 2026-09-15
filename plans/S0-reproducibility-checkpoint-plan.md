# S0 — Reproducibility checkpoint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the current implementation reproducible from a committed
checkpoint without adding secrets, scratch data, or paid-run artifacts.

**Architecture:** Commit the existing project implementation, tests, images,
plans, and release scaffolding as one coherent checkpoint. Keep ignored runtime
state and credentials outside Git, then validate the commit from a separate
fresh clone using dependency installation, tests, typechecks, lint, and shell
syntax checks.

**Tech Stack:** Git, Node.js 24+, npm workspaces, Docker smoke fixture.

**Spec:** `AGENTS.md`, `plans/README.md`, and the implementation roadmap's S0/S7
reproducibility and no-secret requirements.

## Global Constraints

- Do not stage `.env`, `scratch/`, `results/`, `reference/`, `node_modules/`, or `dist/`.
- Do not stage API keys, captured request bodies, or paid-run artifacts.
- Do not modify C1–C4 measurement semantics as part of the checkpoint.
- Preserve the fail-closed source-review and official-run gates.

## Tasks

### Task 1: Audit the checkpoint contents

- [x] Enumerate modified and untracked files and confirm they are project
  implementation, tests, plans, docs, images, or release scaffolding.
- [x] Scan the candidate tracked set for credential-shaped values and confirm
  only synthetic test fixtures/redacted examples are present.
- [x] Confirm ignored runtime directories remain outside the candidate set.

### Task 2: Create and verify the checkpoint

- [x] Stage the audited project files and commit them with message
  `checkpoint: commit benchmark implementation`.
- [x] Clone the resulting commit into a temporary directory.
- [x] Run `npm ci`, `npm test`, `npm run typecheck`, `npm run lint`,
  `git diff --check`, and shell syntax checks in the fresh clone.
- [x] Run the Docker route smoke in the fresh clone when Docker is available.

**Status (2026-08-27):** Implemented and verified. This checkpoint does not
approve the current public task source or execute a paid official matrix.
