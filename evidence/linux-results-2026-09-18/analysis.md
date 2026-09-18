# Selected-attempt analysis

Selected attempts: 107. Populations: 2.

All selected outcomes. Task coverage can differ; these are descriptive summaries, not a ranking. Cost, cache and tokens are medians per measured attempt. Cost is a static estimate, not billing. Cache rate is the median attempt cached-input percentage, not a pooled token ratio. Input includes cached tokens; token counters cover successful model responses. Missing measurements are not zero.

## Comparison 1: deepseek/deepseek-v4.1-flash · linux

### At a glance

| Harness | Pass rate | Median reference cost / attempt | Cache rate | Tokens in | Tokens out | Task identities |
| --- | --- | --- | --- | --- | --- | --- |
| cline @ 3.0.61 | 45.0% · 18/40 · 79.6% of best | $0.167 · 43.4% of best (40/40 measured) | 96.4% · 97.3% of best (40/40 measured) | 9.77M · 74.7% of best (40/40 measured) | 158.2K · 46.5% of best (40/40 measured) | 10 |
| codex @ codex-cli 0.149.1 | 33.3% · 1/3 · 59.0% of best | $0.073 · 100.0% of best (3/3 measured) | 99.2% · 100.0% of best (3/3 measured) | 7.30M · 100.0% of best (3/3 measured) | 73.5K · 100.0% of best (3/3 measured) | 3 |
| hermes @ Hermes Agent v0.20.5 (2026.8.19) | 50.0% · 20/40 · 88.5% of best | $0.135 · Not scored (38/40 measured · partial) | 99.2% · Not scored (39/40 measured · partial) | 16.43M · Not scored (39/40 measured · partial) | 119.9K · Not scored (39/40 measured · partial) | 8 |
| pi @ 0.73.1 | 0.0% · 0/1 · 0.0% of best | $0.110 · 66.2% of best (1/1 measured) | 98.4% · 99.2% of best (1/1 measured) | 10.59M · 68.9% of best (1/1 measured) | 88.6K · 82.9% of best (1/1 measured) | 1 |
| qwen @ 0.22.2 | 56.5% · 13/23 · 100.0% of best | $0.090 · 80.4% of best (23/23 measured) | 99.1% · 99.9% of best (23/23 measured) | 9.86M · 74.0% of best (23/23 measured) | 81.2K · 90.6% of best (23/23 measured) | 9 |

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
| hermes @ Hermes Agent v0.20.5 (2026.8.19) | 40 | 20 | 20 | 0 | 8 | 40 | 8 | 40 | 39 | 39 | 39 | 38 | 5 / 7 |
| qwen @ 0.22.2 | 17 | 11 | 6 | 0 | 9 | 17 | 9 | 17 | 17 | 17 | 17 | 17 | 4 / 7 |

### Selected spend by outcome

| Harness @ version | Outcome | Selected | Priced n | Missing n | Selected static spend (USD) |
| --- | --- | --- | --- | --- | --- |
| cline @ 3.0.61 | Pass (completed) | 10 | 10 | 0 | Total: 2.183396 |
| cline @ 3.0.61 | Verification failure (verify\_error) | 10 | 10 | 0 | Total: 1.887896 |
| hermes @ Hermes Agent v0.20.5 (2026.8.19) | Pass (completed) | 20 | 19 | 1 | Known subtotal: 3.82214 |
| hermes @ Hermes Agent v0.20.5 (2026.8.19) | Verification failure (verify\_error) | 20 | 19 | 1 | Known subtotal: 2.662463 |
| qwen @ 0.22.2 | Pass (completed) | 11 | 11 | 0 | Total: 1.260471 |
| qwen @ 0.22.2 | Verification failure (verify\_error) | 6 | 6 | 0 | Total: 0.6075725 |

### Request-level summaries

