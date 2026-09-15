# S7 — Runner replacement run IDs

**Status:** Implemented and verified (2026-08-31)

## Goal

Allow a separately invoked runner session to produce a replacement run ID for
an anomaly without hand-editing C4 or C1 evidence. The replacement keeps the
same tool, task, condition, and repetition identity used for matching, while
its run ID is distinct and safe for official freeze mapping.

## Contract

- The default runner IDs and matrix behavior are unchanged.
- An explicit safe suffix changes only the generated run ID; result directory,
  task identity, repetition, model, price book, and C1/C4 semantics remain
  unchanged.
- The suffix participates in the matrix definition key, so a replacement
  state cannot be resumed as a different matrix.
- The CLI requires the suffix explicitly and validates it as a nonempty safe
  identifier. No automatic replacement or anomaly selection is inferred.

## Implementation and verification

- [x] Add a no-spend runner regression test for a suffixed replacement ID.
- [x] Implement the option in the matrix definition and CLI.
- [x] Document its use in the replacement protocol and run the full suite.

## Out of scope

- Automatically selecting anomalies, creating review records, or running a
  replacement session.
- Changing freeze policy, C1–C4 schemas, or derived metrics.

## Acceptance

The zero-spend runner can produce `...:replacement` evidence in a separate
output/session, and the generated C4 run still matches its matrix cell and
the original measurement identity. Existing runner tests remain unchanged.
