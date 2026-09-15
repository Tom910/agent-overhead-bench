# S5 — Runner + results store Implementation Plan

> **For agentic workers:** Expand TDD steps when this stage starts. Sequential cells only — parallel cells pollute timing.

**Implementation status (2026-08-26):** runner implementation is locally validated. Host and Docker cell executors, host-reachable Docker proxy binding, provenance, verification artifacts, usage-based budget checks, retries/quarantine, resume reconciliation, matrix-definition identity, Docker tool-version verification, the two-tool reduced dry run, and a process-level `SIGKILL`/resume smoke are covered by the focused suite. Matrix and CLI calls default to Docker dispatch; host/mixed modes are explicit local-validation paths. Official numbers remain an S7 activity.

**Follow-up security/measurement correction (2026-08-27):** Docker credentials are
forwarded through the Docker client's environment with `--env NAME`, never as
`--env NAME=value` command-line arguments. Metadata-only proxy requests are retained
in C1 for auditability but do not count as model intervals, model failures, or priced
spend; pinned cells require at least one model-request event. The boundary is covered
by regression tests and a bounded real Hermes run with the approved model.

**Follow-up correction (2026-08-26):** lifecycle persistence now keeps a cell `running`
for the complete adapter execution and changes to `verifying` at the task-verifier
boundary. Host verification calls the callback directly; Docker verification starts
after the callback in its separate verifier container. This preserves the roadmap
state-machine meaning after a process kill and is covered by regression tests. No
measurement model or contract fields changed.

**Follow-up verification (2026-08-26):** a real-Docker route smoke is now
implemented and included in S7 preflight. It runs a pinned local curl image against a
host-bound proxy backed by the in-repo mock upstream, then validates the emitted C1
event. It uses no API key; CI and S7 both run this no-spend route check, closing the gap
between fake-Docker flag tests and the actual `host.docker.internal` route. The relay
topology also verifies that the agent-side internal network has no default route.

**Follow-up implementation (2026-08-26):** image validation is an explicit zero-spend
build gate. CI and S7 use the same dependency-free command to build
the digest-pinned base, build every selected adapter image, run each declared version
probe, and assert the runner entrypoint contract. Provider credentials are not passed to
the build or smoke commands; official execution remains gated by S2/S7 review.

**Follow-up correction (2026-08-26):** verifier container identities are now persisted
through the same lifecycle callback as agent containers, so a kill during `verifying` can
be recovered by removing the exact verifier container. Persisted `null` interrupted
spend is also rejected when a later resume arms a hard cap; unknown usage cannot be
silently treated as zero.

**Follow-up provenance correction (2026-08-27):** C4 now records the verifier image
digest separately from the agent image digest and records the C2 task environment
(`kind` and disabled-network policy). The matrix definition key includes that
environment, and the CLI passes it from source preparation to each cell. The full
zero-spend dry-run defaults to Docker execution; tests may explicitly select host
mode for environments without Docker.

**Follow-up official-dispatch correction (2026-08-27):** the guarded S7 launcher
now passes `--mode docker` explicitly. S7 preflight already requires a fresh,
version-verified container descriptor for every selected adapter, so an official
run cannot silently fall back to host execution.

**Goal:** Unattended execution of the matrix: tools × tasks × {pinned, default} × N≥4, fresh container per repetition, schema-valid `run.json` + `events.jsonl` per cell.

**Architecture:** Cell state machine in `state.json` (atomic writes). Block-randomized order (one of every tool per block, shuffled). Per cell: stage workspace → start proxy on the host → dispatch host or container execution according to the adapter and selected mode → run a script verifier in the host process or a separate network-disabled verifier container, or run a native immutable command descriptor in a separate network-disabled verifier container → redact → write C4 → tear down. The `mixed` mode remains a local validation path; S7 fails closed until every selected official adapter has a built, version-verified image.

**Tech Stack:** Existing packages, Docker. Shared base image + one image per tool. No new runtime deps unless justified.

