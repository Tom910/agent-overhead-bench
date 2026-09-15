# S7 — Explicit release-mode marker

**Status (2026-08-30):** Implemented and verified.

## Goal

Make frozen archives distinguishable as official release evidence or
nonofficial dry-run evidence, even when both pass structural archive checks.

## Contract

Every frozen archive carries `provenance/release-manifest.json` with a strict
`official` boolean, expected cell count, source/regime identity, and the
runner session identity when available. Structural verification accepts either
mode; `s7-verify-archive.sh --official ARCHIVE` requires `official: true`.
Official freeze invokes that stronger mode automatically.

## Implementation and verification

- [x] Emit the marker for official and explicitly nonofficial freezes.
- [x] Add the marker to archive path/checksum allowlists and validate its
  shape/content after extraction.
- [x] Add an official verification flag and regression coverage proving a
  nonofficial archive cannot pass it.
- [x] Run the complete no-spend verification suite.

## Out of scope

The marker does not approve source review, calibration, Activity reconciliation,
or matrix completeness; those remain enforced by the official freeze gates.
