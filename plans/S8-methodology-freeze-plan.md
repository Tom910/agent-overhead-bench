# S8 — Freeze METHODOLOGY as protocol (archive still unpublished)

The maintainer asked to stop calling METHODOLOGY a draft. This freezes the
protocol text to the 2026-09-14 DeepSeek campaign and the local fixture
pilot. It does **not** flip source-review flags, create `s7-freeze.sh`
output, or set `evidence/index.json` to `released`.

The private Activity CSV completeness gap is accepted in
[S7-activity-export-gap-exception.md](./S7-activity-export-gap-exception.md).

## Verification

```text
node scripts/s8-launch-check.mjs
node --test scripts/s8-readme-surface.test.mjs scripts/s8-launch-check.test.mjs scripts/methodology-terminology.test.mjs
npm test --workspace=@aob/report -- src/activity.test.ts
```
