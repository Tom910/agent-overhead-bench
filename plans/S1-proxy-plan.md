# S1 — Logging proxy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Expand TDD steps when this stage starts; do not change the contracts or acceptance below.

**Implementation status (2026-08-26):** passthrough + clocks done. Usage extractors cover S2 keep dialects: Anthropic `message_delta` (Claude Code fixture), OpenAI chat (Hermes fixture), nested `response.usage` (Responses; S2 dump kept only `[DONE]`). Calibration p99 vs direct mock. OpenRouter generation-usage fallback is also implemented and tested.

**Follow-up resource-boundary correction (2026-08-27):** incoming request
bodies are streamed to the upstream while a bounded 16 MiB prefix is retained
for model inspection. Oversized or unparseable bodies continue upstream
unchanged and record `model_requested: null`; they are never converted into a
proxy-generated HTTP error. Client aborts before `end` use the typed network
error path rather than being treated as completed request bodies.

**Follow-up implementation (2026-08-26):** the calibration acceptance is now
exposed as `scripts/s1-calibrate.sh`. It runs only the in-repo mock upstream,
writes a caller-selected report, and records the delay, concurrency, rounds,
sample count, and p50/p99 added latency. The library no longer writes an
implicit file as an import-time side effect.

**Goal:** A local HTTP proxy that forwards provider traffic byte-for-byte and writes C1 JSONL with monotonic timestamps accurate enough to found the study.

**Architecture:** Node `http` server; upstream via `undici` keep-alive. Local side is plain HTTP (the CLI’s `*_BASE_URL` target — no MITM, no TLS on localhost). Streaming tap, not a client-visible buffer: bytes are piped through while a bounded tap reads only what usage extraction needs. Oversize responses are marked usage-unavailable unless generation lookup recovers their counters. One proxy process per run cell, `run_id` in config, port `0`.

**Tech Stack:** Node 24, `@aob/contracts`, `@aob/mock-upstream`, `undici` (justified: keep-alive pooling and streaming to TLS upstream; Node `http.request` is worse for undici-level pooling). No other new runtime deps.

**Spec:** North-star §4.1, roadmap S1 and C1. Prototype first; usage-extractor completeness waits on S2 fixtures.

## Global Constraints

- Inherited from `plans/README.md`.
- Proxy never retries, never mutates bytes, never caches, never handles auth beyond header passthrough.
- Request/response bodies are not written to `events.jsonl`.
- `usage` is never guessed. Missing → `usage: null` and an honest `usage_source`. If OpenRouter supplies `X-Generation-Id` and the response body has no usage, the proxy performs the documented generation lookup; lookup failures remain `unavailable` and never alter the passthrough response.
- Concurrent overlapping requests are normal. `seq` is arrival order. Do not serialize.
- Prototype (passthrough + clocks + JSONL) may land before S2. Declaring S1 done before extractors match S2 dialects is a plan violation.

## Contracts consumed / produced

- Consumes: `C1Event`, `ClockAnchor`, `validateC1Event`, `ContractViolation`, `startMockUpstream`.
- Produces: `events.jsonl` (one valid C1 line per upstream request); library `startProxy(opts)` and CLI `aob-proxy`.

```ts
export type ProxyOptions = {
  run_id: string;
  upstream: string;       // e.g. http://mock or https://openrouter.ai/api
  outPath: string;        // events.jsonl
  port?: number;          // default 0
};

export type ProxyHandle = {
  port: number;
  baseUrl: string;        // http://127.0.0.1:<port>
  anchor: ClockAnchor;    // this process
  close: () => Promise<void>;
};

export function startProxy(opts: ProxyOptions): Promise<ProxyHandle>;
```

CLI: `aob-proxy --port 0 --upstream https://openrouter.ai --out events.jsonl --run-id <id>`

## Out of scope

Request mutation, caching, HTTPS termination on the local side, auth, adapters, Ori, derived metrics, Anthropic extractor before an S2 fixture exists.

