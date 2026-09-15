# S6 — Static HTML report fidelity

**Status (2026-08-27):** implemented and verified with the focused S6 report
tests, the full workspace suite, strict typechecks, lint, shell syntax checks,
and `git diff --check`. Maintainer visual review remains a publication gate.

## Goal

Make the generated S6 HTML report communicate visibility limits in a
screenshot- and `file://`-safe way. When tool and harness time cannot be
separated, the residual non-model segment must be visibly hatched rather than
looking like an observed solid measurement. Charts must have a labeled static
container and remain free of client-side dependencies.

## Contracts consumed / produced

- Consumes: `DerivedRun`, visibility-aware stacked segments, and the existing
  markdown report renderer.
- Produces: the same README markdown and raw C1/C4 data; only `index.html`
  presentation changes. No derived metric is added to `run.json`.

## Acceptance tests written before implementation

- An incomplete-visibility stacked bar uses its hatch pattern on the
  `non_model` residual segment.
- A fully observed stacked bar keeps solid startup/model/harness/tool segments.
- Generated HTML contains a labeled charts section, a legend explaining the
  hatched residual, and no external stylesheet, script, or network URL.
- Each timing and cost SVG has an accessible, escaped label identifying its
  tool and chart meaning.
- Existing markdown links, tables, cost bars, and `file://` rendering remain
  valid.

## Implementation

1. Extend the internal bar-segment representation with an explicit
   `pattern` marker for residual segments.
2. Render incomplete residuals with the existing per-chart SVG pattern.
3. Wrap generated SVGs in a static HTML chart section with inline CSS and a
   concise legend.
4. Add accessible labels/titles to each generated SVG without trusting report
   text as markup.

## Out of scope

Changing derivation math, visibility classifications, report columns, adding a
charting dependency, client-side JavaScript, or changing raw artifacts.

## Human review

The maintainer should confirm that a screenshot reader cannot mistake a
hatched residual for measured harness/tool time.
