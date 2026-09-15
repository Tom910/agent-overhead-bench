# S0 raw tool compatibility configuration

The maintainer explicitly approved disabling WebSearch for separate Claude
recovery runs. Add optional raw C4 `tool_configuration` with the single
supported value `claude-code-no-web-search`. It records a launch condition,
not a derived metric. Reject it on other tools. Bind it to measurement
identity so these records cannot replace or merge with default-tool records.
Legacy records retain absence unchanged. Update strict runtime validation
and JSON Schema together; tests cover accepted/rejected and legacy identity.
Subsequent S4/S5 stages apply and bind the actual CLI option; S6 separates
report groups; S7 rejects it from the existing unchanged official profile.
No dependency or new measurement model.
