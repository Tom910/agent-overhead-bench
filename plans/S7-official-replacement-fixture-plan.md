# S7 — Official replacement freeze fixture

**Status:** Implemented and verified (2026-08-31)

## Goal

Exercise the production anomaly-replacement path in official mode with a
full six-tool, eight-task, four-repetition matrix, a separate replacement
session, private Activity Export recomputation, and sanitized archive
verification. This is a no-spend fixture only; it must not weaken any
official gate or authorize a provider run.

## Contract

- The primary result tree contains the exact 192-cell official matrix and one
  reviewed anomalous current result.
- The replacement tree contains exactly the selected replacement result and
  its separately-ledgered retry/result evidence.
- Primary and replacement ledgers have distinct, non-overlapping closed
  sessions on the same host and bind their respective state/result trees.
- The raw Activity Export includes both original and replacement accounting;
  freeze recomputes it privately and never archives the raw file.
- The frozen archive publishes the replacement in `results/`, retains the
  original under anomaly provenance, and preserves sanitized replacement
  ledger/state/retry evidence.

## Implementation and verification

- [x] Add a failing official-mode fixture covering a selected replacement,
  separate rerun state/ledger, and exact Activity binding.
- [x] Make only the minimum fixture/helper changes needed to construct valid
  primary and replacement evidence; do not loosen production validation.
- [x] Bind an archive's primary ledger to retained original anomaly evidence
  while allowing only the reviewed replacement IDs in published results.
- [x] Assert archive publication, original/replacement mapping, both ledger
  bindings, retained retry evidence, and absence of the private raw export.
- [x] Run the focused fixture, then the complete no-spend verification suite.

## Out of scope

- Running provider-backed cells or selecting real DeepSWE anomalies.
- Changing the C1–C4 measurement model or adding derived fields to `run.json`.
- Treating this synthetic fixture as calibration or official benchmark data.

## Acceptance

The official freeze fixture passes without credentials or provider calls, and
tampering with either the primary or replacement ledger/state/result binding
fails before an archive can be accepted.
