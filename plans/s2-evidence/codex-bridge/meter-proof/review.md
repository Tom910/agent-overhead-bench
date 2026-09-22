# Provider-bound C1 bridge proof

2026-09-22. **The single C1 meter works after the bridge with synthetic OAuth credentials.** Linux `--network none` proof exercised Chat and Responses, streaming and nonstreaming, through the actual patched CLIProxyAPI HTTP server, C1 proxy and local scripted backend. No native harnesses were rerun and no real credentials, refresh or inference were used.

## Artifacts

- Upstream pin: `2430354330af80b645f9ffb1a51e1e7c72c4cc8e`.
- Prerequisite guards patch SHA256: `6a17e7ad40cff90e5b26722c13fdaea3255346d73a3d7966ec4af0014c54dc88`.
- New `cli-proxy-api-local-meter.patch` SHA256: `a7c497eee5f37098d08cf1f55168746f5c245eb8fb3b76bbb70440a62506cb9b`.
- Meter-enabled bridge binary SHA256: `6ac16cf587b39083b15616fea2ed3e276fa85b3ef95d8ba4084f8166408fa58e`.
- C1 implementation: repository commit `5369a8f`, including canonical `/responses`, exact requested-model admission and strict terminal identity capture.
- Go image: `golang@sha256:2a0ba12e116687098780d3ce700f9ce3cb340783779646aafbabed748fa6677c`; Node 24.15.0.

The separate metering patch changes six files, including its tests. It does not modify the earlier guard patch. Both artifacts applied using `git apply --check` and `git apply` to a fresh archive of the upstream pin. Combined targeted suites passed **67 checks including subtests**, with zero failures, under Docker `--network none`; see `meter-pristine-green.jsonl`. Meter-only checks passed 53 including subtests. Initial red tests, before implementation, are retained in `meter-red.log`.

## Scope of the narrow bridge patch

An OAuth record can explicitly set `aob_meter_base_url` to `http://127.0.0.1:PORT` or `http://localhost:PORT`. The validator rejects remote hosts, HTTPS, missing/invalid ports, user info, paths (including a trailing slash), query/fragment and invalid value types. It requires Codex OAuth classification and a private `header:x-aob-proxy-token` capability of 32–256 allowed characters. Invalid configuration returns a generic 400 before any upstream request; errors do not echo credential or URL input.

The valid local base overrides only the HTTP Responses inference destination. It preserves OAuth Authorization and account headers; it does not convert the credential into API-key mode. Metered-mode WebSocket, compact/image alternate routes are refused rather than silently bypassing C1. HTTP redirects are not followed in metered mode. Requests without this metadata preserve upstream behavior. The fixture uses the explicit direct-proxy setting and a clean process environment; alternate global proxy overrides are not qualified.

No refresh endpoint or credential-ownership behavior is changed. This opt-in is an instrumentation extension, not a credential import command, a generic remote upstream override, an OAuth entitlement check or a ready campaign profile. The metering proxy must share the bridge's host/network namespace so its literal loopback endpoint is reachable. C1 authenticates the bridge using the capability header, strips that header before forwarding, and leaves current OAuth Authorization intact because no `upstreamApiKey` override is set.

## End-to-end proof result

| Synthetic request | Client status | Actual backend attempts | C1 result |
|---|---:|---:|---|
| Chat streaming | 200 | 1 | Exact served identity, complete usage |
| Chat nonstreaming | 200 | 1 | Exact served identity, complete usage |
| Responses streaming | 200 | 1 | Exact served identity, complete usage |
| Responses nonstreaming | 200 | 1 | Exact served identity, complete usage |
| Terminal served-model mismatch | 200 | 1 | Served identity unknown; raw usage retained |
| Terminal model absent | 200 | 1 | Served identity unknown; raw usage retained |
| Wrong requested model | 400 | 0 | Explicit C1 proxy refusal, no provider request |
| Upstream 401 | 401 | 1 | One C1 upstream failure, no hidden retry |

There are **seven actual backend attempts and eight C1 events**. The extra event records the pre-forward refusal; it must not be mistaken for a provider call. Every actual backend request carried the synthetic OAuth bearer and account header, and none received the C1 capability header. No bearer or capability value appears in the C1/evidence output. This is the OAuth execution/header path with a synthetic access token, empty refresh token and future expiry—not proof of real refresh or subscription access.

Each successful fake response supplied 100 input, 40 cached input, 30 output and 10 reasoning-output tokens. C1 retained those counts even when model identity failed qualification. Do not turn those events into valid comparison outcomes: a strict bridge admission layer must reject unknown/conflicting served identity while keeping the spent-token evidence.

`proof.mjs` creates the synthetic OAuth record and all local services in one isolated container. Two initial startup probes observed an empty model registry before asynchronous credential registration completed, then received model-not-found with zero backend requests. The fixture now waits until exact Luna appears in the local `/models` response. Those readiness failures remain in private Linux scratch and are not model failures or benchmark attempts.

## Controlled request condition

The proof used the existing payload configuration:

```json
{
  "override": [{
    "models": [{"name": "gpt-6-luna", "protocol": "codex"}],
    "params": {"reasoning.effort": "low", "store": false}
  }],
  "filter": [{
    "models": [{"name": "gpt-6-luna", "protocol": "codex"}],
    "params": ["input.#(type==\"reasoning\")#", "previous_response_id", "conversation"]
  }]
}
```

At the final backend boundary, both source protocols and both client streaming modes had low effort and `store:false`. Interleaved synthetic reasoning items were absent, both conversation handles were absent, and the original user/function-call/function-output/assistant order and call IDs/results remained intact. This verifies the explicit **reasoning-replay-disabled condition**, not native-default behavior or semantic equivalence to replay-enabled reasoning.

One remaining parameter difference is visible in the evidence: Chat produces `reasoning.summary:"auto"`; synthetic Responses requests with no summary leave it omitted. A fully normalized summary condition needs an explicit common override/filter. The current proof does not pretend low effort alone makes every request setting identical. The filtering also does not validate context compaction, concurrent branches or long-task performance.

## Reproduction and boundaries

Use a fresh private Linux directory, apply both pinned patches in order, compile with the locked Go environment, and place `proof.mjs` in a writable `/proof` mount. It imports the reviewed repository at `/repo`, starts the bridge binary at `/bridge`, and uses only loopback ports. Run with Docker `--network none` and no host credential mounts. The fixture records source calls and final effective settings, not actual model responses. `summary.json` is sanitized engineering evidence; raw synthetic files/logs remain private at Linux `scratch/codex-bridge-qualification-20260922/meter-proof-run/`.

Outstanding work includes runner-owned ingress/profile wiring, strict comparison admission, full effective-setting normalization and any separately authorized real account/native smoke. The earlier five actual native clients already passed the basic protocol loop; this bounded proof justifies the C1 boundary and synthetic OAuth wiring, without rerunning them unnecessarily.
