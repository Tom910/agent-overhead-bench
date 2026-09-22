# S5 attempt evidence retention implementation plan

> For agentic workers: use subagent-driven-development for implementation and review; use verification-before-completion before claiming success.

**Goal:** Make retries auditable and preserve the candidate before a verifier can mutate it.

**Architecture:** Extend the existing cell/attempt lifecycle with private file evidence and an integrity manifest. C4 remains unchanged. Copy evidence before staging or truncating a new attempt. Capture candidate changes outside the measured agent interval against the immutable prepared task, independent of the agent's Git history.

**Tech stack:** Strict TypeScript, Node filesystem/crypto/child-process, existing Vitest. No new dependencies.

**Spec:** [Approved audit](harness-benchmark-audit-2026-09-22.md), priorities 1 and 2; [package order](benchmark-validity-packages-2026-09-22.md).

## Global constraints

No inference or paid runs. Preserve old C4 bytes and existing outcomes. Private provider evidence and candidate patches must not be exported by the public report copier. Retention must reject symlinks/path escapes and must not silently overwrite different evidence. Use bounded subprocesses. Legacy evidence may be incomplete: record missing files rather than invent them. Existing resume/spending rules remain in force.

## Review focus

Crash/resume idempotence; first-attempt evidence surviving a second staging/proxy open; private file permissions; retry directory traversal and overwrite safety; capture before verification, including failed/timed-out adapter results; unchanged measured timing; honest unavailable capture metadata.

### Task 1: Preserve private evidence across retries

**Files:** `packages/runner/src/matrix.ts`, `packages/runner/src/cell.ts`, new `packages/runner/src/attempt-evidence.ts` and focused tests, existing matrix/cell tests as needed.

**Interface:** Central private attempt artifact inventory, a SHA-256/byte-size manifest for copied regular files, and an idempotent `preserveAttempt` operation. Include existing artifacts plus `verify.sh`, `agent-conditions.json`, `verifier-conditions.json`, `execution-conditions.json`, `events.jsonl.upstream.jsonl`, and future `candidate.patch` / `candidate-evidence.json`. Missing files remain explicit. Preserve raw bindings without rewriting them.

- [x] Add failing behavior tests: first attempt evidence is byte-identical after retry, including condition bindings and provider settings; legacy missing evidence is explicit; symlink and conflicting overwrite are rejected; identical repeated preservation is safe.
- [x] Implement private retention with restrictive permissions and a stable manifest. Stage cleanup includes all per-attempt outputs, especially stale upstream evidence when a new attempt fails before proxy startup.
- [x] Run focused runner tests and runner typecheck. Record the failing test observed before implementation and final results.
- [x] Commit only this task's changes and report the commit and any limitations.

### Task 2: Capture candidate patches before verification

**Files:** `packages/runner/src/cell.ts`, new `packages/runner/src/candidate-evidence.ts` and focused tests; Docker lifecycle tests if needed.

**Interface:** Private `candidate.patch` plus `candidate-evidence.json` with capture status, immutable prepared-base identity, patch hash/size and original agent/verifier image identities where available. Do not trust mutable workspace Git refs. Capture before verifier execution on normal, nonzero and timeout outcomes. If no trustworthy capture is possible, record an explicit unavailable reason and do not manufacture an empty successful patch.

- [x] Add failing tests using temporary prepared repositories and deliberately mutated agent Git metadata; a mutating verifier must not change the retained original patch. Verify binary/add/delete changes and excluded harness state.
- [x] Implement bounded, credential-free, private capture outside the agent measurement interval. Do not execute repository hooks or trust the candidate Git configuration.
- [x] Ensure Task 1 retention preserves the candidate evidence on retry. Document image digests as identity, not a claim that image bytes have been archived.
- [x] Run focused cell/evidence tests and runner typecheck, then commit and report.

## Validation record

Implemented and locally verified: Task 1 retention plus reviewed empty-setup export correction, and Task 2 candidate capture. The affected runner suite passes 255 tests; strict runner types and repository lint pass. These local fixtures are engineering checks, not empirical benchmark qualification. Root separately ran all 19 retention tests on isolated Linux. Exact image-byte archival and public sanitized condition projections belong to their own freeze stage; this stage preserves private source evidence and records image identities without claiming image availability.

