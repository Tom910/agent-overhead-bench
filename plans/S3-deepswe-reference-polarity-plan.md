# S3 DeepSWE reference-polarity plan

Status: Implemented (security follow-up included)

## Goal

Make DeepSWE preparation and S7 preflight mechanically prove that every
selected task's source-provided `solution/solution.patch` passes the exact
native verifier used by the measured task. Keep the solution and hidden tests
outside the agent-visible workspace.

## Contract boundary

- Consumes the pinned DeepSWE task directory, prepared upstream base checkout,
  and digest-pinned native verifier image.
- Produces a local-only `reference-polarity.json` evidence file per prepared
  task, bound to the source-task checksum and verifier image digest.
- S7 validates the evidence shape and identity in addition to the existing
  pristine-failure check and human review flags.
- No C1-C4 fields, measured artifacts, or model-spend paths change.

## Acceptance tests

1. Preparation runs the source solution patch through the native verifier five
   times and rejects a non-zero, unstable, or missing result.
2. The reference workspace is a temporary copy and is never copied into the
   measured task workspace.
3. S7 preflight rejects missing, malformed, stale, or task/verifier-mismatched
   polarity evidence.
4. S7 preflight accepts a valid polarity record without requiring hidden source
   files in the prepared task tree.

## Out of scope

- Changing the DeepSWE task selection, review flags, or maintainer sign-off.
- Treating mechanical polarity as source/license review or two-CLI
  calibration.
- Running paid model calls.

## Review point

Confirm that the native verifier command remains source-owned and that the
reference solution and hidden tests are mounted only in the temporary
preparation-time verification context.
