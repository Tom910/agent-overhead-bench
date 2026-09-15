# S5 launch verified local Docker image IDs

The Linux migration's native image probe showed Docker 28.2.2 with a locally
built amd64 verifier image whose `RepoDigests` is empty. Launching its tag
combined with the inspected `.Id` (`name:tag@sha256:...`) failed with exit 125
and `No such image`; launching the bare `.Id` succeeded. The probe is retained
in `scratch/linux-migration-20260913/docker-image-identity-probe.json`.

The runner reads Docker's local `.Id`, not a registry manifest digest. It
must launch that already-inspected local ID directly. Keep the existing
declared-tag inspection and expected-ID equality checks so retagged agent or
verifier images still fail before execution. Keep `--pull=never` on every
launch. This changes neither the recorded image IDs nor C1–C4 schemas.

## Bounded implementation

1. Add fake-Docker regressions before implementation. The fake exports local
   IDs for tag inspections, rejects `name@ID` launches with exit 125, and
   accepts only the expected bare ID for relay, version probe, agent, and both
   native/legacy verifier launches. Assert image identity drift still rejects
   before the affected workload runs.
2. In `packages/runner/src/docker.ts`, use the inspected relay ID directly;
   use the inspected agent ID for its version probe and execution; use the
   inspected verifier ID after the existing equality check for both verifier
   execution paths. Preserve all remaining flags, timing and error handling.
3. In `scripts/s7-preflight.sh`, inspect each prepared agent/verifier tag with
   `--format {{.Id}}` and require equality to its declared image ID. Do not
   construct `name@ID` for presence checks. Missing images and identity drift
   remain failures. Exercise both inline preflight gates with a local fake
   Docker process for matching, missing, malformed and mismatched identities.
4. Adjust existing runner expectations and the integration fake's lookup of
   the agent command after the bare image ID, then run the runner tests, relevant
   preflight fixtures and workspace TypeScript checks. Tests use local fake
   executables and require no Docker daemon, credentials or paid requests.

No model, source/verifier contract, report behavior, task artifact or existing
run evidence changes. No remote actions or paid retries are part of this fix.
Parent review precedes any commit and the separate Linux migration resumes
with fresh no-spend preparation only after the fix is reviewed.

## Local verification (2026-09-12)

The new launch regression initially failed four of five tests on the invalid
image-reference form; the existing verifier drift check still passed. The
new preflight regressions initially failed four of six tests. After the fix
and the integration fixture's image-argument update:

- `rtk proxy npm run test --workspace @aob/runner`: 202 tests passed.
- The seven relevant Node preflight/profile/source-policy/cap test files,
  including `scripts/s7-local-image-identity.test.mjs`: 49 tests passed.
- `rtk proxy npm run typecheck`: all workspaces passed.
- `rtk proxy git diff --check`: clean.

All verification here used local fake Docker executables or mock upstreams;
no real Docker launches, remote actions, provider requests or artifact rewrites
were performed for this S5 change.
