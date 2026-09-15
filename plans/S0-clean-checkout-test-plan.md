# S0 — Clean-checkout probe-test plan

**Goal:** Make the Docker probe cleanup regression test independent of a
developer-only ignored credentials file.

**Architecture:** The probe wrapper uses its normal `.env` default in real use,
but accepts an explicit `AOB_ENV_FILE` for controlled invocations. The test
creates a temporary synthetic source file and never needs a real key or network.

**Tech Stack:** Bash, Node.js/Vitest, filesystem isolation.

**Spec:** S2 no-secret CI requirements and S0 reproducibility checkpoint.

## Global Constraints

- CI never holds API keys or spends tokens.
- The temporary source contains only the synthetic test key and is removed with
  the test directory.
- Preserve the existing `s2-docker-env.sh` allowlist and symlink checks.

## Tasks

- [x] Add `AOB_ENV_FILE` with the existing `.env` path as its default.
- [x] Update the interruption test to provide a temporary synthetic env file.
- [x] Run the isolated test from the current tree and from a clean checkout.

**Status (2026-08-27):** Implemented and verified in the current tree and a
fresh clone. No provider request is made.
