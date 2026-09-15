#!/usr/bin/env bash
# Runs inside a tool image. Does not install anything on the Mac host.
set -euo pipefail

TOOL="${1:?tool name}"
OUT="${AOB_OUT:-/out}"
WORK="${AOB_WORK:-/work}"
DUMP="${AOB_DUMP:-/opt/aob/s2-dump-proxy.mjs}"
PROMPT_FILE="${WORK}/prompt.md"
TIMEOUT="${AOB_TIMEOUT:-180}"
MODEL="${AOB_MODEL:-z-ai/glm-5.3-flash}"

mkdir -p "$OUT"
cd "$WORK"
if [ ! -d .git ]; then
  git init >/dev/null
  git add -A
  git commit -m "s2 probe" --allow-empty >/dev/null || true
fi

if [ -z "${OPENROUTER_API_KEY:-}" ]; then
  echo "OPENROUTER_API_KEY missing" >"$OUT/error.txt"
  exit 2
fi

node "$DUMP" "$OUT" >/dev/null &
PROXY_PID=$!
trap 'kill "$PROXY_PID" 2>/dev/null || true' EXIT

for _ in $(seq 1 50); do
  if [ -s "$OUT/baseUrl.txt" ]; then
    break
  fi
  sleep 0.1
done
BASE="$(tr -d '[:space:]' <"$OUT/baseUrl.txt")"
if [ -z "$BASE" ]; then
  echo "dump proxy did not bind" >"$OUT/error.txt"
  exit 3
fi

PROMPT="$(cat "$PROMPT_FILE")"
export CI=1
export NO_COLOR=1
export TERM=dumb

