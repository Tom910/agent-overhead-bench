#!/usr/bin/env sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
TASK_IMAGE=${1:?usage: scripts/build-deepswe-agent-image.sh TASK_ENV_IMAGE TOOL_IMAGE OUTPUT_IMAGE TOOL}
TOOL_IMAGE=${2:?usage: scripts/build-deepswe-agent-image.sh TASK_ENV_IMAGE TOOL_IMAGE OUTPUT_IMAGE TOOL}
OUTPUT_IMAGE=${3:?usage: scripts/build-deepswe-agent-image.sh TASK_ENV_IMAGE TOOL_IMAGE OUTPUT_IMAGE TOOL}
TOOL=${4:?usage: scripts/build-deepswe-agent-image.sh TASK_ENV_IMAGE TOOL_IMAGE OUTPUT_IMAGE TOOL}

case "$TOOL" in
  claude-code|cline|codex|hermes|pi|aider|opencode|qwen) : ;;
  *) printf 'unsupported DeepSWE agent image tool: %s\n' "$TOOL" >&2; exit 1 ;;
esac

WORK=$(mktemp -d "${TMPDIR:-/tmp}/aob-deepswe-agent-image.XXXXXX")
trap 'rm -rf "$WORK"' EXIT INT TERM
DOCKERFILE="$WORK/Dockerfile"

{
  printf 'ARG TASK_IMAGE=%s\n' "$TASK_IMAGE"
  printf 'ARG TOOL_IMAGE=%s\n' "$TOOL_IMAGE"
  printf 'FROM ${TASK_IMAGE} AS task\n'
  printf 'FROM ${TOOL_IMAGE} AS tool\n'
  printf 'FROM task\n'
  printf 'COPY --from=tool /opt/aob /opt/aob\n'
  printf 'COPY --from=tool /usr/local/bin/apply_patch /usr/local/bin/apply_patch\n'
  printf 'ENV PATH="/opt/aob/npm/claude-code/node_modules/.bin:/opt/aob/npm/codex/node_modules/.bin:/opt/aob/npm/opencode/node_modules/.bin:/opt/aob/npm/qwen/node_modules/.bin:${PATH}"\n'
  case "$TOOL" in
    cline)
      printf 'COPY --from=tool /usr/local/lib/node_modules/cline /usr/local/lib/node_modules/cline\n'
      # COPY follows the source executable symlink. Recreate it so the CLI
      # wrapper resolves its native package relative to its original location.
      printf 'RUN ln -sf /usr/local/lib/node_modules/cline/bin/cline /usr/local/bin/cline\n'
      printf 'ENV PYTHONPATH="/work/workspace"\n'
      ;;
    pi)
      printf 'COPY --from=tool /usr/local/lib/node_modules/@mariozechner/pi-coding-agent /usr/local/lib/node_modules/@mariozechner/pi-coding-agent\n'
      printf 'RUN ln -sf /usr/local/lib/node_modules/@mariozechner/pi-coding-agent/dist/cli.js /usr/local/bin/pi\n'
      printf 'ENV PYTHONPATH="/work/workspace"\n'
      ;;
    aider)
      printf 'COPY --from=tool /usr/local/bin/aider /usr/local/bin/aider\n'
      printf 'COPY --from=tool /usr/local/lib/python3.11/dist-packages/ /usr/local/lib/python3.11/dist-packages/\n'
      printf 'ENV PYTHONPATH="/work/workspace:/usr/local/lib/python3.11/dist-packages"\n'
      ;;
    hermes)
      printf 'COPY --from=tool /usr/local/bin/hermes /usr/local/bin/hermes\n'
      printf 'COPY --from=tool /usr/local/lib/python3.11/dist-packages/ /usr/local/lib/python3.11/dist-packages/\n'
      printf 'COPY --from=tool /opt/hermes-agent /opt/hermes-agent\n'
      printf 'ENV PYTHONPATH="/work/workspace:/opt/hermes-agent:/usr/local/lib/python3.11/dist-packages"\n'
      ;;
    *)
      printf 'ENV PYTHONPATH="/work/workspace"\n'
      ;;
  esac
} > "$DOCKERFILE"

docker build --pull=false --build-arg "TASK_IMAGE=$TASK_IMAGE" --build-arg "TOOL_IMAGE=$TOOL_IMAGE" \
  -t "$OUTPUT_IMAGE" -f "$DOCKERFILE" "$ROOT" >/dev/null
docker image inspect --format '{{.Id}}' "$OUTPUT_IMAGE"
