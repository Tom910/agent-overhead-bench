# S5 Verifier-Image Integrity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development before implementation.

**Goal:** Make Docker tool and verifier execution fail closed when the required local image is unavailable, instead of allowing an implicit registry pull during a measured cell.

**Architecture:** Keep the existing content-addressed image references and add Docker’s explicit `--pull=never` policy to every runner-owned and preflight validation `docker run`. Native verifier execution also inspects the named image before starting the verifier, so a missing or stale local image fails before verification.

**Constraints:** No new dependency, no network request or token spend in tests, preserve C1–C4 fields, and keep all failures typed as existing configuration/tool errors.

## Tasks

### Task 1: Add failing Docker invocation assertions

- [x] Assert tool version, tool execution, relay, script verifier, native verifier, and preflight smoke commands all include `--pull=never`.
- [x] Assert native verifier inspects its requested image before running it.
- [x] Assert a verifier image digest mismatch fails before starting the verifier.

### Task 2: Implement no-pull image enforcement

- [x] Add `--pull=never` to runner-owned Docker runs.
- [x] Add `--pull=never` to task validation, route smoke, and image-validation Docker runs.
- [x] Inspect the verifier image and compare its local content identity with the requested digest.
- [x] Preserve cleanup and typed error behavior for image failures.

### Task 3: Verify and record

- [x] Run focused runner tests, full tests, typechecks, lint, shell syntax, and `git diff --check`.
- [x] Run the clean-checkout zero-spend dry-run/archive checks.
- [x] Commit only after all checks pass.

**Status (2026-08-27):** Implemented and verified. Docker execution is explicitly local-image-only.
