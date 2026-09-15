# S3 — Flash tail latency dominates the "timeout" evidence (2026-09-03)

## Summary

`z-ai/glm-5.3-flash` has a heavy-tailed request latency distribution on
OpenRouter. Its median request is healthy and comparable to the models it was
losing to, but roughly one request in twenty-two stalls for more than a minute,
with an observed maximum of **749 seconds**. A single stall exhausts the entire
300-second short-regime budget on its own.

This substantially reweights the project's accumulated "Flash timed out"
evidence, and it is a measurement-validity problem for the instrument itself,
independent of any release decision.

## Evidence

Every C1 event across all retained diagnostic roots, grouped by served model.
Successful (`status 200`) POST completions only.

| Model | n | median | p95 | max | ≥60 s | rate |
|---|---|---|---|---|---|---|
| `z-ai/glm-5.3-flash` | 800 | 6.9 s | 53.5 s | **749.2 s** | 37 | **4.6 %** |
| `openai/gpt-5.6-sol` | 80 | 5.4 s | 23.8 s | 48.9 s | 0 | 0.0 % |
| `z-ai/glm-5.3` | 40 | 2.0 s | 45.1 s | 46.4 s | 0 | 0.0 % |

Flash's median (6.9 s) is *worse than but comparable to* GPT-5.6 Sol's (5.4 s).
The distributions diverge only in the tail. If Flash's 4.6 % stall rate applied
to the 120 non-Flash requests, roughly 5–6 stalls would be expected; zero were
observed, so the difference is unlikely to be sampling noise.

Observed live while writing this, in the `ink-grid-box-layout` extended
calibration: eight completions of 8.9, 6.0, 4.7, 7.7, 5.2, 6.2, **621.4**, and
6.2 seconds. One request consumed 92 % of the cell's elapsed time, and 99 % of
the cell was spent inside model requests.

Per-root maxima showing the same signature:

| Root | n | median | max |
|---|---|---|---|
| `real-anko-flash-long-20260830` | 13 | 6.9 s | 749.2 s |
| `cal-ext-run3` | 8 | 6.2 s | 621.4 s |
| `real-geo-long-codex-hermes-20260831` | 13 | 4.5 s | 489.9 s |
| `deepswe-two-long-codex-hermes` | 17 | 7.1 s | 481.6 s |
| `deepswe-postfix-hermes` | 12 | 7.1 s | 473.1 s |
| `...calibration-psd-gpt56sol-control` | 42 | 5.0 s | 48.9 s |

## What this changes

1. **The "Flash is not capable enough" conclusion is not supported as stated.**
   Flash's recorded failures are a mixture of genuine capability shortfalls
   (34/45 and 42/45 feature tests on `psd-tools-blend-range-api`) and cells
   consumed by provider stalls. The two are not separated in any existing
   diagnostic, so the capability claim rests on contaminated evidence. See
   [S3-model-vs-task-regime-analysis.md].

2. **Short-regime timeouts were partly a lottery.** At a 4.6 % per-request stall
   rate, a cell issuing 20 requests has roughly a 60 % chance of drawing at
   least one stall. Under a 300-second bound a single stall is fatal. This is
   consistent with the near-universal short-regime timeouts on record.

3. **`model_time` is contaminated, and so is everything derived from it.**
   METHODOLOGY defines `end_to_end = startup + model_time + harness_time +
   tool_time`, with `model_time` the union of API request intervals. When 4.6 %
   of requests stall for minutes, `model_time` measures provider tail behavior,
   and the headline non-model share is computed against a denominator dominated
   by it. Comparing CLIs on this model is also noisy in an unfair way:
   whichever adapter happens to draw a stall looks worse through no property of
   its own.

## Recommended response

These are proposals; none is implemented by this document.

1. **Record stalls as first-class evidence.** Derive a per-run count and total
   duration of requests above a declared threshold, surface it in the report,
   and state it beside any Flash result. This is cheap, changes no measurement,
   and makes the contamination visible instead of silent.
2. **Do not "fix" it with a silent proxy retry.** A per-request timeout and
   retry would change what the instrument measures and would hide a real
   property of the pinned route. If a retry is ever introduced it must be
   recorded in C1 and reported.
3. **Re-examine the capability question only on stall-free cells.** The
   discriminating comparison is Flash versus a stronger model on cells where
   neither drew a stall. No such comparison exists yet.
4. **Treat tail latency as a model-selection criterion.** A cheap model remains
   the right default for this project's budget, but the selected route must
   have a bounded tail. Worth measuring the tail of any cheap candidate before
   pinning it.

## Reproduction

```
python3 - <<'PY'
import json,glob,statistics
from collections import defaultdict
by=defaultdict(list)
for f in glob.glob('scratch/**/events.jsonl', recursive=True):
    try: ev=[json.loads(l) for l in open(f) if l.strip()]
    except Exception: continue
    for e in ev:
        if e.get('status')==200 and e.get('method')=='POST' and e.get('duration_ms'):
            by[e.get('model_served') or e.get('model_requested') or 'unknown'].append(e['duration_ms']/1000)
for m,d in sorted(by.items(), key=lambda kv:-len(kv[1])):
    if len(d)<20: continue
    d=sorted(d); slow=[x for x in d if x>=60]
    print(m, len(d), round(statistics.median(d),1), round(d[int(len(d)*0.95)],1), round(max(d),1), len(slow))
PY
```

## Follow-up (2026-09-04): the fallback is fixed, one case is still unexplained

`1201aca` fixed the generation-lookup extractor (it mixed OpenRouter's
normalized and native counter families, so any heavily cached turn failed its
own `cached > input` check). `7ffcfae` drives the whole proxy path in a test: a
streamed completion with no usage block plus an `x-generation-id` header now
yields `usage_source: generation_lookup` with correct native counts.

Verified live against OpenRouter while diagnosing:

- `x-generation-id` is returned on both streamed and non-streamed responses.
- `GET /api/v1/generation?id=...` answers 200 in ~50 ms with valid native
  counters, so neither the 5-second lookup timeout nor record availability
  explains a failure.

Despite that, one request in `scratch/cal-ext-run4` (408.6 s, HTTP 200,
streamed, no error) still recorded `usage_source: unavailable`. The code path
is proven, the header is present, the endpoint is fast, and the runner supplies
`upstreamApiKey`, so the cause is not yet identified.

**Known gap:** a C1 event records only `usage_source: "unavailable"` and never
why the lookup failed — no generation id, no lookup status, no error kind. That
makes this class of failure undiagnosable after the fact, which is how the
fallback stayed broken long enough to abort every calibration in this
repository's history. Recording the generation id and a lookup failure reason
is the next observability change worth making; it needs a C1 contract addition
and so is not made here.
