#!/usr/bin/env sh
set -eu

# Prepare a small, real DeepSWE calibration slice. Network work happens only
# before measurement: source checkout, upstream checkout, and verifier image
# build. The runner still uses --pull=never and verifier network=none.

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
REVIEWED_SOURCE_REVISION=0b9fabbb63b9104d678fe965e1632f2dd9eaa2ea
SOURCE=${1:?usage: scripts/prepare-deepswe-calibration.sh DEEPSWE_CHECKOUT OUTPUT_ROOT TASK_ID...}
OUTPUT=${2:?usage: scripts/prepare-deepswe-calibration.sh DEEPSWE_CHECKOUT OUTPUT_ROOT TASK_ID...}
shift 2

[ -d "$SOURCE/.git" ] || { printf '%s\n' 'DeepSWE checkout must contain .git' >&2; exit 1; }
SOURCE=$(CDPATH= cd -- "$SOURCE" && pwd)
[ "$#" -gt 0 ] || { printf '%s\n' 'at least one DeepSWE task id is required' >&2; exit 1; }
[ ! -e "$OUTPUT" ] || { printf 'output already exists: %s\n' "$OUTPUT" >&2; exit 1; }
for task_id in "$@"; do
  case "$task_id" in
    ''|*[!A-Za-z0-9._-]*) printf 'unsafe or empty DeepSWE task id: %s\n' "$task_id" >&2; exit 1 ;;
  esac
done

SOURCE_REV=$(git -C "$SOURCE" rev-parse HEAD)
node -e 'if (!/^[0-9a-f]{40}$/i.test(process.argv[1])) process.exit(1)' "$SOURCE_REV" \
  || { printf '%s\n' 'invalid DeepSWE checkout revision' >&2; exit 1; }
[ "$SOURCE_REV" = "$REVIEWED_SOURCE_REVISION" ] \
  || { printf 'DeepSWE checkout must be at reviewed DeepSWE revision %s (found %s)\n' "$REVIEWED_SOURCE_REVISION" "$SOURCE_REV" >&2; exit 1; }
SOURCE_DATASET=$(node -e 'const fs=require("node:fs"); const d=JSON.parse(fs.readFileSync(process.argv[1], "utf8")); if (typeof d.source_dataset !== "string" || d.source_dataset.length === 0) process.exit(1); process.stdout.write(d.source_dataset)' "$SOURCE/tasks/manifest.json") \
  || { printf '%s\n' 'DeepSWE source manifest must declare source_dataset' >&2; exit 1; }
mkdir -p "$OUTPUT"
WORK=$(mktemp -d "${TMPDIR:-/tmp}/aob-deepswe-prep.XXXXXX")
trap 'rm -rf "$WORK"' EXIT INT TERM
RESOLVED_REVISIONS="$WORK/resolved-revisions.tsv"
: > "$RESOLVED_REVISIONS"
TASK_TOOLS=${AOB_TASK_TOOLS:-}
TASK_REGIME=${AOB_TASK_REGIME:-short}
TASK_TIMEOUT_S=${AOB_TASK_TIMEOUT_S:-300}
# Reference polarity must be bounded consistently with the selected measured
# regime. Long tasks can legitimately need more than the short 300-second
# verifier bound; operators may still raise this explicitly up to 1800s.
# The reference check runs the source verifier, not the agent, so it is bounded
# by the source's declared verifier budget (1800s) rather than the agent
# budget. Extended-regime agent timeouts exceed that, so clamp the default
# instead of inheriting an agent timeout the verifier bound would reject.
REFERENCE_TIMEOUT_S=${AOB_REFERENCE_TIMEOUT_S:-$(( TASK_TIMEOUT_S > 1800 ? 1800 : TASK_TIMEOUT_S ))}
case "$REFERENCE_TIMEOUT_S" in
  ''|*[!0-9]*) printf '%s\n' 'AOB_REFERENCE_TIMEOUT_S must be a positive integer' >&2; exit 1 ;;
