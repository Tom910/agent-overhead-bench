# S7 compatibility release boundary

Existing campaign validation/archive profile supports default tools only.
Reject toolConfiguration in its definition and tool_configuration in C4,
even if both agree. Private report generation remains available. Tests cover
both forged promotion and isolated C4 variant. No dependency changes.
