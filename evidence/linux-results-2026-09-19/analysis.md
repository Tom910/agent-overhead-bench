# Selected-attempt analysis

Selected attempts: 200. Populations: 2.

All selected outcomes. Task coverage can differ; these are descriptive summaries, not a ranking. Cost, cache and tokens are medians per measured attempt. Cost is a static estimate, not billing. Cache rate is the median attempt cached-input percentage, not a pooled token ratio. Input includes cached tokens; token counters cover successful model responses. Missing measurements are not zero.

## Comparison 1: deepseek/deepseek-v4.1-flash · linux

### At a glance

| Harness | Pass rate | Median reference cost / attempt | Cache rate | Tokens in | Tokens out | Task identities |
| --- | --- | --- | --- | --- | --- | --- |
| cline @ 3.0.61 | 45.0% · 18/40 · 72.0% of best | $0.167 · 60.3% of best (40/40 measured) | 96.4% · 97.2% of best (40/40 measured) | 9.77M · 87.4% of best (40/40 measured) | 158.2K · 54.1% of best (40/40 measured) | 10 |
| codex @ codex-cli 0.149.1 | 50.0% · 20/40 · 80.0% of best | $0.090 · Not scored (39/40 measured · partial) | 99.2% · 100.0% of best (40/40 measured) | 8.54M · 100.0% of best (40/40 measured) | 89.0K · 96.2% of best (40/40 measured) | 11 |
| hermes @ Hermes Agent v0.20.5 (2026.8.19) | 50.0% · 20/40 · 80.0% of best | $0.135 · Not scored (38/40 measured · partial) | 99.2% · Not scored (39/40 measured · partial) | 16.43M · Not scored (39/40 measured · partial) | 119.9K · Not scored (39/40 measured · partial) | 8 |
| pi @ 0.73.1 | 57.5% · 23/40 · 92.0% of best | $0.098 · Not scored (39/40 measured · partial) | 98.3% · 99.1% of best (40/40 measured) | 9.46M · 90.2% of best (40/40 measured) | 86.7K · 98.7% of best (40/40 measured) | 9 |
| qwen @ 0.22.2 | 62.5% · 25/40 · 100.0% of best | $0.101 · 100.0% of best (40/40 measured) | 99.2% · 99.9% of best (40/40 measured) | 10.55M · 80.9% of best (40/40 measured) | 85.6K · 100.0% of best (40/40 measured) | 15 |

Reference cost at fixed prices from deepseek-v41-low-2026-09-10: $0.15/M uncached input + $0.003/M cached input + $0.6/M output tokens. Calculated per attempt from exact counters, then summarized by median; not actual billing. Original price books remain in the evidence below.

Image variants: retained and rebuilt task environments occur in this snapshot. Task counts include distinct environment identities; detailed comparisons preserve those identities. These summaries are not a controlled image-matched comparison.

Percent of observed best: higher pass/cache values score higher; lower cost/token values score higher. Each metric has its own 100% baseline. Partial measurement coverage is unscored. These descriptive indices are not a composite quality score; task coverage can differ.

## Detailed original accounting

## Population 1: deepseek/deepseek-v4.1-flash · linux · deepseek-v41-low-2026-09-10

### Recorded population identity

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
| cline @ 3.0.61 | 20 | 10 | 10 | 0 | 10 | 20 | 10 | 20 | 20 | 20 | 20 | 20 | 2 / 7 |
| codex @ codex-cli 0.149.1 | 37 | 19 | 18 | 0 | 8 | 37 | 8 | 37 | 37 | 37 | 37 | 36 | 4 / 5 |
| hermes @ Hermes Agent v0.20.5 (2026.8.19) | 40 | 20 | 20 | 0 | 8 | 40 | 8 | 40 | 39 | 39 | 39 | 38 | 5 / 7 |
| pi @ 0.73.1 | 39 | 23 | 16 | 0 | 8 | 39 | 8 | 39 | 39 | 39 | 39 | 38 | 5 / 7 |
| qwen @ 0.22.2 | 34 | 23 | 11 | 0 | 15 | 34 | 15 | 34 | 34 | 34 | 34 | 34 | 8 / 12 |

### Selected spend by outcome

| Harness @ version | Outcome | Selected | Priced n | Missing n | Selected static spend (USD) |
| --- | --- | --- | --- | --- | --- |
| cline @ 3.0.61 | Pass (completed) | 10 | 10 | 0 | Total: 2.183396 |
| cline @ 3.0.61 | Verification failure (verify\_error) | 10 | 10 | 0 | Total: 1.887896 |
| codex @ codex-cli 0.149.1 | Pass (completed) | 19 | 19 | 0 | Total: 1.784457 |
| codex @ codex-cli 0.149.1 | Verification failure (verify\_error) | 18 | 17 | 1 | Known subtotal: 1.680556 |
| hermes @ Hermes Agent v0.20.5 (2026.8.19) | Pass (completed) | 20 | 19 | 1 | Known subtotal: 3.82214 |
| hermes @ Hermes Agent v0.20.5 (2026.8.19) | Verification failure (verify\_error) | 20 | 19 | 1 | Known subtotal: 2.662463 |
| pi @ 0.73.1 | Pass (completed) | 23 | 23 | 0 | Total: 2.716697 |
| pi @ 0.73.1 | Verification failure (verify\_error) | 16 | 15 | 1 | Known subtotal: 1.167163 |
| qwen @ 0.22.2 | Pass (completed) | 23 | 23 | 0 | Total: 2.546267 |
| qwen @ 0.22.2 | Verification failure (verify\_error) | 11 | 11 | 0 | Total: 1.257525 |

### Request-level summaries

| Harness @ version | Outcome | Runs | Median calls | Median of run median durations | Median of run median waits | Median of run median transfers | Median of run median gaps | Median time after last |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| cline @ 3.0.61 | Pass (completed) | 10 | 196 (available n=10; missing n=0) | 2.52s (available n=10; missing n=0) | 1.13s (available n=10; missing n=0) | 1.35s (available n=10; missing n=0) | 45.74558 ms (available n=10; missing n=0) | 1.31s (available n=10; missing n=0) |
| cline @ 3.0.61 | Verification failure (verify\_error) | 10 | 121 (available n=10; missing n=0) | 2.75s (available n=10; missing n=0) | 1.12s (available n=10; missing n=0) | 1.6s (available n=10; missing n=0) | 44.25275 ms (available n=10; missing n=0) | 1.48s (available n=10; missing n=0) |
| codex @ codex-cli 0.149.1 | Pass (completed) | 19 | 99 (available n=19; missing n=0) | 2.74s (available n=19; missing n=0) | 1.33s (available n=19; missing n=0) | 1.33s (available n=19; missing n=0) | 63.52835 ms (available n=19; missing n=0) | 5.16s (available n=19; missing n=0) |
| codex @ codex-cli 0.149.1 | Verification failure (verify\_error) | 18 | 108 (available n=18; missing n=0) | 2.39s (available n=18; missing n=0) | 1.31s (available n=18; missing n=0) | 1.07s (available n=18; missing n=0) | 61.77419 ms (available n=18; missing n=0) | 5.17s (available n=18; missing n=0) |
| hermes @ Hermes Agent v0.20.5 (2026.8.19) | Pass (completed) | 20 | 114.5 (available n=20; missing n=0) | 3.22s (available n=20; missing n=0) | 1.67s (available n=20; missing n=0) | 1.38s (available n=20; missing n=0) | 180.663 ms (available n=20; missing n=0) | 274.5845 ms (available n=20; missing n=0) |
| hermes @ Hermes Agent v0.20.5 (2026.8.19) | Verification failure (verify\_error) | 20 | 108 (available n=20; missing n=0) | 3.05s (available n=20; missing n=0) | 1.52s (available n=20; missing n=0) | 1.45s (available n=20; missing n=0) | 173.5481 ms (available n=20; missing n=0) | 268.0604 ms (available n=20; missing n=0) |
| pi @ 0.73.1 | Pass (completed) | 23 | 104 (available n=23; missing n=0) | 2.63s (available n=23; missing n=0) | 1.35s (available n=23; missing n=0) | 1.22s (available n=23; missing n=0) | 19.76443 ms (available n=23; missing n=0) | 281.5858 ms (available n=23; missing n=0) |
| pi @ 0.73.1 | Verification failure (verify\_error) | 16 | 88 (available n=16; missing n=0) | 2.4s (available n=16; missing n=0) | 1.25s (available n=16; missing n=0) | 1.07s (available n=16; missing n=0) | 16.40342 ms (available n=16; missing n=0) | 279.4091 ms (available n=16; missing n=0) |
| qwen @ 0.22.2 | Pass (completed) | 23 | 92 (available n=23; missing n=0) | 2.75s (available n=23; missing n=0) | 1.49s (available n=23; missing n=0) | 1.28s (available n=23; missing n=0) | 49.13188 ms (available n=23; missing n=0) | 225.3895 ms (available n=23; missing n=0) |
| qwen @ 0.22.2 | Verification failure (verify\_error) | 11 | 92 (available n=11; missing n=0) | 2.81s (available n=11; missing n=0) | 1.43s (available n=11; missing n=0) | 1.13s (available n=11; missing n=0) | 48.25119 ms (available n=11; missing n=0) | 214.331 ms (available n=11; missing n=0) |

### Common successful tasks

#### cline @ 3.0.61 (left) vs codex @ codex-cli 0.149.1 (right)

Common successful tasks: 2. Left median of task medians: 1015160 ms. Right median of task medians: 584079.7 ms. Median task ratio (right / left): 0.579557.

| Common successful task | Left n | Left median (ms) | Right n | Right median (ms) | Right / left |
| --- | --- | --- | --- | --- | --- |
| cattrs-partial-structuring-recovery | 1 | 974484 | 4 | 666911 | 0.6843735 |
| psd-tools-blend-range-api | 1 | 1055836 | 4 | 501248.4 | 0.4747406 |

#### cline @ 3.0.61 (left) vs hermes @ Hermes Agent v0.20.5 (2026.8.19) (right)

Common successful tasks: 5. Left median of task medians: 782267.1 ms. Right median of task medians: 880686.2 ms. Median task ratio (right / left): 1.005573.

| Common successful task | Left n | Left median (ms) | Right n | Right median (ms) | Right / left |
| --- | --- | --- | --- | --- | --- |
| cattrs-partial-structuring-recovery | 2 | 723902.8 | 2 | 800776.7 | 1.106194 |
| psd-tools-blend-range-api | 1 | 782267.1 | 4 | 520348.7 | 0.6651804 |
| textual-richlog-follow-state | 1 | 3235393 | 1 | 2572629 | 0.795152 |
| tomlkit-toml-table-converters | 3 | 1616713 | 5 | 1625724 | 1.005573 |
| true-myth-iterable-collection-combinators | 1 | 640484.1 | 5 | 880686.2 | 1.375032 |

#### cline @ 3.0.61 (left) vs pi @ 0.73.1 (right)

Common successful tasks: 2. Left median of task medians: 1015160 ms. Right median of task medians: 591409.9 ms. Median task ratio (right / left): 0.5879837.

| Common successful task | Left n | Left median (ms) | Right n | Right median (ms) | Right / left |
| --- | --- | --- | --- | --- | --- |
| cattrs-partial-structuring-recovery | 1 | 974484 | 4 | 704450.9 | 0.7228963 |
| psd-tools-blend-range-api | 1 | 1055836 | 5 | 478368.9 | 0.453071 |

#### cline @ 3.0.61 (left) vs qwen @ 0.22.2 (right)

Common successful tasks: 7. Left median of task medians: 974484 ms. Right median of task medians: 592323.6 ms. Median task ratio (right / left): 0.64152.

| Common successful task | Left n | Left median (ms) | Right n | Right median (ms) | Right / left |
| --- | --- | --- | --- | --- | --- |
| cattrs-partial-structuring-recovery | 1 | 974484 | 3 | 729032.4 | 0.7481215 |
| cattrs-partial-structuring-recovery | 2 | 723902.8 | 2 | 592323.6 | 0.8182363 |
| psd-tools-blend-range-api | 1 | 1055836 | 3 | 504621.7 | 0.4779355 |
| psd-tools-blend-range-api | 1 | 782267.1 | 2 | 501840 | 0.64152 |
| textual-richlog-follow-state | 1 | 3235393 | 1 | 1281924 | 0.3962189 |
| tomlkit-toml-table-converters | 3 | 1616713 | 2 | 795082.9 | 0.4917896 |
| true-myth-iterable-collection-combinators | 1 | 640484.1 | 2 | 452219.8 | 0.7060593 |

#### codex @ codex-cli 0.149.1 (left) vs hermes @ Hermes Agent v0.20.5 (2026.8.19) (right)

Common successful tasks: 0. Left median of task medians: unavailable. Right median of task medians: unavailable. Median task ratio (right / left): unavailable.

No common successful tasks; comparison unavailable.

#### codex @ codex-cli 0.149.1 (left) vs pi @ 0.73.1 (right)

Common successful tasks: 5. Left median of task medians: 613145.6 ms. Right median of task medians: 529787.2 ms. Median task ratio (right / left): 0.954355.

| Common successful task | Left n | Left median (ms) | Right n | Right median (ms) | Right / left |
| --- | --- | --- | --- | --- | --- |
| cattrs-partial-structuring-recovery | 4 | 666911 | 4 | 704450.9 | 1.056289 |
| happy-dom-deterministic-intersectionobserver | 1 | 613145.6 | 1 | 499451 | 0.8145717 |
| psd-tools-blend-range-api | 4 | 501248.4 | 5 | 478368.9 | 0.954355 |
| tomlkit-toml-table-converters | 5 | 719564.8 | 5 | 673943.6 | 0.9365989 |
| true-myth-iterable-collection-combinators | 5 | 473204.1 | 4 | 529787.2 | 1.119574 |

#### codex @ codex-cli 0.149.1 (left) vs qwen @ 0.22.2 (right)

Common successful tasks: 5. Left median of task medians: 613145.6 ms. Right median of task medians: 592225.8 ms. Median task ratio (right / left): 1.006587.

| Common successful task | Left n | Left median (ms) | Right n | Right median (ms) | Right / left |
| --- | --- | --- | --- | --- | --- |
| cattrs-partial-structuring-recovery | 4 | 666911 | 3 | 729032.4 | 1.093148 |
| happy-dom-deterministic-intersectionobserver | 1 | 613145.6 | 1 | 592225.8 | 0.9658812 |
| psd-tools-blend-range-api | 4 | 501248.4 | 3 | 504621.7 | 1.00673 |
| tomlkit-toml-table-converters | 5 | 719564.8 | 3 | 724304.6 | 1.006587 |
| true-myth-iterable-collection-combinators | 5 | 473204.1 | 2 | 474113.2 | 1.001921 |

#### hermes @ Hermes Agent v0.20.5 (2026.8.19) (left) vs pi @ 0.73.1 (right)

Common successful tasks: 0. Left median of task medians: unavailable. Right median of task medians: unavailable. Median task ratio (right / left): unavailable.

No common successful tasks; comparison unavailable.

#### hermes @ Hermes Agent v0.20.5 (2026.8.19) (left) vs qwen @ 0.22.2 (right)

Common successful tasks: 5. Left median of task medians: 880686.2 ms. Right median of task medians: 592323.6 ms. Median task ratio (right / left): 0.5134857.

| Common successful task | Left n | Left median (ms) | Right n | Right median (ms) | Right / left |
| --- | --- | --- | --- | --- | --- |
| cattrs-partial-structuring-recovery | 2 | 800776.7 | 2 | 592323.6 | 0.7396863 |
| psd-tools-blend-range-api | 4 | 520348.7 | 2 | 501840 | 0.9644301 |
| textual-richlog-follow-state | 1 | 2572629 | 1 | 1281924 | 0.4982933 |
| tomlkit-toml-table-converters | 5 | 1625724 | 2 | 795082.9 | 0.489064 |
| true-myth-iterable-collection-combinators | 5 | 880686.2 | 2 | 452219.8 | 0.5134857 |

#### pi @ 0.73.1 (left) vs qwen @ 0.22.2 (right)

Common successful tasks: 6. Left median of task medians: 514619.1 ms. Right median of task medians: 548423.7 ms. Median task ratio (right / left): 1.044887.

| Common successful task | Left n | Left median (ms) | Right n | Right median (ms) | Right / left |
| --- | --- | --- | --- | --- | --- |
| cattrs-partial-structuring-recovery | 4 | 704450.9 | 3 | 729032.4 | 1.034895 |
| happy-dom-deterministic-intersectionobserver | 1 | 499451 | 1 | 592225.8 | 1.185753 |
| psd-tools-blend-range-api | 5 | 478368.9 | 3 | 504621.7 | 1.05488 |
| superjson-error-stack-serialization | 1 | 414015.8 | 1 | 328194.7 | 0.7927106 |
| tomlkit-toml-table-converters | 5 | 673943.6 | 3 | 724304.6 | 1.074726 |
| true-myth-iterable-collection-combinators | 4 | 529787.2 | 2 | 474113.2 | 0.8949125 |

### Per-task outcome distributions

#### cattrs-partial-structuring-recovery — cline @ 3.0.61 — Pass (completed)