esac
[ "$REFERENCE_TIMEOUT_S" -gt 0 ] && [ "$REFERENCE_TIMEOUT_S" -le 1800 ] || { printf '%s\n' 'reference polarity timeout must be between 1 and 1800 seconds' >&2; exit 1; }
case "$TASK_REGIME" in
  short)
    case "$TASK_TIMEOUT_S" in ''|*[!0-9]*) printf '%s\n' 'AOB_TASK_TIMEOUT_S must be a positive integer' >&2; exit 1 ;; esac
    [ "$TASK_TIMEOUT_S" -gt 0 ] && [ "$TASK_TIMEOUT_S" -le 300 ] || { printf '%s\n' 'short task timeout must be between 1 and 300 seconds' >&2; exit 1; }
    ;;
  long)
    case "$TASK_TIMEOUT_S" in ''|*[!0-9]*) printf '%s\n' 'AOB_TASK_TIMEOUT_S must be a positive integer' >&2; exit 1 ;; esac
    [ "$TASK_TIMEOUT_S" -gt 300 ] && [ "$TASK_TIMEOUT_S" -le 900 ] || { printf '%s\n' 'long task timeout must be between 301 and 900 seconds' >&2; exit 1; }
    ;;
  extended)
    case "$TASK_TIMEOUT_S" in ''|*[!0-9]*) printf '%s\n' 'AOB_TASK_TIMEOUT_S must be a positive integer' >&2; exit 1 ;; esac
    [ "$TASK_TIMEOUT_S" -gt 900 ] && [ "$TASK_TIMEOUT_S" -le 10800 ] || { printf '%s\n' 'extended task timeout must be between 901 and 10800 seconds' >&2; exit 1; }
    ;;
  *) printf 'AOB_TASK_REGIME must be short, long, or extended: %s\n' "$TASK_REGIME" >&2; exit 1 ;;
esac

TASK_EXPECTED_MINUTES_FILE=${AOB_TASK_EXPECTED_MINUTES_FILE:-}
[ -n "$TASK_EXPECTED_MINUTES_FILE" ] || { printf '%s\n' 'AOB_TASK_EXPECTED_MINUTES_FILE is required; provide one reviewed range per selected task' >&2; exit 1; }
[ -f "$TASK_EXPECTED_MINUTES_FILE" ] && [ ! -L "$TASK_EXPECTED_MINUTES_FILE" ] || { printf 'task duration map is unavailable or is a symlink: %s\n' "$TASK_EXPECTED_MINUTES_FILE" >&2; exit 1; }
DURATION_MAP="$WORK/task-durations.tsv"
node "$ROOT/scripts/validate-duration-map.mjs" "$TASK_EXPECTED_MINUTES_FILE" "$TASK_REGIME" "$@" > "$DURATION_MAP" \
  || { printf '%s\n' 'task duration map must be a complete JSON object with unique keys and in-regime integer ranges' >&2; exit 1; }

case "$TASK_TOOLS" in
  "") ;;
  *)
    for tool in $(printf '%s' "$TASK_TOOLS" | tr ',' ' '); do
      case "$tool" in
        claude-code|cline|codex|hermes|pi|aider|opencode|qwen) : ;;
        *) printf 'unsupported DeepSWE task tool: %s\n' "$tool" >&2; exit 1 ;;
      esac
    done
    ;;
esac