openai_compatible_model() {
  case "$1" in
    openai/*) printf '%s\n' "$1" ;;
    *) printf 'openai/%s\n' "$1" ;;
  esac
}

run() {
  # stdin closed. Capture argv + exit without printing secrets.
  local start end rc
  start="$(date +%s)"
  set +e
  timeout "$TIMEOUT" "$@" <&- >"$OUT/stdout.txt" 2>"$OUT/stderr.txt"
  rc=$?
  set -e
  end="$(date +%s)"
  printf '{"argv":%s,"exit":%s,"seconds":%s}\n' \
    "$(python3 -c 'import json,sys; print(json.dumps(sys.argv[1:]))' -- "$@")" \
    "$rc" "$((end - start))" >"$OUT/run-meta.json"
  return "$rc"
}

redact_logs() {
  python3 - <<'PY'
import os, re
from pathlib import Path
key = os.environ.get("OPENROUTER_API_KEY", "")
pat = re.compile(r"sk-or-v1-[A-Za-z0-9]+|sk-ant-[A-Za-z0-9\-]+")
out = Path(os.environ["AOB_OUT"])
for p in out.glob("*.txt"):
    t = p.read_text(errors="replace")
    if key:
        t = t.replace(key, "<redacted>")
    t = pat.sub("<redacted>", t)
    p.write_text(t)
PY
}

rc=0
case "$TOOL" in
  claude-code)
    HOME_Q="/tmp/aob-claude-home"
    mkdir -p "$HOME_Q"
    export HOME="$HOME_Q"
    export ANTHROPIC_BASE_URL="$BASE"
    export ANTHROPIC_AUTH_TOKEN="$OPENROUTER_API_KEY"
    export ANTHROPIC_API_KEY=
    export ANTHROPIC_DEFAULT_SONNET_MODEL="$MODEL"
    export ANTHROPIC_DEFAULT_HAIKU_MODEL="$MODEL"
    export ANTHROPIC_DEFAULT_OPUS_MODEL="$MODEL"
    export CLAUDE_CODE_SUBAGENT_MODEL="$MODEL"
    run claude -p "$PROMPT" --output-format json --permission-mode bypassPermissions --model "$MODEL" || rc=$?
    ;;
  codex)
    CODEX_HOME_Q="/tmp/aob-codex-home"
    mkdir -p "$CODEX_HOME_Q"
    printf '%s\n' \
      'model_provider = "openrouter"' \
      'model_reasoning_effort = "high"' \
      "model = \"$MODEL\"" \
      '' \
      '[model_providers.openrouter]' \
      'name = "openrouter"' \
      "base_url = \"${BASE}/v1\"" \
      'env_key = "OPENROUTER_API_KEY"' \
      'wire_api = "responses"' \
      >"$CODEX_HOME_Q/config.toml"
    export CODEX_HOME="$CODEX_HOME_Q"
    run codex exec --skip-git-repo-check --ephemeral --sandbox workspace-write -C "$WORK" -m "$MODEL" "$PROMPT" || rc=$?
    ;;
  hermes)
    export OPENROUTER_BASE_URL="${BASE}/v1"
    run hermes -z "$PROMPT" --provider openrouter -m "$MODEL" --yolo --in "$WORK" || rc=$?
    ;;
  aider)
    # Do not use the openrouter/ model prefix — LiteLLM then bypasses OPENAI_API_BASE.
    export OPENAI_API_KEY="$OPENROUTER_API_KEY"
    export OPENAI_API_BASE="${BASE}/v1"
    unset OPENROUTER_API_KEY || true
    OPENAI_MODEL="$(openai_compatible_model "$MODEL")"
    run aider --yes-always --no-git \
      --openai-api-base "${BASE}/v1" \
      --model "$OPENAI_MODEL" \
      hello.ts \
      --message "$PROMPT" || rc=$?
    ;;
  opencode)
    export OPENAI_API_KEY="$OPENROUTER_API_KEY"
    export OPENAI_BASE_URL="${BASE}/v1"
    export OPENROUTER_API_KEY
    HOME_Q="/tmp/aob-opencode-home"
    mkdir -p "$HOME_Q/.config/opencode"
    export HOME="$HOME_Q"
    OPENAI_MODEL="$(openai_compatible_model "$MODEL")"
    PROVIDER_MODEL="${OPENAI_MODEL#openai/}"
    printf '%s\n' "{\"\$schema\":\"https://opencode.ai/config.json\",\"provider\":{\"openai\":{\"options\":{\"baseURL\":\"${BASE}/v1\"},\"models\":{\"${PROVIDER_MODEL}\":{\"name\":\"${PROVIDER_MODEL}\"}}}}}" >"$HOME_Q/.config/opencode/opencode.json"
    if opencode --help >/dev/null 2>"$OUT/help.txt"; then
      :
    fi
    # Non-interactive: prefer `opencode run` if present, else -p.
    if opencode run --help >/dev/null 2>&1; then
      run opencode run --model "$OPENAI_MODEL" "$PROMPT" || rc=$?
    else
      run opencode --model "$OPENAI_MODEL" -p "$PROMPT" || rc=$?
    fi
    ;;
  qwen)
    HOME_Q="/tmp/aob-qwen-home"
    mkdir -p "$HOME_Q/.qwen"
    printf '%s\n' '{"security":{"auth":{"selectedType":"openai"}}}' >"$HOME_Q/.qwen/settings.json"
    export HOME="$HOME_Q"
    export OPENAI_API_KEY="$OPENROUTER_API_KEY"
    export OPENAI_BASE_URL="${BASE}/v1"
    export OPENROUTER_API_KEY
    run qwen -p "$PROMPT" --yolo -m "$MODEL" -o json || rc=$?
    ;;
  goose)
    export OPENROUTER_API_KEY
    export OPENAI_API_KEY="$OPENROUTER_API_KEY"
    export OPENAI_BASE_URL="${BASE}/v1"
    run goose run -t "$PROMPT" || rc=$?
    ;;
  pi)
    BIN="$(command -v pi || command -v pi-coding-agent || true)"
    if [ -z "$BIN" ]; then
      echo "pi binary missing after image build" >"$OUT/error.txt"
      rc=127
    else
      export OPENAI_API_KEY="$OPENROUTER_API_KEY"
      export OPENAI_BASE_URL="${BASE}/v1"
      run "$BIN" --print "$PROMPT" || rc=$?
    fi
    ;;
  *)
    echo "unknown tool $TOOL" >"$OUT/error.txt"
    rc=2
    ;;
esac

export AOB_OUT="$OUT"
redact_logs || true
python3 - <<PY
from pathlib import Path
p = Path("$OUT") / "captured.jsonl"
n = 0
if p.is_file():
    n = sum(1 for line in p.read_text().splitlines() if line.strip())
print(f"tool=$TOOL captures={n} proxy=$BASE", flush=True)
PY
exit "$rc"
