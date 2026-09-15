# S7 — Close release-integrity review defects

**Status:** implemented and locally verified; independent follow-up review addressed.

## Goal

Make the release boundary internally consistent under credential-shaped JSON,
retries, interrupted spend, anomaly reruns, duplicate duration-map keys, and
unavailable cost evidence.

## Scope and invariants

- Release JSON remains valid after sanitization; redaction changes string
  values, never JSON syntax.
- Activity Export reconciliation counts every provider attempt represented by
  current results, preserved retries, and recorded interrupted spend.
- Anomaly replacements live in a separate rerun tree and never contaminate the
  exact current Cartesian matrix or headline aggregates.
- Duration maps reject duplicate object keys before JSON parsing.
- A numeric cost on one side of a C1/C4 comparison cannot reconcile with a
  missing cost on the other side.
- No new npm dependency and no provider spend.

## Implementation order

1. Add failing focused tests for each defect.
2. Implement the smallest contract-preserving fixes.
3. Update S7 operational documentation and archive validation.
4. Run focused tests, then the complete local verification gate.

All four steps are complete. The archive boundary now validates replacement
reruns from a separate tree, binds their full measurement identity, and the
Activity Export command accepts the runner state needed for complete spend
reconciliation. A follow-up GPT Sol review also confirmed retry identity and
spend-tolerance handling.

## Non-goals

- Marking DeepSWE source-review or maintainer-signoff flags true.
- Claiming an official S7 run exists.
- Changing the C1–C4 measurement equations.
