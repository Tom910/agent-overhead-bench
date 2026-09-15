# S7 — Freeze current cells while retaining retry spend evidence

**Status:** implemented and verified.

## Goal

Allow a valid S7 archive to contain retried or quarantined cells without
mistaking preserved `.attempts` evidence for additional matrix cells.

## Root cause

The runner preserves failed attempts under each cell's `.attempts/` directory.
S7 freeze recursively counted every `run.json` for its cell-count assertion,
while the report loader correctly ignored `.attempts` as non-current results.
Any retry therefore made freeze reject an otherwise complete matrix.

## Scope and invariants

- Count only current cell `run.json` files for the expected matrix cardinality.
- Continue scanning `.attempts` recursively for C4 validation and spend
  reconciliation.
- Preserve the existing current-result identity, anomaly, archive, and
  checksum checks.
- Do not discard retry evidence or change runner retry behavior.
- No new dependency or provider spend in tests.

## TDD implementation order

1. Add a no-spend freeze test with one current cell and one preserved retry;
   require the archive to succeed and reconcile both spends.
2. Observe the test fail because recursive cell counting reports two cells.
3. Exclude `.attempts` only from the cardinality walk.
4. Run the full verification gate and commit the isolated fix.

All four steps are complete. The cardinality walk prunes `.attempts`, while
the later recursive artifact loop still validates and charges preserved retry
records.

## Acceptance

- A retry-containing results tree freezes successfully when current cells and
  state agree.
- Retry artifacts remain included in spend reconciliation and C4 validation.
- The archive contains only current sanitized results, report output, and
  declared review evidence.
- Full tests, typecheck, lint, shell syntax, and diff checks pass.

## Out of scope

Changing retry semantics, publishing retry logs, official source approval, or
the measurement model.
