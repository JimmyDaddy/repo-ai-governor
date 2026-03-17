#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
NODE_BIN="${NODE_BIN:-}"
NPM_BIN="${NPM_BIN:-}"
FORMAT="summary"
KEEP_ARTIFACTS="false"

resolve_runtime_bin() {
  local explicit_value="$1"
  local command_name="$2"
  local fallback_path="$3"

  if [[ -n "$explicit_value" ]]; then
    printf '%s\n' "$explicit_value"
    return 0
  fi

  if command -v "$command_name" >/dev/null 2>&1; then
    command -v "$command_name"
    return 0
  fi

  if [[ -x "$fallback_path" ]]; then
    printf '%s\n' "$fallback_path"
    return 0
  fi

  printf 'Unable to resolve required runtime binary: %s\n' "$command_name" >&2
  return 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --format=json)
      FORMAT="json"
      shift
      ;;
    --keep-artifacts)
      KEEP_ARTIFACTS="true"
      shift
      ;;
    *)
      break
      ;;
  esac
done

NODE_BIN="$(resolve_runtime_bin "$NODE_BIN" node /opt/homebrew/bin/node)"
NPM_BIN="$(resolve_runtime_bin "$NPM_BIN" npm /opt/homebrew/bin/npm)"

WORKSPACE="${1:-$(mktemp -d "${TMPDIR:-/tmp}/repo-ai-governor-getting-started.XXXXXX")}"
INSTALL_DIR="$(mktemp -d "${TMPDIR:-/tmp}/repo-ai-governor-install.XXXXXX")"
PROJECT="${REPO_AI_GOVERNOR_GETTING_STARTED_PROJECT:-demo}"
SPRINT="${REPO_AI_GOVERNOR_GETTING_STARTED_SPRINT:-sprint-001}"
REQUEST_FILE="${REPO_AI_GOVERNOR_GETTING_STARTED_REQUEST:-$ROOT_DIR/examples/release-ga-getting-started/request.md}"
RECORD_TEMPLATE="$ROOT_DIR/examples/release-ga-getting-started/acceptance-record-template.md"
RECORD_OUTPUT="${REPO_AI_GOVERNOR_GETTING_STARTED_RECORD:-$WORKSPACE/getting-started-record.md}"

export PATH="/opt/homebrew/bin:${PATH}"

mkdir -p "$WORKSPACE" "$INSTALL_DIR"

cat > "$INSTALL_DIR/package.json" <<'EOF'
{
  "name": "repo-ai-governor-getting-started-install",
  "version": "1.0.0",
  "private": true
}
EOF

"$NPM_BIN" run --prefix "$ROOT_DIR" build >/dev/null
PACK_JSON="$("$NPM_BIN" pack --json --silent --prefix "$ROOT_DIR" "$ROOT_DIR")"
TARBALL_FILENAME="$("$NODE_BIN" --input-type=module -e 'const payload = JSON.parse(process.argv[1]); const latest = Array.isArray(payload) ? payload.at(-1) : payload; process.stdout.write(latest.filename);' "$PACK_JSON")"
TARBALL_PATH="$ROOT_DIR/$TARBALL_FILENAME"

"$NPM_BIN" install --prefix "$INSTALL_DIR" "$TARBALL_PATH" >/dev/null
export REPO_AI_GOVERNOR_SELF_INSTALL_SOURCE="$TARBALL_PATH"

CLI=(npx --no-install repo-ai-governor)

cp "$REQUEST_FILE" "$WORKSPACE/request.md"
cp "$RECORD_TEMPLATE" "$RECORD_OUTPUT"

(
  cd "$INSTALL_DIR"
  "${CLI[@]}" init --cwd "$WORKSPACE" --project "$PROJECT" --sprint "$SPRINT" --adapter codex --format json >/dev/null
  "${CLI[@]}" doctor --cwd "$WORKSPACE" --project "$PROJECT" --sprint "$SPRINT" --strict --format json >/dev/null
  "${CLI[@]}" plan --cwd "$WORKSPACE" --project "$PROJECT" --sprint "$SPRINT" --input "$WORKSPACE/request.md" --title "Release GA getting started flow" --format json >/dev/null
  "${CLI[@]}" check --cwd "$WORKSPACE" --project "$PROJECT" --sprint "$SPRINT" --write-report --format json >/dev/null
  "${CLI[@]}" report --cwd "$WORKSPACE" --source .repo-ai-governor/reports/latest.json --format markdown --out .repo-ai-governor/reports/getting-started.md >/dev/null
)

PLAN_PATH="$WORKSPACE/docs/$PROJECT/$SPRINT/plan.md"
CHECKLIST_PATH="$WORKSPACE/docs/$PROJECT/$SPRINT/tasks/checklist.md"
CSV_PATH="$WORKSPACE/docs/$PROJECT/$SPRINT/tasks/tasks.csv"
REPORT_PATH="$WORKSPACE/.repo-ai-governor/reports/getting-started.md"

{
  printf '\n- Workspace: `%s`\n' "$WORKSPACE"
  printf -- '- Install dir: `%s`\n' "$INSTALL_DIR"
  printf -- '- Tarball: `%s`\n' "$TARBALL_FILENAME"
  printf -- '- Plan: `%s`\n' "$PLAN_PATH"
  printf -- '- Checklist: `%s`\n' "$CHECKLIST_PATH"
  printf -- '- CSV: `%s`\n' "$CSV_PATH"
  printf -- '- Report: `%s`\n' "$REPORT_PATH"
} >> "$RECORD_OUTPUT"

if [[ "$FORMAT" == "json" ]]; then
  "$NODE_BIN" --input-type=module - "$WORKSPACE" "$INSTALL_DIR" "$TARBALL_FILENAME" "$PLAN_PATH" "$CHECKLIST_PATH" "$CSV_PATH" "$REPORT_PATH" "$RECORD_OUTPUT" <<'EOF'
const [workspace, installDir, tarball, planPath, checklistPath, csvPath, reportPath, recordPath] = process.argv.slice(2);
process.stdout.write(`${JSON.stringify({
  status: "pass",
  workspace,
  installDir,
  tarball,
  artifacts: {
    plan: planPath,
    checklist: checklistPath,
    csv: csvPath,
    report: reportPath,
    record: recordPath
  }
}, null, 2)}\n`);
EOF
else
  printf '%s\n' "$WORKSPACE"
fi

if [[ "$KEEP_ARTIFACTS" != "true" ]]; then
  rm -rf "$INSTALL_DIR"
  rm -f "$TARBALL_PATH"
fi
