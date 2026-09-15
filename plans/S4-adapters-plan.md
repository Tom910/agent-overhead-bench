# S4 — Tool adapters Implementation Plan

> **For agentic workers:** Expand TDD steps when this stage starts. Invocation lines come from S2 evidence files — do not “improve” flags.

**Implementation status (2026-08-27):** adapter recipes are implemented and stub-tested. Aider receives the staged task’s actual files, default-condition paths omit pinned model flags, container invocations carry version metadata, and per-adapter fairness notes are recorded in `packages/adapters/README.md`. Zero-spend integration coverage now runs all three host adapters and all three originally container-only adapters through the real proxy and mock upstream, producing validated C1/C4 artifacts. Hermes one-shot linger is disabled only in the isolated benchmark config, and Codex's bundled bubblewrap resource directory is exposed on the container PATH. A fresh one-task Docker smoke completed for all six adapters with `z-ai/glm-5.3-flash`; it remains development evidence, not an official result window, because the S3 source and S7 review gates are still open.

The integration suite validates adapter/runner transport plumbing with controlled
CLI and Docker doubles; it does not claim that the real public CLI binaries have
completed a task. That final S4 acceptance is an opt-in, externally gated smoke
because it requires the approved model and real tool images.

**Follow-up implementation (2026-08-26):** added fresh-container invocation
descriptors and pinned image recipes for Claude Code, Codex, and Hermes. Mixed
validation/official dispatch now prefers a descriptor for every selected adapter;
the host PATH remains an explicit fallback only for local diagnostics when no
container recipe exists. Image builds and real-CLI smoke remain opt-in and do not
run in CI.

**Goal:** One thin C3 adapter per S2-approved tool, plus a shared helper library.

**Architecture:** `packages/adapters/lib` owns staging, isolated `HOME`/config, env from the runner only, spawn, timestamps, artifact capture, version detection, redaction. Each tool is one module: S2 argv, pinning path, exit interpretation, optional tool-event translation.

**Tech Stack:** Node child_process, existing contracts. No new runtime deps unless the expanded plan justifies one.

**Spec:** Roadmap C3 and S4. Fairness: default flags plus the minimum for headless + pinning.

## Global Constraints

- Inherited from `plans/README.md`.
- Adapters configure and invoke. They never interpret agent output, never compute metrics, never retry.
- A recipe proven only on the S2 throwaway workspace must not hard-code that workspace’s filenames into the canonical task runner.
- A condition label must correspond to a distinct recipe; unsupported default behavior fails explicitly rather than producing duplicate pinned data.
- Stdin closed. Hard timeout → SIGTERM → SIGKILL → `outcome` is the runner’s job, but `run()` must return at `timeoutS`. TTY only if S2 recorded `stdin: pty`.
- Artifacts redacted of runner env values and `sk-` / `sk-or-` / `Bearer ` prefixes. A leak fails acceptance.
- Do not assume overlay CoW on Docker Desktop bind mounts. The expanded plan chooses copy vs rsync vs image-side copy.
- Identical prompt file and workspace for every tool.

## Contracts consumed / produced

- Consumes: S2 `exact_argv`, `env_for_proxy`, `tool_visibility`; C3 interface; `validateC3AdapterResult`.
- Produces: `Adapter.run(...)` → `C3AdapterResult`.

```ts
export interface Adapter {
  name: string;
  capabilities: {
    headless: boolean;
    ori: boolean;
    baseUrlOverride: boolean;
    toolVisibility: "none" | "partial" | "full";
  };
  version(): Promise<string>;
  run(opts: {
    workspaceDir: string;
    promptFile: string;
    model: string;
    proxyUrl: string;
    condition: "pinned" | "default";
    timeoutS: number;
    env: Record<string, string>;
  }): Promise<{
    exitCode: number;
    tStart: number;
    tEnd: number;
    startupProbe?: number;
    toolEvents?: { tStart: number; tEnd: number; kind: string }[];
    artifacts: { stdoutPath: string; stderrPath: string; toolLogPath?: string };
  }>;
}
```

## Out of scope

S5 scheduling, Dockerfiles (S5), derivation, per-tool performance tuning.

## Human review (required)

Maintainer reads each adapter’s fairness notes (extra flags, PTY, Ori vs override).

## Risks

| Risk | Mitigation |
|---|---|
| Implementer adds “helpful” flags | Copy S2 argv verbatim; extra flags are exclusions |
| Secrets in stdout | Redaction test with a fake `sk-or-test` env |
| Hung CLI | Timeout + SIGKILL; never wait forever |

---

### Tasks

The following execution plan is the S4 implementation brief. Each task is deliberately
small enough to test without an API key. The S2 evidence files are authoritative for
argv, environment, visibility, and Docker-only status.

### Task 1: Shared spawn behavior

