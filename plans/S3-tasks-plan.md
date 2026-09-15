# S3 — Task suite Implementation Plan

> **For agentic workers:** Expand TDD/validate steps when this stage starts. Do not import SWE-bench, Terminal-Bench, or Vetta tasks directly; the selected DeepSWE adapter preserves its declared lineage and remains subject to source-specific review gates.

**Implementation status (2026-08-27):** canonical local suite and validation are done. The task-source adapter normalizes the local prepared tree, excludes private `reference/` material at every depth, emits a deterministic source checksum, and is used by the runner after manifest validation. `aob-task-manifest` and `aob-task-validate` expose the materialized-task provenance and verifier boundary; validation supports both executable scripts and immutable native Docker-command verifiers. Runtime manifest validation now rejects unknown or malformed fields with typed configuration errors. Public task-pack preparation now requires and preserves a source-owned native verifier descriptor rather than generating a benchmark-side wrapper. The earlier coding-agent-benchmark candidate is superseded; DeepSWE is the current selected public candidate. Medium-repository coverage, source/license review, calibration, and maintainer sign-off remain open.

**Follow-up implementation (2026-08-26):** a generic `git-canonical` source adapter
and no-dependency preparation CLI are implemented and tested. They clone a reviewed
repository at an exact full revision, select only manifest-listed canonical C2 task
directories, verify their checksums/provenance, and materialize the public run inputs
without copying `reference/`. The prepared local manifest retains the reviewed Git
repository/revision as `source_provenance`. This adds the reusable source boundary
required by S3 but does not choose, import, or endorse any external benchmark corpus.
S7 preflight now also requires every selected task ID to be present in the reviewed
prepared manifest, and the local boundary rejects symlinked task directories.
The preflight verifier now exercises only the selected task directories; unrelated
tasks in the same prepared source tree cannot change the selected run's result, and
the checked-in validation fixture is no longer an accidental S7 prerequisite.
The selected-task validator also rejects symlinked task inputs before running any
verifier commands.

**Goal:** an approved source of 8–10 deterministic, containerized coding tasks so timing and cost can be measured. The checked-in local tasks are original validation fixtures; a publication source may instead be a reviewed public task pack whose source-owned tasks and verifiers pass the same gates.

**Architecture:** Tasks are data. `packages/tasks/<id>/` per C2. A local task-source adapter exposes the roadmap interface (`listTasks` / `prepareTask`) over the prepared tree, copies only public run inputs, and emits source revision plus a deterministic checksum. A `tasks/validate` CLI enforces structure and `verify.sh` determinism. `reference/` is gitignored and never copied into a run workspace.

**Tech Stack:** Task workspaces in Python and TypeScript; vendored deps; `verify.sh`. YAML parser is an allowed dependency for `task.yaml` (justify in the expanded plan: hand-rolling YAML is worse). No other new runtime deps.

**Spec:** North-star §4.3, roadmap C2 and S3.

## Global Constraints

- Inherited from `plans/README.md`.
- Prompts state an outcome, not an approach. No tool-specific phrasing. No hidden knowledge outside the workspace.
- The local adapter is an implementation of the source boundary, not a claim that the current local fixtures are an approved public-source v1 dataset.
- `verify.sh` tests observable behavior (tests / running the program), never diffs against `reference/`. Many correct solutions must pass.
- Local validation fixtures must be original. The publication candidate must retain source-owned task semantics and verifiers. The local fixture covers the common C2 shapes; a source whose native taxonomy differs must preserve that taxonomy in its source manifest and use a documented source-specific composition gate. In either case, both languages are approximately even and the accepted v1 composition includes small and medium repositories (~100+ files, vendored, with irrelevant noise files).
- Expected success ≥ 80% for a competent agent. Expected duration 1–5 minutes.
- Calibration uses **two** different included CLIs once each. Transcripts stay private.

## Contracts consumed / produced

- Consumes: `C2TaskYaml`, `validateC2Task`.
- Produces: `packages/tasks/<id>/{task.yaml,workspace/,prompt.md,verify.sh}` for the local fixture, or a validated `verifier.json` native descriptor for a reviewed public source, plus a local-only `reference/` (gitignored).

## Out of scope

SWE-bench imports, grading beyond pass/fail, IDE agents, network at run time.

## Human review (required)

Maintainer reads every `prompt.md` for realism (~3 h). Calibration split (which tools failed which tasks) is recorded, not papered over.

## Risks

| Risk | Mitigation |
|---|---|
| Suite overfits one harness | Calibrate with two tools |
| Tiny repos understate context overhead | Require medium tasks |
| `reference/` leaks into git | gitignore + validate refuses to pack it into run workspaces |

---

### Tasks

1. **`tasks/validate` CLI.** Checks directory shape; `task.yaml` against C2; `verify.sh` is executable; five consecutive runs on the pristine workspace all fail; five runs after applying `reference/` all pass, same exit codes; timeout ≤ 60s for verify; container-with-network-disabled smoke (or a documented local equivalent until S5 images exist).
2. **Composition table.** Plan 8–10 ids covering language × size × shape before writing prompts. Example skeleton (replace with originals, do not copy this as the suite):