**Spec:** Roadmap C4 and S5. Official numbers may use Linux or the available
macOS Docker Desktop host, with the virtualization/CPU-steal limitation recorded
when macOS is used. This stage must work on macOS Docker Desktop for spikes.

## Global Constraints

- Inherited from `plans/README.md`.
- No derived metrics in `run.json`.
- Docker cells verify the installed CLI version in a pre-cell container and preserve the returned version string; the generic `container-image` placeholder is not publication-grade provenance.
- The built-in mock upstream can bind on a host-reachable interface for Docker-only zero-spend integration tests while retaining loopback as its default.
- Sequential execution only.
- Budget guard: C1 usage × the condition’s price book; a conservative upper-bound preflight estimate is required when a hard cap is armed, followed by an actual post-cell check. Calibration, dry runs, Ori-vs-native count against the cap. The ~$170–800 figure is the original grid product, not the guard.
- Pinned cells with a non-mock model must produce proxy evidence; a successful tool process with zero observed model requests is recorded as `adapter_error` rather than as a zero-cost measurement.
- Secrets: runner-supplied env or tmpfs file mode 0600, not copied into artifacts. Ori cookies are not an approved channel.
- `price_book` is required on every `run.json`. Never mix books in one table (S6).

## Contracts consumed / produced

- Consumes: C1 events, C3 adapter result, C2 task, `validateC4Run`.
- Produces: per-cell directory `{run.json, events.jsonl, stdout, stderr, verify.log}` under gitignored `results/`.

## Out of scope

Derivation (S6), official publication runs (S7), launch (S8).

## Human review

None beyond design-level. Dry-run artifacts are for S6/S7.

## Risks

| Risk | Mitigation |
|---|---|
| Docker Desktop steal on Mac | Spikes and official v1 are allowed only when the platform limitation is recorded |
| Matrix not resumable | State machine; kill -9 test |
| Fat image with every CLI | Shared base + per-tool image |

---

### Tasks

The following execution plan is the S5 implementation brief. It is ordered because
the runner cannot safely emit a C4 result until the provenance and state contracts are
correct. Every test uses the mock upstream or a fake Docker executable; no API key is
needed.

### Task 1: Complete the task and run provenance contracts

**Files:**
- Modify: `packages/contracts/src/c2.ts`
- Modify: `packages/contracts/src/c4.ts`
- Modify: `packages/contracts/src/validate.ts`
- Modify: `packages/contracts/schemas/c2.task.schema.json`
- Modify: `packages/contracts/schemas/c4.run.schema.json`
- Modify: `packages/contracts/fixtures/c2.task.valid.json`
- Modify: `packages/contracts/fixtures/c4.run.valid.json`
- Modify: `packages/contracts/src/validate.test.ts`

**Interfaces:**
- Consumes: the roadmap C2 source object and C4 fields `task_source`, `task_revision`, and `task_regime`.
- Produces: validated `C2TaskYaml.source = { kind, repository, revision, task_id, license_notes }` and validated C4 provenance fields; unknown C4 keys are rejected instead of silently stripped.

- [x] Add failing validator tests for missing C2 source and missing C4 provenance, plus a test that an unknown C4 key is rejected.
- [x] Run the contracts test and confirm those tests fail against the current types/validator.
- [x] Add the required source/provenance fields and strict object-key checking for C4; update every checked-in task YAML/fixture with the explicit local-source provenance used by the current suite, without calling the suite a public-source v1 result.
- [x] Run contracts tests and typecheck; record in the changelog that this is a pre-freeze contract correction.

### Task 2: Durable state machine and block randomization

**Files:**
- Modify: `packages/runner/src/state.ts`
- Modify: `packages/runner/src/index.ts`
- Test: `packages/runner/src/runner.test.ts`

**Interfaces:**
- Consumes: `Cell` records.
- Produces: `CellStatus = pending | staged | running | verifying | done | failed | quarantined`, `MatrixState = { version: 1, seed: number, cells: Cell[], spentUsd: number }`, `createMatrixState`, `transitionCell`, `pending`, `blockRandomize`, `loadState`, and crash-safe `saveState`.

