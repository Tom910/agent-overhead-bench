# Optional benchmark guards for pinned CLIProxyAPI

Validated 2026-09-22 on Linux with no credentials or remote model calls. Baseline findings remain in `qualification.md`; its baseline fixtures and raw output were not changed.

Upstream pin: `2430354330af80b645f9ffb1a51e1e7c72c4cc8e`.

Patch: `cli-proxy-api-benchmark-guards.patch`.

SHA-256: `6a17e7ad40cff90e5b26722c13fdaea3255346d73a3d7966ec4af0014c54dc88`.

This is a small local patch, not an upstream release or a claim of complete bridge qualification. It changes two source files:

1. Chat streaming conversion uses the actual nested `response.model` from `response.completed` or `response.incomplete` when present, ahead of a model cached from the creation event. A backend mismatch therefore remains visible to downstream measurement. If the terminal model is absent, existing fallback behavior remains; that is still not verified model identity.
2. `tryRefreshAfterUnauthorized` skips refresh-and-replay when a **Codex** credential has boolean `aob_disable_unauthorized_replay: true` and its effective retry limit is zero. The common helper covers nonstream and stream execution. This explicit opt-in preserves ordinary upstream recovery, and positive per-credential/global overrides still allow it. Background token refresh is unaffected. The preparation bundle must record the patch requirement and set the flag; placing the flag into an unpatched bridge does nothing.

The second change deliberately uses credential metadata instead of redefining upstream's existing `request-retry: 0` semantics globally. Effective per-credential overrides use the upstream helper. This keeps the patch small and avoids breaking ordinary clients' authentication recovery. It is a benchmark-specific behavior change and must be part of the condition's transport identity.

## Red-to-green evidence

The exact same two new regression files were first compiled against the pristine upstream pin. With external networking disabled:

- `bridge_model_regression_test.go` failed for both completed and incomplete terminal events because the model mismatch was hidden.
- `bridge_retry_regression_test.go` failed in nonstream and stream mode for global-zero and credential-zero cases because a hidden replay still succeeded. Positive retry overrides and legacy behavior passed.

The final **unified patch artifact** was then applied to a separate fresh `git archive` copy of the pinned source. `git apply --check` succeeded, the artifact was applied, and the two affected test packages were rebuilt. Their test binaries ran in a container with `--network none --read-only`, fresh tmpfs `/tmp`, `HOME=/tmp`, and only binaries mounted read-only.

**67 top-level tests passed; 98 passes including subtests; zero failures.** This includes the complete upstream Chat translator suite plus the new model regression, and focused upstream unauthorized-refresh/override tests plus the new retry regression. New retry cases cover stream/nonstream, global zero, credential zero overriding positive global, positive global, positive credential overriding global zero, and no opt-in preserving legacy zero-retry recovery. We did not rerun the full unrelated auth or executor suites.

| Affected package checks | Top-level passes | Including subtests |
|---|---:|---:|
| Chat translator + model regression | 60 | 81 |
| Focused auth + opt-in retry regression | 7 | 17 |
| Total | 67 | 98 |

Toolchain/container: Go 1.26.0, `golang@sha256:2a0ba12e116687098780d3ce700f9ce3cb340783779646aafbabed748fa6677c`, 4 CPU / 8 GiB limits. Fixtures use only synthetic credentials and local mocks. The model slug in auth-manager fixture setup is inherited from upstream test code and is never sent to a provider; exact Luna model behavior is exercised by the separate translator fixture.

## Reproduction

Run the syntax-checked `qualify-bridge-patch.sh` beside the patch and both regression source files:

```bash
bash qualify-bridge-patch.sh /reviewed/CLIProxyAPI /new/patch-validation-output
```

The script archives the exact pin into a new directory, adds only regression fixtures, compiles without executing package code, runs the expected red tests, checks/applies the patch and rebuilds the two affected packages, then runs the focused green checks without network. It needs Docker, Git and source containing the pin. It mounts no credential store or host home. Dependency downloads may occur during compilation. The script was syntax checked; equivalent commands produced the recorded artifact validation.

Raw artifacts:

- `patch-model-red.log`, `patch-retry-red.log`: observed baseline failures.
- `patched-artifact-green.log`: final checks after applying the actual unified patch to a pristine source archive.
- `bridge_model_regression_test.go`, `bridge_retry_regression_test.go`: reusable regression fixtures.
- `qualification.md`, baseline fixture files and logs: unchanged baseline evidence.

An initial local diff export used the user's external diff formatter and was not applyable. It was discarded before adoption. The SHA-256 above identifies the corrected unified artifact, generated with `--no-ext-diff --no-textconv --binary` and actually applied/retested. Do not use the earlier artifact hash.

## Limits retained

The patch does not implement exact positive model allowlisting, prove missing model identity, restore encrypted reasoning continuity, align reasoning effort, capture every raw upstream attempt or verify actual five-harness behavior. Other retry/fallback pathways must remain disabled and qualified by the profile; the single-account guard is not a universal transport retry suppression mechanism. Account entitlement and allowance remain untested. The benchmark profile stays unqualified until its remaining gates pass.