| id | language | size | shape |
|---|---|---|---|
| py-small-testfix-1 | python | small | test-fix |
| py-small-bugfix-1 | python | small | bugfix |
| py-medium-feature-1 | python | medium | feature |
| py-medium-refactor-1 | python | medium | refactor |
| ts-small-testfix-1 | typescript | small | test-fix |
| ts-small-bugfix-1 | typescript | small | bugfix |
| ts-medium-feature-1 | typescript | medium | feature |
| ts-medium-refactor-1 | typescript | medium | refactor |

3. **Author each task.** Vendored deps. Deterministic tests (no clock/locale/random). Noise files on medium repos.
4. **Calibration.** After S2 has at least two keep-tools, run each candidate task once on each. Rework tasks that miss 1–5 minutes or fail both. A task one tool fails and the other passes may ship if its verifier is fair; record it. Calibration and maintainer sign-off are publication gates for either an authored suite or a public pack.

### Follow-up: reviewed Git source preparation

**Files:**
- Modify: `packages/tasks/src/source.ts`
- Modify: `packages/tasks/src/index.ts`
- Create: `packages/tasks/src/source-cli.ts`
- Modify: `packages/tasks/package.json`
- Modify: root `package.json`
- Test: `packages/tasks/src/source.test.ts`

**Contracts:** consumes a `git-canonical` manifest containing repository, full commit
revision, license notes, task IDs, relative canonical task paths, task source revisions,
and source checksums; produces a prepared local C2 tree plus a local manifest suitable
for S5. The local manifest retains the reviewed checkout in `source_provenance`. No new npm
dependency is needed: Git is invoked with argument arrays and the existing Node APIs
provide filesystem/hash operations.

**Acceptance tests written before implementation:**
- [x] A temporary Git repository at a fixed commit can be checked out and one selected
  canonical task is materialized with matching checksum and C2 provenance.
- [x] A non-full/mismatched revision, path escape, symlink, checksum mismatch, or
  `local-development` task is rejected before preparation is usable.
- [x] Private `reference/` material is not copied into the materialized task.
- [x] The CLI writes a manifest that `validateLocalTaskManifest` accepts and fails with a
  typed configuration error for malformed arguments.

**Out of scope:** selecting public repositories or task IDs, performing license review,
running calibration, importing any external task corpus, or changing S5 timing.

### Superseded candidate: coding-agent-benchmark source adapter

The section below records the earlier public-pack evaluation and implementation.
It is retained as audit history only; it is not the selected v1 source and must
not be used for an official run. DeepSWE, described below, supersedes it.

The source-selection audit found a public, permissively licensed task pack that fits
the primary short-task purpose better than the repository-scale candidates reviewed
in parallel. The selected source is `https://github.com/usamadar/coding-agent-benchmark`
at commit `6f46d7c3712164276caef3102ddc07a1310e6276` (MIT, copyright Usama Dar).
The source contains task metadata, prompts, public starter repositories, and held-out
tests. No task contents are copied into this repository; preparation checks out the
source revision and materializes the selected entries locally before timing begins.

**Selected v1 entries (source IDs are retained in provenance):**

| local id | source task | C2 language | C2 shape | regime |
|---|---|---|---|---|
| py-small-bugfix-1 | `00-smoke-test` | python | bugfix | short |
| py-small-bugfix-2 | `01-python-bugfix-csv` | python | bugfix | short |
| ts-small-feature-1 | `03-typescript-feature-table-filter` | typescript | feature | short |
| py-small-feature-1 | `04-python-feature-pagination` | python | feature | short |
| ts-small-feature-2 | `05-typescript-scratch-task-queue` | typescript | feature | short |
| py-small-refactor-1 | `07-python-refactor-monolith` | python | refactor | short |
| ts-small-refactor-1 | `08-typescript-refactor-callbacks` | typescript | refactor | short |
| py-small-feature-2 | `10-fullstack-angular-python` | python | feature | short |

The source declares the last entry as a Python task with a TypeScript test surface;
that declaration is preserved rather than inventing a second language category.
The source's `scratch` label is normalized to C2 `feature` because the task's
observable contract is implementation of a new queue feature. All selected workspaces
are compact, so the primary suite is intentionally a short-task regime; the
medium-repository requirement remains an explicit follow-up source-quality gate and
must not be silently claimed as satisfied by this pack.

**Preparation contract:** add a no-dependency `git-taskpack` adapter. It must verify
the full source commit, selected task IDs, safe paths, source checksums, and the
source MIT license note; copy only each public starter `repo/` into `workspace/`;
copy the prompt; and preserve the source-owned native `verifier.json` descriptor.
The adapter must not generate a benchmark-side wrapper or copy held-out tests into
the staged workspace. The resulting local manifest retains the source repository,
revision, source task ID, and checksum. It is not eligible for S7 until the
verifier polarity and calibration checks pass.

**Acceptance tests written before implementation:**

- [x] A fixed source fixture with `repo/`, `tests/`, `prompt.md`, and metadata can be
  converted to a C2 task and its hidden tests remain absent from `workspace/`.
- [x] The adapter rejects a non-full/mismatched revision, path escape, symlink,
  checksum mismatch, unknown selected task, or unsupported test language.
- [ ] The prepared task's pristine verifier fails and the source's reference result
  passes without using private solution files.
