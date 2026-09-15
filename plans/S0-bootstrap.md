# S0 — Repo bootstrap Implementation Plan

**Follow-up implementation (2026-08-26):** added a dependency-free lint gate for all
project JavaScript and shell files and wired it into CI before typecheck/tests. TypeScript
static checks remain covered by the existing strict workspace typecheck; no npm
dependency was added.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Implementation status (2026-08-26):** done on `s0-bootstrap`. `packages/contracts`, `mock-upstream`, CI, AGENTS.md, README, lockfile. `npm test` / typecheck green.

**Goal:** Turn this empty repository into an auditable TypeScript npm-workspaces monorepo with draft C1–C4 contracts, a mock upstream, CI that spends zero tokens, and a stranger-clone `npm test` that passes offline.

**Architecture:** One private root workspace with `packages/*`. `packages/contracts` is the spine: TypeScript types, JSON Schema files, a fail-loud validator, and fixtures. `packages/mock-upstream` is a scripted HTTP server with known delays (no real provider). `packages/proxy` is an empty stub that imports contracts so later stages have a package to land in. No measurement behavior ships in S0.

**Tech Stack:** Node 24 (pin in `.nvmrc`; `engines.node: ">=22"`), npm workspaces, TypeScript 5 strict, vitest. No runtime libraries. No `ajv` yet — required-field validators are hand-written; JSON Schema files are the freeze artifact.

**Spec:** Measurement model and contracts in the case-repo north star + implementation roadmap. This plan is the coding brief. Do not invent a second measurement model.

## Global Constraints

- TypeScript `strict: true`. No global mutable state.
- Errors are typed: `ConfigError` | `UpstreamError` | `ToolError` | `ContractViolation` | `BudgetExceeded`. No bare throws.
- Default answer to a new npm dependency is no. S0 allowed deps: `typescript`, `vitest`, `@types/node` (dev). Nothing else.
- Monotonic clocks later; S0 only types the clock fields as milliseconds (`number`).
- No API keys, no OpenRouter calls, no Docker, no adapters.
- No derived metrics in `run.json` (type it as raw-only).
- Keep README and AGENTS.md within the project's explicit vendor-scope policy.
- Results unpublished: gitignore `results/`, `.env`, secrets, task `reference/`.
- Contracts `"v": 1` is the *shape* version. Freeze is a process gate at the end of S2/S3, recorded in `packages/contracts/CHANGELOG.md`.

## Contracts this stage consumes / produces

- Consumes: none (empty repo).
- Produces: draft C1–C4 TypeScript types + JSON Schema + one valid fixture each + `validateC1Event` / `validateC2Task` / `validateC3AdapterResult` / `validateC4Run` + mock-upstream library entry + CI + AGENTS.md + MIT LICENSE + placeholder README.

## Out of scope

Real proxy, adapters, Docker images, Ori, any provider API, task suite content, report rendering, METHODOLOGY claims.

## Human review

None beyond `npm test` passing. Maintainer acceptance-level glance is enough.

## Risks

| Risk | Mitigation |
|---|---|
| Implementer adds eslint / ajv / undici "while we're here" | Dependency budget: reject. S1 adds `undici`. |
| `"v": 1` treated as frozen | CHANGELOG states draft until S2/S3 freeze. |
| Proxy stub grows behavior | Stub exports a constant only. |

---

### Task 1: Root workspace, ignore rules, license

**Files:**
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `.nvmrc`
- Create: `.gitignore`
- Create: `LICENSE`
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: none
- Produces: `npm test` script (will fail until Task 2 adds a package)

- [x] **Step 1: Write root `package.json`**

```json
{
  "name": "agent-overhead-bench",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22" },
  "workspaces": ["packages/*"],
  "scripts": {
    "test": "npm run test --workspaces --if-present",
    "typecheck": "npm run typecheck --workspaces --if-present"
  }
}
```

- [x] **Step 2: Write `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "Node16",
    "moduleResolution": "Node16",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "skipLibCheck": true
  }
}
```

