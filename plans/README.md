# Stage plans

This directory is the implementation layer of `agent-overhead-bench`.

Current engineering handoff: [CURRENT-REVIEW-AND-NEXT.md](./CURRENT-REVIEW-AND-NEXT.md).

| Document | Role |
|---|---|
| North-star design (case working copy) | Thesis, measurement model, fairness, v1 scope. Not a coding brief. |
| Implementation roadmap (case working copy) | Stages, frozen contracts C1–C4, acceptance, invariants. Not a per-stage plan. |
| **`plans/S<N>-*.md` (this repo)** | The plan an agent executes. Write or update the plan, then implement against it. |

Do not start coding a stage from the roadmap alone. Do not invent a second measurement model.

## Order

```
S0 bootstrap ──► S1 proxy prototype ──┐
S2 feasibility ───────────────────────┼──► S4 adapters ──► S5 runner ──► S7 runs ──► S8 launch
S3 task suite ────────────────────────┘                        │
                                                               └──► S6 report ──► S7
```

1. **S0** first (this repo is empty).
2. **S2** before S1 polish. S1 may ship a passthrough prototype in parallel; usage extractors wait on S2 HTTP fixtures.
3. **S3** parallel with S2.
4. **S4** after S1 output format + S2 tool list + S3 task contract.
5. **S6** may proceed from frozen schemas and fixtures without waiting for S5.
6. Results, METHODOLOGY claims, and the flagship article wait for **S8**. Source may be public during S0–S7.

The measurement instrument and local validation path are implemented. The
current official profiles contain six tools: claude-code, cline, codex, hermes,
pi, and qwen. A completed 192-cell local fixture pilot and a 200-slot
non-Claude public-repository campaign snapshot exist. Public-source
calibration, source sign-off, official S7 freeze, and S8 v1 publication
remain incomplete. The snapshot must not be published as v1. See
[S8-publish-surface-honesty-plan.md](./S8-publish-surface-honesty-plan.md).

The pilot coverage correction is tracked in
[S8-pilot-coverage-binding-plan.md](./S8-pilot-coverage-binding-plan.md).

The explained-only archive correction is tracked in
[S7-explained-anomaly-freeze-plan.md](./S7-explained-anomaly-freeze-plan.md).

## Index

