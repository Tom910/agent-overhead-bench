# Codex subscription integration: review and retirement

An independent review of the September 22–29 experiment found that its collection
and qualification were not reliable enough for a benchmark comparison. The
maintainer requested removal of unnecessary code and cleanup of its commit history.
The experimental subscription route is removed from the active repository.

The existing Codex CLI harness remains available through the ordinary API-backed
runner. The canonical 200-attempt Linux dataset, task definitions and website are
unchanged. No benchmark runs were made for this cleanup.

## What the review established

Three independent reviewers examined the architecture, earlier claims and retained
Linux artifacts. The experiment reused CLIProxyAPI rather than implementing a new
coding agent, and real tasks could succeed through the credential route. This does
not establish equivalence to another API route or explain the low task pass rate.

The surrounding campaign controller accumulated historical metadata exceptions,
state-specific recovery handlers and implementation-version migration rules. A
metadata guard first accepted seven probes and later stopped on eleven. Metadata
requests also entered model-budget accounting, and a terminal provider failure
was returned as a retryable local error. These were integration defects, not
proof that the credentials or model were inherently unusable.

The route also imposed experimental behavior beyond authentication: controlled
reasoning effort and removal of reasoning-history/continuation fields. The
matched Hermes comparison did not establish route parity: its Codex-credential
leg passed, while the OpenRouter leg exhausted its budget and lacked a completed
grade. Earlier assurances about readiness were therefore too broad.

The last pilot stopped at 33 scored slots out of 40: 12 passed and 21 failed.
Qwen's next saved patch passed all 96 feature tests and 561 regression tests, but
its native process exited with code 1. The controller rejected this combination
even though verification had already run. The retained native output was
incomplete JSON, so the underlying exit cause remains unresolved. Calling that
failure entirely outside the proxy, or offering verification-after-exit as a new
fix, overstated what was known.

These findings do not support a reliable general conclusion about Luna's quality
or hidden provider behavior. Existing attempts remain diagnostic evidence.

## What remains useful

- Immutable retry archives and candidate patches captured before verification.
- Provenance export for setup attempts that produced no measurement.
- Provider-independent response parsing for missing or inconsistent SSE headers.
- Conservative served-model identification when terminal metadata is missing or
  conflicts with earlier response events.
- General task-validity, measurement and analysis plans.

## What was removed

- Codex subscription credential preparation and third-party bridge patches.
- The custom subscription transport, qualification commands and runner hook used
  only by that route.
- Luna-specific campaign, recovery and no-solution adjudication scripts.
- Historical integration plans, qualification fixtures and active setup guidance.

The old published tip (`9ee584d`) and later unpublished diagnostic tip (`362b0e5`)
were preserved locally in backup references and a verified Git bundle before
history cleanup. Raw Linux campaign artifacts were not edited or deleted.
The complete private review and original transcripts remain local; no private
paths, credentials or conversation transcripts are published here.

A future subscription experiment would require a separate, bounded qualification
of the complete tool, stream and termination lifecycle and explicit disclosure of
semantic differences before a larger campaign. No such continuation is enabled by
this cleanup.
