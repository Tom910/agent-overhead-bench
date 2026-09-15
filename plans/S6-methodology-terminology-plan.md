# S6 — Align methodology terminology with turn derivation

**Status:** Implemented and verified (2026-09-01)

## Goal

Remove the publication-facing contradiction that describes `turns` as
successful-only even though the S6 derivation counts every identifiable model
attempt, including failed HTTP and network attempts.

## Scope and invariants

- Change documentation wording only; do not change C1/C4 fields, derivation,
  usage accounting, cost accounting, or the measurement equations.
- State separately that usage, cache, cost, and token-floor values remain
  successful-response-only.
- Keep the methodology aligned with the existing report implementation and
  S6 turn-count plan.

## Acceptance tests

- `METHODOLOGY.md` explicitly says turns count identifiable model attempts.
- `METHODOLOGY.md` explicitly says usage/cost remain successful-response-only.
- The contradictory phrase “successful-turn counts” is absent.
- Full repository verification remains green.

## Out of scope

- Changing turn derivation or provider failure treatment.
- Changing task selection, tool visibility, default conditions, or official
  release gates.

## Human review

The maintainer reviews the final methodology wording during the S7/S8 data and
publication review. This correction does not represent calibration or source
approval.

