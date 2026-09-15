# S7 — OpenRouter Activity Export cross-check

**Status:** Implemented and locally verified; operator export and human scope review remain required for S7. The summary is bound to the exact role-labelled current/retry/replacement C1/C4 set, runner state bytes, and an explicit UTC window.

## Goal

Make the S7 pinned-cost comparison reproducible against an OpenRouter Activity
Export CSV without putting credentials or the raw account export in the
repository or release archive.

## Scope and invariants

- Accept an operator-exported CSV and require unambiguous model and spend
  columns. Support common export header spellings, RFC-4180 quoting, currency
  symbols, and thousands separators; reject malformed or negative values.
- Match one exact pinned model. Sum all matching export rows, while retaining
  row counts and a SHA-256 of the source file for audit identity.
- Bind the summary to deterministic, role- and path-labelled hashes of all
  current, preserved retry, and selected replacement C1/C4 records plus the
  exact runner-state file bytes.
- Require an operator-supplied millisecond ISO-8601 UTC window; S7 verifies
  every current, retry, and selected replacement adapter interval lies inside
  that half-open window.
- Sum successful C1 usage from a pinned results tree using the exact dated
  `pricing.json` price book. When `STATE.json` is supplied, include every
  preserved retry and recorded interrupted spend, and require the total to
  reconcile with `state.spentUsd`. Missing usage, mixed model/condition/
  price-book, malformed results, or a cost mismatch fails closed.
- Emit a sanitized JSON summary only: no API key, request body, raw CSV rows,
  task prompt, or account identifiers.
- Use a fixed tolerance of `max($0.01, 1% of local spend)` and exit nonzero when
  the export and local total differ beyond it. The operator must select an
  export window/grouping that contains only this run and model; the tool cannot
  infer that scope from an aggregate export.
- No network request, npm dependency, or provider spend is introduced.

## Interface

```text
scripts/s7-activity-crosscheck.mjs RESULTS_DIR ACTIVITY_EXPORT.csv SUMMARY.json MODEL PRICE_BOOK STATE.json WINDOW_START_ISO WINDOW_END_ISO [RERUN_RESULTS_DIR RERUN_STATE.json REPLACEMENT_RUN_IDS]
```

## Implementation order (TDD)

1. Add parser tests for quoted CSV, header aliases, currency values, model
   filtering, malformed rows, and ambiguous/missing columns.
2. Implement the pure CSV parser and export it from the report package.
3. Add the no-network CLI wrapper that loads results/pricing, computes local
   spend, writes the sanitized summary, and enforces the tolerance.
4. Add S7 protocol documentation and no-spend CLI contract tests.
5. Run focused/full verification and obtain an independent accounting review.

## Acceptance

- A valid fixture produces a deterministic summary and matching totals pass.
- A changed export spend, model, price book, missing usage, malformed CSV, or
  mixed results fails without guessing.
- The summary contains the export SHA-256 and no raw export content or secret.
- The command is explicitly a pinned-book S7 review step and cannot alter the
  measured results tree.

## Out of scope

Fetching Activity exports through an authenticated API, selecting the browser
time window, approving source/calibration, changing C1–C4, or publishing v1.

## Verification record (2026-08-29)

- Report package tests: 42/42 passed, including quoted CRLF CSV, strict currency
  grouping, exact event-model identity, mismatch detection, and dangling output
  symlink rejection.
- Workspace typecheck, lint, shell syntax, and full workspace tests passed.
- The CLI matched a one-task diagnostic result tree at `$0.045040735` and exited
  0; a deliberately changed `$0.50` export exited 2. The generated summary was
  mode `0600` and contained no raw export row or path.
- Retry artifacts and explicit interrupted-spend state are included when the
  optional state path is supplied; official freeze requires the resulting
  total to equal `state.spentUsd`.
- The summary includes `binding.run_ids_sha256`, `binding.results_sha256`,
  `binding.state_sha256`, and the operator-supplied `window`; selected anomaly
  replacements and their preserved retries are included in the binding and
  export total. Original and rerun state are hashed and reconciled separately,
  and the rerun results/state set must exactly equal the reviewed replacements.
  Official freeze recomputes the bindings and rejects stale or out-of-window
  evidence. It also recomputes the complete local accounting side from C1/C4
  evidence and runner state, so edited summary counts or replacement spend
  cannot pass by remaining arithmetically self-consistent.
- An independent read-only audit was incorporated. The cross-check also verifies
  each pinned C4 `spend_usd_estimate` against its successful C1 usage at the same
  tolerance used by the report layer; the separate preflight estimate is not a
  C4 field and is intentionally not involved.
