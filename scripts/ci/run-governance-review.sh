#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
NODE_BIN="${NODE_BIN:-node}"
CLI=("$NODE_BIN" "$ROOT_DIR/bin/repo-ai-governor.js")

CWD="${REPO_AI_GOVERNOR_CWD:-$PWD}"
PROJECT="${REPO_AI_GOVERNOR_PROJECT:?REPO_AI_GOVERNOR_PROJECT is required}"
SPRINT="${REPO_AI_GOVERNOR_SPRINT:?REPO_AI_GOVERNOR_SPRINT is required}"
REVIEW_PATH="${REPO_AI_GOVERNOR_REVIEW_PATH:?REPO_AI_GOVERNOR_REVIEW_PATH is required}"
FORMAT="${REPO_AI_GOVERNOR_FORMAT:-json}"

ARGS=(review --cwd "$CWD" --project "$PROJECT" --sprint "$SPRINT" --path "$REVIEW_PATH" --non-interactive --quiet --format "$FORMAT")

if [[ "${REPO_AI_GOVERNOR_FAIL_ON_WARNING:-1}" == "1" ]]; then
  ARGS+=(--strict)
fi

if [[ -n "${REPO_AI_GOVERNOR_REVIEW_BASE:-}" ]]; then
  ARGS+=(--base "$REPO_AI_GOVERNOR_REVIEW_BASE")
fi

if [[ -n "${REPO_AI_GOVERNOR_REVIEW_HEAD:-}" ]]; then
  ARGS+=(--head "$REPO_AI_GOVERNOR_REVIEW_HEAD")
fi

"${CLI[@]}" "${ARGS[@]}"
