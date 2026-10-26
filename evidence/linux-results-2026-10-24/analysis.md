80 completion-selected outcomes across two tool cohorts; 83 observed paid primary attempts and 52 prerequisites. This is a descriptive snapshot, not one randomized five-CLI experiment. Full experiment cost is unknown. Three partial native captures retain valid required grade artifacts. Native tool timing remains partial.

Cline: **37.5% estimated (6/16)**. [Method notes](cline-workflow-audit.json).

# Selected-attempt analysis

Selected attempts: 80. Populations: 1.

All selected outcomes. Task coverage can differ; these are descriptive summaries, not a ranking. Cost per task is the mean across repetitions, then equally averaged across tasks. Whole benchmark cost sums every selected run, including failures. Cache and tokens are medians per measured attempt. Partial costs are known lower bounds. Cost is a static estimate, not billing. Cache rate is the median attempt cached-input percentage, not a pooled token ratio. Input includes cached tokens; token counters cover successful model responses. Missing measurements are not zero.

## Comparison 1: deepseek/deepseek-v4.1-flash-1017 · linux

### At a glance

| Harness | Pass rate | Average reference cost / task | Whole benchmark cost | Cache rate | Tokens in | Tokens out | Task identities |
| --- | --- | --- | --- | --- | --- | --- | --- |
| cline @ 3.0.61 | 37.5% estimated · 6/16 · 46.2% of best | $0.308 · 20.2% of best (16/16 measured) | $4.931 · 20.2% of best (16/16 measured) | 96.4% · 97.4% of best (16/16 measured) | 12.67M · 35.1% of best (16/16 measured) | 163.4K · 35.6% of best (16/16 measured) | 8 |
| codex @ codex-cli 0.149.1 | 81.3% · 13/16 · 100.0% of best | $0.077 · 80.8% of best (16/16 measured) | $1.235 · 80.8% of best (16/16 measured) | 98.6% · 99.5% of best (16/16 measured) | 6.83M · 65.0% of best (16/16 measured) | 73.6K · 79.2% of best (16/16 measured) | 8 |
| hermes @ Hermes Agent v0.20.5 (2026.8.19) | 56.3% · 9/16 · 69.2% of best | $0.103 · 60.6% of best (16/16 measured) | $1.645 · 60.6% of best (16/16 measured) | 98.9% · 99.9% of best (16/16 measured) | 9.50M · 46.8% of best (16/16 measured) | 74.9K · 77.7% of best (16/16 measured) | 8 |
| pi @ 0.73.1 | 81.3% · 13/16 · 100.0% of best | $0.062 · 100.0% of best (16/16 measured) | $0.997 · 100.0% of best (16/16 measured) | 98.4% · 99.3% of best (16/16 measured) | 4.44M · 100.0% of best (16/16 measured) | 58.3K · 100.0% of best (16/16 measured) | 8 |
| qwen @ 0.22.2 | 56.3% · 9/16 · 69.2% of best | $0.080 · 77.9% of best (16/16 measured) | $1.280 · 77.9% of best (16/16 measured) | 99.0% · 100.0% of best (16/16 measured) | 8.04M · 55.3% of best (16/16 measured) | 70.1K · 83.1% of best (16/16 measured) | 8 |

All harnesses combined: $10.088 for 80 selected runs at the shared reference prices.

### Cost by task

Average across each task’s repetitions; all-repetition totals sum to the whole benchmark. ≥ marks a known lower bound where accounting is incomplete.

| Harness | Task | Runs | Average cost / task | All repetitions cost | Complete cost coverage |
| --- | --- | --- | --- | --- | --- |
| cline | cattrs-partial-structuring-recovery | 2 | $0.352 | $0.704 | 2/2 |
| cline | happy-dom-deterministic-intersectionobserver | 2 | $0.181 | $0.363 | 2/2 |
| cline | ink-grid-box-layout | 2 | $0.203 | $0.407 | 2/2 |
| cline | psd-tools-blend-range-api | 2 | $0.254 | $0.508 | 2/2 |
| cline | superjson-error-stack-serialization | 2 | $0.098 | $0.196 | 2/2 |
| cline | textual-richlog-follow-state | 2 | $0.780 | $1.560 | 2/2 |
| cline | tomlkit-toml-table-converters | 2 | $0.502 | $1.004 | 2/2 |
| cline | true-myth-iterable-collection-combinators | 2 | $0.094 | $0.189 | 2/2 |
| codex | cattrs-partial-structuring-recovery | 2 | $0.069 | $0.137 | 2/2 |
| codex | happy-dom-deterministic-intersectionobserver | 2 | $0.066 | $0.132 | 2/2 |
| codex | ink-grid-box-layout | 2 | $0.090 | $0.181 | 2/2 |
| codex | psd-tools-blend-range-api | 2 | $0.080 | $0.161 | 2/2 |
| codex | superjson-error-stack-serialization | 2 | $0.061 | $0.122 | 2/2 |
| codex | textual-richlog-follow-state | 2 | $0.096 | $0.192 | 2/2 |
| codex | tomlkit-toml-table-converters | 2 | $0.093 | $0.186 | 2/2 |
| codex | true-myth-iterable-collection-combinators | 2 | $0.062 | $0.123 | 2/2 |
| hermes | cattrs-partial-structuring-recovery | 2 | $0.089 | $0.177 | 2/2 |
| hermes | happy-dom-deterministic-intersectionobserver | 2 | $0.077 | $0.154 | 2/2 |
| hermes | ink-grid-box-layout | 2 | $0.074 | $0.149 | 2/2 |
| hermes | psd-tools-blend-range-api | 2 | $0.079 | $0.157 | 2/2 |
| hermes | superjson-error-stack-serialization | 2 | $0.044 | $0.089 | 2/2 |
| hermes | textual-richlog-follow-state | 2 | $0.157 | $0.315 | 2/2 |
| hermes | tomlkit-toml-table-converters | 2 | $0.205 | $0.411 | 2/2 |
| hermes | true-myth-iterable-collection-combinators | 2 | $0.097 | $0.194 | 2/2 |
| pi | cattrs-partial-structuring-recovery | 2 | $0.045 | $0.089 | 2/2 |
| pi | happy-dom-deterministic-intersectionobserver | 2 | $0.059 | $0.118 | 2/2 |
| pi | ink-grid-box-layout | 2 | $0.076 | $0.153 | 2/2 |
| pi | psd-tools-blend-range-api | 2 | $0.047 | $0.095 | 2/2 |
| pi | superjson-error-stack-serialization | 2 | $0.053 | $0.107 | 2/2 |
| pi | textual-richlog-follow-state | 2 | $0.064 | $0.128 | 2/2 |
| pi | tomlkit-toml-table-converters | 2 | $0.087 | $0.174 | 2/2 |
| pi | true-myth-iterable-collection-combinators | 2 | $0.067 | $0.134 | 2/2 |
| qwen | cattrs-partial-structuring-recovery | 2 | $0.074 | $0.149 | 2/2 |
| qwen | happy-dom-deterministic-intersectionobserver | 2 | $0.076 | $0.152 | 2/2 |
| qwen | ink-grid-box-layout | 2 | $0.109 | $0.218 | 2/2 |
| qwen | psd-tools-blend-range-api | 2 | $0.053 | $0.107 | 2/2 |
| qwen | superjson-error-stack-serialization | 2 | $0.049 | $0.098 | 2/2 |
| qwen | textual-richlog-follow-state | 2 | $0.087 | $0.175 | 2/2 |
| qwen | tomlkit-toml-table-converters | 2 | $0.123 | $0.247 | 2/2 |
| qwen | true-myth-iterable-collection-combinators | 2 | $0.068 | $0.136 | 2/2 |

Reference cost at fixed prices from deepseek-v41-1017-reference-2026-10-18: $0.15/M uncached input + $0.003/M cached input + $0.6/M output tokens. Calculated from exact request counters, averaged across repetitions per task and summed for the whole benchmark; not actual billing. Original price books remain in the evidence below.



Percent of observed best: higher pass/cache values score higher; lower cost/token values score higher. Each metric has its own 100% baseline. Partial measurement coverage is unscored. These descriptive indices are not a composite quality score; task coverage can differ.

## Detailed original accounting

## Population 1: deepseek/deepseek-v4.1-flash-1017 · linux · deepseek-v41-1017-reference-2026-10-18

### Recorded population identity

| Recorded identity | Value |
| --- | --- |
| Condition | pinned |
| Model | deepseek/deepseek-v4.1-flash-1017 |
| Price book | deepseek-v41-1017-reference-2026-10-18 |
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
| cline @ 3.0.61 | 16 | 0 | 16 | 0 | 8 | 16 | 8 | 16 | 16 | 16 | 16 | 16 | 0 / 0 |
| codex @ codex-cli 0.149.1 | 16 | 13 | 3 | 0 | 8 | 16 | 8 | 16 | 16 | 16 | 16 | 16 | 5 / 8 |
| hermes @ Hermes Agent v0.20.5 (2026.8.19) | 16 | 9 | 7 | 0 | 8 | 16 | 8 | 16 | 16 | 16 | 16 | 16 | 3 / 6 |
| pi @ 0.73.1 | 16 | 13 | 3 | 0 | 8 | 16 | 8 | 16 | 16 | 16 | 16 | 16 | 6 / 7 |
| qwen @ 0.22.2 | 16 | 9 | 7 | 0 | 8 | 16 | 8 | 16 | 16 | 16 | 16 | 16 | 4 / 5 |

### Selected spend by outcome

| Harness @ version | Outcome | Selected | Priced n | Missing n | Selected static spend (USD) |
| --- | --- | --- | --- | --- | --- |
| cline @ 3.0.61 | Verification failure (verify\_error) | 16 | 16 | 0 | Total: 4.93125 |
| codex @ codex-cli 0.149.1 | Verification failure (verify\_error) | 3 | 3 | 0 | Total: 0.2066405 |
| codex @ codex-cli 0.149.1 | Pass (completed) | 13 | 13 | 0 | Total: 1.027939 |
| hermes @ Hermes Agent v0.20.5 (2026.8.19) | Pass (completed) | 9 | 9 | 0 | Total: 0.9623701 |
| hermes @ Hermes Agent v0.20.5 (2026.8.19) | Verification failure (verify\_error) | 7 | 7 | 0 | Total: 0.6826842 |
| pi @ 0.73.1 | Pass (completed) | 13 | 13 | 0 | Total: 0.8236724 |
| pi @ 0.73.1 | Verification failure (verify\_error) | 3 | 3 | 0 | Total: 0.1735329 |
| qwen @ 0.22.2 | Pass (completed) | 9 | 9 | 0 | Total: 0.6966012 |
| qwen @ 0.22.2 | Verification failure (verify\_error) | 7 | 7 | 0 | Total: 0.5835826 |

### Request-level summaries

| Harness @ version | Outcome | Runs | Median calls | Median of run median durations | Median of run median waits | Median of run median transfers | Median of run median gaps | Median time after last |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| cline @ 3.0.61 | Verification failure (verify\_error) | 16 | 252.5 (available n=16; missing n=0) | 2.33s (available n=16; missing n=0) | 1.15s (available n=16; missing n=0) | 1.14s (available n=16; missing n=0) | 48.36447 ms (available n=16; missing n=0) | 1.48s (available n=16; missing n=0) |
| codex @ codex-cli 0.149.1 | Verification failure (verify\_error) | 3 | 49 (available n=3; missing n=0) | 3.62s (available n=3; missing n=0) | 1.28s (available n=3; missing n=0) | 2.35s (available n=3; missing n=0) | 60.34602 ms (available n=3; missing n=0) | 5.16s (available n=3; missing n=0) |
| codex @ codex-cli 0.149.1 | Pass (completed) | 13 | 64 (available n=13; missing n=0) | 3.62s (available n=13; missing n=0) | 1.33s (available n=13; missing n=0) | 2.25s (available n=13; missing n=0) | 57.6276 ms (available n=13; missing n=0) | 5.15s (available n=13; missing n=0) |
| hermes @ Hermes Agent v0.20.5 (2026.8.19) | Pass (completed) | 9 | 102 (available n=9; missing n=0) | 2.65s (available n=9; missing n=0) | 1.32s (available n=9; missing n=0) | 1.31s (available n=9; missing n=0) | 166.4325 ms (available n=9; missing n=0) | 250.4241 ms (available n=9; missing n=0) |
| hermes @ Hermes Agent v0.20.5 (2026.8.19) | Verification failure (verify\_error) | 7 | 65 (available n=7; missing n=0) | 3.43s (available n=7; missing n=0) | 1.25s (available n=7; missing n=0) | 1.98s (available n=7; missing n=0) | 162.8287 ms (available n=7; missing n=0) | 244.1931 ms (available n=7; missing n=0) |
| pi @ 0.73.1 | Pass (completed) | 13 | 59 (available n=13; missing n=0) | 2.81s (available n=13; missing n=0) | 1.24s (available n=13; missing n=0) | 1.61s (available n=13; missing n=0) | 38.59564 ms (available n=13; missing n=0) | 174.7571 ms (available n=13; missing n=0) |
| pi @ 0.73.1 | Verification failure (verify\_error) | 3 | 39 (available n=3; missing n=0) | 2.93s (available n=3; missing n=0) | 1.2s (available n=3; missing n=0) | 1.78s (available n=3; missing n=0) | 142.0054 ms (available n=3; missing n=0) | 186.4018 ms (available n=3; missing n=0) |
| qwen @ 0.22.2 | Pass (completed) | 9 | 78 (available n=9; missing n=0) | 2.66s (available n=9; missing n=0) | 1.28s (available n=9; missing n=0) | 1.32s (available n=9; missing n=0) | 46.9397 ms (available n=9; missing n=0) | 180.8887 ms (available n=9; missing n=0) |
| qwen @ 0.22.2 | Verification failure (verify\_error) | 7 | 94 (available n=7; missing n=0) | 2.76s (available n=7; missing n=0) | 1.29s (available n=7; missing n=0) | 1.42s (available n=7; missing n=0) | 47.65603 ms (available n=7; missing n=0) | 187.145 ms (available n=7; missing n=0) |

### Common successful tasks

#### cline @ 3.0.61 (left) vs codex @ codex-cli 0.149.1 (right)

Common successful tasks: 0. Left median of task medians: unavailable. Right median of task medians: unavailable. Median task ratio (right / left): unavailable.

No common successful tasks; comparison unavailable.

#### cline @ 3.0.61 (left) vs hermes @ Hermes Agent v0.20.5 (2026.8.19) (right)

Common successful tasks: 0. Left median of task medians: unavailable. Right median of task medians: unavailable. Median task ratio (right / left): unavailable.

No common successful tasks; comparison unavailable.

#### cline @ 3.0.61 (left) vs pi @ 0.73.1 (right)

Common successful tasks: 0. Left median of task medians: unavailable. Right median of task medians: unavailable. Median task ratio (right / left): unavailable.

No common successful tasks; comparison unavailable.

#### cline @ 3.0.61 (left) vs qwen @ 0.22.2 (right)

Common successful tasks: 0. Left median of task medians: unavailable. Right median of task medians: unavailable. Median task ratio (right / left): unavailable.

No common successful tasks; comparison unavailable.

#### codex @ codex-cli 0.149.1 (left) vs hermes @ Hermes Agent v0.20.5 (2026.8.19) (right)

Common successful tasks: 6. Left median of task medians: 499594.5 ms. Right median of task medians: 685530 ms. Median task ratio (right / left): 1.415092.

| Common successful task | Left n | Left median (ms) | Right n | Right median (ms) | Right / left |
| --- | --- | --- | --- | --- | --- |
| cattrs-partial-structuring-recovery | 1 | 504931.7 | 1 | 805580.8 | 1.595425 |
| happy-dom-deterministic-intersectionobserver | 1 | 494257.3 | 1 | 565479.2 | 1.144099 |
| ink-grid-box-layout | 1 | 643541.8 | 1 | 1004315 | 1.560606 |
| psd-tools-blend-range-api | 2 | 420909.2 | 2 | 487382.7 | 1.157929 |
| textual-richlog-follow-state | 2 | 771727.9 | 2 | 1105740 | 1.432811 |
| true-myth-iterable-collection-combinators | 2 | 365498.4 | 2 | 510737.4 | 1.397372 |

#### codex @ codex-cli 0.149.1 (left) vs pi @ 0.73.1 (right)

Common successful tasks: 7. Left median of task medians: 504931.7 ms. Right median of task medians: 407484.2 ms. Median task ratio (right / left): 0.8070086.

| Common successful task | Left n | Left median (ms) | Right n | Right median (ms) | Right / left |
| --- | --- | --- | --- | --- | --- |
| cattrs-partial-structuring-recovery | 1 | 504931.7 | 2 | 407484.2 | 0.8070086 |
| happy-dom-deterministic-intersectionobserver | 1 | 494257.3 | 1 | 396969.5 | 0.8031637 |
| ink-grid-box-layout | 1 | 643541.8 | 2 | 664306.4 | 1.032266 |
| psd-tools-blend-range-api | 2 | 420909.2 | 2 | 269955.5 | 0.641363 |
| textual-richlog-follow-state | 2 | 771727.9 | 2 | 519280.5 | 0.6728802 |
| tomlkit-toml-table-converters | 2 | 612632.6 | 2 | 584661 | 0.954342 |
| true-myth-iterable-collection-combinators | 2 | 365498.4 | 2 | 390860.7 | 1.069391 |

#### codex @ codex-cli 0.149.1 (left) vs qwen @ 0.22.2 (right)

Common successful tasks: 5. Left median of task medians: 504931.7 ms. Right median of task medians: 503533.2 ms. Median task ratio (right / left): 0.8777608.

| Common successful task | Left n | Left median (ms) | Right n | Right median (ms) | Right / left |
| --- | --- | --- | --- | --- | --- |
| cattrs-partial-structuring-recovery | 1 | 504931.7 | 2 | 503533.2 | 0.9972304 |
| ink-grid-box-layout | 1 | 643541.8 | 2 | 1111081 | 1.726509 |
| psd-tools-blend-range-api | 2 | 420909.2 | 2 | 312824.3 | 0.743211 |
| textual-richlog-follow-state | 2 | 771727.9 | 1 | 677392.5 | 0.8777608 |
| true-myth-iterable-collection-combinators | 2 | 365498.4 | 2 | 307788.9 | 0.8421073 |

#### hermes @ Hermes Agent v0.20.5 (2026.8.19) (left) vs pi @ 0.73.1 (right)

Common successful tasks: 6. Left median of task medians: 685530 ms. Right median of task medians: 402226.9 ms. Median task ratio (right / left): 0.6076702.

