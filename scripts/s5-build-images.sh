#!/usr/bin/env sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
MODE=build
if [ "${1:-}" = "--check" ]; then
  MODE=check
elif [ "${1:-}" != "" ]; then
  printf 'Usage: scripts/s5-build-images.sh [--check]\n' >&2
  exit 2
fi

TOOL_LIST=${AOB_IMAGE_TOOLS:-claude-code,codex,hermes,aider,opencode,qwen}
TOOLS=$(printf '%s' "$TOOL_LIST" | tr ',' ' ')
ROUTE_SMOKE_IMAGE="curlimages/curl:8.12.1@sha256:94e9e444bcba979c2ea12e27ae39bee4cd10bc7041a472c4727a558e213744e6"

fail() {
  printf 'S5 image validation: %s\n' "$1" >&2
  exit 1
}

[ -n "$(printf '%s' "$TOOLS" | tr -d '[:space:]')" ] || fail "at least one adapter image must be selected"

image_for() {
  case "$1" in
    claude-code|cline|codex|hermes|pi|aider|opencode|qwen) printf 'aob-%s:s2\n' "$1" ;;
    *) fail "unknown selected adapter: $1" ;;
  esac
}

binary_for() {
  case "$1" in
    claude-code) printf 'claude\n' ;;
    cline) printf 'cline\n' ;;
    codex) printf 'codex\n' ;;
    hermes) printf 'hermes\n' ;;
    pi) printf 'pi\n' ;;
    aider) printf 'aider\n' ;;
    opencode) printf 'opencode\n' ;;
    qwen) printf 'qwen\n' ;;
    *) fail "unknown selected adapter: $1" ;;
  esac
}

version_for() {
  case "$1" in
    claude-code) printf '2.1.246\n' ;;
    cline) printf '3.0.61\n' ;;
    codex) printf 'codex-cli 0.149.1\n' ;;
    hermes) printf '0.20.5\n' ;;
    pi) printf '0.73.1\n' ;;
    aider) printf '0.86.2\n' ;;
    opencode) printf '1.18.23\n' ;;
    qwen) printf '0.22.2\n' ;;
    *) fail "unknown selected adapter: $1" ;;
  esac
}

validate_lock_artifact() {
  tool=$1
  dockerfile="$ROOT/images/$tool.Dockerfile"
  case "$tool" in
    cline|pi)
      # Retain the exact global installs used by the completed local pilot.
      # These two images predate npm lock artifacts; validate their declared
      # package pin here and the installed package version below. Existing
      # lock-backed images continue to require their complete lock artifacts.
      case "$tool" in
        cline) package_name=cline ;;
        pi) package_name='@mariozechner/pi-coding-agent' ;;
      esac
      package_version=$(version_for "$tool")
      grep -F "RUN npm install -g $package_name@$package_version " "$dockerfile" >/dev/null \
        || fail "$tool Dockerfile does not pin its retained CLI package version"
      ;;
    claude-code|codex|opencode|qwen)
      lock_dir="$ROOT/images/npm-locks/$tool"
      lock="$lock_dir/package-lock.json"
      package="$lock_dir/package.json"
      case "$tool" in
        claude-code) package_name='@anthropic-ai/claude-code'; package_version='2.1.246' ;;
        codex) package_name='@openai/codex'; package_version='0.149.1' ;;
        opencode) package_name='opencode-ai'; package_version='1.18.23' ;;
        qwen) package_name='@qwen-code/qwen-code'; package_version='0.22.2' ;;
      esac
      [ -f "$package" ] || fail "npm package manifest is missing for $tool"
      [ -f "$lock" ] || fail "npm lockfile is missing for $tool"
      grep -F "npm ci --prefix /opt/aob/npm/$tool" "$dockerfile" >/dev/null \
        || fail "$tool Dockerfile does not install from its npm lockfile"
      node -e '
        const fs=require("node:fs");
        const [file,name,version]=process.argv.slice(1);
        const lock=JSON.parse(fs.readFileSync(file,"utf8"));
        if (lock.lockfileVersion !== 3 || lock.packages?.["packages"] || lock.packages?.[""]?.dependencies?.[name] !== version || lock.packages?.[`node_modules/${name}`]?.version !== version) process.exit(1);
      ' "$lock" "$package_name" "$package_version" \
        || fail "$tool npm lockfile does not pin the selected CLI"
      ;;
    aider|hermes)
      lock="$ROOT/images/python-locks/$tool.requirements.txt"
      [ -f "$lock" ] || fail "Python requirements lockfile is missing for $tool"
      if grep -Ev '^$|^#[^[:cntrl:]]*$|^[A-Za-z0-9_.-]+==[^=[:space:]]+( --hash=sha256:[0-9a-f]{64})+$' "$lock" | grep -q .; then
        fail "$tool requirements lockfile contains a non-exact requirement"
      fi
      case "$tool" in
        aider) required='aider-chat==0.86.2' ;;
        hermes) required='openai==2.24.0' ;;
      esac
      grep -E "^${required} --hash=sha256:" "$lock" >/dev/null || fail "$tool requirements lockfile is missing a required pinned package"
      grep -F "python-locks/$tool.requirements.txt" "$dockerfile" >/dev/null \
        || fail "$tool Dockerfile does not install from its Python lockfile"
      grep -F -- '--require-hashes' "$dockerfile" >/dev/null \
        || fail "$tool Dockerfile does not enforce Python artifact hashes"
      ;;
    *) fail "unknown selected adapter: $tool" ;;
  esac
}