- [x] Add tests for every legal transition, rejection of a transition from `done`, failed-cell retry once then quarantine, persisted seed, and malformed-state failure.
- [x] Run the focused runner tests and confirm the new transition/state assertions fail.
- [x] Implement state validation, deterministic seeded block randomization, write-to-temp plus `fsync` plus `rename`, and `ConfigError` on malformed state; never reinterpret corruption as an empty matrix.
- [x] Re-run focused tests and typecheck.

### Task 3: Usage-based budget guard

**Files:**
- Create: `packages/runner/src/budget.ts`
- Modify: `packages/runner/src/index.ts`
- Test: `packages/runner/src/runner.test.ts`

**Interfaces:**
- Consumes: C1 events and a price-book map shaped as `{ [model: string]: { input: number; cached_input: number; output: number } }`.
- Produces: `estimateEventsUsd(events, rates): number | null` and `assertBudget(spentUsd, nextUsd, capUsd): void`, throwing `BudgetExceeded` when the cap would be crossed or a required estimate is unavailable.

- [x] Add tests for uncached/cached input pricing, multiple events, unavailable usage, and exact-boundary/cross-boundary caps.
- [x] Run the focused tests and confirm the new budget tests fail because the module does not exist.
- [x] Implement cache-aware arithmetic using nonnegative uncached input (`input - cached_input`), returning `null` for unavailable usage and never treating it as zero; require a conservative upper-bound estimate and assert before starting each capped cell.
- [x] Re-run focused tests and typecheck.

### Task 4: Correct host cell lifecycle

**Files:**
- Modify: `packages/runner/src/cell.ts`
- Modify: `packages/runner/src/runner.test.ts`

**Interfaces:**
- Consumes: a complete `CellSpec` containing task source/revision/regime, condition, rep, model, timeout, price book, adapter, and upstream.
- Produces: `runHostCell(spec): Promise<C4Run>` with matched adapter/proxy wall anchors, adapter/verification timestamps, captured `verify.log`, C1-derived spend estimate, correct `timeout | adapter_error | verify_error | completed` outcome, and no derived-metric keys.

- [x] Add failing tests for condition/rep/provenance propagation, nonzero verification with a written log and positive duration, timeout outcome, adapter error outcome, upstream 500 outcome, and no derived C4 keys.
- [x] Run the focused tests and confirm the current hard-coded pinned/rep-zero/zero-duration behavior fails them.
- [x] Implement async verification with a monotonic start/end pair and `spawn`/closed stdin; capture stdout and stderr in the declared log. Capture the adapter wall anchor at the same instant as its monotonic zero through a helper. Map adapter exit `124` to timeout and adapter invocation failures to adapter_error; preserve verify failures as verify_error.
- [x] Read and validate the sibling events file before calculating spend; use the passed price book; write `run.json` only after validation, and close the proxy in `finally`.
- [x] Re-run focused tests and typecheck.

### Task 5: Docker cell executor

**Files:**
- Create: `packages/runner/src/docker.ts`
- Create: `images/runner-entrypoint.sh`
- Modify: `images/README.md`
- Modify: `packages/runner/src/runner.test.ts`

**Interfaces:**
- Consumes: `ContainerInvocation`, staged workspace, a fixed host proxy target, and a Docker-compatible command runner.
- Produces: `runDockerCommand(invocation, route, outDir): Promise<{ exitCode: number; tStart: number; tEnd: number; imageDigest: string; stdoutPath: string; stderrPath: string }>`.