- [x] The checked-in public manifest contains exactly the eight selected IDs and the
  exact source revision, with no prompt/test payloads.

**Human review required:** maintainer reviews the source license and each selected
prompt/test boundary, then records calibration results from two different included
CLIs. The prepared manifest now carries four explicit review gates plus a
hashed evidence-file and reviewed-task-ID binding, and S7 preflight rejects the
official run until all four are recorded as true.

**Historical gate status (2026-08-28):** the adapter contract and mechanical
fresh-source checks pass, but the official preflight now fails closed on the
explicitly pending review record. The provisional DeepSWE slice has eight short
tasks with a 4-Python/4-TypeScript split, one small repository total (`superjson`)
and seven medium repositories, and no published reference-solution results. The slice therefore
remains a validated preparation candidate, not an accepted publication-grade v1
suite.

**DeepSWE source audit (2026-08-28):** the selected DeepSWE revision contains
113 tasks, but its native metadata has 106 `feature_request`, 4 `bugfix`, and 3
`enhancement` entries, with no `refactor` or `test-fix` entries. Native category
balance is therefore not a valid additional gate for this source: forcing the
rare categories would select unsuitable tasks or require falsifying source
metadata. The preparer preserves `source_category`, validates its C2 shape
mapping, and the report must publish the selected category counts (including
zeroes). The provisional eight-task calibration slice is four Python and four
TypeScript tasks, with one small repository total and seven medium repositories;
all eight are source-native `feature_request` entries. It remains
unapproved until the selected subset, source and upstream licenses, verifier
polarity, two-CLI calibration, and maintainer review are complete. The shortest
provisional calibration tasks are not approval evidence: IPython, FastAPI,
Awilix, and Mashumaro have missed the five-minute short-regime bound. This is
recorded as calibration evidence, not a reason to extend the short timeout
silently. Tomlkit's native verifier initially failed because its upstream
`tests/toml-test` submodule was absent; preparation now initializes recursive
submodules, and the fixed polarity check is 0/964 pristine and 964/964 P2P plus
60/60 F2P for the candidate solution.

**Candidate replacement diagnostics (2026-08-28):** the provisional
`true-myth-iterable-collection-combinators` TypeScript task was rejected for the
short regime after both Codex and Hermes cells exhausted the 300-second bound
and were quarantined. The Codex cell spent `$0.02472507`; Hermes spent
`$0.025081095`. The provisional Tomlkit Codex cell also exhausted the bound and
was quarantined after `$0.018867945`. These are diagnostics only. The
replacement candidate `ofetch-per-origin-circuit-breaker` was then prepared at
the same DeepSWE revision and passed deterministic verifier polarity: pristine
exit 1 as expected, then the reference solution passed 13/13 P2P and 47/47 F2P
with partial 1.0 and binary 1. Its Codex diagnostic also exhausted both
300-second attempts and was quarantined after `$0.015922395`, so Ofetch is
rejected for the short regime. The next replacement must pass polarity and
short-regime calibration before it enters the provisional eight-task slice.

SuperJSON then passed clean source polarity from a fresh upstream checkout:
pristine exit 1, followed by 116/116 P2P and 80/80 F2P reference tests passing
with partial 1.0 and binary 1. It is now the provisional TypeScript small-task
replacement; its two-CLI short-regime calibration remains open. A real Codex
diagnostic at the pinned `z-ai/glm-5.3-flash` endpoint exhausted both 300-second
attempts and was quarantined after `$0.015474885`; it is therefore not short-
regime calibration evidence.

**Verifier capture correction (2026-08-28):** the DeepSWE verifier now marks
non-ignored untracked workspace files as intent-to-add before extracting the
model patch, while excluding adapter-private `.aob-home`, `.aob-codex-home`,
and `.aob-qwen-home` state. This prevents new source files from disappearing
from grading when an agent has not committed them. The behavior has a focused
regression test and was validated against the timed-out Ofetch workspace.

**Verifier-polarity correction (2026-08-28):** DeepSWE's source-owned grader
returns shell success for both a zero-reward pristine run and a winning run.
The generated native verifier now preserves a nonzero test failure and then
requires `reward.json.reward == 1`. A fresh SuperJSON image passed stable
pristine-fail and reference-pass checks (`116/116` P2P and `80/80` F2P), so the
prepared source can satisfy the repository's fail-closed verifier contract.

**Report-path correction (2026-08-28):** DeepSWE's parameterized pytest IDs
record `/app/...`, while the benchmark mount is `/work/workspace`. The
preparer now inserts a source-boundary-only JUnit ID normalization before the
DeepSWE grader runs. A fresh `psd-tools-blend-range-api` verifier then passed
979/979 P2P and 45/45 F2P with reward 1; the earlier 551/979 result was a
false grading failure caused solely by this path spelling mismatch.

**Automated polarity audit complete (2026-08-28):** every task in the
provisional eight-task slice now passes pristine-fail and reference-pass checks:
`psd-tools` 979/979 + 45/45, `cattrs` 7/7 + 69/69, `textual` 6/6 + 20/20,
`tomlkit` 964/964 + 60/60, `ink` 49/49 + 25/25, `ts-pattern` 6/6 + 85/85,
`happy-dom` 9/9 + 14/14, and `superjson` 116/116 + 80/80 (P2P + F2P).
This closes the automated verifier gate only; source-task review, two-CLI
short-regime calibration, and maintainer sign-off remain open.

