# Selected-attempt analysis

Selected attempts: 200. Populations: 3.

Pass = completed native verification; verification failure = verify\_error; other = timeout or adapter\_error. verify\_error alone does not distinguish task failure from verifier infrastructure failure. Failure timing stays separate and is not ranked against passes.

Coverage counts all selected attempts. Each metric has its own valid n and missing n; timing, usage, caching and cost denominators can differ. Unavailable is not zero.

IQR tasks counts successful timing tasks with at least two eligible repetitions, out of all successful timing tasks. Headline spread is the median measurable within-task IQR, not pooled spread.

Outcome spend is the sum of selected static estimates. When any costs are missing, the displayed amount is only a known subtotal. Failed attempts and other outcomes are reported separately from pass spend.

Distributions describe repetitions within one task, harness/version and outcome. Q1–Q3 and min–max describe observed samples, not confidence intervals; singleton quartiles are unavailable.

Matched comparisons include only common successful task identities. Each task contributes one within-task median; summary times are medians across those task medians. The descriptive ratio is the median of right / left task ratios, not a causal effect or ratio of unrelated headline medians.

Task identity includes base revision, verifier image and environment. Repetitions are not paired seeds; execution windows can differ. Recorded host fields do not establish machine identity.

Request metrics come from sanitized C1 model attempts. Wait is first-byte minus request start; transfer is last-byte minus first-byte. Synthetic first-byte markers from network failures are unavailable. Gaps exclude overlapping model intervals; time after last is reconciled adapter end minus the latest response end. Request summary duration, wait, transfer and gap columns are medians of within-run medians, with metric-specific available and missing run counts.

Timing uses the existing C1 interval-union derivation. Unreconciled timing is unavailable; outcome groups remain separate.

Usage covers successful model responses; turns count identifiable API attempts. Static costs are not invoices and exclude attempts absent from this export.

Matched comparisons use only common tasks with reconciled native passes on both sides. Repetition indices are not paired seeds. Samples and execution windows can differ.

No matched-model comparison is produced when the recorded model is unspecified.

Host fields describe recorded hardware, not unique machine identity. Same-host populations do not establish causal harness effects.

Quartiles describe observed runs, not confidence intervals. Singleton spread is unavailable. Non-model time includes unobserved tool and harness work.

Request series are sanitized C1 model attempts: duration, wait, transfer, gaps and per-call tokens/cost. Paths, bodies and logs are not exported. Relationships are within a run or matched task, not ratios of unrelated headline medians.

## Population 1

| Recorded identity | Value |
| --- | --- |
| Condition | pinned |
| Model | deepseek/deepseek-v4.1-flash |
| Price book | deepseek-v41-low-2026-09-10 |
| Host OS | darwin |
| Host CPU | arm64 |
| Host RAM (GiB; rounded) | 16.00 |
| Source | public-task-pack |
| Repository | https://github.com/datacurve-ai/deep-swe.git |
| Source revision | 0b9fabbb63b9104d678fe965e1632f2dd9eaa2ea |
| Regime | extended |
| Ignored providers | relace |
| Only provider | deepseek |
| Allow fallbacks | false |
| Configuration | unavailable |
| ORI version | unavailable |

### Coverage

| Harness @ version | Selected | Pass | Verify fail | Other | Tasks | Timing n | Timing tasks | Turns n | Input n | Output n | Cache n | Cost n | IQR tasks / successful timing tasks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| cline @ 3.0.61 | 2 | 1 | 1 | 0 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 1 | 0 / 1 |
| codex @ codex-cli 0.149.1 | 37 | 23 | 14 | 0 | 8 | 37 | 8 | 37 | 37 | 37 | 37 | 37 | 6 / 7 |
| hermes @ Hermes Agent v0.20.5 (2026.8.19) | 40 | 18 | 22 | 0 | 8 | 40 | 8 | 40 | 40 | 40 | 40 | 40 | 4 / 6 |
| pi @ 0.73.1 | 39 | 18 | 21 | 0 | 8 | 39 | 8 | 39 | 39 | 39 | 39 | 39 | 4 / 6 |
| qwen @ 0.22.2 | 18 | 13 | 5 | 0 | 7 | 18 | 7 | 18 | 18 | 18 | 18 | 18 | 4 / 6 |

### Selected spend by outcome

| Harness @ version | Outcome | Selected | Priced n | Missing n | Selected static spend (USD) |
| --- | --- | --- | --- | --- | --- |
| cline @ 3.0.61 | Verification failure (verify\_error) | 1 | 0 | 1 | unavailable |
| cline @ 3.0.61 | Pass (completed) | 1 | 1 | 0 | Total: 0.182579 |
| codex @ codex-cli 0.149.1 | Pass (completed) | 23 | 23 | 0 | Total: 2.122837 |
| codex @ codex-cli 0.149.1 | Verification failure (verify\_error) | 14 | 14 | 0 | Total: 1.177041 |
| hermes @ Hermes Agent v0.20.5 (2026.8.19) | Pass (completed) | 18 | 18 | 0 | Total: 1.852255 |
| hermes @ Hermes Agent v0.20.5 (2026.8.19) | Verification failure (verify\_error) | 22 | 22 | 0 | Total: 2.452077 |
| pi @ 0.73.1 | Verification failure (verify\_error) | 21 | 21 | 0 | Total: 1.834497 |
| pi @ 0.73.1 | Pass (completed) | 18 | 18 | 0 | Total: 2.162844 |
| qwen @ 0.22.2 | Pass (completed) | 13 | 13 | 0 | Total: 1.295888 |
| qwen @ 0.22.2 | Verification failure (verify\_error) | 5 | 5 | 0 | Total: 0.5114131 |

### Request-level summaries

| Harness @ version | Outcome | Runs | Median calls | Median of run median durations | Median of run median waits | Median of run median transfers | Median of run median gaps | Median time after last |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| cline @ 3.0.61 | Verification failure (verify\_error) | 1 | 229 (available n=1; missing n=0) | 2.47s (available n=1; missing n=0) | 1.24s (available n=1; missing n=0) | 1.18s (available n=1; missing n=0) | 61.73742 ms (available n=1; missing n=0) | 1.35s (available n=1; missing n=0) |
| cline @ 3.0.61 | Pass (completed) | 1 | 233 (available n=1; missing n=0) | 2.45s (available n=1; missing n=0) | 1.23s (available n=1; missing n=0) | 1.23s (available n=1; missing n=0) | 66.3365 ms (available n=1; missing n=0) | 1.49s (available n=1; missing n=0) |
| codex @ codex-cli 0.149.1 | Pass (completed) | 23 | 107 (available n=23; missing n=0) | 2.85s (available n=23; missing n=0) | 1.39s (available n=23; missing n=0) | 1.36s (available n=23; missing n=0) | 75.59635 ms (available n=23; missing n=0) | 5.37s (available n=23; missing n=0) |
| codex @ codex-cli 0.149.1 | Verification failure (verify\_error) | 14 | 90 (available n=14; missing n=0) | 2.68s (available n=14; missing n=0) | 1.35s (available n=14; missing n=0) | 1.16s (available n=14; missing n=0) | 74.83949 ms (available n=14; missing n=0) | 5.4s (available n=14; missing n=0) |
| hermes @ Hermes Agent v0.20.5 (2026.8.19) | Pass (completed) | 18 | 77 (available n=18; missing n=0) | 2.96s (available n=18; missing n=0) | 1.56s (available n=18; missing n=0) | 1.4s (available n=18; missing n=0) | 120.9132 ms (available n=18; missing n=0) | 333.7663 ms (available n=18; missing n=0) |
| hermes @ Hermes Agent v0.20.5 (2026.8.19) | Verification failure (verify\_error) | 22 | 80 (available n=22; missing n=0) | 3.03s (available n=22; missing n=0) | 1.53s (available n=22; missing n=0) | 1.55s (available n=22; missing n=0) | 119.2389 ms (available n=22; missing n=0) | 393.908 ms (available n=22; missing n=0) |
| pi @ 0.73.1 | Verification failure (verify\_error) | 21 | 95 (available n=21; missing n=0) | 2.78s (available n=21; missing n=0) | 1.39s (available n=21; missing n=0) | 1.27s (available n=21; missing n=0) | 36.61671 ms (available n=21; missing n=0) | 481.0099 ms (available n=21; missing n=0) |
| pi @ 0.73.1 | Pass (completed) | 18 | 101.5 (available n=18; missing n=0) | 2.99s (available n=18; missing n=0) | 1.46s (available n=18; missing n=0) | 1.53s (available n=18; missing n=0) | 39.72646 ms (available n=18; missing n=0) | 457.9112 ms (available n=18; missing n=0) |
| qwen @ 0.22.2 | Pass (completed) | 13 | 74 (available n=13; missing n=0) | 3.15s (available n=13; missing n=0) | 1.55s (available n=13; missing n=0) | 1.59s (available n=13; missing n=0) | 59.29938 ms (available n=13; missing n=0) | 321.3262 ms (available n=13; missing n=0) |
| qwen @ 0.22.2 | Verification failure (verify\_error) | 5 | 82 (available n=5; missing n=0) | 2.97s (available n=5; missing n=0) | 1.53s (available n=5; missing n=0) | 1.43s (available n=5; missing n=0) | 61.34521 ms (available n=5; missing n=0) | 325.2568 ms (available n=5; missing n=0) |

### Common successful tasks

#### cline @ 3.0.61 (left) vs codex @ codex-cli 0.149.1 (right)

Common successful tasks: 1. Left median of task medians: 1043041 ms. Right median of task medians: 490565.1 ms. Median task ratio (right / left): 0.470322.

| Common successful task | Left n | Left median (ms) | Right n | Right median (ms) | Right / left |
| --- | --- | --- | --- | --- | --- |
| psd-tools-blend-range-api | 1 | 1043041 | 3 | 490565.1 | 0.470322 |

#### cline @ 3.0.61 (left) vs hermes @ Hermes Agent v0.20.5 (2026.8.19) (right)

Common successful tasks: 1. Left median of task medians: 1043041 ms. Right median of task medians: 387303 ms. Median task ratio (right / left): 0.371321.

| Common successful task | Left n | Left median (ms) | Right n | Right median (ms) | Right / left |
| --- | --- | --- | --- | --- | --- |
| psd-tools-blend-range-api | 1 | 1043041 | 5 | 387303 | 0.371321 |

#### cline @ 3.0.61 (left) vs pi @ 0.73.1 (right)

Common successful tasks: 1. Left median of task medians: 1043041 ms. Right median of task medians: 500474.6 ms. Median task ratio (right / left): 0.4798226.

| Common successful task | Left n | Left median (ms) | Right n | Right median (ms) | Right / left |
| --- | --- | --- | --- | --- | --- |
| psd-tools-blend-range-api | 1 | 1043041 | 5 | 500474.6 | 0.4798226 |

#### cline @ 3.0.61 (left) vs qwen @ 0.22.2 (right)

Common successful tasks: 1. Left median of task medians: 1043041 ms. Right median of task medians: 517408.6 ms. Median task ratio (right / left): 0.4960578.

| Common successful task | Left n | Left median (ms) | Right n | Right median (ms) | Right / left |
| --- | --- | --- | --- | --- | --- |
| psd-tools-blend-range-api | 1 | 1043041 | 3 | 517408.6 | 0.4960578 |

#### codex @ codex-cli 0.149.1 (left) vs hermes @ Hermes Agent v0.20.5 (2026.8.19) (right)

Common successful tasks: 6. Left median of task medians: 542371.4 ms. Right median of task medians: 418313.5 ms. Median task ratio (right / left): 0.9996908.

| Common successful task | Left n | Left median (ms) | Right n | Right median (ms) | Right / left |
| --- | --- | --- | --- | --- | --- |
| cattrs-partial-structuring-recovery | 5 | 594177.6 | 4 | 610637.1 | 1.027701 |
| ink-grid-box-layout | 2 | 1036494 | 1 | 336766 | 0.3249087 |
| psd-tools-blend-range-api | 3 | 490565.1 | 5 | 387303 | 0.7895037 |
| superjson-error-stack-serialization | 1 | 313564.5 | 1 | 392127.5 | 1.250548 |
| tomlkit-toml-table-converters | 5 | 679883.4 | 4 | 957799.5 | 1.40877 |
| true-myth-iterable-collection-combinators | 4 | 457454.4 | 3 | 444499.5 | 0.9716803 |

#### codex @ codex-cli 0.149.1 (left) vs pi @ 0.73.1 (right)

Common successful tasks: 6. Left median of task medians: 637030.5 ms. Right median of task medians: 743364.7 ms. Median task ratio (right / left): 1.113334.

| Common successful task | Left n | Left median (ms) | Right n | Right median (ms) | Right / left |
| --- | --- | --- | --- | --- | --- |
| cattrs-partial-structuring-recovery | 5 | 594177.6 | 2 | 705434.5 | 1.187245 |
| ink-grid-box-layout | 2 | 1036494 | 1 | 1170764 | 1.129542 |
| psd-tools-blend-range-api | 3 | 490565.1 | 5 | 500474.6 | 1.0202 |
| textual-richlog-follow-state | 3 | 1099091 | 1 | 952767.9 | 0.8668688 |
| tomlkit-toml-table-converters | 5 | 679883.4 | 4 | 781295 | 1.14916 |
| true-myth-iterable-collection-combinators | 4 | 457454.4 | 5 | 501884.6 | 1.097125 |

#### codex @ codex-cli 0.149.1 (left) vs qwen @ 0.22.2 (right)

Common successful tasks: 6. Left median of task medians: 542371.4 ms. Right median of task medians: 514363.4 ms. Median task ratio (right / left): 0.9452601.

| Common successful task | Left n | Left median (ms) | Right n | Right median (ms) | Right / left |
| --- | --- | --- | --- | --- | --- |
| cattrs-partial-structuring-recovery | 5 | 594177.6 | 3 | 511318.3 | 0.8605479 |
| psd-tools-blend-range-api | 3 | 490565.1 | 3 | 517408.6 | 1.054719 |
| superjson-error-stack-serialization | 1 | 313564.5 | 2 | 340210.6 | 1.084978 |
| textual-richlog-follow-state | 3 | 1099091 | 1 | 896108.3 | 0.8153175 |
| tomlkit-toml-table-converters | 5 | 679883.4 | 3 | 700261 | 1.029972 |
| true-myth-iterable-collection-combinators | 4 | 457454.4 | 1 | 364074.8 | 0.7958712 |

#### hermes @ Hermes Agent v0.20.5 (2026.8.19) (left) vs pi @ 0.73.1 (right)

Common successful tasks: 5. Left median of task medians: 444499.5 ms. Right median of task medians: 705434.5 ms. Median task ratio (right / left): 1.155243.

| Common successful task | Left n | Left median (ms) | Right n | Right median (ms) | Right / left |
| --- | --- | --- | --- | --- | --- |
| cattrs-partial-structuring-recovery | 4 | 610637.1 | 2 | 705434.5 | 1.155243 |
| ink-grid-box-layout | 1 | 336766 | 1 | 1170764 | 3.476491 |
| psd-tools-blend-range-api | 5 | 387303 | 5 | 500474.6 | 1.292204 |
| tomlkit-toml-table-converters | 4 | 957799.5 | 4 | 781295 | 0.8157188 |
| true-myth-iterable-collection-combinators | 3 | 444499.5 | 5 | 501884.6 | 1.129101 |

#### hermes @ Hermes Agent v0.20.5 (2026.8.19) (left) vs qwen @ 0.22.2 (right)

Common successful tasks: 5. Left median of task medians: 444499.5 ms. Right median of task medians: 511318.3 ms. Median task ratio (right / left): 0.8373522.

| Common successful task | Left n | Left median (ms) | Right n | Right median (ms) | Right / left |
| --- | --- | --- | --- | --- | --- |
| cattrs-partial-structuring-recovery | 4 | 610637.1 | 3 | 511318.3 | 0.8373522 |
| psd-tools-blend-range-api | 5 | 387303 | 3 | 517408.6 | 1.335927 |
| superjson-error-stack-serialization | 1 | 392127.5 | 2 | 340210.6 | 0.8676021 |
| tomlkit-toml-table-converters | 4 | 957799.5 | 3 | 700261 | 0.7311145 |
| true-myth-iterable-collection-combinators | 3 | 444499.5 | 1 | 364074.8 | 0.8190669 |

#### pi @ 0.73.1 (left) vs qwen @ 0.22.2 (right)

Common successful tasks: 5. Left median of task medians: 705434.5 ms. Right median of task medians: 517408.6 ms. Median task ratio (right / left): 0.8962825.

| Common successful task | Left n | Left median (ms) | Right n | Right median (ms) | Right / left |
| --- | --- | --- | --- | --- | --- |
| cattrs-partial-structuring-recovery | 2 | 705434.5 | 3 | 511318.3 | 0.7248275 |
| psd-tools-blend-range-api | 5 | 500474.6 | 3 | 517408.6 | 1.033836 |
| textual-richlog-follow-state | 1 | 952767.9 | 1 | 896108.3 | 0.9405316 |
| tomlkit-toml-table-converters | 4 | 781295 | 3 | 700261 | 0.8962825 |
| true-myth-iterable-collection-combinators | 5 | 501884.6 | 1 | 364074.8 | 0.7254153 |

### Per-task outcome distributions

#### cattrs-partial-structuring-recovery — cline @ 3.0.61 — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;cattrs-partial-structuring-recovery&quot;,&quot;91df27b2a20f26c35777a92f4555438b62c06345&quot;,&quot;sha256:e66b78a8b7598a3f4a549cd39bd05817e5ae8aea24031e24c424c8507a7bbb09&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 1081870 | unavailable | unavailable | 1081870 | 1081870 |
| Model (ms) | 1 | 0 | 862186.2 | unavailable | unavailable | 862186.2 | 862186.2 |
| Non-model (ms) | 1 | 0 | 218682.9 | unavailable | unavailable | 218682.9 | 218682.9 |
| Startup (ms) | 1 | 0 | 1000.898 | unavailable | unavailable | 1000.898 | 1000.898 |
| First byte (ms) | 1 | 0 | 1240.806 | unavailable | unavailable | 1240.806 | 1240.806 |
| API turns | 1 | 0 | 229 | unavailable | unavailable | 229 | 229 |
| Input tokens | 1 | 0 | 11428460 | unavailable | unavailable | 11428460 | 11428460 |
| Output tokens | 1 | 0 | 143890 | unavailable | unavailable | 143890 | 143890 |
| Cached input (%) | 1 | 0 | 97.38046 | unavailable | unavailable | 97.38046 | 97.38046 |
| Static cost (USD) | 0 | 1 | unavailable | unavailable | unavailable | unavailable | unavailable |
| Model request count | 1 | 0 | 229 | unavailable | unavailable | 229 | 229 |
| Within-run median request duration (ms) | 1 | 0 | 2470.481 | unavailable | unavailable | 2470.481 | 2470.481 |
| Within-run median request wait (ms) | 1 | 0 | 1240.806 | unavailable | unavailable | 1240.806 | 1240.806 |
| Within-run median request transfer (ms) | 1 | 0 | 1184.313 | unavailable | unavailable | 1184.313 | 1184.313 |
| Within-run median inter-request gap (ms) | 1 | 0 | 61.73742 | unavailable | unavailable | 61.73742 | 61.73742 |
| Largest request duration (ms) | 1 | 0 | 67827.82 | unavailable | unavailable | 67827.82 | 67827.82 |
| Largest inter-request gap (ms) | 1 | 0 | 30083.61 | unavailable | unavailable | 30083.61 | 30083.61 |
| Time after last model response (ms) | 1 | 0 | 1354.095 | unavailable | unavailable | 1354.095 | 1354.095 |

#### psd-tools-blend-range-api — cline @ 3.0.61 — Pass (completed)

