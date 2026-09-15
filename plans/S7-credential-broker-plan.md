# S7 credential broker plan

Status: implemented and verified

## Goal

Keep the real provider credential in the runner/proxy process. Docker task
containers receive a sentinel credential and can reach the provider only
through the per-cell proxy route; the proxy replaces the sentinel or any
client-supplied authorization with the runner-owned upstream credential.

## Scope

- Add an optional runner-owned upstream credential to the proxy options.
- Make upstream requests and generation-usage lookups use that credential.
- Redact provider credential variables from Docker adapter invocation values,
  replacing them with a non-secret sentinel.
- Preserve host execution semantics, where the adapter is a trusted local
  process, while still pinning the proxy's outbound authorization.
- Add zero-spend tests for header replacement and Docker invocation isolation.

## Non-goals

- No new dependency.
- No live provider run is required to validate this stage.
- This does not claim a true live spend cap; that remains a separate control.

## Acceptance

1. A proxy configured with a runner credential never forwards a client-
   supplied authorization value upstream.
2. Generation lookup uses the runner credential as well.
3. Docker adapter invocation values contain no real provider credential for
   Claude, Codex, Hermes, OpenCode, Aider, or Qwen.
4. Existing mock integration, typecheck, lint, shell checks, and focused tests
   pass.
