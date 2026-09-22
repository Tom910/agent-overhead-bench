#!/usr/bin/env bash
# Usage: bash qualify-bridge-patch.sh /reviewed/CLIProxyAPI /new/output-directory
# Runs red regressions on pinned source, then applies the exact patch and reruns.
set -euo pipefail
source_repo=${1:?Pass the reviewed CLIProxyAPI clone}
output_dir=${2:?Pass a new output directory}
evidence_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
pin=2430354330af80b645f9ffb1a51e1e7c72c4cc8e
go_image=golang@sha256:2a0ba12e116687098780d3ce700f9ce3cb340783779646aafbabed748fa6677c
test ! -e "$output_dir"
mkdir -m 700 -p "$output_dir"
output_dir=$(cd -- "$output_dir" && pwd)
mkdir "$output_dir/src" "$output_dir/out"
test "$(git -C "$source_repo" rev-parse "$pin^{commit}")" = "$pin"
git -C "$source_repo" archive "$pin" | tar -xf - -C "$output_dir/src"
git -C "$output_dir/src" init -q
cp "$evidence_dir/bridge_model_regression_test.go" "$output_dir/src/internal/translator/codex/openai/chat-completions/"
cp "$evidence_dir/bridge_retry_regression_test.go" "$output_dir/src/sdk/cliproxy/auth/"
compile_tests() {
  docker run --rm --cpus 4 --memory 8g -v "$output_dir:/work" -w /work/src \
    -e GOCACHE=/work/go-cache -e GOPATH=/work/go-path -e GOTOOLCHAIN=local \
    "$go_image" sh -c '
      go test -c -o /work/out/chat.test ./internal/translator/codex/openai/chat-completions &&
      go test -c -o /work/out/auth.test ./sdk/cliproxy/auth
    '
}
run_test() {
  docker run --rm --network none --read-only --cpus 4 --memory 8g \
    --tmpfs /tmp:rw,nosuid,nodev -e HOME=/tmp -v "$output_dir/out:/tests:ro" \
    "$go_image" "$@"
}
compile_tests > "$output_dir/build-red.log" 2>&1
if run_test /tests/chat.test -test.v -test.timeout=60s -test.run=^TestAOBTerminalModelIdentity$ > "$output_dir/model-red.log" 2>&1; then
  printf '%s\n' 'Expected model regression to fail on upstream pin' >&2
  exit 1
fi
if run_test /tests/auth.test -test.v -test.timeout=60s -test.run=^TestAOBNoUnauthorizedReplayAtEffectiveZero$ > "$output_dir/retry-red.log" 2>&1; then
  printf '%s\n' 'Expected retry regression to fail on upstream pin' >&2
  exit 1
fi
git -C "$output_dir/src" apply --check "$evidence_dir/cli-proxy-api-benchmark-guards.patch"
git -C "$output_dir/src" apply "$evidence_dir/cli-proxy-api-benchmark-guards.patch"
compile_tests > "$output_dir/build-green.log" 2>&1
run_test sh -c '
  /tests/chat.test -test.v -test.timeout=60s &&
  /tests/auth.test -test.v -test.timeout=60s -test.run="^(TestAOB|TestManager_Execute.*Unauthorized|TestManager_ShouldRetryAfterError_RespectsAuthRequestRetryOverride)"
' > "$output_dir/patch-green.log" 2>&1
printf 'Patch regression logs: %s\n' "$output_dir"
