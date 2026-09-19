# S1 — Preserve requested model beyond the 64 KiB prefix

A user-authorized Hermes measurement replacement stopped at model supervision:
served model was the pinned DeepSeek model, but model_requested became null once
the request's model property followed a large message list. peekModel parses only
64 KiB and falls back to a regex, despite the proxy retaining complete bodies up
to 16 MiB. The prefix can also confuse a nested model with the top-level field.

Use the already bounded, fully captured request JSON to read only its top-level
model. Retain the 16 MiB limit, return null on incomplete/malformed/oversized JSON,
and never infer requested model from served model. Preserve guards and raw old
records. Regression tests cover trailing top-level model beyond 64 KiB, nested
model decoys, malformed/oversized bodies, and escaped model strings.

Run zero-spend proxy tests before deploying the bounded fix to the stopped Linux
queue. Retain the interrupted Hermes startup as extra execution evidence and
append a fresh replacement job for that same authorized slot; never restart the
finished Codex job. Resume pending jobs under the unchanged $2 allowance.

Verification: regression tests reproduced both the trailing-model loss and malformed
JSON regex inference. After the fix, all 113 proxy tests and proxy typecheck pass.
Independent review found no issues. Deployed only usage.ts after verifying the
Linux file matched its original SHA-256; retained a backup. Resumed Hermes now
records matching requested/served identities past the old failure point.

Full-suite verification exposed an existing SSE-test race: it read the event file
before asynchronous recording finished. The test now uses the existing flush
callback before reading evidence; production streaming behavior is unchanged.