| Common successful task | Left n | Left median (ms) | Right n | Right median (ms) | Right / left |
| --- | --- | --- | --- | --- | --- |
| cattrs-partial-structuring-recovery | 1 | 805580.8 | 2 | 407484.2 | 0.5058266 |
| happy-dom-deterministic-intersectionobserver | 1 | 565479.2 | 1 | 396969.5 | 0.7020055 |
| ink-grid-box-layout | 1 | 1004315 | 2 | 664306.4 | 0.6614523 |
| psd-tools-blend-range-api | 2 | 487382.7 | 2 | 269955.5 | 0.5538882 |
| textual-richlog-follow-state | 2 | 1105740 | 2 | 519280.5 | 0.4696226 |
| true-myth-iterable-collection-combinators | 2 | 510737.4 | 2 | 390860.7 | 0.7652871 |

#### hermes @ Hermes Agent v0.20.5 (2026.8.19) (left) vs qwen @ 0.22.2 (right)

Common successful tasks: 5. Left median of task medians: 805580.8 ms. Right median of task medians: 503533.2 ms. Median task ratio (right / left): 0.6250561.

| Common successful task | Left n | Left median (ms) | Right n | Right median (ms) | Right / left |
| --- | --- | --- | --- | --- | --- |
| cattrs-partial-structuring-recovery | 1 | 805580.8 | 2 | 503533.2 | 0.6250561 |
| ink-grid-box-layout | 1 | 1004315 | 2 | 1111081 | 1.106307 |
| psd-tools-blend-range-api | 2 | 487382.7 | 2 | 312824.3 | 0.6418453 |
| textual-richlog-follow-state | 2 | 1105740 | 1 | 677392.5 | 0.6126147 |
| true-myth-iterable-collection-combinators | 2 | 510737.4 | 2 | 307788.9 | 0.6026362 |

#### pi @ 0.73.1 (left) vs qwen @ 0.22.2 (right)

Common successful tasks: 5. Left median of task medians: 407484.2 ms. Right median of task medians: 503533.2 ms. Median task ratio (right / left): 1.235712.

| Common successful task | Left n | Left median (ms) | Right n | Right median (ms) | Right / left |
| --- | --- | --- | --- | --- | --- |
| cattrs-partial-structuring-recovery | 2 | 407484.2 | 2 | 503533.2 | 1.235712 |
| ink-grid-box-layout | 2 | 664306.4 | 2 | 1111081 | 1.672542 |
| psd-tools-blend-range-api | 2 | 269955.5 | 2 | 312824.3 | 1.158799 |
| textual-richlog-follow-state | 2 | 519280.5 | 1 | 677392.5 | 1.304483 |
| true-myth-iterable-collection-combinators | 2 | 390860.7 | 2 | 307788.9 | 0.7874643 |

### Per-task outcome distributions

#### cattrs-partial-structuring-recovery — cline @ 3.0.61 — Verification failure (verify_error)

