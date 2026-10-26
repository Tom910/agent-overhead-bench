# S6 — Use Cline's estimate as its displayed pass rate

The maintainer still sees 0% because the previous change left the recorded
value primary. Make the approved 6/16 estimate the main Cline pass display,
with a short "estimated" label. This supersedes the earlier requirement to
keep recorded values primary in the table and chart.

Use the same approved per-run estimate for tables, chart positions, pass sorting,
relative display scores, task matrix, README and detailed overview. Task filters
must use their own estimated numerator. Keep source facts, raw grades, costs,
time and cache counters unchanged. Retain recorded outcome distributions and
confidence intervals inside a collapsed, clearly named recorded-analysis section;
do not calculate new confidence intervals from estimated grades.

1. Write regression checks that fail while Cline's main rate is 0%, including
   static/interactive output, 6/16 counts, chart, sorting and task scopes.
2. Add presentation-only pass values and apply them consistently. Keep the
   original values in the analysis input and method notes. No new dependencies
   or provider requests, and no modification to run.json.
3. Run report tests, typecheck, offline refresh/check/build and real-browser
   checks. Review, publish and verify the live primary value.

Verified locally: all 491 report tests pass. Typecheck, lint, refresh/check/build
and real Chrome checks pass. The main table shows 37.5%, six estimated passes,
and a 46.2% displayed pass score relative to best. The chart uses 37.5%; task
filters, pass sorting, static output and detailed overviews agree. The audit
and all seven original snapshot/source files are unchanged. Review found one
recorded-confidence section still open; it is now collapsed and explicitly
excludes estimates, with a regression observed red then green. The chart label
width now includes its estimate suffix. Publication verification follows deployment.
