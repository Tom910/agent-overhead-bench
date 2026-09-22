# Pinned CLIProxyAPI: zero-spend bridge qualification

2026-09-22. Linux engineering validation only; this is not benchmark result data, account entitlement evidence, or proof that all five native CLIs run successfully. No real credentials were read, imported or mounted. No login, quota query, remote inference or paid API call occurred. Open-source dependency downloads were the only build-time network activity.

## Reusable candidate and result

Candidate: [CLIProxyAPI commit 2430354330af80b645f9ffb1a51e1e7c72c4cc8e](https://github.com/router-for-me/CLIProxyAPI/tree/2430354330af80b645f9ffb1a51e1e7c72c4cc8e). It provides a technically credible shared raw-model transport for Cline, Codex, Hermes, Pi and Qwen. Keep each harness's own agent loop and tool execution. Use exact `gpt-6-luna`. The bridge's Chat and Responses support makes reuse possible; its translation and retry behavior requires a qualified benchmark profile.

**109 top-level tests passed (240 including subtests).** Some new tests deliberately assert known problematic behavior; green tests therefore characterize the bridge and do not mean every benchmark admission gate passed.

| Suite | Top-level passes | Passes including subtests |
|---|---:|---:|
| Upstream Chat translator suite | 59 | 78 |
| Upstream Responses translator suite | 23 | 36 |
| Selected upstream Codex executor tests | 22 | 121 |
| New exact-Luna translation characterizations | 4 | 4 |
| New one-account, zero-retry 401 characterization | 1 | 1 |
| Total | 109 | 240 |

Tests ran on the existing Linux host, using Go 1.26.0 and `golang@sha256:2a0ba12e116687098780d3ce700f9ce3cb340783779646aafbabed748fa6677c`, with 4 CPUs / 8 GiB limits. The executed test containers used `--network none --read-only`, a fresh tmpfs `/tmp`, `HOME=/tmp`, and only the test binaries mounted read-only. Pure translator fixtures and local `httptest` HTTP/WebSocket servers were reviewed before execution. No project server or native harness was launched. Package initialization loads embedded catalogs; network updates are started by the server separately and were not launched here.

## Concrete findings

1. **Token accounting is promising.** Exact-Luna fixtures preserve input 41, output 17, cached input 23, cache-write 7 and reasoning output 11 in both Chat stream and nonstream conversions. Missing usage remains absent, not invented zero. Upstream tests cover explicit zero versus absent cache-write counters, fragmented tool arguments, interleaved calls and tool-result history. This is stronger than a README compatibility claim but is not a native-harness replay test.
2. **Chat model identity can be misleading.** Our fixture supplies `response.created.model = gpt-6-luna` followed by a terminal `response.completed.response.model = unexpected-model`. Chat returns outward `model = gpt-6-luna`; raw Responses retains the unexpected terminal model. The converter caches model identity from `response.created` and ignores the nested terminal model when selecting its Chat chunk model. The bridge usage reporter separately observes terminal model, but the existing downstream C1 proxy cannot infer that hidden evidence. Require upstream identity capture and fail closed on mismatch or missing identity. Merely fixing the client request model is insufficient.
3. **Encrypted reasoning continuity differs.** Chat drops encrypted reasoning items and exposes only summary text. The Chat request translation also drops the fixture's encrypted `reasoning_details`. Responses preserves encrypted items. `codex_executor_reasoning.go:72` enables replay caching for a different source protocol, not Chat. Consequently the four current Chat adapters and the Codex Responses adapter are not proven equivalent reasoning transports. Tools can work despite this difference. Do not present that as a neutral model-controlled comparison until either continuity is supported across routes or the deliberately different transport condition is disclosed and accepted.
4. **Effective generation settings change.** Chat defaults to medium effort, forces parallel calls true and drops token caps and sampling parameters. The current Codex benchmark adapter forces high effort. Select one explicit effort policy for this model condition and verify the final upstream request. Do not claim an ignored token cap is an enforced spending cap. Responses conversion also normalizes request fields; inspect upstream bytes rather than assuming passthrough.
5. **Zero configured retries does not mean one upstream attempt.** Our isolated auth-manager fixture removes the backup credential, sets retry count 0 / wait 0 / max credentials 1, then returns a synthetic 401 on the first call. The manager performs one credential refresh and repeats the model request against the same account. Source: `conductor_execution.go:589` and `:802`, `conductor_refresh.go:474`. Custom OAuth error-stop rules are evaluated later, so they do not prevent this refresh/replay. This is an auth recovery request, not evidence of double billed generation, but it invalidates an exact one-request accounting assumption. Capture each upstream attempt, or implement a narrowly reviewed no-replay mode before admission.
6. **Defaults add a hosted tool.** `disable-image-generation` defaults false; the executor may inject `image_generation`. Set true for this coding-only profile and confirm the final tool list. Do not accidentally give one condition an extra hosted tool.
7. **`request-log: false` still retains API-error request bodies.** `internal/api/middleware/request_logging.go` uses error-only logging when disabled. `commercial-mode: true` omits this request logging middleware entirely (`internal/api/server.go:148`). Private benchmark capture should use the existing bounded credential-redacting instrumentation. Avoid claiming disabled body logs from `request-log` alone.

## Minimal controlled configuration

The following is a configuration design, not an assertion of complete no-retry or exact-model enforcement. Private preparation code should generate an unguessable local key and absolute private paths. Use exactly one bridge auth record; omit every API-key provider, fallback, alias, plugin, Home/store integration and optional transformation. Do not point the bridge at the CLI's whole credential directory.

```yaml
host: 127.0.0.1
port: 8317
auth-dir: /private/bridge/auth
api-keys: [GENERATED_LOCAL_SECRET]
remote-management:
  allow-remote: false
  secret-key: ""
  disable-control-panel: true
  disable-auto-update-panel: true
debug: false
commercial-mode: true
request-log: false
logging-to-file: false
usage-statistics-enabled: false
plugins:
  enabled: false
discovery:
  enabled: false
pprof:
  enable: false
request-retry: 0
max-retry-credentials: 1
max-retry-interval: 0
quota-exceeded:
  switch-project: false
  switch-preview-model: false
  antigravity-credits: false
routing:
  strategy: fill-first
  session-affinity: false
streaming:
  keepalive-seconds: 0
  bootstrap-retries: 0
nonstream-keepalive-interval: 0
disable-image-generation: true
codex:
  disable-codex-cloaking: true
  response-steering: false
  identity-confuse: false
  stream-bootstrap-buffering: false
  optimize-multi-agent-v2: false
  orphan-delegation-compatibility: false
oauth-model-alias: {}
```

The OAuth path uses a tier catalog plus excluded-model patterns (`sdk/cliproxy/service_models.go:126–153`); no positive OAuth model allowlist was found. An auth-file `models` array is not demonstrated to constrain this path. `codex-api-key.models` belongs to another credential path. Catalog exclusions can reduce discovery, but cannot replace a broker guard that accepts only exact `gpt-6-luna`, rejects model suffixes/aliases and checks the true upstream response model. The bridge also has a background catalog updater, so static enumeration should not be treated as permanent allowlisting. Bind only loopback and expose the existing measured API broker to task containers, never bridge administration or auth files.

## Existing Codex CLI credential reuse

The CLI cache and bridge cache have different schemas. Standard CLI JSON nests access, refresh, ID token and account ID in `tokens`; bridge records use top-level `type: codex`, `access_token`, `refresh_token`, `id_token`, `account_id`, plus expiry and last-refresh metadata. A small offline converter can copy only these fields into a dedicated private file, derive expiration from the access token's JWT payload if available, and leave unknown fields out. Payload parsing is not signature verification or entitlement proof. Reject malformed/non-ChatGPT cache data and mismatched explicit account identifiers; never silently use an API key.

The converter must use exclusive creation, no symlink following, 0700 directory / 0600 file permissions and no token output. Do not write credentials into plans, fixtures, logs, shell arguments or container workspaces. The upstream `CodexTokenStorage.SaveTokenToFile` uses `os.Create`; service umask 077 and existing private file permissions matter. Refresh storage must have one owner: CLI and bridge independently refreshing copies of the same token family is not a verified safe synchronization strategy. A managed handoff or dedicated bridge login is a separate operational step. None was performed here. Existing local keychain-only CLI auth requires explicit export or an appropriate credential-store reader; do not assume `auth.json` always exists.

## Reproduction and artifacts

Reusable files beside this report:

- `bridge_qualification_test.go`: exact-Luna token, setting, reasoning and model-mismatch fixtures.
- `bridge_retry_characterization_test.go`: one-account zero-retry 401 replay fixture.
- `qualify-bridge.sh`: bounded build and isolated test recipe; requires Docker, Git, reviewed pinned source and these two fixture files. The script itself has been syntax checked; the equivalent commands were executed in the original Linux qualification workspace.
- `qualification-tests.log`: raw output for the first 108 top-level tests.
- `qualification-retry-tests.log`: raw output for the 401 fixture.

Example, after reviewing the pinned clone:

```bash
bash qualify-bridge.sh /path/to/CLIProxyAPI /new/qualification-output
```

The script archives only the pinned source commit, injects the two fixture files into a new scratch copy, compiles five test packages with `go test -c`, then executes only the reviewed test subsets without network. It does not build or start the proxy service and never mounts a host credential location. Build output and verbose test logs remain in the chosen directory.

## Remaining admission gates

No need to build a new raw OAuth bridge from scratch: reuse this pinned implementation. Before real benchmark collection, qualify actual request/stream shapes from all five pinned native harnesses, two tool turns, cancellation, timeout and rate-limit behavior; implement exact upstream model/attempt capture; choose and verify effort; address reasoning continuity; verify one refresh owner; and separately establish account access to exact Luna. A later tightly bounded all-five smoke is the first place to verify real allowance behavior. These tests do not authorize or perform that spend. Preserve subscription token usage separately from counterfactual API reference prices; do not fabricate an actual dollar cost from subscription allowance.