- [x] Add a fake-Docker test asserting `--add-host=host.docker.internal:host-gateway`, sequential execution, mounted workspace/output paths plus the read-only verifier bind, closed stdin, and no API key in command output; add a no-Docker configuration error test.
- [x] Run the focused tests and confirm the Docker executor is absent.
- [x] Implement the command with a runner-owned relay on a unique internal network; mount only the staged workspace into the agent container, pass only the adapter’s declared environment, and use the image command descriptor. Run the cell verifier separately with `--network none`, the workspace mount, and a read-only cell-level verifier bind. Resolve the image digest with `docker image inspect`; record the tool image digest. Keep the relay’s fixed host-proxy target explicit and document that CI/S7 must validate the route topology.
- [x] Write setup files into the staged mount before launch, redact captured logs, and return process timestamps using `performance.now()`.
- [x] Re-run focused tests and typecheck.

### Task 6: Matrix orchestration, retries, and budget stop

**Files:**
- Create: `packages/runner/src/matrix.ts`
- Modify: `packages/runner/src/index.ts`
- Modify: `packages/runner/src/runner.test.ts`

**Interfaces:**
- Consumes: task specs, adapters, conditions, repetitions, `runHostCell`/Docker execution, `MatrixState`, and `assertBudget`.
- Produces: `runMatrix(options): Promise<MatrixState>` that executes sequential cells, saves each transition, retries a failed cell once, quarantines it after the retry, resumes without repeating `done`, and stops cleanly on `BudgetExceeded`.

- [x] Add tests for a reduced 2-tool × 2-task × 2-rep matrix, resume after an interrupted cell, retry/quarantine, and budget stop with no completed-looking partial file.
- [x] Run the tests and confirm no matrix orchestrator exists.
- [x] Implement cell generation with separate pinned/default cells and N repetitions, seeded block randomization, fresh result directories, and state writes before/after every lifecycle step. Keep cells sequential and leave quarantined failures visible.
- [x] Re-run focused tests and typecheck.

### Task 7: Dry-run command and documentation

**Files:**
- Create: `scripts/s5-dry-run.sh`, `scripts/s5-full-dry-run.sh`
- Modify: `plans/S5-runner-plan.md`
- Modify: `plans/README.md`
- Modify: `images/README.md`
- Test: `packages/runner/src/runner.test.ts`

**Interfaces:**
- Consumes: mock upstream, two deterministic mock identities, two checked-in infrastructure fixtures, and the matrix runner.
- Produces: an unattended zero-spend reduced dry-run command and an accurate S5 status; it never requires `OPENROUTER_API_KEY`.

- [x] Add a test that the dry-run command uses mock upstream and writes schema-valid C4/C1 artifacts.
- [x] Implement reduced and full commands with explicit output directories, two deterministic mock identities, dedicated checked-in infrastructure fixtures, mock model, and the dated zero-rate price book. Run each twice to exercise resume; the full command covers pinned and default conditions. The fixtures are not benchmark tasks and are excluded from the canonical suite manifest.
- [x] Add `scripts/s5-kill-resume.sh` and run it in the runner integration suite; it kills a delayed no-spend child matrix and verifies resume produces eight unique completed artifacts.
- [x] Run all runner tests, full workspace tests, full typecheck, and `git diff --check`.

### Follow-up correction: persist the lifecycle at the actual execution boundary

**Files:**
- Modify: `packages/runner/src/matrix.ts`
- Test: `packages/runner/src/runner.test.ts`

**Acceptance tests written before implementation:**
- A cell executor observes `running` in `state.json` while the adapter is executing.
- Host verification changes the state to `verifying` immediately before `verify.sh`;
  container verification uses the same boundary via a mounted entrypoint marker.
- A custom executor without a verification callback gets the safe fallback transition
  after it returns, immediately before the result is classified.
- Existing interruption, retry, quarantine, and dry-run tests remain green.

**Implementation:** keep the pre-execution transition at `running`; give the cell
executor a verification-boundary callback, invoke it immediately before host
verification, and have the Docker entrypoint emit a marker immediately before its
verification command. The matrix persists `running → verifying` from that callback,
with a post-executor fallback for custom executors. Preserve the existing failure
transition for thrown execution errors and returned failure outcomes.

**Out of scope:** changing retry policy, timing fields, C1/C4 schemas, or the official
S7 execution gate.

