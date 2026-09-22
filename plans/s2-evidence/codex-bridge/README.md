# Codex subscription bridge: offline qualification

Reviewed September 22, 2026. Reuse candidate:
[CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI/tree/2430354330af80b645f9ffb1a51e1e7c72c4cc8e),
pinned at `2430354330af80b645f9ffb1a51e1e7c72c4cc8e`.
Target: exact `gpt-6-luna` through all five native harnesses.

This is an **unqualified transport candidate**, not a new benchmark campaign or
model profile. No real credentials, account entitlement requests or inference
were used. Existing Linux data remains unchanged.

## Why reuse it

It implements OAuth model transport, refresh, Responses and Chat Completions,
streamed function calls and usage translation. The benchmark's existing Codex
adapter uses Responses; Cline, Hermes, Pi and Qwen use Chat. Their native agent
loops can remain intact. Its checked-in catalog names exact Luna; that does not
establish this user's account access.

The earlier official-documentation-only finding is superseded. Open-source
technical support exists; official support and empirical qualification are
separate questions. See [feasibility](../../S2-gpt-6-luna-subscription-feasibility.md).

## Gates and observed limitations

| Gate | Evidence / remaining work |
|---|---|
| Present input/output/cache/reasoning usage | Offline exact-Luna fixtures preserve counts; reasoning is included in output, not added twice |
| Missing usage | Offline fixtures preserve absence instead of manufacturing zero |
| Tool call/result conversion | Upstream translator fixtures and exact-Luna history fixture pass; actual pinned native loops still need testing |
| Exact served model | Unpatched Chat translator can hide a terminal mismatch; retain failing characterization and reviewed patch evidence |
| No hidden model attempts | Unpatched auth manager can refresh/replay 401 despite zero retry rounds; retain characterization and reviewed patch evidence |
| Reasoning continuity | Four Chat routes lose encrypted reasoning items; Responses can retain them. No parity claim |
| Equal effective settings | Codex currently requests high effort; absent Chat effort becomes medium. Token/sampling fields and parallel calls are rewritten |
| Tool inventory | Default executor can inject an image tool; setup must disable injection and effective body must be checked |
| Credential isolation | Offline private setup uses synthetic fixtures; real account onboarding remains unperformed |
| Exact model restriction | OAuth config has exclusion lists, not a positive allowlist. Existing C1 body guard and upstream identity checks are mandatory before collection |
| Native five-client execution | All five pinned Linux clients passed a real tool call/result roundtrip with two synthetic requests; direct bridge route, no C1 or OAuth |
| Account Luna access / allowance | Unverified; offline tests cannot establish either |

## Measurement boundary

C1 observes the route through the bridge. Translation and buffering are part of
that interval; no guessed overhead subtraction is allowed. Capture effective
settings and each backend attempt before qualifying collection. This is the
existing C1–C4 instrument, not a parallel accounting system.

Tokens remain the comparison baseline. Included subscription allowance has no
established per-run dollar allocation. API reference cost can be displayed as a
counterfactual; it must not become actual spend or zero-cost evidence.

## Reproduction and setup

The fixture recipe and pin-specific patch evidence live beside this file.
[Offline setup instructions](../../../docs/codex-subscription-bridge.md) describe
how to prepare a private single-account bundle. Preparation never launches the
bridge, updates model eligibility or starts benchmark attempts.

## Reviewed patch

[Patch evidence](patch-review.md) records two narrow corrections, applied to a
pristine pinned source archive and tested on Linux: 67 top-level tests passed
(98 including subtests). Terminal model mismatches remain visible, and explicit
Codex credential opt-in suppresses hidden 401 replay at effective retry zero.
Missing model identity and the other gates above remain unresolved.

The upstream MIT license is retained in [UPSTREAM-LICENSE](UPSTREAM-LICENSE).

[Native smoke evidence](native-smoke/review.md) records all five verified client
versions and exact image/binary identities. These are fake-provider engineering
checks, not model results. The checked-in fake backend is the exact tested
fixture; run it only inside an isolated private scratch mount (`/fixture`).
It writes raw request bodies to that mount and must not write to the checkout.
Host-specific orchestration and full native prompts remain private.
