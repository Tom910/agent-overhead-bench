# S1 — Preserve response metadata integrity

Retain provider-independent parser fixes from the retired subscription experiment.
This changes observation only: forwarded request and response bytes remain intact.

- Detect SSE framing from a bounded prefix when Content-Type is missing, generic,
  or uses different casing. Handle split BOMs and split field prefixes.
- Take Responses stream identity from consistent observed metadata including the
  terminal response. Missing terminal identity, conflicting models, malformed or
  oversized events leave served identity unknown rather than guessing.
- Keep token counts independent from identity completeness. Do not introduce
  provider-specific admission limits, credential handling, or model overrides.

Validation: bounded capture/parser and real proxy HTTP stream regressions,
whole-body identity tests, full offline proxy suite and TypeScript checks.
