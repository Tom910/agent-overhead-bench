# S5 — Luna Linux image restoration, September 24

The host pruned the frozen task images. Existing measured attempts and their
original image identities remain immutable. This restores a new environment
generation; it does not recreate or relabel the old image bytes.

1. Use the clean Linux implementation checkout at `bbbcf820c12c7df73d3c743d1edcaf5066126425`
   and retained DeepSWE checkout `0b9fabbb63b9104d678fe965e1632f2dd9eaa2ea`.
   Build only Cline, Codex, Hermes, Pi and Qwen with existing prerequisite scripts,
   pinned versions, lockfiles and base digests. No model calls or credential reads.
2. Run existing `prepare-deepswe-calibration.sh` for the same eight selected tasks
   into private `scratch/luna-images-20260924/tasks`, preserving extended regime,
   10800-second timeout and retained expected-minute ranges. Keep private durable
   build logs and supervisor state. Do not modify old prepared tasks or evidence.
3. Require all five source-owned reference samples per task to pass. Compare
   prompt bytes, upstream/workspace revisions, task duration metadata, verifier
   command/workdir/network and task identity with the old preparation. Record
   actual new image IDs and all material environment differences.
4. Create stopped retention containers referencing every rebuilt image; leave
   unrelated host cleanup policy unchanged. Check disk capacity, export all new
   image IDs plus the pinned bridge runtime through one deduplicating `docker save`
   archive, hash actual bytes and retain a private archive manifest. Do not claim
   preservation until the archive exists and its SHA-256 has been computed.
5. Hand verified preparation and archive evidence to the separately owned S7
   cohort-migration gate. This work does not resume paid execution or rerun any
   measured attempt. No new npm dependency, measurement field or grader change.

The prerequisite checks verify retained CLI pins (Codex 0.149.1, Hermes 0.20.5,
Cline 3.0.61, Pi 0.73.1, Qwen 0.22.2). Source-owned reference execution is offline
verification, not a new measured benchmark attempt. Rebuilds can resolve changed
OS/dependency bytes despite retained pins; the new IDs disclose this limitation.

The pinned runtime-image constant is now exported for S7 preflight to reuse;
its value and transport behavior are unchanged, and five transport tests pass.

Completed on Linux, September 24, without inference:

- All eight preparations completed; all 40 source-owned reference solution
  samples passed. Prompts, upstream/workspace revisions, durations and final
  verifier commands/workdirs/network modes match the retained generation.
- All 40 final task images passed offline CLI version probes against the five
  retained pins. S7 separately gates full prepared-workspace equivalence and
  migration; this restoration does not authorize measured-attempt repetition.
- All 63 image IDs (56 task/environment/verifier images, six prerequisites and
  the pinned runtime) have stopped retention containers, independently checked
  for exact image identity, created state and network `none`.
- The private archive contains 17,974,354,432 bytes, mode 0600. SHA-256 was
  independently recomputed as
  `9073449df62557f437c13d3b23eea943d681c7500d4f113b3f0cc932a12ba8f8`.
  All 63 archived configuration hashes match the intended image IDs. Free space
  before export was 660,563,881,984 bytes; the conservative unshared image-size
  estimate was 176,984,687,698 bytes.
- Private proof: `scratch/luna-images-20260924/restoration.json`, SHA-256
  `193beaa7263d0211ae27abf49c99becf6a4eb0f3a4adc378b593bd1f2c523498`.
  New suite file SHA-256:
  `d00b7a450cdcec702efbe05df29a46cec93eeb16f4f8a62f795e384825fb5bb1`;
  canonical source manifest SHA-256:
  `b3a3ac2ee027d8f4fe1853faf0c3840901b2242a0e318a13dad118500fa6e2c2`.

The independent supervisor review approved old-root immutability, pin and
behavior checks, reference gates, retention and actual archive verification.
This is a newly built environment generation, never an assertion that its image
bytes match those lost by the host cleanup.

Final provenance correction: current preparation initially selected the newer
review artifact, while the frozen generation binds the original pending review.
The exact original review bytes (SHA-256
`29d67fc9039d9e771dec8d54ad91d660a6b896ad9b77546c0b271f6316812a38`)
were copied into private `provenance-preserved-review/original-review.json`.
The initial new manifests were archived there before preserving the original
review objects in both new manifests and recomputing their source binding. No
review flags were upgraded and no comparison gate was relaxed. Image, archive,
reference and version evidence is unchanged; no checks or model runs repeated.

The initial `restoration.json` remains byte-for-byte unchanged. The final proof
is `scratch/luna-images-20260924/restoration-preserved-review.json`, SHA-256
`611e48f6e282395e8b36b53e3476ff948fb3af87cfb9ec5aa4efffbb8f5ba43c`.
Final suite SHA-256:
`a0c8a676da5b9b75a6791d71b0eb58a7ef250f4aa4df793bff9ee9d778f03f6a`;
raw source manifest SHA-256:
`aa62303b647a73440de86016a05e5323b9a09c8410c8d75fac1761017162ecbf`;
canonical source manifest SHA-256:
`ddf41abc0fdcd778f5bcecbfefad556c10b28f528288ac66f4449a1f557322ca`.