- [x] **Step 3: Write `.nvmrc` containing exactly `24`.**

- [x] **Step 4: Write `.gitignore`**

```
node_modules/
dist/
results/
.env
.env.*
*.secret
**/*.raw.secret
packages/tasks/**/reference/
coverage/
.DS_Store
```

- [x] **Step 5: Write MIT `LICENSE` with copyright `Copyright (c) 2026 Andrei Marchenko`.**

- [x] **Step 6: Write `.github/workflows/ci.yml`**

```yaml
name: ci
on:
  push:
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: ".nvmrc"
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
```

CI must not declare `env:` secrets. No OpenRouter, no API keys.

- [x] **Step 7: Commit**

```bash
git add package.json tsconfig.base.json .nvmrc .gitignore LICENSE .github/workflows/ci.yml
git commit -m "chore: bootstrap workspace, license, and CI"
```

---

### Task 2: `packages/contracts` types, schemas, validator, fixtures

**Files:**
- Create: `packages/contracts/package.json`
- Create: `packages/contracts/tsconfig.json`
- Create: `packages/contracts/src/errors.ts`
- Create: `packages/contracts/src/clock.ts`
- Create: `packages/contracts/src/c1.ts`
- Create: `packages/contracts/src/c2.ts`
- Create: `packages/contracts/src/c3.ts`
- Create: `packages/contracts/src/c4.ts`
- Create: `packages/contracts/src/validate.ts`
- Create: `packages/contracts/src/index.ts`
- Create: `packages/contracts/schemas/c1.event.schema.json`
- Create: `packages/contracts/schemas/c2.task.schema.json`
- Create: `packages/contracts/schemas/c3.adapter-result.schema.json`
- Create: `packages/contracts/schemas/c4.run.schema.json`
- Create: `packages/contracts/fixtures/c1.event.valid.json`
- Create: `packages/contracts/fixtures/c2.task.valid.json`
- Create: `packages/contracts/fixtures/c3.adapter-result.valid.json`
- Create: `packages/contracts/fixtures/c4.run.valid.json`
- Create: `packages/contracts/fixtures/derivation/overlap.json`
- Create: `packages/contracts/CHANGELOG.md`
- Create: `packages/contracts/src/validate.test.ts`
- Test: `packages/contracts/src/validate.test.ts`

**Interfaces:**
- Consumes: none
- Produces:
  - `export type ClockAnchor = { wall_clock_iso: string; monotonic_zero: number }`
  - `export type C1Event` (fields below)
  - `export type C2TaskYaml`
  - `export type C3AdapterResult`
  - `export type C4Run`
  - `export function validateC1Event(data: unknown): C1Event`
  - `export class ContractViolation extends Error { readonly kind: "ContractViolation" }`

- [x] **Step 1: Write the failing test `packages/contracts/src/validate.test.ts`**

```ts
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  ContractViolation,
  validateC1Event,
  validateC2Task,
  validateC3AdapterResult,
  validateC4Run,
} from "./index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadFixture(rel: string): unknown {
  return JSON.parse(readFileSync(join(root, "fixtures", rel), "utf8"));
}

describe("C1", () => {
  it("accepts the valid fixture", () => {
    const event = validateC1Event(loadFixture("c1.event.valid.json"));
    expect(event.run_id).toBe("s5-cell-uuid");
    expect(event.protocol).toBe("anthropic_messages");
    expect(event.usage?.cached_input).toBe(31400);
  });

  it("rejects missing t_req_start", () => {
    const raw = loadFixture("c1.event.valid.json") as Record<string, unknown>;
    delete raw.t_req_start;
    expect(() => validateC1Event(raw)).toThrow(ContractViolation);
  });

  it("never guesses usage — null is legal", () => {
    const raw = loadFixture("c1.event.valid.json") as Record<string, unknown>;
    raw.usage = null;
    raw.usage_source = "unavailable";
    expect(validateC1Event(raw).usage).toBeNull();
  });
});

describe("C4", () => {
  it("accepts the valid fixture and forbids derived metric keys", () => {
    const run = validateC4Run(loadFixture("c4.run.valid.json"));
    expect(run.outcome).toBe("completed");
    expect("harness_time" in run).toBe(false);
    expect("harness_share" in run).toBe(false);
  });
});

describe("derivation fixture", () => {
  it("records the overlap worked example numbers", () => {
    const fx = loadFixture("derivation/overlap.json") as {
      expected: { startup: number; model_time: number; tool_time: number; harness_time: number };
    };
    expect(fx.expected).toEqual({
      startup: 2500,
      model_time: 6500,
      tool_time: 1800,
      harness_time: 1700,
    });
  });
});
```

