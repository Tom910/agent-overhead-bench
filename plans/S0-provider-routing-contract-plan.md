# S0 raw provider-routing identity

Status: implemented; 41 contract tests, typecheck, and independent review pass.
Follows verified S1 exclusion support.

Record optional `provider_routing: { ignored_providers: string[] }` in C4 as
raw execution configuration, never as a derived metric. A present exclusion
list must be nonempty, sorted, unique, and consist of lowercase provider IDs.
Keep old C4 artifacts and their measurement identities unchanged when absent.
Include a present policy in retry/replacement measurement identity so routed
and unrouted attempts cannot be substituted. Extend the JSON Schema and typed
validator together; add no dependency and do not change usage invariants.

Verify legacy acceptance, routed identity separation, schema shape, and refusal
of malformed/ambiguous policy. S7 will wire the policy through the runner and
validation after this contract stage is complete.

## September 9 single-provider extension

Maintainer approved pinning Z.AI after five sequential cross-protocol probes
passed. Extend the existing exclusion policy with an optional `only_provider`
endpoint slug and paired `allow_fallbacks: false`. Both must occur together;
reject invalid slugs and pins covered by an exclusion (including base IDs).
Keep legacy policies and identities unchanged. No dependencies or metrics.
Verify validation, cloning, and identity separation before S1 implementation.
