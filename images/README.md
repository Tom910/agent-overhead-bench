# Container images

Shared base plus **one image per CLI**. Do not install coding-agent CLIs on the Mac host. The Node base image is pinned by digest in `base.Dockerfile`; tool image tags are only local build labels and S7 records the resolved image digest in C4.

```
docker build -t aob-base:s2 -f images/base.Dockerfile images
# Build the six S2-pinned adapter images after the base image:
docker build -t aob-claude-code:s2 -f images/claude-code.Dockerfile images
docker build -t aob-codex:s2 -f images/codex.Dockerfile images
docker build -t aob-hermes:s2 -f images/hermes.Dockerfile images
docker build -t aob-aider:s2 -f images/aider.Dockerfile images
docker build -t aob-opencode:s2 -f images/opencode.Dockerfile images
docker build -t aob-qwen:s2 -f images/qwen.Dockerfile images
AOB_MODEL=z-ai/glm-5.3-flash scripts/s2-docker-probe.sh claude-code  # also: codex, hermes, aider, opencode, qwen, goose, pi
```

The dependency-free `scripts/s5-build-images.sh` command builds and validates
the base plus all six selected images. CI supplies a BuildKit cache; S7 uses
`scripts/s5-build-images.sh --check` so an official window never builds or
pulls an image unexpectedly.

For a disposable S2 probe, set `AOB_S2_SKIP_BUILD=1` to reuse an already-built
image after the same version/entrypoint/credential checks. This is useful when
Docker Desktop cannot allocate temporary build space; it does not bypass image
validation.

The Node images install their CLIs with checked-in `npm-locks/*/package-lock.json`
files via `npm ci`. Aider and Hermes install exact-version, SHA-256-verified sets
from `python-locks/*.requirements.txt` with `pip --require-hashes`. Hermes also
pins its `setuptools` build backend and disables build isolation for its local
editable install, so that step cannot resolve an untracked build environment. The
Hermes image pins the exact source commit
corresponding to S2 version 0.20.5 because that version is not published as a
package release; its codeload archive is checked by a committed SHA-256 before
installation. Optional integrations are not part of the S2 adapter path.

The probe starts the dump proxy **inside** the container (CLI → 127.0.0.1 → OpenRouter). The wrapper rejects unrelated `.env` entries, writes a temporary 0600 env file containing only the OpenRouter key, and passes that file to Docker; the key is never baked into a layer.
`AOB_MODEL` selects the exact candidate model; it defaults to `z-ai/glm-5.3-flash` and must be recorded with the resulting evidence.

S5 official cells put the measurement proxy on the host. Each agent gets a
unique Docker `--internal` network with no default route. A runner-owned relay
sidecar joins that internal network and the bridge, receives the only
`host.docker.internal` host-gateway entry, and forwards only to the fixed host
proxy URL. The agent uses the relay hostname and never joins the bridge. The
runner uses a fresh `docker run` for each cell; it mounts only the staged
workspace at `/work/workspace`, passes only the adapter-declared environment, drops all capabilities, enables
`no-new-privileges`, closes stdin, and captures redacted stdout and stderr. The
runner does not use `--env-file` or inherit host secrets.

`runner-entrypoint.sh` is the image entrypoint contract: it runs only the
supplied adapter command with stdin closed. Verification is deliberately run
later in a separate `--network none` container, so an adapter cannot inspect or
rewrite the verifier, proxy events, or result artifacts. Image builds that use
the S5 runner must copy the entrypoint into the image and set it as the
entrypoint.

The bridge host-gateway route is used only by the relay. CI and S7 validate the
relay path before official runs; the zero-spend smoke also checks that the
agent-side internal network has no default route. The relay is a fixed
measurement path, not a general outbound proxy.

To verify the real Docker Desktop route without provider traffic, run
`scripts/s5-docker-route-smoke.sh`. It uses the pinned `curlimages/curl` image,
the in-repo mock upstream, an internal network, and the same relay topology as
an agent cell; it deletes all temporary resources and output on completion. CI
and S7 preflight run this smoke before any provider-backed work.