**Agreed release-candidate shape (2026-09-03):** use the eight-task selection
recorded in `plans/s3-deepswe-review.json`: four Python and four TypeScript
tasks, with two small and six medium repositories. The TypeScript medium
`ts-pattern-match-each` entry is replaced by the MIT True Myth task
`true-myth-iterable-collection-combinators`. The matching license evidence is
in `plans/s3-deepswe-license-review.json`; the explicit short-regime
preparation ranges are in `plans/s3-deepswe-release-duration-map.json`. This
changes the selected shape only. It does not promote any review flag or claim
calibration.

**Paid calibration probes (2026-08-28):** the first post-fix Hermes probe for
`cattrs-partial-structuring-recovery` timed out at `300032 ms` and spent
`$0.012768715`; the cap prevented its retry. The two-CLI probe for
`happy-dom-deterministic-intersectionobserver` timed out at `300022 ms` for
Hermes (`$0.0082631`) and `300021 ms` for Codex (`$0.0162819`). These are
diagnostic C4 artifacts, not official results; cattrs needs another CLI
calibration before disposition, and Happy DOM is rejected from the short
regime pending replacement.

**Preparation and calibration diagnostic (2026-08-29):** the DeepSWE
preparer's reference-polarity phase initially failed when invoked with a
relative source checkout path: `git -C` resolved the solution patch inside the
temporary upstream checkout. The script now canonicalizes the source path
before any `git -C` operation, with a regression test. Fresh preparation of
`psd-tools-blend-range-api` and `superjson-error-stack-serialization` then
completed five reference samples per task and produced valid source manifests.
One bounded two-CLI GLM Flash run on SuperJSON (300-second short timeout,
`$2` hard cap) timed out in Hermes and Codex, including their single retries;
known spend was `$0.022703025`. It is diagnostic evidence only and does not
complete the required two-CLI short-regime calibration.

**Verifier dependency correction (2026-08-28):** a DeepSWE TypeScript candidate
exposed two verifier-boundary bugs. First, its environment installs dependencies
below `backend/node_modules` and `frontend/node_modules`; a shared `PATH` made
the frontend suite resolve the backend Vitest and fail to load `jsdom`. Second,
dependency links created before `git clean -fd` were deleted. The preparer now
keeps the immutable environment dependencies in `/app`, creates writable
workspace-local symlink forests after patch capture/cleanup (including hidden
`.bin`), and rewrites the copied source verifier to call each package's local
Vitest binary. The runner and pristine validator also make the workspace bind
mount explicitly writable because the verifier applies patches there. The
rechecked Claude delegation reference now passes 31/31 P2P and 7/7 F2P with
reward 1; no paid calibration result was used for this correction.

**Verifier workspace-boundary correction (2026-08-28):** preparation initially
created the copied hidden verifier context below the upstream checkout, which
would have exposed verifier inputs and polluted model.patch capture. The
context now lives at a sibling path under the temporary preparation directory;
the materialized workspace is clean at the pinned upstream commit and contains
no `test.patch`, `solution.patch`, or grader files.

The exact source/license and composition audit is preserved in
[`s3-deepswe-source-audit.json`](./s3-deepswe-source-audit.json). Its
review flags are intentionally non-approving; the file is evidence for the
eventual maintainer review, not a substitute for sign-off.

**Out of scope:** copying source tasks into `packages/tasks`, broadening C2 language
or shape enums, installing source dependencies during an agent cell, or changing the
measurement model.

**Implementation note:** `aob-task-source MANIFEST_JSON CHECKOUT_DIR OUTPUT_DIR [TASK_ID ...]`
is the no-dependency preparation command. The Git manifest records the checkout
revision separately from each task's C2 `source_revision`, so provenance remains
unambiguous when a task's upstream revision differs from the reviewed task-tree
snapshot.

### Selected candidate: DeepSWE source and calibration slice

DeepSWE is the selected public candidate for the next calibration slice. Its task
tree is not shaped like the earlier generic task-pack adapter: each task contains
`task.toml`, `instruction.md`, a pinned upstream repository commit, an environment
image, and a hidden-test Docker build context. The calibration preparer therefore
materializes the pinned upstream checkout into the agent workspace and builds a
task-specific verifier image ahead of measurement. The hidden `tests/` directory
and reference solution never enter the workspace.

The calibration slice is deliberately small and uses one task per language. The
initial pair (`fastapi-deprecation-response-headers` and
`awilix-async-container-initialization`) was rejected for the short regime after
both failed to complete in 300 seconds. Follow-up diagnostics for
`ipython-session-bundle-replay` and `mashumaro-field-aliases` also reached the
pinned endpoint but timed out at the same bound; the TypeScript
`truemyth-optional-parser` diagnostic was stopped during retry and is not a
calibration pass. These are calibration results only; they are not eligible for
the official composition until the duration, verifier, license, source-shape,
and maintainer-review gates pass.

**Acceptance tests / checks:**

- [x] Both workspaces are exact upstream base commits and include `.git` so the
  verifier can derive the model patch without exposing hidden tests.
