# Bounded Luna subscription qualification, Linux

This is a short native tool-loop qualification, not benchmark task data. Each
client is allowed at most two actual provider requests. The five-client budget
is ten requests total; completed live slots are never repeated. No separately
billed API key is used. Subscription USD allocation remains unknown.

The route uses pinned CLIProxyAPI with both reviewed patches, a non-renewable
access-token snapshot, provider-bound C1 metering and the declared low-reasoning,
summary:auto, reasoning-replay-disabled condition. Native task containers receive
only a local capability. The original CLI cache and refresh token are untouched.

## Final outcome

All five native clients completed the tool loop on the same Linux host using the
Codex subscription snapshot. There were exactly **10 actual provider requests**,
two per client, with no repeated live slots. Four clients pass strict C1 model
identity and accounting checks. Codex remains accounting-unqualified, so the final
state deliberately records `all_five_native_loops_completed:true` and
`all_five_passed:false`; the qualifier exits 1 rather than admitting incomplete data.

| Client | Native loop | Provider input | Cached input | Output | C1 accounting |
|---|---|---:|---:|---:|---|
| Codex | Completed | Unknown | Unknown | Unknown | Original framing gap |
| Pi | Completed | 2,168 | 0 | 47 | Complete |
| Qwen | Completed | 40,790 | 19,968 | 73 | Complete |
| Hermes | Completed | 24,562 | 11,776 | 51 | Complete |
| Cline | Completed | 7,468 | 3,584 | 72 | Complete |

These are tiny transport probes with different native prompts, not performance
rankings or benchmark costs. Cached input is a subset of input. The eight fully
accounted provider responses total 74,988 input, 35,328 cached input and 243 output
tokens, with zero reported reasoning output. Subscription USD allocation remains
unknown. All eight responses proved exact served model `gpt-6-luna`; their safe
header observations show absent Content-Type and Content-Encoding. The framing
fix extracted SSE metadata despite those missing headers.

The exact live implementation is commit `1787f56`, additionally bound by the
source fingerprint in `final/state.json`. `final/source-manifest.json` reproduces
that fingerprint: all 64 tracked source entries match the commit; 22 additional
AppleDouble `._*.ts` files from an early Mac-to-Linux transfer were included in
the directory-based hash but were not imported/executed. Their hashes are retained
without publishing the metadata bytes. Removing those metadata-only entries gives
the clean commit-source fingerprint `f5be8f165c4f944e19f5340cc88afc6b6c33952f0a1382bcf5f04d4be1c847fc`.
Final raw C1 events, setting evidence,
one-use continuation receipt, and the original Codex copies are under `final/`.
`mock/final-passed-state.json` is the exact fresh offline proof used for live
admission. Credentials, local capability values, native homes and prompts are not
published. The temporary access-token snapshot was removed after collection.

Hermes wrote the relative marker under its isolated HOME, still inside the
mounted workspace. The original checker only checked the workspace root. Its
successful output was verified offline from the existing regular file; the
hash-bound receipt and pre-adjudication state are retained in `final/`. Neither
Hermes nor its provider requests were repeated. Its observation file also records
seven local front-relay refusals; their paths/reasons were not retained. These
were pre-provider refusals, separate from the two successful provider requests. Future qualifier prompts name
the absolute workspace path to avoid this ambiguity. That small later fix has a
focused regression test and requires a fresh mock receipt before future live use.

## First live Codex slot

The native Codex loop completed: it wrote/read the marker, returned that tool
output, finished with exit0 and made exactly two HTTP200 provider requests.
Original C1 usage and served identity are unknown. The checker stopped subsequent
clients instead of silently treating missing metadata as zero. See
`initial-codex/state.json`, the original hash-bound C1/observations, and separately
labelled native usage corroboration. No original record has been rewritten.

The bridge can parse SSE regardless of Content-Type; the original C1 parser used
a case-sensitive MIME check. Local fixtures reproduced metadata loss for missing,
mislabelled and mixed-case SSE content types. A bounded framing detector now fixes
that class of problem. Raw response headers/bodies from the first slot were not
retained, so its exact cause is unconfirmed. Transparent Go decompression is also
possible; a gzip fixture shows compressed bytes still pass through C1 with unknown
metadata. This qualification's subsequent phase explicitly requests identity
encoding and records only safe response MIME/encoding classifications.

The first slot used Codex 0.149.1. Its native totals were 15,620 input tokens,
6,656 cached input tokens and 65 output tokens. Those corroborating counters are
not substituted into C1 and do not prove served-model identity. Catalog discovery
listed exact Luna for the explicitly labelled compatibility version 0.155.1;
that query did not upgrade or relabel the native client.

## Evidence scope

All five native clients passed synthetic, fully metered tool loops with matched
reasoning settings before live execution. Mock attempts used no account allowance.
Early mock-only defects (private output ownership and Qwen content-array detection)
were corrected; their original private artifacts remain on the Linux host.

The continuation mechanism reserves Codex's two used requests, copies its original
failed accounting slot unchanged and admits only the remaining four clients. A
one-use claim binds the old evidence to one destination and implementation. Fresh
mock evidence is required for the changed source. A functional-loop outcome and
complete provider accounting are deliberately distinct; neither admits a full
benchmark campaign or establishes long-context compaction support.

## Verification

Independent review verified all ten provider attempts, the eight complete usage
records and totals, all event/sidecar/observation hashes, unchanged Codex records,
Hermes adjudication and the source manifest. The full local suite passed 892
package tests and 204 script tests, with 2 existing environment-dependent skips;
strict TypeScript, lint and report freshness checks passed. The later absolute
marker-path regression passed the nine focused qualifier tests. All engineering
checks and mocked native runs were credential-free; only the ten retained live
provider requests used account allowance. CI remains credential-free.
