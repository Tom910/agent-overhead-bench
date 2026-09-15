# S3 — Bind prepared task review provenance

Status: implemented and verified

## Goal

Ensure a prepared task manifest cannot replace the reviewed source manifest's
review record while retaining the original source-manifest checksum.

## Scope

- Compare every normalized review field when binding a prepared manifest to
  its original source manifest.
- Keep pending review flags valid for candidate manifests; approval remains an
  S7 gate rather than a generic source-parser requirement.
- Add regression coverage for forged review metadata and archive the review
  evidence needed for independent official verification.

## TDD tasks

1. [x] Add a failing source-binding test that changes one prepared review field.
2. [x] Add the shared review comparison and make the official freeze/archive path
   retain and verify the reviewed evidence bytes.
3. [x] Run focused tests, the full test/type/lint/shell verification gate, and
   update this plan and the plans index.

## Out of scope

- Approving the current DeepSWE selection.
- Treating a boolean calibration flag as proof of two-CLI calibration; that
  requires a separate calibration-attestation contract.
- Changing the measurement decomposition or C1–C4 schemas.

## Human review

The maintainer still must replace the pending review record with real source,
reference-polarity, calibration, and sign-off evidence before S7.