| Harness @ version | Outcome | Runs | Median calls | Median of run median durations | Median of run median waits | Median of run median transfers | Median of run median gaps | Median time after last |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| cline @ 3.0.61 | Pass (completed) | 10 | 196 (available n=10; missing n=0) | 2.52s (available n=10; missing n=0) | 1.13s (available n=10; missing n=0) | 1.35s (available n=10; missing n=0) | 45.74558 ms (available n=10; missing n=0) | 1.31s (available n=10; missing n=0) |
| cline @ 3.0.61 | Verification failure (verify\_error) | 10 | 121 (available n=10; missing n=0) | 2.75s (available n=10; missing n=0) | 1.12s (available n=10; missing n=0) | 1.6s (available n=10; missing n=0) | 44.25275 ms (available n=10; missing n=0) | 1.48s (available n=10; missing n=0) |
| hermes @ Hermes Agent v0.20.5 (2026.8.19) | Pass (completed) | 20 | 114.5 (available n=20; missing n=0) | 3.22s (available n=20; missing n=0) | 1.67s (available n=20; missing n=0) | 1.38s (available n=20; missing n=0) | 180.663 ms (available n=20; missing n=0) | 274.5845 ms (available n=20; missing n=0) |
| hermes @ Hermes Agent v0.20.5 (2026.8.19) | Verification failure (verify\_error) | 20 | 108 (available n=20; missing n=0) | 3.05s (available n=20; missing n=0) | 1.52s (available n=20; missing n=0) | 1.45s (available n=20; missing n=0) | 173.5481 ms (available n=20; missing n=0) | 268.0604 ms (available n=20; missing n=0) |
| qwen @ 0.22.2 | Pass (completed) | 11 | 94 (available n=11; missing n=0) | 2.93s (available n=11; missing n=0) | 1.56s (available n=11; missing n=0) | 1.36s (available n=11; missing n=0) | 49.13188 ms (available n=11; missing n=0) | 237.393 ms (available n=11; missing n=0) |
| qwen @ 0.22.2 | Verification failure (verify\_error) | 6 | 75.5 (available n=6; missing n=0) | 2.66s (available n=6; missing n=0) | 1.42s (available n=6; missing n=0) | 1.1s (available n=6; missing n=0) | 45.50353 ms (available n=6; missing n=0) | 222.3954 ms (available n=6; missing n=0) |

### Common successful tasks

#### cline @ 3.0.61 (left) vs hermes @ Hermes Agent v0.20.5 (2026.8.19) (right)

Common successful tasks: 5. Left median of task medians: 782267.1 ms. Right median of task medians: 880686.2 ms. Median task ratio (right / left): 1.005573.

| Common successful task | Left n | Left median (ms) | Right n | Right median (ms) | Right / left |
| --- | --- | --- | --- | --- | --- |
| cattrs-partial-structuring-recovery | 2 | 723902.8 | 2 | 800776.7 | 1.106194 |
| psd-tools-blend-range-api | 1 | 782267.1 | 4 | 520348.7 | 0.6651804 |
| textual-richlog-follow-state | 1 | 3235393 | 1 | 2572629 | 0.795152 |
| tomlkit-toml-table-converters | 3 | 1616713 | 5 | 1625724 | 1.005573 |
| true-myth-iterable-collection-combinators | 1 | 640484.1 | 5 | 880686.2 | 1.375032 |

#### cline @ 3.0.61 (left) vs qwen @ 0.22.2 (right)

Common successful tasks: 6. Left median of task medians: 919051.7 ms. Right median of task medians: 549497.5 ms. Median task ratio (right / left): 0.5666548.

| Common successful task | Left n | Left median (ms) | Right n | Right median (ms) | Right / left |
| --- | --- | --- | --- | --- | --- |
| cattrs-partial-structuring-recovery | 2 | 723902.8 | 2 | 592323.6 | 0.8182363 |
| psd-tools-blend-range-api | 1 | 1055836 | 1 | 506671.4 | 0.4798768 |
| psd-tools-blend-range-api | 1 | 782267.1 | 2 | 501840 | 0.64152 |
| textual-richlog-follow-state | 1 | 3235393 | 1 | 1281924 | 0.3962189 |
| tomlkit-toml-table-converters | 3 | 1616713 | 2 | 795082.9 | 0.4917896 |
| true-myth-iterable-collection-combinators | 1 | 640484.1 | 2 | 452219.8 | 0.7060593 |

#### hermes @ Hermes Agent v0.20.5 (2026.8.19) (left) vs qwen @ 0.22.2 (right)

Common successful tasks: 5. Left median of task medians: 880686.2 ms. Right median of task medians: 592323.6 ms. Median task ratio (right / left): 0.5134857.

