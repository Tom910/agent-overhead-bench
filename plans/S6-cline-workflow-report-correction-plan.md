# S6 — Show the Cline verifier correction and its evidence limits

The maintainer asks whether the report now shows the corrected results. The
source checker is fixed, but the report still shows the original observations.
Update the generated report and interpretation with an independently checked
trace estimate, without replacing native grades or immutable source facts.

The original pre-verifier Git metadata was overwritten. An exact retrospective
workflow regrade is unavailable. The six possible passes must be labeled a
trace estimate, not corrected native passes. The original 0/16 remains the
recorded verifier observation, and must be marked as affected by the defect.
Costs, model/cache counters, times, outcomes, cohorts and account data stay intact.

1. Independently audit all 16 native assertion sets and retained command traces.
   Save a compact public-safe dossier with source hashes and final-state limits.
2. Add a pinned supplemental audit input to the S6 publication owner. Show the
   same correction notice on the website, detailed HTML/Markdown, README and
   interpretation. A six-pass estimate means 37.5%, if supported by the audit.
   Explain that only eight code-assertion sets passed, and two of those retain
   real commit failures. Show no new native grade or aggregate pass count.
3. Add regression tests before the renderer change. Check that presentation
   labels the estimate, detects dossier edits, and keeps all original source
   bytes. Add only the safe dossier to the Pages download allowlist.
4. Run report tests/typecheck, offline refresh/check/build, inspect the rendered
   pages, obtain independent review, and record the results. No provider calls.
5. Project only these report changes into the existing narrow publication
   checkout. The maintainer's request to post results and this follow-up permit
   updating the report. Publish and verify the live pages with the original
   six inputs unchanged. No engineering history, private logs or prompts are
   part of that projection.

Verified implementation: the independent audit supports a conditional six-pass
estimate and no exact regrade. The public projection passes 490 report tests,
28 checker tests, typecheck, lint, refresh/check/build and Chrome desktop,
mobile, filter and no-JavaScript checks. The larger engineering report suite
passes 541 tests. Independent review found no material issue. Its remaining
wording concern was reproduced by a failing regression and corrected. All six
source inputs plus source.json match the publication base bytes. The reviewed
projection is ready to publish; live verification follows the Pages deployment.
