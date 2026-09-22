# Bounded Luna subscription qualification, Linux

This is a short native tool-loop qualification, not benchmark task data. Each
client is allowed at most two actual provider requests. The five-client budget
is ten requests total; completed live slots are never repeated. No separately
billed API key is used. Subscription USD allocation remains unknown.

The route uses pinned CLIProxyAPI with both reviewed patches, a non-renewable
access-token snapshot, provider-bound C1 metering and the declared low-reasoning,
summary:auto, reasoning-replay-disabled condition. Native task containers receive
only a local capability. The original CLI cache and refresh token are untouched.

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