## Task 1 review follow-up: empty setup attempt export

The new explicit all-missing private manifest exposes a pre-existing release
assumption that every retry directory contains C4. Extend only generic sanitized
provenance copying: a strictly validated version-1 manifest declaring every known
artifact missing, with no other directory entries, becomes public unmeasured
retry metadata with unknown spend and no fabricated C4. Keep this outside the
measured retry tree. Partial evidence without C4 remains rejected. Official
ledger/completeness gates remain unchanged. Add an actual setup-throw → explicit
resume-success → export regression and adversarial manifest/partial-evidence
checks. No public copying of private manifests/provider/candidate bytes.
The private inventory/schema writer and the strict versioned export reader must
be updated together when adding artifacts; the actual matrix preservation →
export regression detects drift. Do not accept arbitrary manifest artifact keys.

Task 1 validation: 239 runner tests and runner typecheck passed. The review
regression first failed at missing retry `run.json`, then passed with eight
malformed-manifest variants and nonempty provider-without-C4 evidence rejected.
After the export fix: 314 report tests, report typecheck, five lifecycle/freeze
script tests, repository lint and diff checks passed. An independent root probe
also observed two attempts, zero provider requests, final `done`, and all four
original private sidecars retained. Task 2 completion is recorded below.


## Task 2 implementation and verification

The runner snapshots the staged prepared workspace before adapter execution,
then captures a private binary Git no-index diff before verification, after
adapter timing and proxy observation handling. It does not use the candidate's
Git refs, index, hooks, user configuration, textconv or external diff commands.
System Git receives a fresh credential-free environment. File content, executable
modes and symlink target bytes are preserved; link targets are never traversed.
The baseline projection is identified by a deterministic SHA-256 over visible
file/link contents and modes, alongside the declared prepared base revision.

This is a `prepared-visible-files-v1` projection, **not a claim of byte identity
with the native grader's Git-ignore-aware model patch**. Ignored generated files
and dependencies may be present in this projection. Git metadata is excluded at
every depth. Known runner logs and harness-state root paths are excluded only
when absent from the prepared baseline, preserving legitimate source files with
those names. No mutable candidate ignore settings govern evidence collection.

Each snapshot has 256 MiB / 100,000-entry / 64-level limits and checks a 30-second
monotonic deadline between filesystem operations. Git has a 30-second subprocess
timeout and 16 MiB output bound. Limit, unsupported special-file and subprocess
failures record unavailable evidence with no fake empty patch, without changing
native task outcome. An actually unchanged snapshot may produce a valid empty
patch. Private output files use mode 0600; scratch snapshots use mode 0700.
Filesystem stalls are not a hard realtime deadline guarantee.

Candidate metadata is explicitly unbound (`run_sha256: null`) before C4 exists.
After the unchanged C4 bytes are written, a best-effort finalizer binds their
exact hash only if metadata and candidate patch still match the captured bytes.
Retries with the same run ID retain distinct original C4/patch/hash bindings.
If private storage cannot even write its failure record, C4 outcome still remains
unchanged; absent/invalid/unbound evidence is not a successful capture attestation.
Image identities are recorded, with `image_bytes_archived: false`.

TDD: three real host lifecycle tests first failed for missing candidate.patch
(normal/error/timeout); the symlink replay test first failed with unavailable
capture; three lifecycle binding checks first failed with missing C4 hashes.
All now pass. Tests additionally replay added/deleted/binary/executable changes
against prepared contents after agent Git history/config mutation; reject hook,
external-diff and PATH execution; check outside/dangling symlink targets, tracked
stdout.log preservation, honest size/Git-output failure, a mutating verifier,
Docker error/timeout results, retry retention and same-run-ID C4 binding.
Focused tests/types passed, then the entire affected runner suite ran once:
**255 passed, 20 files**. Runner typecheck, repository lint and diff checks pass.
No inference, provider calls, paid runs or empirical benchmark qualification ran.

Independent closeout review approved Task 2 at `e01132a`, including additional
Git attribute and file/directory/link transition replay probes. Isolated Linux
candidate/integration tests passed 20/20. Full repository verification then
passed 859 package tests and 159 script tests; two Docker-dependent script tests
were skipped in that run. All workspace typechecks passed. No model calls or
new empirical attempts were performed.
