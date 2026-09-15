# S6 — Measurement-integrity follow-up

**Status (2026-08-28):** implemented and verified.

## Goal

Prevent an unparseable or oversized request body from silently disappearing
from timing when the proxy still identifies a supported LLM endpoint, while
continuing to exclude metadata and unknown-path traffic. Make the adapter to
proxy clock projection and the published derivation fixtures test the actual
contract.

## Scope

- Define model-interval eligibility from the C1 protocol/path, HTTP status,
  and method rather than from the optional model string alone. A supported
  endpoint event can contribute timing with `model_requested: null`; usage and
  cost remain unavailable unless C1 usage exists.
- Keep failed HTTP events in model-time when they are identifiable model
  attempts; metadata/unknown endpoints remain excluded. Usage and cost stay
  successful-response-only, preserving conservative accounting.
- Test non-stream JSON extraction for all supported protocol shapes, including
  missing usage, without changing the extractor's fail-closed token behavior.
- Test clock projection with distinct anchors and document the millisecond
  wall-anchor precision. Durations remain differences within one clock.
- Assert the shipped overlap fixture's sum-request and parallelism values.
- Reject startup probes and tool intervals outside the adapter's own monotonic
  run window before S6 derives timing buckets.

No new dependency is needed.

**Integrity correction (2026-08-28):** C3 validation now bounds every optional
`startupProbe` and `toolEvents[*]` interval by `[tStart, tEnd]`. These values
share the adapter process clock, so an observation outside that window is
invalid provenance rather than a derivation case; the contract fails closed.

**Schema-parity correction (2026-08-28):** the follow-up
`S6-contract-schema-parity-plan.md` aligns the checked-in C4 JSON Schema with
runtime-emitted `task_environment.agent_image` and
`task_environment.agent_image_digest` fields. Both fields remain optional for
legacy/local runs but are schema-constrained as an immutable, complete pair.

**Endpoint-eligibility correction (2026-08-28):** the follow-up
`S6-model-endpoint-eligibility-plan.md` makes C1 model-event classification
require agreement between the recorded path and protocol for Anthropic
Messages, OpenAI Chat Completions, and OpenAI Responses. Metadata, unknown
paths, and mismatched protocol/path pairs cannot contribute model intervals;
an eligible event with `model_requested: null` remains timing evidence.

**Provider-attempt timing correction (2026-08-29):** the follow-up
`S6-provider-attempt-timing-plan.md` uses that endpoint predicate for timing,
including non-2xx and network-error intervals. The successful-event predicate
remains the boundary for usage, cost, and completed-run evidence, so failed
attempts cannot fabricate tokens or dollars while their provider wait is not
misreported as harness time.

## Acceptance

- Mixed known-model/unknown-model supported endpoint events retain both timing
  intervals, while metadata and unknown paths do not.
- A completed run with only a supported endpoint whose request model is
  unavailable is timing-loadable but reports unavailable usage/cost; a run
  with no eligible endpoint evidence is still rejected.
- Non-streaming fixture tests cover Anthropic, Chat Completions, and Responses.
- Distinct-anchor projection tests pass and no timestamp from two clocks is
  subtracted directly.
- Full test suite, strict typecheck, lint, and shell syntax checks pass.

## Out of scope

Choosing a public task source, obtaining full tool-event visibility, changing
the headline metric, or running the official matrix.
