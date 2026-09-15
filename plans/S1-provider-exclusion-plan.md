# S1 explicit provider exclusion

Status: implemented; 73 proxy tests, typecheck, lint and independent review pass.
Maintainer approved excluding Relace on
2026-09-08 after wire probes reproduced inconsistent output/thinking counters.

Add an optional runner-owned ignored-provider list to the proxy. For supported
model POSTs, merge that list into `provider.ignore`, retaining all other JSON
values and existing exclusions. Metadata GETs and unconfigured proxies retain
their existing passthrough behavior. Reject malformed, encoded, or oversized
routing requests before forwarding. No dependency, usage invariant, pricing,
model, or C1–C4 schema changes in this stage.

Routing requires reading a complete JSON body (bounded at the existing 16 MiB
request-capture limit) before sending upstream. This explicit policy exception
to streaming uploads applies equally across protocols and must be described as
added proxy work included in C1 request intervals. Monotonic request arrival/body-end/upstream boundaries remain
ordered. Response streaming is unchanged.

Validate local HTTP behavior for Messages, Chat Completions and Responses,
existing provider options, malformed payload refusal, request size/encoding,
and unchanged unconfigured streaming. Implement and verify this S1 boundary
before S7 enables and binds the policy to runner/validation evidence.

Live diagnostic: Relace was excluded; GMICloud returned valid usage, then
DeepInfra returned output 70 / thinking 81. Exclusion alone therefore does
not yet satisfy the live accounting gate. Retain this result, do not expand
the exclusion list or relax counters silently, and do not start full paid
validation until live accounting is usable.

## September 9 single-provider enforcement

Extend the existing lossless routing rewrite with optional `onlyProvider`.
Override client `provider.only` and `allow_fallbacks` with the runner pin and
false, preserving other fields and exact numeric text. Reject duplicate routing
keys and client exclusions of the pinned endpoint before upstream forwarding.
Validate configuration before listening. No C1 changes or dependencies.
Offline HTTP tests must prove all three protocols and no forwarding on conflict.