### Follow-up verification: real Docker-to-host proxy route

**Files:**
- Create: `packages/runner/src/docker-route-smoke.ts`
- Create: `scripts/s5-docker-route-smoke.sh`
- Modify: `packages/runner/package.json`
- Modify: `images/README.md`

**Acceptance tests:**
- The smoke starts the local mock upstream and a proxy bound to `0.0.0.0`.
- A container reaches the proxy through the relay, whose only bridge attachment uses
  the exact host-gateway flag used by S5.
- The request succeeds without an API key and one schema-valid C1 event is written.
- A missing Docker daemon fails clearly; CI and S7 preflight invoke this real-environment check before provider-backed work.

**Implementation:** use only Node built-ins, `@aob/mock-upstream`, and `@aob/proxy`.
Pin the curl image by digest in the command and keep all cleanup in `finally` blocks.
This verifies the relay routing and the absence of an agent default route; it does not
assert provider firewalling beyond that runner-controlled topology.

### Follow-up correction: crash recovery, trusted-artifact isolation, and interrupted spend

**Files:**
- Modify: `packages/runner/src/state.ts`
- Modify: `packages/runner/src/matrix.ts`
- Modify: `packages/runner/src/cell.ts`
- Modify: `packages/runner/src/docker.ts`
- Modify: `packages/runner/src/runner.test.ts`
- Modify: `images/runner-entrypoint.sh`
- Modify: `images/README.md`

**Acceptance tests:**
- A Docker cell persists its generated container name before launch; resuming a
  `running`/`verifying` cell removes that exact validated name before staging a retry.
- The agent container cannot see `events.jsonl`, `run.json`, `verify.sh`, or verifier
  output. Verification runs in a separate network-disabled container with only the
  staged workspace and read-only verifier mounted; its output is captured by the host.
- A killed cell with valid partial C1 usage has that spend counted once before its
  workspace/events are restaged. Unknown partial usage refuses a capped resume.
- Existing dry-run, Docker flag, retry, and kill/resume tests remain green.

**Implementation:** extend internal cell state with an optional validated Docker
container identity and a one-time interrupted-spend reconciliation marker. Persist the
identity before `docker run`, clean it on resume, and clear it after the process returns.
Remove the cell-output mount from the agent container. Run script verification in a
separate `--network none` container using the same immutable image, a read-write
workspace mount, and a read-only verifier bind; run native verification from its
immutable image and argument array with only the read-write workspace mounted. Write
the verifier log and duration marker on the host.
Validate and price any surviving `events.jsonl` before `stageTask` deletes it. These
changes affect isolation and recovery only; C1/C4 contracts and the measurement model
do not change.

**Status:** implemented and covered by the runner suite. The full dry-run is now run
twice in the integration test, and the real Docker route smoke passes locally with the
mock upstream.

**Out of scope:** provider firewall enforcement beyond the runner-controlled relay and
internal-network topology, changing retry counts, or treating interrupted partial runs
as completed published measurements.

### Follow-up correction: strict persisted-state validation

The state loader/saver now rejects unknown state or cell fields, duplicate cell IDs,
and requires nonnegative integer repetitions. Resume also fails closed when a legacy
state lacks `definition_key`, because its model, price book, and task provenance
cannot be proven equivalent. Existing versioned lifecycle and resume behavior is
unchanged.

### Follow-up correction: container capability hardening

The agent and verifier Docker commands must retain the existing read-only filesystem,
minimal mounts, and network rules while also dropping all Linux capabilities and
enabling `no-new-privileges`. This is a runner isolation correction only; it does not
change C1/C4 timing or the measurement model. The fake-Docker command test must assert
both flags for the agent and verifier paths.

**Status (2026-08-26):** implemented in `runDockerCommand` and
`runDockerVerification`, with regression assertions in the runner suite.

### Follow-up correction: no-follow setup-file writes

