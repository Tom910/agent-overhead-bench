# S7 — Activity export matches the price-book canonical model

The operator DeepSeek-only OpenRouter generation export bills
`deepseek/deepseek-v4.1-flash-20260910`. C4/C1 record the pin
`deepseek/deepseek-v4.1-flash`. `deepseek-v41-low-2026-09-10.json` already
declares that dated slug as `canonical_model`. They are one model.

Match Activity CSV rows against the pinned model **or** that book's
`canonical_model`. Do not prefix-match, and do not treat GLM Flash or any
other slug as the same model. C1 `modelIdentityMatches` stays exact on the
pin.

Earlier GLM 5.3 Flash work remains on the account and is outside this export.

## Verification

```text
npm test --workspace=@aob/report -- src/activity.test.ts
```

No spend, freeze, push, or CSV in git.