Selected attempts: 1. Task identity: \[&quot;psd-tools-blend-range-api&quot;,&quot;01595992c5f4d4695251fdf58b3edb5302d3ba46&quot;,&quot;sha256:2188831b06029f17b7cc1af49296bd7a865861a31afcad65be5ea69f130267fa&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 1043041 | unavailable | unavailable | 1043041 | 1043041 |
| Model (ms) | 1 | 0 | 837417.7 | unavailable | unavailable | 837417.7 | 837417.7 |
| Non-model (ms) | 1 | 0 | 204405.7 | unavailable | unavailable | 204405.7 | 204405.7 |
| Startup (ms) | 1 | 0 | 1217.478 | unavailable | unavailable | 1217.478 | 1217.478 |
| First byte (ms) | 1 | 0 | 1226.845 | unavailable | unavailable | 1226.845 | 1226.845 |
| API turns | 1 | 0 | 233 | unavailable | unavailable | 233 | 233 |
| Input tokens | 1 | 0 | 12137630 | unavailable | unavailable | 12137630 | 12137630 |
| Output tokens | 1 | 0 | 149365 | unavailable | unavailable | 149365 | 149365 |
| Cached input (%) | 1 | 0 | 96.83073 | unavailable | unavailable | 96.83073 | 96.83073 |
| Static cost (USD) | 1 | 0 | 0.182579 | unavailable | unavailable | 0.182579 | 0.182579 |
| Model request count | 1 | 0 | 233 | unavailable | unavailable | 233 | 233 |
| Within-run median request duration (ms) | 1 | 0 | 2452.018 | unavailable | unavailable | 2452.018 | 2452.018 |
| Within-run median request wait (ms) | 1 | 0 | 1226.845 | unavailable | unavailable | 1226.845 | 1226.845 |
| Within-run median request transfer (ms) | 1 | 0 | 1227.759 | unavailable | unavailable | 1227.759 | 1227.759 |
| Within-run median inter-request gap (ms) | 1 | 0 | 66.3365 | unavailable | unavailable | 66.3365 | 66.3365 |
| Largest request duration (ms) | 1 | 0 | 41876.43 | unavailable | unavailable | 41876.43 | 41876.43 |
| Largest inter-request gap (ms) | 1 | 0 | 30107.4 | unavailable | unavailable | 30107.4 | 30107.4 |
| Time after last model response (ms) | 1 | 0 | 1489.534 | unavailable | unavailable | 1489.534 | 1489.534 |

#### cattrs-partial-structuring-recovery — codex @ codex-cli 0.149.1 — Pass (completed)

Selected attempts: 5. Task identity: \[&quot;cattrs-partial-structuring-recovery&quot;,&quot;91df27b2a20f26c35777a92f4555438b62c06345&quot;,&quot;sha256:e66b78a8b7598a3f4a549cd39bd05817e5ae8aea24031e24c424c8507a7bbb09&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 5 | 0 | 594177.6 | 586635.8 | 664708.4 | 557313.5 | 670689.1 |
| Model (ms) | 5 | 0 | 503109 | 406777 | 535728.5 | 401079.3 | 549193.9 |
| Non-model (ms) | 5 | 0 | 155733.5 | 120855.5 | 160740.5 | 57745.65 | 179239.3 |
| Startup (ms) | 5 | 0 | 639.731 | 619.505 | 703.4691 | 500.6956 | 858.9605 |
| First byte (ms) | 5 | 0 | 1390.451 | 1374.883 | 1418.922 | 1338.579 | 1463.883 |
| API turns | 5 | 0 | 107 | 107 | 118 | 81 | 119 |
| Input tokens | 5 | 0 | 10016870 | 8116577 | 10544550 | 6149086 | 11084960 |
| Output tokens | 5 | 0 | 85070 | 68367 | 89293 | 64065 | 94047 |
| Cached input (%) | 5 | 0 | 99.31137 | 99.15195 | 99.31789 | 99.01179 | 99.32648 |
| Static cost (USD) | 5 | 0 | 0.09334976 | 0.07290718 | 0.09652273 | 0.06840006 | 0.09780571 |
| Model request count | 5 | 0 | 107 | 107 | 118 | 81 | 119 |
| Within-run median request duration (ms) | 5 | 0 | 2804.001 | 2647.6 | 2931.07 | 2592.73 | 3112.131 |
| Within-run median request wait (ms) | 5 | 0 | 1390.451 | 1374.883 | 1418.922 | 1338.579 | 1463.883 |
| Within-run median request transfer (ms) | 5 | 0 | 1326.958 | 1123.067 | 1406.152 | 1046.308 | 1686.754 |
| Within-run median inter-request gap (ms) | 5 | 0 | 68.46667 | 65.40052 | 68.68092 | 65.27742 | 80.93871 |
| Largest request duration (ms) | 5 | 0 | 30476.87 | 29632.27 | 42729.31 | 22518.02 | 47157.11 |
| Largest inter-request gap (ms) | 5 | 0 | 30205.54 | 10190.82 | 33011.37 | 8243.132 | 52740.39 |
| Time after last model response (ms) | 5 | 0 | 5366.305 | 5360.945 | 5431.383 | 5349.169 | 8987.26 |

#### happy-dom-deterministic-intersectionobserver — codex @ codex-cli 0.149.1 — Verification failure (verify_error)

Selected attempts: 5. Task identity: \[&quot;happy-dom-deterministic-intersectionobserver&quot;,&quot;32b2a8e60eab482c023af377160bf294d6da0318&quot;,&quot;sha256:dbaaeeb69f2afcd8b53865d8c0ad3f0e4b0a4a3db2ef6590890ea5419d17e7db&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 5 | 0 | 592028.1 | 581429.8 | 613038.7 | 570865.2 | 686670.8 |
| Model (ms) | 5 | 0 | 444569.8 | 441037.4 | 486895.6 | 364840.7 | 527569.4 |
| Non-model (ms) | 5 | 0 | 146559 | 139597.4 | 158167.6 | 125257.8 | 204559.8 |
| Startup (ms) | 5 | 0 | 899.2722 | 885.2623 | 933.7644 | 795.0309 | 1464.668 |
| First byte (ms) | 5 | 0 | 1344.239 | 1318.569 | 1390.059 | 1191.322 | 1418.515 |
| API turns | 5 | 0 | 87 | 84 | 93 | 79 | 111 |
| Input tokens | 5 | 0 | 6606800 | 5123625 | 6983274 | 5082248 | 9832531 |
| Output tokens | 5 | 0 | 79209 | 76627 | 91233 | 62659 | 93247 |
| Cached input (%) | 5 | 0 | 99.01602 | 99.00501 | 99.10177 | 98.99741 | 99.32612 |
| Static cost (USD) | 5 | 0 | 0.07452017 | 0.07020564 | 0.08579058 | 0.06051752 | 0.09518587 |
| Model request count | 5 | 0 | 87 | 84 | 93 | 79 | 111 |
| Within-run median request duration (ms) | 5 | 0 | 2700.053 | 2621.965 | 2949.501 | 2195.45 | 3545.971 |
| Within-run median request wait (ms) | 5 | 0 | 1344.239 | 1318.569 | 1390.059 | 1191.322 | 1418.515 |
| Within-run median request transfer (ms) | 5 | 0 | 1235.908 | 1127.927 | 1484.105 | 988.4009 | 2319.618 |
| Within-run median inter-request gap (ms) | 5 | 0 | 75.34569 | 74.33329 | 76.07783 | 59.90256 | 87.71642 |
| Largest request duration (ms) | 5 | 0 | 33432.13 | 28874.93 | 35978.92 | 28071.6 | 53307.02 |
| Largest inter-request gap (ms) | 5 | 0 | 30219.65 | 30214.13 | 30223.13 | 30211.35 | 30233.16 |
| Time after last model response (ms) | 5 | 0 | 5523.507 | 5512.043 | 5636.971 | 5431.213 | 5934.562 |

#### ink-grid-box-layout — codex @ codex-cli 0.149.1 — Pass (completed)

Selected attempts: 2. Task identity: \[&quot;ink-grid-box-layout&quot;,&quot;477fda7df7781406d2ba046eb48dd5391e964b72&quot;,&quot;sha256:78f1b7f720e76802674405c9c7f39f7b24a1d885076f9a640e4ea5a9066db276&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 1036494 | 926119.4 | 1146869 | 815744.5 | 1257244 |
| Model (ms) | 2 | 0 | 516183.1 | 474872.9 | 557493.3 | 433562.6 | 598803.6 |
| Non-model (ms) | 2 | 0 | 519379.9 | 450355.1 | 588404.6 | 381330.4 | 657429.4 |
| Startup (ms) | 2 | 0 | 931.2325 | 891.3396 | 971.1254 | 851.4468 | 1011.018 |
| First byte (ms) | 2 | 0 | 1388.056 | 1374.444 | 1401.668 | 1360.832 | 1415.28 |
| API turns | 2 | 0 | 109 | 98 | 120 | 87 | 131 |
| Input tokens | 2 | 0 | 9754807 | 8283762 | 11225850 | 6812717 | 12696900 |
| Output tokens | 2 | 0 | 81732 | 75690.5 | 87773.5 | 69649 | 93815 |
| Cached input (%) | 2 | 0 | 99.2802 | 99.21139 | 99.34901 | 99.14259 | 99.41781 |
| Static cost (USD) | 2 | 0 | 0.0880301 | 0.07942218 | 0.09663801 | 0.07081426 | 0.1052459 |
| Model request count | 2 | 0 | 109 | 98 | 120 | 87 | 131 |
| Within-run median request duration (ms) | 2 | 0 | 2772.681 | 2734.04 | 2811.322 | 2695.399 | 2849.963 |
| Within-run median request wait (ms) | 2 | 0 | 1388.056 | 1374.444 | 1401.668 | 1360.832 | 1415.28 |
| Within-run median request transfer (ms) | 2 | 0 | 1343.302 | 1277.136 | 1409.469 | 1210.97 | 1475.635 |
| Within-run median inter-request gap (ms) | 2 | 0 | 92.56846 | 84.93446 | 100.2025 | 77.30046 | 107.8365 |
| Largest request duration (ms) | 2 | 0 | 53475.98 | 49016.25 | 57935.72 | 44556.51 | 62395.45 |
| Largest inter-request gap (ms) | 2 | 0 | 45823.19 | 45556.75 | 46089.63 | 45290.31 | 46356.06 |
| Time after last model response (ms) | 2 | 0 | 5437.602 | 5347.272 | 5527.932 | 5256.942 | 5618.262 |

#### ink-grid-box-layout — codex @ codex-cli 0.149.1 — Verification failure (verify_error)

Selected attempts: 3. Task identity: \[&quot;ink-grid-box-layout&quot;,&quot;477fda7df7781406d2ba046eb48dd5391e964b72&quot;,&quot;sha256:78f1b7f720e76802674405c9c7f39f7b24a1d885076f9a640e4ea5a9066db276&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 3 | 0 | 896103 | 767795.7 | 959811.9 | 639488.5 | 1023521 |
| Model (ms) | 3 | 0 | 545682 | 483376.7 | 563501 | 421071.4 | 581320 |
| Non-model (ms) | 3 | 0 | 349553 | 283522.6 | 395395.4 | 217492.2 | 441237.9 |
| Startup (ms) | 3 | 0 | 924.8992 | 896.4507 | 943.8927 | 868.0022 | 962.8863 |
| First byte (ms) | 3 | 0 | 1432.391 | 1385.481 | 1433.499 | 1338.571 | 1434.607 |
| API turns | 3 | 0 | 133 | 114 | 135.5 | 95 | 138 |
| Input tokens | 3 | 0 | 11371200 | 9652273 | 11799870 | 7933343 | 12228530 |
| Output tokens | 3 | 0 | 85756 | 76468 | 88558 | 67180 | 91360 |
| Cached input (%) | 3 | 0 | 99.36736 | 99.24221 | 99.39015 | 99.11706 | 99.41295 |
| Static cost (USD) | 3 | 0 | 0.09874259 | 0.08657377 | 0.09912707 | 0.07440494 | 0.09951155 |
| Model request count | 3 | 0 | 133 | 114 | 135.5 | 95 | 138 |
| Within-run median request duration (ms) | 3 | 0 | 2699.583 | 2595.504 | 2715.492 | 2491.425 | 2731.402 |
| Within-run median request wait (ms) | 3 | 0 | 1432.391 | 1385.481 | 1433.499 | 1338.571 | 1434.607 |
| Within-run median request transfer (ms) | 3 | 0 | 1104.175 | 1053.334 | 1173.567 | 1002.492 | 1242.959 |
| Within-run median inter-request gap (ms) | 3 | 0 | 71.74327 | 71.49796 | 77.51751 | 71.25265 | 83.29175 |
| Largest request duration (ms) | 3 | 0 | 42899.93 | 36251.13 | 44896.91 | 29602.34 | 46893.88 |
| Largest inter-request gap (ms) | 3 | 0 | 45825.08 | 45511.24 | 58299.28 | 45197.4 | 70773.48 |
| Time after last model response (ms) | 3 | 0 | 5343.791 | 5322.09 | 5345.501 | 5300.389 | 5347.212 |

#### psd-tools-blend-range-api — codex @ codex-cli 0.149.1 — Pass (completed)

Selected attempts: 3. Task identity: \[&quot;psd-tools-blend-range-api&quot;,&quot;01595992c5f4d4695251fdf58b3edb5302d3ba46&quot;,&quot;sha256:2188831b06029f17b7cc1af49296bd7a865861a31afcad65be5ea69f130267fa&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 3 | 0 | 490565.1 | 438828.9 | 536493.4 | 387092.7 | 582421.7 |
| Model (ms) | 3 | 0 | 421777.7 | 378009.5 | 447051.2 | 334241.2 | 472324.7 |
| Non-model (ms) | 3 | 0 | 68288.66 | 60330.11 | 88777.67 | 52371.56 | 109266.7 |
| Startup (ms) | 3 | 0 | 498.7475 | 489.3531 | 664.5016 | 479.9586 | 830.2558 |
| First byte (ms) | 3 | 0 | 1357.114 | 1326.559 | 1358.339 | 1296.005 | 1359.563 |
| API turns | 3 | 0 | 105 | 97.5 | 113.5 | 90 | 122 |
| Input tokens | 3 | 0 | 8247326 | 6665505 | 9046905 | 5083683 | 9846484 |
| Output tokens | 3 | 0 | 73529 | 61659 | 73661.5 | 49789 | 73794 |
| Cached input (%) | 3 | 0 | 99.21276 | 99.04707 | 99.26147 | 98.88138 | 99.31017 |
| Static cost (USD) | 3 | 0 | 0.0784035 | 0.0659437 | 0.08110209 | 0.0534839 | 0.08380068 |
| Model request count | 3 | 0 | 105 | 97.5 | 113.5 | 90 | 122 |
| Within-run median request duration (ms) | 3 | 0 | 2475.377 | 2447.191 | 2547.964 | 2419.006 | 2620.552 |
| Within-run median request wait (ms) | 3 | 0 | 1357.114 | 1326.559 | 1358.339 | 1296.005 | 1359.563 |
| Within-run median request transfer (ms) | 3 | 0 | 1153.651 | 1055.762 | 1203.21 | 957.8735 | 1252.769 |
| Within-run median inter-request gap (ms) | 3 | 0 | 82.32371 | 75.31435 | 83.43708 | 68.305 | 84.55046 |
| Largest request duration (ms) | 3 | 0 | 26973.21 | 23280.72 | 29090.78 | 19588.23 | 31208.34 |
| Largest inter-request gap (ms) | 3 | 0 | 9621.218 | 9444.277 | 9910.326 | 9267.336 | 10199.43 |
| Time after last model response (ms) | 3 | 0 | 5298.093 | 5250.338 | 6697.734 | 5202.583 | 8097.376 |

#### psd-tools-blend-range-api — codex @ codex-cli 0.149.1 — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;psd-tools-blend-range-api&quot;,&quot;01595992c5f4d4695251fdf58b3edb5302d3ba46&quot;,&quot;sha256:2188831b06029f17b7cc1af49296bd7a865861a31afcad65be5ea69f130267fa&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 485682.1 | unavailable | unavailable | 485682.1 | 485682.1 |
| Model (ms) | 1 | 0 | 411569.2 | unavailable | unavailable | 411569.2 | 411569.2 |
| Non-model (ms) | 1 | 0 | 73323.96 | unavailable | unavailable | 73323.96 | 73323.96 |
| Startup (ms) | 1 | 0 | 788.9285 | unavailable | unavailable | 788.9285 | 788.9285 |
| First byte (ms) | 1 | 0 | 1342.857 | unavailable | unavailable | 1342.857 | 1342.857 |
| API turns | 1 | 0 | 115 | unavailable | unavailable | 115 | 115 |
| Input tokens | 1 | 0 | 8372167 | unavailable | unavailable | 8372167 | 8372167 |
| Output tokens | 1 | 0 | 68333 | unavailable | unavailable | 68333 | 68333 |
| Cached input (%) | 1 | 0 | 99.23777 | unavailable | unavailable | 99.23777 | 99.23777 |
| Static cost (USD) | 1 | 0 | 0.07549711 | unavailable | unavailable | 0.07549711 | 0.07549711 |
| Model request count | 1 | 0 | 115 | unavailable | unavailable | 115 | 115 |
| Within-run median request duration (ms) | 1 | 0 | 2284.618 | unavailable | unavailable | 2284.618 | 2284.618 |
| Within-run median request wait (ms) | 1 | 0 | 1342.857 | unavailable | unavailable | 1342.857 | 1342.857 |
| Within-run median request transfer (ms) | 1 | 0 | 860.1503 | unavailable | unavailable | 860.1503 | 860.1503 |
| Within-run median inter-request gap (ms) | 1 | 0 | 74.07969 | unavailable | unavailable | 74.07969 | 74.07969 |
| Largest request duration (ms) | 1 | 0 | 18188.34 | unavailable | unavailable | 18188.34 | 18188.34 |
| Largest inter-request gap (ms) | 1 | 0 | 9529.029 | unavailable | unavailable | 9529.029 | 9529.029 |
| Time after last model response (ms) | 1 | 0 | 5410.627 | unavailable | unavailable | 5410.627 | 5410.627 |

#### superjson-error-stack-serialization — codex @ codex-cli 0.149.1 — Pass (completed)

Selected attempts: 1. Task identity: \[&quot;superjson-error-stack-serialization&quot;,&quot;f143004734ea2dd4090e45013a07f091f5bbaee7&quot;,&quot;sha256:88ff04f0e414e9530c121a53d121611a5674705f8607366803b0a88cdb253fb7&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 313564.5 | unavailable | unavailable | 313564.5 | 313564.5 |
| Model (ms) | 1 | 0 | 290171.9 | unavailable | unavailable | 290171.9 | 290171.9 |
| Non-model (ms) | 1 | 0 | 22579.47 | unavailable | unavailable | 22579.47 | 22579.47 |
| Startup (ms) | 1 | 0 | 813.1428 | unavailable | unavailable | 813.1428 | 813.1428 |
| First byte (ms) | 1 | 0 | 1283.181 | unavailable | unavailable | 1283.181 | 1283.181 |
| API turns | 1 | 0 | 38 | unavailable | unavailable | 38 | 38 |
| Input tokens | 1 | 0 | 2486119 | unavailable | unavailable | 2486119 | 2486119 |
| Output tokens | 1 | 0 | 62594 | unavailable | unavailable | 62594 | 62594 |
| Cached input (%) | 1 | 0 | 97.82315 | unavailable | unavailable | 97.82315 | 97.82315 |
| Static cost (USD) | 1 | 0 | 0.05297025 | unavailable | unavailable | 0.05297025 | 0.05297025 |
| Model request count | 1 | 0 | 38 | unavailable | unavailable | 38 | 38 |
| Within-run median request duration (ms) | 1 | 0 | 2422.744 | unavailable | unavailable | 2422.744 | 2422.744 |
| Within-run median request wait (ms) | 1 | 0 | 1283.181 | unavailable | unavailable | 1283.181 | 1283.181 |
| Within-run median request transfer (ms) | 1 | 0 | 1095.999 | unavailable | unavailable | 1095.999 | 1095.999 |
| Within-run median inter-request gap (ms) | 1 | 0 | 68.97117 | unavailable | unavailable | 68.97117 | 68.97117 |
| Largest request duration (ms) | 1 | 0 | 84905.89 | unavailable | unavailable | 84905.89 | 84905.89 |
| Largest inter-request gap (ms) | 1 | 0 | 2606.53 | unavailable | unavailable | 2606.53 | 2606.53 |
| Time after last model response (ms) | 1 | 0 | 5340.199 | unavailable | unavailable | 5340.199 | 5340.199 |

#### superjson-error-stack-serialization — codex @ codex-cli 0.149.1 — Verification failure (verify_error)

Selected attempts: 3. Task identity: \[&quot;superjson-error-stack-serialization&quot;,&quot;f143004734ea2dd4090e45013a07f091f5bbaee7&quot;,&quot;sha256:88ff04f0e414e9530c121a53d121611a5674705f8607366803b0a88cdb253fb7&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 3 | 0 | 542007 | 475072.1 | 552871.8 | 408137.2 | 563736.5 |
| Model (ms) | 3 | 0 | 492971.5 | 437952.6 | 497447.6 | 382933.7 | 501923.7 |
| Non-model (ms) | 3 | 0 | 39102.48 | 31772.55 | 54312.38 | 24442.62 | 69522.27 |
| Startup (ms) | 3 | 0 | 980.8066 | 870.8705 | 1111.775 | 760.9345 | 1242.742 |
| First byte (ms) | 3 | 0 | 1354.719 | 1353.101 | 1364.138 | 1351.482 | 1373.556 |
| API turns | 3 | 0 | 74 | 63 | 77 | 52 | 80 |
| Input tokens | 3 | 0 | 6023230 | 4814490 | 6292661 | 3605750 | 6562091 |
| Output tokens | 3 | 0 | 97191 | 85974 | 98606.5 | 74757 | 100022 |
| Cached input (%) | 3 | 0 | 99.25812 | 99.11624 | 99.27259 | 98.97436 | 99.28706 |
| Static cost (USD) | 3 | 0 | 0.08269676 | 0.07190228 | 0.08477632 | 0.0611078 | 0.08685587 |
| Model request count | 3 | 0 | 74 | 63 | 77 | 52 | 80 |
| Within-run median request duration (ms) | 3 | 0 | 2657.738 | 2608.05 | 2689.278 | 2558.362 | 2720.817 |
| Within-run median request wait (ms) | 3 | 0 | 1354.719 | 1353.101 | 1364.138 | 1351.482 | 1373.556 |
| Within-run median request transfer (ms) | 3 | 0 | 1169.872 | 1159.778 | 1229.462 | 1149.683 | 1289.052 |
| Within-run median inter-request gap (ms) | 3 | 0 | 80.26838 | 70.13515 | 81.72523 | 60.00192 | 83.18208 |
| Largest request duration (ms) | 3 | 0 | 88630.91 | 79543.46 | 106105.5 | 70456.01 | 123580 |
| Largest inter-request gap (ms) | 3 | 0 | 2306.032 | 2153.939 | 11184.07 | 2001.846 | 20062.11 |
| Time after last model response (ms) | 3 | 0 | 5269.114 | 5268.052 | 5271.772 | 5266.989 | 5274.431 |

#### textual-richlog-follow-state — codex @ codex-cli 0.149.1 — Pass (completed)

Selected attempts: 3. Task identity: \[&quot;textual-richlog-follow-state&quot;,&quot;a12215b791587a6d94227bd30a0e9291de932106&quot;,&quot;sha256:7579c8a5e4d527a7744c76cef25bf4193db0a7c8230a08b105a307d56b4ccc42&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 3 | 0 | 1099091 | 944862 | 1124871 | 790632.7 | 1150650 |
| Model (ms) | 3 | 0 | 580753.7 | 562677.8 | 640210.1 | 544601.9 | 699666.4 |
| Non-model (ms) | 3 | 0 | 398895.7 | 322083.4 | 484045.5 | 245271.1 | 569195.3 |
| Startup (ms) | 3 | 0 | 701.317 | 615.2106 | 730.4901 | 529.1042 | 759.6633 |
| First byte (ms) | 3 | 0 | 1482.674 | 1472.648 | 1485.496 | 1462.622 | 1488.319 |
| API turns | 3 | 0 | 123 | 121.5 | 133 | 120 | 143 |
| Input tokens | 3 | 0 | 11593210 | 11591360 | 12991960 | 11589500 | 14390700 |
| Output tokens | 3 | 0 | 99853 | 94094 | 105617 | 88335 | 111381 |
| Cached input (%) | 3 | 0 | 99.33512 | 99.32366 | 99.38144 | 99.31219 | 99.42776 |
| Static cost (USD) | 3 | 0 | 0.1060075 | 0.1027549 | 0.1140568 | 0.09950227 | 0.1221062 |
| Model request count | 3 | 0 | 123 | 121.5 | 133 | 120 | 143 |
| Within-run median request duration (ms) | 3 | 0 | 3241.327 | 3113.112 | 3267.336 | 2984.897 | 3293.346 |
| Within-run median request wait (ms) | 3 | 0 | 1482.674 | 1472.648 | 1485.496 | 1462.622 | 1488.319 |
| Within-run median request transfer (ms) | 3 | 0 | 1727.546 | 1542.302 | 1770.058 | 1357.059 | 1812.57 |
| Within-run median inter-request gap (ms) | 3 | 0 | 80.69267 | 78.14451 | 90.70148 | 75.59635 | 100.7103 |
| Largest request duration (ms) | 3 | 0 | 36459.32 | 35068.54 | 42127.54 | 33677.75 | 47795.77 |
| Largest inter-request gap (ms) | 3 | 0 | 141792.2 | 130918.8 | 152281.2 | 120045.5 | 162770.2 |
| Time after last model response (ms) | 3 | 0 | 6161.235 | 5782.257 | 7724.066 | 5403.279 | 9286.898 |

#### textual-richlog-follow-state — codex @ codex-cli 0.149.1 — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;textual-richlog-follow-state&quot;,&quot;a12215b791587a6d94227bd30a0e9291de932106&quot;,&quot;sha256:7579c8a5e4d527a7744c76cef25bf4193db0a7c8230a08b105a307d56b4ccc42&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 1303084 | unavailable | unavailable | 1303084 | 1303084 |
| Model (ms) | 1 | 0 | 679544.9 | unavailable | unavailable | 679544.9 | 679544.9 |
| Non-model (ms) | 1 | 0 | 622910.8 | unavailable | unavailable | 622910.8 | 622910.8 |
| Startup (ms) | 1 | 0 | 628.1517 | unavailable | unavailable | 628.1517 | 628.1517 |
| First byte (ms) | 1 | 0 | 1563.1 | unavailable | unavailable | 1563.1 | 1563.1 |
| API turns | 1 | 0 | 121 | unavailable | unavailable | 121 | 121 |
| Input tokens | 1 | 0 | 14374250 | unavailable | unavailable | 14374250 | 14374250 |
| Output tokens | 1 | 0 | 120617 | unavailable | unavailable | 120617 | 120617 |
| Cached input (%) | 1 | 0 | 99.39105 | unavailable | unavailable | 99.39105 | 99.39105 |
| Static cost (USD) | 1 | 0 | 0.1283602 | unavailable | unavailable | 0.1283602 | 0.1283602 |
| Model request count | 1 | 0 | 121 | unavailable | unavailable | 121 | 121 |
| Within-run median request duration (ms) | 1 | 0 | 3824.83 | unavailable | unavailable | 3824.83 | 3824.83 |
| Within-run median request wait (ms) | 1 | 0 | 1563.1 | unavailable | unavailable | 1563.1 | 1563.1 |
| Within-run median request transfer (ms) | 1 | 0 | 2156.027 | unavailable | unavailable | 2156.027 | 2156.027 |
| Within-run median inter-request gap (ms) | 1 | 0 | 113.2796 | unavailable | unavailable | 113.2796 | 113.2796 |
| Largest request duration (ms) | 1 | 0 | 48313.63 | unavailable | unavailable | 48313.63 | 48313.63 |
| Largest inter-request gap (ms) | 1 | 0 | 138229.1 | unavailable | unavailable | 138229.1 | 138229.1 |
| Time after last model response (ms) | 1 | 0 | 5504.616 | unavailable | unavailable | 5504.616 | 5504.616 |

#### tomlkit-toml-table-converters — codex @ codex-cli 0.149.1 — Pass (completed)

Selected attempts: 5. Task identity: \[&quot;tomlkit-toml-table-converters&quot;,&quot;962de91aaf103135f400e5108a798a59a10dc17e&quot;,&quot;sha256:e9178c316850de3a8e7833234dc90fa1eef1767a348902086083bf1fc2bf2d10&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 5 | 0 | 679883.4 | 569187.4 | 838956.4 | 531298.3 | 850664.7 |
| Model (ms) | 5 | 0 | 633198.1 | 528360 | 784886.6 | 496555.3 | 787006.5 |
| Non-model (ms) | 5 | 0 | 45967.9 | 40157.46 | 53429.25 | 34212.61 | 63071.24 |
| Startup (ms) | 5 | 0 | 640.4842 | 586.9938 | 669.9124 | 530.3472 | 717.43 |
| First byte (ms) | 5 | 0 | 1483.856 | 1414.601 | 1537.613 | 1360.547 | 1566.076 |
| API turns | 5 | 0 | 121 | 94 | 130 | 91 | 138 |
| Input tokens | 5 | 0 | 12900510 | 8078394 | 14684190 | 8056632 | 16858000 |
| Output tokens | 5 | 0 | 120022 | 102285 | 137070 | 87718 | 140142 |
| Cached input (%) | 5 | 0 | 99.44608 | 99.25616 | 99.46717 | 99.18427 | 99.54283 |
| Static cost (USD) | 5 | 0 | 0.1212191 | 0.09443941 | 0.1396394 | 0.08646154 | 0.1441453 |
| Model request count | 5 | 0 | 121 | 94 | 130 | 91 | 138 |
| Within-run median request duration (ms) | 5 | 0 | 3589.902 | 3383.047 | 3750.718 | 3142.173 | 3822.967 |
| Within-run median request wait (ms) | 5 | 0 | 1483.856 | 1414.601 | 1537.613 | 1360.547 | 1566.076 |
| Within-run median request transfer (ms) | 5 | 0 | 2159.494 | 1774.605 | 2182.761 | 1648.046 | 2404.771 |
| Within-run median inter-request gap (ms) | 5 | 0 | 90.76867 | 86.97712 | 90.81698 | 74.17504 | 90.94296 |
| Largest request duration (ms) | 5 | 0 | 50674.16 | 42607.02 | 52016.21 | 33065.87 | 63499.36 |
| Largest inter-request gap (ms) | 5 | 0 | 7828.635 | 7763.147 | 7891.061 | 3213.229 | 10204.9 |
| Time after last model response (ms) | 5 | 0 | 5216.31 | 5214.124 | 5282.201 | 5207.856 | 6060.042 |

#### true-myth-iterable-collection-combinators — codex @ codex-cli 0.149.1 — Pass (completed)

Selected attempts: 4. Task identity: \[&quot;true-myth-iterable-collection-combinators&quot;,&quot;5945ad1b96e228ff716275d8a273282101152508&quot;,&quot;sha256:086b4e313e8a7e239cf0633a12c424025fd640294a9d6b44ebf73664a83c6c28&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 4 | 0 | 457454.4 | 429660.2 | 535482.7 | 425905.2 | 689939.7 |
| Model (ms) | 4 | 0 | 385047.1 | 341612.6 | 465054.2 | 340025.5 | 576359 |
| Non-model (ms) | 4 | 0 | 86202.59 | 77278.87 | 94062.23 | 55599.44 | 112549.4 |
| Startup (ms) | 4 | 0 | 950.812 | 763.9883 | 1117.082 | 444.9905 | 1374.42 |
| First byte (ms) | 4 | 0 | 1361.45 | 1356.122 | 1387.894 | 1350.575 | 1456.793 |
| API turns | 4 | 0 | 81.5 | 75.75 | 91 | 66 | 112 |
| Input tokens | 4 | 0 | 6729420 | 5942504 | 8610801 | 5097625 | 12739080 |
| Output tokens | 4 | 0 | 75377 | 64214.75 | 91039.5 | 59918 | 108837 |
| Cached input (%) | 4 | 0 | 98.82617 | 98.69595 | 98.95904 | 98.49795 | 99.165 |
| Static cost (USD) | 4 | 0 | 0.07525988 | 0.06594722 | 0.09321578 | 0.06593672 | 0.119156 |
| Model request count | 4 | 0 | 81.5 | 75.75 | 91 | 66 | 112 |
| Within-run median request duration (ms) | 4 | 0 | 2572.749 | 2431.997 | 2832.672 | 2383.868 | 3238.312 |
| Within-run median request wait (ms) | 4 | 0 | 1361.45 | 1356.122 | 1387.894 | 1350.575 | 1456.793 |
| Within-run median request transfer (ms) | 4 | 0 | 1134.196 | 1107.462 | 1297.679 | 1067.041 | 1748.349 |
| Within-run median inter-request gap (ms) | 4 | 0 | 66.33096 | 64.15393 | 66.68947 | 58.56883 | 66.819 |
| Largest request duration (ms) | 4 | 0 | 27165.58 | 26631.08 | 27724.36 | 25998.25 | 28430.05 |
| Largest inter-request gap (ms) | 4 | 0 | 11682.95 | 7884.26 | 16299.77 | 6617.841 | 20020.55 |
| Time after last model response (ms) | 4 | 0 | 5623.869 | 5389.483 | 6819.149 | 5336.655 | 9754.66 |

#### true-myth-iterable-collection-combinators — codex @ codex-cli 0.149.1 — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;true-myth-iterable-collection-combinators&quot;,&quot;5945ad1b96e228ff716275d8a273282101152508&quot;,&quot;sha256:086b4e313e8a7e239cf0633a12c424025fd640294a9d6b44ebf73664a83c6c28&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 447235.5 | unavailable | unavailable | 447235.5 | 447235.5 |
| Model (ms) | 1 | 0 | 396195.6 | unavailable | unavailable | 396195.6 | 396195.6 |
| Non-model (ms) | 1 | 0 | 50368.51 | unavailable | unavailable | 50368.51 | 50368.51 |
| Startup (ms) | 1 | 0 | 671.3843 | unavailable | unavailable | 671.3843 | 671.3843 |
| First byte (ms) | 1 | 0 | 1322.094 | unavailable | unavailable | 1322.094 | 1322.094 |
| API turns | 1 | 0 | 76 | unavailable | unavailable | 76 | 76 |
| Input tokens | 1 | 0 | 7394875 | unavailable | unavailable | 7394875 | 7394875 |
| Output tokens | 1 | 0 | 81659 | unavailable | unavailable | 81659 | 81659 |
| Cached input (%) | 1 | 0 | 98.85333 | unavailable | unavailable | 98.85333 | 98.85333 |
| Static cost (USD) | 1 | 0 | 0.08364489 | unavailable | unavailable | 0.08364489 | 0.08364489 |
| Model request count | 1 | 0 | 76 | unavailable | unavailable | 76 | 76 |
| Within-run median request duration (ms) | 1 | 0 | 2626.083 | unavailable | unavailable | 2626.083 | 2626.083 |
| Within-run median request wait (ms) | 1 | 0 | 1322.094 | unavailable | unavailable | 1322.094 | 1322.094 |
| Within-run median request transfer (ms) | 1 | 0 | 1036.464 | unavailable | unavailable | 1036.464 | 1036.464 |
| Within-run median inter-request gap (ms) | 1 | 0 | 67.06246 | unavailable | unavailable | 67.06246 | 67.06246 |
| Largest request duration (ms) | 1 | 0 | 28164.55 | unavailable | unavailable | 28164.55 | 28164.55 |
| Largest inter-request gap (ms) | 1 | 0 | 10196.75 | unavailable | unavailable | 10196.75 | 10196.75 |
| Time after last model response (ms) | 1 | 0 | 5381.422 | unavailable | unavailable | 5381.422 | 5381.422 |

#### cattrs-partial-structuring-recovery — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Pass (completed)

Selected attempts: 4. Task identity: \[&quot;cattrs-partial-structuring-recovery&quot;,&quot;91df27b2a20f26c35777a92f4555438b62c06345&quot;,&quot;sha256:e66b78a8b7598a3f4a549cd39bd05817e5ae8aea24031e24c424c8507a7bbb09&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 4 | 0 | 610637.1 | 573733.6 | 664726 | 508701 | 781315.3 |
| Model (ms) | 4 | 0 | 416045.3 | 400082.1 | 455176.8 | 399848.5 | 524915.3 |
| Non-model (ms) | 4 | 0 | 191503.7 | 169617.8 | 207336 | 106070.9 | 252721.9 |
| Startup (ms) | 4 | 0 | 3088.077 | 2978.295 | 3268.738 | 2781.565 | 3678.105 |
| First byte (ms) | 4 | 0 | 1555.943 | 1544.821 | 1560.122 | 1517.057 | 1567.058 |
| API turns | 4 | 0 | 80 | 77 | 82.75 | 71 | 88 |
| Input tokens | 4 | 0 | 9186398 | 8823889 | 9448209 | 8033767 | 9936237 |
| Output tokens | 4 | 0 | 74572.5 | 72298.75 | 79330.25 | 67573 | 91508 |
| Cached input (%) | 4 | 0 | 98.8216 | 98.64032 | 98.92584 | 98.39375 | 98.94128 |
| Static cost (USD) | 4 | 0 | 0.08632924 | 0.08524047 | 0.09130308 | 0.08351246 | 0.1046863 |
| Model request count | 4 | 0 | 80 | 77 | 82.75 | 71 | 88 |
| Within-run median request duration (ms) | 4 | 0 | 3035.303 | 2870.66 | 3358.813 | 2598.194 | 4107.883 |
| Within-run median request wait (ms) | 4 | 0 | 1555.943 | 1544.821 | 1560.122 | 1517.057 | 1567.058 |
| Within-run median request transfer (ms) | 4 | 0 | 1432.3 | 1321.455 | 1691.791 | 1061.805 | 2397.377 |
| Within-run median inter-request gap (ms) | 4 | 0 | 117.0384 | 113.0537 | 121.8791 | 110.7762 | 126.7246 |
| Largest request duration (ms) | 4 | 0 | 77759.66 | 68244.08 | 83345.69 | 46324.11 | 93477.03 |
| Largest inter-request gap (ms) | 4 | 0 | 48102.11 | 43265.43 | 53149.11 | 42502.3 | 54543.22 |
| Time after last model response (ms) | 4 | 0 | 400.8467 | 316.6175 | 539.6124 | 259.803 | 760.0366 |

#### cattrs-partial-structuring-recovery — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;cattrs-partial-structuring-recovery&quot;,&quot;91df27b2a20f26c35777a92f4555438b62c06345&quot;,&quot;sha256:e66b78a8b7598a3f4a549cd39bd05817e5ae8aea24031e24c424c8507a7bbb09&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 602119.3 | unavailable | unavailable | 602119.3 | 602119.3 |
| Model (ms) | 1 | 0 | 460527.2 | unavailable | unavailable | 460527.2 | 460527.2 |
| Non-model (ms) | 1 | 0 | 138116.9 | unavailable | unavailable | 138116.9 | 138116.9 |
| Startup (ms) | 1 | 0 | 3475.245 | unavailable | unavailable | 3475.245 | 3475.245 |
| First byte (ms) | 1 | 0 | 1554.796 | unavailable | unavailable | 1554.796 | 1554.796 |
| API turns | 1 | 0 | 78 | unavailable | unavailable | 78 | 78 |
| Input tokens | 1 | 0 | 9436323 | unavailable | unavailable | 9436323 | 9436323 |
| Output tokens | 1 | 0 | 80807 | unavailable | unavailable | 80807 | 80807 |
| Cached input (%) | 1 | 0 | 98.90361 | unavailable | unavailable | 98.90361 | 98.90361 |
| Static cost (USD) | 1 | 0 | 0.09200164 | unavailable | unavailable | 0.09200164 | 0.09200164 |
| Model request count | 1 | 0 | 78 | unavailable | unavailable | 78 | 78 |
| Within-run median request duration (ms) | 1 | 0 | 3287.957 | unavailable | unavailable | 3287.957 | 3287.957 |
| Within-run median request wait (ms) | 1 | 0 | 1554.796 | unavailable | unavailable | 1554.796 | 1554.796 |
| Within-run median request transfer (ms) | 1 | 0 | 1583.744 | unavailable | unavailable | 1583.744 | 1583.744 |
| Within-run median inter-request gap (ms) | 1 | 0 | 114.5874 | unavailable | unavailable | 114.5874 | 114.5874 |
| Largest request duration (ms) | 1 | 0 | 47494.05 | unavailable | unavailable | 47494.05 | 47494.05 |
| Largest inter-request gap (ms) | 1 | 0 | 39003.44 | unavailable | unavailable | 39003.44 | 39003.44 |
| Time after last model response (ms) | 1 | 0 | 264.4407 | unavailable | unavailable | 264.4407 | 264.4407 |

#### happy-dom-deterministic-intersectionobserver — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Verification failure (verify_error)

Selected attempts: 5. Task identity: \[&quot;happy-dom-deterministic-intersectionobserver&quot;,&quot;32b2a8e60eab482c023af377160bf294d6da0318&quot;,&quot;sha256:dbaaeeb69f2afcd8b53865d8c0ad3f0e4b0a4a3db2ef6590890ea5419d17e7db&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 5 | 0 | 640782.7 | 565338.2 | 682252.7 | 484280.1 | 1094133 |
| Model (ms) | 5 | 0 | 439842 | 434890.9 | 444268.9 | 379139.8 | 461346.9 |
| Non-model (ms) | 5 | 0 | 192812 | 121202.3 | 299237.3 | 46173.18 | 629103.5 |
| Startup (ms) | 5 | 0 | 3701.833 | 3682.557 | 3875.674 | 3216.015 | 4293.823 |
| First byte (ms) | 5 | 0 | 1380.705 | 1377.797 | 1476.425 | 1366.872 | 1511.665 |
| API turns | 5 | 0 | 87 | 76 | 90 | 68 | 91 |
| Input tokens | 5 | 0 | 7691389 | 6362698 | 8371588 | 5307339 | 8966712 |
| Output tokens | 5 | 0 | 77432 | 76512 | 80031 | 69338 | 81768 |
| Cached input (%) | 5 | 0 | 98.90666 | 98.83606 | 99.00012 | 98.59736 | 99.07951 |
| Static cost (USD) | 5 | 0 | 0.08189504 | 0.07903542 | 0.08446118 | 0.06846794 | 0.08598677 |
| Model request count | 5 | 0 | 87 | 76 | 90 | 68 | 91 |
| Within-run median request duration (ms) | 5 | 0 | 2633.134 | 2623.874 | 2837.995 | 2593.651 | 2897.509 |
| Within-run median request wait (ms) | 5 | 0 | 1380.705 | 1377.797 | 1476.425 | 1366.872 | 1511.665 |
| Within-run median request transfer (ms) | 5 | 0 | 1250.907 | 1179.69 | 1472.58 | 1075.224 | 1545.375 |
| Within-run median inter-request gap (ms) | 5 | 0 | 134.2269 | 119.3508 | 144.0176 | 111.9117 | 149.2531 |
| Largest request duration (ms) | 5 | 0 | 42270.61 | 35077.92 | 44597.19 | 30652.44 | 52446.5 |
| Largest inter-request gap (ms) | 5 | 0 | 40218.49 | 24724.84 | 180233.7 | 9059.149 | 185699.7 |
| Time after last model response (ms) | 5 | 0 | 493.4393 | 424.9315 | 563.8657 | 365.7628 | 875.4618 |

#### ink-grid-box-layout — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Pass (completed)

Selected attempts: 1. Task identity: \[&quot;ink-grid-box-layout&quot;,&quot;477fda7df7781406d2ba046eb48dd5391e964b72&quot;,&quot;sha256:78f1b7f720e76802674405c9c7f39f7b24a1d885076f9a640e4ea5a9066db276&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 336766 | unavailable | unavailable | 336766 | 336766 |
| Model (ms) | 1 | 0 | 300465.9 | unavailable | unavailable | 300465.9 | 300465.9 |
| Non-model (ms) | 1 | 0 | 32895.89 | unavailable | unavailable | 32895.89 | 32895.89 |
| Startup (ms) | 1 | 0 | 3404.251 | unavailable | unavailable | 3404.251 | 3404.251 |
| First byte (ms) | 1 | 0 | 1358.854 | unavailable | unavailable | 1358.854 | 1358.854 |
| API turns | 1 | 0 | 45 | unavailable | unavailable | 45 | 45 |
| Input tokens | 1 | 0 | 3464995 | unavailable | unavailable | 3464995 | 3464995 |
| Output tokens | 1 | 0 | 53046 | unavailable | unavailable | 53046 | 53046 |
| Cached input (%) | 1 | 0 | 97.98571 | unavailable | unavailable | 97.98571 | 97.98571 |
| Static cost (USD) | 1 | 0 | 0.05248245 | unavailable | unavailable | 0.05248245 | 0.05248245 |
| Model request count | 1 | 0 | 45 | unavailable | unavailable | 45 | 45 |
| Within-run median request duration (ms) | 1 | 0 | 2545.092 | unavailable | unavailable | 2545.092 | 2545.092 |
| Within-run median request wait (ms) | 1 | 0 | 1358.854 | unavailable | unavailable | 1358.854 | 1358.854 |
| Within-run median request transfer (ms) | 1 | 0 | 1218.833 | unavailable | unavailable | 1218.833 | 1218.833 |
| Within-run median inter-request gap (ms) | 1 | 0 | 101.5377 | unavailable | unavailable | 101.5377 | 101.5377 |
| Largest request duration (ms) | 1 | 0 | 57651.22 | unavailable | unavailable | 57651.22 | 57651.22 |
| Largest inter-request gap (ms) | 1 | 0 | 13757.27 | unavailable | unavailable | 13757.27 | 13757.27 |
| Time after last model response (ms) | 1 | 0 | 4295.134 | unavailable | unavailable | 4295.134 | 4295.134 |

#### ink-grid-box-layout — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Verification failure (verify_error)

Selected attempts: 4. Task identity: \[&quot;ink-grid-box-layout&quot;,&quot;477fda7df7781406d2ba046eb48dd5391e964b72&quot;,&quot;sha256:78f1b7f720e76802674405c9c7f39f7b24a1d885076f9a640e4ea5a9066db276&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 4 | 0 | 824364.4 | 654474.8 | 908098.7 | 386889.8 | 917217.4 |
| Model (ms) | 4 | 0 | 512318.8 | 465923.7 | 524216.1 | 347033.9 | 539612.4 |
| Non-model (ms) | 4 | 0 | 298808.7 | 185172 | 370755.3 | 36340.43 | 394516.5 |
| Startup (ms) | 4 | 0 | 3424.522 | 3153.134 | 3540.814 | 2611.806 | 3616.851 |
| First byte (ms) | 4 | 0 | 1488.27 | 1420.536 | 1557.1 | 1387.595 | 1593.331 |
| API turns | 4 | 0 | 86 | 74.25 | 96.75 | 51 | 117 |
| Input tokens | 4 | 0 | 10228780 | 7987576 | 11725880 | 4258012 | 13223130 |
| Output tokens | 4 | 0 | 84505.5 | 75479.75 | 89313.75 | 62546 | 89595 |
| Cached input (%) | 4 | 0 | 98.99184 | 98.83131 | 99.05417 | 98.37755 | 99.21333 |
| Static cost (USD) | 4 | 0 | 0.09880682 | 0.08619796 | 0.1031837 | 0.06045698 | 0.1042286 |
| Model request count | 4 | 0 | 86 | 74.25 | 96.75 | 51 | 117 |
| Within-run median request duration (ms) | 4 | 0 | 2839.505 | 2495.546 | 3224.223 | 2428.257 | 3413.788 |
| Within-run median request wait (ms) | 4 | 0 | 1488.27 | 1420.536 | 1557.1 | 1387.595 | 1593.331 |
| Within-run median request transfer (ms) | 4 | 0 | 1407.032 | 1024.629 | 1782.543 | 998.6446 | 1787.853 |
| Within-run median inter-request gap (ms) | 4 | 0 | 115.1751 | 106.009 | 125.0628 | 103.0023 | 130.2345 |
| Largest request duration (ms) | 4 | 0 | 53597.28 | 44646.23 | 67022.08 | 40337.02 | 84752.57 |
| Largest inter-request gap (ms) | 4 | 0 | 78407.45 | 62241.59 | 78766.18 | 13767.74 | 79818.62 |
| Time after last model response (ms) | 4 | 0 | 400.3885 | 380.241 | 1198.662 | 379.6098 | 3533.671 |

#### psd-tools-blend-range-api — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Pass (completed)

Selected attempts: 5. Task identity: \[&quot;psd-tools-blend-range-api&quot;,&quot;01595992c5f4d4695251fdf58b3edb5302d3ba46&quot;,&quot;sha256:2188831b06029f17b7cc1af49296bd7a865861a31afcad65be5ea69f130267fa&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 5 | 0 | 387303 | 305405.5 | 552318.1 | 229298.9 | 744677.8 |
| Model (ms) | 5 | 0 | 303758.9 | 259855.6 | 477082.1 | 176594.9 | 582385.7 |
| Non-model (ms) | 5 | 0 | 70673.26 | 48354.6 | 80133.79 | 42390.56 | 159105.4 |
| Startup (ms) | 5 | 0 | 3410.278 | 3186.708 | 4349.427 | 3159.327 | 4562.706 |
| First byte (ms) | 5 | 0 | 1398.907 | 1327.674 | 1504.206 | 1296.812 | 1583.763 |
| API turns | 5 | 0 | 75 | 56 | 107 | 33 | 120 |
| Input tokens | 5 | 0 | 6240897 | 4236288 | 12128370 | 2208634 | 14573530 |
| Output tokens | 5 | 0 | 54148 | 47606 | 80541 | 35064 | 105116 |
| Cached input (%) | 5 | 0 | 98.5766 | 98.27472 | 99.12206 | 96.87653 | 99.29145 |
| Static cost (USD) | 5 | 0 | 0.06426994 | 0.0520164 | 0.1003623 | 0.03780524 | 0.1219696 |
| Model request count | 5 | 0 | 75 | 56 | 107 | 33 | 120 |
| Within-run median request duration (ms) | 5 | 0 | 2885.587 | 2827.967 | 2898.863 | 2543.366 | 2953.445 |
| Within-run median request wait (ms) | 5 | 0 | 1398.907 | 1327.674 | 1504.206 | 1296.812 | 1583.763 |
| Within-run median request transfer (ms) | 5 | 0 | 1338.928 | 1330.523 | 1393.471 | 1240.022 | 1449.44 |
| Within-run median inter-request gap (ms) | 5 | 0 | 131.4417 | 124.3647 | 150.3627 | 113.4649 | 162.4746 |
| Largest request duration (ms) | 5 | 0 | 36208.48 | 32338.84 | 36402.67 | 25174.76 | 40084.4 |
| Largest inter-request gap (ms) | 5 | 0 | 10312.69 | 9616.033 | 10314.41 | 9397.068 | 33520.93 |
| Time after last model response (ms) | 5 | 0 | 401.0915 | 303.9774 | 2332.151 | 254.4512 | 3666.89 |

#### superjson-error-stack-serialization — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Pass (completed)

Selected attempts: 1. Task identity: \[&quot;superjson-error-stack-serialization&quot;,&quot;f143004734ea2dd4090e45013a07f091f5bbaee7&quot;,&quot;sha256:88ff04f0e414e9530c121a53d121611a5674705f8607366803b0a88cdb253fb7&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 392127.5 | unavailable | unavailable | 392127.5 | 392127.5 |
| Model (ms) | 1 | 0 | 360859.4 | unavailable | unavailable | 360859.4 | 360859.4 |
| Non-model (ms) | 1 | 0 | 28181.02 | unavailable | unavailable | 28181.02 | 28181.02 |
| Startup (ms) | 1 | 0 | 3087.138 | unavailable | unavailable | 3087.138 | 3087.138 |
| First byte (ms) | 1 | 0 | 1391.089 | unavailable | unavailable | 1391.089 | 1391.089 |
| API turns | 1 | 0 | 46 | unavailable | unavailable | 46 | 46 |
| Input tokens | 1 | 0 | 3690073 | unavailable | unavailable | 3690073 | 3690073 |
| Output tokens | 1 | 0 | 74459 | unavailable | unavailable | 74459 | 74459 |
| Cached input (%) | 1 | 0 | 98.5858 | unavailable | unavailable | 98.5858 | 98.5858 |
| Static cost (USD) | 1 | 0 | 0.06341681 | unavailable | unavailable | 0.06341681 | 0.06341681 |
| Model request count | 1 | 0 | 46 | unavailable | unavailable | 46 | 46 |
| Within-run median request duration (ms) | 1 | 0 | 2706.022 | unavailable | unavailable | 2706.022 | 2706.022 |
| Within-run median request wait (ms) | 1 | 0 | 1391.089 | unavailable | unavailable | 1391.089 | 1391.089 |
| Within-run median request transfer (ms) | 1 | 0 | 1289.824 | unavailable | unavailable | 1289.824 | 1289.824 |
| Within-run median inter-request gap (ms) | 1 | 0 | 113.1399 | unavailable | unavailable | 113.1399 | 113.1399 |
| Largest request duration (ms) | 1 | 0 | 73655.29 | unavailable | unavailable | 73655.29 | 73655.29 |
| Largest inter-request gap (ms) | 1 | 0 | 8210.056 | unavailable | unavailable | 8210.056 | 8210.056 |
| Time after last model response (ms) | 1 | 0 | 326.873 | unavailable | unavailable | 326.873 | 326.873 |

#### superjson-error-stack-serialization — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Verification failure (verify_error)

Selected attempts: 4. Task identity: \[&quot;superjson-error-stack-serialization&quot;,&quot;f143004734ea2dd4090e45013a07f091f5bbaee7&quot;,&quot;sha256:88ff04f0e414e9530c121a53d121611a5674705f8607366803b0a88cdb253fb7&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 4 | 0 | 350074.4 | 339649.9 | 360095.6 | 333782.4 | 364753 |
| Model (ms) | 4 | 0 | 321058.9 | 315110.7 | 328964.9 | 312229 | 337719.6 |
| Non-model (ms) | 4 | 0 | 22949.52 | 20908.53 | 25297.49 | 18004.38 | 29122.55 |
| Startup (ms) | 4 | 0 | 3461.454 | 3283.181 | 3576.22 | 3010.967 | 3657.911 |
| First byte (ms) | 4 | 0 | 1339.772 | 1322.587 | 1350.044 | 1299.174 | 1352.72 |
| API turns | 4 | 0 | 40.5 | 38 | 43.75 | 32 | 52 |
| Input tokens | 4 | 0 | 3232615 | 2912774 | 3615179 | 2393502 | 4322619 |
| Output tokens | 4 | 0 | 68229 | 67600.5 | 70007.5 | 66525 | 74533 |
| Cached input (%) | 4 | 0 | 98.37612 | 97.93203 | 98.51214 | 96.91306 | 98.60689 |
| Static cost (USD) | 4 | 0 | 0.0604381 | 0.05858724 | 0.06216218 | 0.05692553 | 0.06344358 |
| Model request count | 4 | 0 | 40.5 | 38 | 43.75 | 32 | 52 |
| Within-run median request duration (ms) | 4 | 0 | 2732.257 | 2665.996 | 2810.149 | 2643.117 | 2867.92 |
| Within-run median request wait (ms) | 4 | 0 | 1339.772 | 1322.587 | 1350.044 | 1299.174 | 1352.72 |
| Within-run median request transfer (ms) | 4 | 0 | 1330.591 | 1226.703 | 1453.661 | 1226.552 | 1511.354 |
| Within-run median inter-request gap (ms) | 4 | 0 | 107.0776 | 106.4025 | 108.5624 | 105.1702 | 112.2243 |
| Largest request duration (ms) | 4 | 0 | 122456.5 | 113283.9 | 125565.8 | 88201.22 | 132458.7 |
| Largest inter-request gap (ms) | 4 | 0 | 8182.139 | 8167.323 | 8193.938 | 8146.605 | 8205.603 |
| Time after last model response (ms) | 4 | 0 | 385.5175 | 353.7714 | 404.0814 | 297.4563 | 420.8493 |

#### textual-richlog-follow-state — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Verification failure (verify_error)

Selected attempts: 5. Task identity: \[&quot;textual-richlog-follow-state&quot;,&quot;a12215b791587a6d94227bd30a0e9291de932106&quot;,&quot;sha256:7579c8a5e4d527a7744c76cef25bf4193db0a7c8230a08b105a307d56b4ccc42&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 5 | 0 | 1678327 | 1110638 | 1739780 | 1079942 | 1948652 |
| Model (ms) | 5 | 0 | 991028.5 | 758611.2 | 1135248 | 742643.8 | 1448253 |
| Non-model (ms) | 5 | 0 | 497068.3 | 348766.5 | 539796.8 | 333933.6 | 745059.8 |
| Startup (ms) | 5 | 0 | 3330.71 | 3282.636 | 3364.203 | 3260.75 | 3691.57 |
| First byte (ms) | 5 | 0 | 1782.343 | 1676.518 | 1796.648 | 1675.329 | 1809.206 |
| API turns | 5 | 0 | 165 | 149 | 198 | 137 | 244 |
| Input tokens | 5 | 0 | 25866490 | 22765500 | 35184890 | 19158630 | 46701040 |
| Output tokens | 5 | 0 | 167750 | 127898 | 186346 | 126109 | 232110 |
| Cached input (%) | 5 | 0 | 99.54279 | 99.44158 | 99.61586 | 99.40319 | 99.64947 |
| Static cost (USD) | 5 | 0 | 0.1956341 | 0.1639342 | 0.2372306 | 0.1499415 | 0.3034329 |
| Model request count | 5 | 0 | 165 | 149 | 198 | 137 | 244 |
| Within-run median request duration (ms) | 5 | 0 | 3590.24 | 3480.039 | 3670.105 | 3447.551 | 4064.269 |
| Within-run median request wait (ms) | 5 | 0 | 1782.343 | 1676.518 | 1796.648 | 1675.329 | 1809.206 |
| Within-run median request transfer (ms) | 5 | 0 | 1770.993 | 1738.228 | 1850.465 | 1554.881 | 2172.01 |
| Within-run median inter-request gap (ms) | 5 | 0 | 135.6701 | 130.3012 | 152.1596 | 129.7614 | 167.3195 |
| Largest request duration (ms) | 5 | 0 | 51317.67 | 40906.31 | 60193.79 | 34104.38 | 79317.45 |
| Largest inter-request gap (ms) | 5 | 0 | 173669.7 | 161193.6 | 180204.1 | 136450.3 | 193632.5 |
| Time after last model response (ms) | 5 | 0 | 371.5718 | 351.786 | 389.324 | 321.7181 | 413.5677 |

#### tomlkit-toml-table-converters — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Pass (completed)

Selected attempts: 4. Task identity: \[&quot;tomlkit-toml-table-converters&quot;,&quot;962de91aaf103135f400e5108a798a59a10dc17e&quot;,&quot;sha256:e9178c316850de3a8e7833234dc90fa1eef1767a348902086083bf1fc2bf2d10&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 4 | 0 | 957799.5 | 789395.9 | 1118878 | 546969.3 | 1339329 |
| Model (ms) | 4 | 0 | 899199.8 | 730465.1 | 1048088 | 505425.9 | 1213588 |
| Non-model (ms) | 4 | 0 | 55334.41 | 46479.97 | 76769.97 | 38274.02 | 122719.3 |
| Startup (ms) | 4 | 0 | 3263.4 | 3198.617 | 3270.27 | 3022.036 | 3273.108 |
| First byte (ms) | 4 | 0 | 1782.96 | 1690.11 | 1840.703 | 1582.64 | 1842.856 |
| API turns | 4 | 0 | 126 | 107.5 | 147.75 | 82 | 183 |
| Input tokens | 4 | 0 | 21818660 | 17358020 | 27866470 | 10218300 | 39767630 |
| Output tokens | 4 | 0 | 164107 | 135288.3 | 188450.3 | 93886 | 216426 |
| Cached input (%) | 4 | 0 | 99.43487 | 99.30923 | 99.49489 | 99.03358 | 99.57364 |
| Static cost (USD) | 4 | 0 | 0.1819425 | 0.1499086 | 0.2169016 | 0.1015031 | 0.2740828 |
| Model request count | 4 | 0 | 126 | 107.5 | 147.75 | 82 | 183 |
| Within-run median request duration (ms) | 4 | 0 | 3338.11 | 3074.148 | 3713.996 | 2875.904 | 4248.008 |
| Within-run median request wait (ms) | 4 | 0 | 1782.96 | 1690.11 | 1840.703 | 1582.64 | 1842.856 |
| Within-run median request transfer (ms) | 4 | 0 | 1450.389 | 1337.836 | 1750.236 | 1253.332 | 2396.619 |
| Within-run median inter-request gap (ms) | 4 | 0 | 123.9527 | 118.7865 | 126.5005 | 110.4585 | 126.9734 |
| Largest request duration (ms) | 4 | 0 | 88484.98 | 73734.2 | 98809.25 | 60172.25 | 99091.66 |
| Largest inter-request gap (ms) | 4 | 0 | 9377.501 | 8481.283 | 10737.56 | 8150.377 | 12459.99 |
| Time after last model response (ms) | 4 | 0 | 308.498 | 263.3416 | 364.9031 | 221.9843 | 440.006 |

#### tomlkit-toml-table-converters — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;tomlkit-toml-table-converters&quot;,&quot;962de91aaf103135f400e5108a798a59a10dc17e&quot;,&quot;sha256:e9178c316850de3a8e7833234dc90fa1eef1767a348902086083bf1fc2bf2d10&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 556726 | unavailable | unavailable | 556726 | 556726 |
| Model (ms) | 1 | 0 | 523150.8 | unavailable | unavailable | 523150.8 | 523150.8 |
| Non-model (ms) | 1 | 0 | 29028.87 | unavailable | unavailable | 29028.87 | 29028.87 |
| Startup (ms) | 1 | 0 | 4546.323 | unavailable | unavailable | 4546.323 | 4546.323 |
| First byte (ms) | 1 | 0 | 1618.606 | unavailable | unavailable | 1618.606 | 1618.606 |
| API turns | 1 | 0 | 68 | unavailable | unavailable | 68 | 68 |
| Input tokens | 1 | 0 | 8209732 | unavailable | unavailable | 8209732 | 8209732 |
| Output tokens | 1 | 0 | 105287 | unavailable | unavailable | 105287 | 105287 |
| Cached input (%) | 1 | 0 | 98.96547 | unavailable | unavailable | 98.96547 | 98.96547 |
| Static cost (USD) | 1 | 0 | 0.1002864 | unavailable | unavailable | 0.1002864 | 0.1002864 |
| Model request count | 1 | 0 | 68 | unavailable | unavailable | 68 | 68 |
| Within-run median request duration (ms) | 1 | 0 | 4104.514 | unavailable | unavailable | 4104.514 | 4104.514 |
| Within-run median request wait (ms) | 1 | 0 | 1618.606 | unavailable | unavailable | 1618.606 | 1618.606 |
| Within-run median request transfer (ms) | 1 | 0 | 2411.725 | unavailable | unavailable | 2411.725 | 2411.725 |
| Within-run median inter-request gap (ms) | 1 | 0 | 119.1269 | unavailable | unavailable | 119.1269 | 119.1269 |
| Largest request duration (ms) | 1 | 0 | 69245.3 | unavailable | unavailable | 69245.3 | 69245.3 |
| Largest inter-request gap (ms) | 1 | 0 | 8169.404 | unavailable | unavailable | 8169.404 | 8169.404 |
| Time after last model response (ms) | 1 | 0 | 203.4005 | unavailable | unavailable | 203.4005 | 203.4005 |

#### true-myth-iterable-collection-combinators — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Pass (completed)

Selected attempts: 3. Task identity: \[&quot;true-myth-iterable-collection-combinators&quot;,&quot;5945ad1b96e228ff716275d8a273282101152508&quot;,&quot;sha256:086b4e313e8a7e239cf0633a12c424025fd640294a9d6b44ebf73664a83c6c28&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 3 | 0 | 444499.5 | 398410 | 464822.4 | 352320.6 | 485145.4 |
| Model (ms) | 3 | 0 | 392395.6 | 353072.7 | 403418 | 313749.7 | 414440.4 |
| Non-model (ms) | 3 | 0 | 48978.5 | 42184.36 | 58489.25 | 35390.22 | 68000 |
| Startup (ms) | 3 | 0 | 3125.391 | 2915.211 | 3152.996 | 2705.032 | 3180.601 |
| First byte (ms) | 3 | 0 | 1660.27 | 1657.129 | 1709.063 | 1653.988 | 1757.857 |
| API turns | 3 | 0 | 47 | 43.5 | 52.5 | 40 | 58 |
| Input tokens | 3 | 0 | 5997006 | 5905269 | 7529033 | 5813531 | 9061059 |
| Output tokens | 3 | 0 | 78002 | 71738 | 81004 | 65474 | 84006 |
| Cached input (%) | 3 | 0 | 98.23629 | 97.8508 | 98.24773 | 97.46531 | 98.25916 |
| Static cost (USD) | 3 | 0 | 0.08374112 | 0.08106365 | 0.09060886 | 0.07838618 | 0.09747659 |
| Model request count | 3 | 0 | 47 | 43.5 | 52.5 | 40 | 58 |
| Within-run median request duration (ms) | 3 | 0 | 3472.615 | 3384.066 | 3541.013 | 3295.516 | 3609.41 |
| Within-run median request wait (ms) | 3 | 0 | 1660.27 | 1657.129 | 1709.063 | 1653.988 | 1757.857 |
| Within-run median request transfer (ms) | 3 | 0 | 1704.119 | 1664.272 | 1839.69 | 1624.425 | 1975.262 |
| Within-run median inter-request gap (ms) | 3 | 0 | 113.7992 | 112.4107 | 124.2825 | 111.0222 | 134.7658 |
| Largest request duration (ms) | 3 | 0 | 74583.59 | 59913.39 | 80114.22 | 45243.18 | 85644.86 |
| Largest inter-request gap (ms) | 3 | 0 | 8201.057 | 8194.756 | 14287.28 | 8188.454 | 20373.51 |
| Time after last model response (ms) | 3 | 0 | 326.5127 | 297.8475 | 329.2449 | 269.1822 | 331.977 |

#### true-myth-iterable-collection-combinators — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Verification failure (verify_error)

Selected attempts: 2. Task identity: \[&quot;true-myth-iterable-collection-combinators&quot;,&quot;5945ad1b96e228ff716275d8a273282101152508&quot;,&quot;sha256:086b4e313e8a7e239cf0633a12c424025fd640294a9d6b44ebf73664a83c6c28&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 485145.8 | 466489.8 | 503801.7 | 447833.8 | 522457.7 |
| Model (ms) | 2 | 0 | 431565.9 | 416845.1 | 446286.7 | 402124.3 | 461007.6 |
| Non-model (ms) | 2 | 0 | 50823.25 | 46974.72 | 54671.78 | 43126.2 | 58520.31 |
| Startup (ms) | 2 | 0 | 2756.567 | 2669.934 | 2843.199 | 2583.302 | 2929.832 |
| First byte (ms) | 2 | 0 | 1673.701 | 1650.778 | 1696.623 | 1627.856 | 1719.546 |
| API turns | 2 | 0 | 59.5 | 55.25 | 63.75 | 51 | 68 |
| Input tokens | 2 | 0 | 9299805 | 8731548 | 9868061 | 8163291 | 10436320 |
| Output tokens | 2 | 0 | 88939 | 84518.5 | 93359.5 | 80098 | 97780 |
| Cached input (%) | 2 | 0 | 98.36016 | 98.19012 | 98.53021 | 98.02008 | 98.70025 |
| Static cost (USD) | 2 | 0 | 0.1031124 | 0.09971011 | 0.1065146 | 0.09630784 | 0.1099169 |
| Model request count | 2 | 0 | 59.5 | 55.25 | 63.75 | 51 | 68 |
| Within-run median request duration (ms) | 2 | 0 | 3244.43 | 3214.697 | 3274.164 | 3184.964 | 3303.897 |
| Within-run median request wait (ms) | 2 | 0 | 1673.701 | 1650.778 | 1696.623 | 1627.856 | 1719.546 |
| Within-run median request transfer (ms) | 2 | 0 | 1655.468 | 1649.522 | 1661.414 | 1643.576 | 1667.36 |
| Within-run median inter-request gap (ms) | 2 | 0 | 113.3036 | 111.38 | 115.2273 | 109.4563 | 117.1509 |
| Largest request duration (ms) | 2 | 0 | 52331.41 | 45672.94 | 58989.88 | 39014.47 | 65648.35 |
| Largest inter-request gap (ms) | 2 | 0 | 8153.536 | 8141.934 | 8165.139 | 8130.331 | 8176.742 |
| Time after last model response (ms) | 2 | 0 | 481.6156 | 468.4798 | 494.7514 | 455.344 | 507.8872 |

#### cattrs-partial-structuring-recovery — pi @ 0.73.1 — Pass (completed)

Selected attempts: 2. Task identity: \[&quot;cattrs-partial-structuring-recovery&quot;,&quot;91df27b2a20f26c35777a92f4555438b62c06345&quot;,&quot;sha256:e66b78a8b7598a3f4a549cd39bd05817e5ae8aea24031e24c424c8507a7bbb09&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 705434.5 | 690404.3 | 720464.6 | 675374.2 | 735494.7 |
| Model (ms) | 2 | 0 | 514758.3 | 508071.8 | 521444.8 | 501385.2 | 528131.3 |
| Non-model (ms) | 2 | 0 | 190076 | 181738.3 | 198413.6 | 173400.7 | 206751.2 |
| Startup (ms) | 2 | 0 | 600.2406 | 594.2475 | 606.2337 | 588.2544 | 612.2268 |
| First byte (ms) | 2 | 0 | 1458.969 | 1456.631 | 1461.306 | 1454.293 | 1463.644 |
| API turns | 2 | 0 | 112.5 | 111.25 | 113.75 | 110 | 115 |
| Input tokens | 2 | 0 | 10675700 | 10498510 | 10852890 | 10321310 | 11030080 |
| Output tokens | 2 | 0 | 90400.5 | 88312.75 | 92488.25 | 86225 | 94576 |
| Cached input (%) | 2 | 0 | 98.4904 | 98.46002 | 98.52077 | 98.42965 | 98.55114 |
| Static cost (USD) | 2 | 0 | 0.1099264 | 0.1091218 | 0.1107309 | 0.1083173 | 0.1115354 |
| Model request count | 2 | 0 | 112.5 | 111.25 | 113.75 | 110 | 115 |
| Within-run median request duration (ms) | 2 | 0 | 2959.294 | 2824.533 | 3094.055 | 2689.772 | 3228.816 |
| Within-run median request wait (ms) | 2 | 0 | 1458.969 | 1456.631 | 1461.306 | 1454.293 | 1463.644 |
| Within-run median request transfer (ms) | 2 | 0 | 1462.175 | 1344.888 | 1579.463 | 1227.6 | 1696.751 |
| Within-run median inter-request gap (ms) | 2 | 0 | 33.55353 | 32.90988 | 34.19718 | 32.26623 | 34.84083 |
| Largest request duration (ms) | 2 | 0 | 39016.96 | 38789.1 | 39244.83 | 38561.23 | 39472.69 |
| Largest inter-request gap (ms) | 2 | 0 | 46466.8 | 45820.34 | 47113.26 | 45173.89 | 47759.72 |
| Time after last model response (ms) | 2 | 0 | 485.721 | 466.079 | 505.363 | 446.437 | 525.005 |

#### cattrs-partial-structuring-recovery — pi @ 0.73.1 — Verification failure (verify_error)

Selected attempts: 3. Task identity: \[&quot;cattrs-partial-structuring-recovery&quot;,&quot;91df27b2a20f26c35777a92f4555438b62c06345&quot;,&quot;sha256:e66b78a8b7598a3f4a549cd39bd05817e5ae8aea24031e24c424c8507a7bbb09&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 3 | 0 | 908204.5 | 748145.1 | 986084.9 | 588085.7 | 1063965 |
| Model (ms) | 3 | 0 | 595063.8 | 515103.4 | 655445.9 | 435142.9 | 715827.9 |
| Non-model (ms) | 3 | 0 | 312549.3 | 232457.2 | 330062.2 | 152365.1 | 347575.1 |
| Startup (ms) | 3 | 0 | 577.6368 | 569.9704 | 584.4984 | 562.3039 | 591.36 |
| First byte (ms) | 3 | 0 | 1551.444 | 1491.815 | 1585.248 | 1432.186 | 1619.052 |
| API turns | 3 | 0 | 125 | 108 | 139.5 | 91 | 154 |
| Input tokens | 3 | 0 | 13405680 | 10876770 | 15811030 | 8347853 | 18216390 |
| Output tokens | 3 | 0 | 100551 | 90878 | 110835 | 81205 | 121119 |
| Cached input (%) | 3 | 0 | 98.6863 | 98.43649 | 98.76503 | 98.18668 | 98.84376 |
| Static cost (USD) | 3 | 0 | 0.1264358 | 0.1112271 | 0.1423591 | 0.09601839 | 0.1582824 |
| Model request count | 3 | 0 | 125 | 108 | 139.5 | 91 | 154 |
| Within-run median request duration (ms) | 3 | 0 | 2910.69 | 2887.387 | 2974.804 | 2864.084 | 3038.918 |
| Within-run median request wait (ms) | 3 | 0 | 1551.444 | 1491.815 | 1585.248 | 1432.186 | 1619.052 |
| Within-run median request transfer (ms) | 3 | 0 | 1400.672 | 1359.073 | 1428.335 | 1317.474 | 1455.997 |
| Within-run median inter-request gap (ms) | 3 | 0 | 33.45383 | 30.3149 | 38.32951 | 27.17596 | 43.20519 |
| Largest request duration (ms) | 3 | 0 | 38028.38 | 36487.8 | 45577.77 | 34947.22 | 53127.15 |
| Largest inter-request gap (ms) | 3 | 0 | 45254.98 | 42975.53 | 45607.55 | 40696.07 | 45960.11 |
| Time after last model response (ms) | 3 | 0 | 433.2142 | 423.8693 | 439.4858 | 414.5245 | 445.7575 |

#### happy-dom-deterministic-intersectionobserver — pi @ 0.73.1 — Verification failure (verify_error)

Selected attempts: 5. Task identity: \[&quot;happy-dom-deterministic-intersectionobserver&quot;,&quot;32b2a8e60eab482c023af377160bf294d6da0318&quot;,&quot;sha256:dbaaeeb69f2afcd8b53865d8c0ad3f0e4b0a4a3db2ef6590890ea5419d17e7db&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 5 | 0 | 656085 | 644389.3 | 660170.3 | 544802.4 | 690642.9 |
| Model (ms) | 5 | 0 | 436932.1 | 382974.7 | 491628 | 380646.9 | 512055.5 |
| Non-model (ms) | 5 | 0 | 177749.8 | 163631.4 | 222375.8 | 161023.9 | 262935.3 |
| Startup (ms) | 5 | 0 | 825.6945 | 807.1143 | 837.5686 | 803.7487 | 862.481 |
| First byte (ms) | 5 | 0 | 1355.076 | 1298.93 | 1355.733 | 1265.365 | 1427.346 |
| API turns | 5 | 0 | 95 | 93 | 97 | 88 | 109 |
| Input tokens | 5 | 0 | 6179527 | 5779160 | 6609470 | 5143491 | 8215988 |
| Output tokens | 5 | 0 | 75692 | 69126 | 85084 | 68657 | 95726 |
| Cached input (%) | 5 | 0 | 97.89642 | 97.7216 | 97.946 | 97.41306 | 99.1524 |
| Static cost (USD) | 5 | 0 | 0.08306246 | 0.07618435 | 0.09301554 | 0.06601373 | 0.1068907 |
| Model request count | 5 | 0 | 95 | 93 | 97 | 88 | 109 |
| Within-run median request duration (ms) | 5 | 0 | 2561.744 | 2417.534 | 2721.453 | 2416.598 | 3023.839 |
| Within-run median request wait (ms) | 5 | 0 | 1355.076 | 1298.93 | 1355.733 | 1265.365 | 1427.346 |
| Within-run median request transfer (ms) | 5 | 0 | 1168.808 | 1148.967 | 1223.013 | 1107.993 | 1533.088 |
| Within-run median inter-request gap (ms) | 5 | 0 | 49.09735 | 37.24717 | 88.13629 | 36.37431 | 97.8281 |
| Largest request duration (ms) | 5 | 0 | 32385.73 | 30727.59 | 40688.17 | 25331.18 | 41102.9 |
| Largest inter-request gap (ms) | 5 | 0 | 70317.61 | 25927.24 | 70345.72 | 25604.15 | 70699.17 |
| Time after last model response (ms) | 5 | 0 | 455.3764 | 440.8191 | 607.1031 | 413.5847 | 682.3177 |

#### ink-grid-box-layout — pi @ 0.73.1 — Pass (completed)

Selected attempts: 1. Task identity: \[&quot;ink-grid-box-layout&quot;,&quot;477fda7df7781406d2ba046eb48dd5391e964b72&quot;,&quot;sha256:78f1b7f720e76802674405c9c7f39f7b24a1d885076f9a640e4ea5a9066db276&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 1170764 | unavailable | unavailable | 1170764 | 1170764 |
| Model (ms) | 1 | 0 | 634863.5 | unavailable | unavailable | 634863.5 | 634863.5 |
| Non-model (ms) | 1 | 0 | 535089.6 | unavailable | unavailable | 535089.6 | 535089.6 |
| Startup (ms) | 1 | 0 | 810.9963 | unavailable | unavailable | 810.9963 | 810.9963 |
| First byte (ms) | 1 | 0 | 1458.839 | unavailable | unavailable | 1458.839 | 1458.839 |
| API turns | 1 | 0 | 135 | unavailable | unavailable | 135 | 135 |
| Input tokens | 1 | 0 | 14049190 | unavailable | unavailable | 14049190 | 14049190 |
| Output tokens | 1 | 0 | 109167 | unavailable | unavailable | 109167 | 109167 |
| Cached input (%) | 1 | 0 | 98.53469 | unavailable | unavailable | 98.53469 | 98.53469 |
| Static cost (USD) | 1 | 0 | 0.1379098 | unavailable | unavailable | 0.1379098 | 0.1379098 |
| Model request count | 1 | 0 | 135 | unavailable | unavailable | 135 | 135 |
| Within-run median request duration (ms) | 1 | 0 | 2615.84 | unavailable | unavailable | 2615.84 | 2615.84 |
| Within-run median request wait (ms) | 1 | 0 | 1458.839 | unavailable | unavailable | 1458.839 | 1458.839 |
| Within-run median request transfer (ms) | 1 | 0 | 1014.741 | unavailable | unavailable | 1014.741 | 1014.741 |
| Within-run median inter-request gap (ms) | 1 | 0 | 29.15435 | unavailable | unavailable | 29.15435 | 29.15435 |
| Largest request duration (ms) | 1 | 0 | 55433.15 | unavailable | unavailable | 55433.15 | 55433.15 |
| Largest inter-request gap (ms) | 1 | 0 | 76013.59 | unavailable | unavailable | 76013.59 | 76013.59 |
| Time after last model response (ms) | 1 | 0 | 595.3515 | unavailable | unavailable | 595.3515 | 595.3515 |

#### ink-grid-box-layout — pi @ 0.73.1 — Verification failure (verify_error)

Selected attempts: 3. Task identity: \[&quot;ink-grid-box-layout&quot;,&quot;477fda7df7781406d2ba046eb48dd5391e964b72&quot;,&quot;sha256:78f1b7f720e76802674405c9c7f39f7b24a1d885076f9a640e4ea5a9066db276&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 3 | 0 | 1098816 | 894417.5 | 1393408 | 690018.6 | 1687999 |
| Model (ms) | 3 | 0 | 594712 | 543160 | 865449.9 | 491608.1 | 1136188 |
| Non-model (ms) | 3 | 0 | 503266.1 | 350394 | 527129.4 | 197521.9 | 550992.7 |
| Startup (ms) | 3 | 0 | 838.1707 | 828.3383 | 863.4003 | 818.5058 | 888.6298 |
| First byte (ms) | 3 | 0 | 1403.607 | 1403.295 | 1436.507 | 1402.983 | 1469.408 |
| API turns | 3 | 0 | 112 | 96 | 119.5 | 80 | 127 |
| Input tokens | 3 | 0 | 10066670 | 8438336 | 11070910 | 6809998 | 12075150 |
| Output tokens | 3 | 0 | 91730 | 91216.5 | 99803.5 | 90703 | 107877 |
| Cached input (%) | 3 | 0 | 98.32174 | 98.06403 | 98.36314 | 97.80631 | 98.40453 |
| Static cost (USD) | 3 | 0 | 0.1100729 | 0.1034425 | 0.1196724 | 0.09681212 | 0.1292719 |
| Model request count | 3 | 0 | 112 | 96 | 119.5 | 80 | 127 |
| Within-run median request duration (ms) | 3 | 0 | 2776.856 | 2742.335 | 2853.653 | 2707.813 | 2930.449 |
| Within-run median request wait (ms) | 3 | 0 | 1403.607 | 1403.295 | 1436.507 | 1402.983 | 1469.408 |
| Within-run median request transfer (ms) | 3 | 0 | 1270.949 | 1225.99 | 1402.962 | 1181.032 | 1534.975 |
| Within-run median inter-request gap (ms) | 3 | 0 | 34.22125 | 32.7323 | 35.41898 | 31.24335 | 36.61671 |
| Largest request duration (ms) | 3 | 0 | 46982.53 | 41035.74 | 327735 | 35088.96 | 608487.4 |
| Largest inter-request gap (ms) | 3 | 0 | 77308.11 | 76825.13 | 108869.6 | 76342.15 | 140431.1 |
| Time after last model response (ms) | 3 | 0 | 544.1231 | 514.1718 | 547.9291 | 484.2205 | 551.735 |

#### psd-tools-blend-range-api — pi @ 0.73.1 — Pass (completed)

Selected attempts: 5. Task identity: \[&quot;psd-tools-blend-range-api&quot;,&quot;01595992c5f4d4695251fdf58b3edb5302d3ba46&quot;,&quot;sha256:2188831b06029f17b7cc1af49296bd7a865861a31afcad65be5ea69f130267fa&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 5 | 0 | 500474.6 | 472692.8 | 519307.1 | 457601.1 | 527673.3 |
| Model (ms) | 5 | 0 | 408381.2 | 407600.7 | 440480.1 | 379531.3 | 443538.7 |
| Non-model (ms) | 5 | 0 | 77488.84 | 63647.9 | 78232 | 56341.08 | 119455.3 |
| Startup (ms) | 5 | 0 | 594.9897 | 594.8337 | 617.32 | 580.9398 | 663.7242 |
| First byte (ms) | 5 | 0 | 1383.863 | 1370.879 | 1384.908 | 1315.057 | 1416.677 |
| API turns | 5 | 0 | 90 | 90 | 101 | 88 | 102 |
| Input tokens | 5 | 0 | 7568856 | 7353608 | 7982669 | 6476043 | 8471431 |
| Output tokens | 5 | 0 | 75576 | 73564 | 79705 | 66975 | 82736 |
| Cached input (%) | 5 | 0 | 98.09389 | 97.99564 | 98.09611 | 97.99149 | 98.10983 |
| Static cost (USD) | 5 | 0 | 0.08801112 | 0.08787538 | 0.09694648 | 0.07869417 | 0.09715856 |
| Model request count | 5 | 0 | 90 | 90 | 101 | 88 | 102 |
| Within-run median request duration (ms) | 5 | 0 | 2630.329 | 2485.729 | 2958.686 | 2434.636 | 3201.504 |
| Within-run median request wait (ms) | 5 | 0 | 1383.863 | 1370.879 | 1384.908 | 1315.057 | 1416.677 |
| Within-run median request transfer (ms) | 5 | 0 | 1172.392 | 1088.55 | 1596.766 | 1064.988 | 1628.195 |
| Within-run median inter-request gap (ms) | 5 | 0 | 47.40158 | 39.73679 | 48.2425 | 31.98112 | 72.91004 |
| Largest request duration (ms) | 5 | 0 | 30219.2 | 29692.68 | 33391.77 | 23657.16 | 37692.39 |
| Largest inter-request gap (ms) | 5 | 0 | 18007.76 | 9773.71 | 18259.23 | 8053.747 | 22578.11 |
| Time after last model response (ms) | 5 | 0 | 439.6784 | 359.8482 | 440.9998 | 247.2666 | 478.2358 |

#### superjson-error-stack-serialization — pi @ 0.73.1 — Verification failure (verify_error)

Selected attempts: 5. Task identity: \[&quot;superjson-error-stack-serialization&quot;,&quot;f143004734ea2dd4090e45013a07f091f5bbaee7&quot;,&quot;sha256:88ff04f0e414e9530c121a53d121611a5674705f8607366803b0a88cdb253fb7&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 5 | 0 | 101627.7 | 82076.29 | 127321.2 | 79927.81 | 456875.1 |
| Model (ms) | 5 | 0 | 100091.1 | 80516.03 | 125409.4 | 78238.57 | 434668.4 |
| Non-model (ms) | 5 | 0 | 803.8732 | 676.2482 | 835.9491 | 669.0043 | 21298.36 |
| Startup (ms) | 5 | 0 | 891.2574 | 885.3605 | 908.3479 | 860.351 | 1075.797 |
| First byte (ms) | 5 | 0 | 946.8581 | 902.5019 | 951.3177 | 884.8596 | 1391.66 |
| API turns | 5 | 0 | 9 | 7 | 10 | 7 | 70 |
| Input tokens | 5 | 0 | 87314 | 69424 | 114943 | 55833 | 4826104 |
| Output tokens | 5 | 0 | 22487 | 18572 | 27432 | 17162 | 86782 |
| Cached input (%) | 5 | 0 | 87.22542 | 83.52155 | 88.53084 | 81.38556 | 97.22592 |
| Static cost (USD) | 5 | 0 | 0.01539378 | 0.01303315 | 0.01874193 | 0.01199247 | 0.08622787 |
| Model request count | 5 | 0 | 9 | 7 | 10 | 7 | 70 |
| Within-run median request duration (ms) | 5 | 0 | 1509.326 | 1433.333 | 1569.232 | 1347.941 | 2852.139 |
| Within-run median request wait (ms) | 5 | 0 | 946.8581 | 902.5019 | 951.3177 | 884.8596 | 1391.66 |
| Within-run median request transfer (ms) | 5 | 0 | 618.2682 | 592.0135 | 656.1662 | 509.5441 | 1519.049 |
| Within-run median inter-request gap (ms) | 5 | 0 | 22.076 | 21.87098 | 29.27358 | 19.46683 | 35.2699 |
| Largest request duration (ms) | 5 | 0 | 69167.32 | 68724.39 | 69972.78 | 67166.27 | 71233.8 |
| Largest inter-request gap (ms) | 5 | 0 | 71.14167 | 63.23133 | 76.49571 | 57.05154 | 1875.938 |
| Time after last model response (ms) | 5 | 0 | 481.0099 | 451.2884 | 598.1746 | 334.4554 | 629.4586 |

#### textual-richlog-follow-state — pi @ 0.73.1 — Pass (completed)

Selected attempts: 1. Task identity: \[&quot;textual-richlog-follow-state&quot;,&quot;a12215b791587a6d94227bd30a0e9291de932106&quot;,&quot;sha256:7579c8a5e4d527a7744c76cef25bf4193db0a7c8230a08b105a307d56b4ccc42&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 952767.9 | unavailable | unavailable | 952767.9 | 952767.9 |
| Model (ms) | 1 | 0 | 543819.9 | unavailable | unavailable | 543819.9 | 543819.9 |
| Non-model (ms) | 1 | 0 | 408351.7 | unavailable | unavailable | 408351.7 | 408351.7 |
| Startup (ms) | 1 | 0 | 596.2403 | unavailable | unavailable | 596.2403 | 596.2403 |
| First byte (ms) | 1 | 0 | 1417.982 | unavailable | unavailable | 1417.982 | 1417.982 |
| API turns | 1 | 0 | 114 | unavailable | unavailable | 114 | 114 |
| Input tokens | 1 | 0 | 9362739 | unavailable | unavailable | 9362739 | 9362739 |
| Output tokens | 1 | 0 | 97800 | unavailable | unavailable | 97800 | 97800 |
| Cached input (%) | 1 | 0 | 98.18529 | unavailable | unavailable | 98.18529 | 98.18529 |
| Static cost (USD) | 1 | 0 | 0.1117445 | unavailable | unavailable | 0.1117445 | 0.1117445 |
| Model request count | 1 | 0 | 114 | unavailable | unavailable | 114 | 114 |
| Within-run median request duration (ms) | 1 | 0 | 3063.6 | unavailable | unavailable | 3063.6 | 3063.6 |
| Within-run median request wait (ms) | 1 | 0 | 1417.982 | unavailable | unavailable | 1417.982 | 1417.982 |
| Within-run median request transfer (ms) | 1 | 0 | 1627.032 | unavailable | unavailable | 1627.032 | 1627.032 |
| Within-run median inter-request gap (ms) | 1 | 0 | 56.90112 | unavailable | unavailable | 56.90112 | 56.90112 |
| Largest request duration (ms) | 1 | 0 | 28636.23 | unavailable | unavailable | 28636.23 | 28636.23 |
| Largest inter-request gap (ms) | 1 | 0 | 182785.6 | unavailable | unavailable | 182785.6 | 182785.6 |
| Time after last model response (ms) | 1 | 0 | 366.6118 | unavailable | unavailable | 366.6118 | 366.6118 |

#### textual-richlog-follow-state — pi @ 0.73.1 — Verification failure (verify_error)

Selected attempts: 4. Task identity: \[&quot;textual-richlog-follow-state&quot;,&quot;a12215b791587a6d94227bd30a0e9291de932106&quot;,&quot;sha256:7579c8a5e4d527a7744c76cef25bf4193db0a7c8230a08b105a307d56b4ccc42&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 4 | 0 | 1035334 | 1013153 | 1087932 | 989058.5 | 1203274 |
| Model (ms) | 4 | 0 | 607874.6 | 598722.2 | 617506.7 | 578675.6 | 638992.3 |
| Non-model (ms) | 4 | 0 | 410027.2 | 409802 | 456991.1 | 409790.2 | 597219 |
| Startup (ms) | 4 | 0 | 621.8121 | 592.2714 | 659.6805 | 591.2294 | 685.7053 |
| First byte (ms) | 4 | 0 | 1463.818 | 1433.075 | 1476.645 | 1375.035 | 1480.934 |
| API turns | 4 | 0 | 127 | 122 | 133.5 | 119 | 141 |
| Input tokens | 4 | 0 | 11553180 | 10898300 | 12473750 | 10223850 | 13945230 |
| Output tokens | 4 | 0 | 111661.5 | 107573 | 113748.5 | 100910 | 114407 |
| Cached input (%) | 4 | 0 | 98.35087 | 98.30041 | 98.41855 | 98.17234 | 98.59827 |
| Static cost (USD) | 4 | 0 | 0.127267 | 0.1252659 | 0.1313104 | 0.1240159 | 0.1386878 |
| Model request count | 4 | 0 | 127 | 122 | 133.5 | 119 | 141 |
| Within-run median request duration (ms) | 4 | 0 | 2991.785 | 2923.382 | 3078.107 | 2808.727 | 3246.517 |
| Within-run median request wait (ms) | 4 | 0 | 1463.818 | 1433.075 | 1476.645 | 1375.035 | 1480.934 |
| Within-run median request transfer (ms) | 4 | 0 | 1591.897 | 1515.633 | 1601.402 | 1302.846 | 1613.912 |
| Within-run median inter-request gap (ms) | 4 | 0 | 39.71574 | 39.09541 | 47.8822 | 37.90856 | 71.70744 |
| Largest request duration (ms) | 4 | 0 | 37481.35 | 29554.47 | 44512.57 | 19152.8 | 52227.29 |
| Largest inter-request gap (ms) | 4 | 0 | 183351.9 | 183061.8 | 184283.9 | 182987.4 | 186283.6 |
| Time after last model response (ms) | 4 | 0 | 478.0787 | 447.6035 | 483.8203 | 372.4327 | 484.79 |

#### tomlkit-toml-table-converters — pi @ 0.73.1 — Pass (completed)

Selected attempts: 4. Task identity: \[&quot;tomlkit-toml-table-converters&quot;,&quot;962de91aaf103135f400e5108a798a59a10dc17e&quot;,&quot;sha256:e9178c316850de3a8e7833234dc90fa1eef1767a348902086083bf1fc2bf2d10&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 4 | 0 | 781295 | 723772.5 | 881781.4 | 712260.9 | 1022185 |
| Model (ms) | 4 | 0 | 740832 | 678288.9 | 845881.8 | 677844.2 | 973846.8 |
| Non-model (ms) | 4 | 0 | 40771.9 | 33109.24 | 47962.73 | 31139.66 | 48516.83 |
| Startup (ms) | 4 | 0 | 632.3818 | 600.3436 | 652.1687 | 559.9965 | 655.7619 |
| First byte (ms) | 4 | 0 | 1518.504 | 1481.127 | 1577.477 | 1461.516 | 1661.873 |
| API turns | 4 | 0 | 144.5 | 138 | 154.25 | 129 | 173 |
| Input tokens | 4 | 0 | 16964100 | 15556340 | 19472070 | 13881150 | 24447850 |
| Output tokens | 4 | 0 | 137309 | 127307.3 | 153325.3 | 124062 | 174614 |
| Cached input (%) | 4 | 0 | 98.76088 | 98.73361 | 98.79622 | 98.65974 | 98.89431 |
| Static cost (USD) | 4 | 0 | 0.1628766 | 0.1506541 | 0.1846292 | 0.1460252 | 0.2178487 |
| Model request count | 4 | 0 | 144.5 | 138 | 154.25 | 129 | 173 |
| Within-run median request duration (ms) | 4 | 0 | 3379.633 | 3214.159 | 3483.373 | 2987.167 | 3525.168 |
| Within-run median request wait (ms) | 4 | 0 | 1518.504 | 1481.127 | 1577.477 | 1461.516 | 1661.873 |
| Within-run median request transfer (ms) | 4 | 0 | 1784.163 | 1669.908 | 1887.748 | 1462.969 | 2062.679 |
| Within-run median inter-request gap (ms) | 4 | 0 | 53.27363 | 50.48543 | 55.13003 | 46.5859 | 56.23417 |
| Largest request duration (ms) | 4 | 0 | 44516.54 | 42441.97 | 49177.88 | 38570.21 | 60809.95 |
| Largest inter-request gap (ms) | 4 | 0 | 8038.992 | 7794.682 | 10086.02 | 7783.573 | 15505.29 |
| Time after last model response (ms) | 4 | 0 | 455.7021 | 437.8049 | 477.3832 | 437.0238 | 489.5157 |

#### tomlkit-toml-table-converters — pi @ 0.73.1 — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;tomlkit-toml-table-converters&quot;,&quot;962de91aaf103135f400e5108a798a59a10dc17e&quot;,&quot;sha256:e9178c316850de3a8e7833234dc90fa1eef1767a348902086083bf1fc2bf2d10&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 183519.2 | unavailable | unavailable | 183519.2 | 183519.2 |
| Model (ms) | 1 | 0 | 179892.7 | unavailable | unavailable | 179892.7 | 179892.7 |
| Non-model (ms) | 1 | 0 | 2845.447 | unavailable | unavailable | 2845.447 | 2845.447 |
| Startup (ms) | 1 | 0 | 780.9992 | unavailable | unavailable | 780.9992 | 780.9992 |
| First byte (ms) | 1 | 0 | 1212.032 | unavailable | unavailable | 1212.032 | 1212.032 |
| API turns | 1 | 0 | 20 | unavailable | unavailable | 20 | 20 |
| Input tokens | 1 | 0 | 628465 | unavailable | unavailable | 628465 | 628465 |
| Output tokens | 1 | 0 | 38297 | unavailable | unavailable | 38297 | 38297 |
| Cached input (%) | 1 | 0 | 94.64584 | unavailable | unavailable | 94.64584 | 94.64584 |
| Static cost (USD) | 1 | 0 | 0.02981 | unavailable | unavailable | 0.02981 | 0.02981 |
| Model request count | 1 | 0 | 20 | unavailable | unavailable | 20 | 20 |
| Within-run median request duration (ms) | 1 | 0 | 2374.967 | unavailable | unavailable | 2374.967 | 2374.967 |
| Within-run median request wait (ms) | 1 | 0 | 1212.032 | unavailable | unavailable | 1212.032 | 1212.032 |
| Within-run median request transfer (ms) | 1 | 0 | 1014.578 | unavailable | unavailable | 1014.578 | 1014.578 |
| Within-run median inter-request gap (ms) | 1 | 0 | 40.07271 | unavailable | unavailable | 40.07271 | 40.07271 |
| Largest request duration (ms) | 1 | 0 | 67841.38 | unavailable | unavailable | 67841.38 | 67841.38 |
| Largest inter-request gap (ms) | 1 | 0 | 703.7486 | unavailable | unavailable | 703.7486 | 703.7486 |
| Time after last model response (ms) | 1 | 0 | 870.2448 | unavailable | unavailable | 870.2448 | 870.2448 |

#### true-myth-iterable-collection-combinators — pi @ 0.73.1 — Pass (completed)

Selected attempts: 5. Task identity: \[&quot;true-myth-iterable-collection-combinators&quot;,&quot;5945ad1b96e228ff716275d8a273282101152508&quot;,&quot;sha256:086b4e313e8a7e239cf0633a12c424025fd640294a9d6b44ebf73664a83c6c28&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 5 | 0 | 501884.6 | 484258.4 | 571790.6 | 436378.1 | 583856.7 |
| Model (ms) | 5 | 0 | 440975.6 | 384588.2 | 475551.2 | 373025.4 | 507147.8 |
| Non-model (ms) | 5 | 0 | 75936.26 | 60271.28 | 95591.79 | 51131.24 | 110648.6 |
| Startup (ms) | 5 | 0 | 647.6073 | 637.7288 | 658.6845 | 584.3345 | 772.6828 |
| First byte (ms) | 5 | 0 | 1554.233 | 1522.857 | 1569.942 | 1502.094 | 1581.08 |
| API turns | 5 | 0 | 77 | 69 | 81 | 59 | 95 |
| Input tokens | 5 | 0 | 9401480 | 8286176 | 9964461 | 6986112 | 12980110 |
| Output tokens | 5 | 0 | 88845 | 80385 | 96467 | 77408 | 100324 |
| Cached input (%) | 5 | 0 | 97.92889 | 97.85176 | 97.97674 | 97.31582 | 98.22388 |
| Static cost (USD) | 5 | 0 | 0.1094732 | 0.09675478 | 0.1192406 | 0.09653088 | 0.1330244 |
| Model request count | 5 | 0 | 77 | 69 | 81 | 59 | 95 |
| Within-run median request duration (ms) | 5 | 0 | 2995.055 | 2943.785 | 3372.939 | 2546.263 | 3517.923 |
| Within-run median request wait (ms) | 5 | 0 | 1554.233 | 1522.857 | 1569.942 | 1502.094 | 1581.08 |
| Within-run median request transfer (ms) | 5 | 0 | 1441.123 | 1405.63 | 1700.906 | 920.4009 | 1793.608 |
| Within-run median inter-request gap (ms) | 5 | 0 | 36.04196 | 33.27092 | 36.11871 | 33.21835 | 39.71612 |
| Largest request duration (ms) | 5 | 0 | 42949.19 | 38901.77 | 49658.42 | 28266.85 | 51522.31 |
| Largest inter-request gap (ms) | 5 | 0 | 20062.61 | 20043.5 | 30037.1 | 15056.15 | 78002.16 |
| Time after last model response (ms) | 5 | 0 | 475.0467 | 469.3855 | 567.761 | 422.6338 | 578.1885 |

#### cattrs-partial-structuring-recovery — qwen @ 0.22.2 — Pass (completed)

Selected attempts: 3. Task identity: \[&quot;cattrs-partial-structuring-recovery&quot;,&quot;91df27b2a20f26c35777a92f4555438b62c06345&quot;,&quot;sha256:e66b78a8b7598a3f4a549cd39bd05817e5ae8aea24031e24c424c8507a7bbb09&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 3 | 0 | 511318.3 | 500801.8 | 526896.6 | 490285.2 | 542474.8 |
| Model (ms) | 3 | 0 | 394768.2 | 381966.9 | 427981.2 | 369165.6 | 461194.2 |
| Non-model (ms) | 3 | 0 | 140719.6 | 84245.05 | 143391.7 | 27770.53 | 146063.9 |
| Startup (ms) | 3 | 0 | 1433.163 | 1376.863 | 1537.99 | 1320.562 | 1642.817 |
| First byte (ms) | 3 | 0 | 1551.468 | 1535.869 | 1572.029 | 1520.271 | 1592.591 |
| API turns | 3 | 0 | 70 | 70 | 72 | 70 | 74 |
| Input tokens | 3 | 0 | 7611916 | 7597905 | 8391659 | 7583893 | 9171402 |
| Output tokens | 3 | 0 | 75226 | 71147 | 77786 | 67068 | 80346 |
| Cached input (%) | 3 | 0 | 99.01666 | 98.93231 | 99.0719 | 98.84796 | 99.12714 |
| Static cost (USD) | 3 | 0 | 0.08086207 | 0.07679275 | 0.08492061 | 0.07272344 | 0.08897915 |
| Model request count | 3 | 0 | 70 | 70 | 72 | 70 | 74 |
| Within-run median request duration (ms) | 3 | 0 | 2897.247 | 2856.522 | 3086.498 | 2815.798 | 3275.748 |
| Within-run median request wait (ms) | 3 | 0 | 1551.468 | 1535.869 | 1572.029 | 1520.271 | 1592.591 |
| Within-run median request transfer (ms) | 3 | 0 | 1315.704 | 1287.986 | 1452.532 | 1260.268 | 1589.36 |
| Within-run median inter-request gap (ms) | 3 | 0 | 59.29938 | 57.4721 | 60.09783 | 55.64483 | 60.89629 |
| Largest request duration (ms) | 3 | 0 | 64310.98 | 58520.7 | 91273.95 | 52730.42 | 118236.9 |
| Largest inter-request gap (ms) | 3 | 0 | 41790.93 | 24491.32 | 43704.57 | 7191.702 | 45618.21 |
| Time after last model response (ms) | 3 | 0 | 328.441 | 324.8836 | 350.917 | 321.3262 | 373.3929 |

#### happy-dom-deterministic-intersectionobserver — qwen @ 0.22.2 — Verification failure (verify_error)

Selected attempts: 2. Task identity: \[&quot;happy-dom-deterministic-intersectionobserver&quot;,&quot;32b2a8e60eab482c023af377160bf294d6da0318&quot;,&quot;sha256:dbaaeeb69f2afcd8b53865d8c0ad3f0e4b0a4a3db2ef6590890ea5419d17e7db&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 493650.2 | 480508.7 | 506791.7 | 467367.2 | 519933.2 |
| Model (ms) | 2 | 0 | 419419.5 | 419320.7 | 419518.2 | 419222 | 419616.9 |
| Non-model (ms) | 2 | 0 | 72325.31 | 59256.86 | 85393.75 | 46188.42 | 98462.19 |
| Startup (ms) | 2 | 0 | 1905.469 | 1879.794 | 1931.144 | 1854.119 | 1956.819 |
| First byte (ms) | 2 | 0 | 1460.544 | 1440.455 | 1480.633 | 1420.366 | 1500.723 |
| API turns | 2 | 0 | 78.5 | 76.75 | 80.25 | 75 | 82 |
| Input tokens | 2 | 0 | 7360380 | 7288063 | 7432696 | 7215747 | 7505012 |
| Output tokens | 2 | 0 | 77219 | 75699 | 78739 | 74179 | 80259 |
| Cached input (%) | 2 | 0 | 99.10227 | 99.02506 | 99.17948 | 98.94785 | 99.2567 |
| Static cost (USD) | 2 | 0 | 0.07815856 | 0.07609878 | 0.08021835 | 0.07403899 | 0.08227814 |
| Model request count | 2 | 0 | 78.5 | 76.75 | 80.25 | 75 | 82 |
| Within-run median request duration (ms) | 2 | 0 | 2970.772 | 2858.232 | 3083.311 | 2745.693 | 3195.85 |
| Within-run median request wait (ms) | 2 | 0 | 1460.544 | 1440.455 | 1480.633 | 1420.366 | 1500.723 |
| Within-run median request transfer (ms) | 2 | 0 | 1505.075 | 1446.956 | 1563.194 | 1388.837 | 1621.312 |
| Within-run median inter-request gap (ms) | 2 | 0 | 65.73464 | 60.21651 | 71.25277 | 54.69837 | 76.7709 |
| Largest request duration (ms) | 2 | 0 | 41484.38 | 40978.16 | 41990.59 | 40471.95 | 42496.8 |
| Largest inter-request gap (ms) | 2 | 0 | 28967.51 | 28062.9 | 29872.11 | 27158.29 | 30776.72 |
| Time after last model response (ms) | 2 | 0 | 583.3938 | 436.6794 | 730.1082 | 289.965 | 876.8226 |

#### psd-tools-blend-range-api — qwen @ 0.22.2 — Pass (completed)

Selected attempts: 3. Task identity: \[&quot;psd-tools-blend-range-api&quot;,&quot;01595992c5f4d4695251fdf58b3edb5302d3ba46&quot;,&quot;sha256:2188831b06029f17b7cc1af49296bd7a865861a31afcad65be5ea69f130267fa&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 3 | 0 | 517408.6 | 465713.1 | 543091.2 | 414017.6 | 568773.9 |
| Model (ms) | 3 | 0 | 463646.4 | 415438.3 | 488168.4 | 367230.3 | 512690.5 |
| Non-model (ms) | 3 | 0 | 52282.83 | 48873.93 | 53468.59 | 45465.04 | 54654.34 |
| Startup (ms) | 3 | 0 | 1428.999 | 1375.608 | 1454.182 | 1322.218 | 1479.365 |
| First byte (ms) | 3 | 0 | 1548.684 | 1526.137 | 1555.831 | 1503.591 | 1562.978 |
| API turns | 3 | 0 | 91 | 76.5 | 109 | 62 | 127 |
| Input tokens | 3 | 0 | 10411570 | 8471332 | 13452040 | 6531094 | 16492510 |
| Output tokens | 3 | 0 | 86965 | 79830.5 | 87532.5 | 72696 | 88100 |
| Cached input (%) | 3 | 0 | 99.01355 | 97.89463 | 99.15881 | 96.7757 | 99.30407 |
| Static cost (USD) | 3 | 0 | 0.09851134 | 0.09633889 | 0.1088605 | 0.09416644 | 0.1192097 |
| Model request count | 3 | 0 | 91 | 76.5 | 109 | 62 | 127 |
| Within-run median request duration (ms) | 3 | 0 | 3255.453 | 2880.764 | 3327.348 | 2506.075 | 3399.244 |
| Within-run median request wait (ms) | 3 | 0 | 1548.684 | 1526.137 | 1555.831 | 1503.591 | 1562.978 |
| Within-run median request transfer (ms) | 3 | 0 | 1798.922 | 1352.004 | 1901.967 | 905.086 | 2005.013 |
| Within-run median inter-request gap (ms) | 3 | 0 | 54.94727 | 54.68689 | 71.38747 | 54.4265 | 87.82767 |
| Largest request duration (ms) | 3 | 0 | 31311.48 | 29408.71 | 31454.57 | 27505.93 | 31597.66 |
| Largest inter-request gap (ms) | 3 | 0 | 9746.28 | 9708.828 | 13955.39 | 9671.377 | 18164.5 |
| Time after last model response (ms) | 3 | 0 | 336.9969 | 296.7341 | 344.8889 | 256.4713 | 352.7809 |

#### superjson-error-stack-serialization — qwen @ 0.22.2 — Pass (completed)

Selected attempts: 2. Task identity: \[&quot;superjson-error-stack-serialization&quot;,&quot;f143004734ea2dd4090e45013a07f091f5bbaee7&quot;,&quot;sha256:88ff04f0e414e9530c121a53d121611a5674705f8607366803b0a88cdb253fb7&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 340210.6 | 311630.1 | 368791.2 | 283049.5 | 397371.8 |
| Model (ms) | 2 | 0 | 328136.1 | 300453.9 | 355818.4 | 272771.6 | 383500.6 |
| Non-model (ms) | 2 | 0 | 10491.27 | 9591.947 | 11390.59 | 8692.623 | 12289.92 |
| Startup (ms) | 2 | 0 | 1583.256 | 1582.25 | 1584.263 | 1581.243 | 1585.27 |
| First byte (ms) | 2 | 0 | 1406.366 | 1344.314 | 1468.418 | 1282.262 | 1530.47 |
| API turns | 2 | 0 | 43.5 | 40.75 | 46.25 | 38 | 49 |
| Input tokens | 2 | 0 | 3966004 | 3409094 | 4522913 | 2852184 | 5079823 |
| Output tokens | 2 | 0 | 70338.5 | 65462.25 | 75214.75 | 60586 | 80091 |
| Cached input (%) | 2 | 0 | 98.85789 | 98.6914 | 99.02437 | 98.52492 | 99.19086 |
| Static cost (USD) | 2 | 0 | 0.06021447 | 0.0556536 | 0.06477534 | 0.05109274 | 0.06933621 |
| Model request count | 2 | 0 | 43.5 | 40.75 | 46.25 | 38 | 49 |
| Within-run median request duration (ms) | 2 | 0 | 2721.365 | 2507.645 | 2935.084 | 2293.926 | 3148.803 |
| Within-run median request wait (ms) | 2 | 0 | 1406.366 | 1344.314 | 1468.418 | 1282.262 | 1530.47 |
| Within-run median request transfer (ms) | 2 | 0 | 1253.746 | 1124.373 | 1383.12 | 994.9996 | 1512.493 |
| Within-run median inter-request gap (ms) | 2 | 0 | 53.49884 | 53.42092 | 53.57677 | 53.343 | 53.65469 |
| Largest request duration (ms) | 2 | 0 | 116982.4 | 112096.2 | 121868.5 | 107210 | 126754.7 |
| Largest inter-request gap (ms) | 2 | 0 | 1555.828 | 1518.677 | 1592.978 | 1481.527 | 1630.129 |
| Time after last model response (ms) | 2 | 0 | 265.6258 | 262.1571 | 269.0945 | 258.6885 | 272.5631 |

#### textual-richlog-follow-state — qwen @ 0.22.2 — Pass (completed)

Selected attempts: 1. Task identity: \[&quot;textual-richlog-follow-state&quot;,&quot;a12215b791587a6d94227bd30a0e9291de932106&quot;,&quot;sha256:7579c8a5e4d527a7744c76cef25bf4193db0a7c8230a08b105a307d56b4ccc42&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 896108.3 | unavailable | unavailable | 896108.3 | 896108.3 |
| Model (ms) | 1 | 0 | 669397.2 | unavailable | unavailable | 669397.2 | 669397.2 |
| Non-model (ms) | 1 | 0 | 224659.8 | unavailable | unavailable | 224659.8 | 224659.8 |
| Startup (ms) | 1 | 0 | 2051.264 | unavailable | unavailable | 2051.264 | 2051.264 |
| First byte (ms) | 1 | 0 | 1539.034 | unavailable | unavailable | 1539.034 | 1539.034 |
| API turns | 1 | 0 | 155 | unavailable | unavailable | 155 | 155 |
| Input tokens | 1 | 0 | 19528170 | unavailable | unavailable | 19528170 | 19528170 |
| Output tokens | 1 | 0 | 113095 | unavailable | unavailable | 113095 | 113095 |
| Cached input (%) | 1 | 0 | 99.55901 | unavailable | unavailable | 99.55901 | 99.55901 |
| Static cost (USD) | 1 | 0 | 0.1391007 | unavailable | unavailable | 0.1391007 | 0.1391007 |
| Model request count | 1 | 0 | 155 | unavailable | unavailable | 155 | 155 |
| Within-run median request duration (ms) | 1 | 0 | 2879.67 | unavailable | unavailable | 2879.67 | 2879.67 |
| Within-run median request wait (ms) | 1 | 0 | 1539.034 | unavailable | unavailable | 1539.034 | 1539.034 |
| Within-run median request transfer (ms) | 1 | 0 | 1398.83 | unavailable | unavailable | 1398.83 | 1398.83 |
| Within-run median inter-request gap (ms) | 1 | 0 | 65.11721 | unavailable | unavailable | 65.11721 | 65.11721 |
| Largest request duration (ms) | 1 | 0 | 45340.09 | unavailable | unavailable | 45340.09 | 45340.09 |
| Largest inter-request gap (ms) | 1 | 0 | 175706.3 | unavailable | unavailable | 175706.3 | 175706.3 |
| Time after last model response (ms) | 1 | 0 | 332.9683 | unavailable | unavailable | 332.9683 | 332.9683 |

#### textual-richlog-follow-state — qwen @ 0.22.2 — Verification failure (verify_error)

Selected attempts: 2. Task identity: \[&quot;textual-richlog-follow-state&quot;,&quot;a12215b791587a6d94227bd30a0e9291de932106&quot;,&quot;sha256:7579c8a5e4d527a7744c76cef25bf4193db0a7c8230a08b105a307d56b4ccc42&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 952800.1 | 888928.4 | 1016672 | 825056.7 | 1080544 |
| Model (ms) | 2 | 0 | 642670.9 | 621168.7 | 664173.1 | 599666.5 | 685675.4 |
| Non-model (ms) | 2 | 0 | 308397 | 266001 | 350793.1 | 223604.9 | 393189.2 |
| Startup (ms) | 2 | 0 | 1732.167 | 1705.621 | 1758.713 | 1679.074 | 1785.26 |
| First byte (ms) | 2 | 0 | 1577.825 | 1555.997 | 1599.653 | 1534.169 | 1621.482 |
| API turns | 2 | 0 | 117.5 | 111.25 | 123.75 | 105 | 130 |
| Input tokens | 2 | 0 | 14948530 | 14290220 | 15606840 | 13631910 | 16265150 |
| Output tokens | 2 | 0 | 115748.5 | 113501.8 | 117995.3 | 111255 | 120242 |
| Cached input (%) | 2 | 0 | 99.33389 | 99.31186 | 99.35592 | 99.28983 | 99.37795 |
| Static cost (USD) | 2 | 0 | 0.1288468 | 0.1253633 | 0.1323303 | 0.1218798 | 0.1358138 |
| Model request count | 2 | 0 | 117.5 | 111.25 | 123.75 | 105 | 130 |
| Within-run median request duration (ms) | 2 | 0 | 3218.355 | 3092.806 | 3343.903 | 2967.258 | 3469.451 |
| Within-run median request wait (ms) | 2 | 0 | 1577.825 | 1555.997 | 1599.653 | 1534.169 | 1621.482 |
| Within-run median request transfer (ms) | 2 | 0 | 1690.349 | 1559.764 | 1820.933 | 1429.179 | 1951.518 |
| Within-run median inter-request gap (ms) | 2 | 0 | 62.3043 | 61.82475 | 62.78385 | 61.34521 | 63.2634 |
| Largest request duration (ms) | 2 | 0 | 46090.95 | 42763.1 | 49418.79 | 39435.26 | 52746.64 |
| Largest inter-request gap (ms) | 2 | 0 | 176471.6 | 176171.7 | 176771.5 | 175871.8 | 177071.5 |
| Time after last model response (ms) | 2 | 0 | 295.243 | 280.2361 | 310.2499 | 265.2292 | 325.2568 |

#### tomlkit-toml-table-converters — qwen @ 0.22.2 — Pass (completed)

Selected attempts: 3. Task identity: \[&quot;tomlkit-toml-table-converters&quot;,&quot;962de91aaf103135f400e5108a798a59a10dc17e&quot;,&quot;sha256:e9178c316850de3a8e7833234dc90fa1eef1767a348902086083bf1fc2bf2d10&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 3 | 0 | 700261 | 678916.6 | 710611.6 | 657572.1 | 720962.1 |
| Model (ms) | 3 | 0 | 650361.4 | 643837.8 | 668036.8 | 637314.3 | 685712.2 |
| Non-model (ms) | 3 | 0 | 33727.72 | 26213.74 | 41029.18 | 18699.77 | 48330.64 |
| Startup (ms) | 3 | 0 | 1558.104 | 1540.125 | 1563.564 | 1522.146 | 1569.024 |
| First byte (ms) | 3 | 0 | 1640.918 | 1623.115 | 1651.795 | 1605.312 | 1662.672 |
| API turns | 3 | 0 | 109 | 107.5 | 115 | 106 | 121 |
| Input tokens | 3 | 0 | 16990290 | 15744190 | 17585540 | 14498080 | 18180790 |
| Output tokens | 3 | 0 | 118777 | 115958.5 | 125919 | 113140 | 133061 |
| Cached input (%) | 3 | 0 | 99.41603 | 99.37417 | 99.44673 | 99.33231 | 99.47742 |
| Static cost (USD) | 3 | 0 | 0.1414156 | 0.1335119 | 0.1426374 | 0.1256081 | 0.1438593 |
| Model request count | 3 | 0 | 109 | 107.5 | 115 | 106 | 121 |
| Within-run median request duration (ms) | 3 | 0 | 3439.283 | 3296.785 | 3618.324 | 3154.287 | 3797.364 |
| Within-run median request wait (ms) | 3 | 0 | 1640.918 | 1623.115 | 1651.795 | 1605.312 | 1662.672 |
| Within-run median request transfer (ms) | 3 | 0 | 1748.09 | 1680.257 | 2012.279 | 1612.424 | 2276.468 |
| Within-run median inter-request gap (ms) | 3 | 0 | 72.98713 | 67.46835 | 73.98384 | 61.94958 | 74.98056 |
| Largest request duration (ms) | 3 | 0 | 49699.95 | 42527.27 | 52445.59 | 35354.6 | 55191.24 |
| Largest inter-request gap (ms) | 3 | 0 | 7872.048 | 5182.957 | 8180.128 | 2493.867 | 8488.209 |
| Time after last model response (ms) | 3 | 0 | 284.3712 | 261.0207 | 302.5016 | 237.6703 | 320.6321 |

#### true-myth-iterable-collection-combinators — qwen @ 0.22.2 — Pass (completed)

Selected attempts: 1. Task identity: \[&quot;true-myth-iterable-collection-combinators&quot;,&quot;5945ad1b96e228ff716275d8a273282101152508&quot;,&quot;sha256:086b4e313e8a7e239cf0633a12c424025fd640294a9d6b44ebf73664a83c6c28&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 364074.8 | unavailable | unavailable | 364074.8 | 364074.8 |
| Model (ms) | 1 | 0 | 330378 | unavailable | unavailable | 330378 | 330378 |
| Non-model (ms) | 1 | 0 | 32304.41 | unavailable | unavailable | 32304.41 | 32304.41 |
| Startup (ms) | 1 | 0 | 1392.333 | unavailable | unavailable | 1392.333 | 1392.333 |
| First byte (ms) | 1 | 0 | 1423.808 | unavailable | unavailable | 1423.808 | 1423.808 |
| API turns | 1 | 0 | 51 | unavailable | unavailable | 51 | 51 |
| Input tokens | 1 | 0 | 5014305 | unavailable | unavailable | 5014305 | 5014305 |
| Output tokens | 1 | 0 | 71309 | unavailable | unavailable | 71309 | 71309 |
| Cached input (%) | 1 | 0 | 98.2099 | unavailable | unavailable | 98.2099 | 98.2099 |
| Static cost (USD) | 1 | 0 | 0.07102318 | unavailable | unavailable | 0.07102318 | 0.07102318 |
| Model request count | 1 | 0 | 51 | unavailable | unavailable | 51 | 51 |
| Within-run median request duration (ms) | 1 | 0 | 3124.911 | unavailable | unavailable | 3124.911 | 3124.911 |
| Within-run median request wait (ms) | 1 | 0 | 1423.808 | unavailable | unavailable | 1423.808 | 1423.808 |
| Within-run median request transfer (ms) | 1 | 0 | 1710.677 | unavailable | unavailable | 1710.677 | 1710.677 |
| Within-run median inter-request gap (ms) | 1 | 0 | 53.56279 | unavailable | unavailable | 53.56279 | 53.56279 |
| Largest request duration (ms) | 1 | 0 | 45175.41 | unavailable | unavailable | 45175.41 | 45175.41 |
| Largest inter-request gap (ms) | 1 | 0 | 15312.67 | unavailable | unavailable | 15312.67 | 15312.67 |
| Time after last model response (ms) | 1 | 0 | 447.2707 | unavailable | unavailable | 447.2707 | 447.2707 |

#### true-myth-iterable-collection-combinators — qwen @ 0.22.2 — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;true-myth-iterable-collection-combinators&quot;,&quot;5945ad1b96e228ff716275d8a273282101152508&quot;,&quot;sha256:086b4e313e8a7e239cf0633a12c424025fd640294a9d6b44ebf73664a83c6c28&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 451841.5 | unavailable | unavailable | 451841.5 | 451841.5 |
| Model (ms) | 1 | 0 | 419250.9 | unavailable | unavailable | 419250.9 | 419250.9 |
| Non-model (ms) | 1 | 0 | 31292.58 | unavailable | unavailable | 31292.58 | 31292.58 |
| Startup (ms) | 1 | 0 | 1298.092 | unavailable | unavailable | 1298.092 | 1298.092 |
| First byte (ms) | 1 | 0 | 1615.006 | unavailable | unavailable | 1615.006 | 1615.006 |
| API turns | 1 | 0 | 60 | unavailable | unavailable | 60 | 60 |
| Input tokens | 1 | 0 | 8721836 | unavailable | unavailable | 8721836 | 8721836 |
| Output tokens | 1 | 0 | 94037 | unavailable | unavailable | 94037 | 94037 |
| Cached input (%) | 1 | 0 | 98.84451 | unavailable | unavailable | 98.84451 | 98.84451 |
| Static cost (USD) | 1 | 0 | 0.09740237 | unavailable | unavailable | 0.09740237 | 0.09740237 |
| Model request count | 1 | 0 | 60 | unavailable | unavailable | 60 | 60 |
| Within-run median request duration (ms) | 1 | 0 | 2966.85 | unavailable | unavailable | 2966.85 | 2966.85 |
| Within-run median request wait (ms) | 1 | 0 | 1615.006 | unavailable | unavailable | 1615.006 | 1615.006 |
| Within-run median request transfer (ms) | 1 | 0 | 1301.479 | unavailable | unavailable | 1301.479 | 1301.479 |
| Within-run median inter-request gap (ms) | 1 | 0 | 55.91104 | unavailable | unavailable | 55.91104 | 55.91104 |
| Largest request duration (ms) | 1 | 0 | 54927.83 | unavailable | unavailable | 54927.83 | 54927.83 |
| Largest inter-request gap (ms) | 1 | 0 | 4077.309 | unavailable | unavailable | 4077.309 | 4077.309 |
| Time after last model response (ms) | 1 | 0 | 367.4755 | unavailable | unavailable | 367.4755 | 367.4755 |

### Annotated request timelines

#### pinned:pi:textual-richlog-follow-state:1:independent-20260911 — largest inter-request gap among passes

pi @ 0.73.1 · textual-richlog-follow-state · Pass (completed). Calls 114 (114 successful). Median duration 3.06s; largest gap 3m 2.79s; time after last 366.6118 ms.

#### pinned:codex:true-myth-iterable-collection-combinators:1:independent-20260911 — longest tail after last model response among passes

codex @ codex-cli 0.149.1 · true-myth-iterable-collection-combinators · Pass (completed). Calls 79 (79 successful). Median duration 2.45s; largest gap 15.06s; time after last 9.75s.

#### pinned:cline:cattrs-partial-structuring-recovery:0 — most failed model calls among verification failures

cline @ 3.0.61 · cattrs-partial-structuring-recovery · Verification failure (verify_error). Calls 229 (228 successful). Median duration 2.47s; largest gap 30.08s; time after last 1.35s.

## Population 2

| Recorded identity | Value |
| --- | --- |
| Condition | pinned |
| Model | deepseek/deepseek-v4.1-flash |
| Price book | deepseek-v41-low-2026-09-10 |
| Host OS | linux |
| Host CPU | x64 |
| Host RAM (GiB; rounded) | 30.17 |
| Source | public-task-pack |
| Repository | https://github.com/datacurve-ai/deep-swe.git |
| Source revision | 0b9fabbb63b9104d678fe965e1632f2dd9eaa2ea |
| Regime | extended |
| Ignored providers | relace |
| Only provider | deepseek |
| Allow fallbacks | false |
| Configuration | unavailable |
| ORI version | unavailable |

### Coverage

| Harness @ version | Selected | Pass | Verify fail | Other | Tasks | Timing n | Timing tasks | Turns n | Input n | Output n | Cache n | Cost n | IQR tasks / successful timing tasks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| cline @ 3.0.61 | 18 | 8 | 10 | 0 | 8 | 18 | 8 | 18 | 18 | 18 | 18 | 18 | 2 / 5 |
| qwen @ 0.22.2 | 16 | 10 | 6 | 0 | 8 | 16 | 8 | 16 | 16 | 16 | 16 | 16 | 4 / 6 |

### Selected spend by outcome

| Harness @ version | Outcome | Selected | Priced n | Missing n | Selected static spend (USD) |
| --- | --- | --- | --- | --- | --- |
| cline @ 3.0.61 | Pass (completed) | 8 | 8 | 0 | Total: 1.829963 |
| cline @ 3.0.61 | Verification failure (verify\_error) | 10 | 10 | 0 | Total: 1.887896 |
| qwen @ 0.22.2 | Pass (completed) | 10 | 10 | 0 | Total: 1.17006 |
| qwen @ 0.22.2 | Verification failure (verify\_error) | 6 | 6 | 0 | Total: 0.6075725 |

### Request-level summaries

| Harness @ version | Outcome | Runs | Median calls | Median of run median durations | Median of run median waits | Median of run median transfers | Median of run median gaps | Median time after last |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| cline @ 3.0.61 | Pass (completed) | 8 | 167 (available n=8; missing n=0) | 2.53s (available n=8; missing n=0) | 1.15s (available n=8; missing n=0) | 1.37s (available n=8; missing n=0) | 45.39492 ms (available n=8; missing n=0) | 1.35s (available n=8; missing n=0) |
| cline @ 3.0.61 | Verification failure (verify\_error) | 10 | 121 (available n=10; missing n=0) | 2.75s (available n=10; missing n=0) | 1.12s (available n=10; missing n=0) | 1.6s (available n=10; missing n=0) | 44.25275 ms (available n=10; missing n=0) | 1.48s (available n=10; missing n=0) |
| qwen @ 0.22.2 | Pass (completed) | 10 | 91.5 (available n=10; missing n=0) | 2.96s (available n=10; missing n=0) | 1.56s (available n=10; missing n=0) | 1.38s (available n=10; missing n=0) | 49.32065 ms (available n=10; missing n=0) | 238.477 ms (available n=10; missing n=0) |
| qwen @ 0.22.2 | Verification failure (verify\_error) | 6 | 75.5 (available n=6; missing n=0) | 2.66s (available n=6; missing n=0) | 1.42s (available n=6; missing n=0) | 1.1s (available n=6; missing n=0) | 45.50353 ms (available n=6; missing n=0) | 222.3954 ms (available n=6; missing n=0) |

### Common successful tasks

#### cline @ 3.0.61 (left) vs qwen @ 0.22.2 (right)

Common successful tasks: 5. Left median of task medians: 782267.1 ms. Right median of task medians: 592323.6 ms. Median task ratio (right / left): 0.64152.

| Common successful task | Left n | Left median (ms) | Right n | Right median (ms) | Right / left |
| --- | --- | --- | --- | --- | --- |
| cattrs-partial-structuring-recovery | 2 | 723902.8 | 2 | 592323.6 | 0.8182363 |
| psd-tools-blend-range-api | 1 | 782267.1 | 2 | 501840 | 0.64152 |
| textual-richlog-follow-state | 1 | 3235393 | 1 | 1281924 | 0.3962189 |
| tomlkit-toml-table-converters | 3 | 1616713 | 2 | 795082.9 | 0.4917896 |
| true-myth-iterable-collection-combinators | 1 | 640484.1 | 2 | 452219.8 | 0.7060593 |

### Per-task outcome distributions

#### cattrs-partial-structuring-recovery — cline @ 3.0.61 — Pass (completed)

Selected attempts: 2. Task identity: \[&quot;cattrs-partial-structuring-recovery&quot;,&quot;91df27b2a20f26c35777a92f4555438b62c06345&quot;,&quot;sha256:a8c03de04a7b0d8162d83465a98ab9ef392dfe986a460d5c7e463ce1f0937aa3&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 723902.8 | 685704 | 762101.6 | 647505.2 | 800300.3 |
| Model (ms) | 2 | 0 | 547669.7 | 539794.7 | 555544.7 | 531919.6 | 563419.7 |
| Non-model (ms) | 2 | 0 | 175043.6 | 144725 | 205362.2 | 114406.4 | 235680.8 |
| Startup (ms) | 2 | 0 | 1189.514 | 1184.362 | 1194.666 | 1179.209 | 1199.818 |
| First byte (ms) | 2 | 0 | 1124.678 | 1122.762 | 1126.593 | 1120.847 | 1128.509 |
| API turns | 2 | 0 | 137 | 133 | 141 | 129 | 145 |
| Input tokens | 2 | 0 | 6898999 | 6690331 | 7107668 | 6481662 | 7316336 |
| Output tokens | 2 | 0 | 103057 | 101606.5 | 104507.5 | 100156 | 105958 |
| Cached input (%) | 2 | 0 | 97.44211 | 97.40782 | 97.47639 | 97.37354 | 97.51067 |
| Static cost (USD) | 2 | 0 | 0.1084301 | 0.1064968 | 0.1103634 | 0.1045636 | 0.1122966 |
| Model request count | 2 | 0 | 137 | 133 | 141 | 129 | 145 |
| Within-run median request duration (ms) | 2 | 0 | 2389.55 | 2302.711 | 2476.389 | 2215.872 | 2563.228 |
| Within-run median request wait (ms) | 2 | 0 | 1124.678 | 1122.762 | 1126.593 | 1120.847 | 1128.509 |
| Within-run median request transfer (ms) | 2 | 0 | 1271.551 | 1166.189 | 1376.913 | 1060.826 | 1482.275 |
| Within-run median inter-request gap (ms) | 2 | 0 | 44.20637 | 43.8792 | 44.53354 | 43.55202 | 44.86072 |
| Largest request duration (ms) | 2 | 0 | 53668.21 | 53445.97 | 53890.44 | 53223.74 | 54112.68 |
| Largest inter-request gap (ms) | 2 | 0 | 30052.62 | 30049.13 | 30056.11 | 30045.63 | 30059.61 |
| Time after last model response (ms) | 2 | 0 | 1278.227 | 1226.007 | 1330.446 | 1173.788 | 1382.665 |

#### happy-dom-deterministic-intersectionobserver — cline @ 3.0.61 — Verification failure (verify_error)

Selected attempts: 2. Task identity: \[&quot;happy-dom-deterministic-intersectionobserver&quot;,&quot;32b2a8e60eab482c023af377160bf294d6da0318&quot;,&quot;sha256:fa6e7f7d727d5fa5ec3367c5a2043259662d5a6877f49f3c46fd2f1edb181160&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 1004553 | 848090.4 | 1161015 | 691628.2 | 1317477 |
| Model (ms) | 2 | 0 | 884489.2 | 737018.3 | 1031960 | 589547.3 | 1179431 |
| Non-model (ms) | 2 | 0 | 117925.4 | 108740.8 | 127109.9 | 99556.28 | 136294.5 |
| Startup (ms) | 2 | 0 | 2138.028 | 1944.743 | 2331.312 | 1751.458 | 2524.597 |
| First byte (ms) | 2 | 0 | 1116.084 | 1109.854 | 1122.315 | 1103.623 | 1128.546 |
| API turns | 2 | 0 | 165 | 136 | 194 | 107 | 223 |
| Input tokens | 2 | 0 | 8538100 | 6925364 | 10150840 | 5312627 | 11763570 |
| Output tokens | 2 | 0 | 180123.5 | 151732.3 | 208514.8 | 123341 | 236906 |
| Cached input (%) | 2 | 0 | 95.37967 | 94.85776 | 95.90158 | 94.33585 | 96.42349 |
| Static cost (USD) | 2 | 0 | 0.1867289 | 0.160453 | 0.2130049 | 0.134177 | 0.2392809 |
| Model request count | 2 | 0 | 165 | 136 | 194 | 107 | 223 |
| Within-run median request duration (ms) | 2 | 0 | 2881.02 | 2849.194 | 2912.846 | 2817.368 | 2944.672 |
| Within-run median request wait (ms) | 2 | 0 | 1116.084 | 1109.854 | 1122.315 | 1103.623 | 1128.546 |
| Within-run median request transfer (ms) | 2 | 0 | 1710.17 | 1673.743 | 1746.597 | 1637.316 | 1783.024 |
| Within-run median inter-request gap (ms) | 2 | 0 | 49.98679 | 48.81629 | 51.1573 | 47.64579 | 52.3278 |
| Largest request duration (ms) | 2 | 0 | 59562.5 | 55813.44 | 63311.56 | 52064.38 | 67060.62 |
| Largest inter-request gap (ms) | 2 | 0 | 26116.53 | 24146.17 | 28086.88 | 22175.82 | 30057.23 |
| Time after last model response (ms) | 2 | 0 | 1651.234 | 1642.613 | 1659.855 | 1633.991 | 1668.477 |

#### ink-grid-box-layout — cline @ 3.0.61 — Verification failure (verify_error)

Selected attempts: 3. Task identity: \[&quot;ink-grid-box-layout&quot;,&quot;477fda7df7781406d2ba046eb48dd5391e964b72&quot;,&quot;sha256:b093eab15a3872c9a84f54190d76d138296cf44430826a649b15936370013c91&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 3 | 0 | 897796.4 | 864632.6 | 993626.1 | 831468.9 | 1089456 |
| Model (ms) | 3 | 0 | 520257.5 | 511166.3 | 686193.8 | 502075.2 | 852130.2 |
| Non-model (ms) | 3 | 0 | 309439.1 | 272533.6 | 351729.5 | 235628 | 394019.8 |
| Startup (ms) | 3 | 0 | 1701.347 | 1699.442 | 1736.833 | 1697.536 | 1772.319 |
| First byte (ms) | 3 | 0 | 1117.274 | 1117.219 | 1123.382 | 1117.165 | 1129.49 |
| API turns | 3 | 0 | 121 | 121 | 159.5 | 121 | 198 |
| Input tokens | 3 | 0 | 6241087 | 6081176 | 7560770 | 5921264 | 8880453 |
| Output tokens | 3 | 0 | 99061 | 95047.5 | 128521.5 | 91034 | 157982 |
| Cached input (%) | 3 | 0 | 96.81236 | 96.42079 | 97.06232 | 96.02923 | 97.31228 |
| Static cost (USD) | 3 | 0 | 0.111763 | 0.1048825 | 0.137403 | 0.09800188 | 0.1630429 |
| Model request count | 3 | 0 | 121 | 121 | 159.5 | 121 | 198 |
| Within-run median request duration (ms) | 3 | 0 | 2126.398 | 2093.15 | 2297.884 | 2059.903 | 2469.37 |
| Within-run median request wait (ms) | 3 | 0 | 1117.274 | 1117.219 | 1123.382 | 1117.165 | 1129.49 |
| Within-run median request transfer (ms) | 3 | 0 | 1020.847 | 964.2478 | 1171.568 | 907.6491 | 1322.289 |
| Within-run median inter-request gap (ms) | 3 | 0 | 42.00143 | 40.21154 | 43.49334 | 38.42164 | 44.98524 |
| Largest request duration (ms) | 3 | 0 | 78521.3 | 60198.72 | 85394.4 | 41876.15 | 92267.51 |
| Largest inter-request gap (ms) | 3 | 0 | 30050.21 | 30049.82 | 30051.7 | 30049.43 | 30053.18 |
| Time after last model response (ms) | 3 | 0 | 1267.09 | 1246.205 | 1394.49 | 1225.319 | 1521.889 |

#### psd-tools-blend-range-api — cline @ 3.0.61 — Pass (completed)

Selected attempts: 1. Task identity: \[&quot;psd-tools-blend-range-api&quot;,&quot;01595992c5f4d4695251fdf58b3edb5302d3ba46&quot;,&quot;sha256:529c5d6b0b6781fc7767d390c82bd94edc9935cb30d04a304f292dfaf4780a32&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 782267.1 | unavailable | unavailable | 782267.1 | 782267.1 |
| Model (ms) | 1 | 0 | 657451.4 | unavailable | unavailable | 657451.4 | 657451.4 |
| Non-model (ms) | 1 | 0 | 123562.9 | unavailable | unavailable | 123562.9 | 123562.9 |
| Startup (ms) | 1 | 0 | 1252.82 | unavailable | unavailable | 1252.82 | 1252.82 |
| First byte (ms) | 1 | 0 | 1125.571 | unavailable | unavailable | 1125.571 | 1125.571 |
| API turns | 1 | 0 | 189 | unavailable | unavailable | 189 | 189 |
| Input tokens | 1 | 0 | 10153760 | unavailable | unavailable | 10153760 | 10153760 |
| Output tokens | 1 | 0 | 121955 | unavailable | unavailable | 121955 | 121955 |
| Cached input (%) | 1 | 0 | 97.51751 | unavailable | unavailable | 97.51751 | 97.51751 |
| Static cost (USD) | 1 | 0 | 0.140688 | unavailable | unavailable | 0.140688 | 0.140688 |
| Model request count | 1 | 0 | 189 | unavailable | unavailable | 189 | 189 |
| Within-run median request duration (ms) | 1 | 0 | 2272.549 | unavailable | unavailable | 2272.549 | 2272.549 |
| Within-run median request wait (ms) | 1 | 0 | 1125.571 | unavailable | unavailable | 1125.571 | 1125.571 |
| Within-run median request transfer (ms) | 1 | 0 | 1220.568 | unavailable | unavailable | 1220.568 | 1220.568 |
| Within-run median inter-request gap (ms) | 1 | 0 | 40.97252 | unavailable | unavailable | 40.97252 | 40.97252 |
| Largest request duration (ms) | 1 | 0 | 28936.59 | unavailable | unavailable | 28936.59 | 28936.59 |
| Largest inter-request gap (ms) | 1 | 0 | 14037.26 | unavailable | unavailable | 14037.26 | 14037.26 |
| Time after last model response (ms) | 1 | 0 | 1306.665 | unavailable | unavailable | 1306.665 | 1306.665 |

#### psd-tools-blend-range-api — cline @ 3.0.61 — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;psd-tools-blend-range-api&quot;,&quot;01595992c5f4d4695251fdf58b3edb5302d3ba46&quot;,&quot;sha256:529c5d6b0b6781fc7767d390c82bd94edc9935cb30d04a304f292dfaf4780a32&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 1580871 | unavailable | unavailable | 1580871 | 1580871 |
| Model (ms) | 1 | 0 | 1384414 | unavailable | unavailable | 1384414 | 1384414 |
| Non-model (ms) | 1 | 0 | 195213.7 | unavailable | unavailable | 195213.7 | 195213.7 |
| Startup (ms) | 1 | 0 | 1242.991 | unavailable | unavailable | 1242.991 | 1242.991 |
| First byte (ms) | 1 | 0 | 1167.126 | unavailable | unavailable | 1167.126 | 1167.126 |
| API turns | 1 | 0 | 290 | unavailable | unavailable | 290 | 290 |
| Input tokens | 1 | 0 | 15860330 | unavailable | unavailable | 15860330 | 15860330 |
| Output tokens | 1 | 0 | 276939 | unavailable | unavailable | 276939 | 276939 |
| Cached input (%) | 1 | 0 | 96.65653 | unavailable | unavailable | 96.65653 | 96.65653 |
| Static cost (USD) | 1 | 0 | 0.2916963 | unavailable | unavailable | 0.2916963 | 0.2916963 |
| Model request count | 1 | 0 | 290 | unavailable | unavailable | 290 | 290 |
| Within-run median request duration (ms) | 1 | 0 | 2891.462 | unavailable | unavailable | 2891.462 | 2891.462 |
| Within-run median request wait (ms) | 1 | 0 | 1167.126 | unavailable | unavailable | 1167.126 | 1167.126 |
| Within-run median request transfer (ms) | 1 | 0 | 1710.976 | unavailable | unavailable | 1710.976 | 1710.976 |
| Within-run median inter-request gap (ms) | 1 | 0 | 53.69567 | unavailable | unavailable | 53.69567 | 53.69567 |
| Largest request duration (ms) | 1 | 0 | 38947.74 | unavailable | unavailable | 38947.74 | 38947.74 |
| Largest inter-request gap (ms) | 1 | 0 | 30072.32 | unavailable | unavailable | 30072.32 | 30072.32 |
| Time after last model response (ms) | 1 | 0 | 1549.135 | unavailable | unavailable | 1549.135 | 1549.135 |

#### superjson-error-stack-serialization — cline @ 3.0.61 — Verification failure (verify_error)

Selected attempts: 2. Task identity: \[&quot;superjson-error-stack-serialization&quot;,&quot;f143004734ea2dd4090e45013a07f091f5bbaee7&quot;,&quot;sha256:9cc29a9cf9c9e48c818f56a810cf3a9a287bd7c1991b08c6610113f7ac15c3e8&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 467122.7 | 440253.3 | 493992.2 | 413383.9 | 520861.6 |
| Model (ms) | 2 | 0 | 446390.6 | 421206.4 | 471574.7 | 396022.3 | 496758.8 |
| Non-model (ms) | 2 | 0 | 18866.91 | 17181.44 | 20552.37 | 15495.98 | 22237.83 |
| Startup (ms) | 2 | 0 | 1865.269 | 1865.122 | 1865.416 | 1864.974 | 1865.564 |
| First byte (ms) | 2 | 0 | 1134.996 | 1130.101 | 1139.891 | 1125.207 | 1144.785 |
| API turns | 2 | 0 | 69.5 | 56.75 | 82.25 | 44 | 95 |
| Input tokens | 2 | 0 | 3495165 | 2706803 | 4283528 | 1918440 | 5071890 |
| Output tokens | 2 | 0 | 96448 | 92765 | 100131 | 89082 | 103814 |
| Cached input (%) | 2 | 0 | 94.25916 | 93.37382 | 95.1445 | 92.48848 | 96.02984 |
| Static cost (USD) | 2 | 0 | 0.09374605 | 0.08706693 | 0.1004252 | 0.08038781 | 0.1071043 |
| Model request count | 2 | 0 | 69.5 | 56.75 | 82.25 | 44 | 95 |
| Within-run median request duration (ms) | 2 | 0 | 2701.203 | 2631.396 | 2771.01 | 2561.59 | 2840.817 |
| Within-run median request wait (ms) | 2 | 0 | 1134.996 | 1130.101 | 1139.891 | 1125.207 | 1144.785 |
| Within-run median request transfer (ms) | 2 | 0 | 1531.919 | 1415.755 | 1648.083 | 1299.591 | 1764.247 |
| Within-run median inter-request gap (ms) | 2 | 0 | 41.83725 | 40.99575 | 42.67876 | 40.15424 | 43.52027 |
| Largest request duration (ms) | 2 | 0 | 131825.5 | 122583.6 | 141067.4 | 113341.6 | 150309.3 |
| Largest inter-request gap (ms) | 2 | 0 | 2668.994 | 2564.336 | 2773.652 | 2459.678 | 2878.31 |
| Time after last model response (ms) | 2 | 0 | 1302.607 | 1275.796 | 1329.418 | 1248.985 | 1356.228 |

#### textual-richlog-follow-state — cline @ 3.0.61 — Pass (completed)

Selected attempts: 1. Task identity: \[&quot;textual-richlog-follow-state&quot;,&quot;a12215b791587a6d94227bd30a0e9291de932106&quot;,&quot;sha256:5b0166c0ee50a230850e78d5550fe32442834eb63599802d0a99faff0ba9af87&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 3235393 | unavailable | unavailable | 3235393 | 3235393 |
| Model (ms) | 1 | 0 | 2778627 | unavailable | unavailable | 2778627 | 2778627 |
| Non-model (ms) | 1 | 0 | 455475.7 | unavailable | unavailable | 455475.7 | 455475.7 |
| Startup (ms) | 1 | 0 | 1290.731 | unavailable | unavailable | 1290.731 | 1290.731 |
| First byte (ms) | 1 | 0 | 1117.394 | unavailable | unavailable | 1117.394 | 1117.394 |
| API turns | 1 | 0 | 499 | unavailable | unavailable | 499 | 499 |
| Input tokens | 1 | 0 | 24366870 | unavailable | unavailable | 24366870 | 24366870 |
| Output tokens | 1 | 0 | 541866 | unavailable | unavailable | 541866 | 541866 |
| Cached input (%) | 1 | 0 | 96.14784 | unavailable | unavailable | 96.14784 | 96.14784 |
| Static cost (USD) | 1 | 0 | 0.5362018 | unavailable | unavailable | 0.5362018 | 0.5362018 |
| Model request count | 1 | 0 | 499 | unavailable | unavailable | 499 | 499 |
| Within-run median request duration (ms) | 1 | 0 | 3398.384 | unavailable | unavailable | 3398.384 | 3398.384 |
| Within-run median request wait (ms) | 1 | 0 | 1117.394 | unavailable | unavailable | 1117.394 | 1117.394 |
| Within-run median request transfer (ms) | 1 | 0 | 2222.198 | unavailable | unavailable | 2222.198 | 2222.198 |
| Within-run median inter-request gap (ms) | 1 | 0 | 73.69098 | unavailable | unavailable | 73.69098 | 73.69098 |
| Largest request duration (ms) | 1 | 0 | 58111 | unavailable | unavailable | 58111 | 58111 |
| Largest inter-request gap (ms) | 1 | 0 | 30099.68 | unavailable | unavailable | 30099.68 | 30099.68 |
| Time after last model response (ms) | 1 | 0 | 1645.612 | unavailable | unavailable | 1645.612 | 1645.612 |

#### textual-richlog-follow-state — cline @ 3.0.61 — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;textual-richlog-follow-state&quot;,&quot;a12215b791587a6d94227bd30a0e9291de932106&quot;,&quot;sha256:5b0166c0ee50a230850e78d5550fe32442834eb63599802d0a99faff0ba9af87&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 3325089 | unavailable | unavailable | 3325089 | 3325089 |
| Model (ms) | 1 | 0 | 2907691 | unavailable | unavailable | 2907691 | 2907691 |
| Non-model (ms) | 1 | 0 | 416091.4 | unavailable | unavailable | 416091.4 | 416091.4 |
| Startup (ms) | 1 | 0 | 1306.716 | unavailable | unavailable | 1306.716 | 1306.716 |
| First byte (ms) | 1 | 0 | 1123.692 | unavailable | unavailable | 1123.692 | 1123.692 |
| API turns | 1 | 0 | 395 | unavailable | unavailable | 395 | 395 |
| Input tokens | 1 | 0 | 19868320 | unavailable | unavailable | 19868320 | 19868320 |
| Output tokens | 1 | 0 | 592620 | unavailable | unavailable | 592620 | 592620 |
| Cached input (%) | 1 | 0 | 95.74269 | unavailable | unavailable | 95.74269 | 95.74269 |
| Static cost (USD) | 1 | 0 | 0.5395176 | unavailable | unavailable | 0.5395176 | 0.5395176 |
| Model request count | 1 | 0 | 395 | unavailable | unavailable | 395 | 395 |
| Within-run median request duration (ms) | 1 | 0 | 4667.466 | unavailable | unavailable | 4667.466 | 4667.466 |
| Within-run median request wait (ms) | 1 | 0 | 1123.692 | unavailable | unavailable | 1123.692 | 1123.692 |
| Within-run median request transfer (ms) | 1 | 0 | 3554.012 | unavailable | unavailable | 3554.012 | 3554.012 |
| Within-run median inter-request gap (ms) | 1 | 0 | 70.6276 | unavailable | unavailable | 70.6276 | 70.6276 |
| Largest request duration (ms) | 1 | 0 | 67629.92 | unavailable | unavailable | 67629.92 | 67629.92 |
| Largest inter-request gap (ms) | 1 | 0 | 30081.06 | unavailable | unavailable | 30081.06 | 30081.06 |
| Time after last model response (ms) | 1 | 0 | 1639.309 | unavailable | unavailable | 1639.309 | 1639.309 |

#### tomlkit-toml-table-converters — cline @ 3.0.61 — Pass (completed)

Selected attempts: 3. Task identity: \[&quot;tomlkit-toml-table-converters&quot;,&quot;962de91aaf103135f400e5108a798a59a10dc17e&quot;,&quot;sha256:86a7f7545adc060de810c3aceb9356f3048262a6e0f046d863cc114bdd98dcd3&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 3 | 0 | 1616713 | 1231274 | 1774906 | 845835.4 | 1933098 |
| Model (ms) | 3 | 0 | 1524514 | 1168816 | 1678976 | 813118.1 | 1833438 |
| Non-model (ms) | 3 | 0 | 91016.9 | 61256.53 | 94745.66 | 31496.16 | 98474.42 |
| Startup (ms) | 3 | 0 | 1185.995 | 1184.383 | 1203.572 | 1182.77 | 1221.149 |
| First byte (ms) | 3 | 0 | 1169.624 | 1168.838 | 1191.302 | 1168.051 | 1212.979 |
| API turns | 3 | 0 | 315 | 230 | 344 | 145 | 373 |
| Input tokens | 3 | 0 | 16934350 | 12515080 | 17953880 | 8095806 | 18973410 |
| Output tokens | 3 | 0 | 297631 | 228384 | 324104.5 | 159137 | 350578 |
| Cached input (%) | 3 | 0 | 97.08117 | 96.97655 | 97.15361 | 96.87192 | 97.22605 |
| Static cost (USD) | 3 | 0 | 0.3020414 | 0.2274117 | 0.3282768 | 0.152782 | 0.3545121 |
| Model request count | 3 | 0 | 315 | 230 | 344 | 145 | 373 |
| Within-run median request duration (ms) | 3 | 0 | 2673.903 | 2589.518 | 2711.864 | 2505.132 | 2749.825 |
| Within-run median request wait (ms) | 3 | 0 | 1169.624 | 1168.838 | 1191.302 | 1168.051 | 1212.979 |
| Within-run median request transfer (ms) | 3 | 0 | 1574.44 | 1420.718 | 1599.478 | 1266.997 | 1624.515 |
| Within-run median inter-request gap (ms) | 3 | 0 | 51.41125 | 48.67018 | 52.24761 | 45.92911 | 53.08398 |
| Largest request duration (ms) | 3 | 0 | 88143 | 64697 | 90564.41 | 41251.01 | 92985.83 |
| Largest inter-request gap (ms) | 3 | 0 | 7831.044 | 7816.28 | 8563.878 | 7801.517 | 9296.712 |
| Time after last model response (ms) | 3 | 0 | 1310.937 | 1302.49 | 1416.411 | 1294.044 | 1521.885 |

#### true-myth-iterable-collection-combinators — cline @ 3.0.61 — Pass (completed)

Selected attempts: 1. Task identity: \[&quot;true-myth-iterable-collection-combinators&quot;,&quot;5945ad1b96e228ff716275d8a273282101152508&quot;,&quot;sha256:2d5b99141677ea769219ab882b11fa652f51f525c5960ce80e49cb7dee26a79d&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 640484.1 | unavailable | unavailable | 640484.1 | 640484.1 |
| Model (ms) | 1 | 0 | 550923.2 | unavailable | unavailable | 550923.2 | 550923.2 |
| Non-model (ms) | 1 | 0 | 88381.87 | unavailable | unavailable | 88381.87 | 88381.87 |
| Startup (ms) | 1 | 0 | 1179.004 | unavailable | unavailable | 1179.004 | 1179.004 |
| First byte (ms) | 1 | 0 | 1167.065 | unavailable | unavailable | 1167.065 | 1167.065 |
| API turns | 1 | 0 | 111 | unavailable | unavailable | 111 | 111 |
| Input tokens | 1 | 0 | 6011758 | unavailable | unavailable | 6011758 | 6011758 |
| Output tokens | 1 | 0 | 115584 | unavailable | unavailable | 115584 | 115584 |
| Cached input (%) | 1 | 0 | 95.53119 | unavailable | unavailable | 95.53119 | 95.53119 |
| Static cost (USD) | 1 | 0 | 0.1268778 | unavailable | unavailable | 0.1268778 | 0.1268778 |
| Model request count | 1 | 0 | 111 | unavailable | unavailable | 111 | 111 |
| Within-run median request duration (ms) | 1 | 0 | 2477.381 | unavailable | unavailable | 2477.381 | 2477.381 |
| Within-run median request wait (ms) | 1 | 0 | 1167.065 | unavailable | unavailable | 1167.065 | 1167.065 |
| Within-run median request transfer (ms) | 1 | 0 | 1212.422 | unavailable | unavailable | 1212.422 | 1212.422 |
| Within-run median inter-request gap (ms) | 1 | 0 | 35.2781 | unavailable | unavailable | 35.2781 | 35.2781 |
| Largest request duration (ms) | 1 | 0 | 43407.39 | unavailable | unavailable | 43407.39 | 43407.39 |
| Largest inter-request gap (ms) | 1 | 0 | 30043.45 | unavailable | unavailable | 30043.45 | 30043.45 |
| Time after last model response (ms) | 1 | 0 | 1624.163 | unavailable | unavailable | 1624.163 | 1624.163 |

#### true-myth-iterable-collection-combinators — cline @ 3.0.61 — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;true-myth-iterable-collection-combinators&quot;,&quot;5945ad1b96e228ff716275d8a273282101152508&quot;,&quot;sha256:2d5b99141677ea769219ab882b11fa652f51f525c5960ce80e49cb7dee26a79d&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 540373.2 | unavailable | unavailable | 540373.2 | 540373.2 |
| Model (ms) | 1 | 0 | 487606 | unavailable | unavailable | 487606 | 487606 |
| Non-model (ms) | 1 | 0 | 51561.6 | unavailable | unavailable | 51561.6 | 51561.6 |
| Startup (ms) | 1 | 0 | 1205.602 | unavailable | unavailable | 1205.602 | 1205.602 |
| First byte (ms) | 1 | 0 | 1116.225 | unavailable | unavailable | 1116.225 | 1116.225 |
| API turns | 1 | 0 | 116 | unavailable | unavailable | 116 | 116 |
| Input tokens | 1 | 0 | 6586155 | unavailable | unavailable | 6586155 | 6586155 |
| Output tokens | 1 | 0 | 100149 | unavailable | unavailable | 100149 | 100149 |
| Cached input (%) | 1 | 0 | 95.55074 | unavailable | unavailable | 95.55074 | 95.55074 |
| Static cost (USD) | 1 | 0 | 0.122924 | unavailable | unavailable | 0.122924 | 0.122924 |
| Model request count | 1 | 0 | 116 | unavailable | unavailable | 116 | 116 |
| Within-run median request duration (ms) | 1 | 0 | 2689.081 | unavailable | unavailable | 2689.081 | 2689.081 |
| Within-run median request wait (ms) | 1 | 0 | 1116.225 | unavailable | unavailable | 1116.225 | 1116.225 |
| Within-run median request transfer (ms) | 1 | 0 | 1566.073 | unavailable | unavailable | 1566.073 | 1566.073 |
| Within-run median inter-request gap (ms) | 1 | 0 | 41.62466 | unavailable | unavailable | 41.62466 | 41.62466 |
| Largest request duration (ms) | 1 | 0 | 36388.48 | unavailable | unavailable | 36388.48 | 36388.48 |
| Largest inter-request gap (ms) | 1 | 0 | 5501.762 | unavailable | unavailable | 5501.762 | 5501.762 |
| Time after last model response (ms) | 1 | 0 | 1443.092 | unavailable | unavailable | 1443.092 | 1443.092 |

#### cattrs-partial-structuring-recovery — qwen @ 0.22.2 — Pass (completed)

Selected attempts: 2. Task identity: \[&quot;cattrs-partial-structuring-recovery&quot;,&quot;91df27b2a20f26c35777a92f4555438b62c06345&quot;,&quot;sha256:a8c03de04a7b0d8162d83465a98ab9ef392dfe986a460d5c7e463ce1f0937aa3&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 592323.6 | 581311.4 | 603335.7 | 570299.2 | 614347.9 |
| Model (ms) | 2 | 0 | 398596.8 | 381863 | 415330.6 | 365129.1 | 432064.5 |
| Non-model (ms) | 2 | 0 | 192250.8 | 186532.8 | 197968.8 | 180814.8 | 203686.9 |
| Startup (ms) | 2 | 0 | 1475.933 | 1472.284 | 1479.581 | 1468.636 | 1483.229 |
| First byte (ms) | 2 | 0 | 1453.246 | 1429.174 | 1477.317 | 1405.103 | 1501.388 |
| API turns | 2 | 0 | 67 | 64.5 | 69.5 | 62 | 72 |
| Input tokens | 2 | 0 | 7238923 | 6600835 | 7877010 | 5962747 | 8515098 |
| Output tokens | 2 | 0 | 77704.5 | 75014.75 | 80394.25 | 72325 | 83084 |
| Cached input (%) | 2 | 0 | 98.97611 | 98.84839 | 99.10383 | 98.72067 | 99.23155 |
| Static cost (USD) | 2 | 0 | 0.07875567 | 0.07562625 | 0.08188508 | 0.07249684 | 0.08501449 |
| Model request count | 2 | 0 | 67 | 64.5 | 69.5 | 62 | 72 |
| Within-run median request duration (ms) | 2 | 0 | 2888.954 | 2867.466 | 2910.441 | 2845.979 | 2931.928 |
| Within-run median request wait (ms) | 2 | 0 | 1453.246 | 1429.174 | 1477.317 | 1405.103 | 1501.388 |
| Within-run median request transfer (ms) | 2 | 0 | 1384.941 | 1369.692 | 1400.19 | 1354.442 | 1415.439 |
| Within-run median inter-request gap (ms) | 2 | 0 | 50.97561 | 50.24251 | 51.70871 | 49.50941 | 52.44181 |
| Largest request duration (ms) | 2 | 0 | 48750.69 | 42648.25 | 54853.14 | 36545.81 | 60955.58 |
| Largest inter-request gap (ms) | 2 | 0 | 66060.35 | 63823.5 | 68297.21 | 61586.64 | 70534.06 |
| Time after last model response (ms) | 2 | 0 | 354.3509 | 317.7076 | 390.9941 | 281.0644 | 427.6374 |

#### happy-dom-deterministic-intersectionobserver — qwen @ 0.22.2 — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;happy-dom-deterministic-intersectionobserver&quot;,&quot;32b2a8e60eab482c023af377160bf294d6da0318&quot;,&quot;sha256:fa6e7f7d727d5fa5ec3367c5a2043259662d5a6877f49f3c46fd2f1edb181160&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 628372.9 | unavailable | unavailable | 628372.9 | 628372.9 |
| Model (ms) | 1 | 0 | 460494.1 | unavailable | unavailable | 460494.1 | 460494.1 |
| Non-model (ms) | 1 | 0 | 165779.5 | unavailable | unavailable | 165779.5 | 165779.5 |
| Startup (ms) | 1 | 0 | 2099.299 | unavailable | unavailable | 2099.299 | 2099.299 |
| First byte (ms) | 1 | 0 | 1412.993 | unavailable | unavailable | 1412.993 | 1412.993 |
| API turns | 1 | 0 | 92 | unavailable | unavailable | 92 | 92 |
| Input tokens | 1 | 0 | 9065932 | unavailable | unavailable | 9065932 | 9065932 |
| Output tokens | 1 | 0 | 80151 | unavailable | unavailable | 80151 | 80151 |
| Cached input (%) | 1 | 0 | 99.21133 | unavailable | unavailable | 99.21133 | 99.21133 |
| Static cost (USD) | 1 | 0 | 0.0857989 | unavailable | unavailable | 0.0857989 | 0.0857989 |
| Model request count | 1 | 0 | 92 | unavailable | unavailable | 92 | 92 |
| Within-run median request duration (ms) | 1 | 0 | 2901.132 | unavailable | unavailable | 2901.132 | 2901.132 |
| Within-run median request wait (ms) | 1 | 0 | 1412.993 | unavailable | unavailable | 1412.993 | 1412.993 |
| Within-run median request transfer (ms) | 1 | 0 | 1476.368 | unavailable | unavailable | 1476.368 | 1476.368 |
| Within-run median inter-request gap (ms) | 1 | 0 | 39.93169 | unavailable | unavailable | 39.93169 | 39.93169 |
| Largest request duration (ms) | 1 | 0 | 40385.9 | unavailable | unavailable | 40385.9 | 40385.9 |
| Largest inter-request gap (ms) | 1 | 0 | 120035.3 | unavailable | unavailable | 120035.3 | 120035.3 |
| Time after last model response (ms) | 1 | 0 | 264.4288 | unavailable | unavailable | 264.4288 | 264.4288 |

#### ink-grid-box-layout — qwen @ 0.22.2 — Pass (completed)

Selected attempts: 1. Task identity: \[&quot;ink-grid-box-layout&quot;,&quot;477fda7df7781406d2ba046eb48dd5391e964b72&quot;,&quot;sha256:b093eab15a3872c9a84f54190d76d138296cf44430826a649b15936370013c91&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 1115432 | unavailable | unavailable | 1115432 | 1115432 |
| Model (ms) | 1 | 0 | 820910.2 | unavailable | unavailable | 820910.2 | 820910.2 |
| Non-model (ms) | 1 | 0 | 292570.2 | unavailable | unavailable | 292570.2 | 292570.2 |
| Startup (ms) | 1 | 0 | 1951.233 | unavailable | unavailable | 1951.233 | 1951.233 |
| First byte (ms) | 1 | 0 | 1636.535 | unavailable | unavailable | 1636.535 | 1636.535 |
| API turns | 1 | 0 | 149 | unavailable | unavailable | 149 | 149 |
| Input tokens | 1 | 0 | 26054520 | unavailable | unavailable | 26054520 | 26054520 |
| Output tokens | 1 | 0 | 131490 | unavailable | unavailable | 131490 | 131490 |
| Cached input (%) | 1 | 0 | 99.50484 | unavailable | unavailable | 99.50484 | 99.50484 |
| Static cost (USD) | 1 | 0 | 0.1760222 | unavailable | unavailable | 0.1760222 | 0.1760222 |
| Model request count | 1 | 0 | 149 | unavailable | unavailable | 149 | 149 |
| Within-run median request duration (ms) | 1 | 0 | 3167.609 | unavailable | unavailable | 3167.609 | 3167.609 |
| Within-run median request wait (ms) | 1 | 0 | 1636.535 | unavailable | unavailable | 1636.535 | 1636.535 |
| Within-run median request transfer (ms) | 1 | 0 | 1386.12 | unavailable | unavailable | 1386.12 | 1386.12 |
| Within-run median inter-request gap (ms) | 1 | 0 | 53.12466 | unavailable | unavailable | 53.12466 | 53.12466 |
| Largest request duration (ms) | 1 | 0 | 69322.24 | unavailable | unavailable | 69322.24 | 69322.24 |
| Largest inter-request gap (ms) | 1 | 0 | 80237.77 | unavailable | unavailable | 80237.77 | 80237.77 |
| Time after last model response (ms) | 1 | 0 | 228.1801 | unavailable | unavailable | 228.1801 | 228.1801 |

#### ink-grid-box-layout — qwen @ 0.22.2 — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;ink-grid-box-layout&quot;,&quot;477fda7df7781406d2ba046eb48dd5391e964b72&quot;,&quot;sha256:b093eab15a3872c9a84f54190d76d138296cf44430826a649b15936370013c91&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 1056139 | unavailable | unavailable | 1056139 | 1056139 |
| Model (ms) | 1 | 0 | 756726.9 | unavailable | unavailable | 756726.9 | 756726.9 |
| Non-model (ms) | 1 | 0 | 297454.3 | unavailable | unavailable | 297454.3 | 297454.3 |
| Startup (ms) | 1 | 0 | 1957.825 | unavailable | unavailable | 1957.825 | 1957.825 |
| First byte (ms) | 1 | 0 | 1603.919 | unavailable | unavailable | 1603.919 | 1603.919 |
| API turns | 1 | 0 | 139 | unavailable | unavailable | 139 | 139 |
| Input tokens | 1 | 0 | 19849340 | unavailable | unavailable | 19849340 | 19849340 |
| Output tokens | 1 | 0 | 116187 | unavailable | unavailable | 116187 | 116187 |
| Cached input (%) | 1 | 0 | 99.59376 | unavailable | unavailable | 99.59376 | 99.59376 |
| Static cost (USD) | 1 | 0 | 0.1411137 | unavailable | unavailable | 0.1411137 | 0.1411137 |
| Model request count | 1 | 0 | 139 | unavailable | unavailable | 139 | 139 |
| Within-run median request duration (ms) | 1 | 0 | 2807.721 | unavailable | unavailable | 2807.721 | 2807.721 |
| Within-run median request wait (ms) | 1 | 0 | 1603.919 | unavailable | unavailable | 1603.919 | 1603.919 |
| Within-run median request transfer (ms) | 1 | 0 | 1134.609 | unavailable | unavailable | 1134.609 | 1134.609 |
| Within-run median inter-request gap (ms) | 1 | 0 | 50.88796 | unavailable | unavailable | 50.88796 | 50.88796 |
| Largest request duration (ms) | 1 | 0 | 93165.57 | unavailable | unavailable | 93165.57 | 93165.57 |
| Largest inter-request gap (ms) | 1 | 0 | 79053.58 | unavailable | unavailable | 79053.58 | 79053.58 |
| Time after last model response (ms) | 1 | 0 | 209.5892 | unavailable | unavailable | 209.5892 | 209.5892 |

#### psd-tools-blend-range-api — qwen @ 0.22.2 — Pass (completed)

Selected attempts: 2. Task identity: \[&quot;psd-tools-blend-range-api&quot;,&quot;01595992c5f4d4695251fdf58b3edb5302d3ba46&quot;,&quot;sha256:529c5d6b0b6781fc7767d390c82bd94edc9935cb30d04a304f292dfaf4780a32&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 501840 | 473392.1 | 530287.9 | 444944.1 | 558735.8 |
| Model (ms) | 2 | 0 | 418369.4 | 400026.7 | 436712.1 | 381684.1 | 455054.8 |
| Non-model (ms) | 2 | 0 | 81965.19 | 71831.01 | 92099.37 | 61696.83 | 102233.5 |
| Startup (ms) | 2 | 0 | 1505.338 | 1476.384 | 1534.293 | 1447.429 | 1563.248 |
| First byte (ms) | 2 | 0 | 1498.742 | 1496.609 | 1500.874 | 1494.477 | 1503.007 |
| API turns | 2 | 0 | 95 | 89 | 101 | 83 | 107 |
| Input tokens | 2 | 0 | 11022730 | 10348820 | 11696650 | 9674907 | 12370560 |
| Output tokens | 2 | 0 | 73381.5 | 70916.25 | 75846.75 | 68451 | 78312 |
| Cached input (%) | 2 | 0 | 99.11437 | 99.03578 | 99.19296 | 98.95719 | 99.27155 |
| Static cost (USD) | 2 | 0 | 0.0911359 | 0.0880311 | 0.09424069 | 0.0849263 | 0.09734549 |
| Model request count | 2 | 0 | 95 | 89 | 101 | 83 | 107 |
| Within-run median request duration (ms) | 2 | 0 | 2689.929 | 2684.677 | 2695.181 | 2679.426 | 2700.433 |
| Within-run median request wait (ms) | 2 | 0 | 1498.742 | 1496.609 | 1500.874 | 1494.477 | 1503.007 |
| Within-run median request transfer (ms) | 2 | 0 | 1166.465 | 1156.213 | 1176.717 | 1145.96 | 1186.97 |
| Within-run median inter-request gap (ms) | 2 | 0 | 40.88444 | 38.20776 | 43.56112 | 35.53109 | 46.23779 |
| Largest request duration (ms) | 2 | 0 | 34895.43 | 32081.39 | 37709.48 | 29267.34 | 40523.53 |
| Largest inter-request gap (ms) | 2 | 0 | 19491.04 | 16383.01 | 22599.07 | 13274.98 | 25707.1 |
| Time after last model response (ms) | 2 | 0 | 233.2501 | 228.4432 | 238.0571 | 223.6362 | 242.8641 |

#### superjson-error-stack-serialization — qwen @ 0.22.2 — Verification failure (verify_error)

Selected attempts: 3. Task identity: \[&quot;superjson-error-stack-serialization&quot;,&quot;f143004734ea2dd4090e45013a07f091f5bbaee7&quot;,&quot;sha256:9cc29a9cf9c9e48c818f56a810cf3a9a287bd7c1991b08c6610113f7ac15c3e8&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 3 | 0 | 367000.8 | 364072.3 | 399202.2 | 361143.9 | 431403.7 |
| Model (ms) | 3 | 0 | 350047.1 | 349846.8 | 378863.7 | 349646.5 | 407680.4 |
| Non-model (ms) | 3 | 0 | 15229.29 | 12058.6 | 17610.85 | 8887.906 | 19992.4 |
| Startup (ms) | 3 | 0 | 2208.858 | 2166.951 | 2969.884 | 2125.043 | 3730.909 |
| First byte (ms) | 3 | 0 | 1355.602 | 1344.165 | 1392.78 | 1332.727 | 1429.957 |
| API turns | 3 | 0 | 48 | 46.5 | 53.5 | 45 | 59 |
| Input tokens | 3 | 0 | 3945222 | 3912307 | 4910604 | 3879392 | 5875985 |
| Output tokens | 3 | 0 | 73162 | 72395 | 77159 | 71628 | 81156 |
| Cached input (%) | 3 | 0 | 98.8856 | 98.79133 | 99.02095 | 98.69705 | 99.1563 |
| Static cost (USD) | 3 | 0 | 0.06189048 | 0.06079799 | 0.06973325 | 0.05970551 | 0.07757602 |
| Model request count | 3 | 0 | 48 | 46.5 | 53.5 | 45 | 59 |
| Within-run median request duration (ms) | 3 | 0 | 2363.822 | 2316.009 | 2440.201 | 2268.196 | 2516.581 |
| Within-run median request wait (ms) | 3 | 0 | 1355.602 | 1344.165 | 1392.78 | 1332.727 | 1429.957 |
| Within-run median request transfer (ms) | 3 | 0 | 984.6305 | 961.203 | 1021.973 | 937.7755 | 1059.315 |
| Within-run median inter-request gap (ms) | 3 | 0 | 42.75587 | 41.70034 | 45.50353 | 40.64481 | 48.25119 |
| Largest request duration (ms) | 3 | 0 | 136198.6 | 126435 | 150120.5 | 116671.5 | 164042.3 |
| Largest inter-request gap (ms) | 3 | 0 | 2064.643 | 2053.611 | 2094.733 | 2042.578 | 2124.823 |
| Time after last model response (ms) | 3 | 0 | 207.7094 | 202.8502 | 274.4497 | 197.991 | 341.19 |

#### textual-richlog-follow-state — qwen @ 0.22.2 — Pass (completed)

Selected attempts: 1. Task identity: \[&quot;textual-richlog-follow-state&quot;,&quot;a12215b791587a6d94227bd30a0e9291de932106&quot;,&quot;sha256:5b0166c0ee50a230850e78d5550fe32442834eb63599802d0a99faff0ba9af87&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 1281924 | unavailable | unavailable | 1281924 | 1281924 |
| Model (ms) | 1 | 0 | 752660.1 | unavailable | unavailable | 752660.1 | 752660.1 |
| Non-model (ms) | 1 | 0 | 527577.5 | unavailable | unavailable | 527577.5 | 527577.5 |
| Startup (ms) | 1 | 0 | 1686.434 | unavailable | unavailable | 1686.434 | 1686.434 |
| First byte (ms) | 1 | 0 | 1556.993 | unavailable | unavailable | 1556.993 | 1556.993 |
| API turns | 1 | 0 | 127 | unavailable | unavailable | 127 | 127 |
| Input tokens | 1 | 0 | 17769260 | unavailable | unavailable | 17769260 | 17769260 |
| Output tokens | 1 | 0 | 135347 | unavailable | unavailable | 135347 | 135347 |
| Cached input (%) | 1 | 0 | 99.39896 | unavailable | unavailable | 99.39896 | 99.39896 |
| Static cost (USD) | 1 | 0 | 0.1502156 | unavailable | unavailable | 0.1502156 | 0.1502156 |
| Model request count | 1 | 0 | 127 | unavailable | unavailable | 127 | 127 |
| Within-run median request duration (ms) | 1 | 0 | 3475.803 | unavailable | unavailable | 3475.803 | 3475.803 |
| Within-run median request wait (ms) | 1 | 0 | 1556.993 | unavailable | unavailable | 1556.993 | 1556.993 |
| Within-run median request transfer (ms) | 1 | 0 | 1822.527 | unavailable | unavailable | 1822.527 | 1822.527 |
| Within-run median inter-request gap (ms) | 1 | 0 | 63.44517 | unavailable | unavailable | 63.44517 | 63.44517 |
| Largest request duration (ms) | 1 | 0 | 51738.14 | unavailable | unavailable | 51738.14 | 51738.14 |
| Largest inter-request gap (ms) | 1 | 0 | 159998.5 | unavailable | unavailable | 159998.5 | 159998.5 |
| Time after last model response (ms) | 1 | 0 | 308.9952 | unavailable | unavailable | 308.9952 | 308.9952 |

#### textual-richlog-follow-state — qwen @ 0.22.2 — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;textual-richlog-follow-state&quot;,&quot;a12215b791587a6d94227bd30a0e9291de932106&quot;,&quot;sha256:5b0166c0ee50a230850e78d5550fe32442834eb63599802d0a99faff0ba9af87&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 1221022 | unavailable | unavailable | 1221022 | 1221022 |
| Model (ms) | 1 | 0 | 828048.7 | unavailable | unavailable | 828048.7 | 828048.7 |
| Non-model (ms) | 1 | 0 | 390063.8 | unavailable | unavailable | 390063.8 | 390063.8 |
| Startup (ms) | 1 | 0 | 2909.115 | unavailable | unavailable | 2909.115 | 2909.115 |
| First byte (ms) | 1 | 0 | 1622.459 | unavailable | unavailable | 1622.459 | 1622.459 |
| API turns | 1 | 0 | 183 | unavailable | unavailable | 183 | 183 |
| Input tokens | 1 | 0 | 28156070 | unavailable | unavailable | 28156070 | 28156070 |
| Output tokens | 1 | 0 | 133371 | unavailable | unavailable | 133371 | 133371 |
| Cached input (%) | 1 | 0 | 99.58934 | unavailable | unavailable | 99.58934 | 99.58934 |
| Static cost (USD) | 1 | 0 | 0.1814878 | unavailable | unavailable | 0.1814878 | 0.1814878 |
| Model request count | 1 | 0 | 183 | unavailable | unavailable | 183 | 183 |
| Within-run median request duration (ms) | 1 | 0 | 3276.544 | unavailable | unavailable | 3276.544 | 3276.544 |
| Within-run median request wait (ms) | 1 | 0 | 1622.459 | unavailable | unavailable | 1622.459 | 1622.459 |
| Within-run median request transfer (ms) | 1 | 0 | 1490.462 | unavailable | unavailable | 1490.462 | 1490.462 |
| Within-run median inter-request gap (ms) | 1 | 0 | 52.94923 | unavailable | unavailable | 52.94923 | 52.94923 |
| Largest request duration (ms) | 1 | 0 | 54486.66 | unavailable | unavailable | 54486.66 | 54486.66 |
| Largest inter-request gap (ms) | 1 | 0 | 162797.6 | unavailable | unavailable | 162797.6 | 162797.6 |
| Time after last model response (ms) | 1 | 0 | 235.2017 | unavailable | unavailable | 235.2017 | 235.2017 |

#### tomlkit-toml-table-converters — qwen @ 0.22.2 — Pass (completed)

Selected attempts: 2. Task identity: \[&quot;tomlkit-toml-table-converters&quot;,&quot;962de91aaf103135f400e5108a798a59a10dc17e&quot;,&quot;sha256:86a7f7545adc060de810c3aceb9356f3048262a6e0f046d863cc114bdd98dcd3&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 795082.9 | 743424.9 | 846740.9 | 691767 | 898398.8 |
| Model (ms) | 2 | 0 | 752603.1 | 706819.6 | 798386.6 | 661036.1 | 844170.1 |
| Non-model (ms) | 2 | 0 | 40975.01 | 35102.44 | 46847.57 | 29229.88 | 52720.13 |
| Startup (ms) | 2 | 0 | 1504.815 | 1502.93 | 1506.7 | 1501.044 | 1508.586 |
| First byte (ms) | 2 | 0 | 1599.317 | 1577.278 | 1621.355 | 1555.239 | 1643.394 |
| API turns | 2 | 0 | 124 | 112 | 136 | 100 | 148 |
| Input tokens | 2 | 0 | 19707020 | 17241440 | 22172600 | 14775860 | 24638190 |
| Output tokens | 2 | 0 | 132325.5 | 127456.3 | 137194.8 | 122587 | 142064 |
| Cached input (%) | 2 | 0 | 99.19329 | 98.99483 | 99.39174 | 98.79638 | 99.59019 |
| Static cost (USD) | 2 | 0 | 0.1590092 | 0.1515161 | 0.1665023 | 0.144023 | 0.1739954 |
| Model request count | 2 | 0 | 124 | 112 | 136 | 100 | 148 |
| Within-run median request duration (ms) | 2 | 0 | 3182.591 | 3084.309 | 3280.872 | 2986.028 | 3379.154 |
| Within-run median request wait (ms) | 2 | 0 | 1599.317 | 1577.278 | 1621.355 | 1555.239 | 1643.394 |
| Within-run median request transfer (ms) | 2 | 0 | 1538.059 | 1451.189 | 1624.928 | 1364.32 | 1711.797 |
| Within-run median inter-request gap (ms) | 2 | 0 | 52.40462 | 50.42822 | 54.38102 | 48.45182 | 56.35742 |
| Largest request duration (ms) | 2 | 0 | 99374.03 | 85438.19 | 113309.9 | 71502.35 | 127245.7 |
| Largest inter-request gap (ms) | 2 | 0 | 7849.468 | 7845.991 | 7852.945 | 7842.514 | 7856.423 |
| Time after last model response (ms) | 2 | 0 | 217.5194 | 207.5826 | 227.4562 | 197.6457 | 237.393 |

#### true-myth-iterable-collection-combinators — qwen @ 0.22.2 — Pass (completed)

Selected attempts: 2. Task identity: \[&quot;true-myth-iterable-collection-combinators&quot;,&quot;5945ad1b96e228ff716275d8a273282101152508&quot;,&quot;sha256:2d5b99141677ea769219ab882b11fa652f51f525c5960ce80e49cb7dee26a79d&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 452219.8 | 432612.8 | 471826.7 | 413005.9 | 491433.6 |
| Model (ms) | 2 | 0 | 409478.8 | 393797.8 | 425159.7 | 378116.9 | 440840.7 |
| Non-model (ms) | 2 | 0 | 41253.02 | 37306.08 | 45199.96 | 33359.15 | 49146.9 |
| Startup (ms) | 2 | 0 | 1487.95 | 1466.992 | 1508.908 | 1446.034 | 1529.866 |
| First byte (ms) | 2 | 0 | 1580.767 | 1571.943 | 1589.591 | 1563.119 | 1598.416 |
| API turns | 2 | 0 | 68 | 65.5 | 70.5 | 63 | 73 |
| Input tokens | 2 | 0 | 9176917 | 8515971 | 9837862 | 7855025 | 10498810 |
| Output tokens | 2 | 0 | 81421.5 | 78301.75 | 84541.25 | 75182 | 87661 |
| Cached input (%) | 2 | 0 | 98.7689 | 98.76392 | 98.77388 | 98.75894 | 98.77886 |
| Static cost (USD) | 2 | 0 | 0.0930106 | 0.08789263 | 0.09812857 | 0.08277466 | 0.1032465 |
| Model request count | 2 | 0 | 68 | 65.5 | 70.5 | 63 | 73 |
| Within-run median request duration (ms) | 2 | 0 | 2962.336 | 2837.314 | 3087.358 | 2712.292 | 3212.38 |
| Within-run median request wait (ms) | 2 | 0 | 1580.767 | 1571.943 | 1589.591 | 1563.119 | 1598.416 |
| Within-run median request transfer (ms) | 2 | 0 | 1386.956 | 1306.31 | 1467.601 | 1225.665 | 1548.247 |
| Within-run median inter-request gap (ms) | 2 | 0 | 44.14245 | 41.64774 | 46.63717 | 39.15302 | 49.13188 |
| Largest request duration (ms) | 2 | 0 | 59354.17 | 53009.51 | 65698.84 | 46664.84 | 72043.5 |
| Largest inter-request gap (ms) | 2 | 0 | 5612.347 | 5503.291 | 5721.404 | 5394.234 | 5830.461 |
| Time after last model response (ms) | 2 | 0 | 217.5735 | 206.5798 | 228.5673 | 195.5861 | 239.561 |

### Annotated request timelines

#### pinned:cline:textual-richlog-follow-state:2:independent-linux-20260913 — most model calls among passes

cline @ 3.0.61 · textual-richlog-follow-state · Pass (completed). Calls 499 (499 successful). Median duration 3.4s; largest gap 30.1s; time after last 1.65s.

#### pinned:qwen:tomlkit-toml-table-converters:3:independent-linux-20260913 — longest single model call among passes

qwen @ 0.22.2 · tomlkit-toml-table-converters · Pass (completed). Calls 100 (100 successful). Median duration 2.99s; largest gap 7.84s; time after last 197.6457 ms.

## Population 3

| Recorded identity | Value |
| --- | --- |
| Condition | pinned |
| Model | deepseek/deepseek-v4.1-flash |
| Price book | openrouter-2026-09-04 |
| Host OS | linux |
| Host CPU | x64 |
| Host RAM (GiB; rounded) | 30.17 |
| Source | public-task-pack |
| Repository | https://github.com/datacurve-ai/deep-swe.git |
| Source revision | 0b9fabbb63b9104d678fe965e1632f2dd9eaa2ea |
| Regime | extended |
| Ignored providers | relace |
| Only provider | deepseek |
| Allow fallbacks | false |
| Configuration | unavailable |
| ORI version | unavailable |

### Coverage

| Harness @ version | Selected | Pass | Verify fail | Other | Tasks | Timing n | Timing tasks | Turns n | Input n | Output n | Cache n | Cost n | IQR tasks / successful timing tasks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| cline @ 3.0.61 | 20 | 8 | 12 | 0 | 8 | 20 | 8 | 20 | 20 | 20 | 20 | 0 | 3 / 5 |
| codex @ codex-cli 0.149.1 | 3 | 1 | 2 | 0 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 0 | 0 / 1 |
| pi @ 0.73.1 | 1 | 0 | 1 | 0 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 0 | 0 / 0 |
| qwen @ 0.22.2 | 6 | 2 | 4 | 0 | 3 | 6 | 3 | 6 | 6 | 6 | 6 | 0 | 0 / 2 |

### Selected spend by outcome

| Harness @ version | Outcome | Selected | Priced n | Missing n | Selected static spend (USD) |
| --- | --- | --- | --- | --- | --- |
| cline @ 3.0.61 | Verification failure (verify\_error) | 12 | 0 | 12 | unavailable |
| cline @ 3.0.61 | Pass (completed) | 8 | 0 | 8 | unavailable |
| codex @ codex-cli 0.149.1 | Pass (completed) | 1 | 0 | 1 | unavailable |
| codex @ codex-cli 0.149.1 | Verification failure (verify\_error) | 2 | 0 | 2 | unavailable |
| pi @ 0.73.1 | Verification failure (verify\_error) | 1 | 0 | 1 | unavailable |
| qwen @ 0.22.2 | Verification failure (verify\_error) | 4 | 0 | 4 | unavailable |
| qwen @ 0.22.2 | Pass (completed) | 2 | 0 | 2 | unavailable |

### Request-level summaries

| Harness @ version | Outcome | Runs | Median calls | Median of run median durations | Median of run median waits | Median of run median transfers | Median of run median gaps | Median time after last |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| cline @ 3.0.61 | Verification failure (verify\_error) | 12 | 198 (available n=12; missing n=0) | 2.82s (available n=12; missing n=0) | 1.2s (available n=12; missing n=0) | 1.58s (available n=12; missing n=0) | 48.65713 ms (available n=12; missing n=0) | 1.46s (available n=12; missing n=0) |
| cline @ 3.0.61 | Pass (completed) | 8 | 192 (available n=8; missing n=0) | 2.9s (available n=8; missing n=0) | 1.19s (available n=8; missing n=0) | 1.66s (available n=8; missing n=0) | 49.16222 ms (available n=8; missing n=0) | 1.51s (available n=8; missing n=0) |
| codex @ codex-cli 0.149.1 | Pass (completed) | 1 | 101 (available n=1; missing n=0) | 2.64s (available n=1; missing n=0) | 1.35s (available n=1; missing n=0) | 1.25s (available n=1; missing n=0) | 55.16514 ms (available n=1; missing n=0) | 5.14s (available n=1; missing n=0) |
| codex @ codex-cli 0.149.1 | Verification failure (verify\_error) | 2 | 109 (available n=2; missing n=0) | 2.95s (available n=2; missing n=0) | 1.41s (available n=2; missing n=0) | 1.5s (available n=2; missing n=0) | 52.39866 ms (available n=2; missing n=0) | 5.15s (available n=2; missing n=0) |
| pi @ 0.73.1 | Verification failure (verify\_error) | 1 | 115 (available n=1; missing n=0) | 2.56s (available n=1; missing n=0) | 1.41s (available n=1; missing n=0) | 1.07s (available n=1; missing n=0) | 13.59142 ms (available n=1; missing n=0) | 897.9978 ms (available n=1; missing n=0) |
| qwen @ 0.22.2 | Verification failure (verify\_error) | 4 | 107.5 (available n=4; missing n=0) | 2.68s (available n=4; missing n=0) | 1.5s (available n=4; missing n=0) | 1.18s (available n=4; missing n=0) | 45.45831 ms (available n=4; missing n=0) | 206.9394 ms (available n=4; missing n=0) |
| qwen @ 0.22.2 | Pass (completed) | 2 | 70.5 (available n=2; missing n=0) | 3.05s (available n=2; missing n=0) | 1.46s (available n=2; missing n=0) | 1.54s (available n=2; missing n=0) | 41.23141 ms (available n=2; missing n=0) | 234.7175 ms (available n=2; missing n=0) |

### Common successful tasks

#### cline @ 3.0.61 (left) vs codex @ codex-cli 0.149.1 (right)

Common successful tasks: 1. Left median of task medians: 896986.3 ms. Right median of task medians: 537209.2 ms. Median task ratio (right / left): 0.5989046.

| Common successful task | Left n | Left median (ms) | Right n | Right median (ms) | Right / left |
| --- | --- | --- | --- | --- | --- |
| psd-tools-blend-range-api | 1 | 896986.3 | 1 | 537209.2 | 0.5989046 |

#### cline @ 3.0.61 (left) vs pi @ 0.73.1 (right)

Common successful tasks: 0. Left median of task medians: unavailable. Right median of task medians: unavailable. Median task ratio (right / left): unavailable.

No common successful tasks; comparison unavailable.

#### cline @ 3.0.61 (left) vs qwen @ 0.22.2 (right)

Common successful tasks: 2. Left median of task medians: 1116532 ms. Right median of task medians: 490410.8 ms. Median task ratio (right / left): 0.4483458.

| Common successful task | Left n | Left median (ms) | Right n | Right median (ms) | Right / left |
| --- | --- | --- | --- | --- | --- |
| happy-dom-deterministic-intersectionobserver | 2 | 1267366 | 1 | 482668.4 | 0.3808437 |
| true-myth-iterable-collection-combinators | 2 | 965697.6 | 1 | 498153.1 | 0.515848 |

#### codex @ codex-cli 0.149.1 (left) vs pi @ 0.73.1 (right)

Common successful tasks: 0. Left median of task medians: unavailable. Right median of task medians: unavailable. Median task ratio (right / left): unavailable.

No common successful tasks; comparison unavailable.

#### codex @ codex-cli 0.149.1 (left) vs qwen @ 0.22.2 (right)

Common successful tasks: 0. Left median of task medians: unavailable. Right median of task medians: unavailable. Median task ratio (right / left): unavailable.

No common successful tasks; comparison unavailable.

#### pi @ 0.73.1 (left) vs qwen @ 0.22.2 (right)

Common successful tasks: 0. Left median of task medians: unavailable. Right median of task medians: unavailable. Median task ratio (right / left): unavailable.

No common successful tasks; comparison unavailable.

### Per-task outcome distributions

#### cattrs-partial-structuring-recovery — cline @ 3.0.61 — Pass (completed)

Selected attempts: 1. Task identity: \[&quot;cattrs-partial-structuring-recovery&quot;,&quot;91df27b2a20f26c35777a92f4555438b62c06345&quot;,&quot;sha256:a8c03de04a7b0d8162d83465a98ab9ef392dfe986a460d5c7e463ce1f0937aa3&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 1175832 | unavailable | unavailable | 1175832 | 1175832 |
| Model (ms) | 1 | 0 | 775932.1 | unavailable | unavailable | 775932.1 | 775932.1 |
| Non-model (ms) | 1 | 0 | 398742.7 | unavailable | unavailable | 398742.7 | 398742.7 |
| Startup (ms) | 1 | 0 | 1157.121 | unavailable | unavailable | 1157.121 | 1157.121 |
| First byte (ms) | 1 | 0 | 1209.336 | unavailable | unavailable | 1209.336 | 1209.336 |
| API turns | 1 | 0 | 183 | unavailable | unavailable | 183 | 183 |
| Input tokens | 1 | 0 | 9733002 | unavailable | unavailable | 9733002 | 9733002 |
| Output tokens | 1 | 0 | 131658 | unavailable | unavailable | 131658 | 131658 |
| Cached input (%) | 1 | 0 | 97.3631 | unavailable | unavailable | 97.3631 | 97.3631 |
| Static cost (USD) | 0 | 1 | unavailable | unavailable | unavailable | unavailable | unavailable |
| Model request count | 1 | 0 | 183 | unavailable | unavailable | 183 | 183 |
| Within-run median request duration (ms) | 1 | 0 | 2541.244 | unavailable | unavailable | 2541.244 | 2541.244 |
| Within-run median request wait (ms) | 1 | 0 | 1209.336 | unavailable | unavailable | 1209.336 | 1209.336 |
| Within-run median request transfer (ms) | 1 | 0 | 1296.646 | unavailable | unavailable | 1296.646 | 1296.646 |
| Within-run median inter-request gap (ms) | 1 | 0 | 46.35144 | unavailable | unavailable | 46.35144 | 46.35144 |
| Largest request duration (ms) | 1 | 0 | 33232.91 | unavailable | unavailable | 33232.91 | 33232.91 |
| Largest inter-request gap (ms) | 1 | 0 | 30057.69 | unavailable | unavailable | 30057.69 | 30057.69 |
| Time after last model response (ms) | 1 | 0 | 1561.44 | unavailable | unavailable | 1561.44 | 1561.44 |

#### cattrs-partial-structuring-recovery — cline @ 3.0.61 — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;cattrs-partial-structuring-recovery&quot;,&quot;91df27b2a20f26c35777a92f4555438b62c06345&quot;,&quot;sha256:a8c03de04a7b0d8162d83465a98ab9ef392dfe986a460d5c7e463ce1f0937aa3&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 1529063 | unavailable | unavailable | 1529063 | 1529063 |
| Model (ms) | 1 | 0 | 1154798 | unavailable | unavailable | 1154798 | 1154798 |
| Non-model (ms) | 1 | 0 | 373051.6 | unavailable | unavailable | 373051.6 | 373051.6 |
| Startup (ms) | 1 | 0 | 1212.759 | unavailable | unavailable | 1212.759 | 1212.759 |
| First byte (ms) | 1 | 0 | 1174.391 | unavailable | unavailable | 1174.391 | 1174.391 |
| API turns | 1 | 0 | 300 | unavailable | unavailable | 300 | 300 |
| Input tokens | 1 | 0 | 15655810 | unavailable | unavailable | 15655810 | 15655810 |
| Output tokens | 1 | 0 | 210218 | unavailable | unavailable | 210218 | 210218 |
| Cached input (%) | 1 | 0 | 97.12046 | unavailable | unavailable | 97.12046 | 97.12046 |
| Static cost (USD) | 0 | 1 | unavailable | unavailable | unavailable | unavailable | unavailable |
| Model request count | 1 | 0 | 300 | unavailable | unavailable | 300 | 300 |
| Within-run median request duration (ms) | 1 | 0 | 2506.203 | unavailable | unavailable | 2506.203 | 2506.203 |
| Within-run median request wait (ms) | 1 | 0 | 1174.391 | unavailable | unavailable | 1174.391 | 1174.391 |
| Within-run median request transfer (ms) | 1 | 0 | 1338.87 | unavailable | unavailable | 1338.87 | 1338.87 |
| Within-run median inter-request gap (ms) | 1 | 0 | 47.97721 | unavailable | unavailable | 47.97721 | 47.97721 |
| Largest request duration (ms) | 1 | 0 | 46057.58 | unavailable | unavailable | 46057.58 | 46057.58 |
| Largest inter-request gap (ms) | 1 | 0 | 30069.32 | unavailable | unavailable | 30069.32 | 30069.32 |
| Time after last model response (ms) | 1 | 0 | 1400.169 | unavailable | unavailable | 1400.169 | 1400.169 |

#### happy-dom-deterministic-intersectionobserver — cline @ 3.0.61 — Pass (completed)

Selected attempts: 2. Task identity: \[&quot;happy-dom-deterministic-intersectionobserver&quot;,&quot;32b2a8e60eab482c023af377160bf294d6da0318&quot;,&quot;sha256:fa6e7f7d727d5fa5ec3367c5a2043259662d5a6877f49f3c46fd2f1edb181160&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 1267366 | 1232814 | 1301918 | 1198262 | 1336471 |
| Model (ms) | 2 | 0 | 1150991 | 1101116 | 1200867 | 1051240 | 1250743 |
| Non-model (ms) | 2 | 0 | 114317.6 | 99135.75 | 129499.4 | 83953.94 | 144681.2 |
| Startup (ms) | 2 | 0 | 2057.288 | 1915.631 | 2198.945 | 1773.974 | 2340.602 |
| First byte (ms) | 2 | 0 | 1173.952 | 1172.176 | 1175.729 | 1170.399 | 1177.505 |
| API turns | 2 | 0 | 158 | 146 | 170 | 134 | 182 |
| Input tokens | 2 | 0 | 7728408 | 7133948 | 8322869 | 6539487 | 8917329 |
| Output tokens | 2 | 0 | 225100 | 217686.5 | 232513.5 | 210273 | 239927 |
| Cached input (%) | 2 | 0 | 94.97291 | 94.84413 | 95.10169 | 94.71536 | 95.23047 |
| Static cost (USD) | 0 | 2 | unavailable | unavailable | unavailable | unavailable | unavailable |
| Model request count | 2 | 0 | 158 | 146 | 170 | 134 | 182 |
| Within-run median request duration (ms) | 2 | 0 | 3491.864 | 3332.264 | 3651.465 | 3172.663 | 3811.065 |
| Within-run median request wait (ms) | 2 | 0 | 1173.952 | 1172.176 | 1175.729 | 1170.399 | 1177.505 |
| Within-run median request transfer (ms) | 2 | 0 | 2283.29 | 2111.59 | 2454.99 | 1939.89 | 2626.69 |
| Within-run median inter-request gap (ms) | 2 | 0 | 52.0396 | 51.7317 | 52.3475 | 51.42381 | 52.6554 |
| Largest request duration (ms) | 2 | 0 | 87148.28 | 86862.67 | 87433.88 | 86577.07 | 87719.49 |
| Largest inter-request gap (ms) | 2 | 0 | 30057.59 | 30055.72 | 30059.46 | 30053.85 | 30061.33 |
| Time after last model response (ms) | 2 | 0 | 1801.011 | 1642.726 | 1959.297 | 1484.441 | 2117.582 |

#### happy-dom-deterministic-intersectionobserver — cline @ 3.0.61 — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;happy-dom-deterministic-intersectionobserver&quot;,&quot;32b2a8e60eab482c023af377160bf294d6da0318&quot;,&quot;sha256:fa6e7f7d727d5fa5ec3367c5a2043259662d5a6877f49f3c46fd2f1edb181160&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 1121033 | unavailable | unavailable | 1121033 | 1121033 |
| Model (ms) | 1 | 0 | 940267.7 | unavailable | unavailable | 940267.7 | 940267.7 |
| Non-model (ms) | 1 | 0 | 178943.3 | unavailable | unavailable | 178943.3 | 178943.3 |
| Startup (ms) | 1 | 0 | 1822.115 | unavailable | unavailable | 1822.115 | 1822.115 |
| First byte (ms) | 1 | 0 | 1169.085 | unavailable | unavailable | 1169.085 | 1169.085 |
| API turns | 1 | 0 | 187 | unavailable | unavailable | 187 | 187 |
| Input tokens | 1 | 0 | 9684870 | unavailable | unavailable | 9684870 | 9684870 |
| Output tokens | 1 | 0 | 184593 | unavailable | unavailable | 184593 | 184593 |
| Cached input (%) | 1 | 0 | 96.26628 | unavailable | unavailable | 96.26628 | 96.26628 |
| Static cost (USD) | 0 | 1 | unavailable | unavailable | unavailable | unavailable | unavailable |
| Model request count | 1 | 0 | 187 | unavailable | unavailable | 187 | 187 |
| Within-run median request duration (ms) | 1 | 0 | 3072.752 | unavailable | unavailable | 3072.752 | 3072.752 |
| Within-run median request wait (ms) | 1 | 0 | 1169.085 | unavailable | unavailable | 1169.085 | 1169.085 |
| Within-run median request transfer (ms) | 1 | 0 | 1865.355 | unavailable | unavailable | 1865.355 | 1865.355 |
| Within-run median inter-request gap (ms) | 1 | 0 | 51.52115 | unavailable | unavailable | 51.52115 | 51.52115 |
| Largest request duration (ms) | 1 | 0 | 42904.19 | unavailable | unavailable | 42904.19 | 42904.19 |
| Largest inter-request gap (ms) | 1 | 0 | 30040.12 | unavailable | unavailable | 30040.12 | 30040.12 |
| Time after last model response (ms) | 1 | 0 | 1691.827 | unavailable | unavailable | 1691.827 | 1691.827 |

#### ink-grid-box-layout — cline @ 3.0.61 — Verification failure (verify_error)

Selected attempts: 2. Task identity: \[&quot;ink-grid-box-layout&quot;,&quot;477fda7df7781406d2ba046eb48dd5391e964b72&quot;,&quot;sha256:b093eab15a3872c9a84f54190d76d138296cf44430826a649b15936370013c91&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 1310680 | 1221337 | 1400023 | 1131994 | 1489366 |
| Model (ms) | 2 | 0 | 805332.8 | 791731.8 | 818933.8 | 778130.8 | 832534.8 |
| Non-model (ms) | 2 | 0 | 503634 | 427894.7 | 579373.4 | 352155.4 | 655112.7 |
| Startup (ms) | 2 | 0 | 1713.206 | 1710.42 | 1715.991 | 1707.635 | 1718.776 |
| First byte (ms) | 2 | 0 | 1214.124 | 1211.493 | 1216.754 | 1208.863 | 1219.384 |
| API turns | 2 | 0 | 194.5 | 185.25 | 203.75 | 176 | 213 |
| Input tokens | 2 | 0 | 10714550 | 10260370 | 11168730 | 9806193 | 11622920 |
| Output tokens | 2 | 0 | 131851.5 | 131528.8 | 132174.3 | 131206 | 132497 |
| Cached input (%) | 2 | 0 | 97.56223 | 97.48373 | 97.64073 | 97.40522 | 97.71924 |
| Static cost (USD) | 0 | 2 | unavailable | unavailable | unavailable | unavailable | unavailable |
| Model request count | 2 | 0 | 194.5 | 185.25 | 203.75 | 176 | 213 |
| Within-run median request duration (ms) | 2 | 0 | 2508.179 | 2494.852 | 2521.506 | 2481.525 | 2534.833 |
| Within-run median request wait (ms) | 2 | 0 | 1214.124 | 1211.493 | 1216.754 | 1208.863 | 1219.384 |
| Within-run median request transfer (ms) | 2 | 0 | 1268.118 | 1224.104 | 1312.131 | 1180.091 | 1356.145 |
| Within-run median inter-request gap (ms) | 2 | 0 | 47.60612 | 46.74066 | 48.47159 | 45.87519 | 49.33706 |
| Largest request duration (ms) | 2 | 0 | 50169.95 | 46931.8 | 53408.09 | 43693.65 | 56646.24 |
| Largest inter-request gap (ms) | 2 | 0 | 30051.37 | 30048.88 | 30053.87 | 30046.38 | 30056.36 |
| Time after last model response (ms) | 2 | 0 | 1610.817 | 1552.87 | 1668.763 | 1494.923 | 1726.71 |

#### psd-tools-blend-range-api — cline @ 3.0.61 — Pass (completed)

Selected attempts: 1. Task identity: \[&quot;psd-tools-blend-range-api&quot;,&quot;01595992c5f4d4695251fdf58b3edb5302d3ba46&quot;,&quot;sha256:529c5d6b0b6781fc7767d390c82bd94edc9935cb30d04a304f292dfaf4780a32&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 896986.3 | unavailable | unavailable | 896986.3 | 896986.3 |
| Model (ms) | 1 | 0 | 789606.7 | unavailable | unavailable | 789606.7 | 789606.7 |
| Non-model (ms) | 1 | 0 | 106104.4 | unavailable | unavailable | 106104.4 | 106104.4 |
| Startup (ms) | 1 | 0 | 1275.2 | unavailable | unavailable | 1275.2 | 1275.2 |
| First byte (ms) | 1 | 0 | 1184.554 | unavailable | unavailable | 1184.554 | 1184.554 |
| API turns | 1 | 0 | 214 | unavailable | unavailable | 214 | 214 |
| Input tokens | 1 | 0 | 11424030 | unavailable | unavailable | 11424030 | 11424030 |
| Output tokens | 1 | 0 | 148126 | unavailable | unavailable | 148126 | 148126 |
| Cached input (%) | 1 | 0 | 96.72918 | unavailable | unavailable | 96.72918 | 96.72918 |
| Static cost (USD) | 0 | 1 | unavailable | unavailable | unavailable | unavailable | unavailable |
| Model request count | 1 | 0 | 214 | unavailable | unavailable | 214 | 214 |
| Within-run median request duration (ms) | 1 | 0 | 2529.129 | unavailable | unavailable | 2529.129 | 2529.129 |
| Within-run median request wait (ms) | 1 | 0 | 1184.554 | unavailable | unavailable | 1184.554 | 1184.554 |
| Within-run median request transfer (ms) | 1 | 0 | 1330.344 | unavailable | unavailable | 1330.344 | 1330.344 |
| Within-run median inter-request gap (ms) | 1 | 0 | 45.86628 | unavailable | unavailable | 45.86628 | 45.86628 |
| Largest request duration (ms) | 1 | 0 | 24054.23 | unavailable | unavailable | 24054.23 | 24054.23 |
| Largest inter-request gap (ms) | 1 | 0 | 20060.79 | unavailable | unavailable | 20060.79 | 20060.79 |
| Time after last model response (ms) | 1 | 0 | 1209.517 | unavailable | unavailable | 1209.517 | 1209.517 |

#### psd-tools-blend-range-api — cline @ 3.0.61 — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;psd-tools-blend-range-api&quot;,&quot;01595992c5f4d4695251fdf58b3edb5302d3ba46&quot;,&quot;sha256:529c5d6b0b6781fc7767d390c82bd94edc9935cb30d04a304f292dfaf4780a32&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 1141624 | unavailable | unavailable | 1141624 | 1141624 |
| Model (ms) | 1 | 0 | 961798.7 | unavailable | unavailable | 961798.7 | 961798.7 |
| Non-model (ms) | 1 | 0 | 178539.9 | unavailable | unavailable | 178539.9 | 178539.9 |
| Startup (ms) | 1 | 0 | 1285.407 | unavailable | unavailable | 1285.407 | 1285.407 |
| First byte (ms) | 1 | 0 | 1242.644 | unavailable | unavailable | 1242.644 | 1242.644 |
| API turns | 1 | 0 | 209 | unavailable | unavailable | 209 | 209 |
| Input tokens | 1 | 0 | 11223910 | unavailable | unavailable | 11223910 | 11223910 |
| Output tokens | 1 | 0 | 189242 | unavailable | unavailable | 189242 | 189242 |
| Cached input (%) | 1 | 0 | 96.70557 | unavailable | unavailable | 96.70557 | 96.70557 |
| Static cost (USD) | 0 | 1 | unavailable | unavailable | unavailable | unavailable | unavailable |
| Model request count | 1 | 0 | 209 | unavailable | unavailable | 209 | 209 |
| Within-run median request duration (ms) | 1 | 0 | 2968.383 | unavailable | unavailable | 2968.383 | 2968.383 |
| Within-run median request wait (ms) | 1 | 0 | 1242.644 | unavailable | unavailable | 1242.644 | 1242.644 |
| Within-run median request transfer (ms) | 1 | 0 | 1696.782 | unavailable | unavailable | 1696.782 | 1696.782 |
| Within-run median inter-request gap (ms) | 1 | 0 | 49.8717 | unavailable | unavailable | 49.8717 | 49.8717 |
| Largest request duration (ms) | 1 | 0 | 39879.76 | unavailable | unavailable | 39879.76 | 39879.76 |
| Largest inter-request gap (ms) | 1 | 0 | 25209.23 | unavailable | unavailable | 25209.23 | 25209.23 |
| Time after last model response (ms) | 1 | 0 | 1545.456 | unavailable | unavailable | 1545.456 | 1545.456 |

#### superjson-error-stack-serialization — cline @ 3.0.61 — Verification failure (verify_error)

Selected attempts: 3. Task identity: \[&quot;superjson-error-stack-serialization&quot;,&quot;f143004734ea2dd4090e45013a07f091f5bbaee7&quot;,&quot;sha256:9cc29a9cf9c9e48c818f56a810cf3a9a287bd7c1991b08c6610113f7ac15c3e8&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 3 | 0 | 318544.3 | 314510.8 | 446415.1 | 310477.3 | 574285.9 |
| Model (ms) | 3 | 0 | 301784.7 | 298658.6 | 424238 | 295532.6 | 546691.2 |
| Non-model (ms) | 3 | 0 | 14933.78 | 14007.49 | 20320.04 | 13081.19 | 25706.3 |
| Startup (ms) | 3 | 0 | 1863.504 | 1844.668 | 1875.942 | 1825.832 | 1888.38 |
| First byte (ms) | 3 | 0 | 1175.861 | 1139.434 | 1197.763 | 1103.007 | 1219.665 |
| API turns | 3 | 0 | 48 | 47.5 | 64 | 47 | 80 |
| Input tokens | 3 | 0 | 2378713 | 2341563 | 3275152 | 2304413 | 4171591 |
| Output tokens | 3 | 0 | 64939 | 63675 | 91285 | 62411 | 117631 |
| Cached input (%) | 3 | 0 | 96.26102 | 96.16724 | 96.35798 | 96.07346 | 96.45493 |
| Static cost (USD) | 0 | 3 | unavailable | unavailable | unavailable | unavailable | unavailable |
| Model request count | 3 | 0 | 48 | 47.5 | 64 | 47 | 80 |
| Within-run median request duration (ms) | 3 | 0 | 2741.905 | 2466.733 | 3074.591 | 2191.561 | 3407.277 |
| Within-run median request wait (ms) | 3 | 0 | 1175.861 | 1139.434 | 1197.763 | 1103.007 | 1219.665 |
| Within-run median request transfer (ms) | 3 | 0 | 1363.567 | 1199.345 | 1738.265 | 1035.124 | 2112.964 |
| Within-run median inter-request gap (ms) | 3 | 0 | 36.40737 | 35.37547 | 41.56076 | 34.34357 | 46.71415 |
| Largest request duration (ms) | 3 | 0 | 134655.2 | 114653.1 | 155562.6 | 94650.87 | 176470 |
| Largest inter-request gap (ms) | 3 | 0 | 2069.016 | 2050.94 | 2087.376 | 2032.865 | 2105.735 |
| Time after last model response (ms) | 3 | 0 | 1368.834 | 1267.294 | 1397.906 | 1165.753 | 1426.978 |

#### textual-richlog-follow-state — cline @ 3.0.61 — Verification failure (verify_error)

Selected attempts: 3. Task identity: \[&quot;textual-richlog-follow-state&quot;,&quot;a12215b791587a6d94227bd30a0e9291de932106&quot;,&quot;sha256:5b0166c0ee50a230850e78d5550fe32442834eb63599802d0a99faff0ba9af87&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 3 | 0 | 2481179 | 2324976 | 2487823 | 2168773 | 2494467 |
| Model (ms) | 3 | 0 | 1986939 | 1922966 | 2181228 | 1858993 | 2375516 |
| Non-model (ms) | 3 | 0 | 308511.6 | 213066.1 | 400723.1 | 117620.5 | 492934.7 |
| Startup (ms) | 3 | 0 | 1305.797 | 1287.368 | 1317.918 | 1268.938 | 1330.039 |
| First byte (ms) | 3 | 0 | 1237.235 | 1207.438 | 1245.528 | 1177.641 | 1253.821 |
| API turns | 3 | 0 | 298 | 290 | 360 | 282 | 422 |
| Input tokens | 3 | 0 | 15499040 | 14642970 | 18499100 | 13786900 | 21499170 |
| Output tokens | 3 | 0 | 354190 | 353068.5 | 407605.5 | 351947 | 461021 |
| Cached input (%) | 3 | 0 | 95.60706 | 95.50424 | 96.08045 | 95.40141 | 96.55384 |
| Static cost (USD) | 0 | 3 | unavailable | unavailable | unavailable | unavailable | unavailable |
| Model request count | 3 | 0 | 298 | 290 | 360 | 282 | 422 |
| Within-run median request duration (ms) | 3 | 0 | 3706.267 | 3300.273 | 3890.339 | 2894.279 | 4074.412 |
| Within-run median request wait (ms) | 3 | 0 | 1237.235 | 1207.438 | 1245.528 | 1177.641 | 1253.821 |
| Within-run median request transfer (ms) | 3 | 0 | 2484.311 | 2046.644 | 2629.88 | 1608.976 | 2775.448 |
| Within-run median inter-request gap (ms) | 3 | 0 | 66.22215 | 62.04031 | 69.59406 | 57.85847 | 72.96598 |
| Largest request duration (ms) | 3 | 0 | 58559.76 | 56457.8 | 62345.51 | 54355.84 | 66131.25 |
| Largest inter-request gap (ms) | 3 | 0 | 30078.96 | 22789.68 | 30080.36 | 15500.4 | 30081.75 |
| Time after last model response (ms) | 3 | 0 | 1375.644 | 1308.99 | 1479.322 | 1242.335 | 1582.999 |

#### tomlkit-toml-table-converters — cline @ 3.0.61 — Pass (completed)

Selected attempts: 2. Task identity: \[&quot;tomlkit-toml-table-converters&quot;,&quot;962de91aaf103135f400e5108a798a59a10dc17e&quot;,&quot;sha256:86a7f7545adc060de810c3aceb9356f3048262a6e0f046d863cc114bdd98dcd3&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 1468044 | 1374716 | 1561373 | 1281388 | 1654701 |
| Model (ms) | 2 | 0 | 1434753 | 1344486 | 1525020 | 1254220 | 1615286 |
| Non-model (ms) | 2 | 0 | 32104.07 | 29035.87 | 35172.27 | 25967.67 | 38240.46 |
| Startup (ms) | 2 | 0 | 1187.161 | 1180.548 | 1193.773 | 1173.936 | 1200.385 |
| First byte (ms) | 2 | 0 | 1197.105 | 1191.757 | 1202.453 | 1186.409 | 1207.801 |
| API turns | 2 | 0 | 241 | 221 | 261 | 201 | 281 |
| Input tokens | 2 | 0 | 13179550 | 12167900 | 14191190 | 11156260 | 15202840 |
| Output tokens | 2 | 0 | 285517 | 265278.5 | 305755.5 | 245040 | 325994 |
| Cached input (%) | 2 | 0 | 96.52808 | 96.32834 | 96.72782 | 96.12859 | 96.92757 |
| Static cost (USD) | 0 | 2 | unavailable | unavailable | unavailable | unavailable | unavailable |
| Model request count | 2 | 0 | 241 | 221 | 261 | 201 | 281 |
| Within-run median request duration (ms) | 2 | 0 | 2857.871 | 2808.87 | 2906.871 | 2759.87 | 2955.872 |
| Within-run median request wait (ms) | 2 | 0 | 1197.105 | 1191.757 | 1202.453 | 1186.409 | 1207.801 |
| Within-run median request transfer (ms) | 2 | 0 | 1596.624 | 1575.656 | 1617.592 | 1554.688 | 1638.56 |
| Within-run median inter-request gap (ms) | 2 | 0 | 49.92883 | 48.8103 | 51.04737 | 47.69176 | 52.16591 |
| Largest request duration (ms) | 2 | 0 | 93431.3 | 83811.72 | 103050.9 | 74192.13 | 112670.5 |
| Largest inter-request gap (ms) | 2 | 0 | 7826.041 | 7819.133 | 7832.949 | 7812.224 | 7839.858 |
| Time after last model response (ms) | 2 | 0 | 1264.309 | 1262.693 | 1265.924 | 1261.078 | 1267.539 |

#### true-myth-iterable-collection-combinators — cline @ 3.0.61 — Pass (completed)

Selected attempts: 2. Task identity: \[&quot;true-myth-iterable-collection-combinators&quot;,&quot;5945ad1b96e228ff716275d8a273282101152508&quot;,&quot;sha256:2d5b99141677ea769219ab882b11fa652f51f525c5960ce80e49cb7dee26a79d&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 965697.6 | 810681.4 | 1120714 | 655665.2 | 1275730 |
| Model (ms) | 2 | 0 | 809861.2 | 700364.1 | 919358.4 | 590867 | 1028855 |
| Non-model (ms) | 2 | 0 | 154630.7 | 109113.7 | 200147.6 | 63596.72 | 245664.6 |
| Startup (ms) | 2 | 0 | 1205.653 | 1203.572 | 1207.735 | 1201.49 | 1209.817 |
| First byte (ms) | 2 | 0 | 1176.42 | 1168.514 | 1184.326 | 1160.608 | 1192.232 |
| API turns | 2 | 0 | 159.5 | 137.75 | 181.25 | 116 | 203 |
| Input tokens | 2 | 0 | 8691377 | 7560200 | 9822553 | 6429024 | 10953730 |
| Output tokens | 2 | 0 | 162533.5 | 143347.3 | 181719.8 | 124161 | 200906 |
| Cached input (%) | 2 | 0 | 95.25128 | 94.99084 | 95.51173 | 94.7304 | 95.77217 |
| Static cost (USD) | 0 | 2 | unavailable | unavailable | unavailable | unavailable | unavailable |
| Model request count | 2 | 0 | 159.5 | 137.75 | 181.25 | 116 | 203 |
| Within-run median request duration (ms) | 2 | 0 | 2977.839 | 2906.638 | 3049.041 | 2835.437 | 3120.242 |
| Within-run median request wait (ms) | 2 | 0 | 1176.42 | 1168.514 | 1184.326 | 1160.608 | 1192.232 |
| Within-run median request transfer (ms) | 2 | 0 | 1750.626 | 1717.421 | 1783.831 | 1684.216 | 1817.037 |
| Within-run median inter-request gap (ms) | 2 | 0 | 46.50425 | 44.44004 | 48.56846 | 42.37583 | 50.63267 |
| Largest request duration (ms) | 2 | 0 | 51210.99 | 50010.53 | 52411.46 | 48810.06 | 53611.92 |
| Largest inter-request gap (ms) | 2 | 0 | 30046.27 | 30043.91 | 30048.63 | 30041.55 | 30050.99 |
| Time after last model response (ms) | 2 | 0 | 1857.168 | 1700.454 | 2013.881 | 1543.741 | 2170.594 |

#### true-myth-iterable-collection-combinators — cline @ 3.0.61 — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;true-myth-iterable-collection-combinators&quot;,&quot;5945ad1b96e228ff716275d8a273282101152508&quot;,&quot;sha256:2d5b99141677ea769219ab882b11fa652f51f525c5960ce80e49cb7dee26a79d&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 642069.2 | unavailable | unavailable | 642069.2 | 642069.2 |
| Model (ms) | 1 | 0 | 607219.4 | unavailable | unavailable | 607219.4 | 607219.4 |
| Non-model (ms) | 1 | 0 | 33673.39 | unavailable | unavailable | 33673.39 | 33673.39 |
| Startup (ms) | 1 | 0 | 1176.469 | unavailable | unavailable | 1176.469 | 1176.469 |
| First byte (ms) | 1 | 0 | 1183.441 | unavailable | unavailable | 1183.441 | 1183.441 |
| API turns | 1 | 0 | 129 | unavailable | unavailable | 129 | 129 |
| Input tokens | 1 | 0 | 6996884 | unavailable | unavailable | 6996884 | 6996884 |
| Output tokens | 1 | 0 | 119027 | unavailable | unavailable | 119027 | 119027 |
| Cached input (%) | 1 | 0 | 95.79579 | unavailable | unavailable | 95.79579 | 95.79579 |
| Static cost (USD) | 0 | 1 | unavailable | unavailable | unavailable | unavailable | unavailable |
| Model request count | 1 | 0 | 129 | unavailable | unavailable | 129 | 129 |
| Within-run median request duration (ms) | 1 | 0 | 2714.913 | unavailable | unavailable | 2714.913 | 2714.913 |
| Within-run median request wait (ms) | 1 | 0 | 1183.441 | unavailable | unavailable | 1183.441 | 1183.441 |
| Within-run median request transfer (ms) | 1 | 0 | 1554.087 | unavailable | unavailable | 1554.087 | 1554.087 |
| Within-run median inter-request gap (ms) | 1 | 0 | 38.35701 | unavailable | unavailable | 38.35701 | 38.35701 |
| Largest request duration (ms) | 1 | 0 | 48594.49 | unavailable | unavailable | 48594.49 | 48594.49 |
| Largest inter-request gap (ms) | 1 | 0 | 3773.867 | unavailable | unavailable | 3773.867 | 3773.867 |
| Time after last model response (ms) | 1 | 0 | 2498.083 | unavailable | unavailable | 2498.083 | 2498.083 |

#### psd-tools-blend-range-api — codex @ codex-cli 0.149.1 — Pass (completed)

Selected attempts: 1. Task identity: \[&quot;psd-tools-blend-range-api&quot;,&quot;01595992c5f4d4695251fdf58b3edb5302d3ba46&quot;,&quot;sha256:529c5d6b0b6781fc7767d390c82bd94edc9935cb30d04a304f292dfaf4780a32&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 537209.2 | unavailable | unavailable | 537209.2 | 537209.2 |
| Model (ms) | 1 | 0 | 444008.8 | unavailable | unavailable | 444008.8 | 444008.8 |
| Non-model (ms) | 1 | 0 | 92173.32 | unavailable | unavailable | 92173.32 | 92173.32 |
| Startup (ms) | 1 | 0 | 1027.164 | unavailable | unavailable | 1027.164 | 1027.164 |
| First byte (ms) | 1 | 0 | 1353.338 | unavailable | unavailable | 1353.338 | 1353.338 |
| API turns | 1 | 0 | 101 | unavailable | unavailable | 101 | 101 |
| Input tokens | 1 | 0 | 7296046 | unavailable | unavailable | 7296046 | 7296046 |
| Output tokens | 1 | 0 | 69643 | unavailable | unavailable | 69643 | 69643 |
| Cached input (%) | 1 | 0 | 99.15902 | unavailable | unavailable | 99.15902 | 99.15902 |
| Static cost (USD) | 0 | 1 | unavailable | unavailable | unavailable | unavailable | unavailable |
| Model request count | 1 | 0 | 101 | unavailable | unavailable | 101 | 101 |
| Within-run median request duration (ms) | 1 | 0 | 2640.834 | unavailable | unavailable | 2640.834 | 2640.834 |
| Within-run median request wait (ms) | 1 | 0 | 1353.338 | unavailable | unavailable | 1353.338 | 1353.338 |
| Within-run median request transfer (ms) | 1 | 0 | 1245.082 | unavailable | unavailable | 1245.082 | 1245.082 |
| Within-run median inter-request gap (ms) | 1 | 0 | 55.16514 | unavailable | unavailable | 55.16514 | 55.16514 |
| Largest request duration (ms) | 1 | 0 | 29488.75 | unavailable | unavailable | 29488.75 | 29488.75 |
| Largest inter-request gap (ms) | 1 | 0 | 12992.91 | unavailable | unavailable | 12992.91 | 12992.91 |
| Time after last model response (ms) | 1 | 0 | 5140.061 | unavailable | unavailable | 5140.061 | 5140.061 |

#### superjson-error-stack-serialization — codex @ codex-cli 0.149.1 — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;superjson-error-stack-serialization&quot;,&quot;f143004734ea2dd4090e45013a07f091f5bbaee7&quot;,&quot;sha256:9cc29a9cf9c9e48c818f56a810cf3a9a287bd7c1991b08c6610113f7ac15c3e8&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 392792.8 | unavailable | unavailable | 392792.8 | 392792.8 |
| Model (ms) | 1 | 0 | 368729.7 | unavailable | unavailable | 368729.7 | 368729.7 |
| Non-model (ms) | 1 | 0 | 22809.34 | unavailable | unavailable | 22809.34 | 22809.34 |
| Startup (ms) | 1 | 0 | 1253.787 | unavailable | unavailable | 1253.787 | 1253.787 |
| First byte (ms) | 1 | 0 | 1301.142 | unavailable | unavailable | 1301.142 | 1301.142 |
| API turns | 1 | 0 | 51 | unavailable | unavailable | 51 | 51 |
| Input tokens | 1 | 0 | 3523985 | unavailable | unavailable | 3523985 | 3523985 |
| Output tokens | 1 | 0 | 73517 | unavailable | unavailable | 73517 | 73517 |
| Cached input (%) | 1 | 0 | 98.97159 | unavailable | unavailable | 98.97159 | 98.97159 |
| Static cost (USD) | 0 | 1 | unavailable | unavailable | unavailable | unavailable | unavailable |
| Model request count | 1 | 0 | 51 | unavailable | unavailable | 51 | 51 |
| Within-run median request duration (ms) | 1 | 0 | 2620.521 | unavailable | unavailable | 2620.521 | 2620.521 |
| Within-run median request wait (ms) | 1 | 0 | 1301.142 | unavailable | unavailable | 1301.142 | 1301.142 |
| Within-run median request transfer (ms) | 1 | 0 | 1307.821 | unavailable | unavailable | 1307.821 | 1307.821 |
| Within-run median inter-request gap (ms) | 1 | 0 | 48.41661 | unavailable | unavailable | 48.41661 | 48.41661 |
| Largest request duration (ms) | 1 | 0 | 63805.79 | unavailable | unavailable | 63805.79 | 63805.79 |
| Largest inter-request gap (ms) | 1 | 0 | 2118.371 | unavailable | unavailable | 2118.371 | 2118.371 |
| Time after last model response (ms) | 1 | 0 | 5135.204 | unavailable | unavailable | 5135.204 | 5135.204 |

#### textual-richlog-follow-state — codex @ codex-cli 0.149.1 — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;textual-richlog-follow-state&quot;,&quot;a12215b791587a6d94227bd30a0e9291de932106&quot;,&quot;sha256:5b0166c0ee50a230850e78d5550fe32442834eb63599802d0a99faff0ba9af87&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 1493861 | unavailable | unavailable | 1493861 | 1493861 |
| Model (ms) | 1 | 0 | 770206.3 | unavailable | unavailable | 770206.3 | 770206.3 |
| Non-model (ms) | 1 | 0 | 722663.2 | unavailable | unavailable | 722663.2 | 722663.2 |
| Startup (ms) | 1 | 0 | 991.7094 | unavailable | unavailable | 991.7094 | 991.7094 |
| First byte (ms) | 1 | 0 | 1525.976 | unavailable | unavailable | 1525.976 | 1525.976 |
| API turns | 1 | 0 | 167 | unavailable | unavailable | 167 | 167 |
| Input tokens | 1 | 0 | 18036970 | unavailable | unavailable | 18036970 | 18036970 |
| Output tokens | 1 | 0 | 118708 | unavailable | unavailable | 118708 | 118708 |
| Cached input (%) | 1 | 0 | 99.48419 | unavailable | unavailable | 99.48419 | 99.48419 |
| Static cost (USD) | 0 | 1 | unavailable | unavailable | unavailable | unavailable | unavailable |
| Model request count | 1 | 0 | 167 | unavailable | unavailable | 167 | 167 |
| Within-run median request duration (ms) | 1 | 0 | 3271.79 | unavailable | unavailable | 3271.79 | 3271.79 |
| Within-run median request wait (ms) | 1 | 0 | 1525.976 | unavailable | unavailable | 1525.976 | 1525.976 |
| Within-run median request transfer (ms) | 1 | 0 | 1699.432 | unavailable | unavailable | 1699.432 | 1699.432 |
| Within-run median inter-request gap (ms) | 1 | 0 | 56.38071 | unavailable | unavailable | 56.38071 | 56.38071 |
| Largest request duration (ms) | 1 | 0 | 19419.81 | unavailable | unavailable | 19419.81 | 19419.81 |
| Largest inter-request gap (ms) | 1 | 0 | 130602.1 | unavailable | unavailable | 130602.1 | 130602.1 |
| Time after last model response (ms) | 1 | 0 | 5157.937 | unavailable | unavailable | 5157.937 | 5157.937 |

#### ink-grid-box-layout — pi @ 0.73.1 — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;ink-grid-box-layout&quot;,&quot;477fda7df7781406d2ba046eb48dd5391e964b72&quot;,&quot;sha256:b093eab15a3872c9a84f54190d76d138296cf44430826a649b15936370013c91&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 1108870 | unavailable | unavailable | 1108870 | 1108870 |
| Model (ms) | 1 | 0 | 535348.4 | unavailable | unavailable | 535348.4 | 535348.4 |
| Non-model (ms) | 1 | 0 | 572198.6 | unavailable | unavailable | 572198.6 | 572198.6 |
| Startup (ms) | 1 | 0 | 1322.67 | unavailable | unavailable | 1322.67 | 1322.67 |
| First byte (ms) | 1 | 0 | 1409.1 | unavailable | unavailable | 1409.1 | 1409.1 |
| API turns | 1 | 0 | 115 | unavailable | unavailable | 115 | 115 |
| Input tokens | 1 | 0 | 10591880 | unavailable | unavailable | 10591880 | 10591880 |
| Output tokens | 1 | 0 | 88637 | unavailable | unavailable | 88637 | 88637 |
| Cached input (%) | 1 | 0 | 98.39992 | unavailable | unavailable | 98.39992 | 98.39992 |
| Static cost (USD) | 0 | 1 | unavailable | unavailable | unavailable | unavailable | unavailable |
| Model request count | 1 | 0 | 115 | unavailable | unavailable | 115 | 115 |
| Within-run median request duration (ms) | 1 | 0 | 2563.286 | unavailable | unavailable | 2563.286 | 2563.286 |
| Within-run median request wait (ms) | 1 | 0 | 1409.1 | unavailable | unavailable | 1409.1 | 1409.1 |
| Within-run median request transfer (ms) | 1 | 0 | 1067.929 | unavailable | unavailable | 1067.929 | 1067.929 |
| Within-run median inter-request gap (ms) | 1 | 0 | 13.59142 | unavailable | unavailable | 13.59142 | 13.59142 |
| Largest request duration (ms) | 1 | 0 | 32926.33 | unavailable | unavailable | 32926.33 | 32926.33 |
| Largest inter-request gap (ms) | 1 | 0 | 90458.45 | unavailable | unavailable | 90458.45 | 90458.45 |
| Time after last model response (ms) | 1 | 0 | 897.9978 | unavailable | unavailable | 897.9978 | 897.9978 |

#### happy-dom-deterministic-intersectionobserver — qwen @ 0.22.2 — Pass (completed)

Selected attempts: 1. Task identity: \[&quot;happy-dom-deterministic-intersectionobserver&quot;,&quot;32b2a8e60eab482c023af377160bf294d6da0318&quot;,&quot;sha256:fa6e7f7d727d5fa5ec3367c5a2043259662d5a6877f49f3c46fd2f1edb181160&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 482668.4 | unavailable | unavailable | 482668.4 | 482668.4 |
| Model (ms) | 1 | 0 | 429827.6 | unavailable | unavailable | 429827.6 | 429827.6 |
| Non-model (ms) | 1 | 0 | 50793.82 | unavailable | unavailable | 50793.82 | 50793.82 |
| Startup (ms) | 1 | 0 | 2046.956 | unavailable | unavailable | 2046.956 | 2046.956 |
| First byte (ms) | 1 | 0 | 1340.586 | unavailable | unavailable | 1340.586 | 1340.586 |
| API turns | 1 | 0 | 62 | unavailable | unavailable | 62 | 62 |
| Input tokens | 1 | 0 | 5702684 | unavailable | unavailable | 5702684 | 5702684 |
| Output tokens | 1 | 0 | 80195 | unavailable | unavailable | 80195 | 80195 |
| Cached input (%) | 1 | 0 | 98.64829 | unavailable | unavailable | 98.64829 | 98.64829 |
| Static cost (USD) | 0 | 1 | unavailable | unavailable | unavailable | unavailable | unavailable |
| Model request count | 1 | 0 | 62 | unavailable | unavailable | 62 | 62 |
| Within-run median request duration (ms) | 1 | 0 | 3378.54 | unavailable | unavailable | 3378.54 | 3378.54 |
| Within-run median request wait (ms) | 1 | 0 | 1340.586 | unavailable | unavailable | 1340.586 | 1340.586 |
| Within-run median request transfer (ms) | 1 | 0 | 1909.623 | unavailable | unavailable | 1909.623 | 1909.623 |
| Within-run median inter-request gap (ms) | 1 | 0 | 40.8507 | unavailable | unavailable | 40.8507 | 40.8507 |
| Largest request duration (ms) | 1 | 0 | 67730.55 | unavailable | unavailable | 67730.55 | 67730.55 |
| Largest inter-request gap (ms) | 1 | 0 | 25040.1 | unavailable | unavailable | 25040.1 | 25040.1 |
| Time after last model response (ms) | 1 | 0 | 253.7733 | unavailable | unavailable | 253.7733 | 253.7733 |

#### happy-dom-deterministic-intersectionobserver — qwen @ 0.22.2 — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;happy-dom-deterministic-intersectionobserver&quot;,&quot;32b2a8e60eab482c023af377160bf294d6da0318&quot;,&quot;sha256:fa6e7f7d727d5fa5ec3367c5a2043259662d5a6877f49f3c46fd2f1edb181160&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 517186.2 | unavailable | unavailable | 517186.2 | 517186.2 |
| Model (ms) | 1 | 0 | 427754 | unavailable | unavailable | 427754 | 427754 |
| Non-model (ms) | 1 | 0 | 87377.97 | unavailable | unavailable | 87377.97 | 87377.97 |
| Startup (ms) | 1 | 0 | 2054.21 | unavailable | unavailable | 2054.21 | 2054.21 |
| First byte (ms) | 1 | 0 | 1365.977 | unavailable | unavailable | 1365.977 | 1365.977 |
| API turns | 1 | 0 | 96 | unavailable | unavailable | 96 | 96 |
| Input tokens | 1 | 0 | 9748513 | unavailable | unavailable | 9748513 | 9748513 |
| Output tokens | 1 | 0 | 76693 | unavailable | unavailable | 76693 | 76693 |
| Cached input (%) | 1 | 0 | 99.11994 | unavailable | unavailable | 99.11994 | 99.11994 |
| Static cost (USD) | 0 | 1 | unavailable | unavailable | unavailable | unavailable | unavailable |
| Model request count | 1 | 0 | 96 | unavailable | unavailable | 96 | 96 |
| Within-run median request duration (ms) | 1 | 0 | 2499.083 | unavailable | unavailable | 2499.083 | 2499.083 |
| Within-run median request wait (ms) | 1 | 0 | 1365.977 | unavailable | unavailable | 1365.977 | 1365.977 |
| Within-run median request transfer (ms) | 1 | 0 | 1042.211 | unavailable | unavailable | 1042.211 | 1042.211 |
| Within-run median inter-request gap (ms) | 1 | 0 | 48.25076 | unavailable | unavailable | 48.25076 | 48.25076 |
| Largest request duration (ms) | 1 | 0 | 34022.8 | unavailable | unavailable | 34022.8 | 34022.8 |
| Largest inter-request gap (ms) | 1 | 0 | 23229.72 | unavailable | unavailable | 23229.72 | 23229.72 |
| Time after last model response (ms) | 1 | 0 | 314.9439 | unavailable | unavailable | 314.9439 | 314.9439 |

#### ink-grid-box-layout — qwen @ 0.22.2 — Verification failure (verify_error)

Selected attempts: 3. Task identity: \[&quot;ink-grid-box-layout&quot;,&quot;477fda7df7781406d2ba046eb48dd5391e964b72&quot;,&quot;sha256:b093eab15a3872c9a84f54190d76d138296cf44430826a649b15936370013c91&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 3 | 0 | 1064405 | 577794.9 | 1074704 | 91185.23 | 1085003 |
| Model (ms) | 3 | 0 | 698173.3 | 393128 | 705720.1 | 88082.59 | 713266.8 |
| Non-model (ms) | 3 | 0 | 364387.6 | 182800.1 | 366803.9 | 1212.691 | 369220.2 |
| Startup (ms) | 3 | 0 | 1889.946 | 1866.807 | 2202.708 | 1843.668 | 2515.469 |
| First byte (ms) | 3 | 0 | 1632.236 | 1465.861 | 1633.286 | 1299.487 | 1634.336 |
| API turns | 3 | 0 | 119 | 66 | 129 | 13 | 139 |
| Input tokens | 3 | 0 | 17056790 | 8860307 | 18861680 | 663825 | 20666570 |
| Output tokens | 3 | 0 | 114038 | 64455 | 114492 | 14872 | 114946 |
| Cached input (%) | 3 | 0 | 99.44283 | 90.9371 | 99.49285 | 82.43136 | 99.54287 |
| Static cost (USD) | 0 | 3 | unavailable | unavailable | unavailable | unavailable | unavailable |
| Model request count | 3 | 0 | 119 | 66 | 129 | 13 | 139 |
| Within-run median request duration (ms) | 3 | 0 | 2763.653 | 2675.541 | 2952.691 | 2587.43 | 3141.73 |
| Within-run median request wait (ms) | 3 | 0 | 1632.236 | 1465.861 | 1633.286 | 1299.487 | 1634.336 |
| Within-run median request transfer (ms) | 3 | 0 | 1287.943 | 1178.167 | 1394.774 | 1068.391 | 1501.605 |
| Within-run median inter-request gap (ms) | 3 | 0 | 43.21638 | 38.18566 | 45.45831 | 33.15494 | 47.70025 |
| Largest request duration (ms) | 3 | 0 | 100024 | 69138.72 | 107761.3 | 38253.46 | 115498.6 |
| Largest inter-request gap (ms) | 3 | 0 | 79302.94 | 39963.66 | 79598.19 | 624.3717 | 79893.44 |
| Time after last model response (ms) | 3 | 0 | 192.2257 | 184.5202 | 206.9394 | 176.8147 | 221.6531 |

#### true-myth-iterable-collection-combinators — qwen @ 0.22.2 — Pass (completed)

Selected attempts: 1. Task identity: \[&quot;true-myth-iterable-collection-combinators&quot;,&quot;5945ad1b96e228ff716275d8a273282101152508&quot;,&quot;sha256:2d5b99141677ea769219ab882b11fa652f51f525c5960ce80e49cb7dee26a79d&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 498153.1 | unavailable | unavailable | 498153.1 | 498153.1 |
| Model (ms) | 1 | 0 | 465125.1 | unavailable | unavailable | 465125.1 | 465125.1 |
| Non-model (ms) | 1 | 0 | 31521.57 | unavailable | unavailable | 31521.57 | 31521.57 |
| Startup (ms) | 1 | 0 | 1506.476 | unavailable | unavailable | 1506.476 | 1506.476 |
| First byte (ms) | 1 | 0 | 1585.655 | unavailable | unavailable | 1585.655 | 1585.655 |
| API turns | 1 | 0 | 79 | unavailable | unavailable | 79 | 79 |
| Input tokens | 1 | 0 | 9859279 | unavailable | unavailable | 9859279 | 9859279 |
| Output tokens | 1 | 0 | 93081 | unavailable | unavailable | 93081 | 93081 |
| Cached input (%) | 1 | 0 | 98.69444 | unavailable | unavailable | 98.69444 | 98.69444 |
| Static cost (USD) | 0 | 1 | unavailable | unavailable | unavailable | unavailable | unavailable |
| Model request count | 1 | 0 | 79 | unavailable | unavailable | 79 | 79 |
| Within-run median request duration (ms) | 1 | 0 | 2721.588 | unavailable | unavailable | 2721.588 | 2721.588 |
| Within-run median request wait (ms) | 1 | 0 | 1585.655 | unavailable | unavailable | 1585.655 | 1585.655 |
| Within-run median request transfer (ms) | 1 | 0 | 1171.815 | unavailable | unavailable | 1171.815 | 1171.815 |
| Within-run median inter-request gap (ms) | 1 | 0 | 41.61211 | unavailable | unavailable | 41.61211 | 41.61211 |
| Largest request duration (ms) | 1 | 0 | 41652.17 | unavailable | unavailable | 41652.17 | 41652.17 |
| Largest inter-request gap (ms) | 1 | 0 | 5569.514 | unavailable | unavailable | 5569.514 | 5569.514 |
| Time after last model response (ms) | 1 | 0 | 215.6618 | unavailable | unavailable | 215.6618 | 215.6618 |

### Annotated request timelines

#### pinned:cline:textual-richlog-follow-state:1:funded-recovery-20260914 — most model calls among verification failures

cline @ 3.0.61 · textual-richlog-follow-state · Verification failure (verify_error). Calls 422 (422 successful). Median duration 2.89s; largest gap 30.08s; time after last 1.38s.