build_image() {
  tag=$1
  file=$2
  if [ -n "${AOB_DOCKER_CACHE_TO:-}" ]; then
    docker buildx build --load \
      --cache-from "${AOB_DOCKER_CACHE_FROM:-type=gha,scope=aob-images}" \
      --cache-to "$AOB_DOCKER_CACHE_TO" \
      -t "$tag" -f "$ROOT/images/$file" "$ROOT/images"
  else
    docker build -t "$tag" -f "$ROOT/images/$file" "$ROOT/images"
  fi
}

inspect_image() {
  image=$1
  attempt=1
  while :; do
    if run_inspect /dev/null "$image"; then
      return 0
    fi
    if [ "$attempt" -ge 3 ]; then
      return 1
    fi
    sleep 1
    attempt=$((attempt + 1))
  done
}

inspect_image_format() {
  format=$1
  image=$2
  output_file=$(mktemp "${TMPDIR:-/tmp}/aob-image-inspect.XXXXXX") || return 1
  attempt=1
  while :; do
    if run_inspect "$output_file" "$image" --format "$format"; then
      output=$(cat "$output_file")
      rm -f "$output_file"
      printf '%s\n' "$output"
      return 0
    fi
    if [ "$attempt" -ge 3 ]; then
      rm -f "$output_file"
      return 1
    fi
    sleep 1
    attempt=$((attempt + 1))
  done
}

run_inspect() {
  output_file=$1
  shift
  docker image inspect "$@" >"$output_file" 2>/dev/null &
  inspect_pid=$!
  ticks=0
  while kill -0 "$inspect_pid" >/dev/null 2>&1; do
    if [ "$ticks" -ge 10 ]; then
      kill "$inspect_pid" >/dev/null 2>&1 || true
      wait "$inspect_pid" >/dev/null 2>&1 || true
      return 124
    fi
    sleep 1
    ticks=$((ticks + 1))
  done
  wait "$inspect_pid"
}

if [ "$MODE" = "build" ]; then
  command -v docker >/dev/null 2>&1 || fail "docker is not on PATH"
  docker info >/dev/null 2>&1 || fail "Docker daemon is unavailable"
  # The route smoke deliberately uses --pull=never. Hydrate its exact image
  # during the explicit image-preparation step, never as a side effect of a
  # check or a timed run.
  docker pull --quiet "$ROUTE_SMOKE_IMAGE"
  build_image aob-base:s2 base.Dockerfile
  seen_tools=
  for tool in $TOOLS; do
    case " $seen_tools " in
      *" $tool "*) fail "duplicate adapter image selection: $tool" ;;
    esac
    seen_tools="$seen_tools $tool"
    validate_lock_artifact "$tool"
    build_image "$(image_for "$tool")" "$tool.Dockerfile"
  done
fi

inspect_image "$ROUTE_SMOKE_IMAGE" || fail "route-smoke image is missing: $ROUTE_SMOKE_IMAGE"
inspect_image aob-base:s2 || fail "base image is missing"
docker run --pull=never --rm --read-only --network none --entrypoint /bin/sh aob-base:s2 \
  -c 'test -r /opt/aob/proxy-relay.mjs' \
  || fail "fixed-destination proxy relay is missing from the base image"
seen_tools=
for tool in $TOOLS; do
  case " $seen_tools " in
    *" $tool "*) fail "duplicate adapter image selection: $tool" ;;
  esac
  seen_tools="$seen_tools $tool"
  validate_lock_artifact "$tool"
  image=$(image_for "$tool")
  binary=$(binary_for "$tool")
  expected=$(version_for "$tool")
  inspect_image "$image" || fail "image is missing: $image"
  envs=$(inspect_image_format '{{json .Config.Env}}' "$image") || fail "cannot inspect image environment: $image"
  case "$envs" in
    *OPENROUTER_API_KEY*|*OPENAI_API_KEY*|*ANTHROPIC_AUTH_TOKEN*) fail "provider credential name is baked into $image" ;;
  esac
  docker run --pull=never --rm --read-only --network none --entrypoint /bin/sh "$image" \
    -c 'test -x /opt/aob/runner-entrypoint.sh' \
    || fail "runner entrypoint is not executable in $image"
  case "$tool" in
    cline|pi)
      case "$tool" in
        cline) package_name=cline ;;
        pi) package_name='@mariozechner/pi-coding-agent' ;;
      esac
      package_version=$(docker run --pull=never --rm --read-only --network none --entrypoint node "$image" \
        -p "require('/usr/local/lib/node_modules/$package_name/package.json').version") \
        || fail "cannot inspect installed CLI package version in $image"
      [ "$package_version" = "$expected" ] || fail "package version drift for $image: expected $expected"
      ;;
  esac
  output=$(docker run --pull=never --rm --read-only --network none --entrypoint "$binary" "$image" --version 2>&1) \
    || fail "version probe failed for $image"
  case "$output" in
    *"$expected"*) ;;
    *) fail "version drift for $image: expected $expected" ;;
  esac
  printf '%s: %s\n' "$image" "$expected"
done

printf 'S5 image validation passed (%s mode; no provider traffic)\n' "$MODE"
