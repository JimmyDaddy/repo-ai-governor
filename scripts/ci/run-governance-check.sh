#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
NODE_BIN="${NODE_BIN:-node}"
CLI=("$NODE_BIN" "$ROOT_DIR/bin/repo-ai-governor.js")

CWD="${REPO_AI_GOVERNOR_CWD:-$PWD}"
PROJECT="${REPO_AI_GOVERNOR_PROJECT:?REPO_AI_GOVERNOR_PROJECT is required}"
SPRINT="${REPO_AI_GOVERNOR_SPRINT:?REPO_AI_GOVERNOR_SPRINT is required}"
FORMAT="${REPO_AI_GOVERNOR_FORMAT:-json}"
REPORT_FORMAT="${REPO_AI_GOVERNOR_REPORT_FORMAT:-markdown}"

COMMON_ARGS=(--cwd "$CWD" --project "$PROJECT" --sprint "$SPRINT" --non-interactive --quiet --format "$FORMAT")
CHECK_ARGS=()
REPORT_ARGS=(--cwd "$CWD" --source "${REPO_AI_GOVERNOR_REPORT_SOURCE:-.repo-ai-governor/reports/latest.json}" --non-interactive --quiet --format "$REPORT_FORMAT")

if [[ "${REPO_AI_GOVERNOR_VERBOSE:-0}" == "1" ]]; then
  COMMON_ARGS+=(--verbose)
fi

if [[ "${REPO_AI_GOVERNOR_CHANGED_ONLY:-0}" == "1" ]]; then
  CHECK_ARGS+=(--changed-only)
fi

if [[ -n "${REPO_AI_GOVERNOR_CHECK_STAGE:-}" ]]; then
  CHECK_ARGS+=(--stage "$REPO_AI_GOVERNOR_CHECK_STAGE")
fi

if [[ -n "${REPO_AI_GOVERNOR_REPORT_OUT:-}" ]]; then
  REPORT_ARGS+=(--out "$REPO_AI_GOVERNOR_REPORT_OUT")
fi

"${CLI[@]}" doctor "${COMMON_ARGS[@]}" --strict

if ((${#CHECK_ARGS[@]} > 0)); then
  "${CLI[@]}" check "${COMMON_ARGS[@]}" --write-report "${CHECK_ARGS[@]}"
else
  "${CLI[@]}" check "${COMMON_ARGS[@]}" --write-report
fi

if [[ "${REPO_AI_GOVERNOR_RENDER_REPORT:-1}" == "1" ]]; then
  "${CLI[@]}" report "${REPORT_ARGS[@]}" >/dev/null
fi
