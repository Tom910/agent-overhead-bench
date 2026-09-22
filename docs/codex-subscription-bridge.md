# Codex subscription transport for five harnesses

[CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI/tree/2430354330af80b645f9ffb1a51e1e7c72c4cc8e)
provides a reusable OAuth transport: Codex can use Responses, while Cline,
Hermes, Pi and Qwen can use Chat Completions translated to Responses. Each native
harness keeps its own tool loop. The intended model is exactly `gpt-6-luna`.
This is a concrete preparation path, **not an approved benchmark profile or proof
that the account can access Luna through all five clients**.

The repository's preparation command is offline. It converts an explicitly
selected Codex CLI subscription credential file to a private bridge bundle. It
does not search HOME, log in, refresh tokens, start a process, contact a provider,
change the original file or consume allowance.

## Prepare a private bundle

For bounded qualification, use an **access-token snapshot**. The helper copies
the access token, identity token and account ID, never the refresh token. At
preparation time, the access token must have at least 15 minutes remaining. The
bridge cannot renew this snapshot; an expired or rejected token stops the run.
This mode requires a local C1 meter and uses the controlled reasoning policy
described below. Preparation alone does not start or configure that meter.

On the Linux collection host, choose an existing private parent directory and a
new output directory outside the checkout. Replace the example paths explicitly:

```sh
node scripts/s2-codex-bridge-prepare.mjs \
  --auth-file /absolute/private/path/to/auth.json \
  --output /absolute/private/path/to/new-bridge-bundle \
  --access-token-snapshot \
  --meter-url http://127.0.0.1:8318
```

`--meter-url` accepts only `http://127.0.0.1:PORT` or `http://localhost:PORT`, with
an explicit port from 1 to 65535 and no trailing slash, path, credentials or query.
Use the meter's actual listening origin. The bridge and meter must share a host
or network namespace for this loopback route.

The alternative `--exclusive-refresh-owner` mode imports the refresh token and
requires the original Codex CLI cache not to be used concurrently. Once the bridge
refreshes a copied credential, the original cache may become stale; concurrently
refreshing both copies can invalidate the session. The helper cannot enforce
exclusive ownership across programs. This mode may optionally use `--meter-url`;
without it, the legacy bundle has no controlled reasoning policy or meter route.
The two credential modes are mutually exclusive.

Do not put token contents into command arguments, environment variables, issue
reports or Git. The helper prints only a generic completion or error message.

The supported input is the standard nested subscription record: `tokens` with
`id_token`, `access_token` and `account_id`. `refresh_token` is optional and always
omitted from snapshot output; exclusive ownership requires it. Optional `auth_mode`
must be `chatgpt`; optional `OPENAI_API_KEY` must be null. An optional
`last_refresh` timestamp is retained. API-key mode and other input shapes are
rejected. JWTs receive structural checks and account-claim consistency checks;
**signatures, account entitlement and remaining allowance are not verified**.
Expiry is copied from the access token's `exp` claim. Snapshot mode rejects
expired or nearly expired tokens. Legacy exclusive ownership may retain an
expired credential for later refresh, which preparation does not attempt.

The helper accepts only a regular, non-symlink source of at most 256 KiB, opens it
without following a final symlink, and checks for changes during its bounded
read. It never overwrites an existing destination. It creates directories with
mode 0700 and files with mode 0600:

| File | Purpose |
|---|---|
| `auth/codex.json` | One flat Codex OAuth record, kept private |
| `bridge-key` | Random key for local clients, kept private |
| `meter-key` | Separate random C1 capability, present only with `--meter-url`, kept private |
| `config.json` | JSON-as-YAML bridge configuration containing the local key |
| `manifest.json` | Non-secret upstream commit, intended model and unqualified status |

The manifest excludes the credential path, account ID, email and token values.
It identifies upstream commit `2430354330af80b645f9ffb1a51e1e7c72c4cc8e`; it requires
the benchmark guard patch with SHA-256
`6a17e7ad40cff90e5b26722c13fdaea3255346d73a3d7966ec4af0014c54dc88`.
Metered bundles additionally require the local meter patch with SHA-256
`a7c497eee5f37098d08cf1f55168746f5c245eb8fb3b76bbb70440a62506cb9b`.
The manifest records the credential mode, whether a refresh token was imported,
and the snapshot expiry; metered bundles record policy
`luna-low-reasoning-replay-disabled`.
The manifest records `build_verified:false` and `patch_applied_verified:false`: it
does not attest that a binary was built from the pin or that the patch was applied. `manifest.json` is written last. Ordinary preparation
failures remove
the newly created private directory. A crash or cleanup failure can leave a
partial private directory; do not launch it or treat it as complete. This is not
a power-loss durability guarantee or protection against privileged concurrent
filesystem mutation.

