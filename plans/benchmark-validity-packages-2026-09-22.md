# Benchmark validity implementation packages

Approved direction: [September 22 audit](harness-benchmark-audit-2026-09-22.md),
followed by the maintainer's instruction to implement the priorities with
subagents. Execute one stage at a time. These packages improve the measurement
instrument and future evidence; they do not retroactively certify old runs.

| Order | Stage | Deliverable | Acceptance |
|---|---|---|---|
| 1 | S5 | Preserve retry evidence and original candidate patches with a private integrity manifest | Timeout/retry and verifier-mutation tests recover the exact original evidence; unsafe paths fail closed |
| 2 | S3 | Task validity cards, executable review gate, alternate/broken-solution and repeatability evidence | All eight existing tasks have explicit obligations and gaps; inadequate evidence cannot earn approval |
| 3 | S5, then S7 | Enforced resource policies, recorded randomized blocks, condition-evidence admission | Mock launches enforce declared limits; resume retains schedule and rejects changed policies; missing observations cannot qualify |
| 4 | S4, then S6 | Timing qualification and evidence-linked failure diagnostics | Known-duration/overlap fixtures qualify measurement math; reports distinguish coverage and unknown causes |
| 5 | S6 | Task consistency, leave-one-task-out sensitivity, token/cost uncertainty, collection accounting, model-aware views | Recomputed outputs agree with source attempts; incomplete cohorts cannot become a pooled overall ranking |
| 6 | S3 | Runnable diagnostic portfolio covering short fixes, diagnosis, configuration and context/recovery | Pristine fails, reference and alternate fixes pass, broken mutations fail; development diagnostics stay separate from reviewed public tasks |

## Scope and constraints

- No model calls, new benchmark attempts, or subscription usage in this implementation.
- Existing results, versioned verifier amendments, source lineage and review approvals remain immutable.
- Preserve C1–C4 and their additive timing model. Derived analysis belongs in reports or sidecars, never `run.json`.
- Keep one Linux host and serial measured execution. Use existing randomization, budget and resume machinery.
- No npm dependencies. CI uses offline fixtures and mock providers only.
- Keep pass rate, average task cost, total benchmark cost, cache and tokens first in the UI.
- DeepSeek and exact `gpt-6-luna` are the intended model choices. Show only models with actual validated data. A pinned CLIProxyAPI subscription bridge has been identified; offline qualification takes priority after package 1. No quota-consuming probe is part of these engineering checks.
- Future empirical calibration and a newly funded campaign remain separate from these engineering checks.

Implementation and review evidence are recorded in the corresponding stage plans
and a local SDD progress ledger. A completed package means its stated engineering
acceptance passed, not that the entire benchmark has received scientific certification.

## Current progress

Package 1 is implemented and independently reviewed (`e01132a`); Linux focused
retention/candidate checks pass. Packages 2–6 have detailed stage plans and remain
unimplemented. Latest maintainer steering prioritizes the reusable all-five
Codex subscription bridge next; see
[S2 preparation](S2-codex-bridge-preparation-plan.md). Existing results remain unchanged.
