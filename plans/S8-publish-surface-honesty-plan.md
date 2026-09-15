# S8 — Publish-surface honesty (no v1 freeze)

The maintainer asked to finish the repository for release after a 200/200
non-Claude campaign closeout. This plan authorizes making the public surface
honest and internally consistent. It does **not** authorize a v1 tag, official
archive, Activity freeze, courtesy notes, HN, or any claim that v1 has shipped.

## Goal

A stranger reading README.md and METHODOLOGY.md can tell what was measured,
what was not, and that official v1 remains unpublished. `npm test` and
`node scripts/s8-launch-check.mjs` pass on the default Mac `python3` (3.9) as
well as CI.

## Out of scope

- `scripts/s7-freeze.sh` / official archive
- Setting `official_release: true` or `evidence/index.json` status `released`
- Flipping source-review / calibration / maintainer-sign-off flags
- Pushing, tagging `v1`, GitHub Release, article, courtesy notes
- New metrics in C4 or a pooled campaign timing table

## Required public copy

- README keeps “not a capabilities leaderboard” and “Results are unpublished
  until the v1 dataset ships”.
- Campaign section is a labeled snapshot. Timing stays in the existing
  host/price-book report. README must not open with a per-harness native
  pass/fail ranking or operator account balances.
- The first `| Harness | vX.Y |` table remains the local-fixture **pilot**
  table so `s8-publish-pilot.mjs` still splices the correct rows.
- METHODOLOGY stays a draft, still says this draft has no v1 measurements,
  describes the DeepSeek campaign as a snapshot, and matches the declared
  tool scopes.
- CONTRIBUTING can dispute a campaign slot via `summary.json` `run_id` and
  hashes, without implying published `run.json` files exist.
- `evidence/index.json` stays `pilot`, keeps the fixture archive, and adds
  checksummed campaign summary/report artifacts. Pilot republish must not
  drop those extra artifacts.
- Python recovery scripts remain compatible with Python 3.9 (`python3` on
  macOS Command Line Tools).

## Verification

```text
node scripts/s8-launch-check.mjs
node --test scripts/s8-readme-surface.test.mjs scripts/s8-publish-pilot.test.mjs scripts/s8-launch-check.test.mjs scripts/methodology-terminology.test.mjs scripts/independent-harnesses.test.mjs scripts/recovery-budget.test.mjs
npm test
npm run typecheck
npm run lint --silent
```

No provider spend. No freeze. No push.

## Verified outcome

README, METHODOLOGY, CONTRIBUTING, and `evidence/index.json` now describe an
unpublished snapshot. `npm test` passed (158 script tests, 2 skipped; all
workspace tests). Launch check reports `status: "pilot"`. Default macOS
`python3` 3.9 harness/recovery tests pass.

Linux cells ran on the dedicated Linux measurement host. Raw selected
C4/C1 files remain in private `scratch/` trees. There is no Activity CSV
and no official freeze archive. `official_release` stays false.
