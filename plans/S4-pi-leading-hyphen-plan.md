# S4 literal leading-hyphen prompts for Pi

The real Ink attempt failed before model traffic because its prompt begins `- Update` and Pi parses that positional argument as an option. Direct inspection of the pinned 0.73.1 package confirms no `--` sentinel support. Its supported piped-stdin path supplies literal prompt content, trimming outer whitespace.

For prompts whose first character is `-`, stage the existing trimEnd-normalized prompt under the private Pi home and redirect that file into `exec pi` with unchanged flags. Supply paths through positional shell arguments; never interpolate prompt text into shell code. Other prompts retain their existing argv route. Because redirected prompts begin with `-`, stdin's trim does not remove leading content.

No image, model, source, verifier or measurement change. Test literal transport of multiline leading-hyphen text including shell metacharacters and paths with spaces; preserve model flags and ordinary prompt behavior. Retain the failed Ink result unchanged. A corrected retry uses a new attempt identity and output directory.

Review caught that Docker translates the workspace mount and HOME but does not rewrite argv paths. The redirected path is therefore workspace-relative; staging still uses the host path. The regression test asserts the relative argv path and executes from the workspace directory.
