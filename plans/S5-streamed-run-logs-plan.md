# S5 — Bounded run log storage

Status: implemented and verified with real diagnostic retries (2026-09-07).

The authorized 900-second Pi diagnostic failed with `ERR_STRING_TOO_LONG` at
`runDockerCommand` when converting its accumulated stdout Buffer to one string.
C1, state, and workspace survived, but no normal C4 or stdout log was produced.
The simultaneous 1800-second attempt failed at the same conversion. Its separate
private Docker capture retained 955,471,503 bytes. Preserve both attempts unchanged.

## Scope

- Add a reusable bounded UTF-8 log writer to the adapters package and consume
  it from measured Docker and host execution. No whole-output Buffer/string,
  no log truncation, no new dependency, no C1–C4 schema or equation change.
- Stateful generic-secret redaction suppresses arbitrarily long `sk-` and
  `Bearer` tokens across chunks. Ordered bounded literal replacements preserve
  configured extra-secret handling. An unfinished `Bearer` plus whitespace
  is conservatively redacted at EOF; document and test this privacy-preserving
  difference from complete-string matching. Preserve split UTF-8 decoding.
- Write complete redacted logs incrementally and close them on normal exit,
  timeout, parser failure, and spawn failure. Observe C3 chunks before log I/O.
  Use bounded control-output capture for small Docker control commands and
  disable whole-output accumulation for measured agent stdout/stderr.
- Copy already-redacted artifact files with filesystem copying, including the
  duplicate structured tool log, without reading them into a string or Buffer.
- Keep clock boundaries, verifier selection, provider routing, price accounting,
  and failure classification intact. Disk failures remain typed failures.

## Verification

- [x] Demonstrate a failing regression before the implementation: output logs
      must grow before command exit and oversized output must never require
      a whole-output string conversion.
- [x] Cover every chunk split of generic/extra secrets, split UTF-8, long
      secret bodies and benign lines, EOF handling, extra replacement order,
      stdout/stderr separation, and lifecycle cleanup.
- [x] Run focused suites, strict typecheck, required workspace checks, and an
      independent review.
- [x] Run a local large-output probe above Node's string limit with bounded
      memory and complete file output; no provider requests in tests.
- [x] Repeat the affected real timeout diagnostic within the remaining
      authorized budget after integration; keep failed original evidence.

Report freezing has a separate whole-log string consumer. Address it in its
own subsequent stage after S5; do not claim a giant-log archive is supported
solely from this runtime fix. Do not change the ongoing diagnostic's code.

## Local evidence

The complete suite passed 594 tests before final review corrections; focused
adapter/Docker tests cover the final typed failures and delayed cleanup path.
Strict workspace typecheck and lint pass. Independent review exercised 100,000
randomized chunked redaction comparisons and identified two corrected issues:
log setup must precede the measurement clock, and forced-stop cleanup must keep
accepting pipe output until completion. The latter has a RED-to-GREEN regression.

The local no-provider probe wrote 536,936,468 bytes, exceeding Node's 536,870,888
character string limit with ASCII output, and verified the complete file SHA-256
including its UTF-8 tail. Peak sampled RSS was 101,957,632 bytes. Probe artifacts
remain private under `scratch/streamed-log-probe` in the implementation worktree.
This bounds log storage, not structured-event parser buffers for huge JSON lines.

The fresh 900-second attempt retained a normal timeout C4 and 1,002,364,223
stdout bytes. Its final interrupted request makes spend unavailable as intended.
The 1800-second attempt completed after 1727.709 seconds, passed the native
verifier in 9.960 seconds, and retained 884,416,014 stdout bytes. All 92 requests
have usage; C4 estimated spend is $0.13927733. Private checksummed evidence is
under `scratch/timeout-probe-streamed-20260907`; original failed attempts remain
unchanged. Concurrent timing is diagnostic and is not official release evidence.
