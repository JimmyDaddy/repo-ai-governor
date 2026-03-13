#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
NODE_BIN="${NODE_BIN:-node}"
CLI=("$NODE_BIN" "$ROOT_DIR/bin/repo-ai-governor.js")

CWD="${REPO_AI_GOVERNOR_CWD:-$PWD}"
REPORT_SOURCE="${REPO_AI_GOVERNOR_REPORT_SOURCE:?REPO_AI_GOVERNOR_REPORT_SOURCE is required}"
REPORT_FORMAT="${REPO_AI_GOVERNOR_REPORT_FORMAT:-markdown}"

ARGS=(report --cwd "$CWD" --source "$REPORT_SOURCE" --non-interactive --quiet --format "$REPORT_FORMAT")

if [[ -n "${REPO_AI_GOVERNOR_REPORT_OUT:-}" ]]; then
  ARGS+=(--out "$REPO_AI_GOVERNOR_REPORT_OUT")
fi

"${CLI[@]}" "${ARGS[@]}"
