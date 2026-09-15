# S7 — Publish sanitized retry evidence and runner state

**Status: implemented and verified.**

## Goal

Make a frozen result independently auditable when a cell was retried or
quarantined. The report continues to load only current cells, while the
archive records the preserved attempts and the exact runner state used for
spend and completion reconciliation.

## Scope and invariants

- Copy `state.json` as `provenance/runner-state.json`.
- Copy preserved retry `run.json`, `events.jsonl`, and declared logs under
  `provenance/retries/`, preserving their cell-relative paths.
- Redact retry logs and event JSON using the release redaction rules.
- Validate retry C4 records and reject symlinks, path escapes, and malformed
  retry files before packaging.
- Never publish prompts, verifier descriptors, workspaces, or solution files.
- Keep retry evidence out of the report loader and current-cell cardinality.
- No new dependency or provider spend.

## TDD implementation order

1. Extend the no-spend freeze integration test with retry evidence and assert
   the archive contains runner state and sanitized retry evidence, but not
   prompts or verifier descriptors.
2. Add the archive copy/validation path and make the archive verifier accept
   the optional retry provenance bundle.
3. Run the complete workspace verification gate.

All three steps are complete. The archive now carries a sanitized runner
state and retry evidence bundle, while the report results tree remains
current-cell-only.

## Acceptance

- A retry-containing archive includes `provenance/runner-state.json` and the
  retry evidence needed to inspect the failed attempt.
- Current report results remain unchanged and `.attempts` is not present in
  the report results tree.
- Archive checksums and extracted-tree validation pass.