| Plan | Status |
|---|---|
| [S7-task-contract-revision-plan.md](./S7-task-contract-revision-plan.md) | Implemented: three amendments, 33 original-grade replays, 13 corrected Textual replays; four verified false negatives |
| [S6-comparison-evidence-plan.md](./S6-comparison-evidence-plan.md) | Next: checkable conditions, task-level uncertainty and published audit integration |
| [S7-task-quality-audit-2026-09-21.md](./S7-task-quality-audit-2026-09-21.md) | Audit complete: three contract ambiguities and one storage failure; existing outcomes preserved |
| [S6-interactive-pages-plan.md](./S6-interactive-pages-plan.md) | Complete: interactive results published to GitHub Pages; live desktop/mobile interactions and downloads verified |
| [S6-task-and-benchmark-cost-plan.md](./S6-task-and-benchmark-cost-plan.md) | Implemented: task repetition averages and full selected benchmark totals; known lower bounds disclosed |
| [S7-four-usage-replacements-plan.md](./S7-four-usage-replacements-plan.md) | Complete: four validated replacements published; originals retained and all 200 selected measurements complete |
| [S1-full-request-model-metadata-plan.md](./S1-full-request-model-metadata-plan.md) | Fixed: complete bounded JSON model extraction; guard stays enabled |
| [S6-current-campaign-source-plan.md](./S6-current-campaign-source-plan.md) | Complete: one canonical 200-attempt Linux export generates current README/report; offline CI freshness check |
| [S6-reference-token-comparison-plan.md](./S6-reference-token-comparison-plan.md) | Implemented: Linux-only reference token costs and per-metric best=100% overview; completed collection now uses the current-source publisher |
| [S7-linux-only-completion-plan.md](./S7-linux-only-completion-plan.md) | Complete: 104 reused + 96 new slots; 200/200 on Linux, Claude CLI excluded |
| [S5-linux-image-restoration-plan.md](./S5-linux-image-restoration-plan.md) | Complete: pruned images restored and validated without model calls; rebuilt identities disclosed |
| [S6-metric-overview-plan.md](./S6-metric-overview-plan.md) | Implemented and verified: primary pass/cost/cache/token overview with sortable rows and secondary detail panels |
| [S8-readme-metric-overview-plan.md](./S8-readme-metric-overview-plan.md) | Implemented and pushed: compact host-separated metric summaries lead README |
| [S6-request-timelines-plan.md](./S6-request-timelines-plan.md) | Implemented: sanitized C1 request series, timelines, token/cost curves; no new spend |
| [S6-analysis-usability-plan.md](./S6-analysis-usability-plan.md) | Implemented and verified: matched tasks, per-attempt export, outcome distributions and additive charts |
| [S8-github-push-ready-plan.md](./S8-github-push-ready-plan.md) | Remaining action: `git push -u origin main` |
| [S3-maintainer-sign-off-plan.md](./S3-maintainer-sign-off-plan.md) | Implemented: four DeepSWE review flags approved; freeze still unpublished |
| [S8-methodology-freeze-plan.md](./S8-methodology-freeze-plan.md) | Implemented: METHODOLOGY is protocol text; archive still unpublished |
| [S7-activity-export-gap-exception.md](./S7-activity-export-gap-exception.md) | Accepted: dashboard $52.1 vs CSV $50.70 as 25k-row cap |
| [S7-activity-canonical-model-plan.md](./S7-activity-canonical-model-plan.md) | Implemented: Activity CSV matches pin or price-book canonical_model |
| [S8-publish-surface-honesty-plan.md](./S8-publish-surface-honesty-plan.md) | Implemented: unpublished README/METHODOLOGY snapshot, no v1 freeze |
| [S8-multiple-readme-tables-plan.md](./S8-multiple-readme-tables-plan.md) | Verified: full npm suite, lint, types and Linux Docker proxy smoke pass; pilot publishing preserves campaign coverage |
| [S7-four-dollar-tomlkit-recovery-plan.md](./S7-four-dollar-tomlkit-recovery-plan.md) | Complete: TOMLKit passed; final200/200 outcomes, $0.310 of $4 used |
| [S7-final-funded-recovery-plan.md](./S7-final-funded-recovery-plan.md) | Stopped at funded reserve: 199 measured outcomes plus one supplemental TOMLKit verifier pass |
| [S7-account-usage-high-water-plan.md](./S7-account-usage-high-water-plan.md) | Tested and deployed: stale lower usage readings do not restore budget or interrupt healthy recovery |
| [S6-unpriced-preview-plan.md](./S6-unpriced-preview-plan.md) | Implemented and tested: explicit preview retains unavailable costs and standard aggregation |
| [S8-paused-campaign-closeout-plan.md](./S8-paused-campaign-closeout-plan.md) | Final measured coverage200/200; all five non-Claude harnesses complete, Claude excluded |
| [S2-claude-restart-diagnostic-plan.md](./S2-claude-restart-diagnostic-plan.md) | Smoke passed; capped native-task pilot reproduced missing model identity and stopped early |
| [S7-authorized-recovery-run-plan.md](./S7-authorized-recovery-run-plan.md) | Recovery queues terminal; 18 new native outcomes from 23 attempts, existing authorization nearly exhausted |
| [S7-variable-price-continuation-plan.md](./S7-variable-price-continuation-plan.md) | Maintainer-authorized immediate continuation: account-budget guard, unknown static price estimates, retained provider evidence |
| [S4-claude-cline-literal-prompts-plan.md](./S4-claude-cline-literal-prompts-plan.md) | Implemented: literal positional prompts after the option separator |
| [S7-independent-stop-guards-plan.md](./S7-independent-stop-guards-plan.md) | Implemented: persistent credit/infrastructure stops and independent live supervision |
| [S6-failed-attempt-cost-report-plan.md](./S6-failed-attempt-cost-report-plan.md) | Implemented: diagnostic reports preserve unknown total cost after ambiguous upstream failures and retain C4 reconciliation |
| [S1-calibration-warmup-plan.md](./S1-calibration-warmup-plan.md) | Implemented: fixed warm-up at measured concurrency preserves the 5 ms gate and measured sample count |
| [S3-linux-native-validator-plan.md](./S3-linux-native-validator-plan.md) | Implemented: pristine verifier validation checks tag identity and launches the native local image ID |
| [S5-linux-python-lock-plan.md](./S5-linux-python-lock-plan.md) | Implemented: preserve ARM hashes and add verified native amd64 Hermes artifacts at the same pinned versions |
| [S5-linux-workspace-user-plan.md](./S5-linux-workspace-user-plan.md) | Implemented: Linux containers use the host workspace owner while preserving isolation and macOS behavior |
| [S5-local-image-id-launch-plan.md](./S5-local-image-id-launch-plan.md) | Implemented: immutable local image-ID launches support Linux Docker while preserving image drift checks |
| [S4-qwen-leading-hyphen-plan.md](./S4-qwen-leading-hyphen-plan.md) | Implemented: literal attached prompt values prevent Qwen option parsing and preserve prompt bytes |
| [S7-linux-server-migration-plan.md](./S7-linux-server-migration-plan.md) | Full Linux preflight passed; 94 untouched jobs admitted to the persistent server queue |
| [S4-pi-leading-hyphen-plan.md](./S4-pi-leading-hyphen-plan.md) | Implemented: literal stdin transport for Pi prompts beginning with a hyphen |
| [S5-streamed-ledger-binding-plan.md](./S5-streamed-ledger-binding-plan.md) | Implemented: bounded log hashing preserves exact ledger digests |
| [S7-independent-evidence-inventory-plan.md](./S7-independent-evidence-inventory-plan.md) | Initial immutable inventory verified; independent release eligibility remains open |
| [S6-task-image-report-plan.md](./S6-task-image-report-plan.md) | Implemented: task-specific image pairs with repetition drift checks |
| [S5-independent-repetition-plan.md](./S5-independent-repetition-plan.md) | Implemented: independent runs retain actual repetition indices |
| [S7-independent-harness-runs-plan.md](./S7-independent-harness-runs-plan.md) | Implemented: append-only operational scheduling, isolated failures, live account guard; paid execution in progress |
| [S0-bootstrap.md](./S0-bootstrap.md) | Implemented (contracts, mock-upstream, CI) |
| [S0-provider-routing-contract-plan.md](./S0-provider-routing-contract-plan.md) | Implemented: optional raw routing metadata binds C4 identity while preserving legacy records |
| [S0-clean-checkout-test-plan.md](./S0-clean-checkout-test-plan.md) | Implemented: probe cleanup test is independent of a developer `.env` |
| [S2-docker-probe-timeout-plan.md](./S2-docker-probe-timeout-plan.md) | Implemented: Docker readiness probe is bounded at 10 seconds with no-spend timeout tests |
| [S2-feasibility-checklist.md](./S2-feasibility-checklist.md) | Spike run: keep 6 (3 host PATH + aider/opencode/qwen in Docker only); approved model `z-ai/glm-5.3-flash` has six requested-model Docker smoke records |
| [S2-evidence-default-boundary-plan.md](./S2-evidence-default-boundary-plan.md) | Implemented: every S2 candidate records the roadmap-required default-condition boundary |
| [s2-evidence/_template.md](./s2-evidence/_template.md) | Copied per candidate under `s2-evidence/` |
| [S7-pre-inference-rejection-validation-plan.md](./S7-pre-inference-rejection-validation-plan.md) | Implemented and reviewed: known rejected attempt handling at native outcome and campaign gates preserves complete successful response requirements |
| [S5-pre-inference-rejection-accounting-plan.md](./S5-pre-inference-rejection-accounting-plan.md) | Implemented and reviewed: known pre-inference rejection preserves priced successful usage without relaxing ambiguous failures |
| [S1-upstream-rejection-evidence-plan.md](./S1-upstream-rejection-evidence-plan.md) | Implemented and reviewed: private bounded provider evidence and narrowly observed DeepSeek validation rejection |
| [S2-deepseek-v41-approval-plan.md](./S2-deepseek-v41-approval-plan.md) | Approved pinned DeepSeek profile from five protocol and six CLI smoke records |
| [S6-deepseek-v41-price-snapshot-plan.md](./S6-deepseek-v41-price-snapshot-plan.md) | Immutable provider low-tier snapshot; requires live whole-cell price-window guard |
| [S7-deepseek-profile-selection-plan.md](./S7-deepseek-profile-selection-plan.md) | Implemented and reviewed: explicit profile binds model, routing and price book across launch/archive boundaries |
| [S5-fixed-provider-price-window-plan.md](./S5-fixed-provider-price-window-plan.md) | Implemented and reviewed: live per-cell pricing admission plus execution-boundary timeout/margin recheck |
| [S2-deepseek-v41-provider-diagnostic-plan.md](./S2-deepseek-v41-provider-diagnostic-plan.md) | Completed: five protocol probes and six CLI smokes pass; successful provider costs and account delta reconcile |
| [S1-proxy-plan.md](./S1-proxy-plan.md) | Implemented: passthrough + S2 dialect extractors (Anthropic, chat, Responses nested usage) |
| [S1-request-body-streaming-plan.md](./S1-request-body-streaming-plan.md) | Implemented: bounded streaming request capture with oversized-body passthrough |
| [S1-validation-stream-accounting-plan.md](./S1-validation-stream-accounting-plan.md) | Implemented and reviewed: bounded per-event SSE usage capture and cancellation metadata |
| [S1-anthropic-null-cache-usage-plan.md](./S1-anthropic-null-cache-usage-plan.md) | Implemented: accept documented nullable optional Messages cache counters while retaining required-total validation |
| [S1-provider-exclusion-plan.md](./S1-provider-exclusion-plan.md) | Implemented: explicit provider exclusions with bounded, lossless request rewriting; Relace exclusion verified but another provider also returned inconsistent counters |
| [S3-tasks-plan.md](./S3-tasks-plan.md) | Local validation fixture, local/Git task-source boundaries, strict selected-manifest checks, and pinned public task-pack preparation implemented; medium coverage, calibration, and maintainer review remain open |
| [S3-deepswe-official-selection-plan.md](./S3-deepswe-official-selection-plan.md) | Follow-up: preserve DeepSWE native categories and validate its source-specific 4+4 official subset composition |
| [S3-validator-test-reliability-plan.md](./S3-validator-test-reliability-plan.md) | Follow-up: allow the full pristine fixture validation test its observed subprocess budget |
| [S3-task-source-hardening-plan.md](./S3-task-source-hardening-plan.md) | Implemented mechanical gates: official composition/public HTTPS, reviewed-subset coverage, stable verifier exits, and public provenance binding |
| [S3-source-manifest-binding-plan.md](./S3-source-manifest-binding-plan.md) | Implemented: bind prepared Git tasks to original source-manifest entries |
| [S3-review-provenance-binding-plan.md](./S3-review-provenance-binding-plan.md) | Implemented: prevent prepared manifests from forging source-review metadata |
| [S3-review-evidence-plan.md](./S3-review-evidence-plan.md) | Superseded: generated DeepSWE manifests now use structured review evidence |
| [S3-deepswe-abbreviated-revision-plan.md](./S3-deepswe-abbreviated-revision-plan.md) | Implemented: resolve abbreviated DeepSWE upstream pins to full commits |
| [S3-deepswe-reference-polarity-plan.md](./S3-deepswe-reference-polarity-plan.md) | Implemented: verify source reference patches through the native verifier during preparation |
| [S3-deepswe-patch-ownership-plan.md](./S3-deepswe-patch-ownership-plan.md) | Implemented: capture foreign-owner archives and verify foreign-owned mounts with exact-path Git trust |
| [S3-deepswe-preparation-integrity-plan.md](./S3-deepswe-preparation-integrity-plan.md) | Implemented: pin preparation to the reviewed DeepSWE revision and structured review evidence |
| [S3-contract-freeze-plan.md](./S3-contract-freeze-plan.md) | Implemented as development governance: contract freeze deferred until final release |
| [S3-deepswe-extended-diagnostic-plan.md](./S3-deepswe-extended-diagnostic-plan.md) | Implemented: explicit long-regime diagnostic timeout, default short regime preserved |
| [S3-timeout-parallel-diagnostic-plan.md](./S3-timeout-parallel-diagnostic-plan.md) | Authorized: compare 15-minute and 30-minute attempts concurrently, with the existing extended budget available if needed |
| [S3-calibration-identity-binding-plan.md](./S3-calibration-identity-binding-plan.md) | Implemented: calibration summaries validate complete C4/C1/source/image evidence before accepting passes |
| [S3-calibration-attestation-plan.md](./S3-calibration-attestation-plan.md) | Implemented: bind approved two-CLI calibration to portable run evidence; real calibration still pending |
| [S3-calibration-provenance-binding-plan.md](./S3-calibration-provenance-binding-plan.md) | Implemented and verified: bind C4 calibration records to the prepared DeepSWE workspace revision and accept contract-valid network status 0 |
| [S3-deepswe-reference-boundary-plan.md](./S3-deepswe-reference-boundary-plan.md) | Implemented: sanitize DeepSWE workspaces and Git metadata before measurement |
| [S3-task-regime-evidence-plan.md](./S3-task-regime-evidence-plan.md) | Implemented: bind DeepSWE duration metadata per task |
| [S3-source-lineage-policy-plan.md](./S3-source-lineage-policy-plan.md) | Superseded: DeepSWE exception is recorded in the dedicated lineage plan |
| [S3-deepswe-lineage-exception-plan.md](./S3-deepswe-lineage-exception-plan.md) | Implemented and verified: allow selected DeepSWE lineage while rejecting direct restricted imports |
| [S3-polybench-replacement-plan.md](./S3-polybench-replacement-plan.md) | Historical rejected-source evaluation; DeepSWE is the selected candidate |
| [S4-adapters-plan.md](./S4-adapters-plan.md) | mock-agent + six S2 keep-tool recipes (zero-spend proxy integration; fresh-container descriptors) |
| [S4-codex-tool-events-plan.md](./S4-codex-tool-events-plan.md) | Implemented partial Codex capture: JSONL parser, host/Docker timestamps, redacted raw logs, and C3/C4 propagation; measurable-duration smoke remains open |
| [S4-opencode-tool-events-plan.md](./S4-opencode-tool-events-plan.md) | Implemented partial OpenCode capture: documented JSON event mode, epoch-to-monotonic projection, fail-closed parser, and Docker propagation; measurable real smoke remains open |
| [S4-fairness-fidelity-plan.md](./S4-fairness-fidelity-plan.md) | Follow-up: remove non-minimal model-quality and budget throttles from adapter recipes |
| [S4-codex-leading-dash-plan.md](./S4-codex-leading-dash-plan.md) | Follow-up: terminate Codex option parsing before positional prompts |
| [S4-aider-workspace-filter-plan.md](./S4-aider-workspace-filter-plan.md) | Implemented: exclude Git metadata from Aider model context |
| [S4-real-provider-model-context-plan.md](./S4-real-provider-model-context-plan.md) | Implemented and verified: Claude provider mapping/local transport proof, OpenRouter protocol limitation, and bounded Aider context |
| [S5-runner-plan.md](./S5-runner-plan.md) | Host and Docker cell executors, resumable matrix, budget guard, zero-spend dry run, and lock-validated images; official host/network review remains S7 |
| [S5-streamed-run-logs-plan.md](./S5-streamed-run-logs-plan.md) | Implemented and verified: bounded private log streaming; real 1 GB timeout log and passing 30-minute diagnostic retained |
| [S5-verifier-log-capture-plan.md](./S5-verifier-log-capture-plan.md) | Implemented: native verifier logs stream outside small control capture, preserving concatenated-stream redaction and legacy metadata |
| [S5-kill-resume-reliability-plan.md](./S5-kill-resume-reliability-plan.md) | Follow-up: bounded 5-second startup polling for the kill/resume smoke |
| [S5-provenance-environment-plan.md](./S5-provenance-environment-plan.md) | Implemented: verifier-image and task-environment provenance; task packs require source-owned native verifiers |
| [S5-contract-fidelity-plan.md](./S5-contract-fidelity-plan.md) | Implemented: default-condition model propagation and C4 schema alignment |
| [S5-S6-runtime-integrity-plan.md](./S5-S6-runtime-integrity-plan.md) | Implemented: runtime C4 exit validation, default pricing, and unavailable aggregates |
| [S5-verifier-image-integrity-plan.md](./S5-verifier-image-integrity-plan.md) | Implemented: prevent implicit Docker image pulls during measured execution |
| [S5-task-environment-image-plan.md](./S5-task-environment-image-plan.md) | Follow-up: run prepared DeepSWE dependencies in the measured agent image |
| [S5-deepswe-preparation-rehydration-plan.md](./S5-deepswe-preparation-rehydration-plan.md) | Implemented and verified: rehydrate the deterministic DeepSWE Git base after runner preparation |
| [S5-source-agent-image-binding-plan.md](./S5-source-agent-image-binding-plan.md) | Follow-up: bind prepared DeepSWE agent image identities to source provenance |
| [S5-agent-git-boundary-plan.md](./S5-agent-git-boundary-plan.md) | Implemented: derive DeepSWE model patches from the immutable verifier base even after agent Git history changes |
| [S5-full-dry-run-bootstrap-plan.md](./S5-full-dry-run-bootstrap-plan.md) | Implemented and verified: Docker base bootstrap plus full mock report |
| [S5-docker-version-probe-writability-plan.md](./S5-docker-version-probe-writability-plan.md) | Implemented: give read-only Docker version probes a bounded temporary home |
| [S5-resume-spend-accounting-plan.md](./S5-resume-spend-accounting-plan.md) | Implemented: recover persisted failed-attempt spend exactly once before retry |
| [S5-failed-attempt-cost-completeness-plan.md](./S5-failed-attempt-cost-completeness-plan.md) | Implemented: keep runner spend unavailable after potentially billable failed model attempts |
| [S6-report-plan.md](./S6-report-plan.md) | Implemented: union derivation + mixed-visibility table |
| [S6-provider-routing-report-plan.md](./S6-provider-routing-report-plan.md) | Implemented: separate routing conditions in report medians, chart labels and anomaly baselines |
| [S6-streamed-release-logs-plan.md](./S6-streamed-release-logs-plan.md) | Implemented: bounded complete release-log redaction/copying and archive hashing with unchanged matching and binding semantics |
| [S6-measurement-integrity-plan.md](./S6-measurement-integrity-plan.md) | Follow-up: preserve timing for identifiable model events with unavailable request-model metadata; tighten derivation evidence |
| [S6-provider-attempt-timing-plan.md](./S6-provider-attempt-timing-plan.md) | Implemented: include failed identifiable provider attempts in model-time while keeping usage/cost successful-only |
| [S6-turn-count-plan.md](./S6-turn-count-plan.md) | Implemented: count failed identifiable provider attempts as API turns while keeping usage/cost successful-only |
| [S6-methodology-terminology-plan.md](./S6-methodology-terminology-plan.md) | Implemented: align published turn terminology with attempt-count derivation |
| [S6-report-parallelism-plan.md](./S6-report-parallelism-plan.md) | Implemented: publish the existing union-based parallelism factor in report tables with Markdown shape validation |
| [S6-first-byte-report-plan.md](./S6-first-byte-report-plan.md) | Implemented: publish C1 first-byte latency medians in report tables without claiming token-level precision; exclude synthetic network-failure markers |
| [S6-recovered-provider-attempt-plan.md](./S6-recovered-provider-attempt-plan.md) | Implemented: allow verifier judgment after a CLI recovers from failed provider attempts |
| [S6-contract-schema-parity-plan.md](./S6-contract-schema-parity-plan.md) | Implemented: align the C4 JSON Schema with prepared agent-image provenance |
| [S6-model-endpoint-eligibility-plan.md](./S6-model-endpoint-eligibility-plan.md) | Implemented: require C1 model path and protocol agreement |
| [S6-clock-alignment-plan.md](./S6-clock-alignment-plan.md) | Implemented: require adapter clock anchors and gate measured cross-process projection error |
| [S6-default-report-plan.md](./S6-default-report-plan.md) | Implemented: empty default-model pricing boundary |
| [S6-usage-completeness-plan.md](./S6-usage-completeness-plan.md) | Implemented: prevent partial usage aggregates |
| [S5-native-task-outcome-plan.md](./S5-native-task-outcome-plan.md) | Implemented: retain completed native task failures without retries or duplicate charges |
| [S7-native-task-continuation-plan.md](./S7-native-task-continuation-plan.md) | Native task outcomes can complete validation; calibration passes remain mandatory |
| [S7-tool-batch-campaign-plan.md](./S7-tool-batch-campaign-plan.md) | Tool-by-tool campaign, one-repetition validation, spend checkpoints and combined archive |
| [S7-provider-routing-binding-plan.md](./S7-provider-routing-binding-plan.md) | Implemented: default Relace exclusion across tools, raw C4/state binding, and validation/archive routing consistency |
| [S7-runs-protocol.md](./S7-runs-protocol.md) | Operational preflight and freeze guards; short-regime matrix remains available, and the separate long-horizon release path is defined in `S7-long-regime-release-plan.md` |
| [S7-long-regime-release-plan.md](./S7-long-regime-release-plan.md) | Implemented: explicit long-horizon DeepSWE execution path and report isolation; bounded real calibration remains |
| [S7-regime-argument-binding-plan.md](./S7-regime-argument-binding-plan.md) | Implemented: bind the launcher’s ninth regime argument correctly in preflight |
| [S7-preflight-daemon-timeout-plan.md](./S7-preflight-daemon-timeout-plan.md) | Implemented: bound Docker daemon readiness before official preflight work |
| [S7-container-clock-calibration-plan.md](./S7-container-clock-calibration-plan.md) | Implemented: no-spend Docker container/host epoch handshake and ≤10 ms S7 gate |
| [S7-source-policy-order-plan.md](./S7-source-policy-order-plan.md) | Implemented: reject restricted source lineage before credentials or Docker |
| [S7-freeze-retry-artifacts-plan.md](./S7-freeze-retry-artifacts-plan.md) | Implemented: distinguish current cells from preserved retry artifacts |
| [S7-retry-evidence-archive-plan.md](./S7-retry-evidence-archive-plan.md) | Implemented: publish sanitized retry evidence and runner state |
| [S7-freeze-fidelity-plan.md](./S7-freeze-fidelity-plan.md) | Implemented: official Cartesian matrix and anomaly-disposition freeze gates |
| [S7-archive-integrity-plan.md](./S7-archive-integrity-plan.md) | Implemented: anomaly derivation, provenance identities, block order, and review packaging |
| [S7-official-cap-boundary-plan.md](./S7-official-cap-boundary-plan.md) | Implemented: enforce the $1,500 maximum at run and archive boundaries |
| [S7-cap-boundary-honesty-plan.md](./S7-cap-boundary-honesty-plan.md) | Implemented: describe recorded-spend cap semantics precisely |
| [S7-activity-export-crosscheck-plan.md](./S7-activity-export-crosscheck-plan.md) | Implemented: no-network OpenRouter Activity Export spend cross-check for the pinned price book |
| [S7-activity-binding-plan.md](./S7-activity-binding-plan.md) | Activity, portable archive, raw-export binding, and adversarial official-style fixture implemented; host-window ledger remains |
| [S7-run-window-ledger-plan.md](./S7-run-window-ledger-plan.md) | Implemented: session-bound runner ledger for current/retry intervals, explicit continuation segments, host/state/result bindings, and official freeze/archive gates; interrupted/replacement sessions remain fail-closed and separately reviewed |
| [S7-replacement-window-ledger-plan.md](./S7-replacement-window-ledger-plan.md) | Implemented and verified: official anomaly replacements require a distinct session ledger with exact retry coverage, state/result bindings, host identity, and sanitized archive rebinding |
| [S7-ledger-c4-binding-plan.md](./S7-ledger-c4-binding-plan.md) | Implemented and verified: official current/retry ledger attempts bind to C4 run IDs and projected adapter intervals; replacement windows cannot overlap |
| [S7-runner-replacement-id-plan.md](./S7-runner-replacement-id-plan.md) | Implemented and verified: explicit runner suffix emits distinct replacement run IDs without hand-editing evidence |
| [S7-release-provenance-hardening-plan.md](./S7-release-provenance-hardening-plan.md) | Implemented and verified: report repository identity, DeepSWE workspace/image binding, and provenance/activity gates at freeze |
| [S7-credential-broker-plan.md](./S7-credential-broker-plan.md) | Implemented: keep real provider credentials outside Docker task containers |
| [S7-proxy-capability-boundary-plan.md](./S7-proxy-capability-boundary-plan.md) | Implemented: bind Docker proxy access to a per-cell token and API-path allowlist |
| [S7-release-review-defects-plan.md](./S7-release-review-defects-plan.md) | Implemented: independent release-integrity review findings closed |
| [S7-model-eligibility-plan.md](./S7-model-eligibility-plan.md) | Implemented: fail-closed adapter/model/protocol eligibility before credentials or Docker; retained six-candidate evidence records Claude's exclusion |
| [S7-eligible-tool-scope-plan.md](./S7-eligible-tool-scope-plan.md) | Implemented: official GLM Flash/OpenRouter profile derives a five-tool matrix and documents Claude Code exclusion |
| [S7-official-replacement-fixture-plan.md](./S7-official-replacement-fixture-plan.md) | Implemented: official-mode replacement freeze/archive regression fixture |
| [S7-gpt-sol-follow-up-plan.md](./S7-gpt-sol-follow-up-plan.md) | Implemented: preserve incomplete C4 evidence, bind archive identity, host, and rerun anomaly checks |
| [S7-gpt-sol-accounting-release-plan.md](./S7-gpt-sol-accounting-release-plan.md) | Implemented: exact retained-spend accounting, clean script fixtures, replacement-resolved reports, and anomaly provenance |
| [S7-release-source-binding-plan.md](./S7-release-source-binding-plan.md) | Implemented: ignore private workspace links during attestation and independently verify archived source-manifest binding |
| [S7-source-binding-review-followup-plan.md](./S7-source-binding-review-followup-plan.md) | Implemented: reject workspace-boundary symlinks and bind attestation to stable canonical source content |
| [S8-launch-checklist.md](./S8-launch-checklist.md) | Launch scaffold implemented; external publication remains gated on S7 and human review |
| [S8-single-cell-rerun-plan.md](./S8-single-cell-rerun-plan.md) | Implemented: bounded, budget-protected single-cell rerun command |
| [S8-launch-scaffolding-validation-plan.md](./S8-launch-scaffolding-validation-plan.md) | Implemented and verified: no-network validation of the unpublished launch scaffold |

## Rules every stage plan inherits

- TypeScript strict. No global mutable state. Typed errors (`ConfigError`, `UpstreamError`, `ToolError`, `ContractViolation`, `BudgetExceeded`). No bare throws.
- Monotonic clocks (`performance.now()` semantics). Never subtract timestamps from different processes.
- Default answer to a new npm dependency is no. Justify in the plan if you add one. Expected exceptions: `undici`, a YAML parser, a chart-less SVG helper, `vitest` (dev-only).
- No derived metrics in `run.json`. No prompt bodies in published artifacts. No API keys in git or CI.
- Keep the measured tool list within the approved vendor scope. Not a capabilities leaderboard. Not SWE-bench / Terminal-Bench / Vetta.
- A contradiction with the measurement model is escalated to the maintainer, not resolved silently.