for task_id in "$@"; do
  expected_minutes=$(awk -F '\t' -v task="$task_id" '$1 == task { printf "[%s, %s]", $2, $3 }' "$DURATION_MAP")
  [ -n "$expected_minutes" ] || { printf 'missing task duration range for %s\n' "$task_id" >&2; exit 1; }
  task_dir="$SOURCE/tasks/$task_id"
  [ -d "$task_dir" ] || { printf 'unknown DeepSWE task: %s\n' "$task_id" >&2; exit 1; }
  for required in task.toml instruction.md environment/Dockerfile tests/Dockerfile tests/test.sh tests/test.patch tests/grader.py tests/config.json solution/solution.patch; do
    [ -f "$task_dir/$required" ] || { printf 'missing %s for %s\n' "$required" "$task_id" >&2; exit 1; }
  done

  repo=$(awk -F'= ' '$1 == "repository_url " { gsub(/^"|"$/, "", $2); print $2; exit }' "$task_dir/task.toml")
  base=$(awk -F'= ' '$1 == "base_commit_hash " { gsub(/^"|"$/, "", $2); print $2; exit }' "$task_dir/task.toml")
  base_image=$(awk -F'= ' '$1 == "docker_image " { gsub(/^"|"$/, "", $2); print $2; exit }' "$task_dir/task.toml")
  language=$(awk -F'= ' '$1 == "language " { gsub(/^"|"$/, "", $2); print $2; exit }' "$task_dir/task.toml")
  category=$(awk -F'= ' '$1 == "category " { gsub(/^"|"$/, "", $2); print $2; exit }' "$task_dir/task.toml")
  [ -n "$repo" ] && [ -n "$base" ] && [ -n "$base_image" ] && [ -n "$category" ] || { printf 'incomplete task metadata: %s\n' "$task_id" >&2; exit 1; }
  node -e 'if (!/^[0-9a-f]{7,40}$/i.test(process.argv[1])) process.exit(1)' "$base" \
    || { printf 'invalid base commit for %s\n' "$task_id" >&2; exit 1; }
  case "$language" in
    python) : ;;
    typescript) : ;;
    go) : ;;
    javascript) : ;;
    rust) : ;;
    *) printf 'unsupported language for %s: %s\n' "$task_id" "$language" >&2; exit 1 ;;
  esac
  case "$category" in
    bugfix) shape=bugfix ;;
    enhancement|feature_request) shape=feature ;;
    *) printf 'unsupported DeepSWE source category for %s: %s\n' "$task_id" "$category" >&2; exit 1 ;;
  esac

  checkout="$WORK/$task_id"
  git clone --filter=blob:none --no-checkout "$repo" "$checkout" >/dev/null
  git -C "$checkout" fetch --quiet origin "$base" 2>/dev/null || true
  base=$(git -C "$checkout" rev-parse --verify "$base^{commit}" 2>/dev/null) \
    || { printf 'upstream base commit is unavailable for %s\n' "$task_id" >&2; exit 1; }
  upstream_base=$base
  printf '%s\t%s\n' "$task_id" "$base" >> "$RESOLVED_REVISIONS"
  git -C "$checkout" checkout --quiet --detach "$base"
  git -C "$checkout" submodule update --init --recursive
  [ "$(git -C "$checkout" rev-parse HEAD)" = "$base" ] || { printf 'upstream revision mismatch: %s\n' "$task_id" >&2; exit 1; }
  # DeepSWE instructions conventionally ask agents to branch from `main`, but
  # some pinned upstreams still use `master` as their default branch. Provide a
  # local name at the exact pinned base without changing the detached HEAD or
  # source revision.
  if ! git -C "$checkout" show-ref --verify --quiet refs/heads/main; then
    git -C "$checkout" branch main "$base"
  fi
  files=$(git -C "$checkout" ls-files | wc -l | tr -d ' ')
  if [ "$files" -ge 100 ]; then size=medium; else size=small; fi

  image="aob-deepswe-${task_id}-verifier:calibration"
  environment_image="aob-deepswe-${task_id}-environment:calibration"
  # Keep package-manager caches out of the committed environment layer. DeepSWE
  # task images can contain over a gigabyte of npm cache after install, which
  # needlessly doubles peak Docker Desktop storage during image unpacking.
  environment_dockerfile="$WORK/$task_id.environment.Dockerfile"
  {
    cat "$task_dir/environment/Dockerfile"
    printf '\nRUN rm -rf /app/reference /app/.git; npm cache clean --force >/dev/null 2>&1 || true; rm -rf /root/.npm /var/lib/apt/lists/*\n'
  } > "$environment_dockerfile"
  docker build --pull=false --build-arg "BASE_SHA=$base" -t "$environment_image" -f "$environment_dockerfile" "$task_dir/environment" >/dev/null
  environment_image_digest=$(docker image inspect --format '{{.Id}}' "$environment_image")
  case "$environment_image_digest" in
    sha256:????????????????????????????????????????????????????????????????) : ;;
    *) printf 'invalid environment image digest for %s\n' "$task_id" >&2; exit 1 ;;
  esac
  agent_images=
  for tool in $(printf '%s' "$TASK_TOOLS" | tr ',' ' '); do
    agent_image="aob-deepswe-${task_id}-${tool}:calibration"
    agent_digest=$(
      "$ROOT/scripts/build-deepswe-agent-image.sh" \
        "$environment_image" "aob-${tool}:s2" "$agent_image" "$tool"
    )
    case "$agent_digest" in
      sha256:????????????????????????????????????????????????????????????????) : ;;
      *) printf 'invalid agent image digest for %s/%s\n' "$task_id" "$tool" >&2; exit 1 ;;
    esac
    agent_images="${agent_images}${agent_images:+,}\"$tool\":{\"image\":\"$agent_image\",\"image_digest\":\"$agent_digest\"}"
  done
  # Keep hidden verifier inputs outside the upstream checkout. The public
  # workspace projection must contain no test.patch, solution.patch, or grader
  # material.
  verifier_context="$WORK/verifier-$task_id"
  mkdir -p "$verifier_context"
  cp -a "$task_dir/tests/." "$verifier_context/"
  cp "$task_dir/solution/solution.patch" "$verifier_context/solution.patch"
  cp "$ROOT/scripts/deepswe-capture-model-patch.sh" "$verifier_context/capture-model-patch.sh"
  # The source verifier addresses its agent checkout as /app. The benchmark
  # mounts the model workspace at /work/workspace while retaining /app as the
  # immutable dependency environment, so rewrite only this copied verifier
  # script's mount path. Test logic and source-owned commands remain intact.
  awk 'NR == 1 { gsub("/app", "/work/workspace"); print; print "export APP_DIR=/work/workspace"; next } { gsub("/app", "/work/workspace"); print }' \
    "$verifier_context/test.sh" > "$verifier_context/test.sh.workspace"
  mv "$verifier_context/test.sh.workspace" "$verifier_context/test.sh"
  # The source task has separate backend and frontend dependency trees. Use
  # each package's local Vitest binary so the two suites cannot resolve one
  # another's version or environment from PATH.
  sed -i.bak 's/bunx vitest/.\/node_modules\/.bin\/vitest/g' "$verifier_context/test.sh"
  rm -f "$verifier_context/test.sh.bak"
  # DeepSWE's config records pytest parameterized paths from its /app layout.
  # The benchmark verifier mounts the same workspace at /work/workspace, so
  # normalize only the JUnit node-id spelling before the source grader reads
  # the reports. Test selection and outcomes remain source-owned.
  grep -q '^echo "===== grade ====="$' "$verifier_context/test.sh" \
    || { printf 'DeepSWE verifier lacks its grade boundary: %s\n' "$task_id" >&2; exit 1; }
  awk '
    /^echo "===== grade ====="$/ {
      print "# Normalize DeepSWE /app parameterized node IDs for the benchmark mount."
      print "for _report in /logs/verifier/*.xml; do"
      print "  [ -f \"$_report\" ] || continue"
      print "  sed '\''s#/work/workspace/#/app/#g'\'' \"$_report\" > \"$_report.normalized\""
      print "  mv \"$_report.normalized\" \"$_report\""
      print "done"
    }
    { print }
  ' "$verifier_context/test.sh" > "$verifier_context/test.sh.normalized"
  mv "$verifier_context/test.sh.normalized" "$verifier_context/test.sh"
  verifier_runtime=
  if [ "$language" = "go" ]; then
    # The verifier container mounts /tmp with noexec. Go's default test build
    # directory is under /tmp, so keep generated test binaries in the
    # executable workspace mount instead. The upstream test also writes a
    # diagnostic log below GOPATH, so move that writable path into the same
    # isolated workspace area while leaving the installed reporter on PATH.
    verifier_runtime='mkdir -p /work/workspace/.aob-go-tmp; export GOTMPDIR=/work/workspace/.aob-go-tmp; '
    if grep -q '/root/go/bin' "$verifier_context/test.sh"; then
      sed -i.bak 's#/root/go/bin#/work/workspace/.aob-go-path/bin#g' "$verifier_context/test.sh"
      rm -f "$verifier_context/test.sh.bak"
      verifier_runtime='mkdir -p /work/workspace/.aob-go-tmp /work/workspace/.aob-go-path/bin; export GOTMPDIR=/work/workspace/.aob-go-tmp; export GOPATH=/work/workspace/.aob-go-path; export PATH=/root/go/bin:$PATH; '
    fi
  fi
  docker build --pull=false --build-arg "BASE_IMAGE=$environment_image" -t "$image" -f "$ROOT/scripts/deepswe-verifier.Dockerfile" "$verifier_context" >/dev/null
  image_digest=$(docker image inspect --format '{{.Id}}' "$image")
  case "$image_digest" in
    sha256:????????????????????????????????????????????????????????????????) : ;;
    *) printf 'invalid verifier image digest for %s\n' "$task_id" >&2; exit 1 ;;
  esac

  destination="$OUTPUT/$task_id"
  mkdir -p "$destination"
  # Reuse the task-source boundary copier: upstream repositories may contain
  # a task-root `reference/` directory with private developer material.
  node --experimental-strip-types --no-warnings --experimental-loader "$ROOT/scripts/ts-source-loader.mjs" \
    --input-type=module - "$ROOT" "$checkout" "$destination/workspace" <<'NODE'
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const [root, source, destination] = process.argv.slice(2);
const { copyPublicWorkspace } = await import(pathToFileURL(join(root, "packages/tasks/src/source.ts")).href);
copyPublicWorkspace(source, destination);
NODE
  git init --quiet "$destination/workspace"
  git -C "$destination/workspace" branch -M main
  git -C "$destination/workspace" config user.name aob-preparation
  git -C "$destination/workspace" config user.email aob-preparation@example.invalid
  git -C "$destination/workspace" config core.hooksPath /dev/null
  git -C "$destination/workspace" add --all
  GIT_AUTHOR_NAME=aob-preparation GIT_AUTHOR_EMAIL=aob-preparation@example.invalid \
    GIT_AUTHOR_DATE=2000-01-01T00:00:00Z GIT_COMMITTER_NAME=aob-preparation \
    GIT_COMMITTER_EMAIL=aob-preparation@example.invalid GIT_COMMITTER_DATE=2000-01-01T00:00:00Z \
    git -C "$destination/workspace" commit --quiet --allow-empty -m 'DeepSWE sanitized upstream base'
  base=$(git -C "$destination/workspace" rev-parse HEAD)
  workspace_files=$(git -C "$destination/workspace" ls-files | wc -l | tr -d ' ')
  if [ "$workspace_files" -ge 100 ]; then size=medium; else size=small; fi
  [ ! -e "$destination/workspace/reference" ] || { printf 'private reference material was copied for %s\n' "$task_id" >&2; exit 1; }
  [ -z "$(git -C "$destination/workspace" ls-files -- reference)" ] || { printf 'private reference paths are tracked for %s\n' "$task_id" >&2; exit 1; }
  ! git -C "$destination/workspace" cat-file -e HEAD:reference 2>/dev/null || { printf 'private reference tree is queryable for %s\n' "$task_id" >&2; exit 1; }
  cp "$task_dir/instruction.md" "$destination/prompt.md"
  cat > "$destination/task.yaml" <<EOF