## Human review

Maintainer timing-correctness review: calibration report (self-overhead ≤ 5 ms p99 under 10 concurrent streams) and ±10 ms timestamp accuracy against mock delays.

## Risks

| Risk | Mitigation |
|---|---|
| Tap corrupts SSE / Anthropic `event:` frames | Byte-for-byte fixtures in CI |
| OpenAI-only extractor shipped as “done” | Acceptance item 3 requires S2-captured dialects |
| Self-overhead pollutes harness_time | Calibration harness; publish the number in METHODOLOGY |

---

### Tasks (implement in this order)

1. **Passthrough + clocks.** `startProxy` against `startMockUpstream`. Forward method, path, headers (except hop-by-hop), body. Record `t_req_start`, `t_req_body_end`, `t_upstream_sent`, `t_first_byte`, `t_last_byte` on the proxy’s monotonic clock. Write JSONL, `fsync` at request end. Crash-safe: killed process leaves parseable lines (no truncated last line, or a scanner that skips one broken line).
2. **Byte-for-byte fixtures.** Tests: chunked SSE, non-streamed JSON, gzip if the mock emits it, early client disconnect, upstream 429/500, slow-trickle streams. Response bytes the client receives === bytes the mock sent.
3. **Overlap.** Ten concurrent requests → ten events, overlapping intervals preserved (`t_req_start` of B can fall inside A).
4. **Usage extractors after S2.** One module per `protocol` value S2 observed. OpenAI chat: SSE `data:` lines / JSON `usage`, `prompt_tokens_details.cached_tokens`. Anthropic Messages: terminal `message_delta` usage. Responses API only if Codex is included. When a response has no usage and includes OpenRouter's `X-Generation-Id`, query `/api/v1/generation?id=...` with the forwarded authorization header and map its token fields. Unknown dialect → `protocol: "unknown"`, `usage: null`, `usage_source: "unavailable"`.
5. **Calibration.** Script: mock with known `delayMs`, 10 concurrent streams, report p50/p99 added latency. The S7 preflight fails if p99 > 5 ms (localhost); the unit test checks that calibration returns finite nonnegative measurements without making this timing gate flaky under workspace-wide test scheduling. Commit the script; the S7 METHODOLOGY quotes its last run.
6. **CLI + library.** Runner will import the library. CLI is for humans and S2 chaining tests.

TDD: each task starts with a vitest file hitting mock-upstream. CI never talks to OpenRouter.

## Acceptance

1. Byte-for-byte passthrough on the fixture list above.
2. Timestamp accuracy ±10 ms vs mock `delayMs`.
3. Usage extraction correct on **S2-captured** fixtures for every included dialect; `usage_source` honest.
4. Ten overlapping requests → ten well-formed C1 events.
5. Calibration report generated by a repo script.

### Follow-up: make calibration reproducible from the repository root

**Acceptance tests written before implementation:**

- The report formatter emits a complete, stable text report containing the
  configured delay, concurrency, rounds, sample count, p50, and p99 values.
- The repository script writes that report to the requested path and does not
  create the old implicit `packages/proxy/calibration.txt` artifact.
- The script's default invocation uses ten concurrent requests and makes no
  provider request.

**Implementation:** move command-line behavior into a dedicated calibration CLI,
export a pure formatter, and add `scripts/s1-calibrate.sh` using the existing
TypeScript source loader. Keep the existing direct-vs-proxy mock measurement and
do not change C1 fields or the S1 timing model.

**Out of scope:** changing the p99 threshold, adding a runtime dependency,
network/provider calibration, or making calibration part of `npm test`.

**Follow-up verification (2026-08-27):** the proxy timestamp test now checks
both sides of the declared ±10 ms delay bound for the measured upstream span;
the wider historical upper bound is no longer used as acceptance evidence.

## Next

S4 uses `baseUrl` as `proxyUrl`. S5 launches one proxy per cell with that cell’s `run_id`.
