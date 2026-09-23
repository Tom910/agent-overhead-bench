# S5 Luna subscription transport for existing Docker task cells

The maintainer authorized a full Luna benchmark: same eight tasks, five repetitions,
all five harnesses; start Codex and Hermes then continue the other three. This
stage connects the already qualified transport to the existing cell lifecycle.
The following S7 collection stage owns schedule/budget/resume, not measurement.

## Constraints and design

- Exact gpt-6-luna, existing low/summary:auto/reasoning-replay-disabled policy.
- One Linux host, serial provider execution, native harness/tool loop and existing
  Docker staging, candidate retention, verifier and canonical C1/C4 writers.
- Provider C1 stays AFTER the bridge. Its actual monotonic anchor travels into C4.
- Existing API-key routes unchanged. Task containers get only relay credentials;
  OAuth snapshot stays in a private readonly bridge mount, without refresh token.
- USD allocation remains null; do not synthesize zero rates or API charges.
- No npm dependencies, no model calls in CI or engineering tests.
- Default S2 smoke retains its two-request cap. Explicit task transport has finite
  per-attempt ceilings 512 provider requests, 100M input tokens, 1M output tokens.
  These exceed historical maxima for both starting harnesses. Token ceilings stop
  following requests; an in-flight response can exceed them. Timeout 10800s matches
  existing extended task manifests. Denials/unknown accounting halt admission.
- Require snapshot validity beyond the task timeout plus 15min before launch.
- Keep the exact historical eight task identities/prompts/verifiers/images for the
  model comparison. Existing task amendments/audits remain separately identified;
  do not introduce a Luna-only task revision or label this an official v1 freeze.

## Task 1: Typed cell transport seam

Modify packages/runner/src/cell.ts, export types via index.ts, add focused tests.
Optional CellSpec transport factory consumes {runId, eventsPath, authToken}; returns
{port, anchor, flush, close}. port is authenticated ingress; anchor/flush/close
belong to the single provider-side C1 owned by the transport. Default startProxy
path remains unchanged. Reject custom transport in host cells. Custom transport
requires exact served model and complete usage for successful model attempts
before verifier/admission; preserve failed C1 even if native process exits 0.
Validate safe port/anchor/lifecycle cleanup with local fixtures. Never overwrite
existing evidence in a campaign: collection checks happen before stageTask.

## Task 2: Reuse guarded bridge service for task ingress

Modify scripts/s2-codex-bridge-service.mjs and focused tests without changing CLI
smoke defaults. Programmatic options allow a bounded maxModelRequests and optional
relay ingress token; relay mode authenticates x-aob-proxy-token and inserts the
private bridge Authorization internally. Expose canonical C1 anchor/flush.
Task mode serializes provider admissions and checks completed canonical C1 before
next call for exact identity, usage availability, provider errors and token limits.
Preserve identity encoding and condition checks; bounded safe observations grow
with request limit. OAuth and local capability headers never reach task logs.

Add scripts/s5-luna-task-transport.mjs and tests. It creates one private snapshot,
starts the reused service and pinned patched bridge, waits for exact Luna readiness
without inference, then returns the cell seam. On every exit it flushes evidence,
stops its own container and removes snapshot/config secrets. Keep sanitized bound
route/build/condition provenance. Mock topology/test failures consume no allowance.

## Acceptance

Independent review and focused runner/service/transport tests, strict TypeScript,
then one real prepared Docker task against scripted responses and the unchanged
verifier with no WAN credentials. Only then S7 may launch funded task cells. No
benchmark reruns or smoke reruns are a prerequisite if existing evidence plus
changed-path offline tests cover the condition.

Acceptance passed on Linux on September 23 UTC: the existing SuperJSON task ran
through native Codex, the pinned bridge, canonical C1/C4 and unchanged verifier
using two synthetic provider responses. The marker-only candidate correctly
failed verification; usage was complete and USD stayed null. No account allowance
was used. See [sanitized proof](s5-evidence/luna-task-transport/offline-proof.json).
Independent review approved the runner, service and lifecycle changes; focused
tests, workspace types and lint passed. The S7 collection stage may now proceed.
