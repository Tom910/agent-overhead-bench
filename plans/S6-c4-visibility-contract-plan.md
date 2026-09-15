# S6 — C4 visibility contract fidelity

**Status (2026-08-27):** implemented and verified with focused contract/report
tests, the full workspace suite, strict typechecks, lint, shell syntax, and
diff checks.

## Goal

Reject a raw C4 record at validation time when it claims full tool visibility
without carrying the corresponding `toolEvents` array. This keeps the raw
contract, runtime validator, JSON Schema, and report loader aligned and avoids
allowing an invalid artifact to survive until report generation.

## Contracts consumed / produced

- Consumes: C3 `toolEvents` and C4 `tool_visibility`.
- Produces: the same raw C4 fields, with a cross-field invariant; no derived
  metrics or visibility reclassification.

## Acceptance tests written before implementation

- `validateC4Run` rejects `tool_visibility: "full"` when `toolEvents` is absent.
- `validateC4Run` accepts full visibility with an empty `toolEvents` array and
  accepts partial/none visibility without the array.
- The C4 JSON Schema expresses the same full-visibility conditional.
- Existing report-loader error handling and all other C4 validation remain
  unchanged.

## Implementation

1. Add the cross-field runtime validator check and reuse the validated C3
   result.
2. Add the JSON Schema `if`/`then` condition requiring
   `adapter_result.toolEvents` for full visibility.
3. Add focused and full verification evidence.

## Out of scope

Changing visibility labels, synthesizing tool events, changing S6 derivation,
or requiring tool events for partial/none visibility.

## Human review

The maintainer should confirm that the invariant rejects only unsupported full
visibility claims and does not turn partial/none tools into ranked harness-share
rows.