- [x] Each verifier image is built before the measured run, digest-pinned, and
  passes pristine-fail / known-solution-pass checks.
- [ ] A single Docker Codex cell completes with the approved model and stays under
  the explicit spend estimate; no second paid cell starts if preparation or
  verifier validation fails.
- [ ] The resulting C4 artifact retains DeepSWE revision, upstream repository,
  base commit, task id, verifier image digest, and short-regime calibration
  status.

**Calibration result (2026-08-27/28):** preparation and verifier checks passed, and
the Codex → local proxy → OpenRouter → `z-ai/glm-5.3-flash` route produced
successful model requests with usage. The IPython Codex cell timed out at the
300-second short-regime limit on both allowed attempts, producing a valid C4
timeout artifact with DeepSWE and upstream provenance; total spend was
$0.0291. The TypeScript candidate was then prepared and its diagnostic was
stopped during the retry after it showed the same unproductive behavior; it is
not a calibration pass. These measured cells are diagnostics, not v1 data. The
next selection must use a task that actually completes in the short regime or
explicitly define
a separate extended regime; it must not simply raise the short-regime timeout.

**Follow-up calibration slice (2026-08-28):** the prepared DeepSWE pair
`happy-dom-abort-pending-body-reads` (TypeScript) and
`httpx-multipart-response-parsing` (Python) passed source checkout, verifier
image, and provenance preparation. One Codex repetition per task was started
through the real OpenRouter route with `z-ai/glm-5.3-flash`; both exhausted the
300-second short bound without a passing verifier result. The observed provider
spend was `$0.018277085`. The first Happy DOM attempt is preserved as a valid
timeout C4 under the runner's retry evidence; the interrupted retry is not
counted as a result. These remain diagnostics only, and the temporary verifier
images were removed after the run.

**Dateutil cross-CLI diagnostic (2026-08-28):** the prepared small Python
`dateutil-rfc5545-timezone-interop` task passed checkout, source-boundary, and
pristine/reference verifier polarity checks. One Codex cell and one Hermes cell
were then run through the real local proxy and OpenRouter route with the pinned
`z-ai/glm-5.3-flash` model. Both tools produced valid proxied model traffic and
usage, but both attempts exhausted the 300-second short bound, retried once,
and were quarantined without a passing verifier result. The exact runner
spends were `$0.024559055` (Codex) and `$0.01548531` (Hermes), `$0.040044365`
combined. Their timeout C4 artifacts retain the DeepSWE revision, upstream
repository, base commit, task and verifier digests, model, host, and price
book. This is diagnostic evidence only: it does not satisfy two-CLI
calibration, and it rules out this task for the short-regime official subset
unless a separately approved extended regime is introduced.

**SuperJSON replacement diagnostic (2026-08-28):** the TypeScript
`superjson-error-stack-serialization` task passed pristine/reference verifier
polarity (0/116 pristine; 116/116 P2P and 80/80 F2P on the reference solution).
A real Codex cell through the pinned `z-ai/glm-5.3-flash` route exhausted both
300-second attempts and was quarantined after `$0.015474885`. It is not
short-regime calibration evidence; the task remains only a provisional source
replacement pending a successful two-CLI calibration.

**ts-pattern replacement diagnostic (2026-08-28):** the TypeScript
`ts-pattern-match-each` task passed the corrected source-boundary and reference
verifier checks (6/6 P2P and 85/85 F2P). Codex then exhausted both 300-second
short-regime attempts and was quarantined after `$0.01904972`. This is
diagnostic evidence only and rejects the task for the short-regime subset; no
Hermes attempt was started after Codex failed the required calibration gate.

**DeepSWE pair diagnostic (2026-08-28):** the selected pair
`psd-tools-blend-range-api` (Python) and `ink-grid-box-layout` (TypeScript)
passed preparation and verifier-polarity checks. One Codex and one Hermes cell
per task were run through the pinned `z-ai/glm-5.3-flash` route. Hermes and
Codex both reached the proxy and produced usage-bearing model traffic, but the
three running cells exhausted the 300-second short bound and were quarantined;
the initial Codex Ink cell also exposed a real adapter defect because its
leading-dash prompt was parsed as a CLI option. That was fixed and regression-
tested in `S4-codex-leading-dash-plan.md`; the bounded retry reached Codex
normally but also timed out. The four-cell slice spent `$0.095816555`, and the
single corrected Codex retry spent `$0.020453895`. No cell is calibration
evidence or eligible for the official subset. The pair remains useful only as
source/verifier and adapter-boundary diagnostics.

**Prepared environment correction (2026-08-28):** a real Codex/Ink trace
showed that the prepared DeepSWE environment image was not being used by the
agent cell; the generic Codex image had no project dependencies and the model
attempted an offline install. The runner now builds a task/tool composite image
from the prepared environment and pinned CLI image, records its digest in the
task metadata and C4 provenance, and links the environment's dependency trees
into the mounted workspace before the adapter starts. A rebuilt Codex/Ink
retry used that composite image, produced normal proxied usage, and showed no
missing-dependency/install failure, but both 300-second attempts still timed
out before verification. It spent `$0.019983585`; this closes the runtime
environment defect but is not calibration evidence or a short-regime pass.

