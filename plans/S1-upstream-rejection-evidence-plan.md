# S1 — Retain upstream evidence and identify a proven validation rejection

Status: Implemented and independently reviewed (2026-09-10); authorized by the maintainer's request to try
DeepSeek V4.1 Flash and improve the solution if the problem persists.

## Observed problem

Direct Messages, Chat Completions and Responses requests succeeded through
`deepseek/deepseek-v4.1-flash`, provider `deepseek`, without fallback. Claude
Code's ordinary title-generation request uses JSON-schema output. DeepSeek
rejects that request with HTTP 400, `invalid_request_error`, and the exact
message `This response_format type is unavailable now`. The coding requests
and native fixture verification pass. The two isolated account deltas equal
the respective successful-request totals ($0.012642894 and $0.012660744).

The proxy currently retains only `status 400`, losing the generation ID and
structured cause. This makes a provider validation rejection indistinguishable
from ambiguous failed inference. The older GLM HTTP 520 and unknown served
model remain unresolved and must not be reclassified by this change.

## Design and boundaries

1. Write private auxiliary JSONL at `<events path>.upstream.jsonl`, binding each
   record to its C1 sequence and exact serialized C1 SHA-256. Retain bounded
   generation/request IDs and structured error type/code/message, plus a hash,
   byte count and completeness indicators for the error response. Do not store
   request bodies, successful response bodies, credentials or arbitrary headers.
   Redact credential patterns and known request/provider/relay credentials.
2. Observe at most 64 KiB of an error body, without changing forwarded bytes,
   request options, routing, streaming or model parameters. No extra upstream
   request is made on the measurement path. Account for auxiliary writes in
   proxy flush/close; the auxiliary artifact is private diagnostic evidence,
   not an additional measurement model or a derived C4 metric.
3. Recognize ONLY the observed complete JSON validation error on the authenticated
   OpenRouter upstream with provider `deepseek`, `is_byok: false`, the exact
   requested model, matching response/request IDs, and a text-only JSON-schema
   request with no tools, plugins, file/image processing or other server-side
   extensions. Emit C1 error kind `upstream_rejected` with a fixed identifying
   detail. Retain status 400, absent usage and every failed timing interval.
4. Keep all other HTTP failures, truncated/invalid/error-stream responses,
   mismatched provider evidence and ambiguous requests as ordinary errors.
   A shared C1 predicate and monetary handling belong to the subsequent S5
   stage. C1/C4 shapes stay unchanged.

OpenRouter's published zero-completion policy waives errored inference; plugin
and BYOK fees are separate, hence the strict exclusions above. This is a
pre-inference rejection classification, not an assertion that arbitrary failed
requests cost zero. Final provider-spend crosschecks remain mandatory.

Sources checked 2026-09-10:
- https://openrouter.zendesk.com/hc/en-us/articles/51693138951451-Was-I-charged-for-a-failed-errored-or-empty-response-Zero-Completion-Insurance
- Raw diagnostic evidence under `scratch/deepseek-v41-provider-check-20260910`.

## Acceptance

- Offline local-server tests prove exact passthrough, C1 binding, request-ID
  retention, bounded redacted error capture, concurrent sequence binding and
  cleanup after an interrupted response.
- Positive fixture reproduces the observed rejection without provider calls.
- Negative cases include HTTP 520, ordinary 400, wrong provider/model/origin,
  BYOK, plugins/tools/multimodal input, extra request extensions, malformed or
  oversized JSON, and a missing/mismatched response ID.
- Existing proxy and contract suites and workspace typechecks pass.
- No new dependencies, paid CI, raw historical artifact edits, or schema fields.

## Verification and review

- Proxy and contract suites: 148 tests passed, including 32 focused evidence
  cases. Proxy typecheck passed; workspace typecheck passed before review fixes.
- Independent review identified credential-component redaction and persistence
  failure handling. Regression tests failed before fixes and pass afterward.
  Sidecar-only ENOSPC cannot append a duplicate C1 record; flush/close preserve
  the typed failure and close releases resources even after persistence fails.

- Independent re-review confirmed both findings closed; 32/32 focused tests
  also passed in the reviewer's run.

## S1 follow-up: explicit empty tool list

The first production-path rerun remained unpriced. An offline native Claude Code
run (no provider access) captured structure only and showed the title request
contains `tools: []`. Accept this explicit empty list as equivalent to omitted
tools; retain rejection for nonempty, null, nonarray and unknown extensions.
Record the regression red/green cycle before another paid diagnostic.

Empty-tools regression failed before the two-line classifier adjustment; all
50 focused proxy/accounting tests then passed. The next real Claude Code run
completed with one retained known rejection and numeric spend.