## Configuration and measurement boundaries

The generated configuration binds to `127.0.0.1:8317`, uses the absolute private
auth directory, and contains one local client key and one OAuth credential. It
has no configured provider API keys, model aliases or paid fallback. Management,
panel downloads, discovery, plugins, profiling, steering, identity remapping,
client cloaking and optional multi-agent rewriting are disabled. Image-generation
tools are passed through without automatic insertion or removal.

`commercial-mode:true` removes the raw request logging middleware; setting only
`request-log:false` would still allow forced error request dumps in this upstream
version. Application debug and file logging are also disabled. A future launcher
must use a reviewed, clean environment: inherited `MANAGEMENT_PASSWORD`, Home
service configuration or other overrides can change upstream behavior despite
the file settings. Preparation does not launch or sanitize an existing process.

Additional credential retry rounds and stream bootstrap retries are set to zero,
quota fallback is disabled, and at most one credential is selected. **These
settings do not prove one upstream attempt per client request.** The unpatched
executor can refresh and replay after a 401. That path needs the separately
reviewed qualification patch and provider-boundary accounting before collection.
The generated credential contains `aob_disable_unauthorized_replay:true`; in the
required patch this suppresses Codex 401 replay only when effective request retry
is zero. Unpatched upstream ignores this metadata, so the field alone does not
establish that retries are disabled. Do not add per-credential positive retry
overrides, which intentionally retain normal upstream refresh behavior.
Normal cooldown behavior is retained; generated stream keepalives are disabled;
upstream response-header passthrough is disabled; direct outbound transport avoids
inherited proxy routing. These conditions must be recorded with future results.

With `--meter-url`, the credential contains `aob_meter_base_url` and an
`x-aob-proxy-token` header holding the separate meter capability. The reviewed
meter patch routes the Codex OAuth HTTP Responses request through C1 after bridge
translation. C1 must enforce exact model `gpt-6-luna`, bound actual request
admission, and record returned identity and raw usage. The meter patch blocks
unsupported WebSocket, compact and image routes for metered credentials and
disables redirect following. Unpatched upstream does not enforce these metadata
fields; a metered bundle must not be launched without both pinned patches.

The upstream configuration has no positive OAuth model allowlist. An empty
exclusion list is not an allowlist. The existing C1 exact-model guard must remain
enabled, and qualification must independently verify upstream model identity:
the unpatched Chat streaming translator can label a terminal response with the
requested model and hide a different served model. The bundle is deliberately
`unqualified` until that and other required gates pass.

Metered bundles use existing bridge payload rules scoped to exact `gpt-6-luna`
and the Codex provider. They force `reasoning.effort:low`, `reasoning.summary:auto`
and `store:false`, remove
reasoning items from forwarded input, and remove `previous_response_id` and
`conversation`. This defines a shared condition with reasoning replay disabled:
the native harness still owns its tools, messages and context loop, but encrypted
reasoning cannot be reused at the provider boundary. It is a declared controlled
comparison, not a comparison of each harness's default reasoning behavior.

Chat-to-Responses conversion also changes the effective request surface. Sampling
fields, token limits, tools and reasoning settings must be compared at the
provider boundary, not inferred from the native client's configuration. The
generated policy must be verified on actual requests from all five clients;
configuration alone does not establish tool continuity or model neutrality.

The current qualifier also requests `Accept-Encoding: identity` at the provider
gate. It records only allowlisted response content-type and content-encoding
classifications, with `absent` or `other` for unmatched values; raw headers are
not retained in this diagnostic evidence. This transport condition is recorded
alongside the reasoning policy.

## Before any measured run

Use the pinned upstream source plus reviewed local qualification patches. The
preparation helper does not download, build, patch or start it. Remaining gates:

1. Verify actual account access to exact `gpt-6-luna` and the selected credential
   mode; snapshots must remain valid for the bounded run without refresh.
