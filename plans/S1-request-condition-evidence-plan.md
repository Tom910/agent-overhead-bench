# Capture forwarded request conditions without prompt bodies

Supports approved comparison-condition requirement. Implement after the S7 task
revision and before S6 comparison reporting. Extend the existing private
upstream-evidence sidecar, not frozen C1 or C4 schemas.

Capture a bounded allowlist of effective forwarded request settings after
provider-routing transformations: sampling values, token/output caps, reasoning
and thinking budgets/effort, provider allowlist/fallback policy and cache hints
where explicitly observable. Record omitted settings as provider defaults not
known numeric values, malformed/oversized/incomplete bodies as unavailable.
Never serialize prompts, tool definitions, arbitrary strings or credentials.
Each sidecar record retains its existing C1 sequence/hash binding. This adds
observation only: do not normalize away native harness behavior or alter requests.

Historical sidecars do not contain this capture and remain explicitly unknown.
Tests must exercise real local HTTP proxy forwarding, routed settings, failure
paths, bounds, secret exclusion and unchanged C1 shape. Run proxy tests/types.
No network beyond local fixtures; no new dependencies or model calls.

Implemented and verified: 116 proxy tests and strict typecheck pass. Local HTTP
fixtures cover successful and rejected requests, post-routing values, exact C1
hash binding and prompt exclusion. Existing frozen C1 records are unchanged.
Capture describes forwarded settings, not proof that a provider honored them;
omitted defaults and provider-side cache state remain unknown.
