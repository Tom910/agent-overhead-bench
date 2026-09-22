# Comparison conditions for the selected Linux campaign

This manifest records selected model/provider settings, harness versions, agent
and verifier image identities, and declared task networking. Missing historical
request settings, enforced resource/network controls and cache policy are null.
They are not filled from today's source code or treated as equal defaults.

`conditions.json` is an allowlisted extraction of all 200 selected original C4
files. Each original file's SHA-256 matched the canonical analysis before
extraction. `provenance.json` binds the published manifest bytes. The current
publisher checks run identity, model, harness/version, routing, task base and
verifier image against canonical analysis, and reports remaining unknown or
different controls. Agent image hashes are extraction evidence: the historical
analysis export did not contain them, so that cross-check alone cannot reconcile
them. Recheck every extracted field against private original C4 files with:

```sh
node scripts/s6-check-condition-extraction.mjs \
  evidence/linux-conditions-2026-09-21/conditions.json \
  scratch/usage-replacements-20260919/replacement-export/engine-input
```

The raw parent directory must contain one child directory per selected attempt,
each with the original `run.json`. The check rejects missing/duplicate runs,
changed raw hashes and any changed extracted field, including agent images.
It never calls a model. The original files remain private; artifact hashes alone
are not substitutes for raw-file field reconciliation.

The campaign is **not a fully controlled comparison**. One host and model ID do
not establish identical reasoning settings, server-side model revisions,
resource headroom, provider load or cache state. Different harness prompts,
tools and context strategies remain the behavior being measured. These limits
qualify interpretation; they do not invalidate the observed token counters.
