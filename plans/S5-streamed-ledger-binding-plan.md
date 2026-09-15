# S5 streamed result binding

Pi's real TOMLKit attempt passed native verification but final ledger binding called `readFileSync` on its 2.28 GB stdout log and failed with `ERR_FS_FILE_TOO_LARGE`. Preserve the successful C4 and original unclosed ledger as evidence; do not rerun the successful task merely to repair metadata.

Hash artifact bytes incrementally in bounded buffers. Keep the exact SHA-256 entry ordering and digest encoding, including existing run-id parsing from C4 and workspace/symlink rules. File descriptors must close on errors; errors remain typed. No new dependency, derived metric, timing change, or altered raw evidence.

Verify the binding cannot read log files wholesale, matches the previous digest on normal files, and handles the real >2 GiB log. Run runner window tests and TypeScript checks before using the updated code for subsequent independent cells. Historical closure is not backdated.

Verified: 23 window/binding tests and TypeScript checks pass. Incremental Node binding also agrees with an independent Python SHA-256 calculation on the real 2.28 GB log. Review preserved single-read C4 hash/run-id coherence. Original TOMLKit C4 and unclosed ledger remain unchanged.
