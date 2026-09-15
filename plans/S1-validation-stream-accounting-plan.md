# S1 — Validation stream accounting root-cause fixes

Status: implemented and independently reviewed (2026-09-06).

The maintainer requested root-cause analysis and fixes after the capped first
validation cell timed out, and explicitly requested subagent analysis. Preserve
all original run evidence. No provider spend is needed to reproduce these bugs.

## Evidence and scope

The retained Pi/PSD validation has 20 C1 attempts. Nineteen HTTP-200 calls occupy
about 295.911 seconds of the 300.357-second adapter window. The longest response
takes 184.218 seconds and has 7,484 output tokens (7,364 reasoning tokens in the
provider metadata). Local tools completed; the timeout is the configured short
regime, not a proven adapter hang. Changing regime is a separate explicit choice.

The long response has no C1 usage and its generation lookup reports http_error.
An offline reproduction with 7,391 SSE frames (2,202,752 bytes) forwards every
byte correctly but loses valid final usage after the proxy's 2 MiB capture limit.
The original wire-byte count is unavailable; reproduction strongly supports this
cause without fabricating retrospective evidence. A short control succeeds.
The error path also discards observed request model/timing metadata on shutdown.

## Implementation

- [x] Replace cumulative SSE body retention with bounded per-event metadata
  extraction. Discard response content as each event completes, retaining only
  valid usage/model metadata. Preserve byte-for-byte forwarding and clock fields.
- [x] Handle UTF-8/chunk/CRLF/multiline framing, bounded oversized-event discard
  and resynchronization, root/nested Responses fields, and Anthropic cumulative
  start/delta usage without inventing missing counters or summing cumulative values.
- [x] Keep non-stream JSON bounded and incomplete oversized JSON unavailable;
  retain the existing bounded generation-lookup fallback. No new dependencies.
- [x] Preserve completed request-body identity and observed timing boundaries on
  aborted requests. Keep status 0/error classification, unavailable error usage,
  prompt secrecy, and bounded shutdown; never infer billable tokens from a request.
- [x] Add local-upstream regressions for long streams, malformed/oversized events,
  chunk boundaries, JSON limits, nested served models, exact forwarded bytes,
  and cancellation metadata. No live model calls in tests or CI.

C1–C4 schema and measurement definitions remain unchanged. No derived metrics
are added to run.json. Do not repair old artifacts by copying CLI/provider usage
into C1. Provider lookup diagnostics remain separate evidence.

## Acceptance and subsequent stage

- [x] Focused regressions fail before the fix and pass afterwards.
- [x] Proxy tests/typecheck and appropriate workspace checks pass.
- [x] Independent review is clean; retain diagnostic artifact inventory.

Local validation: the 11 response metadata regressions initially had eight
expected failures; all now pass. The complete proxy suite passes (64 tests),
including cancellation metadata and the native Node calibration subprocess.
The full repository passes 426 workspace tests and 135 script tests, strict
typecheck, lint (171 JavaScript/shell files), and `git diff --check`. Independent
review is clean. Original artifact hashes are retained in the private diagnostic
inventory; no provider calls or raw-artifact edits were needed for this fix.

After S1 is complete, implement a separate S5 budget follow-up: potentially
billable model attempts with unavailable usage must keep total cost unknown,
including transport aborts, even when successful calls are fully priced. Preserve
recovered-request timing/verifier behavior while refusing understated spend and
capped resumes. Implement one stage at a time. No changed-regime or paid retry
until its prerequisites and the existing $10 total budget are accounted for.
