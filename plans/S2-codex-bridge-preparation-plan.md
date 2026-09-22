# S2 Codex subscription bridge preparation

The maintainer requests reusable open-source transport for exact `gpt-6-luna`
across all five native harnesses. S5 retention is independently reviewed at
`e01132a`; this stage now takes priority before further benchmark packages.

## Scope

Reuse pinned CLIProxyAPI `2430354330af80b645f9ffb1a51e1e7c72c4cc8e`.
Implement an **offline preparation command**, not an approved campaign profile.
No new dependencies, auth network requests, real credential reads during
validation, paid runs or modifications to C1–C4. Type errors explicitly.

A user-specified Codex CLI auth.json can be converted into the bridge's flat
record in a new private output directory. Require explicit acknowledgement of
exclusive refresh ownership; never auto-discover credentials, never change the
source cache, never start the bridge or acquire allowance. Existing source
credentials may become stale once another owner refreshes; document using a
separate bridge login as the simpler long-lived alternative.

## Task 1: Offline private bundle

Files: `scripts/s2-codex-bridge-prepare.mjs`, its Node test, and
`docs/codex-subscription-bridge.md`.

- Use existing repository typed ConfigError where compatible, or a named typed
  preparation error. No npm dependency. Exports pure auth conversion and bundle
  preparation functions; importing the module must not execute its CLI.
- CLI requires `--auth-file`, `--output`, `--exclusive-refresh-owner`. No implicit
  HOME/config lookup. Source must be a bounded regular non-symlink file opened
  with no-follow protection. Reject API-key mode, incomplete tokens, invalid
  JSON, invalid account identity and unsupported auth shape without echoing
  input or parser details. Accept the standard nested tokens record only.
- Build a fresh private directory, files 0600/directories 0700, containing one
  Codex credential record, random local bridge key and JSON-as-YAML config with
  absolute private auth directory. Reject existing/symlink output and do not
  overwrite anything. Bound source size. Clean failed preparation privately.
- Pin source identity in a non-secret manifest. Do not store source credential
  path/account/email/tokens in that manifest or print secrets. Explicit status
  `unqualified`; no automatic launch/profile approval.
- Config: loopback; management/panel/discovery/plugins/pprof disabled; one local
  key, no provider API keys/aliases, no extra request/bootstrap retries or quota
  fallback; no raw request logging, no identity remapping or client cloaking;
  image-generation passthrough; no optional multi-agent rewriting. Keep bridge
  defaults with measured effect explicit. It has no positive OAuth model
  allowlist: require existing C1 exact-model guard and upstream identity evidence
  before any campaign. Do not call static exclusions an allowlist.
- Tests first: synthetic auth fixture conversion, private modes/source unchanged,
  no overwrite, symlink/big/invalid/API-key input rejection without secret output,
  required owner flag, sensitive manifest omission and no network/process launch.
- Run focused tests/lint; independent review before commit/merge.

## Task 2: Qualification evidence and reuse instructions

Run reviewed upstream translator/executor fixtures under network-disabled Linux
containers with fake credentials only. Record actual selected tests, source
pin, failures and remaining native-client/account checks. Do not call unit tests
proof of all-five live success. Document effective sampling/tool/reasoning
changes, reasoning replay gap and upstream model identity fidelity. If tests
find a mismatch, retain an explicit failed gate rather than approving a profile.

Native clients keep their own loops: Codex uses Responses; Cline/Hermes/Pi/Qwen
use Chat translated to Responses. Subscription allowance has unknown USD
allocation; preserve token counters, never substitute zero spend. Shared bridge
latency belongs to its observed route. No separately billed fallback.

## Completion boundary

An offline bundle and reviewed OSS tests make reuse concrete. Live account Luna
access, five actual native tool-call smokes, provider-boundary accounting and
reasoning-condition qualification remain separate prerequisites for measured
runs. Existing DeepSeek results and completed Linux attempts stay unchanged.

## Qualification follow-up

Offline Linux characterization confirmed two upstream defects affecting this
instrument: Chat streaming can mask a terminal served-model mismatch, and the
auth manager may refresh/replay a 401 despite zero configured retry rounds.
Prepare a minimal source-pinned optional patch with red/green fixtures for those
two behaviors. Preserve the unpatched characterization, patch SHA-256 and exact
build/source identity. Patch success does not settle reasoning continuity,
account entitlement or five native client compatibility. No broad bridge fork
or live account testing belongs in this stage.

Root baseline verification after S5: 859 package tests passed; 159 script tests
passed and two existing script tests skipped. All workspace typechecks passed.
The new S2 helper will receive its own focused tests and independent review.

The retry correction uses per-credential opt-in
`aob_disable_unauthorized_replay:true`, limited to Codex with effective retry
limit zero. This preserves upstream default recovery and positive overrides.
Preparation targets the patched pin explicitly, recording the required patch
hash while leaving build/patch verification false. A generated bundle is not
proof that its serving process applied the patch.

### Task 3: Native client protocol probe, if locally available

After the private setup and patch reviews, use the five already-cached pinned
Linux images and a scripted local Responses backend through the pinned bridge.
The entire test route must deny public egress, use synthetic auth, and mount no
host credentials. Observe one actual harmless tool operation and its next-turn
result per native client before a final response. Capture upstream settings and
usage; terminate bounded failures rather than repeating indefinitely. An API-key
fixture path proves protocol wiring only, not OAuth/account access; label it.
Keep this engineering evidence separate from campaign results. A missing local
image or incompatible fixture is an explicit pending gate, never a model failure.

Task 1 verification: 12 synthetic-credential tests passed locally and on the
isolated Linux copy, including exact required-patch byte binding. Independent
review covered configuration semantics and private output; root additionally
reviewed the patch opt-in and required-hash fields. No real auth file was read.
The private setup is implemented; it intentionally grants no campaign eligibility.

Task 2 complete: 109 baseline top-level checks characterize the pinned bridge;
67 top-level checks pass after applying the exact two-file patch to a pristine
Linux source archive. Baseline defects, red regressions, final patch hash and
network-disabled green evidence are retained in `s2-evidence/codex-bridge/`.
Root independently reviewed the patch and private helper; whole-branch review
found no P1/P2 integration findings.

Task 3 complete: all five exact pinned native Linux clients exit successfully
with a real tool side effect and next-turn result, using two fake requests each.
The initial Cline fake-tool mapping error is preserved; only that fixture was
corrected and Cline retried once. The internal network denied public egress;
all created containers/networks were removed. Sanitized evidence records binary
and image hashes, settings and native token counter differences. This direct
native → bridge → fake API-key route did not include C1 or real OAuth.

Stage outcome: reusable private preparation and offline protocol qualification
are implemented. A live benchmark profile is intentionally not enabled. Actual
account access, C1/provider-attempt accounting and matched reasoning/continuity
conditions remain open. Packages 2–6 in the benchmark audit remain planned.
