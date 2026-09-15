# S7 proxy capability-boundary plan

Status: implemented and verified

## Goal

Ensure a Docker cell's proxy route is a narrowly scoped, per-cell capability.
Only the adapter API paths exercised by the keep set are forwarded, and a
request must carry the ephemeral token installed by that cell's relay.

## Scope

- Add a per-cell relay token to the Docker route and proxy.
- Have the relay inject the token and strip it before forwarding upstream.
- Reject direct or cross-cell requests at the host-bound proxy.
- Allow only the observed model and metadata paths required by the six keep
  adapters; never forward arbitrary paths with the runner credential.
- Strip alternate authentication headers and preserve intentionally empty
  adapter variables when applying the Docker sentinel.
- Add zero-spend unit/integration tests for the boundary.

## Non-goals

- No external dependency or provider request.
- No change to C1–C4 timing equations.
- Custom upstream URLs remain useful for diagnostics, but official launch
  policy continues to require the pinned OpenRouter origin.

## Acceptance

1. A credentialed proxy rejects missing/wrong relay tokens and does not call
   its upstream.
2. A credentialed proxy rejects unapproved methods/paths without forwarding.
3. A relay injects its token and does not forward the token header upstream.
4. Docker adapter environments keep empty variables empty and contain no real
   provider credential.

Verification (2026-08-30): proxy 33/33 tests, runner 51/51 focused tests,
Docker relay integration 1/1, adapter integration 4/4, and the real
`scripts/s5-docker-route-smoke.sh` all pass.