Setup files generated by an adapter are written inside the staged workspace. The
writer must reject a symlink at the final setup-file path and use a no-follow file
descriptor for the create/truncate operation, so a staged input cannot redirect a
configuration write outside the workspace. Add a regression test covering a final
path symlink; this changes only setup-artifact isolation, not timing or contracts.
The final path is created exclusively, written to completion, and all filesystem
failures are reported as typed configuration errors; this also prevents hard-link
truncation of a file outside the workspace.
The parent-path checks are intentionally performed before any agent or verifier
process starts; task-source validation rejects source symlinks, and no untrusted
task code can execute concurrently with setup-file creation. A hostile external
host process replacing a parent directory during this pre-launch operation is
outside the supported runtime threat model.

### Follow-up correction: bounded Docker tag-read retry

Docker Desktop can briefly return a missing-tag response immediately after its
image store reports the tag. The zero-spend image gate retries image inspection a
bounded number of times with a per-attempt timeout before failing, so a transient
daemon read does not create a false preflight failure while a genuinely missing or
unresponsive daemon still fails closed.

**Status (2026-08-26):** implemented in `scripts/s5-build-images.sh`; the
inspection path has a 10-second per-attempt ceiling and three total attempts.

### Follow-up correction: reproducible tool dependency graphs

**Acceptance tests written before implementation:**

- Every selected tool image has a checked-in dependency lock artifact covering
  the installed CLI and its resolved runtime dependencies.
- Each selected image Dockerfile installs from that lock artifact rather than
  resolving an unpinned dependency graph at build time.
- The S5 image check rejects a selected image source when its lock artifact is
  missing or the Dockerfile does not use the locked installation path.
- The existing version, credential-name, entrypoint, and no-spend image checks
  remain green.

**Implementation:** add exact-version npm lockfiles for the Node CLIs and
requirements lockfiles for the Python CLIs. The image Dockerfiles install those
lockfiles, with the Hermes source still pinned to its exact Git commit and
installed without a second dependency resolution. The build/check script validates
the lock artifacts before building or accepting an image. This makes the selected
dependency graph reviewable and keeps the image digest the authoritative runtime
identity recorded by C4.

**Status (2026-08-26):** implemented. The four Node image layers use checked-in
`package-lock.json` files with `npm ci`; Aider and Hermes use exact-version Python
requirements locks, and Hermes now uses a commit-archive SHA-256 instead of a
rate-limit-sensitive full Git clone. `s5-build-images.sh --check` validates the
lock artifacts as well as all six rebuilt image versions, entrypoints, and
credential-name gates. The image reproducibility tests run without provider
traffic; the rebuilds themselves produced fresh image digests for runtime C4
recording.

**Out of scope:** publishing a registry image, changing CLI versions, or claiming
that a lockfile substitutes for recording the final image digest.

### Follow-up correction: bound Docker build storage

The four Node-based tool images now remove npm's cache in the same `RUN` layer as
the locked install and version probe. This prevents transient Docker Desktop
snapshots from retaining the large install-time cache and exhausting the builder
while the six images are rebuilt together. The image reproducibility test locks
the cleanup into each Node Dockerfile.

**Status (2026-08-28):** implemented and verified by a fresh six-image build plus
`scripts/s5-build-images.sh --check`; the build used no provider credentials or
provider traffic.

### Follow-up correction: Python artifact integrity

**Acceptance tests:** Aider and Hermes Python lockfiles include SHA-256 hashes for
every requirement; the S5 validator rejects unhashed requirements; both Dockerfiles
install with `pip --require-hashes`; image builds still pass with the checked artifacts.

**Implementation:** Added artifact hashes to the checked-in Python requirement locks,
enforced `--require-hashes` in both Dockerfiles, and extended the runner test and S5
validator to require the format.

**Status (2026-08-26):** implemented and verified with the full workspace suite plus
rebuilt-image validation.

**Out of scope:** vendoring package artifacts or changing selected CLI versions.

### Follow-up correction: Hermes build isolation