**Files:**
- Modify: `packages/adapters/src/spawn.ts`
- Test: `packages/adapters/src/adapter.test.ts`

**Interfaces:**
- Consumes: `AdapterRunOpts` and a command plus environment.
- Produces: `spawnAdapter()` returning C3-compatible timestamps and redacted logs.

- [x] Write a test with a temporary Node stub that sleeps past the timeout; assert the returned exit code is `124`, `tEnd >= tStart`, stdin is closed, and neither output artifact contains the supplied secret.
- [x] Run `npm run test -w @aob/adapters -- src/adapter.test.ts`; confirm the timeout assertion fails because the current helper reports `1` after SIGTERM/SIGKILL.
- [x] Track a `timedOut` local flag, resolve `124` on timeout, retain SIGTERM followed by SIGKILL, and keep all clock reads on `performance.now()`.
- [x] Re-run the focused test, then the adapter package test and typecheck.

### Task 2: Complete the S2 keep-set registry

**Files:**
- Create: `packages/adapters/src/aider.ts`
- Create: `packages/adapters/src/opencode.ts`
- Create: `packages/adapters/src/qwen.ts`
- Modify: `packages/adapters/src/types.ts`
- Modify: `packages/adapters/src/registry.ts`
- Modify: `packages/adapters/src/index.ts`
- Test: `packages/adapters/src/adapter.test.ts`

**Interfaces:**
- Consumes: exact commands and environment from `plans/s2-evidence/{aider,opencode,qwen}.md`.
- Produces: `getAdapter("aider" | "opencode" | "qwen")`, with `capabilities.toolVisibility` set to `none` for aider and `partial` for opencode/qwen; each adapter is marked `containerOnly: true` so the host runner cannot accidentally install or invoke it on the Mac.

- [x] Add failing PATH-stub tests that assert each adapter resolves, rejects a host invocation with a typed `ConfigError`, and exposes the exact S2 argv/environment recipe through a container invocation descriptor.
- [x] Run the focused tests and confirm they fail because the registry currently rejects all three names.
- [x] Add the minimal `containerOnly` capability and invocation descriptor needed by S5. Aider must unset `OPENROUTER_API_KEY`, set `OPENAI_API_KEY` and `OPENAI_API_BASE`, and use `--yes-always --no-git --openai-api-base <proxy>/v1 --model <model> hello.ts --message <prompt>`. OpenCode must use `OPENAI_API_KEY`, `OPENAI_BASE_URL=<proxy>/v1`, retain `OPENROUTER_API_KEY`, and run `opencode run --model <model> <prompt>`. Qwen must create an isolated HOME with `.qwen/settings.json` selecting `openai`, set the OpenAI environment, and run `qwen -p <prompt> --yolo -m <model> -o json`.
- [x] Register and export all three adapters; rerun focused tests and typecheck.

### Task 3: Failure and contract smoke coverage

**Files:**
- Modify: `packages/adapters/src/adapter.test.ts`
- Modify: `packages/adapters/src/spawn.ts` only if Task 1 leaves a failing behavior.

**Interfaces:**
- Consumes: the shared spawn helper and `validateC3AdapterResult`.
- Produces: schema-valid C3 results for timeout and an upstream/command failure without leaking secrets.

- [x] Add a test for a stub that exits nonzero after writing a secret and assert C3 validation succeeds, artifacts are present, and the secret is absent.
- [x] Add a test for the timeout stub and assert C3 validation succeeds with exit `124`.
- [x] Run the adapter tests and confirm both failure paths pass.

### Task 4: Fairness documentation and stage status

**Files:**
- Modify: `plans/S4-adapters-plan.md`
- Modify: `plans/README.md`
- Modify: `METHODOLOGY.md` only for facts established by the checked-in S2 evidence.

**Interfaces:**
- Consumes: the six S2 evidence files and adapter capabilities.
- Produces: an explicit per-adapter record of exact argv, environment, fresh-container image, and visibility; no claim that maintainer sign-off or official runs are complete.

- [x] Record the six-tool keep set and the three Docker-only tools in the status table.
- [x] Verify the docs stay within the approved vendor scope, contain no capabilities ranking, and make no unpublished result claims.
- [x] Run `git diff --check` and the full test/typecheck commands.

### S4 completion gate

S4 is complete only when every S2 keep-set name resolves, Docker-only tools cannot be
invoked through host mode, all failure artifacts validate as C3, and the docs accurately
retain the open maintainer-review/S7 gates. S5 consumes this exact adapter surface.

## Acceptance

Each adapter completes one real task end-to-end (container → proxy → OpenRouter **or** mock for CI) producing schema-valid `run.json` + `events.jsonl` once S5 exists; until then, a host-process run against mock/OpenRouter is enough for a smoke. Timeout and 500 paths are well-formed. Fairness notes reviewed.

## Next

S5 calls `adapter.run` inside the per-cell lifecycle.