| Common successful task | Left n | Left median (ms) | Right n | Right median (ms) | Right / left |
| --- | --- | --- | --- | --- | --- |
| cattrs-partial-structuring-recovery | 2 | 800776.7 | 2 | 592323.6 | 0.7396863 |
| psd-tools-blend-range-api | 4 | 520348.7 | 2 | 501840 | 0.9644301 |
| textual-richlog-follow-state | 1 | 2572629 | 1 | 1281924 | 0.4982933 |
| tomlkit-toml-table-converters | 5 | 1625724 | 2 | 795082.9 | 0.489064 |
| true-myth-iterable-collection-combinators | 5 | 880686.2 | 2 | 452219.8 | 0.5134857 |

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

Selected attempts: 1. Task identity: \[&quot;psd-tools-blend-range-api&quot;,&quot;01595992c5f4d4695251fdf58b3edb5302d3ba46&quot;,&quot;sha256:0a4bac520618fd86c8a29b2fb482def495827fb8a951f497b4e2a6166e4e3fd9&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 506671.4 | unavailable | unavailable | 506671.4 | 506671.4 |
| Model (ms) | 1 | 0 | 440398.4 | unavailable | unavailable | 440398.4 | 440398.4 |
| Non-model (ms) | 1 | 0 | 64738.63 | unavailable | unavailable | 64738.63 | 64738.63 |
| Startup (ms) | 1 | 0 | 1534.325 | unavailable | unavailable | 1534.325 | 1534.325 |
| First byte (ms) | 1 | 0 | 1329.301 | unavailable | unavailable | 1329.301 | 1329.301 |
| API turns | 1 | 0 | 94 | unavailable | unavailable | 94 | 94 |
| Input tokens | 1 | 0 | 10089830 | unavailable | unavailable | 10089830 | 10089830 |
| Output tokens | 1 | 0 | 77099 | unavailable | unavailable | 77099 | 77099 |
| Cached input (%) | 1 | 0 | 99.06405 | unavailable | unavailable | 99.06405 | 99.06405 |
| Static cost (USD) | 1 | 0 | 0.09041098 | unavailable | unavailable | 0.09041098 | 0.09041098 |
| Model request count | 1 | 0 | 94 | unavailable | unavailable | 94 | 94 |
| Within-run median request duration (ms) | 1 | 0 | 2601.904 | unavailable | unavailable | 2601.904 | 2601.904 |
| Within-run median request wait (ms) | 1 | 0 | 1329.301 | unavailable | unavailable | 1329.301 | 1329.301 |
| Within-run median request transfer (ms) | 1 | 0 | 1150.177 | unavailable | unavailable | 1150.177 | 1150.177 |
| Within-run median inter-request gap (ms) | 1 | 0 | 41.00435 | unavailable | unavailable | 41.00435 | 41.00435 |
| Largest request duration (ms) | 1 | 0 | 33442.25 | unavailable | unavailable | 33442.25 | 33442.25 |
| Largest inter-request gap (ms) | 1 | 0 | 12336.23 | unavailable | unavailable | 12336.23 | 12336.23 |
| Time after last model response (ms) | 1 | 0 | 198.025 | unavailable | unavailable | 198.025 | 198.025 |

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

#### pinned:qwen:textual-richlog-follow-state:4:independent-linux-20260913 — largest inter-request gap among passes

qwen @ 0.22.2 · textual-richlog-follow-state · Pass (completed). Calls 127 (127 successful). Median duration 3.48s; largest gap 2m 40s; time after last 308.9952 ms.

#### pinned:hermes:psd-tools-blend-range-api:3:hermes-linux-20260915 — longest tail after last model response among passes

hermes @ Hermes Agent v0.20.5 (2026.8.19) · psd-tools-blend-range-api · Pass (completed). Calls 75 (75 successful). Median duration 2.36s; largest gap 12.26s; time after last 12.44s.

#### pinned:hermes:tomlkit-toml-table-converters:3:hermes-linux-20260915 — longest single model call among passes

hermes @ Hermes Agent v0.20.5 (2026.8.19) · tomlkit-toml-table-converters · Pass (completed). Calls 218 (218 successful). Median duration 3.06s; largest gap 15.55s; time after last 282.3173 ms.

#### pinned:hermes:textual-richlog-follow-state:4:hermes-linux-20260915 — most failed model calls among verification failures

hermes @ Hermes Agent v0.20.5 (2026.8.19) · textual-richlog-follow-state · Verification failure (verify_error). Calls 197 (196 successful). Median duration 3.56s; largest gap 3m 20.26s; time after last 349.2478 ms.

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
