# S4 literal leading-hyphen prompts for Qwen

Qwen Ink attempts fail before provider traffic because the prompt begins
`- Update` and the adapter passes it as a separate argv element after `-p`.
The pinned Qwen 0.22.2 CLI uses a strict yargs parser with `prompt` declared as
a string option (alias `p`); a separate value beginning with `-` is parsed as
options instead. Its public help confirms the `--prompt` spelling, and its
exported `parseArguments` function returns the parsed prompt unchanged.

Use one argv element, `--prompt=<exact UTF-8 prompt file text>`, for Qwen in
both pinned and default conditions. Remove the adapter's `trimEnd()` so this
transport preserves newlines and trailing whitespace as well as leading
hyphens. Do not add a sentinel to the prompt, rewrite its content, invoke a
shell, or change model, output, auth, image, source, or verifier settings.

## Verification

1. Inspect help and the actual parser in the existing local `aob-qwen:s2`
   image with `--pull=never --network none`, no credentials, and no measured
   task mounts. Qwen's `parseArguments` export in its installed bundle is a
   parser-only boundary: invoke it directly without starting the agent.
2. In that same network-disabled image, reproduce the old separate `-p`
   rejection and assert that `--prompt=` preserves literal leading-hyphen,
   option-shaped, multiline, Unicode and shell-metacharacter input including
   trailing whitespace. Verify model, approval and output flags independently.
3. Add failing adapter regression tests first, verifying transport across a
   real argv boundary and exact reconstructed UTF-8 bytes for pinned/default
   conditions. Update the existing ordinary-prompt recipe expectation.
4. Apply the single transport fix in `packages/adapters/src/qwen.ts`, update
   the Qwen recipe in `packages/adapters/README.md`, then run adapter tests and
   workspace TypeScript checks. No dependency is added and CI makes no paid
   requests or Docker calls for these regressions.

Retain all earlier successful, failed and interrupted runs unchanged. This
fix applies to remaining unattempted Linux jobs; it does not authorize any
automatic retries or changes to paid artifacts. Commit only after parent
review. The Linux migration and host-separated reporting boundary remains in
[S7-linux-server-migration-plan.md](./S7-linux-server-migration-plan.md).

## Observed validation (2026-09-12)

The local image reports Qwen `0.22.2`. Its installed parser export is
`/opt/aob/npm/qwen/node_modules/@qwen-code/qwen-code/chunks/chunk-BAJKAAOY.js`.
Invoking only `parseArguments()` in child Node processes inside
`docker run --rm -i --pull=never --network none --entrypoint node aob-qwen:s2`
reproduced exit 1 and `Unknown arguments: " ", U, a, t` for the old separate
`-p` value. The attached value passed 10 cases (five prompts in both conditions),
with byte equality and model/yolo/output assertions. No agent execution,
provider credentials, task mounts, or network access were used in that smoke.

Before the implementation change, the new regression file had six failures
out of eight cases: four ambiguous-option failures and two trailing-whitespace
mismatches. After the change, `rtk proxy npm run test --workspace @aob/adapters`
passed all 45 tests, `rtk proxy npm run typecheck` passed every workspace, and
`rtk proxy git diff --check` was clean.
