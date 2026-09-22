# S6 validity diagnostics and analysis implementation plan

> For agentic workers: use subagent-driven-development and verification-before-completion.

**Goal:** Explain reliability, uncertainty, task sensitivity and collection cost while preserving the website's primary metric order.

**Architecture:** Compute new diagnostics from the canonical validated analysis export plus explicitly bound optional evidence. Publish a separate generated diagnostic JSON and secondary website section. Extend views to model-specific validated campaigns, keeping heterogeneous models separate in an overall overview. Existing DeepSeek publication validation remains strict.

**Tech stack:** Existing strict TypeScript and dependency-free HTML/CSS/JS, Vitest and current publisher.

**Spec:** Audit packages 4–5 and the user's overall/model selection request. Sole new target is exact `gpt-6-luna`; no qualified Luna measurements exist yet.

## Global constraints

No changed raw history, new prices silently applied, inferred missing spend or invented Luna rows. Keep pass rate, average cost/task, whole-benchmark cost, cache and token metrics first. Derived metrics never enter C4. Never infer implementation defects from a nonzero verifier exit alone. One model/configuration population at a time for comparative scoring; an overall view can compare model panels without a fabricated pooled ranking.

## Review focus

Balanced task/rep coverage, task clusters rather than independent repeated attempts, deterministic bootstrap, explicit missing observations, no winner-selection claims, conservative failure attribution, all-attempt accounting without double count, source hash binding and mobile interactions.

### Task 1: Task reliability, sensitivity and cost/token uncertainty

**Files:** New `packages/report/src/validity-diagnostics.ts` and tests; `current-campaign.ts`, `results-site.ts`, client/CSS and site tests; build-site allowlist.

- [ ] Add behavior tests with hand-computable balanced panels, missing metrics, duplicate slots, one task and a changed task mix.
- [ ] Calculate per-task passes/repetitions and per-harness counts from 0/5 to 5/5 without hardcoding five for arbitrary inputs. Compute pairwise leave-one-task-out pass differences/ranges; preserve task identity and report exploratory limitations.
- [ ] Add deterministic task-cluster 95% intervals for equal-task mean reference cost, input and output tokens. Label means separately from the primary median token columns. Incomplete metrics retain missing counts and cannot produce a complete-data interval.
- [ ] Generate diagnostics from the same validated analysis source; show in secondary expandable sections and downloadable JSON. Regenerate README/site through the existing publisher, not manual tables.
- [ ] Validate actual 200-attempt results against independent audit calculations (105 passes, Qwen–Pi sensitivity +2.86 to +11.43 pp), report/site tests and freshness. Commit.

### Task 2: Evidence-linked failure taxonomy and collection ledger

**Files:** Report diagnostics module or focused companion; current publisher and tests; optional offline all-attempt inventory wrapper.

- [ ] Classify observable outcomes conservatively: completed, timed out, adapter/provider/accounting observation, verification rejection with cause unknown, and independently confirmed grader defect from bound audit evidence. Preserve original outcome and list evidence/coverage for every diagnosis. Do not parse arbitrary model prose into causal certainty.
- [ ] Build a deduplicated collection ledger for selected, superseded and interrupted/retried observations using existing analysis/provenance inputs. Record reference price basis, known subtotal, missing-cost count and excluded/unknown scope explicitly. No total presented as complete when earlier collection is unavailable.
- [ ] Add meaningful tests for superseded double counting, shared IDs/conflicting hashes, unknown spend and audit attribution mismatch. Publish secondary diagnostics and links; preserve the primary benchmark total's selected-run meaning.
- [ ] Run focused report/script checks and regenerate outputs; commit.

### Task 3: Model-specific and overall views from validated reports

**Files:** `results-site.ts`, client/CSS, source registry/publisher integration and focused tests.

- [ ] Add a validated report registry/view builder and model selector driven only by present measurements. Current data exposes DeepSeek; Luna is added automatically only after a qualified report is supplied. No model substitution or hardcoded placeholder score.
- [ ] Show overall as a view of per-model panels; keep reference rates, configurations, uncertainty and relative best scores within each model. Do not pool unmatched harness/task populations or subscription credits and dollars into a universal ranking.
- [ ] Remove hardcoded model/task counts in generalized view labels while retaining exact existing current-campaign validation. Persist model selection in URL and reset/task interactions; static no-JS results remain useful.
- [ ] Test two distinct mock model campaigns, missing harnesses, different rates, escaping and selection/reset; run site build and desktop/mobile browser checks. Commit.
