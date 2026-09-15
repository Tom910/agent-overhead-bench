# S6 — Streamed release logs implementation plan

Status: implemented and verified (2026-09-07), after S5 commit `8c6ec93`.

**Goal:** Freeze and bind complete large log artifacts without a whole-file
Buffer or string, preserving the existing release redaction and evidence gates.

**Architecture:** A report-local fd-to-fd copier uses 64 KiB reads and a UTF-8
state machine. Unresolved credential labels and whitespace may be written to the
private destination while its byte offset is retained; confirmation truncates
back to that offset and emits the redaction marker. Secret token bodies are
never written. Failed candidates remain unchanged, so no unbounded whitespace
buffer or temporary spool is needed. Archive hashes use bounded descriptor reads.

**Tech stack:** Strict TypeScript and Node built-ins; no added dependency.
**Spec:** Existing `S6-report-plan.md` release boundary and the remaining archive
consumer explicitly identified in `S5-streamed-run-logs-plan.md`.

## Constraints

- Implement only S6. The ongoing paid timeout diagnostics retain their S5 code.
- No changes to C1–C4, derived equations, price accounting, source-review gates,
  official eligibility, or publication status. No provider requests in tests.
- Preserve `RELEASE_SECRET` matching exactly, including `/gi`, preceding ASCII
  alphanumeric exclusions for SK tokens, leftmost matches and failed candidates.
- Preserve containment, `O_NOFOLLOW`, regular-file checks, private destination
  permissions and descriptor closure. Copy from the already-validated descriptor.
- This bounds log copying/redaction/hashing, not C1/JSON parsing or event parsers.

## Task 1: Redacted and raw evidence copying

Files: new `packages/report/src/release-log.ts` and `release-log.test.ts`;
modify `freeze.ts` and `from-results.test.ts`.

Interfaces:
```ts
redactReleaseLog(text: string): string;
copyRedactedReleaseLog(sourceFd: number, destinationFd: number): void;
copyRawEvidence(sourceFd: number, destinationFd: number): void;
```
Descriptors remain caller-owned. All writes handle short writes, use explicit
positions and throw typed `ConfigError` on read/write/truncate failure.

- [x] Add an integration regression using a 2 MiB stdout log and rejecting
      Buffer string conversions above 1 MiB; confirm existing freeze fails.
- [x] Move the complete-string release regex unchanged into `release-log.ts`
      for JSON values and parity tests. Implement bounded log copying.
      The scanner retains at most a possible prefix, a short SK candidate, and
      one 64 KiB decoded block. States distinguish SK candidate/body, required
      Bearer whitespace/body, assignment separator/value whitespace/optional
      quote/body, and normal text. Retain the prior original-input character
      for SK lookbehind; rescan failed short SK candidates from their second
      character. Use `StringDecoder` and avoid splitting surrogate pairs on emit.
- [x] Preserve unresolved whitespace by remembering destination byte position:
      `ftruncateSync(destinationFd, candidateStart); position = candidateStart`
      before emitting `[redacted]` only when a token actually confirms a match.
      Failure/EOF keeps provisional non-secret bytes. Never write token bodies.
- [x] In `copyEvidence`, open a guarded regular destination descriptor and call
      the streaming functions for text/raw copies. Retain JSON-specific parsing.
      Close both source and destination in `finally`, including validation errors.
- [x] Test every byte/prefix split; case-insensitive matches; nested short SK
      failure (`sk-sk-or-a`); original-input lookbehind; token terminators;
      long benign lines, secret bodies, valid/failed whitespace candidates at
      EOF and mid-file; split/invalid UTF-8; partial writes and typed failures.
      Compare output with `redactReleaseLog(input)` across deterministic cases.
- [x] Run `npm test --workspace @aob/report` and report typecheck.

## Task 2: Bounded archive binding hashes

Files: `packages/report/src/archive-binding.ts` and its tests.

- [x] Demonstrate a regression rejecting whole-file reads of a large artifact.
- [x] Hash regular files with `openSync`/`readSync` in 64 KiB blocks, preserving
      exactly the existing digest, sorted entry order and aggregate identity.
      Keep symlink rejection, typed failures and descriptor closure.
- [x] Compare binding digests with the original algorithm on a fixture and run
      archive-binding tests. Do not change manifest fields or binding semantics.

## Task 3: Verify and integrate

- [x] Run a local no-provider full freeze + binding probe with ASCII stdout
      above Node's maximum string size; verify the entire output hash and tail,
      record sampled peak RSS and retain the private evidence.
- [x] Run workspace tests/typecheck/lint/diff checks and independent review.
      Fix actionable findings, rerun affected checks, update this plan/index and
      handoff, then commit and integrate the S6 work separately from S5.

## Evidence

The full workspace suite passed 605 tests before the final typed-close cleanup;
the final `from-results` suite passed all 33 tests, including its new close-error
regression. Workspace typecheck, lint, and diff checks passed; report typecheck
also passed after that final cleanup. Independent review passed 300,000 scanner
parity cases and 100,000 copier cases with split/invalid UTF-8 and short I/O.

The local full freeze and archive-binding probe retained 536,936,479 redacted
bytes, above Node's 536,870,888 string limit. Its entire output hash matched
`3f97f95ba9b79993151ee5750fc6482c53e1d6d6fc515b645e411633d84135cb`,
including the tail sentinel and UTF-8. OS-reported maximum RSS was 186,256 KiB.
Private probe files are under `scratch/release-log-probe` in the implementation
worktree. No provider calls or publication occurred in this S6 stage.

Integrated separately as `0e7a074` after both active timeout attempts terminated.
The real completed 884,416,014-byte log also passed sanitized copying, report
generation and archive binding. The failed 1,002,364,223-byte log copied and
bound successfully; headline reporting intentionally refused its incomplete
spend, as specified by the existing accounting gate.