id: $task_id
source:
  kind: public-task-pack
  repository: https://github.com/datacurve-ai/deep-swe.git
  revision: $SOURCE_REV
  task_id: $task_id
  license_notes: DeepSWE dataset provenance; upstream license review pending
  base_revision: $base
language: $language
size: $size
shape: $shape
timeout_s: $TASK_TIMEOUT_S
expected_minutes: $expected_minutes
description: DeepSWE calibration task $task_id at upstream base $upstream_base (sanitized workspace base $base)
EOF
  if [ -n "$agent_images" ]; then
    cat > "$destination/environment.json" <<EOF
{"agent_images":{$agent_images}}
EOF
  fi
  cat > "$destination/PROVENANCE.md" <<EOF
# DeepSWE calibration provenance

- DeepSWE checkout revision: $SOURCE_REV
- DeepSWE task: $task_id
- Upstream repository: $repo
- Upstream base commit: $upstream_base
- Sanitized workspace base commit: $base
- DeepSWE-declared agent image: $base_image
- Task environment image: $environment_image@$environment_image_digest
- Verifier image: $image@$image_digest
- License review: pending maintainer review of DeepSWE and upstream licenses.

This file is audit metadata only. The measured workspace contains a sanitized
public projection of the upstream base checkout and does not contain the hidden
tests, reference solution, source-root reference/ material, or source .git
objects.
EOF
  cat > "$destination/verifier.json" <<EOF
{
  "kind": "docker-command",
  "image": "$image",
  "image_digest": "$image_digest",
  "command": ["sh", "-c", "set -eu; mkdir -p /tmp/logs/artifacts /tmp/logs/verifier; /usr/local/bin/aob-capture-model-patch /app /work/workspace /tmp/logs/artifacts/model.patch; cd /work/workspace; git clean -fd >/dev/null; $verifier_runtime if [ -d /app/node_modules ] && [ ! -e /work/workspace/node_modules ]; then mkdir -p /work/workspace/node_modules; for _dep in /app/node_modules/* /app/node_modules/.[!.]*; do [ -e \"\$_dep\" ] || continue; _name=\"\${_dep##*/}\"; ln -s \"\$_dep\" /work/workspace/node_modules/\$_name; done; fi; for _pkg in backend frontend; do if [ -d \"/app/\$_pkg/node_modules\" ] && [ ! -e \"/work/workspace/\$_pkg/node_modules\" ]; then mkdir -p \"/work/workspace/\$_pkg/node_modules\"; for _dep in \"/app/\$_pkg/node_modules\"/* \"/app/\$_pkg/node_modules\"/.[!.]*; do [ -e \"\$_dep\" ] || continue; _name=\"\${_dep##*/}\"; ln -s \"\$_dep\" \"/work/workspace/\$_pkg/node_modules/\$_name\"; done; fi; done; if [ -d /opt/aob-task-environment-assets ]; then cp -an /opt/aob-task-environment-assets/. /work/workspace/; fi; export PYTHONPATH=\"/work/workspace/src:/work/workspace/tests/tests_helpers:/work/workspace/tests\${PYTHONPATH:+:\$PYTHONPATH}\"; python3 -c \"import json; from pathlib import Path; p=Path('/tests/config.json'); d=json.loads(p.read_text()); d['base_commit']='$base'; p.write_text(json.dumps(d))\"; test -s /tmp/logs/artifacts/model.patch; set +e; bash /tests/test.sh; verifier_rc=\$?; set -e; if [ \"\$verifier_rc\" -ne 0 ]; then exit \"\$verifier_rc\"; fi; python3 -c \"import json; from pathlib import Path; data=json.loads(Path('/logs/verifier/reward.json').read_text()); raise SystemExit(0 if data.get('reward') == 1 else 1)\""],
  "workdir": ".",
  "network": "none"
}
EOF
done