**Prepared agent-image binding correction (2026-08-28):** the generated
DeepSWE source manifest now preserves each requested tool's composite agent
image and digest, and selected-task validation compares that map with the
materialized `environment.json`. Recomputing a local task checksum cannot mask
an image or digest substitution. The focused binding regression and full
no-spend repository gate pass. This closes provenance integrity only; source
review, two-CLI short-regime calibration, and maintainer sign-off remain open.

**Review-evidence correction (2026-08-29):** DeepSWE preparation points
generated manifests at the structured `s3-deepswe-review.json` record and
computes its real SHA-256. The longer `s3-deepswe-source-audit.json` remains
supporting audit narrative only. Review flags remain false; this keeps the
pending state self-consistent and does not approve S7.

**Obsidian TOC candidate diagnostic (2026-08-28):** the untried TypeScript
`obsidian-linter-auto-table-of-contents` task passed source preparation and
automated verifier polarity (1,131/1,131 P2P and 41/41 F2P on the reference
solution; pristine base failed). One Codex and one Hermes cell were then run
through the pinned `z-ai/glm-5.3-flash` route with the prepared composite
images. Both tools reached the proxy and used the correct model, but each
timed out at the 300-second short bound and retried once; all four attempts
were quarantined. The exact runner spend was `$0.062594305`. This is diagnostic
evidence only and rejects the candidate for short-regime calibration; the
temporary task images were removed after the run.

**cattrs verifier and diagnostic correction (2026-08-28):** the DeepSWE
preparer now cleans package-manager caches from generated environment layers and
exports `/work/workspace/src` ahead of any editable `/app/src` install path.
This keeps the source-owned Python verifier pointed at the patched workspace;
the focused task-source test covers both invariants. A fresh cattrs reference
run then passed 7/7 P2P and 69/69 F2P with reward 1, while the pristine base
failed the 69 F2P tests as expected. One real Codex cell at the pinned
`z-ai/glm-5.3-flash` endpoint exhausted both 300-second attempts and was
quarantined after `$0.01605675`; it is diagnostic evidence only and does not
qualify cattrs for short-regime calibration.

**Adaptix replacement diagnostic (2026-08-28):** the DeepSWE
`adaptix-name-mapping-aliases` candidate also passed the corrected source-boundary
and reference verifier checks: 2,738/2,738 P2P and 44/44 F2P, with the pristine
base failing all 44 new tests and producing reward 0. A real Codex cell at the
pinned `z-ai/glm-5.3-flash` endpoint exhausted both 300-second attempts and was
quarantined after `$0.043682235`; the runner then refused further work at the
`$0.05` cell cap. This is diagnostic evidence only, not a short-regime
calibration pass. Adaptix remains a possible replacement candidate, but it has
not entered the approved subset because the second-CLI calibration and maintainer
review gates are still open.

**Happy DOM abort-body diagnostic (2026-08-28):** the TypeScript
`happy-dom-abort-pending-body-reads` candidate passed preparation and automated
verifier polarity (165/165 P2P and 14/14 F2P on the reference solution; the
pristine base failed). One Codex and one Hermes cell were run through the pinned
`z-ai/glm-5.3-flash` route, with one retry permitted per tool. Both tools reached
the proxy and produced usage-bearing traffic, but both attempts for each tool
exhausted the 300-second short bound and were quarantined without verifier
execution. The exact runner spend was `$0.06854490`. The task is therefore
rejected for the short-regime subset; this is diagnostic evidence only and does
not approve an extended regime.

**Mashumaro narrow-task diagnostic (2026-08-28):** the Python
`mashumaro-flattened-dataclass-fields` candidate passed source preparation and
verifier polarity: the pristine base failed, while the reference patch passed
`66/66` F2P and `30,014/30,014` P2P tests. A real Hermes cell reached the
pinned `z-ai/glm-5.3-flash` route but exhausted the 300-second short bound and
was recorded as a timeout after `$0.01266005`; the cap correctly prevented a
retry. This is diagnostic evidence only and does not qualify the task for the
short-regime subset or satisfy two-CLI calibration.

**GQL replacement diagnostic (2026-08-28):** the Python
`gql-incremental-graphql-delivery` candidate passed fresh source preparation and
verifier polarity (`17/17` F2P and `811/811` P2P; pristine base failed). One
Codex and one Hermes cell were run through the pinned
`z-ai/glm-5.3-flash` route with one retry permitted per tool. Both tools
reached the proxy, but both attempts exhausted the 300-second short bound and
were quarantined without verifier execution. Exact runner spend was
`$0.010118075`. This is diagnostic evidence only and rejects GQL for the
short-regime subset; it does not satisfy two-CLI calibration.

**Vulture replacement diagnostic (2026-08-28):** the Python
`vulture-persistent-analysis-cache` candidate passed fresh source preparation
and verifier polarity (`24/24` F2P and `295/295` P2P; pristine base failed).
One Codex and one Hermes cell were run through the pinned
`z-ai/glm-5.3-flash` route with one retry permitted per tool. Both tools
reached the proxy, but both attempts exhausted the 300-second short bound and
were quarantined without verifier execution. Exact runner spend was
`$0.025340085`. This is diagnostic evidence only and rejects Vulture for the
short-regime subset; it does not satisfy two-CLI calibration.