Selected attempts: 1. Task identity: \[&quot;cattrs-partial-structuring-recovery&quot;,&quot;91df27b2a20f26c35777a92f4555438b62c06345&quot;,&quot;sha256:417f2ac9b8fbeec1a36dacd9ae2ca9e8c565b73e8ec7b2aa84da01428aa030e8&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 974484 | unavailable | unavailable | 974484 | 974484 |
| Model (ms) | 1 | 0 | 872686.8 | unavailable | unavailable | 872686.8 | 872686.8 |
| Non-model (ms) | 1 | 0 | 100635.7 | unavailable | unavailable | 100635.7 | 100635.7 |
| Startup (ms) | 1 | 0 | 1161.486 | unavailable | unavailable | 1161.486 | 1161.486 |
| First byte (ms) | 1 | 0 | 1092.351 | unavailable | unavailable | 1092.351 | 1092.351 |
| API turns | 1 | 0 | 206 | unavailable | unavailable | 206 | 206 |
| Input tokens | 1 | 0 | 10798310 | unavailable | unavailable | 10798310 | 10798310 |
| Output tokens | 1 | 0 | 158430 | unavailable | unavailable | 158430 | 158430 |
| Cached input (%) | 1 | 0 | 97.20274 | unavailable | unavailable | 97.20274 | 97.20274 |
| Static cost (USD) | 1 | 0 | 0.1718553 | unavailable | unavailable | 0.1718553 | 0.1718553 |
| Model request count | 1 | 0 | 206 | unavailable | unavailable | 206 | 206 |
| Within-run median request duration (ms) | 1 | 0 | 2296.978 | unavailable | unavailable | 2296.978 | 2296.978 |
| Within-run median request wait (ms) | 1 | 0 | 1092.351 | unavailable | unavailable | 1092.351 | 1092.351 |
| Within-run median request transfer (ms) | 1 | 0 | 1176.901 | unavailable | unavailable | 1176.901 | 1176.901 |
| Within-run median inter-request gap (ms) | 1 | 0 | 45.56204 | unavailable | unavailable | 45.56204 | 45.56204 |
| Largest request duration (ms) | 1 | 0 | 45506 | unavailable | unavailable | 45506 | 45506 |
| Largest inter-request gap (ms) | 1 | 0 | 30041.62 | unavailable | unavailable | 30041.62 | 30041.62 |
| Time after last model response (ms) | 1 | 0 | 1275.5 | unavailable | unavailable | 1275.5 | 1275.5 |

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

Selected attempts: 1. Task identity: \[&quot;psd-tools-blend-range-api&quot;,&quot;01595992c5f4d4695251fdf58b3edb5302d3ba46&quot;,&quot;sha256:0a4bac520618fd86c8a29b2fb482def495827fb8a951f497b4e2a6166e4e3fd9&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 1055836 | unavailable | unavailable | 1055836 | 1055836 |
| Model (ms) | 1 | 0 | 799245.8 | unavailable | unavailable | 799245.8 | 799245.8 |
| Non-model (ms) | 1 | 0 | 255335.2 | unavailable | unavailable | 255335.2 | 255335.2 |
| Startup (ms) | 1 | 0 | 1255.359 | unavailable | unavailable | 1255.359 | 1255.359 |
| First byte (ms) | 1 | 0 | 1109.767 | unavailable | unavailable | 1109.767 | 1109.767 |
| API turns | 1 | 0 | 203 | unavailable | unavailable | 203 | 203 |
| Input tokens | 1 | 0 | 11392710 | unavailable | unavailable | 11392710 | 11392710 |
| Output tokens | 1 | 0 | 159910 | unavailable | unavailable | 159910 | 159910 |
| Cached input (%) | 1 | 0 | 96.92766 | unavailable | unavailable | 96.92766 | 96.92766 |
| Static cost (USD) | 1 | 0 | 0.1815775 | unavailable | unavailable | 0.1815775 | 0.1815775 |
| Model request count | 1 | 0 | 203 | unavailable | unavailable | 203 | 203 |
| Within-run median request duration (ms) | 1 | 0 | 2529.477 | unavailable | unavailable | 2529.477 | 2529.477 |
| Within-run median request wait (ms) | 1 | 0 | 1109.767 | unavailable | unavailable | 1109.767 | 1109.767 |
| Within-run median request transfer (ms) | 1 | 0 | 1440.491 | unavailable | unavailable | 1440.491 | 1440.491 |
| Within-run median inter-request gap (ms) | 1 | 0 | 46.77716 | unavailable | unavailable | 46.77716 | 46.77716 |
| Largest request duration (ms) | 1 | 0 | 40563.99 | unavailable | unavailable | 40563.99 | 40563.99 |
| Largest inter-request gap (ms) | 1 | 0 | 30044.86 | unavailable | unavailable | 30044.86 | 30044.86 |
| Time after last model response (ms) | 1 | 0 | 1305.287 | unavailable | unavailable | 1305.287 | 1305.287 |

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

#### cattrs-partial-structuring-recovery — codex @ codex-cli 0.149.1 — Pass (completed)

Selected attempts: 4. Task identity: \[&quot;cattrs-partial-structuring-recovery&quot;,&quot;91df27b2a20f26c35777a92f4555438b62c06345&quot;,&quot;sha256:417f2ac9b8fbeec1a36dacd9ae2ca9e8c565b73e8ec7b2aa84da01428aa030e8&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 4 | 0 | 666911 | 588798 | 744275.5 | 569058.7 | 761769.3 |
| Model (ms) | 4 | 0 | 472691.4 | 404971.9 | 527706.2 | 365429 | 529135 |
| Non-model (ms) | 4 | 0 | 218519 | 194130.3 | 229770.1 | 150425.5 | 234062 |
| Startup (ms) | 4 | 0 | 545.5274 | 479.5544 | 860.3853 | 477.2916 | 1609.303 |
| First byte (ms) | 4 | 0 | 1371.633 | 1304.515 | 1427.995 | 1269.959 | 1430.283 |
| API turns | 4 | 0 | 105.5 | 95.5 | 112.5 | 82 | 117 |
| Input tokens | 4 | 0 | 9997790 | 8007007 | 11472720 | 6394181 | 11538000 |
| Output tokens | 4 | 0 | 83629 | 72675 | 93026 | 67374 | 93656 |
| Cached input (%) | 4 | 0 | 99.22629 | 99.10283 | 99.32131 | 99.00802 | 99.33081 |
| Static cost (USD) | 4 | 0 | 0.09149099 | 0.07811101 | 0.1018254 | 0.06893101 | 0.1018685 |
| Model request count | 4 | 0 | 105.5 | 95.5 | 112.5 | 82 | 117 |
| Within-run median request duration (ms) | 4 | 0 | 2891.189 | 2720.335 | 2971.505 | 2400.851 | 3019.372 |
| Within-run median request wait (ms) | 4 | 0 | 1371.633 | 1304.515 | 1427.995 | 1269.959 | 1430.283 |
| Within-run median request transfer (ms) | 4 | 0 | 1477.509 | 1286.628 | 1615.116 | 1033.156 | 1708.769 |
| Within-run median inter-request gap (ms) | 4 | 0 | 61.7446 | 60.1012 | 65.09376 | 59.30204 | 71.01021 |
| Largest request duration (ms) | 4 | 0 | 30801.35 | 28563.73 | 33699.22 | 28552.24 | 35691.43 |
| Largest inter-request gap (ms) | 4 | 0 | 40027.11 | 30179.59 | 49946.83 | 30177.62 | 50165.42 |
| Time after last model response (ms) | 4 | 0 | 5163.646 | 5153.432 | 5173.756 | 5147.692 | 5179.181 |

#### cattrs-partial-structuring-recovery — codex @ codex-cli 0.149.1 — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;cattrs-partial-structuring-recovery&quot;,&quot;91df27b2a20f26c35777a92f4555438b62c06345&quot;,&quot;sha256:417f2ac9b8fbeec1a36dacd9ae2ca9e8c565b73e8ec7b2aa84da01428aa030e8&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 550540.8 | unavailable | unavailable | 550540.8 | 550540.8 |
| Model (ms) | 1 | 0 | 364425.3 | unavailable | unavailable | 364425.3 | 364425.3 |
| Non-model (ms) | 1 | 0 | 185652.9 | unavailable | unavailable | 185652.9 | 185652.9 |
| Startup (ms) | 1 | 0 | 462.6064 | unavailable | unavailable | 462.6064 | 462.6064 |
| First byte (ms) | 1 | 0 | 1267.832 | unavailable | unavailable | 1267.832 | 1267.832 |
| API turns | 1 | 0 | 98 | unavailable | unavailable | 98 | 98 |
| Input tokens | 1 | 0 | 7520848 | unavailable | unavailable | 7520848 | 7520848 |
| Output tokens | 1 | 0 | 61264 | unavailable | unavailable | 61264 | 61264 |
| Cached input (%) | 1 | 0 | 99.04585 | unavailable | unavailable | 99.04585 | 99.04585 |
| Static cost (USD) | 1 | 0 | 0.06986966 | unavailable | unavailable | 0.06986966 | 0.06986966 |
| Model request count | 1 | 0 | 98 | unavailable | unavailable | 98 | 98 |
| Within-run median request duration (ms) | 1 | 0 | 2126.251 | unavailable | unavailable | 2126.251 | 2126.251 |
| Within-run median request wait (ms) | 1 | 0 | 1267.832 | unavailable | unavailable | 1267.832 | 1267.832 |
| Within-run median request transfer (ms) | 1 | 0 | 753.9848 | unavailable | unavailable | 753.9848 | 753.9848 |
| Within-run median inter-request gap (ms) | 1 | 0 | 59.4828 | unavailable | unavailable | 59.4828 | 59.4828 |
| Largest request duration (ms) | 1 | 0 | 32100.13 | unavailable | unavailable | 32100.13 | 32100.13 |
| Largest inter-request gap (ms) | 1 | 0 | 45028.18 | unavailable | unavailable | 45028.18 | 45028.18 |
| Time after last model response (ms) | 1 | 0 | 5596.945 | unavailable | unavailable | 5596.945 | 5596.945 |

#### happy-dom-deterministic-intersectionobserver — codex @ codex-cli 0.149.1 — Pass (completed)

Selected attempts: 1. Task identity: \[&quot;happy-dom-deterministic-intersectionobserver&quot;,&quot;32b2a8e60eab482c023af377160bf294d6da0318&quot;,&quot;sha256:3d414d710d8e31ae0fcf9d23c863bbc395835fc8ea49acd0c0567e10838564c5&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 613145.6 | unavailable | unavailable | 613145.6 | 613145.6 |
| Model (ms) | 1 | 0 | 496062.9 | unavailable | unavailable | 496062.9 | 496062.9 |
| Non-model (ms) | 1 | 0 | 116053.2 | unavailable | unavailable | 116053.2 | 116053.2 |
| Startup (ms) | 1 | 0 | 1029.498 | unavailable | unavailable | 1029.498 | 1029.498 |
| First byte (ms) | 1 | 0 | 1328.281 | unavailable | unavailable | 1328.281 | 1328.281 |
| API turns | 1 | 0 | 97 | unavailable | unavailable | 97 | 97 |
| Input tokens | 1 | 0 | 8075202 | unavailable | unavailable | 8075202 | 8075202 |
| Output tokens | 1 | 0 | 91033 | unavailable | unavailable | 91033 | 91033 |
| Cached input (%) | 1 | 0 | 99.21297 | unavailable | unavailable | 99.21297 | 99.21297 |
| Static cost (USD) | 1 | 0 | 0.08818784 | unavailable | unavailable | 0.08818784 | 0.08818784 |
| Model request count | 1 | 0 | 97 | unavailable | unavailable | 97 | 97 |
| Within-run median request duration (ms) | 1 | 0 | 2828.023 | unavailable | unavailable | 2828.023 | 2828.023 |
| Within-run median request wait (ms) | 1 | 0 | 1328.281 | unavailable | unavailable | 1328.281 | 1328.281 |
| Within-run median request transfer (ms) | 1 | 0 | 1413.349 | unavailable | unavailable | 1413.349 | 1413.349 |
| Within-run median inter-request gap (ms) | 1 | 0 | 60.30252 | unavailable | unavailable | 60.30252 | 60.30252 |
| Largest request duration (ms) | 1 | 0 | 34314.45 | unavailable | unavailable | 34314.45 | 34314.45 |
| Largest inter-request gap (ms) | 1 | 0 | 15024.42 | unavailable | unavailable | 15024.42 | 15024.42 |
| Time after last model response (ms) | 1 | 0 | 5198.545 | unavailable | unavailable | 5198.545 | 5198.545 |

#### happy-dom-deterministic-intersectionobserver — codex @ codex-cli 0.149.1 — Verification failure (verify_error)

Selected attempts: 4. Task identity: \[&quot;happy-dom-deterministic-intersectionobserver&quot;,&quot;32b2a8e60eab482c023af377160bf294d6da0318&quot;,&quot;sha256:3d414d710d8e31ae0fcf9d23c863bbc395835fc8ea49acd0c0567e10838564c5&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 4 | 0 | 620436.3 | 595208.7 | 682676.6 | 537853.1 | 851070 |
| Model (ms) | 4 | 0 | 470386.7 | 444695.4 | 498232.2 | 400760.2 | 548630 |
| Non-model (ms) | 4 | 0 | 150816.4 | 134593.2 | 199929.9 | 131828 | 301366 |
| Startup (ms) | 4 | 0 | 1080.53 | 1072.066 | 1209.765 | 1066.221 | 1577.925 |
| First byte (ms) | 4 | 0 | 1308.311 | 1266.558 | 1314.577 | 1159.27 | 1315.401 |
| API turns | 4 | 0 | 101 | 97.25 | 108.75 | 95 | 123 |
| Input tokens | 4 | 0 | 8512713 | 7492337 | 9320697 | 5405229 | 10770630 |
| Output tokens | 4 | 0 | 86109.5 | 80490.5 | 91123 | 70448 | 99349 |
| Cached input (%) | 4 | 0 | 99.18312 | 99.14806 | 99.24383 | 99.07799 | 99.39084 |
| Static cost (USD) | 4 | 0 | 0.08743158 | 0.07987138 | 0.09312012 | 0.06581053 | 0.101566 |
| Model request count | 4 | 0 | 101 | 97.25 | 108.75 | 95 | 123 |
| Within-run median request duration (ms) | 4 | 0 | 2258.452 | 2180.797 | 2347.737 | 2163.007 | 2400.42 |
| Within-run median request wait (ms) | 4 | 0 | 1308.311 | 1266.558 | 1314.577 | 1159.27 | 1315.401 |
| Within-run median request transfer (ms) | 4 | 0 | 895.9006 | 867.6184 | 931.3552 | 822.497 | 997.9939 |
| Within-run median inter-request gap (ms) | 4 | 0 | 59.7771 | 59.38476 | 59.97844 | 58.63335 | 60.15686 |
| Largest request duration (ms) | 4 | 0 | 30484.79 | 30412.95 | 33717.99 | 30393.92 | 43221.09 |
| Largest inter-request gap (ms) | 4 | 0 | 20982.86 | 20020.91 | 23991.9 | 19959.07 | 30195.01 |
| Time after last model response (ms) | 4 | 0 | 5172.83 | 5162.452 | 6406.99 | 5148.232 | 10092.56 |

#### ink-grid-box-layout — codex @ codex-cli 0.149.1 — Verification failure (verify_error)

Selected attempts: 5. Task identity: \[&quot;ink-grid-box-layout&quot;,&quot;477fda7df7781406d2ba046eb48dd5391e964b72&quot;,&quot;sha256:fbbb3a767c310003a279e0900aa0847e0bb78db90d726621d3be8286c16a9db1&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 5 | 0 | 938737.1 | 854982.9 | 985450.1 | 738967.5 | 1020852 |
| Model (ms) | 5 | 0 | 528104.7 | 522102.3 | 543740.8 | 371713.7 | 673150.6 |
| Non-model (ms) | 5 | 0 | 366244.2 | 346720.8 | 409642.4 | 331863.8 | 440128.7 |
| Startup (ms) | 5 | 0 | 1009.615 | 990.0147 | 1016.817 | 980.6322 | 1580.594 |
| First byte (ms) | 5 | 0 | 1307.163 | 1295.524 | 1360.733 | 1261.076 | 1462.476 |
| API turns | 5 | 0 | 113 | 112 | 121 | 85 | 125 |
| Input tokens | 5 | 0 | 10083910 | 10063270 | 11194470 | 6003049 | 14169840 |
| Output tokens | 5 | 0 | 91751 | 90933 | 92876 | 62587 | 119327 |
| Cached input (%) | 5 | 0 | 99.31516 | 99.28991 | 99.33595 | 98.88095 | 99.47617 |
| Static cost (USD) | 5 | 0 | 0.09545399 | 0.09525392 | 0.1002365 | 0.06543637 | 0.1250169 |
| Model request count | 5 | 0 | 113 | 112 | 121 | 85 | 125 |
| Within-run median request duration (ms) | 5 | 0 | 2293.291 | 2234.01 | 2665.489 | 2002.099 | 3532.796 |
| Within-run median request wait (ms) | 5 | 0 | 1307.163 | 1295.524 | 1360.733 | 1261.076 | 1462.476 |
| Within-run median request transfer (ms) | 5 | 0 | 946.0065 | 834.4251 | 1288.321 | 725.4832 | 2145.921 |
| Within-run median inter-request gap (ms) | 5 | 0 | 64.84042 | 61.42271 | 67.00545 | 60.01375 | 141.6134 |
| Largest request duration (ms) | 5 | 0 | 45648.78 | 43190.22 | 61241.62 | 40807.08 | 65006.55 |
| Largest inter-request gap (ms) | 5 | 0 | 58060.15 | 57628.15 | 58586.21 | 57625.89 | 77769.24 |
| Time after last model response (ms) | 5 | 0 | 5164.365 | 5163.504 | 5167.412 | 5151.917 | 5192.012 |

#### psd-tools-blend-range-api — codex @ codex-cli 0.149.1 — Pass (completed)

Selected attempts: 4. Task identity: \[&quot;psd-tools-blend-range-api&quot;,&quot;01595992c5f4d4695251fdf58b3edb5302d3ba46&quot;,&quot;sha256:0a4bac520618fd86c8a29b2fb482def495827fb8a951f497b4e2a6166e4e3fd9&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 4 | 0 | 501248.4 | 494378.5 | 512891.8 | 476215.9 | 545375.1 |
| Model (ms) | 4 | 0 | 411801.5 | 402910.3 | 422531.4 | 387878.8 | 443078.7 |
| Non-model (ms) | 4 | 0 | 89880.49 | 87367.86 | 94382.53 | 85904.52 | 101814.1 |
| Startup (ms) | 4 | 0 | 481.9241 | 480.4095 | 513.4207 | 477.2104 | 606.566 |
| First byte (ms) | 4 | 0 | 1273.776 | 1262.859 | 1288.36 | 1259.371 | 1302.847 |
| API turns | 4 | 0 | 97.5 | 91.75 | 101.5 | 79 | 109 |
| Input tokens | 4 | 0 | 7312862 | 6857357 | 7822749 | 6308824 | 8534425 |
| Output tokens | 4 | 0 | 70304 | 69404.5 | 73378 | 68683 | 80623 |
| Cached input (%) | 4 | 0 | 99.1226 | 99.06892 | 99.16897 | 98.98415 | 99.23181 |
| Static cost (USD) | 4 | 0 | 0.0735428 | 0.0721707 | 0.07643644 | 0.06955721 | 0.08361454 |
| Model request count | 4 | 0 | 97.5 | 91.75 | 101.5 | 79 | 109 |
| Within-run median request duration (ms) | 4 | 0 | 2431.297 | 2306.722 | 2579.614 | 2213.064 | 2744.496 |
| Within-run median request wait (ms) | 4 | 0 | 1273.776 | 1262.859 | 1288.36 | 1259.371 | 1302.847 |
| Within-run median request transfer (ms) | 4 | 0 | 1083.596 | 1045.2 | 1193.608 | 930.1847 | 1523.471 |
| Within-run median inter-request gap (ms) | 4 | 0 | 66.7912 | 63.54569 | 75.60743 | 63.52835 | 92.33693 |
| Largest request duration (ms) | 4 | 0 | 37167.13 | 34348.58 | 46291.69 | 27439.41 | 72118.87 |
| Largest inter-request gap (ms) | 4 | 0 | 11096.49 | 10179.81 | 12128.31 | 10177.67 | 12475.86 |
| Time after last model response (ms) | 4 | 0 | 5156.709 | 5153.5 | 5160.816 | 5148.217 | 5168.794 |

#### superjson-error-stack-serialization — codex @ codex-cli 0.149.1 — Verification failure (verify_error)

Selected attempts: 4. Task identity: \[&quot;superjson-error-stack-serialization&quot;,&quot;f143004734ea2dd4090e45013a07f091f5bbaee7&quot;,&quot;sha256:35885e6968c593c18f1b761ffd32486001e6774b7d5f2847aadff2e994086cd8&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 4 | 0 | 380760.4 | 341144.7 | 442412.6 | 339214.7 | 510451.9 |
| Model (ms) | 4 | 0 | 347454.5 | 314488 | 402066.9 | 313701.7 | 467791.1 |
| Non-model (ms) | 4 | 0 | 32687.18 | 26021.27 | 39179.13 | 23312.35 | 41366.17 |
| Startup (ms) | 4 | 0 | 1157.17 | 1145.199 | 1195.19 | 1123.916 | 1294.616 |
| First byte (ms) | 4 | 0 | 1251.637 | 1230.197 | 1272.507 | 1188.238 | 1312.758 |
| API turns | 4 | 0 | 62 | 58.75 | 65.75 | 55 | 71 |
| Input tokens | 4 | 0 | 4304430 | 3886258 | 5087849 | 3756506 | 6313341 |
| Output tokens | 4 | 0 | 71577 | 65397.5 | 82051.5 | 64631 | 95703 |
| Cached input (%) | 4 | 0 | 98.97132 | 98.84432 | 99.07312 | 98.62441 | 99.21745 |
| Static cost (USD) | 3 | 1 | 0.0582574 | 0.05753836 | 0.07094088 | 0.05681933 | 0.08362436 |
| Model request count | 4 | 0 | 62 | 58.75 | 65.75 | 55 | 71 |
| Within-run median request duration (ms) | 4 | 0 | 2533.027 | 2307.79 | 2809.382 | 2086.108 | 3184.416 |
| Within-run median request wait (ms) | 4 | 0 | 1251.637 | 1230.197 | 1272.507 | 1188.238 | 1312.758 |
| Within-run median request transfer (ms) | 4 | 0 | 1247.866 | 1027.12 | 1438.084 | 706.032 | 1667.585 |
| Within-run median inter-request gap (ms) | 4 | 0 | 61.84661 | 59.28824 | 70.24203 | 57.99526 | 89.04615 |
| Largest request duration (ms) | 4 | 0 | 103927.8 | 91100.13 | 110542.6 | 68070.49 | 114933.7 |
| Largest inter-request gap (ms) | 4 | 0 | 2117.381 | 1967.495 | 2299.985 | 1954.467 | 2411.168 |
| Time after last model response (ms) | 4 | 0 | 5149.811 | 5145.365 | 5153.588 | 5143.306 | 5153.645 |

#### textual-richlog-follow-state — codex @ codex-cli 0.149.1 — Verification failure (verify_error)

Selected attempts: 4. Task identity: \[&quot;textual-richlog-follow-state&quot;,&quot;a12215b791587a6d94227bd30a0e9291de932106&quot;,&quot;sha256:6c43ffe7837bea49f812f13adf8d5cd8a953d38ac3f8e2b97dfacc9f7bf4634b&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 4 | 0 | 1319847 | 1233483 | 1369807 | 1034341 | 1459738 |
| Model (ms) | 4 | 0 | 705550.1 | 682950.2 | 749174.5 | 647755.1 | 847442.8 |
| Non-model (ms) | 4 | 0 | 597080.7 | 533758.6 | 619558.8 | 386114.5 | 644670.7 |
| Startup (ms) | 4 | 0 | 474.4448 | 471.9729 | 634.3178 | 471.029 | 1107.465 |
| First byte (ms) | 4 | 0 | 1464.702 | 1446.245 | 1470.908 | 1405.615 | 1474.789 |
| API turns | 4 | 0 | 172 | 156.5 | 178.5 | 116 | 192 |
| Input tokens | 4 | 0 | 19360340 | 17969910 | 20480570 | 13834130 | 23805720 |
| Output tokens | 4 | 0 | 122943.5 | 119072 | 130244.3 | 115412 | 144192 |
| Cached input (%) | 4 | 0 | 99.47987 | 99.44564 | 99.52426 | 99.41233 | 99.58804 |
| Static cost (USD) | 4 | 0 | 0.1435945 | 0.1392608 | 0.1514208 | 0.1288103 | 0.1723488 |
| Model request count | 4 | 0 | 172 | 156.5 | 178.5 | 116 | 192 |
| Within-run median request duration (ms) | 4 | 0 | 2731.113 | 2665.354 | 2927.242 | 2654.864 | 3328.837 |
| Within-run median request wait (ms) | 4 | 0 | 1464.702 | 1446.245 | 1470.908 | 1405.615 | 1474.789 |
| Within-run median request transfer (ms) | 4 | 0 | 1276.451 | 1214.608 | 1454.871 | 1162.975 | 1856.238 |
| Within-run median inter-request gap (ms) | 4 | 0 | 67.1033 | 63.70732 | 70.01157 | 62.12566 | 70.13011 |
| Largest request duration (ms) | 4 | 0 | 36148.55 | 30883.09 | 41238.11 | 28105.9 | 43487.63 |
| Largest inter-request gap (ms) | 4 | 0 | 146635.2 | 135976.6 | 156259.5 | 132120.4 | 157013 |
| Time after last model response (ms) | 4 | 0 | 5263.504 | 5178.875 | 5370.878 | 5178.237 | 5439.75 |

#### tomlkit-toml-table-converters — codex @ codex-cli 0.149.1 — Pass (completed)

Selected attempts: 5. Task identity: \[&quot;tomlkit-toml-table-converters&quot;,&quot;962de91aaf103135f400e5108a798a59a10dc17e&quot;,&quot;sha256:e7cc1016b833bde77abc2597d451c5fab0d3bf7d6e886201db050ed0368560ec&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 5 | 0 | 719564.8 | 631351.2 | 753302.9 | 613245.2 | 760624.5 |
| Model (ms) | 5 | 0 | 664857.8 | 584034.1 | 714145.5 | 569366 | 723339.1 |
| Non-model (ms) | 5 | 0 | 43399.63 | 38685.93 | 46217.81 | 36822.52 | 54234.5 |
| Startup (ms) | 5 | 0 | 472.5123 | 471.4749 | 479.5398 | 462.9194 | 1099.286 |
| First byte (ms) | 5 | 0 | 1382.307 | 1368.874 | 1416.383 | 1329.85 | 1442.948 |
| API turns | 5 | 0 | 126 | 95 | 133 | 86 | 147 |
| Input tokens | 5 | 0 | 14076370 | 9776475 | 14949850 | 9535017 | 16491670 |
| Output tokens | 5 | 0 | 117536 | 117371 | 136915 | 116353 | 140816 |
| Cached input (%) | 5 | 0 | 99.48452 | 99.2973 | 99.50568 | 99.25721 | 99.50621 |
| Static cost (USD) | 5 | 0 | 0.1317836 | 0.1098508 | 0.1369473 | 0.1095379 | 0.1378502 |
| Model request count | 5 | 0 | 126 | 95 | 133 | 86 | 147 |
| Within-run median request duration (ms) | 5 | 0 | 3439.859 | 3007.139 | 3501.619 | 2804.731 | 3659.033 |
| Within-run median request wait (ms) | 5 | 0 | 1382.307 | 1368.874 | 1416.383 | 1329.85 | 1442.948 |
| Within-run median request transfer (ms) | 5 | 0 | 1991.921 | 1537.179 | 2070.328 | 1328.525 | 2212.8 |
| Within-run median inter-request gap (ms) | 5 | 0 | 84.49952 | 83.21187 | 84.83664 | 80.06458 | 87.63644 |
| Largest request duration (ms) | 5 | 0 | 72621.46 | 44082.43 | 77656.11 | 37880.16 | 78778.64 |
| Largest inter-request gap (ms) | 5 | 0 | 7772.521 | 7636.733 | 7773.711 | 2925.686 | 10182.28 |
| Time after last model response (ms) | 5 | 0 | 5158.632 | 5156.055 | 5164.927 | 5130.513 | 5168.152 |

#### true-myth-iterable-collection-combinators — codex @ codex-cli 0.149.1 — Pass (completed)

Selected attempts: 5. Task identity: \[&quot;true-myth-iterable-collection-combinators&quot;,&quot;5945ad1b96e228ff716275d8a273282101152508&quot;,&quot;sha256:f92488780ccbb58b036e59481045a7b179906646b26f81c26373e46be9217afa&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 5 | 0 | 473204.1 | 466810.8 | 490409.7 | 453988.4 | 498058.2 |
| Model (ms) | 5 | 0 | 403894.8 | 401034.2 | 427642.5 | 393163.6 | 435214.6 |
| Non-model (ms) | 5 | 0 | 64667 | 60321.91 | 68802.63 | 54690.58 | 69919.58 |
| Startup (ms) | 5 | 0 | 504.5392 | 502.9148 | 506.7101 | 496.1684 | 1109.566 |
| First byte (ms) | 5 | 0 | 1312.103 | 1296.067 | 1343.918 | 1258.468 | 1364.688 |
| API turns | 5 | 0 | 92 | 85 | 102 | 78 | 102 |
| Input tokens | 5 | 0 | 8283689 | 7289931 | 8427044 | 6678627 | 9654895 |
| Output tokens | 5 | 0 | 77370 | 74031 | 79020 | 73341 | 89524 |
| Cached input (%) | 5 | 0 | 98.98585 | 98.98058 | 99.00321 | 98.86775 | 99.13227 |
| Static cost (USD) | 5 | 0 | 0.08003496 | 0.07856387 | 0.08953382 | 0.0772127 | 0.09091479 |
| Model request count | 5 | 0 | 92 | 85 | 102 | 78 | 102 |
| Within-run median request duration (ms) | 5 | 0 | 2334.711 | 2126.119 | 2489.309 | 2004.362 | 2634.326 |
| Within-run median request wait (ms) | 5 | 0 | 1312.103 | 1296.067 | 1343.918 | 1258.468 | 1364.688 |
| Within-run median request transfer (ms) | 5 | 0 | 890.4262 | 798.9436 | 1079.633 | 683.9026 | 1176.471 |
| Within-run median inter-request gap (ms) | 5 | 0 | 57.1577 | 55.93935 | 57.19222 | 55.78307 | 57.68381 |
| Largest request duration (ms) | 5 | 0 | 24721.43 | 24452.69 | 28031.01 | 20198.75 | 36743.16 |
| Largest inter-request gap (ms) | 5 | 0 | 15026.34 | 15022.21 | 18236.33 | 5580.772 | 18426.57 |
| Time after last model response (ms) | 5 | 0 | 5154.983 | 5151.226 | 5188.549 | 5139.721 | 7277.199 |

#### cattrs-partial-structuring-recovery — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Pass (completed)

Selected attempts: 2. Task identity: \[&quot;cattrs-partial-structuring-recovery&quot;,&quot;91df27b2a20f26c35777a92f4555438b62c06345&quot;,&quot;sha256:a8c03de04a7b0d8162d83465a98ab9ef392dfe986a460d5c7e463ce1f0937aa3&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 800776.7 | 782179.9 | 819373.6 | 763583.1 | 837970.4 |
| Model (ms) | 2 | 0 | 623390.8 | 616500.5 | 630281.1 | 609610.2 | 637171.4 |
| Non-model (ms) | 2 | 0 | 173254.6 | 147884.7 | 198624.5 | 122514.8 | 223994.5 |
| Startup (ms) | 2 | 0 | 4131.308 | 4014.097 | 4248.519 | 3896.886 | 4365.73 |
| First byte (ms) | 2 | 0 | 1458.567 | 1447.293 | 1469.841 | 1436.019 | 1481.115 |
| API turns | 2 | 0 | 120.5 | 111.25 | 129.75 | 102 | 139 |
| Input tokens | 2 | 0 | 16756260 | 15827730 | 17684790 | 14899200 | 18613320 |
| Output tokens | 2 | 0 | 121025.5 | 120475.8 | 121575.3 | 119926 | 122125 |
| Cached input (%) | 2 | 0 | 99.23354 | 99.19022 | 99.27686 | 99.1469 | 99.32019 |
| Static cost (USD) | 2 | 0 | 0.1415267 | 0.1390919 | 0.1439615 | 0.136657 | 0.1463964 |
| Model request count | 2 | 0 | 120.5 | 111.25 | 129.75 | 102 | 139 |
| Within-run median request duration (ms) | 2 | 0 | 3181.985 | 3017.218 | 3346.753 | 2852.45 | 3511.52 |
| Within-run median request wait (ms) | 2 | 0 | 1458.567 | 1447.293 | 1469.841 | 1436.019 | 1481.115 |
| Within-run median request transfer (ms) | 2 | 0 | 1593.573 | 1442.064 | 1745.082 | 1290.556 | 1896.59 |
| Within-run median inter-request gap (ms) | 2 | 0 | 161.0671 | 161.0197 | 161.1144 | 160.9724 | 161.1617 |
| Largest request duration (ms) | 2 | 0 | 43651.41 | 40680.16 | 46622.66 | 37708.9 | 49593.92 |
| Largest inter-request gap (ms) | 2 | 0 | 58259.69 | 57547.04 | 58972.35 | 56834.39 | 59685 |
| Time after last model response (ms) | 2 | 0 | 271.5626 | 269.4989 | 273.6262 | 267.4352 | 275.6899 |

#### cattrs-partial-structuring-recovery — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Verification failure (verify_error)

Selected attempts: 3. Task identity: \[&quot;cattrs-partial-structuring-recovery&quot;,&quot;91df27b2a20f26c35777a92f4555438b62c06345&quot;,&quot;sha256:a8c03de04a7b0d8162d83465a98ab9ef392dfe986a460d5c7e463ce1f0937aa3&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 3 | 0 | 723064.9 | 693488.7 | 745027.4 | 663912.6 | 766990 |
| Model (ms) | 3 | 0 | 552919.8 | 546298.4 | 575180.4 | 539677.1 | 597441 |
| Non-model (ms) | 3 | 0 | 165762.3 | 113651.4 | 193302.2 | 61540.51 | 220842 |
| Startup (ms) | 3 | 0 | 4931.043 | 4656.9 | 5700.995 | 4382.756 | 6470.946 |
| First byte (ms) | 3 | 0 | 1519.838 | 1517.564 | 1520.173 | 1515.29 | 1520.507 |
| API turns | 3 | 0 | 99 | 98 | 107 | 97 | 115 |
| Input tokens | 3 | 0 | 13992060 | 12959850 | 14858340 | 11927640 | 15724620 |
| Output tokens | 3 | 0 | 97194 | 96726 | 106420 | 96258 | 115646 |
| Cached input (%) | 3 | 0 | 99.2115 | 99.16377 | 99.22212 | 99.11604 | 99.23274 |
| Static cost (USD) | 3 | 0 | 0.1232255 | 0.1161311 | 0.1254037 | 0.1090367 | 0.127582 |
| Model request count | 3 | 0 | 99 | 98 | 107 | 97 | 115 |
| Within-run median request duration (ms) | 3 | 0 | 3051.114 | 2775.989 | 3119.659 | 2500.863 | 3188.204 |
| Within-run median request wait (ms) | 3 | 0 | 1519.838 | 1517.564 | 1520.173 | 1515.29 | 1520.507 |
| Within-run median request transfer (ms) | 3 | 0 | 1450.006 | 1216.689 | 1539.485 | 983.3715 | 1628.965 |
| Within-run median inter-request gap (ms) | 3 | 0 | 171.9758 | 171.686 | 172.1656 | 171.3963 | 172.3554 |
| Largest request duration (ms) | 3 | 0 | 47230.49 | 44699.71 | 52650.72 | 42168.92 | 58070.94 |
| Largest inter-request gap (ms) | 3 | 0 | 59329.41 | 34690.97 | 59708.44 | 10052.54 | 60087.47 |
| Time after last model response (ms) | 3 | 0 | 261.5952 | 256.6259 | 271.0063 | 251.6565 | 280.4173 |

#### happy-dom-deterministic-intersectionobserver — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Pass (completed)

Selected attempts: 2. Task identity: \[&quot;happy-dom-deterministic-intersectionobserver&quot;,&quot;32b2a8e60eab482c023af377160bf294d6da0318&quot;,&quot;sha256:fa6e7f7d727d5fa5ec3367c5a2043259662d5a6877f49f3c46fd2f1edb181160&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 972079.6 | 895741.3 | 1048418 | 819403 | 1124756 |
| Model (ms) | 2 | 0 | 757254.3 | 718515.5 | 795993.2 | 679776.6 | 834732.1 |
| Non-model (ms) | 2 | 0 | 208986.5 | 171157.5 | 246815.5 | 133328.5 | 284644.4 |
| Startup (ms) | 2 | 0 | 5838.725 | 5609.179 | 6068.272 | 5379.632 | 6297.819 |
| First byte (ms) | 2 | 0 | 1598.074 | 1586.591 | 1609.557 | 1575.107 | 1621.041 |
| API turns | 2 | 0 | 103 | 101 | 105 | 99 | 107 |
| Input tokens | 2 | 0 | 14529210 | 13577430 | 15480990 | 12625650 | 16432770 |
| Output tokens | 2 | 0 | 138234 | 128584 | 147884 | 118934 | 157534 |
| Cached input (%) | 2 | 0 | 99.31454 | 99.27714 | 99.35193 | 99.23975 | 99.38932 |
| Static cost (USD) | 2 | 0 | 0.1409589 | 0.1321531 | 0.1497647 | 0.1233473 | 0.1585704 |
| Model request count | 2 | 0 | 103 | 101 | 105 | 99 | 107 |
| Within-run median request duration (ms) | 2 | 0 | 3324.675 | 3182.955 | 3466.395 | 3041.235 | 3608.115 |
| Within-run median request wait (ms) | 2 | 0 | 1598.074 | 1586.591 | 1609.557 | 1575.107 | 1621.041 |
| Within-run median request transfer (ms) | 2 | 0 | 1704.162 | 1493.473 | 1914.851 | 1282.785 | 2125.539 |
| Within-run median inter-request gap (ms) | 2 | 0 | 170.1211 | 162.4653 | 177.7768 | 154.8095 | 185.4326 |
| Largest request duration (ms) | 2 | 0 | 57836.84 | 51614.86 | 64058.81 | 45392.89 | 70280.79 |
| Largest inter-request gap (ms) | 2 | 0 | 46794.82 | 34952.32 | 58637.32 | 23109.82 | 70479.82 |
| Time after last model response (ms) | 2 | 0 | 295.3158 | 292.0935 | 298.5381 | 288.8712 | 301.7604 |

#### happy-dom-deterministic-intersectionobserver — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Verification failure (verify_error)

Selected attempts: 3. Task identity: \[&quot;happy-dom-deterministic-intersectionobserver&quot;,&quot;32b2a8e60eab482c023af377160bf294d6da0318&quot;,&quot;sha256:fa6e7f7d727d5fa5ec3367c5a2043259662d5a6877f49f3c46fd2f1edb181160&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 3 | 0 | 691017.6 | 672401.2 | 739290.3 | 653784.8 | 787562.9 |
| Model (ms) | 3 | 0 | 574555.7 | 568367.3 | 638574.4 | 562179 | 702593.2 |
| Non-model (ms) | 3 | 0 | 80058.16 | 76752.46 | 102061.4 | 73446.75 | 124064.7 |
| Startup (ms) | 3 | 0 | 4911.606 | 4842.744 | 5347.01 | 4773.883 | 5782.414 |
| First byte (ms) | 3 | 0 | 1529.944 | 1512.636 | 1542.64 | 1495.329 | 1555.337 |
| API turns | 3 | 0 | 106 | 99.5 | 108 | 93 | 110 |
| Input tokens | 3 | 0 | 13371770 | 12215080 | 13560950 | 11058390 | 13750130 |
| Output tokens | 3 | 0 | 106339 | 105894 | 118394.5 | 105449 | 130450 |
| Cached input (%) | 3 | 0 | 99.18321 | 99.15176 | 99.23511 | 99.12032 | 99.287 |
| Static cost (USD) | 3 | 0 | 0.1206762 | 0.1154662 | 0.1273041 | 0.1102562 | 0.133932 |
| Model request count | 3 | 0 | 106 | 99.5 | 108 | 93 | 110 |
| Within-run median request duration (ms) | 3 | 0 | 2788.586 | 2666.708 | 2822.095 | 2544.83 | 2855.604 |
| Within-run median request wait (ms) | 3 | 0 | 1529.944 | 1512.636 | 1542.64 | 1495.329 | 1555.337 |
| Within-run median request transfer (ms) | 3 | 0 | 1178.052 | 1104.785 | 1246.281 | 1031.519 | 1314.509 |
| Within-run median inter-request gap (ms) | 3 | 0 | 138.507 | 135.6333 | 140.3742 | 132.7595 | 142.2414 |
| Largest request duration (ms) | 3 | 0 | 57389.07 | 43297.46 | 59704.51 | 29205.84 | 62019.95 |
| Largest inter-request gap (ms) | 3 | 0 | 17136.28 | 12682.3 | 44203.48 | 8228.318 | 71270.67 |
| Time after last model response (ms) | 3 | 0 | 269.6647 | 268.2144 | 292.7923 | 266.7642 | 315.9199 |

#### ink-grid-box-layout — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Verification failure (verify_error)

Selected attempts: 5. Task identity: \[&quot;ink-grid-box-layout&quot;,&quot;477fda7df7781406d2ba046eb48dd5391e964b72&quot;,&quot;sha256:b093eab15a3872c9a84f54190d76d138296cf44430826a649b15936370013c91&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 5 | 0 | 1051013 | 610433.4 | 1242248 | 550904.1 | 1983622 |
| Model (ms) | 5 | 0 | 663201.8 | 484463.6 | 792014.6 | 365807.8 | 1045879 |
| Non-model (ms) | 5 | 0 | 383418.7 | 238351.6 | 442897.4 | 56326.09 | 932867.1 |
| Startup (ms) | 5 | 0 | 6273.901 | 4875.118 | 7335.575 | 4392.418 | 10114.45 |
| First byte (ms) | 5 | 0 | 1535.062 | 1498.775 | 1590.971 | 1353.753 | 1753.481 |
| API turns | 5 | 0 | 122 | 66 | 151 | 64 | 166 |
| Input tokens | 5 | 0 | 16775250 | 7080306 | 27612040 | 5806375 | 28499230 |
| Output tokens | 5 | 0 | 115683 | 93922 | 129504 | 68877 | 188422 |
| Cached input (%) | 5 | 0 | 99.34637 | 98.6546 | 99.46689 | 98.51958 | 99.53279 |
| Static cost (USD) | 5 | 0 | 0.1358538 | 0.09300236 | 0.1821773 | 0.07022882 | 0.2181239 |
| Model request count | 5 | 0 | 122 | 66 | 151 | 64 | 166 |
| Within-run median request duration (ms) | 5 | 0 | 2631.557 | 2367.032 | 3052.537 | 2302.22 | 3496.618 |
| Within-run median request wait (ms) | 5 | 0 | 1535.062 | 1498.775 | 1590.971 | 1353.753 | 1753.481 |
| Within-run median request transfer (ms) | 5 | 0 | 972.6161 | 892.67 | 1354.176 | 804.7864 | 1574.655 |
| Within-run median inter-request gap (ms) | 5 | 0 | 180.235 | 177.5331 | 180.9502 | 163.047 | 234.3087 |
| Largest request duration (ms) | 5 | 0 | 60387.33 | 60282.01 | 67262.56 | 49818.32 | 99587.15 |
| Largest inter-request gap (ms) | 5 | 0 | 83807.5 | 66538.73 | 91354.75 | 13467.68 | 174344.5 |
| Time after last model response (ms) | 5 | 0 | 269.3566 | 264.0398 | 3625.44 | 256.5921 | 86554.61 |

#### psd-tools-blend-range-api — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Pass (completed)

Selected attempts: 4. Task identity: \[&quot;psd-tools-blend-range-api&quot;,&quot;01595992c5f4d4695251fdf58b3edb5302d3ba46&quot;,&quot;sha256:529c5d6b0b6781fc7767d390c82bd94edc9935cb30d04a304f292dfaf4780a32&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 4 | 0 | 520348.7 | 448858.2 | 603475.5 | 414964.9 | 672277.4 |
| Model (ms) | 4 | 0 | 410811.3 | 356825.1 | 472671.5 | 339554.3 | 513564.2 |
| Non-model (ms) | 4 | 0 | 104949.6 | 87473.4 | 126598.8 | 71600.91 | 154990.2 |
| Startup (ms) | 4 | 0 | 4087.802 | 3788.017 | 4476.85 | 3723.018 | 4809.639 |
| First byte (ms) | 4 | 0 | 1313.907 | 1273.415 | 1368.154 | 1249.688 | 1433.148 |
| API turns | 4 | 0 | 87 | 73.75 | 107.75 | 70 | 134 |
| Input tokens | 4 | 0 | 8836440 | 7035079 | 12112310 | 6851256 | 16719670 |
| Output tokens | 4 | 0 | 81588 | 73056.25 | 89908.5 | 70084 | 92247 |
| Cached input (%) | 4 | 0 | 98.87378 | 98.70269 | 99.07589 | 98.64132 | 99.23031 |
| Static cost (USD) | 4 | 0 | 0.0891082 | 0.07775934 | 0.1063873 | 0.07751276 | 0.1244245 |
| Model request count | 4 | 0 | 87 | 73.75 | 107.75 | 70 | 134 |
| Within-run median request duration (ms) | 4 | 0 | 2391.549 | 2355.983 | 2518.404 | 2342.346 | 2805.906 |
| Within-run median request wait (ms) | 4 | 0 | 1313.907 | 1273.415 | 1368.154 | 1249.688 | 1433.148 |
| Within-run median request transfer (ms) | 4 | 0 | 1068.487 | 1029.11 | 1175.944 | 1015.611 | 1393.683 |
| Within-run median inter-request gap (ms) | 4 | 0 | 177.506 | 174.4536 | 190.091 | 172.5489 | 220.5935 |
| Largest request duration (ms) | 4 | 0 | 54755.44 | 49793.46 | 59496.99 | 36194.86 | 72434.27 |
| Largest inter-request gap (ms) | 4 | 0 | 22470.35 | 18715.63 | 24131.2 | 12263.09 | 24302.14 |
| Time after last model response (ms) | 4 | 0 | 292.087 | 262.6579 | 3347.636 | 250.8015 | 12437.85 |

#### psd-tools-blend-range-api — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;psd-tools-blend-range-api&quot;,&quot;01595992c5f4d4695251fdf58b3edb5302d3ba46&quot;,&quot;sha256:529c5d6b0b6781fc7767d390c82bd94edc9935cb30d04a304f292dfaf4780a32&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 641946 | unavailable | unavailable | 641946 | 641946 |
| Model (ms) | 1 | 0 | 521705.7 | unavailable | unavailable | 521705.7 | 521705.7 |
| Non-model (ms) | 1 | 0 | 115170.3 | unavailable | unavailable | 115170.3 | 115170.3 |
| Startup (ms) | 1 | 0 | 5070.008 | unavailable | unavailable | 5070.008 | 5070.008 |
| First byte (ms) | 1 | 0 | 1387.523 | unavailable | unavailable | 1387.523 | 1387.523 |
| API turns | 1 | 0 | 119 | unavailable | unavailable | 119 | 119 |
| Input tokens | 1 | 0 | 13888360 | unavailable | unavailable | 13888360 | 13888360 |
| Output tokens | 1 | 0 | 100037 | unavailable | unavailable | 100037 | 100037 |
| Cached input (%) | 1 | 0 | 99.1163 | unavailable | unavailable | 99.1163 | 99.1163 |
| Static cost (USD) | 1 | 0 | 0.1197289 | unavailable | unavailable | 0.1197289 | 0.1197289 |
| Model request count | 1 | 0 | 119 | unavailable | unavailable | 119 | 119 |
| Within-run median request duration (ms) | 1 | 0 | 2331.499 | unavailable | unavailable | 2331.499 | 2331.499 |
| Within-run median request wait (ms) | 1 | 0 | 1387.523 | unavailable | unavailable | 1387.523 | 1387.523 |
| Within-run median request transfer (ms) | 1 | 0 | 963.8541 | unavailable | unavailable | 963.8541 | 963.8541 |
| Within-run median inter-request gap (ms) | 1 | 0 | 178.0318 | unavailable | unavailable | 178.0318 | 178.0318 |
| Largest request duration (ms) | 1 | 0 | 35690.96 | unavailable | unavailable | 35690.96 | 35690.96 |
| Largest inter-request gap (ms) | 1 | 0 | 12459.13 | unavailable | unavailable | 12459.13 | 12459.13 |
| Time after last model response (ms) | 1 | 0 | 270.0929 | unavailable | unavailable | 270.0929 | 270.0929 |

#### superjson-error-stack-serialization — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Pass (completed)

Selected attempts: 1. Task identity: \[&quot;superjson-error-stack-serialization&quot;,&quot;f143004734ea2dd4090e45013a07f091f5bbaee7&quot;,&quot;sha256:9cc29a9cf9c9e48c818f56a810cf3a9a287bd7c1991b08c6610113f7ac15c3e8&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 434795.4 | unavailable | unavailable | 434795.4 | 434795.4 |
| Model (ms) | 1 | 0 | 395767.5 | unavailable | unavailable | 395767.5 | 395767.5 |
| Non-model (ms) | 1 | 0 | 33752.35 | unavailable | unavailable | 33752.35 | 33752.35 |
| Startup (ms) | 1 | 0 | 5275.488 | unavailable | unavailable | 5275.488 | 5275.488 |
| First byte (ms) | 1 | 0 | 1374.063 | unavailable | unavailable | 1374.063 | 1374.063 |
| API turns | 1 | 0 | 59 | unavailable | unavailable | 59 | 59 |
| Input tokens | 1 | 0 | 5167938 | unavailable | unavailable | 5167938 | 5167938 |
| Output tokens | 1 | 0 | 79106 | unavailable | unavailable | 79106 | 79106 |
| Cached input (%) | 1 | 0 | 98.79995 | unavailable | unavailable | 98.79995 | 98.79995 |
| Static cost (USD) | 1 | 0 | 0.07208406 | unavailable | unavailable | 0.07208406 | 0.07208406 |
| Model request count | 1 | 0 | 59 | unavailable | unavailable | 59 | 59 |
| Within-run median request duration (ms) | 1 | 0 | 2589.779 | unavailable | unavailable | 2589.779 | 2589.779 |
| Within-run median request wait (ms) | 1 | 0 | 1374.063 | unavailable | unavailable | 1374.063 | 1374.063 |
| Within-run median request transfer (ms) | 1 | 0 | 1063.909 | unavailable | unavailable | 1063.909 | 1063.909 |
| Within-run median inter-request gap (ms) | 1 | 0 | 169.5611 | unavailable | unavailable | 169.5611 | 169.5611 |
| Largest request duration (ms) | 1 | 0 | 126149.2 | unavailable | unavailable | 126149.2 | 126149.2 |
| Largest inter-request gap (ms) | 1 | 0 | 8283.433 | unavailable | unavailable | 8283.433 | 8283.433 |
| Time after last model response (ms) | 1 | 0 | 251.691 | unavailable | unavailable | 251.691 | 251.691 |

#### superjson-error-stack-serialization — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Verification failure (verify_error)

Selected attempts: 4. Task identity: \[&quot;superjson-error-stack-serialization&quot;,&quot;f143004734ea2dd4090e45013a07f091f5bbaee7&quot;,&quot;sha256:9cc29a9cf9c9e48c818f56a810cf3a9a287bd7c1991b08c6610113f7ac15c3e8&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 4 | 0 | 510347.9 | 466820.8 | 545125.4 | 429300.5 | 556396.7 |
| Model (ms) | 4 | 0 | 433064.9 | 423342.5 | 454994.2 | 394661.2 | 520296.1 |
| Non-model (ms) | 4 | 0 | 36201.93 | 30864.12 | 56673.97 | 29879.06 | 103061.7 |
| Startup (ms) | 4 | 0 | 4993.915 | 4871.149 | 5113.102 | 4760.217 | 5213.295 |
| First byte (ms) | 4 | 0 | 1419.041 | 1416.366 | 1429.751 | 1415.142 | 1455.085 |
| API turns | 4 | 0 | 55 | 52 | 57.75 | 49 | 60 |
| Input tokens | 4 | 0 | 5225441 | 4884929 | 5793694 | 4816569 | 6545277 |
| Output tokens | 4 | 0 | 86632.5 | 82508.25 | 92906.5 | 77262 | 104602 |
| Cached input (%) | 4 | 0 | 98.80736 | 98.75971 | 98.8965 | 98.73108 | 99.04962 |
| Static cost (USD) | 4 | 0 | 0.07724735 | 0.07515461 | 0.08084707 | 0.06898143 | 0.09154117 |
| Model request count | 4 | 0 | 55 | 52 | 57.75 | 49 | 60 |
| Within-run median request duration (ms) | 4 | 0 | 3135.744 | 3022.849 | 3335.868 | 2846.326 | 3774.077 |
| Within-run median request wait (ms) | 4 | 0 | 1419.041 | 1416.366 | 1429.751 | 1415.142 | 1455.085 |
| Within-run median request transfer (ms) | 4 | 0 | 1614.754 | 1474.547 | 1863.095 | 1451.786 | 2210.26 |
| Within-run median inter-request gap (ms) | 4 | 0 | 171.4118 | 165.6201 | 201.6068 | 160.7517 | 279.6856 |
| Largest request duration (ms) | 4 | 0 | 142553.2 | 122881.4 | 162051.2 | 121528.7 | 162882.9 |
| Largest inter-request gap (ms) | 4 | 0 | 8242.884 | 8239.725 | 24008.03 | 8237.66 | 71296.04 |
| Time after last model response (ms) | 4 | 0 | 258.523 | 256.4962 | 260.859 | 255.5035 | 262.7792 |

#### textual-richlog-follow-state — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Pass (completed)

Selected attempts: 1. Task identity: \[&quot;textual-richlog-follow-state&quot;,&quot;a12215b791587a6d94227bd30a0e9291de932106&quot;,&quot;sha256:5b0166c0ee50a230850e78d5550fe32442834eb63599802d0a99faff0ba9af87&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 2572629 | unavailable | unavailable | 2572629 | 2572629 |
| Model (ms) | 1 | 0 | 1624428 | unavailable | unavailable | 1624428 | 1624428 |
| Non-model (ms) | 1 | 0 | 943907.3 | unavailable | unavailable | 943907.3 | 943907.3 |
| Startup (ms) | 1 | 0 | 4293.709 | unavailable | unavailable | 4293.709 | 4293.709 |
| First byte (ms) | 1 | 0 | 1970.943 | unavailable | unavailable | 1970.943 | 1970.943 |
| API turns | 1 | 0 | 252 | unavailable | unavailable | 252 | 252 |
| Input tokens | 1 | 0 | 67122110 | unavailable | unavailable | 67122110 | 67122110 |
| Output tokens | 1 | 0 | 275585 | unavailable | unavailable | 275585 | 275585 |
| Cached input (%) | 1 | 0 | 99.41961 | unavailable | unavailable | 99.41961 | 99.41961 |
| Static cost (USD) | 1 | 0 | 0.4239837 | unavailable | unavailable | 0.4239837 | 0.4239837 |
| Model request count | 1 | 0 | 252 | unavailable | unavailable | 252 | 252 |
| Within-run median request duration (ms) | 1 | 0 | 3765.234 | unavailable | unavailable | 3765.234 | 3765.234 |
| Within-run median request wait (ms) | 1 | 0 | 1970.943 | unavailable | unavailable | 1970.943 | 1970.943 |
| Within-run median request transfer (ms) | 1 | 0 | 1634.39 | unavailable | unavailable | 1634.39 | 1634.39 |
| Within-run median inter-request gap (ms) | 1 | 0 | 197.9477 | unavailable | unavailable | 197.9477 | 197.9477 |
| Largest request duration (ms) | 1 | 0 | 89968.84 | unavailable | unavailable | 89968.84 | 89968.84 |
| Largest inter-request gap (ms) | 1 | 0 | 159282.8 | unavailable | unavailable | 159282.8 | 159282.8 |
| Time after last model response (ms) | 1 | 0 | 273.8738 | unavailable | unavailable | 273.8738 | 273.8738 |

#### textual-richlog-follow-state — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Verification failure (verify_error)

Selected attempts: 4. Task identity: \[&quot;textual-richlog-follow-state&quot;,&quot;a12215b791587a6d94227bd30a0e9291de932106&quot;,&quot;sha256:5b0166c0ee50a230850e78d5550fe32442834eb63599802d0a99faff0ba9af87&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 4 | 0 | 2275836 | 1881002 | 2524220 | 1431945 | 2533929 |
| Model (ms) | 4 | 0 | 1320687 | 1149868 | 1455611 | 869012.4 | 1628784 |
| Non-model (ms) | 4 | 0 | 835133.2 | 726302.5 | 948982.7 | 558495.4 | 1131846 |
| Startup (ms) | 4 | 0 | 4316.926 | 4190.131 | 4568.938 | 4171.678 | 4963.044 |
| First byte (ms) | 4 | 0 | 1852.167 | 1766.713 | 1901.899 | 1646.284 | 1915.163 |
| API turns | 4 | 0 | 190.5 | 171.25 | 202 | 133 | 217 |
| Input tokens | 4 | 0 | 38349910 | 31607990 | 44189790 | 20947550 | 52144110 |
| Output tokens | 4 | 0 | 225491 | 197020.5 | 246263.3 | 148656 | 271533 |
| Cached input (%) | 4 | 0 | 99.62235 | 99.56216 | 99.64294 | 99.38425 | 99.70203 |
| Static cost (USD) | 3 | 1 | 0.2904326 | 0.2307148 | 0.3163125 | 0.170997 | 0.3421924 |
| Model request count | 4 | 0 | 190.5 | 171.25 | 202 | 133 | 217 |
| Within-run median request duration (ms) | 4 | 0 | 3875.738 | 3561.202 | 4225.41 | 3556.745 | 4335.276 |
| Within-run median request wait (ms) | 4 | 0 | 1852.167 | 1766.713 | 1901.899 | 1646.284 | 1915.163 |
| Within-run median request transfer (ms) | 4 | 0 | 1923.608 | 1600.353 | 2244.621 | 1589.106 | 2249.142 |
| Within-run median inter-request gap (ms) | 4 | 0 | 181.2926 | 170.0916 | 192.0312 | 156.1439 | 204.5919 |
| Largest request duration (ms) | 4 | 0 | 66571.74 | 55701.22 | 79958.28 | 51240.1 | 91967.45 |
| Largest inter-request gap (ms) | 4 | 0 | 172833.6 | 171327.8 | 180277.1 | 169162.5 | 200255.3 |
| Time after last model response (ms) | 4 | 0 | 318.231 | 280.3833 | 435.6174 | 259.8903 | 694.7265 |

#### tomlkit-toml-table-converters — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Pass (completed)

Selected attempts: 5. Task identity: \[&quot;tomlkit-toml-table-converters&quot;,&quot;962de91aaf103135f400e5108a798a59a10dc17e&quot;,&quot;sha256:86a7f7545adc060de810c3aceb9356f3048262a6e0f046d863cc114bdd98dcd3&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 5 | 0 | 1625724 | 1138899 | 2073301 | 1070713 | 2278394 |
| Model (ms) | 5 | 0 | 1429657 | 1048236 | 1797904 | 1010538 | 1828118 |
| Non-model (ms) | 5 | 0 | 192278.1 | 86464.88 | 271797.8 | 56378.99 | 445739.2 |
| Startup (ms) | 5 | 0 | 3795.815 | 3788.27 | 4198.458 | 3599.076 | 4536.714 |
| First byte (ms) | 5 | 0 | 1917.208 | 1738.619 | 2059.375 | 1694.468 | 2067.216 |
| API turns | 5 | 0 | 218 | 175 | 244 | 129 | 250 |
| Input tokens | 4 | 1 | 64312390 | 51562370 | 72087590 | 36604470 | 72121010 |
| Output tokens | 4 | 1 | 275614.5 | 228204 | 310717.5 | 182073 | 319926 |
| Cached input (%) | 4 | 1 | 99.68812 | 99.65166 | 99.702 | 99.5715 | 99.71439 |
| Static cost (USD) | 4 | 1 | 0.386804 | 0.3174253 | 0.4333967 | 0.242114 | 0.4403502 |
| Model request count | 5 | 0 | 218 | 175 | 244 | 129 | 250 |
| Within-run median request duration (ms) | 5 | 0 | 3263.776 | 3199.169 | 3469.957 | 3060.127 | 3962.042 |
| Within-run median request wait (ms) | 5 | 0 | 1917.208 | 1738.619 | 2059.375 | 1694.468 | 2067.216 |
| Within-run median request transfer (ms) | 5 | 0 | 1385.994 | 1327.821 | 1573.684 | 1085.346 | 1758.966 |
| Within-run median inter-request gap (ms) | 5 | 0 | 185.0051 | 180.7589 | 186.4338 | 180.567 | 205.4008 |
| Largest request duration (ms) | 5 | 0 | 124587.9 | 110223 | 138743.4 | 85528.75 | 177928.8 |
| Largest inter-request gap (ms) | 5 | 0 | 11905.93 | 8257.146 | 15550.56 | 8227.597 | 20762.98 |
| Time after last model response (ms) | 5 | 0 | 263.4121 | 252.4715 | 265.5092 | 251.5315 | 282.3173 |

#### true-myth-iterable-collection-combinators — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Pass (completed)

Selected attempts: 5. Task identity: \[&quot;true-myth-iterable-collection-combinators&quot;,&quot;5945ad1b96e228ff716275d8a273282101152508&quot;,&quot;sha256:2d5b99141677ea769219ab882b11fa652f51f525c5960ce80e49cb7dee26a79d&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 5 | 0 | 880686.2 | 808673.1 | 901070.7 | 701758 | 1244457 |
| Model (ms) | 5 | 0 | 758970.9 | 707471.6 | 783091.6 | 619949.4 | 970230.8 |
| Non-model (ms) | 5 | 0 | 97125.45 | 93169.03 | 137563.8 | 75492.98 | 267157.8 |
| Startup (ms) | 5 | 0 | 4536.007 | 4425.491 | 6315.63 | 4076.001 | 7068.72 |
| First byte (ms) | 5 | 0 | 1748.491 | 1675.229 | 1781.472 | 1673.908 | 1784.866 |
| API turns | 5 | 0 | 104 | 99 | 122 | 96 | 148 |
| Input tokens | 5 | 0 | 20803620 | 20261460 | 21943270 | 17344890 | 33129890 |
| Output tokens | 5 | 0 | 158966 | 129016 | 159228 | 123473 | 186758 |
| Cached input (%) | 5 | 0 | 99.17135 | 99.16798 | 99.29021 | 98.97132 | 99.36938 |
| Static cost (USD) | 5 | 0 | 0.1808447 | 0.166135 | 0.183392 | 0.1523468 | 0.2421564 |
| Model request count | 5 | 0 | 104 | 99 | 122 | 96 | 148 |
| Within-run median request duration (ms) | 5 | 0 | 3340.607 | 3244.852 | 3370.877 | 3100.448 | 4772.412 |
| Within-run median request wait (ms) | 5 | 0 | 1748.491 | 1675.229 | 1781.472 | 1673.908 | 1784.866 |
| Within-run median request transfer (ms) | 5 | 0 | 1491.132 | 1382.154 | 1702.11 | 1320.628 | 2732.053 |
| Within-run median inter-request gap (ms) | 5 | 0 | 184.0425 | 179.6447 | 186.6762 | 177.3337 | 187.0766 |
| Largest request duration (ms) | 5 | 0 | 71937.25 | 54404.78 | 81340.62 | 53902.04 | 108793.2 |
| Largest inter-request gap (ms) | 5 | 0 | 8470.25 | 8239.795 | 9919.047 | 8227.451 | 140483.8 |
| Time after last model response (ms) | 5 | 0 | 280.0198 | 275.2953 | 625.2845 | 257.3443 | 630.122 |

#### cattrs-partial-structuring-recovery — pi @ 0.73.1 — Pass (completed)

Selected attempts: 4. Task identity: \[&quot;cattrs-partial-structuring-recovery&quot;,&quot;91df27b2a20f26c35777a92f4555438b62c06345&quot;,&quot;sha256:417f2ac9b8fbeec1a36dacd9ae2ca9e8c565b73e8ec7b2aa84da01428aa030e8&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 4 | 0 | 704450.9 | 646493.6 | 768262.7 | 628244.3 | 804075.6 |
| Model (ms) | 4 | 0 | 447889.1 | 437727.2 | 498512.2 | 437185.6 | 620437.5 |
| Non-model (ms) | 4 | 0 | 202097 | 187899.9 | 235387.6 | 182878.5 | 297690 |
| Startup (ms) | 4 | 0 | 763.7281 | 762.0673 | 766.1501 | 759.6861 | 770.815 |
| First byte (ms) | 4 | 0 | 1322.751 | 1285.631 | 1373.486 | 1270.731 | 1429.229 |
| API turns | 4 | 0 | 105.5 | 101.5 | 116.5 | 100 | 139 |
| Input tokens | 4 | 0 | 9618946 | 8871268 | 11848620 | 8678314 | 16487570 |
| Output tokens | 4 | 0 | 83310 | 81160.75 | 91191 | 79057 | 110490 |
| Cached input (%) | 4 | 0 | 98.40982 | 98.36071 | 98.51604 | 98.23991 | 98.80818 |
| Static cost (USD) | 4 | 0 | 0.1016579 | 0.09701551 | 0.1154432 | 0.09524461 | 0.1446425 |
| Model request count | 4 | 0 | 105.5 | 101.5 | 116.5 | 100 | 139 |
| Within-run median request duration (ms) | 4 | 0 | 2756.014 | 2601.196 | 2900.57 | 2506.946 | 2964.03 |
| Within-run median request wait (ms) | 4 | 0 | 1322.751 | 1285.631 | 1373.486 | 1270.731 | 1429.229 |
| Within-run median request transfer (ms) | 4 | 0 | 1338.27 | 1237.142 | 1463.068 | 1089.854 | 1681.367 |
| Within-run median inter-request gap (ms) | 4 | 0 | 18.3674 | 17.15872 | 19.76432 | 14.47613 | 23.01159 |
| Largest request duration (ms) | 4 | 0 | 36043 | 30467.97 | 46241.45 | 28695.68 | 61884.03 |
| Largest inter-request gap (ms) | 4 | 0 | 62025.47 | 61341.32 | 62898.56 | 60953.48 | 63853.23 |
| Time after last model response (ms) | 4 | 0 | 289.2532 | 283.7312 | 293.3003 | 279.1385 | 293.4687 |

#### cattrs-partial-structuring-recovery — pi @ 0.73.1 — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;cattrs-partial-structuring-recovery&quot;,&quot;91df27b2a20f26c35777a92f4555438b62c06345&quot;,&quot;sha256:417f2ac9b8fbeec1a36dacd9ae2ca9e8c565b73e8ec7b2aa84da01428aa030e8&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 587895.6 | unavailable | unavailable | 587895.6 | 587895.6 |
| Model (ms) | 1 | 0 | 398388.3 | unavailable | unavailable | 398388.3 | 398388.3 |
| Non-model (ms) | 1 | 0 | 188734.6 | unavailable | unavailable | 188734.6 | 188734.6 |
| Startup (ms) | 1 | 0 | 772.655 | unavailable | unavailable | 772.655 | 772.655 |
| First byte (ms) | 1 | 0 | 1333.365 | unavailable | unavailable | 1333.365 | 1333.365 |
| API turns | 1 | 0 | 85 | unavailable | unavailable | 85 | 85 |
| Input tokens | 1 | 0 | 8265502 | unavailable | unavailable | 8265502 | 8265502 |
| Output tokens | 1 | 0 | 79574 | unavailable | unavailable | 79574 | 79574 |
| Cached input (%) | 1 | 0 | 98.16454 | unavailable | unavailable | 98.16454 | 98.16454 |
| Static cost (USD) | 1 | 0 | 0.09484228 | unavailable | unavailable | 0.09484228 | 0.09484228 |
| Model request count | 1 | 0 | 85 | unavailable | unavailable | 85 | 85 |
| Within-run median request duration (ms) | 1 | 0 | 2591.913 | unavailable | unavailable | 2591.913 | 2591.913 |
| Within-run median request wait (ms) | 1 | 0 | 1333.365 | unavailable | unavailable | 1333.365 | 1333.365 |
| Within-run median request transfer (ms) | 1 | 0 | 1169.344 | unavailable | unavailable | 1169.344 | 1169.344 |
| Within-run median inter-request gap (ms) | 1 | 0 | 16.62741 | unavailable | unavailable | 16.62741 | 16.62741 |
| Largest request duration (ms) | 1 | 0 | 67567.03 | unavailable | unavailable | 67567.03 | 67567.03 |
| Largest inter-request gap (ms) | 1 | 0 | 57720.17 | unavailable | unavailable | 57720.17 | 57720.17 |
| Time after last model response (ms) | 1 | 0 | 285.644 | unavailable | unavailable | 285.644 | 285.644 |

#### happy-dom-deterministic-intersectionobserver — pi @ 0.73.1 — Pass (completed)

Selected attempts: 1. Task identity: \[&quot;happy-dom-deterministic-intersectionobserver&quot;,&quot;32b2a8e60eab482c023af377160bf294d6da0318&quot;,&quot;sha256:3d414d710d8e31ae0fcf9d23c863bbc395835fc8ea49acd0c0567e10838564c5&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 499451 | unavailable | unavailable | 499451 | 499451 |
| Model (ms) | 1 | 0 | 406441.6 | unavailable | unavailable | 406441.6 | 406441.6 |
| Non-model (ms) | 1 | 0 | 91626.68 | unavailable | unavailable | 91626.68 | 91626.68 |
| Startup (ms) | 1 | 0 | 1382.758 | unavailable | unavailable | 1382.758 | 1382.758 |
| First byte (ms) | 1 | 0 | 1165.685 | unavailable | unavailable | 1165.685 | 1165.685 |
| API turns | 1 | 0 | 76 | unavailable | unavailable | 76 | 76 |
| Input tokens | 1 | 0 | 4774551 | unavailable | unavailable | 4774551 | 4774551 |
| Output tokens | 1 | 0 | 80638 | unavailable | unavailable | 80638 | 80638 |
| Cached input (%) | 1 | 0 | 96.97012 | unavailable | unavailable | 96.97012 | 96.97012 |
| Static cost (USD) | 1 | 0 | 0.08397191 | unavailable | unavailable | 0.08397191 | 0.08397191 |
| Model request count | 1 | 0 | 76 | unavailable | unavailable | 76 | 76 |
| Within-run median request duration (ms) | 1 | 0 | 2829.639 | unavailable | unavailable | 2829.639 | 2829.639 |
| Within-run median request wait (ms) | 1 | 0 | 1165.685 | unavailable | unavailable | 1165.685 | 1165.685 |
| Within-run median request transfer (ms) | 1 | 0 | 1620.342 | unavailable | unavailable | 1620.342 | 1620.342 |
| Within-run median inter-request gap (ms) | 1 | 0 | 21.48479 | unavailable | unavailable | 21.48479 | 21.48479 |
| Largest request duration (ms) | 1 | 0 | 33611.18 | unavailable | unavailable | 33611.18 | 33611.18 |
| Largest inter-request gap (ms) | 1 | 0 | 20116.53 | unavailable | unavailable | 20116.53 | 20116.53 |
| Time after last model response (ms) | 1 | 0 | 355.0061 | unavailable | unavailable | 355.0061 | 355.0061 |

#### happy-dom-deterministic-intersectionobserver — pi @ 0.73.1 — Verification failure (verify_error)

Selected attempts: 4. Task identity: \[&quot;happy-dom-deterministic-intersectionobserver&quot;,&quot;32b2a8e60eab482c023af377160bf294d6da0318&quot;,&quot;sha256:3d414d710d8e31ae0fcf9d23c863bbc395835fc8ea49acd0c0567e10838564c5&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 4 | 0 | 550723.3 | 482814.5 | 623217.3 | 429107.2 | 690680.2 |
| Model (ms) | 4 | 0 | 434550.3 | 382555.5 | 472122.8 | 335824.9 | 475586.6 |
| Non-model (ms) | 4 | 0 | 114814.9 | 98904.45 | 149732.8 | 91938.39 | 213721.3 |
| Startup (ms) | 4 | 0 | 1358.161 | 1354.597 | 1361.675 | 1343.925 | 1372.196 |
| First byte (ms) | 4 | 0 | 1234.974 | 1213.229 | 1252.957 | 1193.854 | 1261.048 |
| API turns | 4 | 0 | 94 | 85 | 102.75 | 82 | 105 |
| Input tokens | 4 | 0 | 6498467 | 5449341 | 7347066 | 4562102 | 7632727 |
| Output tokens | 4 | 0 | 83554 | 74639.75 | 89121 | 64016 | 89703 |
| Cached input (%) | 4 | 0 | 97.81019 | 97.72772 | 98.13107 | 97.6105 | 98.9635 |
| Static cost (USD) | 4 | 0 | 0.09139117 | 0.07800464 | 0.09917167 | 0.05904695 | 0.1013113 |
| Model request count | 4 | 0 | 94 | 85 | 102.75 | 82 | 105 |
| Within-run median request duration (ms) | 4 | 0 | 2315.046 | 2221.391 | 2371.947 | 2038.194 | 2444.883 |
| Within-run median request wait (ms) | 4 | 0 | 1234.974 | 1213.229 | 1252.957 | 1193.854 | 1261.048 |
| Within-run median request transfer (ms) | 4 | 0 | 984.4361 | 955.9569 | 1037.819 | 925.36 | 1143.126 |
| Within-run median inter-request gap (ms) | 4 | 0 | 21.38232 | 19.3118 | 22.39479 | 15.6241 | 22.90832 |
| Largest request duration (ms) | 4 | 0 | 29800.77 | 26345.45 | 34756.76 | 24917.95 | 40686.32 |
| Largest inter-request gap (ms) | 4 | 0 | 20067.2 | 20022.47 | 32637.18 | 20011.88 | 70223.54 |
| Time after last model response (ms) | 4 | 0 | 309.883 | 266.0922 | 356.2215 | 254.554 | 375.4022 |

#### ink-grid-box-layout — pi @ 0.73.1 — Verification failure (verify_error)

Selected attempts: 4. Task identity: \[&quot;ink-grid-box-layout&quot;,&quot;477fda7df7781406d2ba046eb48dd5391e964b72&quot;,&quot;sha256:fbbb3a767c310003a279e0900aa0847e0bb78db90d726621d3be8286c16a9db1&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 4 | 0 | 979164.8 | 917885 | 1024695 | 768938.7 | 1126391 |
| Model (ms) | 4 | 0 | 554029.4 | 510828.2 | 616147.8 | 458502.9 | 725224.5 |
| Non-model (ms) | 4 | 0 | 393163.1 | 349697 | 432645.5 | 239394.6 | 530996.7 |
| Startup (ms) | 4 | 0 | 1288.354 | 1278.861 | 1298.264 | 1274.101 | 1304.271 |
| First byte (ms) | 4 | 0 | 1357.051 | 1287.527 | 1420.42 | 1257.692 | 1431.795 |
| API turns | 4 | 0 | 113 | 106.5 | 119.75 | 90 | 137 |
| Input tokens | 4 | 0 | 11322950 | 9511473 | 13352460 | 6948262 | 16569780 |
| Output tokens | 4 | 0 | 97218 | 87548.75 | 111134 | 82229 | 129194 |
| Cached input (%) | 4 | 0 | 98.28212 | 98.13359 | 98.4561 | 98.13332 | 98.5327 |
| Static cost (USD) | 4 | 0 | 0.1206844 | 0.1113852 | 0.1326949 | 0.08924838 | 0.1629656 |
| Model request count | 4 | 0 | 113 | 106.5 | 119.75 | 90 | 137 |
| Within-run median request duration (ms) | 4 | 0 | 2777.625 | 2647.931 | 2821.23 | 2383.434 | 2827.459 |
| Within-run median request wait (ms) | 4 | 0 | 1357.051 | 1287.527 | 1420.42 | 1257.692 | 1431.795 |
| Within-run median request transfer (ms) | 4 | 0 | 1311.043 | 1213.146 | 1366.293 | 979.7548 | 1471.74 |
| Within-run median inter-request gap (ms) | 4 | 0 | 16.98832 | 15.80269 | 19.03815 | 15.78912 | 21.6443 |
| Largest request duration (ms) | 4 | 0 | 45762.95 | 39048.64 | 52401.12 | 38054.74 | 53166.59 |
| Largest inter-request gap (ms) | 4 | 0 | 90246.59 | 89933.78 | 90529.36 | 89749.04 | 90623.97 |
| Time after last model response (ms) | 4 | 0 | 291.8282 | 254.4584 | 354.8941 | 217.3659 | 469.0748 |

#### psd-tools-blend-range-api — pi @ 0.73.1 — Pass (completed)

Selected attempts: 5. Task identity: \[&quot;psd-tools-blend-range-api&quot;,&quot;01595992c5f4d4695251fdf58b3edb5302d3ba46&quot;,&quot;sha256:0a4bac520618fd86c8a29b2fb482def495827fb8a951f497b4e2a6166e4e3fd9&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 5 | 0 | 478368.9 | 453345.7 | 548420.1 | 420844 | 559126.5 |
| Model (ms) | 5 | 0 | 389826.7 | 378872.7 | 407640.6 | 342825.3 | 467493.5 |
| Non-model (ms) | 5 | 0 | 80167.71 | 77267.27 | 98734.58 | 62747.4 | 150715.7 |
| Startup (ms) | 5 | 0 | 761.5796 | 758.9152 | 770.2058 | 751.4646 | 771.6258 |
| First byte (ms) | 5 | 0 | 1229.581 | 1226.093 | 1262.03 | 1226.028 | 1317.126 |
| API turns | 5 | 0 | 100 | 94 | 104 | 76 | 108 |
| Input tokens | 5 | 0 | 6696197 | 6546402 | 7921542 | 6130108 | 9993832 |
| Output tokens | 5 | 0 | 74109 | 72489 | 77834 | 69637 | 92609 |
| Cached input (%) | 5 | 0 | 98.0234 | 98.0139 | 98.19341 | 97.76271 | 98.28014 |
| Static cost (USD) | 5 | 0 | 0.08624547 | 0.08321725 | 0.0882952 | 0.08033328 | 0.1108133 |
| Model request count | 5 | 0 | 100 | 94 | 104 | 76 | 108 |
| Within-run median request duration (ms) | 5 | 0 | 2362.113 | 2328.485 | 2471.155 | 2079.286 | 2511.217 |
| Within-run median request wait (ms) | 5 | 0 | 1229.581 | 1226.093 | 1262.03 | 1226.028 | 1317.126 |
| Within-run median request transfer (ms) | 5 | 0 | 1112.117 | 922.9334 | 1148.189 | 902.8346 | 1220.494 |
| Within-run median inter-request gap (ms) | 5 | 0 | 18.05682 | 17.75065 | 20.50044 | 15.73902 | 24.58212 |
| Largest request duration (ms) | 5 | 0 | 24127.24 | 21905.27 | 31694.23 | 15163.53 | 33347.33 |
| Largest inter-request gap (ms) | 5 | 0 | 12119.87 | 9222.49 | 12646.44 | 8804.308 | 30014.32 |
| Time after last model response (ms) | 5 | 0 | 194.9533 | 183.4563 | 199.0298 | 183.1091 | 295.7408 |

#### superjson-error-stack-serialization — pi @ 0.73.1 — Pass (completed)

Selected attempts: 1. Task identity: \[&quot;superjson-error-stack-serialization&quot;,&quot;f143004734ea2dd4090e45013a07f091f5bbaee7&quot;,&quot;sha256:35885e6968c593c18f1b761ffd32486001e6774b7d5f2847aadff2e994086cd8&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 414015.8 | unavailable | unavailable | 414015.8 | 414015.8 |
| Model (ms) | 1 | 0 | 389608.9 | unavailable | unavailable | 389608.9 | 389608.9 |
| Non-model (ms) | 1 | 0 | 23043.11 | unavailable | unavailable | 23043.11 | 23043.11 |
| Startup (ms) | 1 | 0 | 1363.748 | unavailable | unavailable | 1363.748 | 1363.748 |
| First byte (ms) | 1 | 0 | 1251.809 | unavailable | unavailable | 1251.809 | 1251.809 |
| API turns | 1 | 0 | 65 | unavailable | unavailable | 65 | 65 |
| Input tokens | 1 | 0 | 4399827 | unavailable | unavailable | 4399827 | 4399827 |
| Output tokens | 1 | 0 | 84410 | unavailable | unavailable | 84410 | 84410 |
| Cached input (%) | 1 | 0 | 97.44383 | unavailable | unavailable | 97.44383 | 97.44383 |
| Static cost (USD) | 1 | 0 | 0.08037813 | unavailable | unavailable | 0.08037813 | 0.08037813 |
| Model request count | 1 | 0 | 65 | unavailable | unavailable | 65 | 65 |
| Within-run median request duration (ms) | 1 | 0 | 2211.633 | unavailable | unavailable | 2211.633 | 2211.633 |
| Within-run median request wait (ms) | 1 | 0 | 1251.809 | unavailable | unavailable | 1251.809 | 1251.809 |
| Within-run median request transfer (ms) | 1 | 0 | 935.9893 | unavailable | unavailable | 935.9893 | 935.9893 |
| Within-run median inter-request gap (ms) | 1 | 0 | 13.64645 | unavailable | unavailable | 13.64645 | 13.64645 |
| Largest request duration (ms) | 1 | 0 | 50950.18 | unavailable | unavailable | 50950.18 | 50950.18 |
| Largest inter-request gap (ms) | 1 | 0 | 2182.148 | unavailable | unavailable | 2182.148 | 2182.148 |
| Time after last model response (ms) | 1 | 0 | 162.7389 | unavailable | unavailable | 162.7389 | 162.7389 |

#### superjson-error-stack-serialization — pi @ 0.73.1 — Verification failure (verify_error)

Selected attempts: 4. Task identity: \[&quot;superjson-error-stack-serialization&quot;,&quot;f143004734ea2dd4090e45013a07f091f5bbaee7&quot;,&quot;sha256:35885e6968c593c18f1b761ffd32486001e6774b7d5f2847aadff2e994086cd8&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 4 | 0 | 79479.17 | 76178.45 | 91755.41 | 75516.68 | 119343.7 |
| Model (ms) | 4 | 0 | 77473.8 | 74105.36 | 88680.18 | 73799.5 | 112499.8 |
| Non-model (ms) | 4 | 0 | 365.4109 | 327.8709 | 1657.23 | 315.8582 | 5432.082 |
| Startup (ms) | 4 | 0 | 1415.92 | 1409.161 | 1530.011 | 1401.323 | 1859.847 |
| First byte (ms) | 4 | 0 | 882.8962 | 838.7976 | 915.9831 | 771.0188 | 950.727 |
| API turns | 4 | 0 | 7.5 | 7 | 8.75 | 7 | 11 |
| Input tokens | 4 | 0 | 74245 | 63968.5 | 99794 | 54256 | 155324 |
| Output tokens | 4 | 0 | 17242 | 17142.75 | 19232.25 | 17100 | 24948 |
| Cached input (%) | 4 | 0 | 81.63058 | 78.85998 | 85.55367 | 77.63397 | 90.23718 |
| Static cost (USD) | 4 | 0 | 0.01269488 | 0.01215349 | 0.01432385 | 0.01207622 | 0.01766388 |
| Model request count | 4 | 0 | 7.5 | 7 | 8.75 | 7 | 11 |
| Within-run median request duration (ms) | 4 | 0 | 1212.656 | 1171.812 | 1315.555 | 1164.42 | 1509.114 |
| Within-run median request wait (ms) | 4 | 0 | 882.8962 | 838.7976 | 915.9831 | 771.0188 | 950.727 |
| Within-run median request transfer (ms) | 4 | 0 | 438.749 | 365.4068 | 512.9441 | 347.824 | 533.0855 |
| Within-run median inter-request gap (ms) | 4 | 0 | 11.24831 | 10.66516 | 11.5468 | 9.599381 | 11.75859 |
| Largest request duration (ms) | 4 | 0 | 67844.74 | 66825.53 | 68840.4 | 66478.73 | 69116.59 |
| Largest inter-request gap (ms) | 4 | 0 | 33.37002 | 31.86228 | 34.70014 | 31.31812 | 34.71147 |
| Time after last model response (ms) | 4 | 0 | 273.3765 | 237.9854 | 1557.426 | 236.7058 | 5304.679 |

#### textual-richlog-follow-state — pi @ 0.73.1 — Pass (completed)

Selected attempts: 3. Task identity: \[&quot;textual-richlog-follow-state&quot;,&quot;a12215b791587a6d94227bd30a0e9291de932106&quot;,&quot;sha256:6c43ffe7837bea49f812f13adf8d5cd8a953d38ac3f8e2b97dfacc9f7bf4634b&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 3 | 0 | 1036368 | 1000680 | 1289419 | 964990.7 | 1542470 |
| Model (ms) | 3 | 0 | 637460.4 | 608905.9 | 721759.7 | 580351.4 | 806058.9 |
| Non-model (ms) | 3 | 0 | 398137.7 | 391009.1 | 566872.1 | 383880.5 | 735606.5 |
| Startup (ms) | 3 | 0 | 770.193 | 764.4963 | 787.3479 | 758.7995 | 804.5028 |
| First byte (ms) | 3 | 0 | 1380.239 | 1365.038 | 1385.567 | 1349.837 | 1390.895 |
| API turns | 3 | 0 | 142 | 131 | 148 | 120 | 154 |
| Input tokens | 3 | 0 | 13520300 | 12261890 | 15064510 | 11003480 | 16608710 |
| Output tokens | 3 | 0 | 111635 | 110384 | 129078.5 | 109133 | 146522 |
| Cached input (%) | 3 | 0 | 98.56725 | 98.4416 | 98.56939 | 98.31595 | 98.57153 |
| Static cost (USD) | 3 | 0 | 0.1360176 | 0.1308738 | 0.1543163 | 0.1257299 | 0.1726151 |
| Model request count | 3 | 0 | 142 | 131 | 148 | 120 | 154 |
| Within-run median request duration (ms) | 3 | 0 | 3019.161 | 2809.589 | 3026.146 | 2600.017 | 3033.13 |
| Within-run median request wait (ms) | 3 | 0 | 1380.239 | 1365.038 | 1385.567 | 1349.837 | 1390.895 |
| Within-run median request transfer (ms) | 3 | 0 | 1639.447 | 1426.171 | 1680.735 | 1212.895 | 1722.022 |
| Within-run median inter-request gap (ms) | 3 | 0 | 28.97858 | 24.3715 | 29.68632 | 19.76443 | 30.39407 |
| Largest request duration (ms) | 3 | 0 | 48833.69 | 41779.39 | 49860.38 | 34725.09 | 50887.08 |
| Largest inter-request gap (ms) | 3 | 0 | 166550.6 | 165968.2 | 166675.5 | 165385.9 | 166800.4 |
| Time after last model response (ms) | 3 | 0 | 286.7021 | 279.9773 | 324.2633 | 273.2525 | 361.8245 |

#### textual-richlog-follow-state — pi @ 0.73.1 — Verification failure (verify_error)

Selected attempts: 2. Task identity: \[&quot;textual-richlog-follow-state&quot;,&quot;a12215b791587a6d94227bd30a0e9291de932106&quot;,&quot;sha256:6c43ffe7837bea49f812f13adf8d5cd8a953d38ac3f8e2b97dfacc9f7bf4634b&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 1103317 | 955458 | 1251176 | 807599.1 | 1399035 |
| Model (ms) | 2 | 0 | 642783.5 | 621215.5 | 664351.5 | 599647.5 | 685919.4 |
| Non-model (ms) | 2 | 0 | 459765.6 | 333481.9 | 586049.3 | 207198.1 | 712333.1 |
| Startup (ms) | 2 | 0 | 767.8329 | 760.6301 | 775.0357 | 753.4272 | 782.2386 |
| First byte (ms) | 2 | 0 | 1350.994 | 1342.349 | 1359.638 | 1333.704 | 1368.283 |
| API turns | 2 | 0 | 144.5 | 143.25 | 145.75 | 142 | 147 |
| Input tokens | 2 | 0 | 14013810 | 13975610 | 14052010 | 13937410 | 14090210 |
| Output tokens | 2 | 0 | 115778.5 | 112461.3 | 119095.8 | 109144 | 122413 |
| Cached input (%) | 2 | 0 | 98.49332 | 98.48024 | 98.50639 | 98.46717 | 98.51947 |
| Static cost (USD) | 1 | 1 | 0.1466647 | unavailable | unavailable | 0.1466647 | 0.1466647 |
| Model request count | 2 | 0 | 144.5 | 143.25 | 145.75 | 142 | 147 |
| Within-run median request duration (ms) | 2 | 0 | 3040.719 | 2921.511 | 3159.927 | 2802.303 | 3279.135 |
| Within-run median request wait (ms) | 2 | 0 | 1350.994 | 1342.349 | 1359.638 | 1333.704 | 1368.283 |
| Within-run median request transfer (ms) | 2 | 0 | 1511.747 | 1407.16 | 1616.334 | 1302.573 | 1720.921 |
| Within-run median inter-request gap (ms) | 2 | 0 | 22.92178 | 19.5506 | 26.29297 | 16.17942 | 29.66415 |
| Largest request duration (ms) | 2 | 0 | 29887.01 | 26470.86 | 33303.17 | 23054.7 | 36719.32 |
| Largest inter-request gap (ms) | 2 | 0 | 166290.2 | 166114.8 | 166465.7 | 165939.3 | 166641.2 |
| Time after last model response (ms) | 2 | 0 | 375.1551 | 324.1646 | 426.1456 | 273.1741 | 477.1361 |

#### tomlkit-toml-table-converters — pi @ 0.73.1 — Pass (completed)

Selected attempts: 5. Task identity: \[&quot;tomlkit-toml-table-converters&quot;,&quot;962de91aaf103135f400e5108a798a59a10dc17e&quot;,&quot;sha256:e7cc1016b833bde77abc2597d451c5fab0d3bf7d6e886201db050ed0368560ec&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 5 | 0 | 673943.6 | 634006 | 706954.9 | 588869 | 1041367 |
| Model (ms) | 5 | 0 | 636530.6 | 611766.7 | 650453.5 | 561319 | 1005825 |
| Non-model (ms) | 5 | 0 | 26808.8 | 22713.83 | 34772.32 | 21476.62 | 69655.42 |
| Startup (ms) | 5 | 0 | 768.8696 | 762.6039 | 768.9905 | 741.2365 | 776.2795 |
| First byte (ms) | 5 | 0 | 1388.14 | 1375.164 | 1421.908 | 1334.518 | 1558.277 |
| API turns | 5 | 0 | 119 | 111 | 125 | 104 | 176 |
| Input tokens | 5 | 0 | 12614780 | 10956100 | 13572820 | 10618620 | 27317420 |
| Output tokens | 5 | 0 | 118564 | 116508 | 121921 | 104599 | 186494 |
| Cached input (%) | 5 | 0 | 98.48997 | 98.46193 | 98.615 | 98.37449 | 98.85889 |
| Static cost (USD) | 5 | 0 | 0.1394903 | 0.125769 | 0.14114 | 0.1199474 | 0.2396716 |
| Model request count | 5 | 0 | 119 | 111 | 125 | 104 | 176 |
| Within-run median request duration (ms) | 5 | 0 | 3228.237 | 3135.815 | 3624.477 | 3109.646 | 3792.207 |
| Within-run median request wait (ms) | 5 | 0 | 1388.14 | 1375.164 | 1421.908 | 1334.518 | 1558.277 |
| Within-run median request transfer (ms) | 5 | 0 | 1929.299 | 1772.485 | 2110.474 | 1753.555 | 2165.124 |
| Within-run median inter-request gap (ms) | 5 | 0 | 33.40726 | 31.82586 | 41.94534 | 25.82597 | 42.43791 |
| Largest request duration (ms) | 5 | 0 | 46742.17 | 36703.87 | 52347.82 | 33450.08 | 54334.12 |
| Largest inter-request gap (ms) | 5 | 0 | 8027.53 | 7772.881 | 8240.369 | 7752.115 | 11026.96 |
| Time after last model response (ms) | 5 | 0 | 281.5858 | 259.8135 | 282.0108 | 247.5765 | 467.7927 |

#### true-myth-iterable-collection-combinators — pi @ 0.73.1 — Pass (completed)

Selected attempts: 4. Task identity: \[&quot;true-myth-iterable-collection-combinators&quot;,&quot;5945ad1b96e228ff716275d8a273282101152508&quot;,&quot;sha256:f92488780ccbb58b036e59481045a7b179906646b26f81c26373e46be9217afa&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 4 | 0 | 529787.2 | 422000.9 | 642787.8 | 403788.8 | 676642.9 |
| Model (ms) | 4 | 0 | 463761.1 | 379109.7 | 541861.7 | 354100.4 | 547218.4 |
| Non-model (ms) | 4 | 0 | 69786.28 | 46649.17 | 100151 | 39846.08 | 128637.1 |
| Startup (ms) | 4 | 0 | 775.4088 | 771.3255 | 781.37 | 770.9033 | 787.4261 |
| First byte (ms) | 4 | 0 | 1481.96 | 1442.492 | 1496.673 | 1349.746 | 1515.149 |
| API turns | 4 | 0 | 95.5 | 86 | 102.75 | 74 | 108 |
| Input tokens | 4 | 0 | 12193250 | 9712914 | 14154000 | 7664818 | 14643300 |
| Output tokens | 4 | 0 | 84669 | 70871.5 | 99418.5 | 69031 | 104115 |
| Cached input (%) | 4 | 0 | 98.3575 | 98.19656 | 98.43615 | 97.83841 | 98.5474 |
| Static cost (USD) | 4 | 0 | 0.1161251 | 0.0963155 | 0.1347742 | 0.09024071 | 0.1373675 |
| Model request count | 4 | 0 | 95.5 | 86 | 102.75 | 74 | 108 |
| Within-run median request duration (ms) | 4 | 0 | 2536.242 | 2474.595 | 2615.703 | 2329.802 | 2813.937 |
| Within-run median request wait (ms) | 4 | 0 | 1481.96 | 1442.492 | 1496.673 | 1349.746 | 1515.149 |
| Within-run median request transfer (ms) | 4 | 0 | 986.6196 | 958.7747 | 1042.772 | 878.2466 | 1208.221 |
| Within-run median inter-request gap (ms) | 4 | 0 | 16.84957 | 15.05783 | 18.59872 | 14.75619 | 18.77256 |
| Largest request duration (ms) | 4 | 0 | 47632.69 | 41047.45 | 50149.06 | 27828.97 | 51160.94 |
| Largest inter-request gap (ms) | 4 | 0 | 8172.309 | 5532.379 | 15591.7 | 5439.636 | 30022.83 |
| Time after last model response (ms) | 4 | 0 | 309.248 | 278.2497 | 339.7973 | 268.7328 | 347.9673 |

#### true-myth-iterable-collection-combinators — pi @ 0.73.1 — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;true-myth-iterable-collection-combinators&quot;,&quot;5945ad1b96e228ff716275d8a273282101152508&quot;,&quot;sha256:f92488780ccbb58b036e59481045a7b179906646b26f81c26373e46be9217afa&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 177559.9 | unavailable | unavailable | 177559.9 | 177559.9 |
| Model (ms) | 1 | 0 | 134697.2 | unavailable | unavailable | 134697.2 | 134697.2 |
| Non-model (ms) | 1 | 0 | 42069.32 | unavailable | unavailable | 42069.32 | 42069.32 |
| Startup (ms) | 1 | 0 | 793.4474 | unavailable | unavailable | 793.4474 | 793.4474 |
| First byte (ms) | 1 | 0 | 1239.175 | unavailable | unavailable | 1239.175 | 1239.175 |
| API turns | 1 | 0 | 25 | unavailable | unavailable | 25 | 25 |
| Input tokens | 1 | 0 | 1754399 | unavailable | unavailable | 1754399 | 1754399 |
| Output tokens | 1 | 0 | 26704 | unavailable | unavailable | 26704 | 26704 |
| Cached input (%) | 1 | 0 | 95.14643 | unavailable | unavailable | 95.14643 | 95.14643 |
| Static cost (USD) | 1 | 0 | 0.03380279 | unavailable | unavailable | 0.03380279 | 0.03380279 |
| Model request count | 1 | 0 | 25 | unavailable | unavailable | 25 | 25 |
| Within-run median request duration (ms) | 1 | 0 | 2426.434 | unavailable | unavailable | 2426.434 | 2426.434 |
| Within-run median request wait (ms) | 1 | 0 | 1239.175 | unavailable | unavailable | 1239.175 | 1239.175 |
| Within-run median request transfer (ms) | 1 | 0 | 1151.858 | unavailable | unavailable | 1151.858 | 1151.858 |
| Within-run median inter-request gap (ms) | 1 | 0 | 19.19867 | unavailable | unavailable | 19.19867 | 19.19867 |
| Largest request duration (ms) | 1 | 0 | 65229.12 | unavailable | unavailable | 65229.12 | 65229.12 |
| Largest inter-request gap (ms) | 1 | 0 | 30029.7 | unavailable | unavailable | 30029.7 | 30029.7 |
| Time after last model response (ms) | 1 | 0 | 270.1731 | unavailable | unavailable | 270.1731 | 270.1731 |

#### cattrs-partial-structuring-recovery — qwen @ 0.22.2 — Pass (completed)

Selected attempts: 3. Task identity: \[&quot;cattrs-partial-structuring-recovery&quot;,&quot;91df27b2a20f26c35777a92f4555438b62c06345&quot;,&quot;sha256:417f2ac9b8fbeec1a36dacd9ae2ca9e8c565b73e8ec7b2aa84da01428aa030e8&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 3 | 0 | 729032.4 | 711390.7 | 738126.1 | 693749 | 747219.8 |
| Model (ms) | 3 | 0 | 507697.6 | 479971.1 | 529213.2 | 452244.5 | 550728.7 |
| Non-model (ms) | 3 | 0 | 219859.8 | 207447.4 | 229990.8 | 195034.9 | 240121.9 |
| Startup (ms) | 3 | 0 | 1456.154 | 1419.392 | 1465.556 | 1382.63 | 1474.957 |
| First byte (ms) | 3 | 0 | 1457.53 | 1445.121 | 1476.959 | 1432.712 | 1496.387 |
| API turns | 3 | 0 | 92 | 92 | 105.5 | 92 | 119 |
| Input tokens | 3 | 0 | 12335540 | 11472840 | 13582480 | 10610150 | 14829410 |
| Output tokens | 3 | 0 | 98614 | 90040 | 100573 | 81466 | 102532 |
| Cached input (%) | 3 | 0 | 99.29295 | 98.78223 | 99.31382 | 98.2715 | 99.33469 |
| Static cost (USD) | 3 | 0 | 0.1113469 | 0.1095081 | 0.1147533 | 0.1076693 | 0.1181598 |
| Model request count | 3 | 0 | 92 | 92 | 105.5 | 92 | 119 |
| Within-run median request duration (ms) | 3 | 0 | 2609.557 | 2553.989 | 2614.639 | 2498.422 | 2619.72 |
| Within-run median request wait (ms) | 3 | 0 | 1457.53 | 1445.121 | 1476.959 | 1432.712 | 1496.387 |
| Within-run median request transfer (ms) | 3 | 0 | 1132.91 | 1126.254 | 1146.648 | 1119.597 | 1160.387 |
| Within-run median inter-request gap (ms) | 3 | 0 | 47.66674 | 45.5539 | 49.8578 | 43.44106 | 52.04885 |
| Largest request duration (ms) | 3 | 0 | 51565.41 | 45783.83 | 57630.81 | 40002.24 | 63696.21 |
| Largest inter-request gap (ms) | 3 | 0 | 57588.48 | 57574.32 | 60236.66 | 57560.17 | 62884.84 |
| Time after last model response (ms) | 3 | 0 | 216.3868 | 211.261 | 222.9723 | 206.1351 | 229.5578 |

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

#### happy-dom-deterministic-intersectionobserver — qwen @ 0.22.2 — Pass (completed)

Selected attempts: 1. Task identity: \[&quot;happy-dom-deterministic-intersectionobserver&quot;,&quot;32b2a8e60eab482c023af377160bf294d6da0318&quot;,&quot;sha256:3d414d710d8e31ae0fcf9d23c863bbc395835fc8ea49acd0c0567e10838564c5&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 592225.8 | unavailable | unavailable | 592225.8 | 592225.8 |
| Model (ms) | 1 | 0 | 445788.4 | unavailable | unavailable | 445788.4 | 445788.4 |
| Non-model (ms) | 1 | 0 | 144402.7 | unavailable | unavailable | 144402.7 | 144402.7 |
| Startup (ms) | 1 | 0 | 2034.618 | unavailable | unavailable | 2034.618 | 2034.618 |
| First byte (ms) | 1 | 0 | 1408.878 | unavailable | unavailable | 1408.878 | 1408.878 |
| API turns | 1 | 0 | 60 | unavailable | unavailable | 60 | 60 |
| Input tokens | 1 | 0 | 6169447 | unavailable | unavailable | 6169447 | 6169447 |
| Output tokens | 1 | 0 | 82938 | unavailable | unavailable | 82938 | 82938 |
| Cached input (%) | 1 | 0 | 98.98793 | unavailable | unavailable | 98.98793 | 98.98793 |
| Static cost (USD) | 1 | 0 | 0.07744967 | unavailable | unavailable | 0.07744967 | 0.07744967 |
| Model request count | 1 | 0 | 60 | unavailable | unavailable | 60 | 60 |
| Within-run median request duration (ms) | 1 | 0 | 3268.416 | unavailable | unavailable | 3268.416 | 3268.416 |
| Within-run median request wait (ms) | 1 | 0 | 1408.878 | unavailable | unavailable | 1408.878 | 1408.878 |
| Within-run median request transfer (ms) | 1 | 0 | 2007.122 | unavailable | unavailable | 2007.122 | 2007.122 |
| Within-run median inter-request gap (ms) | 1 | 0 | 51.55947 | unavailable | unavailable | 51.55947 | 51.55947 |
| Largest request duration (ms) | 1 | 0 | 46115.29 | unavailable | unavailable | 46115.29 | 46115.29 |
| Largest inter-request gap (ms) | 1 | 0 | 70891.98 | unavailable | unavailable | 70891.98 | 70891.98 |
| Time after last model response (ms) | 1 | 0 | 313.9297 | unavailable | unavailable | 313.9297 | 313.9297 |

#### happy-dom-deterministic-intersectionobserver — qwen @ 0.22.2 — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;happy-dom-deterministic-intersectionobserver&quot;,&quot;32b2a8e60eab482c023af377160bf294d6da0318&quot;,&quot;sha256:3d414d710d8e31ae0fcf9d23c863bbc395835fc8ea49acd0c0567e10838564c5&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 551055.4 | unavailable | unavailable | 551055.4 | 551055.4 |
| Model (ms) | 1 | 0 | 475148.3 | unavailable | unavailable | 475148.3 | 475148.3 |
| Non-model (ms) | 1 | 0 | 73907.5 | unavailable | unavailable | 73907.5 | 73907.5 |
| Startup (ms) | 1 | 0 | 1999.633 | unavailable | unavailable | 1999.633 | 1999.633 |
| First byte (ms) | 1 | 0 | 1388.81 | unavailable | unavailable | 1388.81 | 1388.81 |
| API turns | 1 | 0 | 85 | unavailable | unavailable | 85 | 85 |
| Input tokens | 1 | 0 | 8193243 | unavailable | unavailable | 8193243 | 8193243 |
| Output tokens | 1 | 0 | 84442 | unavailable | unavailable | 84442 | 84442 |
| Cached input (%) | 1 | 0 | 99.16464 | unavailable | unavailable | 99.16464 | 99.16464 |
| Static cost (USD) | 1 | 0 | 0.08530605 | unavailable | unavailable | 0.08530605 | 0.08530605 |
| Model request count | 1 | 0 | 85 | unavailable | unavailable | 85 | 85 |
| Within-run median request duration (ms) | 1 | 0 | 2523.168 | unavailable | unavailable | 2523.168 | 2523.168 |
| Within-run median request wait (ms) | 1 | 0 | 1388.81 | unavailable | unavailable | 1388.81 | 1388.81 |
| Within-run median request transfer (ms) | 1 | 0 | 1070.127 | unavailable | unavailable | 1070.127 | 1070.127 |
| Within-run median inter-request gap (ms) | 1 | 0 | 47.73731 | unavailable | unavailable | 47.73731 | 47.73731 |
| Largest request duration (ms) | 1 | 0 | 44988.2 | unavailable | unavailable | 44988.2 | 44988.2 |
| Largest inter-request gap (ms) | 1 | 0 | 20062.82 | unavailable | unavailable | 20062.82 | 20062.82 |
| Time after last model response (ms) | 1 | 0 | 226.4019 | unavailable | unavailable | 226.4019 | 226.4019 |

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

Selected attempts: 3. Task identity: \[&quot;psd-tools-blend-range-api&quot;,&quot;01595992c5f4d4695251fdf58b3edb5302d3ba46&quot;,&quot;sha256:0a4bac520618fd86c8a29b2fb482def495827fb8a951f497b4e2a6166e4e3fd9&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 3 | 0 | 504621.7 | 456429.1 | 505646.5 | 408236.5 | 506671.4 |
| Model (ms) | 3 | 0 | 438795.9 | 387474.4 | 439597.2 | 336152.9 | 440398.4 |
| Non-model (ms) | 3 | 0 | 64738.63 | 64571.86 | 67653.47 | 64405.09 | 70568.31 |
| Startup (ms) | 3 | 0 | 1515.321 | 1468.011 | 1524.823 | 1420.702 | 1534.325 |
| First byte (ms) | 3 | 0 | 1348.53 | 1338.915 | 1351.263 | 1329.301 | 1353.996 |
| API turns | 3 | 0 | 94 | 79.5 | 99.5 | 65 | 105 |
| Input tokens | 3 | 0 | 10089830 | 8629799 | 10867770 | 7169769 | 11645710 |
| Output tokens | 3 | 0 | 77099 | 73781.5 | 81913 | 70464 | 86727 |
| Cached input (%) | 3 | 0 | 99.06405 | 99.06176 | 99.19177 | 99.05948 | 99.3195 |
| Static cost (USD) | 3 | 0 | 0.09041098 | 0.08205567 | 0.09451696 | 0.07370036 | 0.09862294 |
| Model request count | 3 | 0 | 94 | 79.5 | 99.5 | 65 | 105 |
| Within-run median request duration (ms) | 3 | 0 | 2601.904 | 2562.243 | 2681.521 | 2522.582 | 2761.138 |
| Within-run median request wait (ms) | 3 | 0 | 1348.53 | 1338.915 | 1351.263 | 1329.301 | 1353.996 |
| Within-run median request transfer (ms) | 3 | 0 | 1150.177 | 1147.036 | 1264.559 | 1143.895 | 1378.941 |
| Within-run median inter-request gap (ms) | 3 | 0 | 48.82744 | 44.9159 | 52.24237 | 41.00435 | 55.6573 |
| Largest request duration (ms) | 3 | 0 | 33442.25 | 29508.34 | 49238.26 | 25574.43 | 65034.28 |
| Largest inter-request gap (ms) | 3 | 0 | 12460.24 | 12398.23 | 12544.87 | 12336.23 | 12629.51 |
| Time after last model response (ms) | 3 | 0 | 207.567 | 202.796 | 209.2598 | 198.025 | 210.9527 |

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

#### superjson-error-stack-serialization — qwen @ 0.22.2 — Pass (completed)

Selected attempts: 1. Task identity: \[&quot;superjson-error-stack-serialization&quot;,&quot;f143004734ea2dd4090e45013a07f091f5bbaee7&quot;,&quot;sha256:35885e6968c593c18f1b761ffd32486001e6774b7d5f2847aadff2e994086cd8&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 328194.7 | unavailable | unavailable | 328194.7 | 328194.7 |
| Model (ms) | 1 | 0 | 316987.1 | unavailable | unavailable | 316987.1 | 316987.1 |
| Non-model (ms) | 1 | 0 | 9110.518 | unavailable | unavailable | 9110.518 | 9110.518 |
| Startup (ms) | 1 | 0 | 2097.087 | unavailable | unavailable | 2097.087 | 2097.087 |
| First byte (ms) | 1 | 0 | 1331.207 | unavailable | unavailable | 1331.207 | 1331.207 |
| API turns | 1 | 0 | 40 | unavailable | unavailable | 40 | 40 |
| Input tokens | 1 | 0 | 3592407 | unavailable | unavailable | 3592407 | 3592407 |
| Output tokens | 1 | 0 | 68631 | unavailable | unavailable | 68631 | 68631 |
| Cached input (%) | 1 | 0 | 98.54028 | unavailable | unavailable | 98.54028 | 98.54028 |
| Static cost (USD) | 1 | 0 | 0.05966435 | unavailable | unavailable | 0.05966435 | 0.05966435 |
| Model request count | 1 | 0 | 40 | unavailable | unavailable | 40 | 40 |
| Within-run median request duration (ms) | 1 | 0 | 2614.961 | unavailable | unavailable | 2614.961 | 2614.961 |
| Within-run median request wait (ms) | 1 | 0 | 1331.207 | unavailable | unavailable | 1331.207 | 1331.207 |
| Within-run median request transfer (ms) | 1 | 0 | 1051.533 | unavailable | unavailable | 1051.533 | 1051.533 |
| Within-run median inter-request gap (ms) | 1 | 0 | 43.06049 | unavailable | unavailable | 43.06049 | 43.06049 |
| Largest request duration (ms) | 1 | 0 | 132222.9 | unavailable | unavailable | 132222.9 | 132222.9 |
| Largest inter-request gap (ms) | 1 | 0 | 1287.352 | unavailable | unavailable | 1287.352 | 1287.352 |
| Time after last model response (ms) | 1 | 0 | 182.8944 | unavailable | unavailable | 182.8944 | 182.8944 |

#### superjson-error-stack-serialization — qwen @ 0.22.2 — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;superjson-error-stack-serialization&quot;,&quot;f143004734ea2dd4090e45013a07f091f5bbaee7&quot;,&quot;sha256:35885e6968c593c18f1b761ffd32486001e6774b7d5f2847aadff2e994086cd8&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 467898.4 | unavailable | unavailable | 467898.4 | 467898.4 |
| Model (ms) | 1 | 0 | 449253.4 | unavailable | unavailable | 449253.4 | 449253.4 |
| Non-model (ms) | 1 | 0 | 16647.43 | unavailable | unavailable | 16647.43 | 16647.43 |
| Startup (ms) | 1 | 0 | 1997.549 | unavailable | unavailable | 1997.549 | 1997.549 |
| First byte (ms) | 1 | 0 | 1382.618 | unavailable | unavailable | 1382.618 | 1382.618 |
| API turns | 1 | 0 | 59 | unavailable | unavailable | 59 | 59 |
| Input tokens | 1 | 0 | 5958630 | unavailable | unavailable | 5958630 | 5958630 |
| Output tokens | 1 | 0 | 83356 | unavailable | unavailable | 83356 | 83356 |
| Cached input (%) | 1 | 0 | 99.31733 | unavailable | unavailable | 99.31733 | 99.31733 |
| Static cost (USD) | 1 | 0 | 0.07386916 | unavailable | unavailable | 0.07386916 | 0.07386916 |
| Model request count | 1 | 0 | 59 | unavailable | unavailable | 59 | 59 |
| Within-run median request duration (ms) | 1 | 0 | 2306.712 | unavailable | unavailable | 2306.712 | 2306.712 |
| Within-run median request wait (ms) | 1 | 0 | 1382.618 | unavailable | unavailable | 1382.618 | 1382.618 |
| Within-run median request transfer (ms) | 1 | 0 | 958.707 | unavailable | unavailable | 958.707 | 958.707 |
| Within-run median inter-request gap (ms) | 1 | 0 | 48.25853 | unavailable | unavailable | 48.25853 | 48.25853 |
| Largest request duration (ms) | 1 | 0 | 133714 | unavailable | unavailable | 133714 | 133714 |
| Largest inter-request gap (ms) | 1 | 0 | 1943.601 | unavailable | unavailable | 1943.601 | 1943.601 |
| Time after last model response (ms) | 1 | 0 | 207.7605 | unavailable | unavailable | 207.7605 | 207.7605 |

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

#### textual-richlog-follow-state — qwen @ 0.22.2 — Verification failure (verify_error)

Selected attempts: 3. Task identity: \[&quot;textual-richlog-follow-state&quot;,&quot;a12215b791587a6d94227bd30a0e9291de932106&quot;,&quot;sha256:6c43ffe7837bea49f812f13adf8d5cd8a953d38ac3f8e2b97dfacc9f7bf4634b&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 3 | 0 | 1232133 | 1007445 | 1395052 | 782756.3 | 1557970 |
| Model (ms) | 3 | 0 | 776247.3 | 738897.1 | 849999.9 | 701547 | 923752.4 |
| Non-model (ms) | 3 | 0 | 454453.2 | 267061.6 | 543554.5 | 79670.05 | 632655.9 |
| Startup (ms) | 3 | 0 | 1539.296 | 1486.05 | 1550.581 | 1432.804 | 1561.866 |
| First byte (ms) | 3 | 0 | 1550.455 | 1540.965 | 1563.873 | 1531.475 | 1577.292 |
| API turns | 3 | 0 | 154 | 146.5 | 160 | 139 | 166 |
| Input tokens | 3 | 0 | 23236460 | 21546250 | 23748250 | 19856030 | 24260050 |
| Output tokens | 3 | 0 | 134021 | 127425 | 139579 | 120829 | 145137 |
| Cached input (%) | 3 | 0 | 99.50668 | 99.46694 | 99.54636 | 99.4272 | 99.58603 |
| Static cost (USD) | 3 | 0 | 0.1617723 | 0.1580761 | 0.1681989 | 0.1543798 | 0.1746255 |
| Model request count | 3 | 0 | 154 | 146.5 | 160 | 139 | 166 |
| Within-run median request duration (ms) | 3 | 0 | 3082.662 | 3025.66 | 3299.264 | 2968.658 | 3515.867 |
| Within-run median request wait (ms) | 3 | 0 | 1550.455 | 1540.965 | 1563.873 | 1531.475 | 1577.292 |
| Within-run median request transfer (ms) | 3 | 0 | 1413.445 | 1388.753 | 1630.36 | 1364.06 | 1847.275 |
| Within-run median inter-request gap (ms) | 3 | 0 | 51.99396 | 48.85906 | 54.4007 | 45.72416 | 56.80744 |
| Largest request duration (ms) | 3 | 0 | 42510.58 | 39254.05 | 45038.11 | 35997.52 | 47565.65 |
| Largest inter-request gap (ms) | 3 | 0 | 167305.3 | 87546.9 | 167536.4 | 7788.476 | 167767.6 |
| Time after last model response (ms) | 3 | 0 | 214.331 | 211.8447 | 221.9171 | 209.3584 | 229.5031 |

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

#### tomlkit-toml-table-converters — qwen @ 0.22.2 — Pass (completed)

Selected attempts: 3. Task identity: \[&quot;tomlkit-toml-table-converters&quot;,&quot;962de91aaf103135f400e5108a798a59a10dc17e&quot;,&quot;sha256:e7cc1016b833bde77abc2597d451c5fab0d3bf7d6e886201db050ed0368560ec&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 3 | 0 | 724304.6 | 709987.3 | 821741.5 | 695670 | 919178.5 |
| Model (ms) | 3 | 0 | 692027 | 677638.7 | 772800.8 | 663250.5 | 853574.7 |
| Non-model (ms) | 3 | 0 | 30955.2 | 30893.33 | 47596.89 | 30831.47 | 64238.59 |
| Startup (ms) | 3 | 0 | 1446.151 | 1405.706 | 1455.222 | 1365.262 | 1464.293 |
| First byte (ms) | 3 | 0 | 1482.249 | 1467.772 | 1516.737 | 1453.294 | 1551.225 |
| API turns | 3 | 0 | 114 | 114 | 139.5 | 114 | 165 |
| Input tokens | 3 | 0 | 15189340 | 15060270 | 20922590 | 14931200 | 26655850 |
| Output tokens | 3 | 0 | 122674 | 121087 | 136947.5 | 119500 | 151221 |
| Cached input (%) | 3 | 0 | 99.55446 | 99.48406 | 99.61161 | 99.41365 | 99.66876 |
| Static cost (USD) | 3 | 0 | 0.1312677 | 0.1292419 | 0.1574735 | 0.1272161 | 0.1836794 |
| Model request count | 3 | 0 | 114 | 114 | 139.5 | 114 | 165 |
| Within-run median request duration (ms) | 3 | 0 | 2864.843 | 2807.736 | 2982.883 | 2750.629 | 3100.923 |
| Within-run median request wait (ms) | 3 | 0 | 1482.249 | 1467.772 | 1516.737 | 1453.294 | 1551.225 |
| Within-run median request transfer (ms) | 3 | 0 | 1284.337 | 1194.835 | 1535.196 | 1105.333 | 1786.055 |
| Within-run median inter-request gap (ms) | 3 | 0 | 54.49759 | 51.26573 | 58.20392 | 48.03386 | 61.91025 |
| Largest request duration (ms) | 3 | 0 | 69683.83 | 56757.86 | 86150.22 | 43831.89 | 102616.6 |
| Largest inter-request gap (ms) | 3 | 0 | 8291.13 | 8035.44 | 8399.408 | 7779.75 | 8507.686 |
| Time after last model response (ms) | 3 | 0 | 225.3895 | 223.0179 | 225.6522 | 220.6462 | 225.915 |

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

#### true-myth-iterable-collection-combinators — qwen @ 0.22.2 — Pass (completed)

Selected attempts: 2. Task identity: \[&quot;true-myth-iterable-collection-combinators&quot;,&quot;5945ad1b96e228ff716275d8a273282101152508&quot;,&quot;sha256:f92488780ccbb58b036e59481045a7b179906646b26f81c26373e46be9217afa&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 474113.2 | 469234.5 | 478991.8 | 464355.8 | 483870.5 |
| Model (ms) | 2 | 0 | 405069.3 | 379805 | 430333.7 | 354540.7 | 455598 |
| Non-model (ms) | 2 | 0 | 67611.9 | 47227 | 87996.81 | 26842.1 | 108381.7 |
| Startup (ms) | 2 | 0 | 1431.918 | 1431.157 | 1432.679 | 1430.395 | 1433.44 |
| First byte (ms) | 2 | 0 | 1462.18 | 1427.875 | 1496.486 | 1393.569 | 1530.792 |
| API turns | 2 | 0 | 75 | 69.5 | 80.5 | 64 | 86 |
| Input tokens | 2 | 0 | 10406220 | 9157563 | 11654880 | 7908903 | 12903540 |
| Output tokens | 2 | 0 | 83390.5 | 78029.75 | 88751.25 | 72669 | 94112 |
| Cached input (%) | 2 | 0 | 98.85021 | 98.805 | 98.89543 | 98.75979 | 98.94064 |
| Static cost (USD) | 2 | 0 | 0.09850945 | 0.09012817 | 0.1068907 | 0.0817469 | 0.115272 |
| Model request count | 2 | 0 | 75 | 69.5 | 80.5 | 64 | 86 |
| Within-run median request duration (ms) | 2 | 0 | 2742.977 | 2738.408 | 2747.545 | 2733.839 | 2752.114 |
| Within-run median request wait (ms) | 2 | 0 | 1462.18 | 1427.875 | 1496.486 | 1393.569 | 1530.792 |
| Within-run median request transfer (ms) | 2 | 0 | 1263.563 | 1194.228 | 1332.899 | 1124.892 | 1402.234 |
| Within-run median inter-request gap (ms) | 2 | 0 | 48.89854 | 47.45682 | 50.34027 | 46.01509 | 51.78199 |
| Largest request duration (ms) | 2 | 0 | 55340.97 | 52982.7 | 57699.25 | 50624.42 | 60057.52 |
| Largest inter-request gap (ms) | 2 | 0 | 41682.21 | 22493.87 | 60870.54 | 3305.539 | 80058.88 |
| Time after last model response (ms) | 2 | 0 | 222.8434 | 215.2984 | 230.3885 | 207.7533 | 237.9335 |

### Annotated request timelines

#### pinned:cline:textual-richlog-follow-state:2:independent-linux-20260913 — most model calls among passes

cline @ 3.0.61 · textual-richlog-follow-state · Pass (completed). Calls 499 (499 successful). Median duration 3.4s; largest gap 30.1s; time after last 1.65s.

#### pinned:pi:textual-richlog-follow-state:1:linux-only-20260918 — largest inter-request gap among passes

pi @ 0.73.1 · textual-richlog-follow-state · Pass (completed). Calls 120 (120 successful). Median duration 3.03s; largest gap 2m 46.8s; time after last 273.2525 ms.

#### pinned:hermes:psd-tools-blend-range-api:3:hermes-linux-20260915 — longest tail after last model response among passes

hermes @ Hermes Agent v0.20.5 (2026.8.19) · psd-tools-blend-range-api · Pass (completed). Calls 75 (75 successful). Median duration 2.36s; largest gap 12.26s; time after last 12.44s.

#### pinned:hermes:tomlkit-toml-table-converters:3:hermes-linux-20260915 — longest single model call among passes

hermes @ Hermes Agent v0.20.5 (2026.8.19) · tomlkit-toml-table-converters · Pass (completed). Calls 218 (218 successful). Median duration 3.06s; largest gap 15.55s; time after last 282.3173 ms.

#### pinned:codex:superjson-error-stack-serialization:1:linux-only-20260918 — most failed model calls among verification failures

codex @ codex-cli 0.149.1 · superjson-error-stack-serialization · Verification failure (verify_error). Calls 64 (63 successful). Median duration 2.68s; largest gap 2.41s; time after last 5.15s.

## Population 2: deepseek/deepseek-v4.1-flash · linux · openrouter-2026-09-04

### Recorded population identity

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

## Measurement notes

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
