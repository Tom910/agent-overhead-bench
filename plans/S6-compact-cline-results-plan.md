# S6 — Compact Cline result presentation

The maintainer rejects the large verifier warning and asks for a proper result
display. Remove the warning box. Put the estimated value next to Cline's recorded
pass rate in the main table. Use a short method link and collapsed method notes
for the calculation details. Keep the estimate visibly labeled and preserve
recorded values, rankings, charts, intervals and all source evidence.

Use the approved per-run trace dossier to calculate an inline estimate for
each selected task scope. Never carry the full 6/16 estimate into a two-run
task selection. Static and interactive tables must agree. No new dependencies,
provider requests or changes to run.json or historical grades.

1. Extend publication tests for the absence of the warning box and for full
   and task-specific estimate counts. Keep native values and scores unchanged.
2. Add optional display annotations to existing site rows and render the same
   annotation with or without JavaScript. Move the explanation to collapsed
   method notes. Use one compact line in Markdown and detailed HTML reports.
3. Check report tests, typecheck, refresh/check/build, desktop/mobile and filter
   behavior. Review the changes, publish, and verify the live output.

Verified locally: 490 report tests, typecheck, lint and refresh/check/build pass.
Chrome checks pass on desktop and mobile, with JavaScript on and off. PSD,
Cattrs and Textual task filters show 2/2, 0/2 and 1/2 estimates respectively;
reset restores 6/16. Independent review found no material issue. The original
source and trace dossier bytes are unchanged. Publication verification follows
the deployment. A direct unit test of partial annotation input is deferred;
the pinned publication input covers all 16 runs and scope checks pass.
