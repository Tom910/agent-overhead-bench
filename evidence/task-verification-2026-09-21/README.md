# Offline task verification revision

**Four Textual attempts change from fail to pass under the corrected verifier:**
Codex repetitions 0 and 1, Pi repetition 0, and Qwen repetition 0. The corrected
verifier accepts public class-based event subscriptions while preserving the
existing behavioral assertions. Original campaign results remain unchanged.

| Task | Historical attempts inspected | Original-image replays | Verification change |
|---|---:|---:|---|
| SuperJSON error stack | 25 | 11 | Prompt clarified; historical grades unchanged |
| Ink grid box layout | 25 | 9 | Prompt clarified; historical grades unchanged |
| Textual follow state | 25 | 13 | 13 corrected replays; four additional full passes |

Every one of the 33 replays reproduced its historical regression/feature grade
before any verifier amendment. All three reference solutions passed on retained
Linux verifier images; pristine implementations failed. A deliberately broken
Textual reference with event emission disabled still failed the amended verifier
(14/20 feature tests), while its intact reference passed 20/20.

This is a **separate, partial-coverage verification revision**, not a replacement
200-run campaign. No model calls or new agent attempts were made. Costs, token
counts, run selection and original outcomes were not modified.

## Evidence and limitations

[audit.json](audit.json) binds all 75 inspected attempts to canonical run hashes,
hashes the original verifier logs, identifies actual replay images and recovered
patches, and records original and corrected grades. [provenance.json](provenance.json)
hashes the audit. [Task amendments](../../task-revisions/2026-09-21/README.md) bind
reviewed source bytes and preserve upstream lineage.

The original verifier kept temporary patches inside disposable containers.
Those patches did not survive. Replays instead use recovered effective patches
from retained post-verification workspaces, excluding paths overwritten by the
hidden test patch. The recovered patches reproduce historical grades; this is
strong behavioral evidence, not a cryptographic attestation that workspace
bytes were unchanged since the original run. Raw logs and recovered patches are
retained privately on the Linux host under `scratch/task-contract-revision-20260921`.

Exact original verifier images remain available for 33 attempts. Three older
image identities needed by the other 42 attempts are unavailable; we did not
substitute rebuilt images or invent corrected grades. Historical SuperJSON and
Ink agents did not see the new prompt clarifications, so their failures remain
flagged as contract-ambiguous rather than retroactively passed.

The Hermes Ink repetition 2 storage failure remains an unsuccessful end-to-end
attempt, with its full cost retained. Its audited cause is session-storage failure,
not evidence of inability to implement the task. The exact storage cause is unknown.

## Reproduction

Materialize the amended verifier using the command in the task amendment README.
On Linux, with an existing exact verifier image and retained recovered patch:

```sh
python3 task-revisions/2026-09-21/replay.py \
  --image sha256:6c43ffe7837bea49f812f13adf8d5cd8a953d38ac3f8e2b97dfacc9f7bf4634b \
  --patch /path/to/retained/model.patch \
  --amended-test-patch /path/to/materialized/test.patch \
  --output /path/to/new/audit-directory
```

Omit `--amended-test-patch` to reproduce original verification. The script rejects
mutable image tags and an existing output directory, disables network, applies
2-CPU/4-GiB/240-second audit limits, and records grades and hashes. Its exit status
indicates verifier execution integrity; inspect `grade.reward` for task success.
These audit resource limits do not claim to describe historical campaign limits.