- [x] **Step 2: Add scripts to `packages/contracts/package.json` and run the test to verify it fails**

```json
{
  "name": "@aob/contracts",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "devDependencies": {
    "@types/node": "^24.0.0",
    "typescript": "^5.9.0",
    "vitest": "^3.2.0"
  }
}
```

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "rootDir": "src", "outDir": "dist", "noEmit": true },
  "include": ["src/**/*.ts"]
}
```

From repo root: `npm install` then `npm test -w @aob/contracts`.

Expected: FAIL (module not found / fixtures missing).

- [x] **Step 3: Write types and validator**

`src/errors.ts`:

```ts
export class ContractViolation extends Error {
  readonly kind = "ContractViolation" as const;
  constructor(message: string) {
    super(message);
    this.name = "ContractViolation";
  }
}

export class ConfigError extends Error {
  readonly kind = "ConfigError" as const;
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export class UpstreamError extends Error {
  readonly kind = "UpstreamError" as const;
  constructor(message: string) {
    super(message);
    this.name = "UpstreamError";
  }
}

export class ToolError extends Error {
  readonly kind = "ToolError" as const;
  constructor(message: string) {
    super(message);
    this.name = "ToolError";
  }
}

export class BudgetExceeded extends Error {
  readonly kind = "BudgetExceeded" as const;
  constructor(message: string) {
    super(message);
    this.name = "BudgetExceeded";
  }
}
```

`src/clock.ts`:

```ts
/** Wall/monotonic pair. Durations are always computed inside one process. */
export type ClockAnchor = {
  wall_clock_iso: string;
  monotonic_zero: number;
};
```

`src/c1.ts` — fields must match this shape (JSONL line):

```ts
export type Protocol =
  | "anthropic_messages"
  | "openai_chat"
  | "openai_responses"
  | "unknown";

export type UsageSource = "response_body" | "generation_lookup" | "unavailable";

export type C1Usage = {
  input: number;
  cached_input: number;
  output: number;
  reasoning_output: number;
};

export type C1Error = { kind: string; detail: string };

export type C1Event = {
  v: 1;
  run_id: string;
  seq: number;
  t_req_start: number;
  t_req_body_end: number;
  t_upstream_sent: number;
  t_first_byte: number;
  t_last_byte: number;
  duration_ms: number;
  method: string;
  path: string;
  protocol: Protocol;
  model_requested: string | null;
  model_served: string | null;
  status: number;
  streamed: boolean;
  usage: C1Usage | null;
  usage_source: UsageSource;
  error: C1Error | null;
};
```

Mirror C2 / C3 / C4 from the roadmap §2.3–§2.5:

- `C2TaskYaml`: `{ id: string; language: "python" | "typescript"; size: "small" | "medium"; shape: "bugfix" | "test-fix" | "feature" | "refactor"; timeout_s: number; expected_minutes: [number, number]; description: string }`
- `C3AdapterResult`: `{ exitCode: number; tStart: number; tEnd: number; startupProbe?: number; toolEvents?: { tStart: number; tEnd: number; kind: string }[]; artifacts: { stdoutPath: string; stderrPath: string; toolLogPath?: string } }`
- `C4Run`: `{ v: 1; run_id: string; tool: string; tool_version: string; task_id: string; task_source: string; task_revision: string; task_regime: "short" | "long"; condition: "pinned" | "default"; rep: number; model: string; ori_version: string | null; tool_visibility: "none" | "partial" | "full"; anchors: { adapter: ClockAnchor; proxy: ClockAnchor }; adapter_result: C3AdapterResult; events_file: string; verification: { exit: number; duration_ms: number; logPath: string }; container: { image_digest: string; verifier_image_digest: string; started_iso: string }; task_environment: { kind: string; network: "disabled" }; host: { os: string; cpu: string; ram_gb: number }; spend_usd_estimate: number | null; price_book: string; outcome: "completed" | "timeout" | "adapter_error" | "verify_error" }`

`validate.ts`: a required-keys + enum checker. If `usage` is missing, throw. If `usage` is `null`, require `usage_source === "unavailable" | "generation_lookup"`. Never coerce missing usage to zeros. If a C4 object contains `harness_time` or `harness_share`, throw `ContractViolation`.

JSON Schema files list the same required keys (draft-07). They are documentation + freeze artifacts; the runtime validator is the TypeScript functions.

`fixtures/derivation/overlap.json`:

```json
{
  "adapter": { "tStart": 0, "tEnd": 12500 },
  "events": [
    { "t_req_start": 2500, "t_last_byte": 9000 },
    { "t_req_start": 4000, "t_last_byte": 8000 }
  ],
  "toolEvents": [{ "tStart": 9200, "tEnd": 11000 }],
  "toolVisibility": "full",
  "expected": {
    "end_to_end": 12500,
    "startup": 2500,
    "model_time": 6500,
    "sum_request_durations": 10500,
    "parallelism": 1.615,
    "tool_time": 1800,
    "harness_time": 1700
  },
  "expected_if_visibility_none": {
    "tool_time": null,
    "harness_time": null,
    "non_model_time": 3500
  }
}
```

`CHANGELOG.md`:

```
# contracts changelog

## unreleased (draft)

Shape version field is `v: 1`. **Not frozen.** Freeze at end of S2/S3.
```

- [x] **Step 4: Run `npm test -w @aob/contracts` and `npm run typecheck -w @aob/contracts`**

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add packages/contracts package-lock.json package.json
git commit -m "feat: add draft C1–C4 contracts, validators, and overlap fixture"
```

---

### Task 3: Mock upstream (zero API spend)

**Files:**
- Create: `packages/mock-upstream/package.json`
- Create: `packages/mock-upstream/tsconfig.json`
- Create: `packages/mock-upstream/src/server.ts`
- Create: `packages/mock-upstream/src/index.ts`
- Create: `packages/mock-upstream/src/server.test.ts`

**Interfaces:**
- Consumes: none
- Produces:
  - `export type MockUpstreamOptions = { delayMs: number; status: number; streamed: boolean; includeUsage: boolean }`
  - `export function startMockUpstream(opts?: Partial<MockUpstreamOptions>): Promise<{ baseUrl: string; close: () => Promise<void> }>`

- [x] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { startMockUpstream } from "./index.js";

describe("mock-upstream", () => {
  it("serves a non-stream JSON completion after delayMs", async () => {
    const { baseUrl, close } = await startMockUpstream({
      delayMs: 50,
      status: 200,
      streamed: false,
      includeUsage: true,
    });
    try {
      const t0 = performance.now();
      const res = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: "test", messages: [] }),
      });
      const elapsed = performance.now() - t0;
      expect(res.status).toBe(200);
      expect(elapsed).toBeGreaterThanOrEqual(40);
      const body = (await res.json()) as { usage: { prompt_tokens: number } };
      expect(body.usage.prompt_tokens).toBeGreaterThan(0);
    } finally {
      await close();
    }
  });

  it("can omit usage and return 429", async () => {
    const { baseUrl, close } = await startMockUpstream({
      status: 429,
      includeUsage: false,
      streamed: false,
      delayMs: 0,
    });
    try {
      const res = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        body: "{}",
      });
      expect(res.status).toBe(429);
      const text = await res.text();
      expect(text.includes("prompt_tokens")).toBe(false);
    } finally {
      await close();
    }
  });
});
```

- [x] **Step 2: Run test — expect FAIL (package missing).**

- [x] **Step 3: Implement `startMockUpstream` with Node `http.createServer`.** Bind port `0`. Delay with `setTimeout`. Non-stream body is a small OpenAI-shaped chat completion. Streamed mode writes SSE `data:` lines then `[DONE]`. No TLS. No third-party HTTP library.

- [x] **Step 4: Run `npm test -w @aob/mock-upstream`. Expected: PASS.**

- [x] **Step 5: Commit** `feat: add mock upstream with delay, SSE, 429, and missing usage`

---

### Task 4: Proxy stub, docs, root test gate

**Files:**
- Create: `packages/proxy/package.json`
- Create: `packages/proxy/tsconfig.json`
- Create: `packages/proxy/src/index.ts`
- Create: `packages/proxy/src/index.test.ts`
- Create: `AGENTS.md`
- Create: `README.md`

**Interfaces:**
- Consumes: `validateC1Event` from `@aob/contracts`
- Produces: `export const PROXY_NOT_IMPLEMENTED = true` (behavior lands in S1)

- [x] **Step 1: Write `packages/proxy/src/index.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { validateC1Event } from "@aob/contracts";
import { PROXY_NOT_IMPLEMENTED } from "./index.js";