2. The [offline native smoke](../plans/s2-evidence/codex-bridge/native-smoke/review.md)
   passed for all five pinned Linux clients using a fake API-key backend. Qualify
   the C1-metered OAuth route and bounded live behavior after account access is established.
3. Verify provider model identity, every actual request attempt, input/output/cache
   counters, failure handling and the reasoning/tool condition through the bridge.
4. Record the bridge build, configuration and transport overhead in collection
   provenance, with no fallback to another model or separately billed API key.

Token counts remain the baseline. Subscription allowance is not zero-dollar API
usage: its USD allocation is unknown, and a reference token price is a separately
labelled comparison. Shared bridge latency belongs to the observed route. Existing
DeepSeek results and completed Linux attempts are unchanged.

See [the S2 preparation plan](../plans/S2-codex-bridge-preparation-plan.md) and
[bounded live qualification plan](../plans/S2-luna-live-qualification-plan.md)
for the stage boundaries. No existing benchmark profile is enabled by this helper.

## Build the pinned bridge on Linux

Build from the exact upstream commit with both reviewed patches. From this
repository's root, select a new private build directory outside the checkout:

```sh
set -eu
umask 077
aob_checkout="$PWD"
aob_bridge_build=/absolute/private/path/to/new-bridge-build
aob_go_image=golang@sha256:2a0ba12e116687098780d3ce700f9ce3cb340783779646aafbabed748fa6677c
mkdir -m 700 "$aob_bridge_build"
git clone --no-checkout https://github.com/router-for-me/CLIProxyAPI.git "$aob_bridge_build/src"
git -C "$aob_bridge_build/src" checkout --detach 2430354330af80b645f9ffb1a51e1e7c72c4cc8e
node --test scripts/s2-codex-bridge-prepare.test.mjs
git -C "$aob_bridge_build/src" apply --check "$aob_checkout/plans/s2-evidence/codex-bridge/cli-proxy-api-benchmark-guards.patch"
git -C "$aob_bridge_build/src" apply "$aob_checkout/plans/s2-evidence/codex-bridge/cli-proxy-api-benchmark-guards.patch"
git -C "$aob_bridge_build/src" apply --check "$aob_checkout/plans/s2-evidence/codex-bridge/cli-proxy-api-local-meter.patch"
git -C "$aob_bridge_build/src" apply "$aob_checkout/plans/s2-evidence/codex-bridge/cli-proxy-api-local-meter.patch"
docker run --rm --cpus 4 --memory 8g \
  -v "$aob_bridge_build:/build" -w /build/src -e GOTOOLCHAIN=local \
  "$aob_go_image" go build -trimpath -o /build/cli-proxy-api ./cmd/server
sha256sum "$aob_bridge_build/cli-proxy-api"
```

Stop if any command fails. The helper tests check the exact tracked patch bytes
against their required hashes. Source and Go dependency downloads need network
access but no model credentials or inference. Retain the commit, patch hashes and
binary hash as build provenance. Passing a binary to the qualifier does not by
itself prove how that binary was built.

## Run the bounded qualifier

**Live qualification has started; complete accounting remains unverified.** The
first Codex attempt completed its native write/read tool loop and exited with
code 0 after two HTTP 200 provider requests for `gpt-6-luna`. Its original C1
events recorded unknown served identity and unknown usage, so the slot remains
failed for qualification. The immutable
[initial evidence](../plans/s2-evidence/codex-bridge/live-qualification/initial-codex/state.json)
preserves that distinction.

Codex separately reported 15,620 input tokens, 6,656 cached input tokens, 65 output
tokens and 0 reasoning output tokens. These are
[native counters](../plans/s2-evidence/codex-bridge/live-qualification/initial-codex/native-usage-corroboration.json),
not verified provider accounting, and never replace the missing C1 quantities.
The S1 parser now detects streamed response framing when MIME headers are missing
or varied. Offline tests verify that correction; the exact cause of the original
live accounting gap remains unconfirmed. Codex will not be rerun to repair it.

The reusable
[qualifier](../scripts/s2-codex-bridge-qualify.mjs) first supports a zero-spend
mock run through the actual native clients, bridge, controlled policy and C1
meter. Run it on the designated Linux collection host with repository dependencies
installed and Docker available. It uses the five exact image IDs recorded in the
[native smoke evidence](../plans/s2-evidence/codex-bridge/native-smoke/sanitized-summary.json),
plus the pinned Go and Node runtime images declared in the script. These images
must already be available locally; runtime launches use `--pull=never`.

