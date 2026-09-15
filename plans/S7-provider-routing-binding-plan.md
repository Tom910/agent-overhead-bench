# S7 consistent provider routing and evidence binding

Status: implemented; mock matrix, 37 campaign checks, 25 launch/archive checks,
typecheck, lint, and independent review pass. S1 exclusion transport and S0 raw contract
are implemented and independently reviewed. Maintainer authorized Relace
exclusion consistently across the six CLIs on 2026-09-08.

Default official launches to `AOB_IGNORED_PROVIDERS=relace` and expose
`--ignored-providers relace` through the runner CLI. Explicit empty environment
selects the original unrouted condition and cannot reuse routed validation.
Validate a sorted, unique
list before execution; pass the same immutable policy to host/Docker proxies
and record it in C4. Bind the policy to matrix definition/resume/reconciliation
and campaign validation, including sanitized validation snapshots and archive
checks. Old evidence remains valid only for its original absent policy.

No adapter knobs, model, task pins, verifier, pricing, usage consistency rules,
or dependencies change. Document complete request buffering under this routing
condition as added proxy work included in C1 request intervals in methodology.
Preserve previous failed attempts.

Tests: actual local mock matrix emits routed C4/state and refuses changed-policy
resume; campaign evidence rejects policy mismatch in definitions and any C4;
official shell argument propagation and no-spend validation snapshot behavior.
Run appropriate offline suites, typecheck, lint and independent review.

Live gate: small diagnostic excluded Relace but DeepInfra also returned output
70 / thinking 81. Configure the approved policy and retain this failure; do
not launch full validation or silently exclude additional providers while the
accounting precondition remains unsatisfied. All probes share the original
provider baseline plus $22.40 authorization.

## September 9 Z.AI validation

Add opt-in `AOB_ONLY_PROVIDER` / `--only-provider` alongside the existing
exclusion setting; record `only_provider` and `allow_fallbacks: false` in the
existing routing identity, C4, campaign validation, and archives. Propagate to
both host and Docker proxies. Existing matrix execution is sequential; launch
only one validation process, retaining stop-on-first-failure and budget guards.
Use a fresh root and fresh provider reservation after a current live preflight.
Old failed artifacts remain immutable. No dependencies or accounting changes.