describe("proxy stub", () => {
  it("depends on contracts and does not implement a proxy", () => {
    expect(PROXY_NOT_IMPLEMENTED).toBe(true);
    expect(() =>
      validateC1Event({
        v: 1,
        run_id: "x",
        seq: 0,
        t_req_start: 1,
        t_req_body_end: 1,
        t_upstream_sent: 1,
        t_first_byte: 2,
        t_last_byte: 3,
        duration_ms: 2,
        method: "POST",
        path: "/v1/messages",
        protocol: "unknown",
        model_requested: null,
        model_served: null,
        status: 200,
        streamed: false,
        usage: null,
        usage_source: "unavailable",
        error: null,
      }),
    ).not.toThrow();
  });
});
```

- [x] **Step 2: `packages/proxy/package.json` depends on `"@aob/contracts": "*"`.** Implement the stub. Run tests — expect PASS.

- [x] **Step 3: Write `AGENTS.md`**

```md
# agent-overhead-bench

Read `plans/README.md` before coding.

This repo measures where coding-agent CLIs spend wall-clock time and money (model vs harness vs tools). It is not a capabilities leaderboard.

Rules:
- Implement one stage at a time from `plans/S<N>-*.md`. Do not invent a second measurement model.
- No derived metrics in `run.json`.
- No new npm dependency without a justification in the stage plan. Default answer is no.
- TypeScript strict. Typed errors. Monotonic clocks for measurement.
- CI never holds API keys and never spends tokens.
- Keep the measured tool list within the approved vendor scope.
- Do not import SWE-bench, Terminal-Bench, or Vetta tasks.
```

- [x] **Step 4: Write placeholder `README.md`**

Title: Agent Overhead Bench.

First paragraph (positioning, above the fold): this is an independent measurement instrument that decomposes coding-agent CLI time and cost on short (1–5 minute) original tasks. It is not a capabilities leaderboard, not SWE-bench, not Terminal-Bench, and not a vendor harness cost claim. Results are unpublished until the v1 dataset ships.

Then: how to clone, `npm install`, `npm test`. Honest note that running the matrix needs API keys and will cost money (later stages).

- [x] **Step 5: From a clean tree, run `npm ci && npm run typecheck && npm test` with network disabled after `npm ci` (e.g. tests only).** Expected: PASS.

- [x] **Step 6: Commit** `docs: add AGENTS.md, placeholder README, and proxy stub`

---

## S0 acceptance

A stranger clone + `npm ci && npm test` passes with no secrets and no network after install. `@aob/contracts` is importable from `packages/proxy`. CI workflow exists and has no secrets.

## Next

Execute [S2-feasibility-checklist.md](./S2-feasibility-checklist.md) (decisions) in parallel with a passthrough-only S1 prototype if desired. Do not polish usage extraction until S2 fixtures exist.
