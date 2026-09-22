#!/usr/bin/env bash
# Compile pinned OSS code, then run only reviewed fixtures without network access.
# Usage: bash qualify-bridge.sh /path/to/CLIProxyAPI /new/output/directory
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
mkdir "$output_dir/src/internal/qualification"
cp "$evidence_dir/bridge_qualification_test.go" "$output_dir/src/internal/qualification/"
cp "$evidence_dir/bridge_retry_characterization_test.go" "$output_dir/src/sdk/cliproxy/auth/"
# Build allows dependency downloads. go test -c does not execute package code.
# No host home, credential directories, environment secrets or Docker socket mounted.
docker run --rm --cpus 4 --memory 8g \
  -v "$output_dir:/work" -w /work/src \
  -e GOCACHE=/work/go-cache -e GOPATH=/work/go-path -e GOTOOLCHAIN=local \
  "$go_image" sh -c '
    go test -c -o /work/out/chat.test ./internal/translator/codex/openai/chat-completions &&
    go test -c -o /work/out/responses.test ./internal/translator/codex/openai/responses &&
    go test -c -o /work/out/executor.test ./internal/runtime/executor &&
    go test -c -o /work/out/qualification.test ./internal/qualification &&
    go test -c -o /work/out/auth.test ./sdk/cliproxy/auth
  ' > "$output_dir/build.log" 2>&1
docker run --rm --network none --read-only --cpus 4 --memory 8g \
  --tmpfs /tmp:rw,nosuid,nodev -e HOME=/tmp \
  -v "$output_dir/out:/tests:ro" "$go_image" sh -c '
    /tests/chat.test -test.v -test.timeout=60s &&
    /tests/responses.test -test.v -test.timeout=60s &&
    /tests/qualification.test -test.v -test.timeout=60s &&
    /tests/executor.test -test.v -test.timeout=60s -test.run="^(TestCodexNativeStreamFidelity|TestCodexWebsocketLiteHeaderWithoutSessionHeaders|TestTranslateCodexRequestPair|TestCodexQuotaError|TestParseCodexRetryAfter|TestNewCodexStatusErr|TestIsCodexUsageLimitError|TestNormalizeCodexParallelToolCalls|TestObserveCodexTokenEventRecordsResponseModel|TestCodexUsageRecordsCarryResponseModelPerModel|TestCodexExecutorReasoningReplayCacheDoesNotInjectNativeResponsesRequest|TestCodexExecutorReasoningReplayCacheDoesNotStoreNativeResponsesRequest)" &&
    /tests/auth.test -test.v -test.timeout=60s -test.run=^TestCharacterizeZeroRetryStillReplaysAfter401$
  ' > "$output_dir/tests.log" 2>&1
printf 'Qualification logs: %s\n' "$output_dir"
