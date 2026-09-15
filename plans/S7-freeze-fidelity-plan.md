# S7 — Official freeze fidelity hardening

**Goal:** Prevent the release freezer from packaging a reduced or unresolved
matrix as the official dataset.

**Constraints:** No changes to C1–C4 measurement fields or derivation; no new
dependencies; local dry-run archives remain possible only with an explicit
non-official override.

## Tasks

- [x] Require the official six-adapter pinned matrix, 8–10 tasks, at least four
  repetitions, and exact Cartesian state/result coverage.
- [x] Require a machine-readable anomaly disposition when any cell is
  quarantined or has a non-completed outcome.
- [x] Keep archive immutability, sanitization, checksum, and report validation
  intact.
- [x] Verify official rejection and explicit local dry-run override behavior.

**Status (2026-08-27):** Implemented and verified. Human anomaly review,
source approval, and the actual official run remain external S7 gates.
