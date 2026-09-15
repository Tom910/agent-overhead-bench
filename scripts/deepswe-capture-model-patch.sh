#!/usr/bin/env sh
set -eu

BASE_ROOT=${1:?usage: deepswe-capture-model-patch.sh BASE_ROOT WORKSPACE OUTPUT}
WORKSPACE=${2:?usage: deepswe-capture-model-patch.sh BASE_ROOT WORKSPACE OUTPUT}
OUTPUT=${3:?usage: deepswe-capture-model-patch.sh BASE_ROOT WORKSPACE OUTPUT}

[ -d "$BASE_ROOT/.git" ] || { printf '%s\n' 'immutable DeepSWE base repository is unavailable' >&2; exit 1; }
[ -d "$WORKSPACE" ] || { printf '%s\n' 'DeepSWE agent workspace is unavailable' >&2; exit 1; }
mkdir -p "$(dirname -- "$OUTPUT")"

MIRROR_ROOT=$(mktemp -d "${TMPDIR:-/tmp}/aob-deepswe-base.XXXXXX")
cleanup() { rm -rf "$MIRROR_ROOT"; }
trap cleanup EXIT INT TERM
MIRROR="$MIRROR_ROOT/base"

# /app is the verifier image's immutable sanitized base. Clone it instead of
# trusting the agent workspace's mutable refs or object database.
git clone --quiet --no-hardlinks "$BASE_ROOT" "$MIRROR"
BASE_PATHS="$MIRROR_ROOT/base-paths"
git -C "$MIRROR" ls-files -z > "$BASE_PATHS"
# Overlay only visible workspace contents. The agent's .git directory is
# deliberately excluded so branch/commit/history mutations cannot affect the
# baseline used for the patch.
# Host owner IDs may differ from the verifier user, which cannot chown with
# all capabilities dropped. Git patches need contents and modes, not owners.
tar -C "$WORKSPACE" --exclude=.git -cf - . | tar -C "$MIRROR" --no-same-owner -xf -
if [ -s "$BASE_PATHS" ]; then
  export AOB_PATCH_WORKSPACE="$WORKSPACE" AOB_PATCH_MIRROR="$MIRROR"
  xargs -0 -n 1 sh -c '
    path=$1
    if [ ! -e "$AOB_PATCH_WORKSPACE/$path" ] && [ ! -L "$AOB_PATCH_WORKSPACE/$path" ]; then
      rm -rf -- "$AOB_PATCH_MIRROR/$path"
    fi
  ' sh < "$BASE_PATHS"
fi
PATHS="$MIRROR_ROOT/paths"
git -C "$MIRROR" ls-files -co --exclude-standard -z -- . \
  ':(exclude).aob-home' ':(exclude).aob-home/**' \
  ':(exclude).aob-codex-home' ':(exclude).aob-codex-home/**' \
  ':(exclude).aob-qwen-home' ':(exclude).aob-qwen-home/**' > "$PATHS"
if [ -s "$PATHS" ]; then
  xargs -0 git -C "$MIRROR" add --intent-to-add -- < "$PATHS"
fi
git -C "$MIRROR" diff --no-ext-diff --binary HEAD -- > "$OUTPUT"

# The source grader operates in the mounted workspace and expects its declared
# base commit to exist there. Restore only Git metadata from the immutable
# mirror after capturing the patch; the model's visible files remain untouched.
if [ -e "$WORKSPACE/.git" ] || [ -L "$WORKSPACE/.git" ]; then
  rm -rf -- "$WORKSPACE/.git"
fi
cp -a "$MIRROR/.git" "$WORKSPACE/.git"
# The source grader applies model.patch in the workspace. Return the visible
# files to the immutable base so the captured solution is applied exactly once
# rather than being applied on top of itself.
git -C "$WORKSPACE" reset --hard HEAD >/dev/null
git -C "$WORKSPACE" clean -fd >/dev/null
