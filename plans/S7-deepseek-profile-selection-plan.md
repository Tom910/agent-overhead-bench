# S7 — Explicit approved profile selection

Status: Implemented and independently reviewed (2026-09-10).

Goal: select the approved DeepSeek S2 profile through launch, preflight, freeze
and portable archive validation without changing historical GLM artifacts.

Use a small checked-in registry for exactly two approved profile IDs and their
scope, eligibility and S2-decision paths. `AOB_OFFICIAL_PROFILE` selects DeepSeek;
omission preserves the existing GLM default. Both scope validators require the
profile/model pair and OpenRouter upstream to agree. No arbitrary profile/file
injection, schema changes, new dependencies or weakening of calibration gates.

Files: `scripts/official-profiles.mjs`, `scripts/s7-profile.mjs`,
`scripts/s7-official-scope.mjs`, `scripts/run-all.sh`, `scripts/s7-preflight.sh`,
`scripts/s7-freeze.sh`, `scripts/s7-verify-archive.sh`,
`scripts/deepseek-profile.test.mjs`.

1. Add failing tests for DeepSeek scope selection, cross-profile mismatch,
   unknown profile and the retained GLM default.
2. Implement registry and propagate selected scope to launch/preflight/freeze;
   use the archived scope's own approved profile during portable verification.
3. Run scope/eligibility tests, launch/regime/archive tests and lint. Perform
   independent review before starting validation with the new profile.

Review follow-up: enforce the approved DeepSeek provider, no-fallback policy,
Relace exclusion and fixed-tier price book at preflight, official freeze and
portable verification, using one shared predicate.

Verification: four profile tests and three official freeze/archive regressions pass;
24 existing launch/eligibility/archive tests passed during implementation.