Choose separate private output directories outside the checkout. Their parents
must exist; new output directories are created with mode 0700. Existing output
directories must be private, regular directories. Mock mode is the default and
rejects credential arguments:

```sh
node scripts/s2-codex-bridge-qualify.mjs \
  --bridge "$aob_bridge_build/cli-proxy-api" \
  --output /absolute/private/path/to/luna-mock
```

The mock uses synthetic subscription credentials and an isolated fake Responses
backend. It must pass for all five harnesses before live mode accepts its
`state.json`. The gate binds the bridge binary hash, qualifier implementation
hash and controlled policy; changes to the binary or included source files require
new mock evidence before a live launch.

After that gate passes, use the existing Codex CLI credential file by explicit
path. The runner prepares non-renewable access-token snapshots itself; do not
pass a flat bridge record as `--auth-file`:

```sh
node scripts/s2-codex-bridge-qualify.mjs \
  --mode live \
  --bridge "$aob_bridge_build/cli-proxy-api" \
  --output /absolute/private/path/to/luna-live \
  --auth-file /absolute/private/path/to/codex/auth.json \
  --mock-evidence /absolute/private/path/to/luna-mock/state.json
```

Live mode consumes subscription allowance. Each client receives an empty scratch
workspace and a prompt requesting one shell write/read action followed by a final
answer. C1 admits at most two provider model requests per client, ten across all
five; each native invocation has a 120-second timeout. A failed slot halts the
run without an automatic replacement or fallback. Reusing the same output resumes
only slots that have never started; completed or interrupted slots are not rerun,
and a halted run stays halted. Investigate retained locks or failures before any
new allowance-bearing action.

### Continue the stopped Codex-only attempt

The narrowly scoped `--continue-evidence` option reserves the original two Codex
requests and permits only Pi, Qwen, Hermes and Cline, with at most two requests
each. It requires the stopped live Codex-only state, no active source lock, the
exact pinned image and bridge binary, matching original C1 and observation hashes,
two successful Responses requests with unknown served identity and usage, and
the successful native side effect and returned tool output. Contradictions,
provider denials, extra attempts or missing evidence reject admission.

First obtain a fresh all-five mock pass for the current implementation and exact
binary. Then point to the original private live state, using a new private output:

```sh
node scripts/s2-codex-bridge-qualify.mjs \
  --mode live \
  --bridge "$aob_bridge_build/cli-proxy-api" \
  --output /absolute/private/path/to/luna-continuation \
  --auth-file /absolute/private/path/to/codex/auth.json \
  --mock-evidence /absolute/private/path/to/current-luna-mock/state.json \
  --continue-evidence /absolute/private/path/to/first-live/state.json
```

Before launching a client, admission creates an exclusive `continuation-claim.json`
beside the original state and copies the unchanged state, C1 events and observations
into `carried-codex/` under the destination. Directories remain 0700 and copied
files 0600. The private claim binds the source and destination to the evidence,
binary, implementation and mock-proof hashes. A different destination cannot
reuse it; a copy failure retains the claim. Resume uses only the already persisted
destination state and never reruns Codex or resets its two-request reservation.
The public receipt contains hashes and the two-reserved/eight-remaining budget,
without private paths.

Continuation does not upgrade Codex's failed slot or make unknown usage zero.
The final summary separates functional transport across five clients from
complete provider accounting. The remaining four live results are pending here;
this exception does not authorize rerunning completed attempts or admit a
benchmark campaign.

The runner keeps C1 events, condition observations and private diagnostics beside
`state.json`, removes temporary snapshot bundles during normal cleanup, and does
not modify the original credential file. Keep the output private; publish only
reviewed sanitized evidence. Abrupt process termination can leave private
artifacts requiring cleanup. Successful qualification would establish this
bounded two-request tool loop for exact `gpt-6-luna` on these five clients. It
does not run or approve a 200-attempt campaign, long-context compaction, or the
scientific validity of benchmark tasks.

Offline validation also confirmed different effective reasoning: Codex high, the
four Chat clients medium. The bridge loses encrypted reasoning history on Chat
routes. The controlled policy addresses these asymmetries by applying low effort
and disabling reasoning replay for every route; qualification of the resulting
condition is still required before collecting a model-controlled comparison.
