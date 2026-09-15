#!/usr/bin/env bash
# Host wrapper: build a per-tool image and run the S2 probe in Docker.
# Does not npm/pip/brew-install CLIs on the Mac.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TOOL="${1:?usage: s2-docker-probe.sh <claude-code|codex|hermes|aider|opencode|qwen|goose|pi>}"
MODEL="${AOB_MODEL:-z-ai/glm-5.3-flash}"
ENV_FILE="${AOB_ENV_FILE:-$ROOT/.env}"
cd "$ROOT"

if [ ! -f "$ENV_FILE" ]; then
  echo "missing env file with OPENROUTER_API_KEY: $ENV_FILE" >&2
  exit 2
fi

S2_ENV_FILE=$(mktemp "${TMPDIR:-/tmp}/aob-s2-env.XXXXXX")
trap 'rm -f "$S2_ENV_FILE"' EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM
"$ROOT/scripts/s2-docker-env.sh" "$ENV_FILE" "$S2_ENV_FILE"

DOCKER_INFO_TIMEOUT_MS="${AOB_S2_DOCKER_INFO_TIMEOUT_MS:-10000}"
node "$ROOT/scripts/command-timeout.mjs" "$DOCKER_INFO_TIMEOUT_MS" docker info >/dev/null

if [ "${AOB_S2_SKIP_BUILD:-0}" = "1" ]; then
  echo "==> reuse and validate aob-${TOOL}:s2"
  AOB_IMAGE_TOOLS="$TOOL" "$ROOT/scripts/s5-build-images.sh" --check
else
  echo "==> build aob-base:s2"
  docker build -t aob-base:s2 -f images/base.Dockerfile images

  echo "==> build aob-${TOOL}:s2"
  docker build -t "aob-${TOOL}:s2" -f "images/${TOOL}.Dockerfile" images
fi

OUT="$ROOT/scratch/s2-logs/${TOOL}-docker"
mkdir -p "$OUT" "$ROOT/scratch/s2-ws"
rm -f "$OUT/baseUrl.txt" "$OUT/captured.jsonl" "$OUT/run-meta.json"

echo "==> run ${TOOL} in container (no host install)"
# The temporary env file contains only OPENROUTER_API_KEY; unrelated .env
# variables are rejected before Docker starts.
DOCKER_USER_ARGS=()
if [ "$TOOL" = "claude-code" ]; then
  DOCKER_USER_ARGS+=(--user "$(id -u):$(id -g)")
fi
set +e
docker run --pull=never --rm \
  "${DOCKER_USER_ARGS[@]}" \
  --env-file "$S2_ENV_FILE" \
  -e CI=1 \
  -e AOB_OUT=/out \
  -e AOB_WORK=/work \
  -e AOB_DUMP=/opt/aob/s2-dump-proxy.mjs \
  -e AOB_MODEL="$MODEL" \
  -v "$ROOT/scratch/s2-ws:/work" \
  -v "$OUT:/out" \
  -v "$ROOT/scratch/s2-dump-proxy.mjs:/opt/aob/s2-dump-proxy.mjs:ro" \
  -v "$ROOT/images/incontainer-probe.sh:/opt/aob/incontainer-probe.sh:ro" \
  --network bridge \
  "aob-${TOOL}:s2" \
  bash /opt/aob/incontainer-probe.sh "$TOOL"
rc=$?
set -e
echo "docker_exit=$rc"
exit "$rc"
