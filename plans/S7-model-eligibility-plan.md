# S7 — Model/adapter/protocol eligibility gate

**Status:** Implemented and verified (2026-08-31)

## Goal

Prevent an official run from spending against an adapter/model/protocol
combination already known to be ineligible. The gate validates reviewed
evidence before credentials, Docker, or any provider request is touched.

## Contract

- The eligibility manifest pins one upstream, one model, and the exact
  official adapter order.
- Every adapter has one protocol, a reviewed flag, and an explicit eligible
  boolean with a reason when it is ineligible.
- Missing, duplicate, mismatched, unreviewed, or ineligible combinations fail
  closed.
- The retained six-candidate Flash/OpenRouter evidence records Claude Code as
  Anthropic-protocol-ineligible for this model. The official release profile
  therefore selects the five eligible tools in `s7-official-tool-scope.json`;
  this is an explicit, documented scope decision rather than a silent removal.
- A synthetic all-eligible manifest is accepted by the validator so the gate
  remains evidence-driven rather than hard-coded to reject Claude.

## Implementation and verification

- [x] Add the checked-in eligibility evidence manifest and no-dependency
  validator.
- [x] Add failing tests for acceptance and fail-closed missing/duplicate,
  model/upstream/protocol, review, and explicit-ineligibility cases.
- [x] Invoke the gate in S7 preflight before key, Docker, and provider checks.
- [x] Align launcher/methodology/current-review wording with the safety gate.
- [x] Run the complete no-spend verification suite.

## Out of scope

- Selecting a replacement model or changing the official scope again.
- Provider calls, task calibration, or changing C1–C4 measurement semantics.

## Acceptance

The superseded six-candidate configuration stops with an actionable Claude
protocol eligibility error without checking credentials or starting Docker. The
checked-in five-tool official manifest passes the standalone validator, and the
explicit scope decision allows it to proceed through later S7 gates.
