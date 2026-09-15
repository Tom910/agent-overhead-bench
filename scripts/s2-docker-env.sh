#!/usr/bin/env sh
set -eu

SOURCE=${1:?usage: s2-docker-env.sh SOURCE_ENV DEST_ENV}
DESTINATION=${2:?usage: s2-docker-env.sh SOURCE_ENV DEST_ENV}

fail() {
  printf 'S2 Docker environment: %s\n' "$1" >&2
  exit 1
}

[ -f "$SOURCE" ] || fail "source env file is unavailable"
[ ! -L "$SOURCE" ] || fail "source env file must not be a symlink"
[ ! -L "$DESTINATION" ] || fail "destination env file must not be a symlink"

key=
while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in
    ""|\#*) ;;
    OPENROUTER_API_KEY=*)
      [ -z "$key" ] || fail "source env file contains duplicate OPENROUTER_API_KEY"
      key=${line#*=}
      case "$key" in
        \"*\") key=${key#\"}; key=${key%\"} ;;
        \'*\') key=${key#\'}; key=${key%\'} ;;
      esac
      case "$key" in
        ""|*\ *|*\"*|*\'*) fail "OPENROUTER_API_KEY is empty or malformed" ;;
      esac
      ;;
    *) fail "source env file may contain only OPENROUTER_API_KEY" ;;
  esac
done < "$SOURCE"

[ -n "$key" ] || fail "OPENROUTER_API_KEY is missing"
(umask 077; printf 'OPENROUTER_API_KEY=%s\n' "$key" >"$DESTINATION")