**Acceptance tests:** The Hermes lock includes its pinned build backend with a
SHA-256 hash, and the editable install disables build isolation so no unpinned
temporary build environment can be resolved from the network.

**Implementation:** Added `setuptools==83.0.0` to the hashed Hermes lock and
changed the editable install to use `--no-build-isolation`; the runner test now
asserts that flag is present.

**Status (2026-08-27):** implemented; the hash-enforced Hermes image build and
requested-model smoke both pass.

**Out of scope:** vendoring the Hermes source tree or changing the selected
Hermes commit.

### Follow-up correction: proxy-only Docker egress

The current bridge route proves reachability but does not prevent an untrusted
agent process from opening a second outbound connection. Official Docker cells
therefore use a unique `--internal` network for the agent and a runner-owned
relay sidecar. The relay joins the internal network and the Docker bridge, and
forwards only to the host measurement proxy URL fixed at startup. The agent
never joins the bridge and receives no host-gateway entry.

**Acceptance tests written before implementation:**

- Fake-Docker command coverage asserts network creation with `--internal`, a
  relay attached to both networks, an agent attached only to the unique
  internal network, and cleanup of the relay/network after success or failure.
- A zero-spend relay integration test forwards a request to the mock upstream,
  emits one schema-valid C1 event, and verifies the agent-side network has no
  default route while the relay remains reachable.
- Interrupted-cell recovery persists and removes the agent, relay, and network
  identities exactly once; malformed or runner-unowned names are rejected.

**Implementation:** add a dependency-free Node HTTP relay to the immutable base
image, create one labelled internal Docker network per cell, attach the relay
to that network and the bridge, and use the relay hostname in every adapter
proxy URL. Remove all three runner-owned resources in `finally` and during resume
recovery. The route smoke exercises this relay topology and is not evidence of provider
firewalling.

**Status (2026-08-27):** implemented. Focused fake-Docker and relay tests pass, the
six rebuilt images pass the zero-spend image gate, and the real Docker route smoke
passes with one schema-valid C1 event and no agent default route.

**Out of scope:** filtering arbitrary task traffic inside the relay, changing
the C1/C4 measurement model, or claiming that Docker Desktop provides a
provider firewall beyond this runner-controlled topology.

### Follow-up correction: paid-upstream credential fail-fast

The low-level runner CLI is also a supported entry point for local validation,
but an explicit remote upstream with a missing key currently starts task
preparation and can enter adapter retry handling before failing. That wastes
time and makes an accidental paid run harder to reason about. Add a pure,
tested preflight that runs before task preparation: loopback upstreams remain
available for zero-spend diagnostics, while non-loopback explicit upstreams
require a non-empty `OPENROUTER_API_KEY`. The key value is never printed or
embedded in an error.

**Acceptance tests:** the preflight accepts the default mock and loopback URLs,
rejects a remote upstream when the key is absent or whitespace-only, and accepts
a remote upstream when the key is present. The CLI invokes it before preparing
any task.

**Out of scope:** loading arbitrary `.env` files, changing the official
`run-all.sh` key handling, or adding another provider authentication scheme.

**Status (2026-08-27):** implemented and verified with the focused CLI test plus
the full workspace test, typecheck, lint, and diff checks.

### S5 completion gate

S5 is complete only when the reduced dry-run runs unattended, C4 includes provenance and
real verification evidence, state survives interruption without duplicate done cells,
failed cells retry then quarantine, the budget guard stops before the cap, and the Docker
executor has a tested host-proxy command path. S7 remains responsible for the official
run host, keys, provider cross-checks, network limitation record, and publication freeze.

## Acceptance

Reduced dry-run completes unattended. Kill −9 mid-matrix then resume: no duplicate, no lost cell. Quarantined failures do not halt the matrix. Budget cap triggers cleanly. All outputs pass `validateC4Run` / `validateC1Event`.

## Next

S6 reads a results tree. S7 is the same runner on a quiescent Linux host or the
available macOS Docker Desktop host, with the platform limitation recorded.