**Vulture alternate-CLI diagnostic (2026-08-28):** preparation for Aider and
OpenCode succeeded with pinned task, environment, verifier, and agent-image
digests. The first run exposed an S5 runner defect: OpenCode's read-only
version probe attempted to create a cache below `/root/.local` and failed
before model execution. After the probe was corrected to use the bounded
`/tmp` tmpfs with `HOME=/tmp`, OpenCode passed startup and Aider reached the
real model-backed task. Aider then exhausted the 300-second short bound; the
runner began redundant retries, which were intentionally interrupted to avoid
wasting more provider spend. The state recorded `$0.00505725` at interruption,
and no verifier pass was produced. This is diagnostic evidence only: neither
CLI qualifies Vulture for the short-regime subset or completes two-CLI
calibration.

**Aider context-filter follow-up (2026-08-28):** after excluding `.git/**`
from Aider's editable file list, a fresh single-Aider Vulture attempt still
did not complete inside the 300-second short bound. The runner started its
automatic retry; that redundant retry was interrupted deliberately. Because
the interrupted run has no finalized `run.json`, its provider usage cannot be
treated as a reliable spend total and it is not calibration evidence. The
context-boundary correction remains valid and is covered by the S4 adapter
regression test, but Vulture remains rejected for short-regime calibration.

**DeepSWE branch-compatibility correction (2026-08-28):** a real HTTPX
calibration run showed that the source instruction's request to branch from
`main` is incompatible with upstream repositories whose pinned default branch is
`master`. Preparation now creates a local `main` ref at the exact pinned base
while retaining detached HEAD provenance. The regression is covered by the task
source test and the prepared workspace was checked directly. If an upstream
already provides `main`, preparation preserves that ref and continues. This
removes a source-boundary dead end but is not calibration evidence by itself.

**Prepared-workspace symlink correction (2026-08-28):** the first real Clack
preparation reached its source-manifest step and found an upstream `LICENSE`
file symlink. The source boundary now preserves safe relative file symlinks
whose resolved target remains inside the task tree, rejects broken, directory,
or outside-tree links, and applies the same rule while copying into a runner
workspace. This retains upstream checkout semantics without allowing a task to
read outside its pinned source tree; it is covered by focused source tests.

**Bounded launcher diagnostics (2026-08-28):** the new S3 launcher prepared
`clack-async-autocomplete-options` and `textual-kitty-key-phases` successfully
at the pinned DeepSWE revision, including their task-specific environment and
verifier images. Hermes was run first for each through the real proxy with
`z-ai/glm-5.3-flash`; Clack generated successful proxied model traffic but
exhausted the 300-second bound with a final unpriced aborted request, and
Textual likewise exhausted the bound after 15 model requests with an unpriced
final request. The armed `$0.25` cap refused to start the corresponding Codex
cell in both cases because spend could not be conservatively reconciled. Both
outputs retain `events.jsonl`, logs, state, and the DeepSWE source manifest, but
neither is calibration evidence or a short-regime pass. These results reinforce
that the next candidate must be selected for a materially smaller/easier task,
not rescued by increasing the short timeout.

**HTTPX streaming diagnostic (2026-08-28):**
`httpx-streaming-json-iteration` passed fresh source-owned verifier polarity:
the pristine base kept 1,404/1,404 pass-to-pass tests and failed all 108
fail-to-pass tests; the reference patch passed 1,404/1,404 and 108/108. Two
real Codex attempts at `z-ai/glm-5.3-flash` then timed out at the 300-second
short bound without a model patch, spending `$0.010213575` in total. The run
used the corrected `main` alias and produced valid proxy usage, but no verifier
pass, so this task is rejected for short-regime calibration and no second CLI
attempt was started.

**Out of scope:** official approval, four repetitions, the full six-tool matrix,
publishing DeepSWE tasks into this repository, or claiming exact harness share.

**DeepSWE manifest boundary (2026-08-27):** DeepSWE is represented by a dedicated
`deepswe` original-source manifest rather than being mislabelled as the generic
`git-taskpack` layout. Each entry records the DeepSWE task path and revision,
upstream repository and base commit, language, task shape/size, verifier image,
and a deterministic source checksum. The prepared local manifest binds each
selected task to that original entry; review flags remain false until a human
reviews licensing, task boundaries, verifier polarity, and calibration evidence.

**Follow-up raw-run provenance:** because DeepSWE tasks have both a dataset
revision and an independently pinned upstream repository, C4 now carries the
optional raw `task_repository` locator for prepared public tasks. Legacy/local
fixtures may omit it; DeepSWE-prepared runs must emit it. This is provenance, not
a derived measurement.

## Acceptance

All tasks pass `tasks/validate`. Composition table matches C2. Calibration complete. Maintainer signed off on prompts.

## Next

S4/S5 consume `workspace/` + `prompt.md` + either the script verifier or the validated native verifier descriptor.

### Follow-up correction: strict prepared-manifest validation

**Acceptance tests written before implementation:**

- A local manifest with an unknown top-level field is rejected.
- A manifest entry with an unknown field, malformed entry, or incomplete `source`
  object is rejected with `ConfigError`, rather than a JavaScript type error or
  silent acceptance.
- A selected-manifest check validates selected task contents while an unchanged
  unselected entry may be stale; the full-manifest validator still rejects that
  stale tree.

