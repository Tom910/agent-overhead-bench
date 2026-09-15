# S4 literal prompts for Claude Code and Cline

Both pinned CLIs declare a positional prompt. Leading-hyphen Ink prompts
were parsed as options before any provider request. Put all existing flags
before an explicit `--` separator and pass the exact UTF-8 prompt after it.
Apply to Claude Code host/container and Cline container, in both conditions.
Remove transport-level trailing whitespace stripping. No new dependencies,
model settings, task content, or measurement changes.

Validate pinned CLIs in network-disabled containers with dummy credentials
and a loopback mock endpoint. Reproduce old option errors and show the fixed
invocation reaches the mock endpoint. Add failing exact-byte argv/parser
regressions first, then fix adapters and recipes. Run adapter tests and
workspace typechecking. Preserve all paid attempts without retries.

## Validation (2026-09-13)

The new regressions failed 12/16 before the fix and passed afterward; all 61
adapter tests passed. Pinned Claude Code 2.1.246 and Cline 3.0.61 containers
reproduced old `unknown option` errors, then reached loopback Messages/chat
mock endpoints with the literal leading-hyphen content after `--`. Containers
used `--network none`, dummy credentials, temporary homes and no task mounts.
The CLIs themselves trim trailing whitespace in their outgoing content; the
adapter now preserves the file bytes at the invocation boundary.
