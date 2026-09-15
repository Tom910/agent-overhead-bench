# S3 — Maintainer sign-off of DeepSWE review flags

The maintainer approved all four flags in `plans/s3-deepswe-review.json` on
2026-09-15. This records that attestation. It does not invent a two-CLI
calibration summary, put Activity CSV in git, run `s7-freeze.sh`, or set
`evidence/index.json` to `released`.

`calibration_complete` is attested from the 200-slot DeepSeek native-outcome
campaign (Cline, Codex, Hermes, Pi, Qwen). That is a maintainer policy
exception to the original two-CLI short-regime gate. Official freeze still
needs a portable attestation file if `s7-preflight.sh` is run without
`AOB_VALIDATION_ONLY`.

## Verification

```text
node --test --test-name-pattern="keeps DeepSWE review evidence" packages/tasks/src/source.test.ts
node scripts/s8-launch-check.mjs
```
