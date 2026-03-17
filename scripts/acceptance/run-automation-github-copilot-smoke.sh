#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
NODE_BIN="${NODE_BIN:-node}"
FORMAT="${REPO_AI_GOVERNOR_AUTOMATION_SMOKE_FORMAT:-summary}"
WORKSPACE="${REPO_AI_GOVERNOR_AUTOMATION_SMOKE_WORKSPACE:-}"

ARGS=(--entry "github-copilot" --format "$FORMAT")

if [[ -n "$WORKSPACE" ]]; then
  ARGS+=(--workspace "$WORKSPACE")
fi

"$NODE_BIN" "$ROOT_DIR/scripts/acceptance/run-automation-v1-smoke.js" "${ARGS[@]}"
