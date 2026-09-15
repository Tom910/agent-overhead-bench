# S4 Claude WebSearch compatibility condition

Apply the maintainer-approved `claude-code-no-web-search` raw configuration
through AdapterRunOpts. Both host and container recipes add exactly
`--disallowedTools WebSearch` before the literal prompt separator. Default
recipes remain identical. Test option parsing and host/container argv parity
without provider calls; no dependencies. S5 will bind runner configuration.
