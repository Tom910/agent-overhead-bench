# S5 — Verifier log capture follow-up

Status: implemented and independently verified (2026-09-07), after S6 log/archive work.

The shared Docker command helper's new 1 MiB control-output cap also reaches
native verification commands. These commands produce workload output, so that
cap could turn a verifier's normal exit into a harness failure. Correct this
boundary before the next fresh paid attempt; retain running diagnostics on their
original code.

## Scope and decisions

- Native Docker verifiers use the existing incremental private log writer,
  passing output sinks to `runDocker` and eliminating full-output capture.
  Stdout grows through the redactor in the final log while raw stderr goes to
  a private 0600 temporary file in an owned 0700 directory. Keep the stdout
  redactor open until stderr has been appended with bounded reads, preserving
  stdout-then-stderr ordering and secret matching across that concatenation.
  Decode each stream independently with `StringDecoder`, as the old two UTF-8
  conversions did. Remove the private temporary file in `finally`.
  Live stderr must never interrupt stdout redaction state; delayed append must
  still suppress a token split across the final stdout/stderr boundary.
  Keep
  native command, image, network, timing boundaries, exit and timeout semantics.
- Open logs before verifier timing begins and close on all paths. Read/parse
  errors and disk failures remain typed; cleanup remains runner-owned.
- The legacy script verifier already uses `spawnSync` with a 1 MiB per-stream
  output ceiling. Preserve that existing boundary, while allowlisting its small
  metadata suffix above the generic control limit. Do not apply a smaller new
  cap or rework its measurement clock in this follow-up.
- Keep actual Docker control commands at 1 MiB. No dependency, C1–C4 field,
  measurement equation, provider call in tests, or source/verifier gate change.

## Acceptance

- [x] RED regression: a native verifier producing over 1 MiB completes with
      its original exit and retains the full log, which grows before exit.
- [x] GREEN native streaming integration, timeout/error finalization, and
      legacy script metadata/control-cap compatibility tests.
- [x] Runner tests/typecheck, independent review, plan/index/handoff update,
      separate commit, and integration after the active diagnostic terminates.

## Evidence

All 153 runner tests pass, including eight verifier-log regressions, with
strict runner typecheck and clean diff checks. Both the native 1 MiB limit and
legacy metadata-suffix regressions demonstrated RED before implementation.
Review also demonstrated two stdout/stderr boundary leaks; the final single
redactor preserves state across concatenation and passed those regressions,
interleaved-chunk tests, separate malformed UTF-8 decoding, private spool
permissions/removal, timeout and typed I/O failure tests. Independent final
review found no remaining issues. No provider calls occurred in these tests.