Selected attempts: 2. Task identity: \[&quot;cattrs-partial-structuring-recovery&quot;,&quot;91df27b2a20f26c35777a92f4555438b62c06345&quot;,&quot;sha256:b985f2bd17e9e80bee0fa9b7c0747b2ded92d54d070b32ebfe102e8829a44076&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 2571156 | 1794233 | 3348079 | 1017310 | 4125001 |
| Model (ms) | 2 | 0 | 1859729 | 1305879 | 2413579 | 752028.6 | 2967429 |
| Non-model (ms) | 2 | 0 | 710220.5 | 487141.5 | 933299.6 | 264062.4 | 1156379 |
| Startup (ms) | 2 | 0 | 1206.338 | 1200.051 | 1212.625 | 1193.764 | 1218.912 |
| First byte (ms) | 2 | 0 | 1149.797 | 1135.139 | 1164.456 | 1120.48 | 1179.115 |
| API turns | 2 | 0 | 576 | 398 | 754 | 220 | 932 |
| Input tokens | 2 | 0 | 28596110 | 19731320 | 37460890 | 10866540 | 46325680 |
| Output tokens | 2 | 0 | 267557 | 186360 | 348754 | 105163 | 429951 |
| Cached input (%) | 2 | 0 | 97.60649 | 97.50982 | 97.70317 | 97.41314 | 97.79985 |
| Static cost (USD) | 2 | 0 | 0.3519759 | 0.241409 | 0.4625428 | 0.1308422 | 0.5731096 |
| Model request count | 2 | 0 | 576 | 398 | 754 | 220 | 932 |
| Within-run median request duration (ms) | 2 | 0 | 2237.073 | 2215.115 | 2259.03 | 2193.158 | 2280.987 |
| Within-run median request wait (ms) | 2 | 0 | 1149.797 | 1135.139 | 1164.456 | 1120.48 | 1179.115 |
| Within-run median request transfer (ms) | 2 | 0 | 1005.504 | 958.8827 | 1052.125 | 912.2614 | 1098.747 |
| Within-run median inter-request gap (ms) | 2 | 0 | 60.06667 | 50.58795 | 69.54539 | 41.10922 | 79.02412 |
| Largest request duration (ms) | 2 | 0 | 31304.85 | 29575.39 | 33034.31 | 27845.94 | 34763.77 |
| Largest inter-request gap (ms) | 2 | 0 | 30080.71 | 30064.53 | 30096.89 | 30048.35 | 30113.08 |
| Time after last model response (ms) | 2 | 0 | 1520.783 | 1437.585 | 1603.981 | 1354.386 | 1687.18 |

#### happy-dom-deterministic-intersectionobserver — cline @ 3.0.61 — Verification failure (verify_error)

Selected attempts: 2. Task identity: \[&quot;happy-dom-deterministic-intersectionobserver&quot;,&quot;32b2a8e60eab482c023af377160bf294d6da0318&quot;,&quot;sha256:a4df294272f2165ce894306ab1eec5284fe426ddaa66cf08bb3c4755a9f8faa2&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 1086727 | 945802.3 | 1227652 | 804877.3 | 1368577 |
| Model (ms) | 2 | 0 | 897702.8 | 726610.3 | 1068795 | 555517.8 | 1239888 |
| Non-model (ms) | 2 | 0 | 187224 | 157063.4 | 217384.7 | 126902.7 | 247545.3 |
| Startup (ms) | 2 | 0 | 1800.434 | 1793.581 | 1807.287 | 1786.728 | 1814.14 |
| First byte (ms) | 2 | 0 | 1129.817 | 1112.726 | 1146.909 | 1095.634 | 1164.001 |
| API turns | 2 | 0 | 226.5 | 174.75 | 278.25 | 123 | 330 |
| Input tokens | 2 | 0 | 10706940 | 8288461 | 13125420 | 5869981 | 15543900 |
| Output tokens | 2 | 0 | 139832.5 | 111770.8 | 167894.3 | 83709 | 195956 |
| Cached input (%) | 2 | 0 | 96.1652 | 95.80499 | 96.52541 | 95.44477 | 96.88563 |
| Static cost (USD) | 2 | 0 | 0.1814995 | 0.1381042 | 0.2248948 | 0.09470885 | 0.2682901 |
| Model request count | 2 | 0 | 226.5 | 174.75 | 278.25 | 123 | 330 |
| Within-run median request duration (ms) | 2 | 0 | 2346.464 | 2265.499 | 2427.429 | 2184.535 | 2508.394 |
| Within-run median request wait (ms) | 2 | 0 | 1129.817 | 1112.726 | 1146.909 | 1095.634 | 1164.001 |
| Within-run median request transfer (ms) | 2 | 0 | 1059.42 | 1026.321 | 1092.52 | 993.2209 | 1125.62 |
| Within-run median inter-request gap (ms) | 2 | 0 | 45.21996 | 41.90573 | 48.53419 | 38.59149 | 51.84842 |
| Largest request duration (ms) | 2 | 0 | 44271.9 | 38214.53 | 50329.26 | 32157.16 | 56386.63 |
| Largest inter-request gap (ms) | 2 | 0 | 30044.75 | 30043.09 | 30046.4 | 30041.43 | 30048.06 |
| Time after last model response (ms) | 2 | 0 | 1526.089 | 1490.162 | 1562.017 | 1454.234 | 1597.945 |

#### ink-grid-box-layout — cline @ 3.0.61 — Verification failure (verify_error)

Selected attempts: 2. Task identity: \[&quot;ink-grid-box-layout&quot;,&quot;477fda7df7781406d2ba046eb48dd5391e964b72&quot;,&quot;sha256:73daa7eb11dec0d43e523434d28a66ee9d3ac063fda33d9e26183d867739dbb1&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 1476306 | 1272347 | 1680264 | 1068389 | 1884222 |
| Model (ms) | 2 | 0 | 1184813 | 1020220 | 1349405 | 855628 | 1513997 |
| Non-model (ms) | 2 | 0 | 289216.5 | 250105.5 | 328327.4 | 210994.6 | 367438.3 |
| Startup (ms) | 2 | 0 | 2276.627 | 2021.48 | 2531.774 | 1766.333 | 2786.921 |
| First byte (ms) | 2 | 0 | 1162.524 | 1155.709 | 1169.34 | 1148.893 | 1176.156 |
| API turns | 2 | 0 | 269 | 222 | 316 | 175 | 363 |
| Input tokens | 2 | 0 | 14481920 | 11752770 | 17211060 | 9023628 | 19940210 |
| Output tokens | 2 | 0 | 165905 | 151232 | 180578 | 136559 | 195251 |
| Cached input (%) | 2 | 0 | 96.99301 | 96.76303 | 97.22298 | 96.53306 | 97.45296 |
| Static cost (USD) | 2 | 0 | 0.2033123 | 0.1791533 | 0.2274713 | 0.1549944 | 0.2516303 |
| Model request count | 2 | 0 | 269 | 222 | 316 | 175 | 363 |
| Within-run median request duration (ms) | 2 | 0 | 2329.588 | 2316.958 | 2342.218 | 2304.328 | 2354.848 |
| Within-run median request wait (ms) | 2 | 0 | 1162.524 | 1155.709 | 1169.34 | 1148.893 | 1176.156 |
| Within-run median request transfer (ms) | 2 | 0 | 1160.483 | 1159.98 | 1160.987 | 1159.476 | 1161.491 |
| Within-run median inter-request gap (ms) | 2 | 0 | 48.39781 | 48.01641 | 48.77921 | 47.63501 | 49.16061 |
| Largest request duration (ms) | 2 | 0 | 46507.94 | 44417.57 | 48598.3 | 42327.21 | 50688.67 |
| Largest inter-request gap (ms) | 2 | 0 | 30058.65 | 30055.51 | 30061.8 | 30052.36 | 30064.95 |
| Time after last model response (ms) | 2 | 0 | 1430.834 | 1410.576 | 1451.091 | 1390.319 | 1471.349 |

#### psd-tools-blend-range-api — cline @ 3.0.61 — Verification failure (verify_error)

Selected attempts: 2. Task identity: \[&quot;psd-tools-blend-range-api&quot;,&quot;01595992c5f4d4695251fdf58b3edb5302d3ba46&quot;,&quot;sha256:fbfcc5b7e68a2d8fd97688c69808049d582113368f388929d7d46ac44a592cd9&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 1544327 | 1243501 | 1845154 | 942673.7 | 2145981 |
| Model (ms) | 2 | 0 | 1254854 | 1035591 | 1474118 | 816327.8 | 1693381 |
| Non-model (ms) | 2 | 0 | 288179.5 | 206615 | 369743.9 | 125050.5 | 451308.4 |
| Startup (ms) | 2 | 0 | 1293.561 | 1292.632 | 1294.491 | 1291.702 | 1295.42 |
| First byte (ms) | 2 | 0 | 1137.995 | 1127.483 | 1148.508 | 1116.97 | 1159.02 |
| API turns | 2 | 0 | 365.5 | 294.75 | 436.25 | 224 | 507 |
| Input tokens | 2 | 0 | 19044360 | 14985270 | 23103450 | 10926180 | 27162540 |
| Output tokens | 2 | 0 | 189242 | 160299 | 218185 | 131356 | 247128 |
| Cached input (%) | 2 | 0 | 96.79369 | 96.52256 | 97.06482 | 96.25144 | 97.33594 |
| Static cost (USD) | 2 | 0 | 0.2539685 | 0.2128841 | 0.2950529 | 0.1717997 | 0.3361373 |
| Model request count | 2 | 0 | 365.5 | 294.75 | 436.25 | 224 | 507 |
| Within-run median request duration (ms) | 2 | 0 | 2313.683 | 2309.316 | 2318.049 | 2304.95 | 2322.416 |
| Within-run median request wait (ms) | 2 | 0 | 1137.995 | 1127.483 | 1148.508 | 1116.97 | 1159.02 |
| Within-run median request transfer (ms) | 2 | 0 | 1092.656 | 1091.12 | 1094.192 | 1089.584 | 1095.728 |
| Within-run median inter-request gap (ms) | 2 | 0 | 50.43535 | 48.30266 | 52.56805 | 46.16996 | 54.70074 |
| Largest request duration (ms) | 2 | 0 | 41802.08 | 41016.94 | 42587.22 | 40231.79 | 43372.37 |
| Largest inter-request gap (ms) | 2 | 0 | 27368.47 | 26075.33 | 28661.61 | 24782.19 | 29954.74 |
| Time after last model response (ms) | 2 | 0 | 1701.127 | 1513.27 | 1888.985 | 1325.412 | 2076.842 |

#### superjson-error-stack-serialization — cline @ 3.0.61 — Verification failure (verify_error)

Selected attempts: 2. Task identity: \[&quot;superjson-error-stack-serialization&quot;,&quot;f143004734ea2dd4090e45013a07f091f5bbaee7&quot;,&quot;sha256:dcc10590630fcc927468099eb5118e4bc7170a1f12e01ca5c9404011de072444&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 583582.1 | 532280.7 | 634883.5 | 480979.3 | 686184.9 |
| Model (ms) | 2 | 0 | 565454.9 | 514275.3 | 616634.5 | 463095.7 | 667814.1 |
| Non-model (ms) | 2 | 0 | 16274.14 | 16151.69 | 16396.59 | 16029.24 | 16519.03 |
| Startup (ms) | 2 | 0 | 1853.058 | 1852.411 | 1853.706 | 1851.763 | 1854.353 |
| First byte (ms) | 2 | 0 | 1159.672 | 1139.787 | 1179.556 | 1119.903 | 1199.44 |
| API turns | 2 | 0 | 92 | 84.5 | 99.5 | 77 | 107 |
| Input tokens | 2 | 0 | 4718935 | 4296629 | 5141241 | 3874323 | 5563547 |
| Output tokens | 2 | 0 | 95419.5 | 91940.75 | 98898.25 | 88462 | 102377 |
| Cached input (%) | 2 | 0 | 96.10447 | 96.02511 | 96.18383 | 95.94574 | 96.26319 |
| Static cost (USD) | 2 | 0 | 0.09823409 | 0.09301214 | 0.103456 | 0.08779019 | 0.108678 |
| Model request count | 2 | 0 | 92 | 84.5 | 99.5 | 77 | 107 |
| Within-run median request duration (ms) | 2 | 0 | 2842.781 | 2780.502 | 2905.06 | 2718.223 | 2967.339 |
| Within-run median request wait (ms) | 2 | 0 | 1159.672 | 1139.787 | 1179.556 | 1119.903 | 1199.44 |
| Within-run median request transfer (ms) | 2 | 0 | 1603.745 | 1600.334 | 1607.156 | 1596.923 | 1610.568 |
| Within-run median inter-request gap (ms) | 2 | 0 | 41.29052 | 40.97526 | 41.60578 | 40.66 | 41.92104 |
| Largest request duration (ms) | 2 | 0 | 112897.9 | 103092.9 | 122702.9 | 93287.91 | 132507.9 |
| Largest inter-request gap (ms) | 2 | 0 | 1411.255 | 1391.4 | 1431.11 | 1371.545 | 1450.965 |
| Time after last model response (ms) | 2 | 0 | 1342.446 | 1272.821 | 1412.071 | 1203.197 | 1481.695 |

#### textual-richlog-follow-state — cline @ 3.0.61 — Verification failure (verify_error)

Selected attempts: 2. Task identity: \[&quot;textual-richlog-follow-state&quot;,&quot;a12215b791587a6d94227bd30a0e9291de932106&quot;,&quot;sha256:73fd3d800de9d5dae47edd9b5269e40966664b72d49d8f598964b8b91fdd0b92&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 5117740 | 4621541 | 5613939 | 4125342 | 6110138 |
| Model (ms) | 2 | 0 | 3655051 | 3390901 | 3919201 | 3126751 | 4183350 |
| Non-model (ms) | 2 | 0 | 1461424 | 1229378 | 1693470 | 997331.3 | 1925517 |
| Startup (ms) | 2 | 0 | 1265.01 | 1262.015 | 1268.005 | 1259.019 | 1271.001 |
| First byte (ms) | 2 | 0 | 1152.212 | 1147.546 | 1156.877 | 1142.881 | 1161.543 |
| API turns | 2 | 0 | 1021.5 | 898.75 | 1144.25 | 776 | 1267 |
| Input tokens | 2 | 0 | 46257860 | 40802020 | 51713710 | 35346170 | 57169560 |
| Output tokens | 2 | 0 | 494898 | 452980.5 | 536815.5 | 411063 | 578733 |
| Cached input (%) | 2 | 0 | 94.98392 | 94.87807 | 95.08976 | 94.77223 | 95.1956 |
| Static cost (USD) | 2 | 0 | 0.7801969 | 0.6912522 | 0.8691415 | 0.6023076 | 0.9580862 |
| Model request count | 2 | 0 | 1021.5 | 898.75 | 1144.25 | 776 | 1267 |
| Within-run median request duration (ms) | 2 | 0 | 2579.091 | 2454.516 | 2703.667 | 2329.94 | 2828.242 |
| Within-run median request wait (ms) | 2 | 0 | 1152.212 | 1147.546 | 1156.877 | 1142.881 | 1161.543 |
| Within-run median request transfer (ms) | 2 | 0 | 1356.473 | 1248.219 | 1464.728 | 1139.964 | 1572.982 |
| Within-run median inter-request gap (ms) | 2 | 0 | 114.4724 | 103.7456 | 125.1993 | 93.01874 | 135.9261 |
| Largest request duration (ms) | 2 | 0 | 49326.46 | 38051.23 | 60601.69 | 26776.01 | 71876.91 |
| Largest inter-request gap (ms) | 2 | 0 | 30195.3 | 30175.95 | 30214.64 | 30156.61 | 30233.99 |
| Time after last model response (ms) | 2 | 0 | 2008.761 | 1859.771 | 2157.752 | 1710.78 | 2306.742 |

#### tomlkit-toml-table-converters — cline @ 3.0.61 — Verification failure (verify_error)

Selected attempts: 2. Task identity: \[&quot;tomlkit-toml-table-converters&quot;,&quot;962de91aaf103135f400e5108a798a59a10dc17e&quot;,&quot;sha256:68dd891458463c9f930dcbbd59b4442065c145d66ce3b5813af82ca5ec8f4966&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 2973340 | 2174203 | 3772476 | 1375067 | 4571613 |
| Model (ms) | 2 | 0 | 2824143 | 2072091 | 3576194 | 1320040 | 4328245 |
| Non-model (ms) | 2 | 0 | 147973.7 | 100884.1 | 195063.3 | 53794.5 | 242152.9 |
| Startup (ms) | 2 | 0 | 1223.641 | 1219.319 | 1227.963 | 1214.997 | 1232.285 |
| First byte (ms) | 2 | 0 | 1116.063 | 1112.122 | 1120.003 | 1108.181 | 1123.944 |
| API turns | 2 | 0 | 598.5 | 439.75 | 757.25 | 281 | 916 |
| Input tokens | 2 | 0 | 28379730 | 21399380 | 35360070 | 14419040 | 42340410 |
| Output tokens | 2 | 0 | 397370.5 | 293821.8 | 500919.3 | 190273 | 604468 |
| Cached input (%) | 2 | 0 | 96.27201 | 95.70973 | 96.8343 | 95.14745 | 97.39658 |
| Static cost (USD) | 2 | 0 | 0.5021649 | 0.3573839 | 0.6469458 | 0.2126029 | 0.7917268 |
| Model request count | 2 | 0 | 598.5 | 439.75 | 757.25 | 281 | 916 |
| Within-run median request duration (ms) | 2 | 0 | 2663.609 | 2632.965 | 2694.253 | 2602.321 | 2724.897 |
| Within-run median request wait (ms) | 2 | 0 | 1116.063 | 1112.122 | 1120.003 | 1108.181 | 1123.944 |
| Within-run median request transfer (ms) | 2 | 0 | 1489.693 | 1457.149 | 1522.236 | 1424.606 | 1554.78 |
| Within-run median inter-request gap (ms) | 2 | 0 | 69.42084 | 59.25739 | 79.58429 | 49.09394 | 89.74773 |
| Largest request duration (ms) | 2 | 0 | 99253.63 | 79614.19 | 118893.1 | 59974.75 | 138532.5 |
| Largest inter-request gap (ms) | 2 | 0 | 18930.08 | 13367.62 | 24492.53 | 7805.163 | 30054.99 |
| Time after last model response (ms) | 2 | 0 | 1569.163 | 1557.857 | 1580.469 | 1546.551 | 1591.775 |

#### true-myth-iterable-collection-combinators — cline @ 3.0.61 — Verification failure (verify_error)

Selected attempts: 2. Task identity: \[&quot;true-myth-iterable-collection-combinators&quot;,&quot;5945ad1b96e228ff716275d8a273282101152508&quot;,&quot;sha256:0ecebbb45e561b37ee5d7bcbe80588427f4890fb80fffbbb73ca6b94c7cb8855&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 474893.7 | 467109.8 | 482677.7 | 459325.8 | 490461.7 |
| Model (ms) | 2 | 0 | 424916.2 | 411668.3 | 438164.2 | 398420.3 | 451412.2 |
| Non-model (ms) | 2 | 0 | 48748.76 | 43286.46 | 54211.06 | 37824.15 | 59673.37 |
| Startup (ms) | 2 | 0 | 1228.741 | 1227.046 | 1230.437 | 1225.351 | 1232.132 |
| First byte (ms) | 2 | 0 | 1141.013 | 1136.539 | 1145.486 | 1132.066 | 1149.959 |
| API turns | 2 | 0 | 117.5 | 115.25 | 119.75 | 113 | 122 |
| Input tokens | 2 | 0 | 6349182 | 6311184 | 6387181 | 6273185 | 6425179 |
| Output tokens | 2 | 0 | 70057 | 69856.5 | 70257.5 | 69656 | 70458 |
| Cached input (%) | 2 | 0 | 96.44369 | 96.43926 | 96.44811 | 96.43484 | 96.45253 |
| Static cost (USD) | 2 | 0 | 0.09427288 | 0.09412182 | 0.09442393 | 0.09397076 | 0.09457499 |
| Model request count | 2 | 0 | 117.5 | 115.25 | 119.75 | 113 | 122 |
| Within-run median request duration (ms) | 2 | 0 | 2209.591 | 2205.212 | 2213.969 | 2200.834 | 2218.347 |
| Within-run median request wait (ms) | 2 | 0 | 1141.013 | 1136.539 | 1145.486 | 1132.066 | 1149.959 |
| Within-run median request transfer (ms) | 2 | 0 | 1067.317 | 1026.582 | 1108.052 | 985.8472 | 1148.786 |
| Within-run median inter-request gap (ms) | 2 | 0 | 37.42782 | 36.96961 | 37.88603 | 36.5114 | 38.34425 |
| Largest request duration (ms) | 2 | 0 | 21177.92 | 19987.85 | 22367.99 | 18797.78 | 23558.06 |
| Largest inter-request gap (ms) | 2 | 0 | 5152.887 | 4740.359 | 5565.415 | 4327.832 | 5977.943 |
| Time after last model response (ms) | 2 | 0 | 1288.573 | 1234.045 | 1343.1 | 1179.518 | 1397.628 |

#### cattrs-partial-structuring-recovery — codex @ codex-cli 0.149.1 — Pass (completed)

Selected attempts: 1. Task identity: \[&quot;cattrs-partial-structuring-recovery&quot;,&quot;91df27b2a20f26c35777a92f4555438b62c06345&quot;,&quot;sha256:b985f2bd17e9e80bee0fa9b7c0747b2ded92d54d070b32ebfe102e8829a44076&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 504931.7 | unavailable | unavailable | 504931.7 | 504931.7 |
| Model (ms) | 1 | 0 | 388696.4 | unavailable | unavailable | 388696.4 | 388696.4 |
| Non-model (ms) | 1 | 0 | 115598.7 | unavailable | unavailable | 115598.7 | 115598.7 |
| Startup (ms) | 1 | 0 | 636.6449 | unavailable | unavailable | 636.6449 | 636.6449 |
| First byte (ms) | 1 | 0 | 1327.36 | unavailable | unavailable | 1327.36 | 1327.36 |
| API turns | 1 | 0 | 83 | unavailable | unavailable | 83 | 83 |
| Input tokens | 1 | 0 | 9120964 | unavailable | unavailable | 9120964 | 9120964 |
| Output tokens | 1 | 0 | 64441 | unavailable | unavailable | 64441 | 64441 |
| Cached input (%) | 1 | 0 | 98.99445 | unavailable | unavailable | 98.99445 | 98.99445 |
| Static cost (USD) | 1 | 0 | 0.07950974 | unavailable | unavailable | 0.07950974 | 0.07950974 |
| Model request count | 1 | 0 | 83 | unavailable | unavailable | 83 | 83 |
| Within-run median request duration (ms) | 1 | 0 | 2804.46 | unavailable | unavailable | 2804.46 | 2804.46 |
| Within-run median request wait (ms) | 1 | 0 | 1327.36 | unavailable | unavailable | 1327.36 | 1327.36 |
| Within-run median request transfer (ms) | 1 | 0 | 1465.839 | unavailable | unavailable | 1465.839 | 1465.839 |
| Within-run median inter-request gap (ms) | 1 | 0 | 58.27591 | unavailable | unavailable | 58.27591 | 58.27591 |
| Largest request duration (ms) | 1 | 0 | 45084.93 | unavailable | unavailable | 45084.93 | 45084.93 |
| Largest inter-request gap (ms) | 1 | 0 | 10020.99 | unavailable | unavailable | 10020.99 | 10020.99 |
| Time after last model response (ms) | 1 | 0 | 5149.023 | unavailable | unavailable | 5149.023 | 5149.023 |

#### cattrs-partial-structuring-recovery — codex @ codex-cli 0.149.1 — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;cattrs-partial-structuring-recovery&quot;,&quot;91df27b2a20f26c35777a92f4555438b62c06345&quot;,&quot;sha256:b985f2bd17e9e80bee0fa9b7c0747b2ded92d54d070b32ebfe102e8829a44076&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 407680.5 | unavailable | unavailable | 407680.5 | 407680.5 |
| Model (ms) | 1 | 0 | 276584.8 | unavailable | unavailable | 276584.8 | 276584.8 |
| Non-model (ms) | 1 | 0 | 130502.8 | unavailable | unavailable | 130502.8 | 130502.8 |
| Startup (ms) | 1 | 0 | 592.9269 | unavailable | unavailable | 592.9269 | 592.9269 |
| First byte (ms) | 1 | 0 | 1275.526 | unavailable | unavailable | 1275.526 | 1275.526 |
| API turns | 1 | 0 | 41 | unavailable | unavailable | 41 | 41 |
| Input tokens | 1 | 0 | 3910582 | unavailable | unavailable | 3910582 | 3910582 |
| Output tokens | 1 | 0 | 55590 | unavailable | unavailable | 55590 | 55590 |
| Cached input (%) | 1 | 0 | 97.83505 | unavailable | unavailable | 97.83505 | 97.83505 |
| Static cost (USD) | 1 | 0 | 0.05753106 | unavailable | unavailable | 0.05753106 | 0.05753106 |
| Model request count | 1 | 0 | 41 | unavailable | unavailable | 41 | 41 |
| Within-run median request duration (ms) | 1 | 0 | 3620.148 | unavailable | unavailable | 3620.148 | 3620.148 |
| Within-run median request wait (ms) | 1 | 0 | 1275.526 | unavailable | unavailable | 1275.526 | 1275.526 |
| Within-run median request transfer (ms) | 1 | 0 | 2428.206 | unavailable | unavailable | 2428.206 | 2428.206 |
| Within-run median inter-request gap (ms) | 1 | 0 | 56.97248 | unavailable | unavailable | 56.97248 | 56.97248 |
| Largest request duration (ms) | 1 | 0 | 46153.75 | unavailable | unavailable | 46153.75 | 46153.75 |
| Largest inter-request gap (ms) | 1 | 0 | 30178.12 | unavailable | unavailable | 30178.12 | 30178.12 |
| Time after last model response (ms) | 1 | 0 | 5126.47 | unavailable | unavailable | 5126.47 | 5126.47 |

#### happy-dom-deterministic-intersectionobserver — codex @ codex-cli 0.149.1 — Pass (completed)

Selected attempts: 1. Task identity: \[&quot;happy-dom-deterministic-intersectionobserver&quot;,&quot;32b2a8e60eab482c023af377160bf294d6da0318&quot;,&quot;sha256:a4df294272f2165ce894306ab1eec5284fe426ddaa66cf08bb3c4755a9f8faa2&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 494257.3 | unavailable | unavailable | 494257.3 | 494257.3 |
| Model (ms) | 1 | 0 | 362910.6 | unavailable | unavailable | 362910.6 | 362910.6 |
| Non-model (ms) | 1 | 0 | 130164.8 | unavailable | unavailable | 130164.8 | 130164.8 |
| Startup (ms) | 1 | 0 | 1181.953 | unavailable | unavailable | 1181.953 | 1181.953 |
| First byte (ms) | 1 | 0 | 1343.613 | unavailable | unavailable | 1343.613 | 1343.613 |
| API turns | 1 | 0 | 64 | unavailable | unavailable | 64 | 64 |
| Input tokens | 1 | 0 | 5966339 | unavailable | unavailable | 5966339 | 5966339 |
| Output tokens | 1 | 0 | 65271 | unavailable | unavailable | 65271 | 65271 |
| Cached input (%) | 1 | 0 | 98.33514 | unavailable | unavailable | 98.33514 | 98.33514 |
| Static cost (USD) | 1 | 0 | 0.07166327 | unavailable | unavailable | 0.07166327 | 0.07166327 |
| Model request count | 1 | 0 | 64 | unavailable | unavailable | 64 | 64 |
| Within-run median request duration (ms) | 1 | 0 | 3135.158 | unavailable | unavailable | 3135.158 | 3135.158 |
| Within-run median request wait (ms) | 1 | 0 | 1343.613 | unavailable | unavailable | 1343.613 | 1343.613 |
| Within-run median request transfer (ms) | 1 | 0 | 1789.352 | unavailable | unavailable | 1789.352 | 1789.352 |
| Within-run median inter-request gap (ms) | 1 | 0 | 55.76959 | unavailable | unavailable | 55.76959 | 55.76959 |
| Largest request duration (ms) | 1 | 0 | 63664.75 | unavailable | unavailable | 63664.75 | 63664.75 |
| Largest inter-request gap (ms) | 1 | 0 | 30174.08 | unavailable | unavailable | 30174.08 | 30174.08 |
| Time after last model response (ms) | 1 | 0 | 5142.658 | unavailable | unavailable | 5142.658 | 5142.658 |

#### happy-dom-deterministic-intersectionobserver — codex @ codex-cli 0.149.1 — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;happy-dom-deterministic-intersectionobserver&quot;,&quot;32b2a8e60eab482c023af377160bf294d6da0318&quot;,&quot;sha256:a4df294272f2165ce894306ab1eec5284fe426ddaa66cf08bb3c4755a9f8faa2&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 352682.6 | unavailable | unavailable | 352682.6 | 352682.6 |
| Model (ms) | 1 | 0 | 287183.7 | unavailable | unavailable | 287183.7 | 287183.7 |
| Non-model (ms) | 1 | 0 | 63498.99 | unavailable | unavailable | 63498.99 | 63498.99 |
| Startup (ms) | 1 | 0 | 1999.863 | unavailable | unavailable | 1999.863 | 1999.863 |
| First byte (ms) | 1 | 0 | 1266.926 | unavailable | unavailable | 1266.926 | 1266.926 |
| API turns | 1 | 0 | 49 | unavailable | unavailable | 49 | 49 |
| Input tokens | 1 | 0 | 4364608 | unavailable | unavailable | 4364608 | 4364608 |
| Output tokens | 1 | 0 | 58221 | unavailable | unavailable | 58221 | 58221 |
| Cached input (%) | 1 | 0 | 98.08349 | unavailable | unavailable | 98.08349 | 98.08349 |
| Static cost (USD) | 1 | 0 | 0.06032268 | unavailable | unavailable | 0.06032268 | 0.06032268 |
| Model request count | 1 | 0 | 49 | unavailable | unavailable | 49 | 49 |
| Within-run median request duration (ms) | 1 | 0 | 3656.983 | unavailable | unavailable | 3656.983 | 3656.983 |
| Within-run median request wait (ms) | 1 | 0 | 1266.926 | unavailable | unavailable | 1266.926 | 1266.926 |
| Within-run median request transfer (ms) | 1 | 0 | 2346.389 | unavailable | unavailable | 2346.389 | 2346.389 |
| Within-run median inter-request gap (ms) | 1 | 0 | 60.34602 | unavailable | unavailable | 60.34602 | 60.34602 |
| Largest request duration (ms) | 1 | 0 | 33264.21 | unavailable | unavailable | 33264.21 | 33264.21 |
| Largest inter-request gap (ms) | 1 | 0 | 29749.73 | unavailable | unavailable | 29749.73 | 29749.73 |
| Time after last model response (ms) | 1 | 0 | 5160.327 | unavailable | unavailable | 5160.327 | 5160.327 |

#### ink-grid-box-layout — codex @ codex-cli 0.149.1 — Pass (completed)

Selected attempts: 1. Task identity: \[&quot;ink-grid-box-layout&quot;,&quot;477fda7df7781406d2ba046eb48dd5391e964b72&quot;,&quot;sha256:73daa7eb11dec0d43e523434d28a66ee9d3ac063fda33d9e26183d867739dbb1&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 643541.8 | unavailable | unavailable | 643541.8 | 643541.8 |
| Model (ms) | 1 | 0 | 463961.6 | unavailable | unavailable | 463961.6 | 463961.6 |
| Non-model (ms) | 1 | 0 | 172723.4 | unavailable | unavailable | 172723.4 | 172723.4 |
| Startup (ms) | 1 | 0 | 6856.822 | unavailable | unavailable | 6856.822 | 6856.822 |
| First byte (ms) | 1 | 0 | 1318.878 | unavailable | unavailable | 1318.878 | 1318.878 |
| API turns | 1 | 0 | 79 | unavailable | unavailable | 79 | 79 |
| Input tokens | 1 | 0 | 8350746 | unavailable | unavailable | 8350746 | 8350746 |
| Output tokens | 1 | 0 | 86489 | unavailable | unavailable | 86489 | 86489 |
| Cached input (%) | 1 | 0 | 98.77345 | unavailable | unavailable | 98.77345 | 98.77345 |
| Static cost (USD) | 1 | 0 | 0.09200226 | unavailable | unavailable | 0.09200226 | 0.09200226 |
| Model request count | 1 | 0 | 79 | unavailable | unavailable | 79 | 79 |
| Within-run median request duration (ms) | 1 | 0 | 3360.183 | unavailable | unavailable | 3360.183 | 3360.183 |
| Within-run median request wait (ms) | 1 | 0 | 1318.878 | unavailable | unavailable | 1318.878 | 1318.878 |
| Within-run median request transfer (ms) | 1 | 0 | 2057.189 | unavailable | unavailable | 2057.189 | 2057.189 |
| Within-run median inter-request gap (ms) | 1 | 0 | 215.8768 | unavailable | unavailable | 215.8768 | 215.8768 |
| Largest request duration (ms) | 1 | 0 | 53429.08 | unavailable | unavailable | 53429.08 | 53429.08 |
| Largest inter-request gap (ms) | 1 | 0 | 30171.75 | unavailable | unavailable | 30171.75 | 30171.75 |
| Time after last model response (ms) | 1 | 0 | 5170.164 | unavailable | unavailable | 5170.164 | 5170.164 |

#### ink-grid-box-layout — codex @ codex-cli 0.149.1 — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;ink-grid-box-layout&quot;,&quot;477fda7df7781406d2ba046eb48dd5391e964b72&quot;,&quot;sha256:73daa7eb11dec0d43e523434d28a66ee9d3ac063fda33d9e26183d867739dbb1&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 867871.5 | unavailable | unavailable | 867871.5 | 867871.5 |
| Model (ms) | 1 | 0 | 538266.8 | unavailable | unavailable | 538266.8 | 538266.8 |
| Non-model (ms) | 1 | 0 | 322879.6 | unavailable | unavailable | 322879.6 | 322879.6 |
| Startup (ms) | 1 | 0 | 6725.134 | unavailable | unavailable | 6725.134 | 6725.134 |
| First byte (ms) | 1 | 0 | 1295.026 | unavailable | unavailable | 1295.026 | 1295.026 |
| API turns | 1 | 0 | 82 | unavailable | unavailable | 82 | 82 |
| Input tokens | 1 | 0 | 8838931 | unavailable | unavailable | 8838931 | 8838931 |
| Output tokens | 1 | 0 | 82642 | unavailable | unavailable | 82642 | 82642 |
| Cached input (%) | 1 | 0 | 99.02374 | unavailable | unavailable | 99.02374 | 99.02374 |
| Static cost (USD) | 1 | 0 | 0.08878677 | unavailable | unavailable | 0.08878677 | 0.08878677 |
| Model request count | 1 | 0 | 82 | unavailable | unavailable | 82 | 82 |
| Within-run median request duration (ms) | 1 | 0 | 3438.75 | unavailable | unavailable | 3438.75 | 3438.75 |
| Within-run median request wait (ms) | 1 | 0 | 1295.026 | unavailable | unavailable | 1295.026 | 1295.026 |
| Within-run median request transfer (ms) | 1 | 0 | 2269.328 | unavailable | unavailable | 2269.328 | 2269.328 |
| Within-run median inter-request gap (ms) | 1 | 0 | 69.70515 | unavailable | unavailable | 69.70515 | 69.70515 |
| Largest request duration (ms) | 1 | 0 | 79350.56 | unavailable | unavailable | 79350.56 | 79350.56 |
| Largest inter-request gap (ms) | 1 | 0 | 30180.54 | unavailable | unavailable | 30180.54 | 30180.54 |
| Time after last model response (ms) | 1 | 0 | 5159.16 | unavailable | unavailable | 5159.16 | 5159.16 |

#### psd-tools-blend-range-api — codex @ codex-cli 0.149.1 — Pass (completed)

Selected attempts: 2. Task identity: \[&quot;psd-tools-blend-range-api&quot;,&quot;01595992c5f4d4695251fdf58b3edb5302d3ba46&quot;,&quot;sha256:fbfcc5b7e68a2d8fd97688c69808049d582113368f388929d7d46ac44a592cd9&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 420909.2 | 413164.8 | 428653.5 | 405420.5 | 436397.8 |
| Model (ms) | 2 | 0 | 374331.8 | 368220.2 | 380443.4 | 362108.5 | 386555 |
| Non-model (ms) | 2 | 0 | 45955.28 | 44327.14 | 47583.42 | 42699 | 49211.56 |
| Startup (ms) | 2 | 0 | 622.1111 | 617.5353 | 626.6869 | 612.9595 | 631.2627 |
| First byte (ms) | 2 | 0 | 1330.198 | 1327.045 | 1333.351 | 1323.893 | 1336.504 |
| API turns | 2 | 0 | 62 | 61 | 63 | 60 | 64 |
| Input tokens | 2 | 0 | 6989766 | 6772180 | 7207351 | 6554594 | 7424937 |
| Output tokens | 2 | 0 | 74137.5 | 73467.75 | 74807.25 | 72798 | 75477 |
| Cached input (%) | 2 | 0 | 98.54147 | 98.54038 | 98.54256 | 98.53929 | 98.54365 |
| Static cost (USD) | 2 | 0 | 0.08043955 | 0.07971093 | 0.08116817 | 0.07898231 | 0.08189679 |
| Model request count | 2 | 0 | 62 | 61 | 63 | 60 | 64 |
| Within-run median request duration (ms) | 2 | 0 | 3773.004 | 3695.986 | 3850.022 | 3618.968 | 3927.039 |
| Within-run median request wait (ms) | 2 | 0 | 1330.198 | 1327.045 | 1333.351 | 1323.893 | 1336.504 |
| Within-run median request transfer (ms) | 2 | 0 | 2412.318 | 2332.133 | 2492.504 | 2251.947 | 2572.689 |
| Within-run median inter-request gap (ms) | 2 | 0 | 57.49875 | 57.43433 | 57.56318 | 57.36991 | 57.6276 |
| Largest request duration (ms) | 2 | 0 | 28363.45 | 25749.72 | 30977.18 | 23135.99 | 33590.91 |
| Largest inter-request gap (ms) | 2 | 0 | 11081.53 | 10203.11 | 11959.96 | 9324.68 | 12838.39 |
| Time after last model response (ms) | 2 | 0 | 5144.254 | 5143.373 | 5145.136 | 5142.491 | 5146.017 |

#### superjson-error-stack-serialization — codex @ codex-cli 0.149.1 — Pass (completed)

Selected attempts: 2. Task identity: \[&quot;superjson-error-stack-serialization&quot;,&quot;f143004734ea2dd4090e45013a07f091f5bbaee7&quot;,&quot;sha256:dcc10590630fcc927468099eb5118e4bc7170a1f12e01ca5c9404011de072444&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 415130.9 | 381983 | 448278.7 | 348835.2 | 481426.6 |
| Model (ms) | 2 | 0 | 398390.4 | 365415 | 431365.7 | 332439.7 | 464341.1 |
| Non-model (ms) | 2 | 0 | 14980.02 | 14809.27 | 15150.77 | 14638.52 | 15321.51 |
| Startup (ms) | 2 | 0 | 1760.496 | 1758.744 | 1762.248 | 1756.992 | 1764 |
| First byte (ms) | 2 | 0 | 1228.931 | 1199.182 | 1258.681 | 1169.432 | 1288.431 |
| API turns | 2 | 0 | 50 | 49.5 | 50.5 | 49 | 51 |
| Input tokens | 2 | 0 | 3682024 | 3658567 | 3705481 | 3635110 | 3728938 |
| Output tokens | 2 | 0 | 70225.5 | 68146.25 | 72304.75 | 66067 | 74384 |
| Cached input (%) | 2 | 0 | 98.51793 | 98.51546 | 98.52039 | 98.513 | 98.52285 |
| Static cost (USD) | 2 | 0 | 0.06120287 | 0.06006347 | 0.06234227 | 0.05892407 | 0.06348167 |
| Model request count | 2 | 0 | 50 | 49.5 | 50.5 | 49 | 51 |
| Within-run median request duration (ms) | 2 | 0 | 3473.519 | 3408.045 | 3538.993 | 3342.571 | 3604.467 |
| Within-run median request wait (ms) | 2 | 0 | 1228.931 | 1199.182 | 1258.681 | 1169.432 | 1288.431 |
| Within-run median request transfer (ms) | 2 | 0 | 2220.332 | 2206.435 | 2234.228 | 2192.539 | 2248.125 |
| Within-run median inter-request gap (ms) | 2 | 0 | 54.60662 | 53.86214 | 55.35111 | 53.11765 | 56.09559 |
| Largest request duration (ms) | 2 | 0 | 63142.6 | 55702.81 | 70582.38 | 48263.03 | 78022.16 |
| Largest inter-request gap (ms) | 2 | 0 | 1308.199 | 1216.678 | 1399.72 | 1125.156 | 1491.242 |
| Time after last model response (ms) | 2 | 0 | 5154.914 | 5151.584 | 5158.244 | 5148.254 | 5161.574 |

#### textual-richlog-follow-state — codex @ codex-cli 0.149.1 — Pass (completed)

Selected attempts: 2. Task identity: \[&quot;textual-richlog-follow-state&quot;,&quot;a12215b791587a6d94227bd30a0e9291de932106&quot;,&quot;sha256:73fd3d800de9d5dae47edd9b5269e40966664b72d49d8f598964b8b91fdd0b92&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 771727.9 | 688563.7 | 854892.1 | 605399.5 | 938056.3 |
| Model (ms) | 2 | 0 | 507098.4 | 463373.8 | 550822.9 | 419649.2 | 594547.5 |
| Non-model (ms) | 2 | 0 | 263983.7 | 224535.2 | 303432.3 | 185086.6 | 342880.9 |
| Startup (ms) | 2 | 0 | 645.8202 | 636.8684 | 654.772 | 627.9166 | 663.7238 |
| First byte (ms) | 2 | 0 | 1366.861 | 1366.303 | 1367.42 | 1365.744 | 1367.978 |
| API turns | 2 | 0 | 83.5 | 77.75 | 89.25 | 72 | 95 |
| Input tokens | 2 | 0 | 9764633 | 8889508 | 10639760 | 8014382 | 11514880 |
| Output tokens | 2 | 0 | 86041.5 | 81420.75 | 90662.25 | 76800 | 95283 |
| Cached input (%) | 2 | 0 | 98.93105 | 98.86791 | 98.99419 | 98.80477 | 99.05732 |
| Static cost (USD) | 2 | 0 | 0.09593764 | 0.09007096 | 0.1018043 | 0.08420428 | 0.107671 |
| Model request count | 2 | 0 | 83.5 | 77.75 | 89.25 | 72 | 95 |
| Within-run median request duration (ms) | 2 | 0 | 3877.431 | 3825.623 | 3929.238 | 3773.816 | 3981.046 |
| Within-run median request wait (ms) | 2 | 0 | 1366.861 | 1366.303 | 1367.42 | 1365.744 | 1367.978 |
| Within-run median request transfer (ms) | 2 | 0 | 2517.62 | 2447.059 | 2588.181 | 2376.499 | 2658.741 |
| Within-run median inter-request gap (ms) | 2 | 0 | 58.85193 | 58.42963 | 59.27423 | 58.00733 | 59.69653 |
| Largest request duration (ms) | 2 | 0 | 43875.26 | 41853.34 | 45897.19 | 39831.41 | 47919.12 |
| Largest inter-request gap (ms) | 2 | 0 | 30181.53 | 30181.42 | 30181.64 | 30181.31 | 30181.75 |
| Time after last model response (ms) | 2 | 0 | 5134.709 | 5131.592 | 5137.825 | 5128.476 | 5140.941 |

#### tomlkit-toml-table-converters — codex @ codex-cli 0.149.1 — Pass (completed)

Selected attempts: 2. Task identity: \[&quot;tomlkit-toml-table-converters&quot;,&quot;962de91aaf103135f400e5108a798a59a10dc17e&quot;,&quot;sha256:68dd891458463c9f930dcbbd59b4442065c145d66ce3b5813af82ca5ec8f4966&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 612632.6 | 593918.4 | 631346.7 | 575204.3 | 650060.9 |
| Model (ms) | 2 | 0 | 593429.1 | 574623.8 | 612234.5 | 555818.5 | 631039.8 |
| Non-model (ms) | 2 | 0 | 18149.54 | 18056.36 | 18242.73 | 17963.17 | 18335.91 |
| Startup (ms) | 2 | 0 | 1053.906 | 1051.884 | 1055.929 | 1049.861 | 1057.951 |
| First byte (ms) | 2 | 0 | 1356.388 | 1338.921 | 1373.856 | 1321.454 | 1391.323 |
| API turns | 2 | 0 | 68 | 63.5 | 72.5 | 59 | 77 |
| Input tokens | 2 | 0 | 7875966 | 7131599 | 8620333 | 6387232 | 9364700 |
| Output tokens | 2 | 0 | 96997.5 | 94439.75 | 99555.25 | 91882 | 102113 |
| Cached input (%) | 2 | 0 | 99.0028 | 98.95506 | 99.05054 | 98.90732 | 99.09827 |
| Static cost (USD) | 2 | 0 | 0.09316274 | 0.08885653 | 0.09746896 | 0.08455032 | 0.1017752 |
| Model request count | 2 | 0 | 68 | 63.5 | 72.5 | 59 | 77 |
| Within-run median request duration (ms) | 2 | 0 | 4910.902 | 4787.226 | 5034.579 | 4663.549 | 5158.255 |
| Within-run median request wait (ms) | 2 | 0 | 1356.388 | 1338.921 | 1373.856 | 1321.454 | 1391.323 |
| Within-run median request transfer (ms) | 2 | 0 | 3318.529 | 3176.984 | 3460.075 | 3035.438 | 3601.621 |
| Within-run median inter-request gap (ms) | 2 | 0 | 81.43082 | 81.32774 | 81.53389 | 81.22467 | 81.63697 |
| Largest request duration (ms) | 2 | 0 | 65572.93 | 59906.11 | 71239.75 | 54239.3 | 76906.56 |
| Largest inter-request gap (ms) | 2 | 0 | 1904.461 | 1626.624 | 2182.298 | 1348.787 | 2460.135 |
| Time after last model response (ms) | 2 | 0 | 5156.056 | 5153.346 | 5158.767 | 5150.635 | 5161.477 |

#### true-myth-iterable-collection-combinators — codex @ codex-cli 0.149.1 — Pass (completed)

Selected attempts: 2. Task identity: \[&quot;true-myth-iterable-collection-combinators&quot;,&quot;5945ad1b96e228ff716275d8a273282101152508&quot;,&quot;sha256:0ecebbb45e561b37ee5d7bcbe80588427f4890fb80fffbbb73ca6b94c7cb8855&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 365498.4 | 308110.7 | 422886 | 250723.1 | 480273.7 |
| Model (ms) | 2 | 0 | 294896.3 | 258388.9 | 331403.7 | 221881.5 | 367911.1 |
| Non-model (ms) | 2 | 0 | 69940.36 | 49052.87 | 90827.86 | 28165.37 | 111715.4 |
| Startup (ms) | 2 | 0 | 661.7406 | 654.4772 | 669.0039 | 647.2139 | 676.2672 |
| First byte (ms) | 2 | 0 | 1254.454 | 1213.399 | 1295.51 | 1172.343 | 1336.566 |
| API turns | 2 | 0 | 49 | 39.5 | 58.5 | 30 | 68 |
| Input tokens | 2 | 0 | 4758895 | 3585219 | 5932572 | 2411542 | 7106248 |
| Output tokens | 2 | 0 | 57334.5 | 50517.75 | 64151.25 | 43701 | 70968 |
| Cached input (%) | 2 | 0 | 97.70341 | 97.2536 | 98.15322 | 96.80379 | 98.60303 |
| Static cost (USD) | 2 | 0 | 0.06163911 | 0.0532124 | 0.07006582 | 0.04478569 | 0.07849253 |
| Model request count | 2 | 0 | 49 | 39.5 | 58.5 | 30 | 68 |
| Within-run median request duration (ms) | 2 | 0 | 4185.758 | 3847.327 | 4524.19 | 3508.896 | 4862.621 |
| Within-run median request wait (ms) | 2 | 0 | 1254.454 | 1213.399 | 1295.51 | 1172.343 | 1336.566 |
| Within-run median request transfer (ms) | 2 | 0 | 2994.129 | 2589.188 | 3399.071 | 2184.246 | 3804.013 |
| Within-run median inter-request gap (ms) | 2 | 0 | 55.99988 | 55.24104 | 56.75872 | 54.4822 | 57.51756 |
| Largest request duration (ms) | 2 | 0 | 25043.79 | 22413.87 | 27673.7 | 19783.96 | 30303.61 |
| Largest inter-request gap (ms) | 2 | 0 | 17628.29 | 11428.83 | 23827.75 | 5229.364 | 30027.21 |
| Time after last model response (ms) | 2 | 0 | 5138.055 | 5133.623 | 5142.488 | 5129.19 | 5146.921 |

#### cattrs-partial-structuring-recovery — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Pass (completed)

Selected attempts: 1. Task identity: \[&quot;cattrs-partial-structuring-recovery&quot;,&quot;91df27b2a20f26c35777a92f4555438b62c06345&quot;,&quot;sha256:b985f2bd17e9e80bee0fa9b7c0747b2ded92d54d070b32ebfe102e8829a44076&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 805580.8 | unavailable | unavailable | 805580.8 | 805580.8 |
| Model (ms) | 1 | 0 | 539909.7 | unavailable | unavailable | 539909.7 | 539909.7 |
| Non-model (ms) | 1 | 0 | 261508.7 | unavailable | unavailable | 261508.7 | 261508.7 |
| Startup (ms) | 1 | 0 | 4162.48 | unavailable | unavailable | 4162.48 | 4162.48 |
| First byte (ms) | 1 | 0 | 1274.024 | unavailable | unavailable | 1274.024 | 1274.024 |
| API turns | 1 | 0 | 110 | unavailable | unavailable | 110 | 110 |
| Input tokens | 1 | 0 | 12504690 | unavailable | unavailable | 12504690 | 12504690 |
| Output tokens | 1 | 0 | 90494 | unavailable | unavailable | 90494 | 90494 |
| Cached input (%) | 1 | 0 | 99.20374 | unavailable | unavailable | 99.20374 | 99.20374 |
| Static cost (USD) | 1 | 0 | 0.1064473 | unavailable | unavailable | 0.1064473 | 0.1064473 |
| Model request count | 1 | 0 | 110 | unavailable | unavailable | 110 | 110 |
| Within-run median request duration (ms) | 1 | 0 | 2966.645 | unavailable | unavailable | 2966.645 | 2966.645 |
| Within-run median request wait (ms) | 1 | 0 | 1274.024 | unavailable | unavailable | 1274.024 | 1274.024 |
| Within-run median request transfer (ms) | 1 | 0 | 1652.845 | unavailable | unavailable | 1652.845 | 1652.845 |
| Within-run median inter-request gap (ms) | 1 | 0 | 166.4325 | unavailable | unavailable | 166.4325 | 166.4325 |
| Largest request duration (ms) | 1 | 0 | 38128.3 | unavailable | unavailable | 38128.3 | 38128.3 |
| Largest inter-request gap (ms) | 1 | 0 | 59272.15 | unavailable | unavailable | 59272.15 | 59272.15 |
| Time after last model response (ms) | 1 | 0 | 261.4834 | unavailable | unavailable | 261.4834 | 261.4834 |

#### cattrs-partial-structuring-recovery — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;cattrs-partial-structuring-recovery&quot;,&quot;91df27b2a20f26c35777a92f4555438b62c06345&quot;,&quot;sha256:b985f2bd17e9e80bee0fa9b7c0747b2ded92d54d070b32ebfe102e8829a44076&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 561912.6 | unavailable | unavailable | 561912.6 | 561912.6 |
| Model (ms) | 1 | 0 | 396500.8 | unavailable | unavailable | 396500.8 | 396500.8 |
| Non-model (ms) | 1 | 0 | 161228.5 | unavailable | unavailable | 161228.5 | 161228.5 |
| Startup (ms) | 1 | 0 | 4183.267 | unavailable | unavailable | 4183.267 | 4183.267 |
| First byte (ms) | 1 | 0 | 1314.044 | unavailable | unavailable | 1314.044 | 1314.044 |
| API turns | 1 | 0 | 65 | unavailable | unavailable | 65 | 65 |
| Input tokens | 1 | 0 | 6159176 | unavailable | unavailable | 6159176 | 6159176 |
| Output tokens | 1 | 0 | 66537 | unavailable | unavailable | 66537 | 66537 |
| Cached input (%) | 1 | 0 | 98.64384 | unavailable | unavailable | 98.64384 | 98.64384 |
| Static cost (USD) | 1 | 0 | 0.07067834 | unavailable | unavailable | 0.07067834 | 0.07067834 |
| Model request count | 1 | 0 | 65 | unavailable | unavailable | 65 | 65 |
| Within-run median request duration (ms) | 1 | 0 | 3631.501 | unavailable | unavailable | 3631.501 | 3631.501 |
| Within-run median request wait (ms) | 1 | 0 | 1314.044 | unavailable | unavailable | 1314.044 | 1314.044 |
| Within-run median request transfer (ms) | 1 | 0 | 2415.468 | unavailable | unavailable | 2415.468 | 2415.468 |
| Within-run median inter-request gap (ms) | 1 | 0 | 151.5668 | unavailable | unavailable | 151.5668 | 151.5668 |
| Largest request duration (ms) | 1 | 0 | 60720.91 | unavailable | unavailable | 60720.91 | 60720.91 |
| Largest inter-request gap (ms) | 1 | 0 | 54063.71 | unavailable | unavailable | 54063.71 | 54063.71 |
| Time after last model response (ms) | 1 | 0 | 507.6009 | unavailable | unavailable | 507.6009 | 507.6009 |

#### happy-dom-deterministic-intersectionobserver — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Pass (completed)

Selected attempts: 1. Task identity: \[&quot;happy-dom-deterministic-intersectionobserver&quot;,&quot;32b2a8e60eab482c023af377160bf294d6da0318&quot;,&quot;sha256:a4df294272f2165ce894306ab1eec5284fe426ddaa66cf08bb3c4755a9f8faa2&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 565479.2 | unavailable | unavailable | 565479.2 | 565479.2 |
| Model (ms) | 1 | 0 | 464606.3 | unavailable | unavailable | 464606.3 | 464606.3 |
| Non-model (ms) | 1 | 0 | 96222.83 | unavailable | unavailable | 96222.83 | 96222.83 |
| Startup (ms) | 1 | 0 | 4650.093 | unavailable | unavailable | 4650.093 | 4650.093 |
| First byte (ms) | 1 | 0 | 1233.614 | unavailable | unavailable | 1233.614 | 1233.614 |
| API turns | 1 | 0 | 96 | unavailable | unavailable | 96 | 96 |
| Input tokens | 1 | 0 | 8434472 | unavailable | unavailable | 8434472 | 8434472 |
| Output tokens | 1 | 0 | 77756 | unavailable | unavailable | 77756 | 77756 |
| Cached input (%) | 1 | 0 | 98.94481 | unavailable | unavailable | 98.94481 | 98.94481 |
| Static cost (USD) | 1 | 0 | 0.08504002 | unavailable | unavailable | 0.08504002 | 0.08504002 |
| Model request count | 1 | 0 | 96 | unavailable | unavailable | 96 | 96 |
| Within-run median request duration (ms) | 1 | 0 | 2475.608 | unavailable | unavailable | 2475.608 | 2475.608 |
| Within-run median request wait (ms) | 1 | 0 | 1233.614 | unavailable | unavailable | 1233.614 | 1233.614 |
| Within-run median request transfer (ms) | 1 | 0 | 1144.489 | unavailable | unavailable | 1144.489 | 1144.489 |
| Within-run median inter-request gap (ms) | 1 | 0 | 154.9124 | unavailable | unavailable | 154.9124 | 154.9124 |
| Largest request duration (ms) | 1 | 0 | 28252.62 | unavailable | unavailable | 28252.62 | 28252.62 |
| Largest inter-request gap (ms) | 1 | 0 | 39481.85 | unavailable | unavailable | 39481.85 | 39481.85 |
| Time after last model response (ms) | 1 | 0 | 295.7324 | unavailable | unavailable | 295.7324 | 295.7324 |

#### happy-dom-deterministic-intersectionobserver — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;happy-dom-deterministic-intersectionobserver&quot;,&quot;32b2a8e60eab482c023af377160bf294d6da0318&quot;,&quot;sha256:a4df294272f2165ce894306ab1eec5284fe426ddaa66cf08bb3c4755a9f8faa2&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 732123.4 | unavailable | unavailable | 732123.4 | 732123.4 |
| Model (ms) | 1 | 0 | 439129.8 | unavailable | unavailable | 439129.8 | 439129.8 |
| Non-model (ms) | 1 | 0 | 285429.4 | unavailable | unavailable | 285429.4 | 285429.4 |
| Startup (ms) | 1 | 0 | 7564.183 | unavailable | unavailable | 7564.183 | 7564.183 |
| First byte (ms) | 1 | 0 | 1212.577 | unavailable | unavailable | 1212.577 | 1212.577 |
| API turns | 1 | 0 | 70 | unavailable | unavailable | 70 | 70 |
| Input tokens | 1 | 0 | 5166491 | unavailable | unavailable | 5166491 | 5166491 |
| Output tokens | 1 | 0 | 72141 | unavailable | unavailable | 72141 | 72141 |
| Cached input (%) | 1 | 0 | 98.6864 | unavailable | unavailable | 98.6864 | 98.6864 |
| Static cost (USD) | 1 | 0 | 0.06876052 | unavailable | unavailable | 0.06876052 | 0.06876052 |
| Model request count | 1 | 0 | 70 | unavailable | unavailable | 70 | 70 |
| Within-run median request duration (ms) | 1 | 0 | 2401.238 | unavailable | unavailable | 2401.238 | 2401.238 |
| Within-run median request wait (ms) | 1 | 0 | 1212.577 | unavailable | unavailable | 1212.577 | 1212.577 |
| Within-run median request transfer (ms) | 1 | 0 | 1233.285 | unavailable | unavailable | 1233.285 | 1233.285 |
| Within-run median inter-request gap (ms) | 1 | 0 | 123.4377 | unavailable | unavailable | 123.4377 | 123.4377 |
| Largest request duration (ms) | 1 | 0 | 26570.65 | unavailable | unavailable | 26570.65 | 26570.65 |
| Largest inter-request gap (ms) | 1 | 0 | 180248.4 | unavailable | unavailable | 180248.4 | 180248.4 |
| Time after last model response (ms) | 1 | 0 | 283.3951 | unavailable | unavailable | 283.3951 | 283.3951 |

#### ink-grid-box-layout — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Pass (completed)

Selected attempts: 1. Task identity: \[&quot;ink-grid-box-layout&quot;,&quot;477fda7df7781406d2ba046eb48dd5391e964b72&quot;,&quot;sha256:73daa7eb11dec0d43e523434d28a66ee9d3ac063fda33d9e26183d867739dbb1&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 1004315 | unavailable | unavailable | 1004315 | 1004315 |
| Model (ms) | 1 | 0 | 539337.6 | unavailable | unavailable | 539337.6 | 539337.6 |
| Non-model (ms) | 1 | 0 | 456299.6 | unavailable | unavailable | 456299.6 | 456299.6 |
| Startup (ms) | 1 | 0 | 8677.857 | unavailable | unavailable | 8677.857 | 8677.857 |
| First byte (ms) | 1 | 0 | 1327.492 | unavailable | unavailable | 1327.492 | 1327.492 |
| API turns | 1 | 0 | 106 | unavailable | unavailable | 106 | 106 |
| Input tokens | 1 | 0 | 12632710 | unavailable | unavailable | 12632710 | 12632710 |
| Output tokens | 1 | 0 | 87944 | unavailable | unavailable | 87944 | 87944 |
| Cached input (%) | 1 | 0 | 99.2086 | unavailable | unavailable | 99.2086 | 99.2086 |
| Static cost (USD) | 1 | 0 | 0.1053609 | unavailable | unavailable | 0.1053609 | 0.1053609 |
| Model request count | 1 | 0 | 106 | unavailable | unavailable | 106 | 106 |
| Within-run median request duration (ms) | 1 | 0 | 2435.691 | unavailable | unavailable | 2435.691 | 2435.691 |
| Within-run median request wait (ms) | 1 | 0 | 1327.492 | unavailable | unavailable | 1327.492 | 1327.492 |
| Within-run median request transfer (ms) | 1 | 0 | 1067.2 | unavailable | unavailable | 1067.2 | 1067.2 |
| Within-run median inter-request gap (ms) | 1 | 0 | 167.45 | unavailable | unavailable | 167.45 | 167.45 |
| Largest request duration (ms) | 1 | 0 | 59454.7 | unavailable | unavailable | 59454.7 | 59454.7 |
| Largest inter-request gap (ms) | 1 | 0 | 94589.2 | unavailable | unavailable | 94589.2 | 94589.2 |
| Time after last model response (ms) | 1 | 0 | 240.8726 | unavailable | unavailable | 240.8726 | 240.8726 |

#### ink-grid-box-layout — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;ink-grid-box-layout&quot;,&quot;477fda7df7781406d2ba046eb48dd5391e964b72&quot;,&quot;sha256:73daa7eb11dec0d43e523434d28a66ee9d3ac063fda33d9e26183d867739dbb1&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 314882.7 | unavailable | unavailable | 314882.7 | 314882.7 |
| Model (ms) | 1 | 0 | 269299.8 | unavailable | unavailable | 269299.8 | 269299.8 |
| Non-model (ms) | 1 | 0 | 41172.29 | unavailable | unavailable | 41172.29 | 41172.29 |
| Startup (ms) | 1 | 0 | 4410.574 | unavailable | unavailable | 4410.574 | 4410.574 |
| First byte (ms) | 1 | 0 | 1196.065 | unavailable | unavailable | 1196.065 | 1196.065 |
| API turns | 1 | 0 | 33 | unavailable | unavailable | 33 | 33 |
| Input tokens | 1 | 0 | 2305332 | unavailable | unavailable | 2305332 | 2305332 |
| Output tokens | 1 | 0 | 43961 | unavailable | unavailable | 43961 | 43961 |
| Cached input (%) | 1 | 0 | 96.97727 | unavailable | unavailable | 96.97727 | 96.97727 |
| Static cost (USD) | 1 | 0 | 0.04353614 | unavailable | unavailable | 0.04353614 | 0.04353614 |
| Model request count | 1 | 0 | 33 | unavailable | unavailable | 33 | 33 |
| Within-run median request duration (ms) | 1 | 0 | 3428.16 | unavailable | unavailable | 3428.16 | 3428.16 |
| Within-run median request wait (ms) | 1 | 0 | 1196.065 | unavailable | unavailable | 1196.065 | 1196.065 |
| Within-run median request transfer (ms) | 1 | 0 | 2328.904 | unavailable | unavailable | 2328.904 | 2328.904 |
| Within-run median inter-request gap (ms) | 1 | 0 | 132.1602 | unavailable | unavailable | 132.1602 | 132.1602 |
| Largest request duration (ms) | 1 | 0 | 43110 | unavailable | unavailable | 43110 | 43110 |
| Largest inter-request gap (ms) | 1 | 0 | 13430.67 | unavailable | unavailable | 13430.67 | 13430.67 |
| Time after last model response (ms) | 1 | 0 | 3598.638 | unavailable | unavailable | 3598.638 | 3598.638 |

#### psd-tools-blend-range-api — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Pass (completed)

Selected attempts: 2. Task identity: \[&quot;psd-tools-blend-range-api&quot;,&quot;01595992c5f4d4695251fdf58b3edb5302d3ba46&quot;,&quot;sha256:fbfcc5b7e68a2d8fd97688c69808049d582113368f388929d7d46ac44a592cd9&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 487382.7 | 467509.2 | 507256.3 | 447635.7 | 527129.8 |
| Model (ms) | 2 | 0 | 396515.3 | 383768.5 | 409262.1 | 371021.7 | 422008.9 |
| Non-model (ms) | 2 | 0 | 86649.84 | 79536.6 | 93763.09 | 72423.36 | 100876.3 |
| Startup (ms) | 2 | 0 | 4217.624 | 4204.128 | 4231.12 | 4190.632 | 4244.616 |
| First byte (ms) | 2 | 0 | 1237.283 | 1219.486 | 1255.079 | 1201.69 | 1272.876 |
| API turns | 2 | 0 | 101.5 | 101.25 | 101.75 | 101 | 102 |
| Input tokens | 2 | 0 | 8957983 | 8580415 | 9335551 | 8202847 | 9713119 |
| Output tokens | 2 | 0 | 63431 | 61986 | 64876 | 60541 | 66321 |
| Cached input (%) | 2 | 0 | 98.96271 | 98.95257 | 98.97285 | 98.94243 | 98.98299 |
| Static cost (USD) | 2 | 0 | 0.0785693 | 0.07612742 | 0.08101118 | 0.07368554 | 0.08345306 |
| Model request count | 2 | 0 | 101.5 | 101.25 | 101.75 | 101 | 102 |
| Within-run median request duration (ms) | 2 | 0 | 2375.677 | 2325.678 | 2425.676 | 2275.678 | 2475.676 |
| Within-run median request wait (ms) | 2 | 0 | 1237.283 | 1219.486 | 1255.079 | 1201.69 | 1272.876 |
| Within-run median request transfer (ms) | 2 | 0 | 1124.929 | 1073.579 | 1176.279 | 1022.229 | 1227.629 |
| Within-run median inter-request gap (ms) | 2 | 0 | 165.3606 | 165.2384 | 165.4828 | 165.1162 | 165.605 |
| Largest request duration (ms) | 2 | 0 | 23661.62 | 21953.19 | 25370.05 | 20244.76 | 27078.48 |
| Largest inter-request gap (ms) | 2 | 0 | 12754.97 | 12602.91 | 12907.04 | 12450.84 | 13059.1 |
| Time after last model response (ms) | 2 | 0 | 249.2194 | 248.617 | 249.8217 | 248.0146 | 250.4241 |

#### superjson-error-stack-serialization — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Verification failure (verify_error)

Selected attempts: 2. Task identity: \[&quot;superjson-error-stack-serialization&quot;,&quot;f143004734ea2dd4090e45013a07f091f5bbaee7&quot;,&quot;sha256:dcc10590630fcc927468099eb5118e4bc7170a1f12e01ca5c9404011de072444&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 305627 | 284232.2 | 327021.9 | 262837.3 | 348416.7 |
| Model (ms) | 2 | 0 | 275383.5 | 253393.8 | 297373.2 | 231404.1 | 319363 |
| Non-model (ms) | 2 | 0 | 25466.41 | 24917.76 | 26015.06 | 24369.12 | 26563.7 |
| Startup (ms) | 2 | 0 | 4777.091 | 4730.856 | 4823.325 | 4684.622 | 4869.559 |
| First byte (ms) | 2 | 0 | 1223.465 | 1209.775 | 1237.154 | 1196.086 | 1250.843 |
| API turns | 2 | 0 | 40.5 | 40.25 | 40.75 | 40 | 41 |
| Input tokens | 2 | 0 | 2592814 | 2542359 | 2643269 | 2491904 | 2693724 |
| Output tokens | 2 | 0 | 49944 | 47736 | 52152 | 45528 | 54360 |
| Cached input (%) | 2 | 0 | 98.26595 | 98.25932 | 98.27259 | 98.25268 | 98.27923 |
| Static cost (USD) | 2 | 0 | 0.04435602 | 0.04272595 | 0.04598609 | 0.04109587 | 0.04761617 |
| Model request count | 2 | 0 | 40.5 | 40.25 | 40.75 | 40 | 41 |
| Within-run median request duration (ms) | 2 | 0 | 2712.151 | 2625.745 | 2798.556 | 2539.339 | 2884.962 |
| Within-run median request wait (ms) | 2 | 0 | 1223.465 | 1209.775 | 1237.154 | 1196.086 | 1250.843 |
| Within-run median request transfer (ms) | 2 | 0 | 1474.7 | 1409.059 | 1540.34 | 1343.418 | 1605.981 |
| Within-run median inter-request gap (ms) | 2 | 0 | 164.1467 | 163.4877 | 164.8058 | 162.8287 | 165.4648 |
| Largest request duration (ms) | 2 | 0 | 96290.27 | 92496.12 | 100084.4 | 88701.98 | 103878.6 |
| Largest inter-request gap (ms) | 2 | 0 | 8240.016 | 8236.879 | 8243.152 | 8233.743 | 8246.288 |
| Time after last model response (ms) | 2 | 0 | 224.4794 | 219.8981 | 229.0608 | 215.3168 | 233.6421 |

#### textual-richlog-follow-state — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Pass (completed)

Selected attempts: 2. Task identity: \[&quot;textual-richlog-follow-state&quot;,&quot;a12215b791587a6d94227bd30a0e9291de932106&quot;,&quot;sha256:73fd3d800de9d5dae47edd9b5269e40966664b72d49d8f598964b8b91fdd0b92&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 1105740 | 1018982 | 1192498 | 932223.9 | 1279256 |
| Model (ms) | 2 | 0 | 814386.7 | 760958.1 | 867815.3 | 707529.6 | 921243.8 |
| Non-model (ms) | 2 | 0 | 286559.1 | 252932 | 320186.2 | 219304.9 | 353813.2 |
| Startup (ms) | 2 | 0 | 4794.136 | 4496.471 | 5091.801 | 4198.806 | 5389.467 |
| First byte (ms) | 2 | 0 | 1318.857 | 1317.474 | 1320.239 | 1316.092 | 1321.621 |
| API turns | 2 | 0 | 186 | 184 | 188 | 182 | 190 |
| Input tokens | 2 | 0 | 23509950 | 22427760 | 24592140 | 21345570 | 25674330 |
| Output tokens | 2 | 0 | 115906.5 | 109612.3 | 122200.8 | 103318 | 128495 |
| Cached input (%) | 2 | 0 | 99.49702 | 99.49298 | 99.50106 | 99.48894 | 99.5051 |
| Static cost (USD) | 2 | 0 | 0.1574307 | 0.1497471 | 0.1651143 | 0.1420634 | 0.1727979 |
| Model request count | 2 | 0 | 186 | 184 | 188 | 182 | 190 |
| Within-run median request duration (ms) | 2 | 0 | 2973.191 | 2809.409 | 3136.973 | 2645.628 | 3300.754 |
| Within-run median request wait (ms) | 2 | 0 | 1318.857 | 1317.474 | 1320.239 | 1316.092 | 1321.621 |
| Within-run median request transfer (ms) | 2 | 0 | 1560.555 | 1435.034 | 1686.077 | 1309.513 | 1811.598 |
| Within-run median inter-request gap (ms) | 2 | 0 | 184.2483 | 182.2135 | 186.2831 | 180.1787 | 188.3179 |
| Largest request duration (ms) | 2 | 0 | 40720.18 | 34396.03 | 47044.33 | 28071.88 | 53368.49 |
| Largest inter-request gap (ms) | 2 | 0 | 133434.9 | 126766.6 | 140103.2 | 120098.3 | 146771.5 |
| Time after last model response (ms) | 2 | 0 | 263.1321 | 258.4377 | 267.8266 | 253.7433 | 272.521 |

#### tomlkit-toml-table-converters — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Verification failure (verify_error)

Selected attempts: 2. Task identity: \[&quot;tomlkit-toml-table-converters&quot;,&quot;962de91aaf103135f400e5108a798a59a10dc17e&quot;,&quot;sha256:68dd891458463c9f930dcbbd59b4442065c145d66ce3b5813af82ca5ec8f4966&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 1139940 | 981227.5 | 1298653 | 822514.9 | 1457365 |
| Model (ms) | 2 | 0 | 1000488 | 887071 | 1113905 | 773653.8 | 1227322 |
| Non-model (ms) | 2 | 0 | 135197.6 | 89906.56 | 180488.6 | 44615.54 | 225779.6 |
| Startup (ms) | 2 | 0 | 4254.4 | 4249.966 | 4258.835 | 4245.532 | 4263.269 |
| First byte (ms) | 2 | 0 | 1411.879 | 1402.188 | 1421.57 | 1392.497 | 1431.261 |
| API turns | 2 | 0 | 155.5 | 135.75 | 175.25 | 116 | 195 |
| Input tokens | 2 | 0 | 30328770 | 23435320 | 37222230 | 16541860 | 44115680 |
| Output tokens | 2 | 0 | 153487.5 | 134147.3 | 172827.8 | 114807 | 192168 |
| Cached input (%) | 2 | 0 | 99.44213 | 99.38163 | 99.50262 | 99.32114 | 99.56311 |
| Static cost (USD) | 2 | 0 | 0.2054986 | 0.1702579 | 0.2407392 | 0.1350173 | 0.2759799 |
| Model request count | 2 | 0 | 155.5 | 135.75 | 175.25 | 116 | 195 |
| Within-run median request duration (ms) | 2 | 0 | 3563.506 | 3527.598 | 3599.415 | 3491.689 | 3635.323 |
| Within-run median request wait (ms) | 2 | 0 | 1411.879 | 1402.188 | 1421.57 | 1392.497 | 1431.261 |
| Within-run median request transfer (ms) | 2 | 0 | 2107.779 | 2045.812 | 2169.745 | 1983.846 | 2231.711 |
| Within-run median inter-request gap (ms) | 2 | 0 | 186.6204 | 178.473 | 194.7679 | 170.3255 | 202.9154 |
| Largest request duration (ms) | 2 | 0 | 100053.2 | 75239.9 | 124866.4 | 50426.63 | 149679.7 |
| Largest inter-request gap (ms) | 2 | 0 | 24457.11 | 16329.61 | 32584.61 | 8202.11 | 40712.11 |
| Time after last model response (ms) | 2 | 0 | 231.3787 | 224.9716 | 237.7859 | 218.5644 | 244.1931 |

#### true-myth-iterable-collection-combinators — hermes @ Hermes Agent v0.20.5 (2026.8.19) — Pass (completed)

Selected attempts: 2. Task identity: \[&quot;true-myth-iterable-collection-combinators&quot;,&quot;5945ad1b96e228ff716275d8a273282101152508&quot;,&quot;sha256:0ecebbb45e561b37ee5d7bcbe80588427f4890fb80fffbbb73ca6b94c7cb8855&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 510737.4 | 498283.6 | 523191.1 | 485829.9 | 535644.9 |
| Model (ms) | 2 | 0 | 425640.6 | 416832.7 | 434448.5 | 408024.8 | 443256.4 |
| Non-model (ms) | 2 | 0 | 80892.86 | 77326.12 | 84459.6 | 73759.38 | 88026.35 |
| Startup (ms) | 2 | 0 | 4203.916 | 4124.797 | 4283.034 | 4045.678 | 4362.153 |
| First byte (ms) | 2 | 0 | 1362.316 | 1349.405 | 1375.226 | 1336.495 | 1388.136 |
| API turns | 2 | 0 | 76 | 73.5 | 78.5 | 71 | 81 |
| Input tokens | 2 | 0 | 10573610 | 9927344 | 11219880 | 9281078 | 11866140 |
| Output tokens | 2 | 0 | 75101.5 | 72088.25 | 78114.75 | 69075 | 81128 |
| Cached input (%) | 2 | 0 | 98.70898 | 98.686 | 98.73196 | 98.66302 | 98.75494 |
| Static cost (USD) | 2 | 0 | 0.09676101 | 0.09214494 | 0.1013771 | 0.08752888 | 0.1059932 |
| Model request count | 2 | 0 | 76 | 73.5 | 78.5 | 71 | 81 |
| Within-run median request duration (ms) | 2 | 0 | 3327.132 | 3050.58 | 3603.685 | 2774.027 | 3880.238 |
| Within-run median request wait (ms) | 2 | 0 | 1362.316 | 1349.405 | 1375.226 | 1336.495 | 1388.136 |
| Within-run median request transfer (ms) | 2 | 0 | 1916.425 | 1629.268 | 2203.582 | 1342.111 | 2490.739 |
| Within-run median inter-request gap (ms) | 2 | 0 | 174.7069 | 168.5113 | 180.9024 | 162.3157 | 187.098 |
| Largest request duration (ms) | 2 | 0 | 37856.72 | 35166.28 | 40547.16 | 32475.84 | 43237.6 |
| Largest inter-request gap (ms) | 2 | 0 | 8271.073 | 8258.694 | 8283.452 | 8246.315 | 8295.831 |
| Time after last model response (ms) | 2 | 0 | 236.6965 | 235.2791 | 238.1138 | 233.8618 | 239.5312 |

#### cattrs-partial-structuring-recovery — pi @ 0.73.1 — Pass (completed)

Selected attempts: 2. Task identity: \[&quot;cattrs-partial-structuring-recovery&quot;,&quot;91df27b2a20f26c35777a92f4555438b62c06345&quot;,&quot;sha256:b985f2bd17e9e80bee0fa9b7c0747b2ded92d54d070b32ebfe102e8829a44076&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 407484.2 | 380769.3 | 434199.2 | 354054.3 | 460914.1 |
| Model (ms) | 2 | 0 | 258703.9 | 239004 | 278403.8 | 219304.1 | 298103.7 |
| Non-model (ms) | 2 | 0 | 148011.5 | 140999.3 | 155023.7 | 133987.1 | 162036 |
| Startup (ms) | 2 | 0 | 768.7774 | 765.9402 | 771.6147 | 763.1029 | 774.452 |
| First byte (ms) | 2 | 0 | 1178.412 | 1172.393 | 1184.431 | 1166.373 | 1190.451 |
| API turns | 2 | 0 | 48 | 42.5 | 53.5 | 37 | 59 |
| Input tokens | 2 | 0 | 2912162 | 2519956 | 3304369 | 2127749 | 3696575 |
| Output tokens | 2 | 0 | 46925 | 43698 | 50152 | 40471 | 53379 |
| Cached input (%) | 2 | 0 | 98.0813 | 97.83437 | 98.32822 | 97.58745 | 98.57514 |
| Static cost (USD) | 2 | 0 | 0.04453578 | 0.04137379 | 0.04769777 | 0.0382118 | 0.05085976 |
| Model request count | 2 | 0 | 48 | 42.5 | 53.5 | 37 | 59 |
| Within-run median request duration (ms) | 2 | 0 | 2680.69 | 2492.581 | 2868.799 | 2304.472 | 3056.908 |
| Within-run median request wait (ms) | 2 | 0 | 1178.412 | 1172.393 | 1184.431 | 1166.373 | 1190.451 |
| Within-run median request transfer (ms) | 2 | 0 | 1479.53 | 1267.768 | 1691.291 | 1056.006 | 1903.053 |
| Within-run median inter-request gap (ms) | 2 | 0 | 34.22659 | 32.04207 | 36.41112 | 29.85755 | 38.59564 |
| Largest request duration (ms) | 2 | 0 | 34381.41 | 30538.22 | 38224.59 | 26695.04 | 42067.77 |
| Largest inter-request gap (ms) | 2 | 0 | 60825.57 | 58567.88 | 63083.26 | 56310.19 | 65340.95 |
| Time after last model response (ms) | 2 | 0 | 199.6017 | 173.063 | 226.1405 | 146.5243 | 252.6792 |

#### happy-dom-deterministic-intersectionobserver — pi @ 0.73.1 — Pass (completed)

Selected attempts: 1. Task identity: \[&quot;happy-dom-deterministic-intersectionobserver&quot;,&quot;32b2a8e60eab482c023af377160bf294d6da0318&quot;,&quot;sha256:a4df294272f2165ce894306ab1eec5284fe426ddaa66cf08bb3c4755a9f8faa2&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 396969.5 | unavailable | unavailable | 396969.5 | 396969.5 |
| Model (ms) | 1 | 0 | 304582 | unavailable | unavailable | 304582 | 304582 |
| Non-model (ms) | 1 | 0 | 91039.88 | unavailable | unavailable | 91039.88 | 91039.88 |
| Startup (ms) | 1 | 0 | 1347.596 | unavailable | unavailable | 1347.596 | 1347.596 |
| First byte (ms) | 1 | 0 | 1146.271 | unavailable | unavailable | 1146.271 | 1146.271 |
| API turns | 1 | 0 | 53 | unavailable | unavailable | 53 | 53 |
| Input tokens | 1 | 0 | 3138797 | unavailable | unavailable | 3138797 | 3138797 |
| Output tokens | 1 | 0 | 53522 | unavailable | unavailable | 53522 | 53522 |
| Cached input (%) | 1 | 0 | 97.99423 | unavailable | unavailable | 97.99423 | 97.99423 |
| Static cost (USD) | 1 | 0 | 0.05078427 | unavailable | unavailable | 0.05078427 | 0.05078427 |
| Model request count | 1 | 0 | 53 | unavailable | unavailable | 53 | 53 |
| Within-run median request duration (ms) | 1 | 0 | 2433.409 | unavailable | unavailable | 2433.409 | 2433.409 |
| Within-run median request wait (ms) | 1 | 0 | 1146.271 | unavailable | unavailable | 1146.271 | 1146.271 |
| Within-run median request transfer (ms) | 1 | 0 | 1228.076 | unavailable | unavailable | 1228.076 | 1228.076 |
| Within-run median inter-request gap (ms) | 1 | 0 | 30.47215 | unavailable | unavailable | 30.47215 | 30.47215 |
| Largest request duration (ms) | 1 | 0 | 56907.38 | unavailable | unavailable | 56907.38 | 56907.38 |
| Largest inter-request gap (ms) | 1 | 0 | 39530.56 | unavailable | unavailable | 39530.56 | 39530.56 |
| Time after last model response (ms) | 1 | 0 | 231.3146 | unavailable | unavailable | 231.3146 | 231.3146 |

#### happy-dom-deterministic-intersectionobserver — pi @ 0.73.1 — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;happy-dom-deterministic-intersectionobserver&quot;,&quot;32b2a8e60eab482c023af377160bf294d6da0318&quot;,&quot;sha256:a4df294272f2165ce894306ab1eec5284fe426ddaa66cf08bb3c4755a9f8faa2&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 517928.6 | unavailable | unavailable | 517928.6 | 517928.6 |
| Model (ms) | 1 | 0 | 354351.4 | unavailable | unavailable | 354351.4 | 354351.4 |
| Non-model (ms) | 1 | 0 | 162248.1 | unavailable | unavailable | 162248.1 | 162248.1 |
| Startup (ms) | 1 | 0 | 1329.065 | unavailable | unavailable | 1329.065 | 1329.065 |
| First byte (ms) | 1 | 0 | 1233.448 | unavailable | unavailable | 1233.448 | 1233.448 |
| API turns | 1 | 0 | 62 | unavailable | unavailable | 62 | 62 |
| Input tokens | 1 | 0 | 5138624 | unavailable | unavailable | 5138624 | 5138624 |
| Output tokens | 1 | 0 | 63729 | unavailable | unavailable | 63729 | 63729 |
| Cached input (%) | 1 | 0 | 98.23517 | unavailable | unavailable | 98.23517 | 98.23517 |
| Static cost (USD) | 1 | 0 | 0.06698441 | unavailable | unavailable | 0.06698441 | 0.06698441 |
| Model request count | 1 | 0 | 62 | unavailable | unavailable | 62 | 62 |
| Within-run median request duration (ms) | 1 | 0 | 2835.972 | unavailable | unavailable | 2835.972 | 2835.972 |
| Within-run median request wait (ms) | 1 | 0 | 1233.448 | unavailable | unavailable | 1233.448 | 1233.448 |
| Within-run median request transfer (ms) | 1 | 0 | 1271.589 | unavailable | unavailable | 1271.589 | 1271.589 |
| Within-run median inter-request gap (ms) | 1 | 0 | 41.5106 | unavailable | unavailable | 41.5106 | 41.5106 |
| Largest request duration (ms) | 1 | 0 | 32608.96 | unavailable | unavailable | 32608.96 | 32608.96 |
| Largest inter-request gap (ms) | 1 | 0 | 39172.94 | unavailable | unavailable | 39172.94 | 39172.94 |
| Time after last model response (ms) | 1 | 0 | 221.3579 | unavailable | unavailable | 221.3579 | 221.3579 |

#### ink-grid-box-layout — pi @ 0.73.1 — Pass (completed)

Selected attempts: 2. Task identity: \[&quot;ink-grid-box-layout&quot;,&quot;477fda7df7781406d2ba046eb48dd5391e964b72&quot;,&quot;sha256:73daa7eb11dec0d43e523434d28a66ee9d3ac063fda33d9e26183d867739dbb1&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 664306.4 | 618908.3 | 709704.5 | 573510.2 | 755102.7 |
| Model (ms) | 2 | 0 | 438178.2 | 377682.6 | 498673.8 | 317187 | 559169.5 |
| Non-model (ms) | 2 | 0 | 224856.1 | 209765 | 239947.3 | 194673.8 | 255038.5 |
| Startup (ms) | 2 | 0 | 1272.061 | 1265.739 | 1278.382 | 1259.417 | 1284.704 |
| First byte (ms) | 2 | 0 | 1233.478 | 1212.734 | 1254.222 | 1191.991 | 1274.966 |
| API turns | 2 | 0 | 81.5 | 67.75 | 95.25 | 54 | 109 |
| Input tokens | 2 | 0 | 7279030 | 5455210 | 9102849 | 3631390 | 10926670 |
| Output tokens | 2 | 0 | 72986 | 64571.5 | 81400.5 | 56157 | 89815 |
| Cached input (%) | 2 | 0 | 98.81026 | 98.63102 | 98.9895 | 98.45178 | 99.16874 |
| Static cost (USD) | 2 | 0 | 0.07643694 | 0.06464497 | 0.0882289 | 0.052853 | 0.1000209 |
| Model request count | 2 | 0 | 81.5 | 67.75 | 95.25 | 54 | 109 |
| Within-run median request duration (ms) | 2 | 0 | 2930.346 | 2868.108 | 2992.585 | 2805.869 | 3054.823 |
| Within-run median request wait (ms) | 2 | 0 | 1233.478 | 1212.734 | 1254.222 | 1191.991 | 1274.966 |
| Within-run median request transfer (ms) | 2 | 0 | 1637.485 | 1624.312 | 1650.657 | 1611.14 | 1663.83 |
| Within-run median inter-request gap (ms) | 2 | 0 | 237.1555 | 150.6906 | 323.6205 | 64.22561 | 410.0855 |
| Largest request duration (ms) | 2 | 0 | 52273.92 | 49964.7 | 54583.14 | 47655.48 | 56892.36 |
| Largest inter-request gap (ms) | 2 | 0 | 90562.15 | 90560.92 | 90563.38 | 90559.69 | 90564.61 |
| Time after last model response (ms) | 2 | 0 | 199.3329 | 180.3733 | 218.2926 | 161.4137 | 237.2522 |

#### psd-tools-blend-range-api — pi @ 0.73.1 — Pass (completed)

Selected attempts: 2. Task identity: \[&quot;psd-tools-blend-range-api&quot;,&quot;01595992c5f4d4695251fdf58b3edb5302d3ba46&quot;,&quot;sha256:fbfcc5b7e68a2d8fd97688c69808049d582113368f388929d7d46ac44a592cd9&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 269955.5 | 255779.4 | 284131.7 | 241603.3 | 298307.8 |
| Model (ms) | 2 | 0 | 247364.3 | 233449.4 | 261279.3 | 219534.5 | 275194.2 |
| Non-model (ms) | 2 | 0 | 21835.38 | 21584.64 | 22086.12 | 21333.89 | 22336.86 |
| Startup (ms) | 2 | 0 | 755.8208 | 745.3459 | 766.2956 | 734.871 | 776.7705 |
| First byte (ms) | 2 | 0 | 1179.474 | 1168.806 | 1190.143 | 1158.137 | 1200.811 |
| API turns | 2 | 0 | 50.5 | 48.25 | 52.75 | 46 | 55 |
| Input tokens | 2 | 0 | 3463246 | 3002380 | 3924111 | 2541515 | 4384976 |
| Output tokens | 2 | 0 | 45522 | 43302.5 | 47741.5 | 41083 | 49961 |
| Cached input (%) | 2 | 0 | 98.02849 | 97.90477 | 98.15221 | 97.78105 | 98.27593 |
| Static cost (USD) | 2 | 0 | 0.04740457 | 0.04398449 | 0.05082465 | 0.04056441 | 0.05424473 |
| Model request count | 2 | 0 | 50.5 | 48.25 | 52.75 | 46 | 55 |
| Within-run median request duration (ms) | 2 | 0 | 2605.092 | 2513.1 | 2697.084 | 2421.108 | 2789.076 |
| Within-run median request wait (ms) | 2 | 0 | 1179.474 | 1168.806 | 1190.143 | 1158.137 | 1200.811 |
| Within-run median request transfer (ms) | 2 | 0 | 1357.342 | 1268.176 | 1446.507 | 1179.011 | 1535.672 |
| Within-run median inter-request gap (ms) | 2 | 0 | 39.92659 | 31.57239 | 48.28079 | 23.21819 | 56.635 |
| Largest request duration (ms) | 2 | 0 | 28633.77 | 25534.01 | 31733.52 | 22434.26 | 34833.27 |
| Largest inter-request gap (ms) | 2 | 0 | 8475.713 | 8314.311 | 8637.115 | 8152.909 | 8798.517 |
| Time after last model response (ms) | 2 | 0 | 148.254 | 144.9128 | 151.5951 | 141.5717 | 154.9362 |

#### superjson-error-stack-serialization — pi @ 0.73.1 — Verification failure (verify_error)

Selected attempts: 2. Task identity: \[&quot;superjson-error-stack-serialization&quot;,&quot;f143004734ea2dd4090e45013a07f091f5bbaee7&quot;,&quot;sha256:dcc10590630fcc927468099eb5118e4bc7170a1f12e01ca5c9404011de072444&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 372326.5 | 366254.7 | 378398.4 | 360182.8 | 384470.3 |
| Model (ms) | 2 | 0 | 351577.9 | 345635.8 | 357520 | 339693.7 | 363462.1 |
| Non-model (ms) | 2 | 0 | 19190.99 | 18997.93 | 19384.05 | 18804.87 | 19577.11 |
| Startup (ms) | 2 | 0 | 1557.666 | 1494.386 | 1620.947 | 1431.105 | 1684.227 |
| First byte (ms) | 2 | 0 | 1196.345 | 1193.5 | 1199.191 | 1190.654 | 1202.037 |
| API turns | 2 | 0 | 36 | 34.5 | 37.5 | 33 | 39 |
| Input tokens | 2 | 0 | 2196063 | 2139098 | 2253027 | 2082134 | 2309991 |
| Output tokens | 2 | 0 | 69037.5 | 67646.75 | 70428.25 | 66256 | 71819 |
| Cached input (%) | 2 | 0 | 98.36392 | 98.31002 | 98.41782 | 98.25612 | 98.47173 |
| Static cost (USD) | 2 | 0 | 0.05327424 | 0.05257368 | 0.05397481 | 0.05187311 | 0.05467537 |
| Model request count | 2 | 0 | 36 | 34.5 | 37.5 | 33 | 39 |
| Within-run median request duration (ms) | 2 | 0 | 3957.717 | 3444.32 | 4471.114 | 2930.924 | 4984.511 |
| Within-run median request wait (ms) | 2 | 0 | 1196.345 | 1193.5 | 1199.191 | 1190.654 | 1202.037 |
| Within-run median request transfer (ms) | 2 | 0 | 2816.019 | 2298.96 | 3333.078 | 1781.901 | 3850.136 |
| Within-run median inter-request gap (ms) | 2 | 0 | 297.9029 | 219.9541 | 375.8516 | 142.0054 | 453.8004 |
| Largest request duration (ms) | 2 | 0 | 68746.42 | 67158.54 | 70334.3 | 65570.66 | 71922.18 |
| Largest inter-request gap (ms) | 2 | 0 | 3187.958 | 2459.737 | 3916.178 | 1731.517 | 4644.399 |
| Time after last model response (ms) | 2 | 0 | 168.4131 | 159.4187 | 177.4074 | 150.4244 | 186.4018 |

#### textual-richlog-follow-state — pi @ 0.73.1 — Pass (completed)

Selected attempts: 2. Task identity: \[&quot;textual-richlog-follow-state&quot;,&quot;a12215b791587a6d94227bd30a0e9291de932106&quot;,&quot;sha256:73fd3d800de9d5dae47edd9b5269e40966664b72d49d8f598964b8b91fdd0b92&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 519280.5 | 459708.5 | 578852.4 | 400136.5 | 638424.4 |
| Model (ms) | 2 | 0 | 387594.7 | 376073.5 | 399116 | 364552.2 | 410637.3 |
| Non-model (ms) | 2 | 0 | 130908.8 | 82859.82 | 178957.7 | 34810.86 | 227006.7 |
| Startup (ms) | 2 | 0 | 776.9418 | 775.1977 | 778.6859 | 773.4536 | 780.43 |
| First byte (ms) | 2 | 0 | 1254.033 | 1245.751 | 1262.316 | 1237.468 | 1270.598 |
| API turns | 2 | 0 | 67 | 66.5 | 67.5 | 66 | 68 |
| Input tokens | 2 | 0 | 4898918 | 4699566 | 5098269 | 4500214 | 5297621 |
| Output tokens | 2 | 0 | 65377 | 62183 | 68571 | 58989 | 71765 |
| Cached input (%) | 2 | 0 | 98.60173 | 98.55577 | 98.6477 | 98.5098 | 98.69366 |
| Static cost (USD) | 2 | 0 | 0.06393858 | 0.06134537 | 0.06653179 | 0.05875216 | 0.069125 |
| Model request count | 2 | 0 | 67 | 66.5 | 67.5 | 66 | 68 |
| Within-run median request duration (ms) | 2 | 0 | 3339.95 | 3160.375 | 3519.525 | 2980.8 | 3699.1 |
| Within-run median request wait (ms) | 2 | 0 | 1254.033 | 1245.751 | 1262.316 | 1237.468 | 1270.598 |
| Within-run median request transfer (ms) | 2 | 0 | 1918.578 | 1806.491 | 2030.664 | 1694.405 | 2142.75 |
| Within-run median inter-request gap (ms) | 2 | 0 | 39.85328 | 33.76583 | 45.94072 | 27.67838 | 52.02817 |
| Largest request duration (ms) | 2 | 0 | 56833.67 | 56304.66 | 57362.69 | 55775.64 | 57891.7 |
| Largest inter-request gap (ms) | 2 | 0 | 87898.42 | 49121.77 | 126675.1 | 10345.12 | 165451.7 |
| Time after last model response (ms) | 2 | 0 | 198.8423 | 182.2021 | 215.4825 | 165.5618 | 232.1227 |

#### tomlkit-toml-table-converters — pi @ 0.73.1 — Pass (completed)

Selected attempts: 2. Task identity: \[&quot;tomlkit-toml-table-converters&quot;,&quot;962de91aaf103135f400e5108a798a59a10dc17e&quot;,&quot;sha256:68dd891458463c9f930dcbbd59b4442065c145d66ce3b5813af82ca5ec8f4966&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 584661 | 582133.3 | 587188.6 | 579605.7 | 589716.3 |
| Model (ms) | 2 | 0 | 553315.2 | 542433.6 | 564196.9 | 531551.9 | 575078.6 |
| Non-model (ms) | 2 | 0 | 30584.89 | 22235.21 | 38934.57 | 13885.52 | 47284.26 |
| Startup (ms) | 2 | 0 | 760.8648 | 756.5231 | 765.2065 | 752.1815 | 769.5481 |
| First byte (ms) | 2 | 0 | 1297.413 | 1290.192 | 1304.634 | 1282.97 | 1311.856 |
| API turns | 2 | 0 | 71 | 65.5 | 76.5 | 60 | 82 |
| Input tokens | 2 | 0 | 6426091 | 5814645 | 7037538 | 5203198 | 7648984 |
| Output tokens | 2 | 0 | 94303.5 | 91414.25 | 97192.75 | 88525 | 100082 |
| Cached input (%) | 2 | 0 | 98.75362 | 98.59454 | 98.91269 | 98.43546 | 99.07177 |
| Static cost (USD) | 2 | 0 | 0.08706221 | 0.08678058 | 0.08734385 | 0.08649895 | 0.08762548 |
| Model request count | 2 | 0 | 71 | 65.5 | 76.5 | 60 | 82 |
| Within-run median request duration (ms) | 2 | 0 | 4074.588 | 3776.304 | 4372.873 | 3478.02 | 4671.157 |
| Within-run median request wait (ms) | 2 | 0 | 1297.413 | 1290.192 | 1304.634 | 1282.97 | 1311.856 |
| Within-run median request transfer (ms) | 2 | 0 | 2697.446 | 2390.6 | 3004.291 | 2083.755 | 3311.136 |
| Within-run median inter-request gap (ms) | 2 | 0 | 45.63356 | 45.10808 | 46.15905 | 44.58259 | 46.68453 |
| Largest request duration (ms) | 2 | 0 | 106823.6 | 83040.98 | 130606.2 | 59258.37 | 154388.8 |
| Largest inter-request gap (ms) | 2 | 0 | 18176.37 | 12966.08 | 23386.66 | 7755.789 | 28596.95 |
| Time after last model response (ms) | 2 | 0 | 214.0648 | 194.411 | 233.7186 | 174.7571 | 253.3724 |

#### true-myth-iterable-collection-combinators — pi @ 0.73.1 — Pass (completed)

Selected attempts: 2. Task identity: \[&quot;true-myth-iterable-collection-combinators&quot;,&quot;5945ad1b96e228ff716275d8a273282101152508&quot;,&quot;sha256:0ecebbb45e561b37ee5d7bcbe80588427f4890fb80fffbbb73ca6b94c7cb8855&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 390860.7 | 354522.6 | 427198.9 | 318184.5 | 463537 |
| Model (ms) | 2 | 0 | 309827.7 | 282759 | 336896.5 | 255690.3 | 363965.2 |
| Non-model (ms) | 2 | 0 | 80253.13 | 70975.64 | 89530.62 | 61698.15 | 98808.11 |
| Startup (ms) | 2 | 0 | 779.8653 | 771.756 | 787.9747 | 763.6466 | 796.0841 |
| First byte (ms) | 2 | 0 | 1310.334 | 1305.831 | 1314.838 | 1301.327 | 1319.341 |
| API turns | 2 | 0 | 58.5 | 54.25 | 62.75 | 50 | 67 |
| Input tokens | 2 | 0 | 6181474 | 5969969 | 6392978 | 5758464 | 6604483 |
| Output tokens | 2 | 0 | 52370.5 | 49793.25 | 54947.75 | 47216 | 57525 |
| Cached input (%) | 2 | 0 | 98.10791 | 98.03257 | 98.18325 | 97.95723 | 98.25859 |
| Static cost (USD) | 2 | 0 | 0.06706598 | 0.06498144 | 0.06915052 | 0.0628969 | 0.07123507 |
| Model request count | 2 | 0 | 58.5 | 54.25 | 62.75 | 50 | 67 |
| Within-run median request duration (ms) | 2 | 0 | 2711.726 | 2686.19 | 2737.262 | 2660.654 | 2762.799 |
| Within-run median request wait (ms) | 2 | 0 | 1310.334 | 1305.831 | 1314.838 | 1301.327 | 1319.341 |
| Within-run median request transfer (ms) | 2 | 0 | 1284.247 | 1269.466 | 1299.027 | 1254.686 | 1313.808 |
| Within-run median inter-request gap (ms) | 2 | 0 | 27.15436 | 24.76437 | 29.54434 | 22.37439 | 31.93432 |
| Largest request duration (ms) | 2 | 0 | 24759.6 | 23279.34 | 26239.85 | 21799.08 | 27720.11 |
| Largest inter-request gap (ms) | 2 | 0 | 17678.51 | 11496.82 | 23860.21 | 5315.122 | 30041.9 |
| Time after last model response (ms) | 2 | 0 | 190.9312 | 176.4667 | 205.3957 | 162.0022 | 219.8602 |

#### cattrs-partial-structuring-recovery — qwen @ 0.22.2 — Pass (completed)

Selected attempts: 2. Task identity: \[&quot;cattrs-partial-structuring-recovery&quot;,&quot;91df27b2a20f26c35777a92f4555438b62c06345&quot;,&quot;sha256:b985f2bd17e9e80bee0fa9b7c0747b2ded92d54d070b32ebfe102e8829a44076&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 503533.2 | 454054.2 | 553012.2 | 404575.3 | 602491.2 |
| Model (ms) | 2 | 0 | 382384.6 | 341709 | 423060.2 | 301033.4 | 463735.8 |
| Non-model (ms) | 2 | 0 | 119731.6 | 110932.2 | 128531 | 102132.8 | 137330.4 |
| Startup (ms) | 2 | 0 | 1416.983 | 1413.007 | 1420.959 | 1409.031 | 1424.935 |
| First byte (ms) | 2 | 0 | 1265.046 | 1263.313 | 1266.779 | 1261.58 | 1268.512 |
| API turns | 2 | 0 | 77.5 | 72.25 | 82.75 | 67 | 88 |
| Input tokens | 2 | 0 | 6611401 | 6327280 | 6895523 | 6043158 | 7179644 |
| Output tokens | 2 | 0 | 68183 | 59592 | 76774 | 51001 | 85365 |
| Cached input (%) | 2 | 0 | 98.62539 | 98.44449 | 98.80629 | 98.26359 | 98.98719 |
| Static cost (USD) | 2 | 0 | 0.07440574 | 0.06606655 | 0.08274493 | 0.05772736 | 0.09108413 |
| Model request count | 2 | 0 | 77.5 | 72.25 | 82.75 | 67 | 88 |
| Within-run median request duration (ms) | 2 | 0 | 2798.573 | 2685.646 | 2911.5 | 2572.719 | 3024.426 |
| Within-run median request wait (ms) | 2 | 0 | 1265.046 | 1263.313 | 1266.779 | 1261.58 | 1268.512 |
| Within-run median request transfer (ms) | 2 | 0 | 1409.514 | 1329.806 | 1489.222 | 1250.098 | 1568.93 |
| Within-run median inter-request gap (ms) | 2 | 0 | 42.95303 | 40.9597 | 44.94637 | 38.96636 | 46.9397 |
| Largest request duration (ms) | 2 | 0 | 33994.88 | 30002.62 | 37987.14 | 26010.37 | 41979.39 |
| Largest inter-request gap (ms) | 2 | 0 | 60185.28 | 58628.38 | 61742.19 | 57071.47 | 63299.1 |
| Time after last model response (ms) | 2 | 0 | 172.6681 | 172.2081 | 173.1281 | 171.7481 | 173.5881 |

#### happy-dom-deterministic-intersectionobserver — qwen @ 0.22.2 — Verification failure (verify_error)

Selected attempts: 2. Task identity: \[&quot;happy-dom-deterministic-intersectionobserver&quot;,&quot;32b2a8e60eab482c023af377160bf294d6da0318&quot;,&quot;sha256:a4df294272f2165ce894306ab1eec5284fe426ddaa66cf08bb3c4755a9f8faa2&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 525538.9 | 519631.3 | 531446.5 | 513723.7 | 537354.2 |
| Model (ms) | 2 | 0 | 396482.8 | 392566.9 | 400398.8 | 388650.9 | 404314.7 |
| Non-model (ms) | 2 | 0 | 126513.6 | 124283.4 | 128743.8 | 122053.3 | 130973.9 |
| Startup (ms) | 2 | 0 | 2542.477 | 2303.996 | 2780.959 | 2065.514 | 3019.441 |
| First byte (ms) | 2 | 0 | 1284.517 | 1281.106 | 1287.929 | 1277.695 | 1291.34 |
| API turns | 2 | 0 | 84 | 75.5 | 92.5 | 67 | 101 |
| Input tokens | 2 | 0 | 7621791 | 6986911 | 8256672 | 6352030 | 8891552 |
| Output tokens | 2 | 0 | 70098 | 68977.5 | 71218.5 | 67857 | 72339 |
| Cached input (%) | 2 | 0 | 99.0052 | 98.9996 | 99.01081 | 98.99399 | 99.01641 |
| Static cost (USD) | 2 | 0 | 0.07604899 | 0.07395103 | 0.07814694 | 0.07185308 | 0.08024489 |
| Model request count | 2 | 0 | 84 | 75.5 | 92.5 | 67 | 101 |
| Within-run median request duration (ms) | 2 | 0 | 2334.902 | 2227.715 | 2442.089 | 2120.528 | 2549.277 |
| Within-run median request wait (ms) | 2 | 0 | 1284.517 | 1281.106 | 1287.929 | 1277.695 | 1291.34 |
| Within-run median request transfer (ms) | 2 | 0 | 1031.645 | 936.4409 | 1126.849 | 841.2368 | 1222.053 |
| Within-run median inter-request gap (ms) | 2 | 0 | 53.11387 | 47.45446 | 58.77329 | 41.79504 | 64.43271 |
| Largest request duration (ms) | 2 | 0 | 39443.33 | 32102.81 | 46783.84 | 24762.3 | 54124.36 |
| Largest inter-request gap (ms) | 2 | 0 | 39870.98 | 39689.62 | 40052.34 | 39508.27 | 40233.7 |
| Time after last model response (ms) | 2 | 0 | 200.1704 | 190.5562 | 209.7845 | 180.9421 | 219.3987 |

#### ink-grid-box-layout — qwen @ 0.22.2 — Pass (completed)

Selected attempts: 2. Task identity: \[&quot;ink-grid-box-layout&quot;,&quot;477fda7df7781406d2ba046eb48dd5391e964b72&quot;,&quot;sha256:73daa7eb11dec0d43e523434d28a66ee9d3ac063fda33d9e26183d867739dbb1&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 1111081 | 1026646 | 1195515 | 942212.3 | 1279949 |
| Model (ms) | 2 | 0 | 577470.5 | 576439.4 | 578501.6 | 575408.3 | 579532.7 |
| Non-model (ms) | 2 | 0 | 531640.2 | 446183.3 | 617097.1 | 360726.4 | 702553.9 |
| Startup (ms) | 2 | 0 | 1969.91 | 1961.501 | 1978.319 | 1953.093 | 1986.727 |
| First byte (ms) | 2 | 0 | 1359.081 | 1347.715 | 1370.448 | 1336.348 | 1381.815 |
| API turns | 2 | 0 | 107 | 104 | 110 | 101 | 113 |
| Input tokens | 2 | 0 | 12909490 | 12764410 | 13054570 | 12619330 | 13199650 |
| Output tokens | 2 | 0 | 94567.5 | 91852.25 | 97282.75 | 89137 | 99998 |
| Cached input (%) | 2 | 0 | 99.28941 | 99.2625 | 99.31632 | 99.23559 | 99.34323 |
| Static cost (USD) | 2 | 0 | 0.1089767 | 0.1062501 | 0.1117033 | 0.1035235 | 0.1144299 |
| Model request count | 2 | 0 | 107 | 104 | 110 | 101 | 113 |
| Within-run median request duration (ms) | 2 | 0 | 2692.433 | 2678.307 | 2706.56 | 2664.181 | 2720.686 |
| Within-run median request wait (ms) | 2 | 0 | 1359.081 | 1347.715 | 1370.448 | 1336.348 | 1381.815 |
| Within-run median request transfer (ms) | 2 | 0 | 1301.076 | 1276.782 | 1325.369 | 1252.488 | 1349.663 |
| Within-run median inter-request gap (ms) | 2 | 0 | 55.98387 | 51.64215 | 60.32559 | 47.30043 | 64.66731 |
| Largest request duration (ms) | 2 | 0 | 46474.22 | 45682.22 | 47266.22 | 44890.23 | 48058.21 |
| Largest inter-request gap (ms) | 2 | 0 | 113731.4 | 95969.32 | 131493.5 | 78207.2 | 149255.7 |
| Time after last model response (ms) | 2 | 0 | 190.5779 | 189.0073 | 192.1486 | 187.4366 | 193.7193 |

#### psd-tools-blend-range-api — qwen @ 0.22.2 — Pass (completed)

Selected attempts: 2. Task identity: \[&quot;psd-tools-blend-range-api&quot;,&quot;01595992c5f4d4695251fdf58b3edb5302d3ba46&quot;,&quot;sha256:fbfcc5b7e68a2d8fd97688c69808049d582113368f388929d7d46ac44a592cd9&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 312824.3 | 305267.4 | 320381.3 | 297710.4 | 327938.2 |
| Model (ms) | 2 | 0 | 268301.8 | 261155.1 | 275448.4 | 254008.4 | 282595.1 |
| Non-model (ms) | 2 | 0 | 42985.45 | 42574.69 | 43396.21 | 42163.94 | 43806.96 |
| Startup (ms) | 2 | 0 | 1537.114 | 1536.634 | 1537.594 | 1536.153 | 1538.074 |
| First byte (ms) | 2 | 0 | 1228.744 | 1213.045 | 1244.443 | 1197.345 | 1260.143 |
| API turns | 2 | 0 | 65.5 | 63.25 | 67.75 | 61 | 70 |
| Input tokens | 2 | 0 | 5210321 | 4975289 | 5445352 | 4740258 | 5680383 |
| Output tokens | 2 | 0 | 48117 | 46765.5 | 49468.5 | 45414 | 50820 |
| Cached input (%) | 2 | 0 | 98.83025 | 98.70054 | 98.95995 | 98.57084 | 99.08966 |
| Static cost (USD) | 2 | 0 | 0.05328125 | 0.05235454 | 0.05420796 | 0.05142784 | 0.05513467 |
| Model request count | 2 | 0 | 65.5 | 63.25 | 67.75 | 61 | 70 |
| Within-run median request duration (ms) | 2 | 0 | 2495.65 | 2475.758 | 2515.543 | 2455.865 | 2535.436 |
| Within-run median request wait (ms) | 2 | 0 | 1228.744 | 1213.045 | 1244.443 | 1197.345 | 1260.143 |
| Within-run median request transfer (ms) | 2 | 0 | 1187.457 | 1172.912 | 1202.003 | 1158.366 | 1216.549 |
| Within-run median inter-request gap (ms) | 2 | 0 | 53.34718 | 46.70914 | 59.98521 | 40.07111 | 66.62324 |
| Largest request duration (ms) | 2 | 0 | 28382.45 | 27979.29 | 28785.62 | 27576.12 | 29188.79 |
| Largest inter-request gap (ms) | 2 | 0 | 12515.8 | 12333.81 | 12697.79 | 12151.82 | 12879.78 |
| Time after last model response (ms) | 2 | 0 | 172.5431 | 168.3703 | 176.7159 | 164.1976 | 180.8887 |

#### superjson-error-stack-serialization — qwen @ 0.22.2 — Verification failure (verify_error)

Selected attempts: 2. Task identity: \[&quot;superjson-error-stack-serialization&quot;,&quot;f143004734ea2dd4090e45013a07f091f5bbaee7&quot;,&quot;sha256:dcc10590630fcc927468099eb5118e4bc7170a1f12e01ca5c9404011de072444&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 298158.4 | 291466.1 | 304850.6 | 284773.9 | 311542.9 |
| Model (ms) | 2 | 0 | 284663.1 | 278196.1 | 291130.1 | 271729.1 | 297597 |
| Non-model (ms) | 2 | 0 | 11446.65 | 11214.26 | 11679.05 | 10981.86 | 11911.45 |
| Startup (ms) | 2 | 0 | 2048.641 | 2041.523 | 2055.758 | 2034.406 | 2062.875 |
| First byte (ms) | 2 | 0 | 1222.333 | 1217.374 | 1227.293 | 1212.415 | 1232.252 |
| API turns | 2 | 0 | 39 | 38 | 40 | 37 | 41 |
| Input tokens | 2 | 0 | 2879117 | 2808420 | 2949815 | 2737722 | 3020512 |
| Output tokens | 2 | 0 | 58368.5 | 57081.75 | 59655.25 | 55795 | 60942 |
| Cached input (%) | 2 | 0 | 98.76394 | 98.5183 | 99.00958 | 98.27265 | 99.25523 |
| Static cost (USD) | 2 | 0 | 0.04878772 | 0.04731659 | 0.05025886 | 0.04584545 | 0.05173 |
| Model request count | 2 | 0 | 39 | 38 | 40 | 37 | 41 |
| Within-run median request duration (ms) | 2 | 0 | 2834.656 | 2752.977 | 2916.334 | 2671.299 | 2998.013 |
| Within-run median request wait (ms) | 2 | 0 | 1222.333 | 1217.374 | 1227.293 | 1212.415 | 1232.252 |
| Within-run median request transfer (ms) | 2 | 0 | 1503.605 | 1464.08 | 1543.129 | 1424.556 | 1582.654 |
| Within-run median inter-request gap (ms) | 2 | 0 | 50.21848 | 48.53808 | 51.89888 | 46.85768 | 53.57928 |
| Largest request duration (ms) | 2 | 0 | 78419.36 | 73691.61 | 83147.11 | 68963.86 | 87874.86 |
| Largest inter-request gap (ms) | 2 | 0 | 1772.1 | 1726.028 | 1818.173 | 1679.955 | 1864.246 |
| Time after last model response (ms) | 2 | 0 | 185.5003 | 184.1887 | 186.8118 | 182.8771 | 188.1234 |

#### textual-richlog-follow-state — qwen @ 0.22.2 — Pass (completed)

Selected attempts: 1. Task identity: \[&quot;textual-richlog-follow-state&quot;,&quot;a12215b791587a6d94227bd30a0e9291de932106&quot;,&quot;sha256:73fd3d800de9d5dae47edd9b5269e40966664b72d49d8f598964b8b91fdd0b92&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 677392.5 | unavailable | unavailable | 677392.5 | 677392.5 |
| Model (ms) | 1 | 0 | 473558.6 | unavailable | unavailable | 473558.6 | 473558.6 |
| Non-model (ms) | 1 | 0 | 202323 | unavailable | unavailable | 202323 | 202323 |
| Startup (ms) | 1 | 0 | 1510.872 | unavailable | unavailable | 1510.872 | 1510.872 |
| First byte (ms) | 1 | 0 | 1284.921 | unavailable | unavailable | 1284.921 | 1284.921 |
| API turns | 1 | 0 | 103 | unavailable | unavailable | 103 | 103 |
| Input tokens | 1 | 0 | 9847811 | unavailable | unavailable | 9847811 | 9847811 |
| Output tokens | 1 | 0 | 74629 | unavailable | unavailable | 74629 | 74629 |
| Cached input (%) | 1 | 0 | 99.07712 | unavailable | unavailable | 99.07712 | 99.07712 |
| Static cost (USD) | 1 | 0 | 0.08768063 | unavailable | unavailable | 0.08768063 | 0.08768063 |
| Model request count | 1 | 0 | 103 | unavailable | unavailable | 103 | 103 |
| Within-run median request duration (ms) | 1 | 0 | 2728.441 | unavailable | unavailable | 2728.441 | 2728.441 |
| Within-run median request wait (ms) | 1 | 0 | 1284.921 | unavailable | unavailable | 1284.921 | 1284.921 |
| Within-run median request transfer (ms) | 1 | 0 | 1366.891 | unavailable | unavailable | 1366.891 | 1366.891 |
| Within-run median inter-request gap (ms) | 1 | 0 | 55.48858 | unavailable | unavailable | 55.48858 | 55.48858 |
| Largest request duration (ms) | 1 | 0 | 32914.6 | unavailable | unavailable | 32914.6 | 32914.6 |
| Largest inter-request gap (ms) | 1 | 0 | 166149.7 | unavailable | unavailable | 166149.7 | 166149.7 |
| Time after last model response (ms) | 1 | 0 | 211.5528 | unavailable | unavailable | 211.5528 | 211.5528 |

#### textual-richlog-follow-state — qwen @ 0.22.2 — Verification failure (verify_error)

Selected attempts: 1. Task identity: \[&quot;textual-richlog-follow-state&quot;,&quot;a12215b791587a6d94227bd30a0e9291de932106&quot;,&quot;sha256:73fd3d800de9d5dae47edd9b5269e40966664b72d49d8f598964b8b91fdd0b92&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 1 | 0 | 707473.1 | unavailable | unavailable | 707473.1 | 707473.1 |
| Model (ms) | 1 | 0 | 505765.2 | unavailable | unavailable | 505765.2 | 505765.2 |
| Non-model (ms) | 1 | 0 | 200220.6 | unavailable | unavailable | 200220.6 | 200220.6 |
| Startup (ms) | 1 | 0 | 1487.271 | unavailable | unavailable | 1487.271 | 1487.271 |
| First byte (ms) | 1 | 0 | 1318.512 | unavailable | unavailable | 1318.512 | 1318.512 |
| API turns | 1 | 0 | 112 | unavailable | unavailable | 112 | 112 |
| Input tokens | 1 | 0 | 10800230 | unavailable | unavailable | 10800230 | 10800230 |
| Output tokens | 1 | 0 | 75131 | unavailable | unavailable | 75131 | 75131 |
| Cached input (%) | 1 | 0 | 99.38158 | unavailable | unavailable | 99.38158 | 99.38158 |
| Static cost (USD) | 1 | 0 | 0.08729757 | unavailable | unavailable | 0.08729757 | 0.08729757 |
| Model request count | 1 | 0 | 112 | unavailable | unavailable | 112 | 112 |
| Within-run median request duration (ms) | 1 | 0 | 3204.992 | unavailable | unavailable | 3204.992 | 3204.992 |
| Within-run median request wait (ms) | 1 | 0 | 1318.512 | unavailable | unavailable | 1318.512 | 1318.512 |
| Within-run median request transfer (ms) | 1 | 0 | 1671.645 | unavailable | unavailable | 1671.645 | 1671.645 |
| Within-run median inter-request gap (ms) | 1 | 0 | 44.78508 | unavailable | unavailable | 44.78508 | 44.78508 |
| Largest request duration (ms) | 1 | 0 | 29896.74 | unavailable | unavailable | 29896.74 | 29896.74 |
| Largest inter-request gap (ms) | 1 | 0 | 167087.7 | unavailable | unavailable | 167087.7 | 167087.7 |
| Time after last model response (ms) | 1 | 0 | 187.145 | unavailable | unavailable | 187.145 | 187.145 |

#### tomlkit-toml-table-converters — qwen @ 0.22.2 — Verification failure (verify_error)

Selected attempts: 2. Task identity: \[&quot;tomlkit-toml-table-converters&quot;,&quot;962de91aaf103135f400e5108a798a59a10dc17e&quot;,&quot;sha256:68dd891458463c9f930dcbbd59b4442065c145d66ce3b5813af82ca5ec8f4966&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 705912 | 629238.9 | 782585.1 | 552565.7 | 859258.2 |
| Model (ms) | 2 | 0 | 671968.8 | 596717.8 | 747219.9 | 521466.8 | 822470.9 |
| Non-model (ms) | 2 | 0 | 32509.03 | 31077.63 | 33940.44 | 29646.22 | 35371.84 |
| Startup (ms) | 2 | 0 | 1434.117 | 1424.792 | 1443.443 | 1415.466 | 1452.768 |
| First byte (ms) | 2 | 0 | 1398.168 | 1385.041 | 1411.295 | 1371.914 | 1424.422 |
| API turns | 2 | 0 | 118 | 106 | 130 | 94 | 142 |
| Input tokens | 2 | 0 | 15991170 | 13555210 | 18427120 | 11119260 | 20863070 |
| Output tokens | 2 | 0 | 105828.5 | 94377.75 | 117279.3 | 82927 | 128730 |
| Cached input (%) | 2 | 0 | 99.46726 | 99.41923 | 99.51529 | 99.3712 | 99.56332 |
| Static cost (USD) | 2 | 0 | 0.1233058 | 0.1083489 | 0.1382627 | 0.09339193 | 0.1532197 |
| Model request count | 2 | 0 | 118 | 106 | 130 | 94 | 142 |
| Within-run median request duration (ms) | 2 | 0 | 3074.742 | 2916.416 | 3233.067 | 2758.09 | 3391.393 |
| Within-run median request wait (ms) | 2 | 0 | 1398.168 | 1385.041 | 1411.295 | 1371.914 | 1424.422 |
| Within-run median request transfer (ms) | 2 | 0 | 1601.776 | 1457.836 | 1745.716 | 1313.896 | 1889.656 |
| Within-run median inter-request gap (ms) | 2 | 0 | 61.67266 | 54.66434 | 68.68097 | 47.65603 | 75.68929 |
| Largest request duration (ms) | 2 | 0 | 67182.03 | 48375.07 | 85989 | 29568.1 | 104796 |
| Largest inter-request gap (ms) | 2 | 0 | 5459.397 | 4240.859 | 6677.935 | 3022.321 | 7896.472 |
| Time after last model response (ms) | 2 | 0 | 269.5044 | 227.5411 | 311.4677 | 185.5779 | 353.4309 |

#### true-myth-iterable-collection-combinators — qwen @ 0.22.2 — Pass (completed)

Selected attempts: 2. Task identity: \[&quot;true-myth-iterable-collection-combinators&quot;,&quot;5945ad1b96e228ff716275d8a273282101152508&quot;,&quot;sha256:0ecebbb45e561b37ee5d7bcbe80588427f4890fb80fffbbb73ca6b94c7cb8855&quot;,&quot;prepared-local&quot;\].

| Metric | Valid n | Missing n | Median | Q1 | Q3 | Min | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| End-to-end (ms) | 2 | 0 | 307788.9 | 267091.7 | 348486 | 226394.5 | 389183.2 |
| Model (ms) | 2 | 0 | 274430.7 | 239924.3 | 308937 | 205417.9 | 343443.4 |
| Non-model (ms) | 2 | 0 | 31473.25 | 25070.37 | 37876.13 | 18667.49 | 44279.01 |
| Startup (ms) | 2 | 0 | 1884.959 | 1672.867 | 2097.051 | 1460.776 | 2309.142 |
| First byte (ms) | 2 | 0 | 1314.631 | 1312.331 | 1316.931 | 1310.032 | 1319.23 |
| API turns | 2 | 0 | 62.5 | 54.75 | 70.25 | 47 | 78 |
| Input tokens | 2 | 0 | 7229000 | 5979712 | 8478289 | 4730423 | 9727577 |
| Output tokens | 2 | 0 | 50426.5 | 43702.75 | 57150.25 | 36979 | 63874 |
| Cached input (%) | 2 | 0 | 98.35655 | 98.13728 | 98.57582 | 97.91801 | 98.79509 |
| Static cost (USD) | 2 | 0 | 0.06779656 | 0.05932641 | 0.0762667 | 0.05085626 | 0.08473685 |
| Model request count | 2 | 0 | 62.5 | 54.75 | 70.25 | 47 | 78 |
| Within-run median request duration (ms) | 2 | 0 | 2732.252 | 2693.649 | 2770.856 | 2655.045 | 2809.459 |
| Within-run median request wait (ms) | 2 | 0 | 1314.631 | 1312.331 | 1316.931 | 1310.032 | 1319.23 |
| Within-run median request transfer (ms) | 2 | 0 | 1329.565 | 1323.684 | 1335.446 | 1317.803 | 1341.327 |
| Within-run median inter-request gap (ms) | 2 | 0 | 45.27462 | 44.96272 | 45.58653 | 44.65082 | 45.89843 |
| Largest request duration (ms) | 2 | 0 | 21436.35 | 21054.29 | 21818.41 | 20672.24 | 22200.47 |
| Largest inter-request gap (ms) | 2 | 0 | 7446.589 | 5567.961 | 9325.218 | 3689.332 | 11203.85 |
| Time after last model response (ms) | 2 | 0 | 179.5599 | 178.8347 | 180.2851 | 178.1095 | 181.0103 |

### Annotated request timelines

#### pinned:hermes:textual-richlog-follow-state:1 — most model calls among passes

hermes @ Hermes Agent v0.20.5 (2026.8.19) · textual-richlog-follow-state · Pass (completed). Calls 190 (190 successful). Median duration 3.3s; largest gap 2m 26.77s; time after last 253.7433 ms.

#### pinned:qwen:textual-richlog-follow-state:0 — largest inter-request gap among passes

qwen @ 0.22.2 · textual-richlog-follow-state · Pass (completed). Calls 103 (103 successful). Median duration 2.73s; largest gap 2m 46.15s; time after last 211.5528 ms.

#### pinned:codex:ink-grid-box-layout:0 — longest tail after last model response among passes

codex @ codex-cli 0.149.1 · ink-grid-box-layout · Pass (completed). Calls 79 (79 successful). Median duration 3.36s; largest gap 30.17s; time after last 5.17s.

#### pinned:pi:tomlkit-toml-table-converters:0 — longest single model call among passes

pi @ 0.73.1 · tomlkit-toml-table-converters · Pass (completed). Calls 60 (60 successful). Median duration 4.67s; largest gap 7.76s; time after last 174.7571 ms.

#### pinned:cline:textual-richlog-follow-state:0 — most model calls among verification failures

cline @ 3.0.61 · textual-richlog-follow-state · Verification failure (verify_error). Calls 1267 (1267 successful). Median duration 2.33s; largest gap 30.23s; time after last 2.31s.

#### pinned:cline:cattrs-partial-structuring-recovery:0 — most failed model calls among verification failures

cline @ 3.0.61 · cattrs-partial-structuring-recovery · Verification failure (verify_error). Calls 932 (932 successful). Median duration 2.28s; largest gap 30.11s; time after last 1.69s.

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
<details>
<summary>Recorded pass-rate comparisons</summary>


## How convincing are the differences?

Original campaign verification; observed differences, not a general harness ranking.

| Comparison (left − right) | Pass-rate difference | Exploratory 95% interval | Task clusters |
|---|---:|---|---:|
| cline − codex | -81.3 pp | -93.8 pp to -62.5 pp | 8 |
| cline − hermes | -56.3 pp | -81.3 pp to -31.3 pp | 8 |
| cline − pi | -81.3 pp | -100.0 pp to -56.3 pp | 8 |
| cline − qwen | -56.3 pp | -87.5 pp to -25.0 pp | 8 |
| codex − hermes | +25.0 pp | 0.0 pp to +62.5 pp | 8 |
| codex − pi | 0.0 pp | -25.0 pp to +31.3 pp | 8 |
| codex − qwen | +25.0 pp | -12.5 pp to +62.5 pp | 8 |
| hermes − pi | -25.0 pp | -50.0 pp to -6.3 pp | 8 |
| hermes − qwen | 0.0 pp | -25.0 pp to +25.0 pp | 8 |
| pi − qwen | +25.0 pp | +6.3 pp to +50.0 pp | 8 |

Exploratory 95% percentile task-cluster bootstrap, 10,000 deterministic resamples. Each task and all its repetitions move together; harnesses are paired by task, not by random seed. Marginal intervals are not corrected for multiple comparisons or winner selection. Eight task clusters provide limited evidence about other coding tasks. These intervals do not remove configuration, environment or verifier confounding.

“Best = 100%” is an observed relative index, not statistical certainty.

</details>

## Original incomplete attempts

The following three paid primary attempts are outside the selected80. The original Cline timeout lasted 10,800.372 seconds. Open ledger ends stay open. Known prefix estimates do not give complete charges.

| Attempt | Outcome | Adapter time | Known prefix reference estimate | Full cost |
|---|---|---|---|---|
| pinned:cline:textual-richlog-follow-state:0 | timeout | 10800.372 s | $1.836203754 | unknown |
| pinned:cline:tomlkit-toml-table-converters:1 | budget-interrupted | unknown | $0.444080070 | unknown |
| pinned:pi:textual-richlog-follow-state:0 | interrupted | unknown | $0.003784620 | unknown |

See [all extra facts and captured request series](extra-attempts.json), [original cohorts and windows](cohorts.json), and [collection ledger](collection-ledger.json). Event-only prefix estimates are separate from the ledger's full-artifact subtotal. Reserved amounts are not charges. The zero-request operator startup failure and 5.671709 ms offline proxy calibration rejection remain recorded; the 5 ms threshold did not change.
