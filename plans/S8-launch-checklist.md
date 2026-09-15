# S8 — Publication + launch checklist

> **For agentic workers:** This is a launch protocol, not a feature. Do not post numbers that are not on the frozen `v1` tag.

**Implementation status (2026-09-14):** launch scaffolding is present and the S7 archive command plus no-network `scripts/s8-launch-check.mjs` are available. The 200-slot non-Claude campaign is a labeled unpublished snapshot. Publication of v1 is correctly blocked until a reviewed frozen dataset exists. Positioning README, CONTRIBUTING, METHODOLOGY draft, MIT LICENSE, and no-spend CI are present. No v1 numbers, article, HN post, or courtesy notes are fabricated.
The local evidence index and single-cell command documentation are also present;
they contain no publication claims or external URLs until the human launch work occurs.

**Goal:** Ship the public artifact: README + METHODOLOGY + v1 dataset + flagship article + maintainer courtesy notes + distribution.

**Architecture:** Source may already be public. S8 publishes *claims*: the table, the article, the release.

**Tech Stack:** GitHub Release `v1`, amarchenko.dev, existing social channels.

**Spec:** North-star §7–§8, roadmap S8.

## Global Constraints

- Inherited from `plans/README.md`.
- README opens with positioning, then the headline table. Not a capabilities leaderboard. Not Vetta. Not Terminal-Bench. The selected public source and regime (short 1–5 minute or long-horizon) are named explicitly.
- Courtesy notes to every measured-tool maintainer **before** HN.
- Keep launch copy within the approved vendor scope.
- Do not predict stars, traffic, or coverage.

## Contracts consumed / produced

- Consumes: frozen `v1` report + METHODOLOGY.
- Produces: public README, CONTRIBUTING (correction path), launch posts, dated local archives of URLs and screenshots.

## Out of scope

Changing v1 numbers. New tasks. New tools (those are the next monthly run).

## Human review (required)

Maintainer writes/edits the flagship article and sends courtesy notes. Tone: here is the data, here is how to correct us.

## Risks

| Risk | Mitigation |
|---|---|
| HN files this next to Vetta | Positioning paragraph above the fold |
| Maintainer dispute | Raw JSON + pinned versions + CONTRIBUTING cell-reopen rule |
| Publishing dry-run numbers | Only the `v1` tag |

---

### Deliverables

- [x] README: positioning paragraph + unpublished headline table skeleton + link to METHODOLOGY (no v1 numbers)
- [x] METHODOLOGY.md protocol freeze (2026-09-14 campaign + fixture pilot); official archive still unpublished
- [x] MIT LICENSE (from S0)
- [x] CONTRIBUTING.md: how to dispute a number; what evidence reopens a cell
- [ ] `v1` GitHub Release attached — blocked (no dataset)
- [ ] Flagship article live on amarchenko.dev — blocked (maintainer)
- [ ] Courtesy notes sent to maintainers of every measured tool **before** HN — blocked
- [ ] HN, Telegram, dev.to, X/LinkedIn — blocked
- [ ] One outlet pitch (InfoQ / The New Stack) — blocked
- [ ] Monthly re-run schedule announced in README — blocked until v1
- [ ] Dated archives of launch URLs — blocked

### Courtesy note template

```
Subject: Independent timing/cost measurements of <tool> (draft, correction path)

We ran <tool> <version> on a selected public coding-task suite with a pinned
OpenRouter model and a local logging proxy. This is not a capabilities
leaderboard.

Draft table: <url>
How to dispute a cell: <CONTRIBUTING url>

Happy to re-run a cell if you have evidence we mis-invoked the CLI.
```

### Acceptance

Checklist complete. A stranger following the README can rerun a **single cell** against one tool (API key required; cost warned).

Local acceptance checks for the launch scaffolding are:

- `evidence/index.json` is valid JSON and records only pending external artifacts.
- `node scripts/s8-launch-check.mjs` passes without network access and rejects
  any claimed artifact while the evidence ledger is pending.
- `scripts/run-all.sh --help` and the README show a bounded single-cell shape and an explicit spend warning.
- No release, article, courtesy note, or URL is represented as complete before the frozen dataset and human review exist.

## After S8

Monthly re-run: current tool versions, new date stamp, changelog post. Same protocol as S7 at smaller social volume.

### Follow-up corrections (2026-08-27)

- [x] Launch wording uses selected pinned public tasks, matching the design and
  roadmap source policy.
- [x] README preparation commands run through the workspace package entry points
  after a normal `npm install`.
