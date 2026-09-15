# S3 DeepSWE verifier-polarity follow-up

**Status (2026-08-28): implemented and verified.** The generated native
verifier now translates the source grader's `reward.json` outcome into the
repository exit-code contract. Fresh SuperJSON preparation passed stable
pristine-fail and reference-pass checks.

## Goal

Make a prepared DeepSWE native verifier satisfy the repository's existing
fail-closed verifier contract: pristine workspace must return nonzero and a
passing submission must return zero. DeepSWE's authoritative grader writes a
zero-reward report while its shell entrypoint itself exits zero, so the
source-specific command must translate the recorded reward without replacing
the source tests or hidden grader.

## Contracts consumed / produced

- Consumes the DeepSWE `tests/test.sh` and `reward.json` contract, the C2 native
  Docker verifier descriptor, and the task validator's exit-code contract.
- Produces no new C1–C4 fields or derived metrics; only the generated verifier
  command's process exit status changes.

## Acceptance tests before implementation

- The source-preparation regression test requires the generated command to read
  the canonical reward report and fail when its binary reward is not `1`.
- A prepared DeepSWE task's pristine verifier is stable and nonzero, while its
  reference patch passes with stable zero exit status.
- Generic local and Git task-pack verifier behavior remains unchanged.
- Full workspace tests, strict typecheck, lint, and shell syntax checks pass.

## Implementation

Append a small, dependency-free check after the source-owned `tests/test.sh`
completes. Preserve the source test exit code, require a valid JSON reward
report, and return nonzero for a non-winning reward. Keep the check inside the
immutable verifier image and leave hidden tests, patch application, and report
generation source-owned.

## Out of scope

- Changing DeepSWE tasks, prompts, hidden tests, reward semantics, or the C1–C4
  measurement model.
- Treating a reward report as a timing metric or approving the source for S7.
- Human maintainer sign-off, two-CLI calibration, or official paid runs.

## Human review point

The maintainer must confirm that reward `1` is the source grader's winning
condition and that the generated command remains faithful to the pinned
DeepSWE verifier before changing the source review flags.
