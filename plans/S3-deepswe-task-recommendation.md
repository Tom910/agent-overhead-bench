# DeepSWE task recommendation and license audit

**Audit date:** 2026-09-02  
**Source revision:** `0b9fabbb63b9104d678fe965e1632f2dd9eaa2ea`  
**Status:** maintainer-approved release-candidate shape; no task or source-review flag is approved

## Recommendation

The previous eight-task materialization was source-valid but not
composition-valid: it contained four Python and four TypeScript tasks, but only
one small repository and seven medium repositories. The official DeepSWE
validator requires at least two small and two medium repositories.

The maintainer agreed to use this release-candidate shape, replacing the
current TypeScript medium task `ts-pattern-match-each` with
`true-myth-iterable-collection-combinators`:

| Language | Recommended task IDs | Size | Native category |
|---|---|---|---|
| Python | `psd-tools-blend-range-api`, `cattrs-partial-structuring-recovery`, `textual-richlog-follow-state`, `tomlkit-toml-table-converters` | 4 medium | 4 `feature_request` |
| TypeScript | `ink-grid-box-layout`, `happy-dom-deterministic-intersectionobserver` | 2 medium | 2 `feature_request` |
| TypeScript | `superjson-error-stack-serialization`, `true-myth-iterable-collection-combinators` | 2 small | 2 `feature_request` |

This gives the required 4+4 language split and 2-small/6-medium size split
without relabelling any native category. The replacement is not yet approved:
True Myth previously timed out for both Codex and Hermes at the short bound, so
the next experiment must be an explicitly separate long-regime diagnostic. The
duration hypothesis used for that diagnostic is recorded in
`s3-deepswe-task-duration-recommendation.json`.

The first bounded diagnostic pair is therefore:

1. `aiomonitor-task-snapshots-diff` — Python, 79 pinned upstream files,
   Apache-2.0. Its pinned upstream revision is
   `b73fea2e0682803bda7531c93cd1dfb360839175`.
2. `true-myth-iterable-collection-combinators` — TypeScript, 74 pinned
   upstream files, MIT, source verifier polarity previously passed, but short
   calibration failed on both included CLIs.

`aiomonitor` is an exploratory reserve candidate, not part of the recommended
release list yet. It must first pass the same native verifier polarity check and
license-file capture before being considered for replacement. The no-spend
preparation and five-sample native polarity check now pass; the evidence is
retained in `s3-deepswe-recommended-candidates.json`. No qualifying paid
calibration exists. The subsequent Hermes long diagnostic timed out at 900 seconds with
unavailable final usage, so Codex was not started under the spend guard.

The structured selection, source audit, and license record now all point at
this same eight-task shape. This does not approve the source for S7: the
calibration and review flags remain false.

## License and provenance findings

- DeepSWE itself is Apache-2.0 at the pinned revision. The license applies to
  DataCurve's original benchmark contributions; its `PROVENANCE.md` explicitly
  says it does not relicense upstream repositories.
- The eight selected upstream repositories are all MIT. Their top-level license
  files were checked at the pinned upstream revisions and their SHA-256 values
  match `plans/s3-deepswe-license-review.json`.
- The proposed True Myth replacement is MIT at upstream revision
  `d8fbebc75de4991a32354518beff1abf628d0b07`; its top-level `LICENSE` SHA-256
  is `sha256:71e73518b145d77e68ffe83b7c42b1d3890dec591b6ef115a00825601c642c73`.
- The proposed aiomonitor reserve is Apache-2.0 at upstream revision
  `b73fea2e0682803bda7531c93cd1dfb360839175`; its top-level `LICENSE` SHA-256
  is `sha256:98397c300949e0cc1ddc68b0e48e67b10f2d0a4ffada4903d891a1315fe04156`.
- The source manifest records `source_dataset: swe-bench-ultra`. The repository
  currently permits only this exact DeepSWE-declared lineage as a narrow
  provenance exception; this is not permission to import unrelated benchmark
  tasks.
- The prepared Happy DOM workspace contains additional package-level LICENSE
  files, and Tomlkit contains a submodule LICENSE. A results-only publication
  can cite the source and revisions without redistributing those trees. If
  workspaces, patches, or verifier artifacts are distributed later, add a
  third-party notices bundle and retain every applicable upstream notice.

## Evidence table for the agreed release-candidate eight

| Task | Upstream license | Native polarity | Paid calibration status |
|---|---|---|---|
| `psd-tools-blend-range-api` | MIT | 5/5 reference samples passed | Flash failed; full GLM reached 42/45; GPT-5.6 Sol Codex and Hermes each passed 45/45 in diagnostic roots |
| `cattrs-partial-structuring-recovery` | MIT | 5/5 reference samples passed | Codex/Hermes long timeout |
| `textual-richlog-follow-state` | MIT | 5/5 reference samples passed | No qualifying two-CLI pass recorded |
| `tomlkit-toml-table-converters` | MIT | 5/5 reference samples passed | Codex/Hermes short timeout/quarantine |
| `ink-grid-box-layout` | MIT | 5/5 reference samples passed | Short timeout evidence; no qualifying pass |
| `true-myth-iterable-collection-combinators` | MIT | 5/5 reference samples passed | Codex/Hermes short timeout; no two-CLI pass |
| `happy-dom-deterministic-intersectionobserver` | MIT | 5/5 reference samples passed | Codex/Hermes short timeout/quarantine |
| `superjson-error-stack-serialization` | MIT | 5/5 reference samples passed | Codex/Hermes short timeout/quarantine |

The GPT-5.6 Sol Codex and Hermes controls prove that the PSD task and native
verifier are solvable through both measured paths under one model. They remain
diagnostic rather than canonical calibration because they used separate roots
and the frozen Flash price book could not record their spend. No other selected
task has a two-CLI pass. The list is therefore a provenance/composition
recommendation, not a release-ready suite.

## Remaining gates

1. Retain the no-spend preparation and polarity evidence for `aiomonitor` and
   True Myth from the same DeepSWE checkout; their exact upstream revisions,
   license files, file counts, image digests, and native verifier polarity are
   now recorded.
2. Make a deliberate model decision. Flash is below the demonstrated
   reliability threshold for the PSD task; full GLM improved substantially but
   still failed; GPT-5.6 Sol passed with Codex and Hermes. Before more paid
   cells, add dated pricing and model-eligibility evidence, then reproduce the
   two passes in one bounded calibration identity so the canonical attestation
   and recorded spend are complete.
3. The long diagnostic already failed at the first Hermes cell with
   unavailable spend. Keep it as negative evidence; do not retry the same
   Flash/task combination or extend the timeout without a changed model or
   declared study regime.
4. Before S7, update the structured review record and its binding only after
   source review, polarity, calibration attestation, and maintainer sign-off.
5. Keep the published headline as `Non-model share (fallback)` unless at least
   one tool has a complete local tool timeline; do not call that fallback
   `Harness share`.