node --experimental-strip-types --no-warnings --experimental-loader "$ROOT/scripts/ts-source-loader.mjs" \
  "$ROOT/packages/tasks/src/manifest-cli.ts" "$OUTPUT" "$OUTPUT/suite-manifest.json"

# DeepSWE is not the generic git-taskpack shape: its original entries point at
# task.toml plus an independently pinned upstream checkout. Emit an explicit
# source manifest and bind the materialized local manifest to it. Review flags
# intentionally remain false; this produces calibration inputs, not an
# approved S7 source. The structured review file is separate from the larger
# audit narrative so S7 can validate its exact evidence shape when approval is
# eventually recorded.
node --experimental-strip-types --no-warnings --experimental-loader "$ROOT/scripts/ts-source-loader.mjs" \
  --input-type=module - "$ROOT" "$SOURCE" "$OUTPUT" "$SOURCE_REV" "$SOURCE_DATASET" "$RESOLVED_REVISIONS" "$TASK_TIMEOUT_S" "$DURATION_MAP" "$REFERENCE_TIMEOUT_S" "$@" <<'NODE'
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
const [root, source, output, revision, sourceDataset, resolvedRevisionsPath, timeoutSRaw, durationMapPath, referenceTimeoutSRaw, ...taskIds] = process.argv.slice(2);
const timeoutS = Number(timeoutSRaw);
const referenceTimeoutS = Number(referenceTimeoutSRaw);
const { sourceManifestSha256, taskPackChecksum, validateDeepSWEManifest } = await import(pathToFileURL(join(root, "packages/tasks/src/source.ts")).href);
const sourceRepository = "https://github.com/datacurve-ai/deep-swe.git";
const resolvedRevisions = new Map(readFileSync(resolvedRevisionsPath, "utf8").trim().split("\n").filter(Boolean).map((line) => {
  const [taskId, resolved] = line.split("\t");
  return [taskId, resolved];
}));
const durationByTask = new Map(readFileSync(durationMapPath, "utf8").trim().split("\n").filter(Boolean).map((line) => {
  const [taskId, lo, hi] = line.split("\t");
  return [taskId, [Number(lo), Number(hi)]];
}));
const taskChecksum = (directory) => {
  const files = [];
  const walk = (current) => {
    for (const name of readdirSync(current).sort()) {
      const path = join(current, name);
      const info = lstatSync(path);
      if (info.isSymbolicLink()) throw new Error(`DeepSWE task contains a symlink: ${path}`);
      if (info.isDirectory()) walk(path);
      else if (info.isFile()) files.push(path);
      else throw new Error(`DeepSWE task contains a non-regular entry: ${path}`);
    }
  };
  walk(directory);
  const hash = createHash("sha256");
  for (const path of files) {
    hash.update(relative(directory, path).split("\\").join("/"));
    hash.update("\0");
    hash.update(readFileSync(path));
    hash.update("\0");
  }
  return `sha256:${hash.digest("hex")}`;
};
const readToml = (taskId, key) => {
  const text = readFileSync(join(source, "tasks", taskId, "task.toml"), "utf8");
  const match = new RegExp(`^${key} = \\"([^\\"]+)\\"$`, "m").exec(text);
  if (!match) throw new Error(`DeepSWE task ${taskId} is missing ${key}`);
  return match[1];
};
const shapeFor = (taskId) => {
  const category = readToml(taskId, "category").toLowerCase();
  if (category.includes("bug")) return "bugfix";
  if (category.includes("refactor")) return "refactor";
  return "feature";
};
const entries = taskIds.map((taskId) => {
  const taskDirectory = join(source, "tasks", taskId);
  const workspace = join(output, taskId, "workspace");
  const files = execFileSync("git", ["-C", workspace, "ls-files"], { encoding: "utf8" }).trim();
  const verifier = JSON.parse(readFileSync(join(output, taskId, "verifier.json"), "utf8"));
  if (verifier.kind === "docker-command") {
    const command = verifier.command[2];
    if (typeof command !== "string") throw new Error(`DeepSWE verifier command is malformed for ${taskId}`);
    verifier.command[2] = command
      .replace("set -eu;", "set -eu; cp /opt/aob-verifier-config.json /tmp/aob-verifier-config.json;")
      .replace("p=Path('/tests/config.json')", "p=Path('/tmp/aob-verifier-config.json')");
    writeFileSync(join(output, taskId, "verifier.json"), `${JSON.stringify(verifier, null, 2)}\n`, { mode: 0o600 });
  }
  const environmentPath = join(output, taskId, "environment.json");
  const environment = existsSync(environmentPath) ? JSON.parse(readFileSync(environmentPath, "utf8")) : {};
  return {
    id: taskId,
    path: `tasks/${taskId}`,
    source_task_id: taskId,
    language: readToml(taskId, "language"),
    shape: shapeFor(taskId),
    source_category: readToml(taskId, "category"),
    size: files === "" || files.split("\n").length < 100 ? "small" : "medium",
    timeout_s: timeoutS,
    expected_minutes: durationByTask.get(taskId) ?? (() => { throw new Error(`missing task duration range for ${taskId}`); })(),
    upstream_repository: readToml(taskId, "repository_url"),
    upstream_revision: resolvedRevisions.get(taskId) ?? (() => { throw new Error(`missing resolved upstream revision for ${taskId}`); })(),
    workspace_revision: execFileSync("git", ["-C", workspace, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    environment_image: `aob-deepswe-${taskId}-environment:calibration`,
    environment_image_digest: execFileSync("docker", ["image", "inspect", "--format", "{{.Id}}", `aob-deepswe-${taskId}-environment:calibration`], { encoding: "utf8" }).trim(),
    ...(environment.agent_images === undefined ? {} : { agent_images: environment.agent_images }),
    verifier_image: verifier.image,
    verifier_image_digest: verifier.image_digest,
    checksum: taskChecksum(taskDirectory),
  };
});
const manifest = validateDeepSWEManifest({
  version: 1,
  source_adapter: "deepswe",
  repository: sourceRepository,
  source_dataset: sourceDataset,
  revision,
  license_notes: "DeepSWE dataset provenance; upstream license review pending",
  review: {
    source_reviewed: false,
    reference_results_verified: false,
    calibration_complete: false,
    maintainer_signed_off: false,
     reviewer: "unassigned",
    reviewed_at: "pending",
    evidence_file: "plans/s3-deepswe-review.json",
    evidence_sha256: `sha256:${createHash("sha256").update(readFileSync(join(root, "plans/s3-deepswe-review.json"))).digest("hex")}`,
    reviewed_task_ids: taskIds,
    calibration_adapters: [],
  },
  tasks: entries,
});
const sourceManifestPath = join(output, "deepswe-source-manifest.json");
writeFileSync(sourceManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
const suitePath = join(output, "suite-manifest.json");
const suite = JSON.parse(readFileSync(suitePath, "utf8"));
suite.source_provenance = {
  source_adapter: "deepswe",
  repository: manifest.repository,
  revision: manifest.revision,
  license_notes: manifest.license_notes,
  source_manifest_sha256: sourceManifestSha256(manifest),
  review: manifest.review,
};
const byId = new Map(entries.map((entry) => [entry.id, entry]));
for (const entry of suite.tasks) {
  const source = byId.get(entry.id);
  if (!source) throw new Error(`prepared task is missing from DeepSWE source manifest: ${entry.id}`);
  entry.checksum = taskPackChecksum(join(output, entry.id));
  entry.source_binding = { path: source.path, source_task_id: source.source_task_id, source_checksum: source.checksum };
}
writeFileSync(suitePath, `${JSON.stringify(suite, null, 2)}\n`, { mode: 0o600 });
console.log(`DeepSWE source manifest: ${sourceManifestPath}`);
NODE

# Verify the source-provided solution in a temporary checkout with the same
# digest-pinned native verifier used by measured cells. The solution patch and
# hidden tests remain under WORK and are never copied into OUTPUT.
node --experimental-strip-types --no-warnings --experimental-loader "$ROOT/scripts/ts-source-loader.mjs" \
  --input-type=module - "$ROOT" "$SOURCE" "$OUTPUT" "$WORK" "$REFERENCE_TIMEOUT_S" "$@" <<'NODE'
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const [root, source, output, work, referenceTimeoutSRaw, ...taskIds] = process.argv.slice(2);
const referenceTimeoutS = Number(referenceTimeoutSRaw);
const { runDockerVerification } = await import(pathToFileURL(join(root, "packages/runner/src/docker.ts")).href);
const { sourceManifestSha256, validateDeepSWEManifest, validateDeepSWEReferencePolarity, validateVerifierSpec } = await import(pathToFileURL(join(root, "packages/tasks/src/source.ts")).href);
const sourceManifest = validateDeepSWEManifest(JSON.parse(readFileSync(join(output, "deepswe-source-manifest.json"), "utf8")));
for (const taskId of taskIds) {
  const task = sourceManifest.tasks.find((candidate) => candidate.id === taskId);
  if (task === undefined) throw new Error(`missing source manifest task for reference check: ${taskId}`);
  const destination = join(output, taskId);
  const verifier = validateVerifierSpec(JSON.parse(readFileSync(join(destination, "verifier.json"), "utf8")));
  if (verifier.kind !== "docker-command") throw new Error(`DeepSWE task ${taskId} has no native Docker verifier`);
  const logDirectory = join(work, "reference-logs", taskId);
  mkdirSync(logDirectory, { recursive: true });
  const exitCodes = [];
  for (let sample = 0; sample < 5; sample++) {
    const referenceWorkspace = join(work, `reference-${taskId}-${sample}`);
    try {
      cpSync(join(output, taskId, "workspace"), referenceWorkspace, { recursive: true });
      execFileSync("git", ["-C", referenceWorkspace, "apply", "--binary", join(source, "tasks", taskId, "solution/solution.patch")], { stdio: "ignore" });
      const result = await runDockerVerification({
        image: verifier.image,
        imageDigest: verifier.image_digest,
        workspaceDir: referenceWorkspace,
        command: verifier.command,
        workdir: verifier.workdir,
        network: verifier.network,
        logPath: join(logDirectory, `sample-${sample}.log`),
        timeoutS: referenceTimeoutS,
      });
      exitCodes.push(result.exitCode);
    } finally {
      if (existsSync(referenceWorkspace)) rmSync(referenceWorkspace, { recursive: true, force: true });
    }
  }
  if (exitCodes.some((code) => code !== 0)) {
    const failureDirectory = join(output, "reference-polarity-failure");
    mkdirSync(failureDirectory, { recursive: true });
    writeFileSync(join(failureDirectory, `${taskId}.json`), `${JSON.stringify({
      version: 1,
      task_id: task.id,
      source_task_checksum: task.checksum,
      verifier_image: task.verifier_image,
      verifier_image_digest: task.verifier_image_digest,
      samples: exitCodes.length,
      exit_codes: exitCodes,
      reference_passed: false,
    }, null, 2)}\n`, { mode: 0o600 });
    throw new Error(`DeepSWE reference polarity failed for ${taskId}: exit codes ${exitCodes.join(", ")}`);
  }
  const evidence = validateDeepSWEReferencePolarity({
      version: 1,
      task_id: task.id,
      source_task_checksum: task.checksum,
      verifier_image: verifier.image,
      verifier_image_digest: verifier.image_digest,
      samples: 5,
      exit_codes: exitCodes,
      reference_passed: true,
  }, task);
  const evidencePath = join(output, "reference-polarity", `${taskId}.json`);
  mkdirSync(join(output, "reference-polarity"), { recursive: true });
  writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, { mode: 0o600 });
  task.reference_polarity_sha256 = `sha256:${createHash("sha256").update(readFileSync(evidencePath)).digest("hex")}`;
}
writeFileSync(join(output, "deepswe-source-manifest.json"), `${JSON.stringify(sourceManifest, null, 2)}\n`, { mode: 0o600 });
const suitePath = join(output, "suite-manifest.json");
const suite = JSON.parse(readFileSync(suitePath, "utf8"));
suite.source_provenance.source_manifest_sha256 = sourceManifestSha256(sourceManifest);
writeFileSync(suitePath, `${JSON.stringify(suite, null, 2)}\n`, { mode: 0o600 });
NODE
printf '%s\n' "prepared DeepSWE revision $SOURCE_REV tasks: $*"