**Implementation:** `validateLocalTaskManifest` now validates the runtime shape of
the complete manifest, each task entry, its C2 source object, preparation marker,
and checksum before reading the materialized task tree. The selected-task variant
shares that shape validation but verifies materialized structure, provenance, and
checksums only for requested IDs, so unrelated source directories cannot block an
otherwise valid selected run. This keeps the preflight and source CLI boundaries
fail-closed even when input arrives from JSON rather than TypeScript.

**Status (2026-08-26):** implemented in `packages/tasks/src/source.ts` and covered
by `packages/tasks/src/source.test.ts`; focused tests and package typecheck pass.

**Out of scope:** selecting a public corpus, changing C2 fields, or changing the
task checksum algorithm.

### Follow-up: bounded DeepSWE calibration launcher

The diagnostic launcher in `scripts/s3-deepswe-calibration.sh` now prepares a
requested DeepSWE subset before timing and invokes the normal pinned Docker
runner with the exact S2 model. It defaults to one repetition of the two current
calibration CLIs (`codex,hermes`) and a `$0.25` hard cap, while requiring the
caller to raise the cap explicitly for a larger subset. It rejects unsafe task
IDs, non-empty output roots, invalid budgets, and missing credentials before
preparation or provider traffic. The prepared original-source manifest is
copied beside the diagnostic results even when the runner exits nonzero.

This command is not an approval shortcut: review flags remain false, S7 still
requires the full approved source and six-tool matrix, and diagnostic outputs
cannot be used as publication data. The launcher contract is covered by the
DeepSWE source tests, including zero-spend `--help` and its pinned Docker
defaults. See `plans/S3-deepswe-calibration-run-plan.md` for the interface and
acceptance boundary.

### Follow-up: abbreviated upstream revision normalization

Two DeepSWE tasks use valid abbreviated base commits in their source metadata.
The preparer now resolves those refs against the freshly cloned upstream
checkout and records the full commit in the prepared task YAML, Docker build
argument, provenance, and source manifest. This preserves the full-SHA contract
without adding a remote API or changing source metadata. The
`eicrud-keyset-pagination-cursor` candidate then hit a separate host-specific
environment failure: its source Dockerfile requires the MongoDB Debian package,
which is unavailable in the arm64 repository used by this Mac. It was not
calibrated or admitted to the provisional slice.

### Follow-up: HTTPX streaming candidate diagnostic

`httpx-streaming-json-iteration` passed pristine/reference polarity (1,404/1,404
P2P and 108/108 F2P), but both Codex and Hermes were quarantined after one retry
at the 300-second short bound. The exact runner spend was `$0.032008945`.
Provider traffic was successful; the Codex attempt also hit an agent patch-context
failure. This is diagnostic evidence only and does not qualify the task for the
short-regime subset.

### Follow-up: LangChain coalescing candidate diagnostic

`langchain-request-coalescing` passed pristine/reference polarity (232/232 P2P
and 50/50 F2P), including after the preparer resolved its abbreviated upstream
base pin to the full commit. Both Codex and Hermes were nevertheless
quarantined after one retry at the 300-second short bound. The exact runner
spend was `$0.022653425`. This is diagnostic evidence only and does not qualify
the task for the short-regime subset.

### Follow-up: extended GLM Flash diagnostic (2026-08-29)

The prepared `cattrs-partial-structuring-recovery` task was run once with
Hermes and the pinned `z-ai/glm-5.3-flash` model using a 900-second diagnostic
timeout and a `$2` hard cap. The cell reached the real OpenRouter endpoint and
recorded 33 model attempts, 30 usage-bearing attempts, and three attempts
without usable usage (two long 200 responses and one aborted request). No model
patch was produced. The runner retained the cell as pending and refused to
fabricate a spend total because the hard cap requires complete usage
reconciliation; the known usage-bearing portion prices to approximately
`$0.0174`, while the actual provider total is not claimed. This is diagnostic
evidence only and does not approve cattrs, establish a long-regime composition,
or authorize raising the short-regime timeout.

The same prepared task was also run once with Codex and the pinned model under
the 900-second, `$2` diagnostic cap. It recorded 47 proxy events, 45
usage-bearing events, and 43 complete structured tool-item pairs in the
redacted raw JSONL stream, but timed out before a valid completed C4 result.
The known usage-bearing portion prices to approximately `$0.0686`. This is
capture-path evidence only; it does not make cattrs short-regime calibration
evidence or promote Codex visibility to `full`.

**Extended regime control (2026-08-29):** the explicit long-regime diagnostic
path was fixed so `task.yaml`, the DeepSWE source manifest, and C4 preserve the
same `long` regime and timeout. S7 preflight now rejects selected tasks whose
expected maximum exceeds five minutes or whose timeout exceeds 300 seconds. One
Codex/GLM Flash run of `psd-tools-blend-range-api` at 900 seconds recorded 54
successful provider responses and 50 structured tool-item pairs (22 with
positive duration), but the native verifier returned `verify_error` because
the model-created files conflicted with the source verifier patch's file
additions. It spent `$0.045040735`; the retry estimate was refused by the cap.
This is long-regime diagnostic evidence only, not calibration or S7 data.
