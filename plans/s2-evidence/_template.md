# S2 evidence: <tool>

```
date:
host: macos-docker-desktop | linux
cli_version:
exact_argv:
stdin: closed | pty
env_for_proxy:
auth_headless: api_key | ori_oauth | vendor_login_file | failed
ori: works | config_only | unsupported | not_tried
ori_writes:
proxy_chain: cli→proxy→openrouter | cli→ori→openrouter (bypass) | failed
protocol: anthropic_messages | openai_chat | openai_responses | other
fixture:
exits_on_complete: yes | hung | needs_pty
exit_codes:
tool_visibility: none | partial | full
tool_log_source:
subagent_inherits_proxy: yes | no | n/a
chatter_on_proxy:
decision: keep | pinned_only | default_only | drop
default_exclusion: keep | pinned_only | default_only | drop
drop_reason:
```

## Commands actually run

Paste exact argv, env, and a short outcome. Empty cells are not allowed; write `untested` or `failed`.

## Notes

Fairness deviations (extra flags, PTY, etc.) go here. S4 must copy `exact_argv` and `env_for_proxy` — do not "improve" them later.
