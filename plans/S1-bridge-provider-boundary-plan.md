# S1 bridge provider-boundary qualification

The maintainer requested continuing and finishing the Luna integration after the
reviewed S2 offline bridge stage. Reuse existing C1 accounting; no second
measurement schema, derived C4 fields, dependencies or historical result changes.

## Task 1: Truthful served-model identity

`ResponseUsageAccumulator` currently keeps the first served model. A later
contradictory terminal model can therefore hide substitution. Fix model identity
across bounded streaming and whole-body extraction without discarding independent
raw usage. Contradictory nonempty identities must yield unknown model (fail closed
at admission). Responses streams require a terminal completed/incomplete model;
missing or invalid terminal identity cannot inherit a creation/request model.
Preserve valid Chat and Messages streams whose usage-only terminal chunks omit
model. Keep C1 contracts unchanged. Tests first: contradictory early/terminal
models, absent/invalid terminal models, missing termination, matching identities,
Chat usage-only finals and unchanged token counts. Use actual proxy HTTP fixtures
as well as extractor cases; run affected package tests/types and independent review.

## Task 2: Provider-boundary route

Allow canonical POST /responses (alongside /v1/responses) so the bridge's appended
path maps exactly to the Codex backend root. Use a private bridge→C1 capability;
C1 strips it and retains host-owned OAuth Authorization. Existing upstream key
injection remains unchanged for other routes. A narrowly pinned bridge patch
may expose a validated loopback-only metering URL for OAuth; arbitrary remote
credential destinations must fail closed. Both protocols produce Responses at
this boundary. Every attempt, effective request setting and actual response model
must be visible to the same existing C1 instrument. Keep credential material out
of evidence and task containers. Reject wrong/missing model for qualification;
never turn absent usage into zero. Bound requests and retain failures.

## Following S2 acceptance

After S1 is complete, extend S2 with exact-model low effort and an explicitly
declared stateless reasoning condition, offline effective-body checks and the
smallest bounded live all-five tool smoke. Read-only model/allowance checks may
use the existing valid access token without refresh, mutation or paid fallback.
Live probes run only on Linux, preserve completed evidence and stop on access
failure or request cap. No full benchmark collection is authorized by this plan.

### Task 2 exact requested-model guard

Add optional `expectedModel` to the existing proxy options. When configured,
read each model POST as bounded full JSON before contacting upstream and reject
missing, mismatched, suffixed, invalid or duplicate top-level model identity.
Reject encoded or oversized bodies. Preserve request bytes when provider routing
is absent; existing provider routing remains independently effective. Legacy
callers without the option retain streaming passthrough behavior. This guard
prevents requests for other models from spending allowance; served identity must
still be validated from provider evidence after the response.

### Task 2 bounded model-request allowance

Add optional positive-integer `maxModelRequests` per proxy instance. Count model
POSTs atomically immediately before forwarding; upstream failures remain counted.
Reject attempts above the cap without provider traffic and retain ordinary C1
refusal evidence. Authentication/model refusals and metadata GETs do not consume
the cap. Default callers are unchanged. Qualify concurrent admission with a
zero-spend upstream fixture. The intended live acceptance cap is two requests per
harness, ten total across five isolated instances; this is not a token or dollar
limit and does not authorize benchmark repetitions.

## C1 implementation validation

Implemented the C1 portions: sticky contradictory identity, explicit terminal
Responses identity for streaming capture and whole-body inspection, canonical
`POST /responses`, opt-in exact requested-model preflight and per-instance model
request cap. Chat/Messages usage-only final chunks retain previously observed
consistent identity. Raw usage remains independent of model validity. Unknown
or conflicting model identity does not change historical report admission rules;
new Luna qualification must explicitly reject unknown served identity.

TDD observed fourteen identity failures, including two real HTTP proxy fixtures,
before the identity change. Five route/guard/cap tests failed before forwarding
support. All now pass. Full proxy package: **138 tests passed in 10 files**;
proxy strict typecheck and `git diff --check` passed. Canonical path proof verifies
`/backend-api/codex/responses`, private capability stripping and synthetic OAuth
Authorization passthrough. Concurrent cap tests retain only two actual upstream
model requests despite six concurrent submissions and provider 503 failures.
Guard tests cover missing/wrong/suffixed/duplicate/escaped-duplicate model keys,
invalid JSON, encoded and oversized bodies, raw byte preservation, provider
routing coexistence, and authentication/model refusals excluded from the cap.

No live inference or authentication was performed by this implementation task.
These fixtures establish C1 behavior only; the pinned bridge transport patch and
full native-client/provider topology require their separate offline review.
