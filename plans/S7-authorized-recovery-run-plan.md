# S7 authorized infrastructure recovery

The maintainer now explicitly authorizes fresh attempts for interrupted or
infrastructure-blocked slots; completed native failures remain final. Keep
all previous C1/C4/ledgers unchanged. Run the recovery on Linux, with distinct
outputs, session/run IDs and source-attempt mappings. Replacements of Mac
slots are Linux measurements and cannot be pooled into Mac timing medians.

A new Claude smoke passed CLI/native verification with four identified
successful requests and one known pre-inference title rejection. Provider
records exactly matched its $0.008505588 token estimate. That is a short
protocol check, not proof of full-task cost efficiency. Admit one Claude Ink
recovery task with a $0.75 observed account-increase ceiling before deciding
on more Claude work. Preserve its actual native timeout and all model/tool
conditions; the external spending guard may interrupt it if needed.

Global account ceiling remains $63.63381808, with the existing $0.10 reserve,
including diagnostic spending. Reuse the tested independent scheduler's
one-second credit evidence scan, bounded account/power supervisor and durable
stops. The pilot's balance callback additionally returns the smaller of
remaining global funds and remaining per-cell allowance. Existing margin
therefore stops the $0.75 pilot near $0.65 observed usage. No new dependency
or second measurement model. Account-based controls remain supervisory and
provider billing can settle after a stop.

Use existing variable-pricing/unavailable-estimate behavior as authorized:
`openrouter-2026-09-04` has no selected-model rates, so static cost remains
null pending retained provider charge lookup. Preserve raw usage and native
results. Do not restart terminal attempts automatically after a stop. Run
seven supplemental native verifiers without inference before the paid pilot;
these cannot repair missing model identity by themselves.

## Immediate identity stop

Recovery job definitions may declare `expected_model`. The existing bounded
C1 supervisor must then stop on the first successful model POST with absent
or different requested/served identity. This is an early operational stop
using the same exact identity requirement as the final validator; it never
invents served identity, changes C1, or relaxes eligibility. Non-model
metadata and non-2xx responses retain existing handling. The option is off
for historical configs, preventing changed definitions on retained jobs.
Test missing/wrong identity, normal matching responses, known pre-inference
rejection, default-off behavior, and live child termination before deployment.

## Observed progress (2026-09-14)

The optional identity supervisor passed the no-spend scheduler suite and
independent review. A per-cell budget callback was independently reviewed
and hardened against non-finite baselines before deployment. Source commit
`74dbc334` is deployed on Linux. The native Claude Ink pilot reproduced
`model_served: unknown` at C1 seq12, immediately after a WebSearch tool call.
The supervisor stopped on that first bad response. The provider generation
record again contains the canonical name but empty/zero native usage and
charge metadata, so it cannot repair identity evidence. No further Claude
retries are admitted pending a separately approved tool-compatibility change.

Seven retained Claude outputs received separate no-inference verification:
five native passes and two failures. Originals remain unchanged, and served
identity remains unresolved. Two Codex outputs also have missing terminal
tool events despite completed agent turns; separate native verification is
queued until paid jobs are quiescent. No synthetic tool durations are added.

Eighteen non-Claude retries are running under
`scratch/infra-recovery-linux-20260914`: Qwen6, Pi1, Codex1, Cline10. The
separate root binds original slot identities to replacements and records
Linux host identity for replacements of Mac attempts. Each job opts into
identity supervision. The same account ceiling and $0.10 margin remain;
per-cell allowance is $1.50 ($1.40 observed before margin stop). The private
pre-recovery analysis is in `scratch/current-results-analysis-20260914/`.

## Maintainer correction: finish the non-Claude campaign

The maintainer clarified that the previous closeout was premature and asked
for continued work until completion. Resume the fourteen pending non-Claude
jobs under the unchanged cumulative $63.63381808 ceiling (remaining $5.6243
at restart). Claude remains excluded/unresolved. Keep completed native
failures final. After this queue, fresh separately identified retries may
recover two interrupted Qwen slots and two Codex slots whose original tool
streams were incomplete; their supplemental verifier outcomes do not repair
original measurement evidence. Preserve original attempts and host identity.
Do not claim completion merely because a background service has started.
