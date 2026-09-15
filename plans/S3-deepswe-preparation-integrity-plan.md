# S3 — DeepSWE preparation integrity

**Status (2026-08-29):** implemented and verified.

## Goal

Ensure DeepSWE preparation can only consume the reviewed dataset revision and
that the review evidence file has the exact shape required by S7 preflight.
This closes provenance drift without turning pending evidence into approval.

## Scope

- Reject a DeepSWE checkout whose `HEAD` differs from the reviewed revision
  `0b9fabbb63b9104d678fe965e1632f2dd9eaa2ea` before cloning tasks or building
  images.
- Store the structured, non-approving review evidence in
  `plans/s3-deepswe-review.json`, including the source identity, selected
  task IDs, calibration adapters, reviewer identity, and all four gate flags.
- Point generated DeepSWE manifests at that structured evidence file and bind
  its checksum as before.
- Add no-spend tests for wrong-revision rejection and evidence shape.

No new dependency is needed.

## Acceptance

- Preparation rejects a valid Git checkout at an unreviewed revision before
  any source task lookup, network clone, or Docker build.
- The checked-in review evidence contains the fields consumed by S7 and all
  four approval flags remain false.
- Generic task-pack preparation and the pending-review fail-closed behavior
  remain unchanged.
- Focused tests, full tests, typecheck, lint, shell syntax, and diff checks
  pass.

## Out of scope

Changing the DeepSWE task subset, changing the declared short/long regime,
performing human source approval, completing paid calibration, instrumenting
tool events, or running the official matrix.

## TDD tasks

1. Add failing no-spend tests for an unreviewed checkout revision and the
   structured review record.
2. Add the exact revision guard and switch preparation to the structured
   evidence path.
3. Run the complete repository verification gate and record the result.
