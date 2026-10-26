# S6 — Build the page from one report document

The maintainer asks to reduce manual page work and build it from the report.
Use a generated, source-bound `report.json` as the page contract. It contains
the existing prepared population/task views, selected pass values and basis,
display scores, costs, labels, method notes and retained-attempt context.
Raw analysis, native grades and the approved trace-audit inputs stay intact.
This is one presentation of the existing measurement model, not a new one.

Interfaces:
- `buildPublishedReport(campaign, options)` prepares a serializable report from
  admitted campaign facts and optional bound per-run estimates.
- `renderPublishedReport(report)` renders the page using only prepared report
  values. The static table and browser payload use the same report views.
- `loadPublishedReport(root)` checks source bindings and exact reproducibility
  before admitting the report. Page build does not depend on saved HTML.
- `report:build` refreshes report artifacts and builds the site in one command.

1. Add tests before implementation: report generation and hash binding; page
   rebuilding after saved page files are removed; rejection of edited reports;
   an alternate estimate fixture changes every primary value without template
   edits; original measurements and historical render paths stay unchanged.
2. Separate trace-audit data loading from formatting. Derive all count/rate
   text from its per-run records; remove the hardcoded 37.5%/6-of-16 copy.
3. Prepare all page views once in the report producer. Reuse its overview rows
   for README and detailed report output. Remove text-replacement patches from
   page generation; provide report context through the renderer interface.
4. Make Pages render from `report.json`; add that safe artifact to downloads.
   Add the one-command build and use it in offline CI. No dependency or API key.
5. Run report and pipeline tests, typecheck, refresh/check/build, browser checks,
   and one independent review. Publish and compare live output with the report.

Review focus: forged report/provenance pairs; partial estimate inputs; source
preservation; direct report-to-page equality across scopes; static/interactive
parity; no manual result literals or hidden native/estimate divergence.

Status: implemented and verified offline. Pages uses `report:build` on main.

Verification:
- 498 report tests pass. Report typecheck and JavaScript/shell lint pass.
- Refresh, freshness check and report-to-site build pass without API calls.
- Eight original source/audit inputs match their prior committed bytes.
- All 20 build files and local HTML links pass validation.
- Desktop, 390px mobile and no-JavaScript browser checks pass. Embedded panels
  equal report.json; filters, sorting, charts and the report download pass.
- Independent review approved after a download-admission correction. Derived
  downloads are reproduced by the shared publication producer, so an edited
  download cannot be approved by changing its adjacent provenance hash.
- Script tests found a removed historical README link, now restored and checked.
  A Git timeout test stalled on the local host; its full suite passes on rerun.

The build generates report values and pages. It does not create new run evidence
or approve new trace estimates. Input admission and source review still apply.
