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

Use one owner for refresh tokens. Once the bridge refreshes a copied credential,
the original Codex CLI cache may become stale; concurrently refreshing both copies
can invalidate the session. `--exclusive-refresh-owner` acknowledges that the
bridge will own refresh of this session and the original cache will not be used
concurrently. The helper cannot enforce this across other programs. A separate
login through the bridge is the simpler alternative for long-lived use.

On the Linux collection host, choose an existing private parent directory and a
new output directory outside the checkout. Replace the example paths explicitly:

```sh
node scripts/s2-codex-bridge-prepare.mjs \
  --auth-file /absolute/private/path/to/auth.json \
  --output /absolute/private/path/to/new-bridge-bundle \
  --exclusive-refresh-owner
```

This command has not been run against real credentials during development. Do
not put token contents into command arguments, environment variables, issue
reports or Git. The helper prints only a generic completion or error message.

The supported input is the standard nested subscription record: `tokens` with
`id_token`, `access_token`, `refresh_token` and `account_id`; optional `auth_mode`
must be `chatgpt`; optional `OPENAI_API_KEY` must be null. An optional
`last_refresh` timestamp is retained. API-key mode and other input shapes are
rejected. JWTs receive structural checks and account-claim consistency checks;
**signatures, account entitlement and remaining allowance are not verified**.
Expiry is copied from the access token's `exp` claim. An expired credential may
still require a later refresh, which preparation does not attempt.

The helper accepts only a regular, non-symlink source of at most 256 KiB, opens it
without following a final symlink, and checks for changes during its bounded
read. It never overwrites an existing destination. It creates directories with
mode 0700 and files with mode 0600:

| File | Purpose |
|---|---|
| `auth/codex.json` | One flat Codex OAuth record, kept private |
| `bridge-key` | Random key for local clients, kept private |
| `config.json` | JSON-as-YAML bridge configuration containing the local key |
| `manifest.json` | Non-secret upstream commit, intended model and unqualified status |

The manifest excludes the credential path, account ID, email and token values.
It identifies upstream commit `2430354330af80b645f9ffb1a51e1e7c72c4cc8e`; it requires
the benchmark guard patch with SHA-256
`6a17e7ad40cff90e5b26722c13fdaea3255346d73a3d7966ec4af0014c54dc88`.
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

The upstream configuration has no positive OAuth model allowlist. An empty
exclusion list is not an allowlist. The existing C1 exact-model guard must remain
enabled, and qualification must independently verify upstream model identity:
the unpatched Chat streaming translator can label a terminal response with the
requested model and hide a different served model. The bundle is deliberately
`unqualified` until that and other required gates pass.

Chat-to-Responses conversion also changes the effective request surface. Sampling
fields, token limits, tools and reasoning settings must be compared at the
provider boundary, not inferred from the native client's configuration. Encrypted
reasoning replay across a Chat tool loop is not established by basic function-call
translation. A shared reasoning condition must be qualified before comparing the
five harnesses.

## Before any measured run

Use the pinned upstream source plus reviewed local qualification patches. The
preparation helper does not download, build, patch or start it. Remaining gates:

1. Verify actual account access to exact `gpt-6-luna` and refresh ownership.
2. Run minimal actual native tool-call smokes for all five harnesses through the
   same Linux route; mocked translators alone do not establish client support.
3. Verify provider model identity, every actual request attempt, input/output/cache
   counters, failure handling and the reasoning/tool condition through the bridge.
4. Record the bridge build, configuration and transport overhead in collection
   provenance, with no fallback to another model or separately billed API key.

Token counts remain the baseline. Subscription allowance is not zero-dollar API
usage: its USD allocation is unknown, and a reference token price is a separately
labelled comparison. Shared bridge latency belongs to the observed route. Existing
DeepSeek results and completed Linux attempts are unchanged.

See [the S2 preparation plan](../plans/S2-codex-bridge-preparation-plan.md) for the
stage boundary and qualification work. No existing benchmark profile is enabled
by this helper.
