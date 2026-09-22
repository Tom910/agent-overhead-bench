# S5: execution-condition evidence

Completes approved comparison item 2 after S6. No new measurement model,
dependencies, API calls or changes to native harness prompts/tools/context.

Retain measured containers until Docker inspection finishes, then remove them
in finally. On timeout kill instead of immediately removing the container.
Take the monotonic end timestamp before inspection; inspection is not workload
time. Keep persisted container ownership and existing interrupted-run cleanup.

Allowlist Docker-reported image identity, CPU quota/period/nanocpus/cpuset,
memory/reservation/swap, PID ceiling, storage size option, readonly-root,
network mode/internal status, and OOM state. Distinguish unset Docker limits
from unknown ancestor/host limits. Bind-mounted workspace disk quotas and
provider cache state are not established by Docker inspection. Record them
as unknown/uncontrolled, not cold or equal. Inspect errors produce explicit
unavailable evidence, never invented controls or changed native task outcomes.
Do not retain full inspect output, environment, command or host paths.

Write private per-container observations and a versioned execution-conditions
sidecar bound to exact C4 bytes; validate identities and observation schema on
read. No derived fields in C4. Clear sidecars when staging a new attempt.
Retain agent evidence when verification is skipped. Existing future C1-bound
request-setting capture remains the source of forwarded settings, not proof of
provider defaults. Historical comparison conditions remain unknown.

Verification: failing tests first for allowlisting, missing/malformed values,
image/network drift, exact run binding and stale evidence. Exercise Docker
launch/inspection/cleanup ordering and timeout retention with an executable
fixture; run one Linux offline container smoke with no provider calls. Run full
tests, lint/types and final report freshness/site build before publishing.

Linux validation exposed a pre-existing linter error: it parsed Bash scripts
with `sh` (dash on Linux), rejecting valid Bash arrays. The linter now honors
an explicit Bash shebang while continuing to check POSIX scripts with `sh`.

## Verified

2026-09-22: isolated Linux checkout passed 824 package tests, 158 script tests
(two existing opt-in Docker tests skipped), strict types and shell/JavaScript
lint. Actual Linux Docker smoke passed normal and timeout cases, observed both
agent and verifier settings, and confirmed container cleanup, without provider
requests. Extra-network, image-drift, raw-byte binding, stale-sidecar and bounded
cleanup regressions pass. Independent review's unbounded-removal finding was
fixed with a five-second removal timeout; persisted ownership remains available
for resume cleanup. Validation artifacts are private under
`scratch/goal-validation-20260922` and `scratch/runtime-conditions-smoke-20260921`
on the Linux host. Historical campaign measurements are unchanged.
