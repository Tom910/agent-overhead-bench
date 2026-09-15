# S5 — Preserve DeepSWE patch capture across agent Git history changes

**Status:** Implemented and verified (2026-09-01)

## Goal

Ensure the source-owned DeepSWE verifier can derive the model patch even when
the measured CLI follows the task prompt and creates a branch, commits its
changes, or rewrites the workspace Git history. The patch must always compare
the final visible workspace contents with the immutable sanitized base that was
embedded in the verifier image.

## Contracts and invariants

- C1–C4 and all S6 timing equations remain unchanged.
- The task prompt and source verifier remain authoritative; no prompt or test
  is rewritten to influence model behavior.
- The verifier image's `/app` repository is the immutable base snapshot. It is
  not exposed as a writable path to the measured agent.
- Patch capture excludes `.git` metadata and adapter-private configuration as
  before, but includes tracked changes, additions, and deletions visible in the
  final workspace.
- Patch capture remains offline, deterministic, and fail-closed. A missing
  verifier base or failed overlay must abort verification rather than emit a
  false pass.
- No hidden tests, reference patches, or verifier inputs enter the agent
  workspace or generated model patch.

## Acceptance tests (write before implementation)

1. The generated DeepSWE verifier command captures a patch from an immutable
   verifier-base mirror rather than resolving the base commit from the mutable
   agent workspace.
2. A no-spend shell fixture with a rewritten/deleted workspace Git history
   still produces a non-empty patch for a changed source file.
3. The capture path preserves additions and deletions and does not include
   `.git` or adapter-private configuration.
4. Existing source preparation, workspace, typecheck, lint, shell syntax, and
   Docker/no-spend tests remain green.

## Implementation order

1. Add a failing static/functional regression test for the generated verifier
   command and history-rewrite scenario.
2. Change only the generated verifier command in
   `scripts/prepare-deepswe-calibration.sh` to clone the immutable `/app`
   snapshot into a temporary directory, overlay the final workspace without
   `.git`, and run the existing intent-to-add/binary diff there.
3. Retain the existing verifier test and grading sequence unchanged.
4. Run the focused test, the full required verification gate, and a bounded
   source-owned verifier replay if the prepared images are available.

## Verification record

The focused regression first failed because the helper and image wiring did
not exist. It now passes a workspace whose `.git` directory was removed,
including changed, added, and deleted files while excluding adapter-private
configuration. The generated verifier uses the helper and the verifier image
copies it as `/usr/local/bin/aob-capture-model-patch`. A rebuilt one-task
DeepSWE/Codex verifier image also passed all five source-owned reference
polarity replays. The complete test suite, strict typecheck, lint, shell
syntax, and diff checks pass.

## Out of scope

- Changing DeepSWE task prompts, test patches, reference solutions, or grading
  rules.
- Choosing or approving tasks; running paid calibration or S7.
- Promoting tool visibility or changing report derivation.
- Adding dependencies or changing Docker network policy.

## Human review

The maintainer should review that the immutable `/app` snapshot contains only
the prepared public base and that the overlay excludes Git metadata and private
adapter files. This mechanical fix does not change the pending source-review,
calibration, or official-run gates.
