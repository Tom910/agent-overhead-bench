# S2 evidence: pi

```
date: 2026-08-26
host: macos-docker-desktop
cli_version: failed
exact_argv: failed
stdin: closed
env_for_proxy: failed
auth_headless: failed
ori: not_tried
ori_writes: failed
proxy_chain: failed
protocol: failed
fixture: failed
exits_on_complete: failed
exit_codes: failed
tool_visibility: failed
tool_log_source: failed
subagent_inherits_proxy: failed
chatter_on_proxy: failed
decision: drop
default_exclusion: drop
drop_reason: CLI not on PATH; Q1–Q3 not run
```

## Commands actually run

`command -v pi` → failed (not found)

`command -v ori` → failed (not found). Ori-vs-native skipped.

OPENROUTER_API_KEY was set in gitignored `.env` for this session; PATH still lacked `pi`.

## Notes

Re-probe after installing `pi`. Do not copy argv into S4 from this file.
