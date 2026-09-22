# S5 controlled collection policy implementation plan

> For agentic workers: use subagent-driven-development and verification-before-completion.

**Goal:** Enforce declared resource limits and make randomized collection reproducible through pauses and retries.

**Architecture:** A strict optional collection-policy document flows through CLI, matrix identity, cell and Docker launch. Keep observations in existing sidecars and add a hash-bound policy assessment. Introduce `randomized-blocks-v1` using the existing matrix and seeded generator, with an immutable exported schedule and exact-order resume checks. C4 is unchanged.

**Tech stack:** Existing TypeScript, Node, Docker and Vitest; no new dependencies.

**Spec:** September 22 audit package 3; independent controls review. Complete S5 retention first. S7 admission follows this stage.

## Global constraints

No inference, historical rewrites or implied cold caches. Resource limits are ceilings, not reserved cores. Ancestor constraints, workspace disk quota and provider cache remain explicitly unknown/uncontrolled. Reject controlled host/mixed execution. Policies must not modify native prompts/tools/reasoning parameters. Legacy campaigns retain legacy interpretation. Do not create a second scheduler or change budget/retry accounting.

## Review focus

Limits applied to agent and both verifier branches; expected versus observed comparison; preflight validation before credentials; policy/order tampering; pause/resume on the same host; serial execution; failed observation cannot become qualified. No silent default quota values for legacy runs.

### Task 1: Typed resource enforcement and observed-policy assessment

**Files:** New `packages/runner/src/collection-policy.ts` and tests; `cli.ts`, `matrix.ts`, `cell.ts`, `docker.ts`, `index.ts`; focused existing tests.

- [ ] Add strict versioned policy with integer CPU nanocpus, RAM bytes, total RAM+swap bytes and PID ceiling per agent/verifier role. Reject unknown keys, unsafe/nonfinite/unset values and inconsistent swap. Expose `--collection-policy PATH`; bind canonical policy hash in matrix definition, rejecting changed policy on resume.
- [ ] Add failing tests before implementation; generate fixed Docker flags without shell interpolation for measured agent and both verifier forms. Propagate existing wall timeouts and expected image identities.
- [ ] Compare exact Docker observations against policy, including readonly root/network, unset conflicting quota/cpuset/reservation fields, timeout and verifier-start state. Record explicit failure reasons in a private C4-bound sidecar and preserve it through retry. A mismatch must stop new admission without erasing incurred spend or changing the native outcome.
- [ ] Supply an example **unqualified** Linux policy (2 CPU, 8 GiB RAM, no extra swap, 512 PIDs per role) for a bounded offline enforcement smoke. All eight upstream task manifests declare 2 CPUs and 8192 MB memory; this motivates the probe, but does not establish task calibration. Their 20480 MB storage declaration is not an enforced workspace quota and must remain disclosed separately.
- [ ] Run focused tests/typecheck and actual isolated Linux no-network normal/timeout inspection smoke. Commit evidence and limitations.

### Task 2: Versioned randomized blocks and exact resume

**Files:** `packages/runner/src/matrix.ts`, `state.ts`, `cli.ts`, scheduling helper/tests if useful, `index.ts`.

- [ ] Add explicit `randomized-blocks-v1` protocol and recorded seed; shuffle complete task/repetition/condition blocks and harness order within blocks using a versioned deterministic generator. Preserve existing legacy and tool-batch behavior.
- [ ] Persist full schedule before execution and hash it into run identity/provenance outside C4. Reject batch filtering or independent ordering overrides for this protocol.
- [ ] Add failing tests for exact order tampering, seed/policy/input changes, balanced blocks, serial execution, paused mid-block resume and terminal outcome reuse. Existing completed Linux attempts must never be rerun by migration.
- [ ] Implement schedule replay validation and record planned block/position alongside actual attempt linkage. S7 will reconcile chronological execution across ledger segments; do not claim official eligibility before then.
- [ ] Run focused matrix/CLI/ledger tests and typecheck, commit and report.
