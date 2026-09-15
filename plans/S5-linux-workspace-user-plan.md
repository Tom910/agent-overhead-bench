# S5 Linux workspace user compatibility

## Evidence and boundary

After the verified-local-image-ID launch fix, Linux native reference
preparation reached the verifier but failed to remove the host-owned
`/work/workspace/.git`. The staged bind mount belongs to the host runner's
UID/GID; the verifier defaults to container root with all capabilities
dropped, so it cannot bypass ordinary ownership permissions. Most agent
adapters likewise omit an explicit user. Claude Code already declares the
host UID/GID.

The parent retained the failed five-sample PSD reference evidence, then ran
full native verifier probes using `1000:1000`, `HOME=/tmp`, read-only rootfs,
network none and dropped capabilities. The matching user passed the initial
workspace permission boundary but Git rejected the root-owned immutable
`/app/.git`. Trusting `/app` did not resolve that rejection.
CASE5 (`m/reference-diagnostic5`) passed the full PSD verifier: 979/979
and 45/45 tests, exit 0, with a global `/tmp/.gitconfig` trusting exactly
`/app/.git`. Environment-based Git configuration did not survive the verifier
subprocess boundary. The parent authorized implementation after this probe.

## Implementation

1. Add one internal Linux user-selection helper in
   `packages/runner/src/docker.ts`, using the host process UID/GID. Use the
   selected user for the measured agent and its version probe. Native/legacy
   verifiers use the host identity. Preserve explicit adapter users; use the
   host identity only when absent. Fail closed if Linux host identity is
   unavailable or invalid. Host UID 0 remains valid for root-owned workspaces.
   On Darwin preserve existing agent user/default and version-probe behavior.
   The relay remains `65532:65532` because it has no workspace bind mount.
2. Give Linux verifier launches `HOME=/tmp`, using their existing bounded
   writable tmpfs. Agent HOME stays the adapter's isolated workspace home;
   version probes already use `/tmp`. Do not add capabilities, change mount
   permissions, chown workspaces, add groups, relax read-only/network flags,
   or change image-ID checks.
3. Add `git config --system --add safe.directory /app/.git` to the verifier
   Dockerfile, preserving `/work/workspace`. This exact immutable-base trust
   entry survives native verifier subprocesses without trusting arbitrary
   repositories. Keep capture/reset/grading unchanged. Rebuild affected images
   through fresh preparation and retain earlier evidence unchanged.

The verifier configuration is already copied from the readable image asset
into `/tmp/aob-verifier-config.json`, and `/tests/config.json` points there.
No hidden-input write-path redesign is proposed. Root-owned dependency
assets and full grading remain part of the offline probe; a new failure is
investigated before expanding scope.

## Test-first implementation after probe confirmation

- [x] Add fake-Docker regression coverage for Linux agent/version/native and
  legacy verifier user arguments and HOME; assert relay identity, isolation
  flags and bare verified image IDs remain unchanged.
- [x] Cover explicit adapter users, invalid/unavailable
  host identity, and unchanged Darwin behavior. Tests inject platform and
  UID/GID observations and never depend on the test host's actual identity.
- [x] Add a Dockerfile exact-path trust regression and, where available, an
  offline foreign-owner immutable-base fixture showing the specific clone
  trust boundary. Existing patch-capture tests must still prove that mutable
  agent Git history cannot select the patch base.
- [x] Observe the intended failures, implement only the confirmed change,
  then run focused runner/capture tests and workspace TypeScript checks.
- [x] Return the diff and test evidence for parent review without committing.

The parent owns remote probes, image rebuilds, fresh reference verification
and Linux migration. This local subtask performs no remote actions or paid
requests. C1–C4 schemas, measurement clocks, native verifier gates and retained
attempt/no-rerun behavior remain unchanged.

## Local validation

The new regressions failed first (8 runner cases and the exact-path Dockerfile
fixture), then passed after implementation. Full runner suite: 212/212.
Focused suite after the test-only TypeScript annotation fix: 15/15. Preparation,
patch capture and trust fixtures: 10 passed, 2 existing Docker-gated tests
skipped. All workspace TypeScript checks and `git diff --check` passed. The
parent's full native PSD CASE5 probe supplies the Linux execution evidence;
local tests do not claim to rebuild or exercise the new image. No commit or
remote action was performed by this subtask.
