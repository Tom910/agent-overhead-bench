# S5 CI: resolve the locally built parent image

The zero-spend image script builds `aob-base:s2`, then child Dockerfiles use it
as their parent. CI selected a separate `docker-container` Buildx builder and
loaded the base into the host Docker image store. That builder cannot resolve
the host-local tag and instead tries an unauthorized Docker Hub pull.

Reproduced on Linux with an isolated builder and validation tags: parent image
exists locally, but child build fails with `pull access denied` for that parent.
The normal Docker builder built the same base and all six children successfully;
the complete S5 image check and network-isolated version probes pass. No provider
calls, package upgrades or historical image replacement occurred.

Use the default Docker builder in CI and omit the incompatible remote-cache
configuration. Keep every image validation and proxy-route smoke gate enabled.
This trades cross-job cache reuse for a working local parent-image chain and
does not change measured container settings. Confirm the complete GitHub CI job
after the workflow change; source tests/types/site checks already pass.
