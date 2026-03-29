#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_GOVERNOR_REPO="$(cd "$SCRIPT_DIR/../.." && pwd)"

GOVERNOR_REPO="${GOVERNOR_REPO:-$DEFAULT_GOVERNOR_REPO}"
TARGET_REPO="${TARGET_REPO:-}"
SKIP_BUILD="${SKIP_BUILD:-0}"
RUN_PRETTY_CHECKS="${RUN_PRETTY_CHECKS:-0}"
ALLOW_CHECK_FAILURE="${ALLOW_CHECK_FAILURE:-1}"
ALLOW_CONNECT_FAILURE="${ALLOW_CONNECT_FAILURE:-1}"
ALLOW_SAME_REPO="${ALLOW_SAME_REPO:-0}"
ALLOW_EXISTING_REPO_LOCAL="${ALLOW_EXISTING_REPO_LOCAL:-0}"
CLEAN_ACCEPTANCE_HOME="${CLEAN_ACCEPTANCE_HOME:-1}"

usage() {
  cat <<'EOF'
Usage:
  TARGET_REPO=/absolute/path/to/real-target-repo \
  bash scripts/acceptance/run-project-027-real-project-validation.sh

Optional environment variables:
  GOVERNOR_REPO=/absolute/path/to/repo-ai-governor
  SKIP_BUILD=1
  RUN_PRETTY_CHECKS=1
  ALLOW_CHECK_FAILURE=0|1
  ALLOW_CONNECT_FAILURE=0|1
  ALLOW_SAME_REPO=0|1
  ALLOW_EXISTING_REPO_LOCAL=0|1
  CLEAN_ACCEPTANCE_HOME=0|1
  ACCEPTANCE_ROOT=/custom/path
  ACCEPTANCE_HOME=/custom/path
  REPO_LOCAL_ROOT=/custom/path
  REPORT_ROOT=/custom/path
EOF
}

log() {
  printf '==> %s\n' "$*"
}

fail() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

require_dir() {
  local dir_path="$1"
  [[ -d "$dir_path" ]] || fail "Directory does not exist: $dir_path"
}

json_field() {
  local file_path="$1"
  local field_path="$2"
  node --input-type=module -e '
    import fs from "node:fs";

    const [payloadPath, selector] = process.argv.slice(1);
    const payload = JSON.parse(fs.readFileSync(payloadPath, "utf8"));
    let cursor = payload;
    for (const segment of selector.split(".")) {
      cursor = cursor?.[segment];
    }
    if (cursor === undefined) {
      console.error(`Missing field "${selector}" in ${payloadPath}`);
      process.exit(2);
    }
    process.stdout.write(
      typeof cursor === "string" ? cursor : JSON.stringify(cursor),
    );
  ' "$file_path" "$field_path"
}

assert_file() {
  local file_path="$1"
  [[ -f "$file_path" ]] || fail "Missing expected file: $file_path"
}

count_json_files() {
  local dir_path="$1"
  if [[ ! -d "$dir_path" ]]; then
    printf '0'
    return
  fi

  find "$dir_path" -type f -name '*.json' | wc -l | tr -d ' '
}

run_command() {
  local stdout_path="$1"
  local stderr_path="$2"
  shift 2
  (
    cd "$TARGET_REPO"
    HOME="$ACCEPTANCE_HOME" "$@"
  ) >"$stdout_path" 2>"$stderr_path"
}

run_json() {
  local name="$1"
  shift
  local stdout_path="$REPORT_ROOT/${name}.stdout.json"
  local stderr_path="$REPORT_ROOT/${name}.stderr.log"

  log "$name"
  run_command "$stdout_path" "$stderr_path" "$@"
}

run_json_allow_fail() {
  local name="$1"
  shift
  local stdout_path="$REPORT_ROOT/${name}.stdout.json"
  local stderr_path="$REPORT_ROOT/${name}.stderr.log"

  log "$name (allow-fail)"
  set +e
  run_command "$stdout_path" "$stderr_path" "$@"
  local exit_code=$?
  set -e

  if [[ "$exit_code" -ne 0 ]]; then
    printf 'warning: %s exited with code %s. inspect %s and %s\n' \
      "$name" "$exit_code" "$stdout_path" "$stderr_path" >&2
  fi
}

run_pretty_stdout_only() {
  local name="$1"
  shift
  local stdout_path="$REPORT_ROOT/${name}.stdout.txt"

  log "$name (watch stderr manually)"
  (
    cd "$TARGET_REPO"
    HOME="$ACCEPTANCE_HOME" "$@"
  ) >"$stdout_path"
}

canonicalize_dir() {
  local dir_path="$1"
  (
    cd "$dir_path"
    pwd
  )
}

if [[ -z "$TARGET_REPO" ]]; then
  usage
  fail "TARGET_REPO is required."
fi

require_dir "$GOVERNOR_REPO"
require_dir "$TARGET_REPO"

GOVERNOR_REPO="$(canonicalize_dir "$GOVERNOR_REPO")"
TARGET_REPO="$(canonicalize_dir "$TARGET_REPO")"

if [[ "$GOVERNOR_REPO" == "$TARGET_REPO" && "$ALLOW_SAME_REPO" != "1" ]]; then
  fail "TARGET_REPO must differ from GOVERNOR_REPO unless ALLOW_SAME_REPO=1."
fi

ACCEPTANCE_ROOT="${ACCEPTANCE_ROOT:-$TARGET_REPO/.project-027-acceptance}"
ACCEPTANCE_HOME="${ACCEPTANCE_HOME:-$ACCEPTANCE_ROOT/home}"
REPO_LOCAL_ROOT="${REPO_LOCAL_ROOT:-$TARGET_REPO/.repo-ai-governor}"
REPORT_ROOT="${REPORT_ROOT:-$ACCEPTANCE_ROOT/reports/$(date +%Y%m%d-%H%M%S)}"
CLI_BIN="${CLI_BIN:-$GOVERNOR_REPO/dist/bin/repo-ai-governor.js}"
REPO_LOCAL_CONFIG_PATH="$REPO_LOCAL_ROOT/governor.yaml"

if [[ -f "$REPO_LOCAL_CONFIG_PATH" && "$ALLOW_EXISTING_REPO_LOCAL" != "1" ]]; then
  fail "Existing repo-local config found at $REPO_LOCAL_CONFIG_PATH. Use a clean target repo or set ALLOW_EXISTING_REPO_LOCAL=1."
fi

if [[ "$CLEAN_ACCEPTANCE_HOME" == "1" ]]; then
  rm -rf "$ACCEPTANCE_HOME"
fi

mkdir -p "$ACCEPTANCE_HOME" "$REPORT_ROOT"

if git -C "$TARGET_REPO" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git -C "$TARGET_REPO" status --short >"$REPORT_ROOT/target-repo.git-status.txt"
fi

log "acceptance root: $ACCEPTANCE_ROOT"
log "report root: $REPORT_ROOT"

if [[ "$SKIP_BUILD" != "1" ]]; then
  log "build governor dist"
  (
    cd "$GOVERNOR_REPO"
    pnpm run build
  )
fi

assert_file "$CLI_BIN"

run_json init_json \
  node "$CLI_BIN" \
  --output json \
  init

INIT_CONFIG_PATH="$(json_field "$REPORT_ROOT/init_json.stdout.json" "command_result.artifacts.0.path")"
assert_file "$INIT_CONFIG_PATH"

run_json doctor_json \
  node "$CLI_BIN" \
  --output json \
  doctor

if [[ "$ALLOW_CHECK_FAILURE" == "1" ]]; then
  run_json_allow_fail check_json \
    node "$CLI_BIN" \
    --output json \
    check
else
  run_json check_json \
    node "$CLI_BIN" \
    --output json \
    check
fi

run_json workspace_dry_run_json \
  node "$CLI_BIN" \
  --output json \
  --workspace-action dry-run \
  --workspace-mode repo_local \
  --workspace-root "$REPO_LOCAL_ROOT" \
  workspace

DRY_RUN_SOURCE_WORKSPACE_ROOT="$(
  json_field "$REPORT_ROOT/workspace_dry_run_json.stdout.json" "command_result.details.source_workspace_root"
)"
PLAN_PATH="$(
  json_field "$REPORT_ROOT/workspace_dry_run_json.stdout.json" "command_result.details.plan_path"
)"
assert_file "$PLAN_PATH"

run_json workspace_execute_json \
  node "$CLI_BIN" \
  --output json \
  --workspace-action execute \
  --workspace-mode repo_local \
  --workspace-root "$REPO_LOCAL_ROOT" \
  workspace

EXEC_PLAN_PATH="$(
  json_field "$REPORT_ROOT/workspace_execute_json.stdout.json" "command_result.details.plan_path"
)"
EXECUTION_PATH="$(
  json_field "$REPORT_ROOT/workspace_execute_json.stdout.json" "command_result.details.execution_path"
)"
assert_file "$EXEC_PLAN_PATH"
assert_file "$EXECUTION_PATH"
assert_file "$REPO_LOCAL_CONFIG_PATH"

COMPILED_IR_DIR="$REPO_LOCAL_ROOT/context/compiled-ir"
WORKFLOW_DIR="$REPO_LOCAL_ROOT/context/workflow"
mkdir -p "$COMPILED_IR_DIR" "$WORKFLOW_DIR"

PREVIEW_COUNT_BEFORE="$(count_json_files "$COMPILED_IR_DIR")"
run_json workflow_preview_json \
  node "$CLI_BIN" \
  --output json \
  workflow preview \
  --workflow-template loop-guarded
PREVIEW_COUNT_AFTER="$(count_json_files "$COMPILED_IR_DIR")"

if [[ "$PREVIEW_COUNT_BEFORE" != "$PREVIEW_COUNT_AFTER" ]]; then
  fail "workflow preview unexpectedly wrote compiled IR artifacts."
fi

run_json workflow_create_json \
  node "$CLI_BIN" \
  --output json \
  workflow create \
  --workflow-template condition-route

DEFINITION_PATH="$(
  json_field "$REPORT_ROOT/workflow_create_json.stdout.json" "command_result.details.definition_path"
)"
CREATE_IR_PATH="$(
  json_field "$REPORT_ROOT/workflow_create_json.stdout.json" "command_result.details.compiled_ir_path"
)"
CREATE_SOURCE="$(
  json_field "$REPORT_ROOT/workflow_create_json.stdout.json" "command_result.details.definition_source"
)"
assert_file "$DEFINITION_PATH"
assert_file "$CREATE_IR_PATH"
[[ "$CREATE_SOURCE" == "template_seed" ]] || fail "workflow create should use definition_source=template_seed, got $CREATE_SOURCE"

run_json workflow_edit_json \
  node "$CLI_BIN" \
  --output json \
  workflow edit

EDIT_SOURCE="$(
  json_field "$REPORT_ROOT/workflow_edit_json.stdout.json" "command_result.details.definition_source"
)"
EDIT_IR_PATH="$(
  json_field "$REPORT_ROOT/workflow_edit_json.stdout.json" "command_result.details.compiled_ir_path"
)"
assert_file "$EDIT_IR_PATH"
[[ "$EDIT_SOURCE" == "workspace_saved" ]] || fail "workflow edit should use definition_source=workspace_saved, got $EDIT_SOURCE"

run_json upgrade_json \
  node "$CLI_BIN" \
  --output json \
  upgrade

UPGRADE_REPORT_PATH="$(
  json_field "$REPORT_ROOT/upgrade_json.stdout.json" "command_result.details.report_path"
)"
UPGRADE_AUTO_CONFIG_PATH="$(
  json_field "$REPORT_ROOT/upgrade_json.stdout.json" "command_result.details.auto_migrated_config_path"
)"
UPGRADE_ROLLBACK_SNAPSHOT_PATH="$(
  json_field "$REPORT_ROOT/upgrade_json.stdout.json" "command_result.details.rollback_snapshot_path"
)"
assert_file "$UPGRADE_REPORT_PATH"
assert_file "$UPGRADE_AUTO_CONFIG_PATH"
assert_file "$UPGRADE_ROLLBACK_SNAPSHOT_PATH"

if [[ "$ALLOW_CONNECT_FAILURE" == "1" ]]; then
  run_json_allow_fail connect_json \
    node "$CLI_BIN" \
    --output json \
    connect
else
  run_json connect_json \
    node "$CLI_BIN" \
    --output json \
    connect
fi

if [[ "$RUN_PRETTY_CHECKS" == "1" ]]; then
  if [[ -t 2 ]]; then
    run_pretty_stdout_only workflow_preview_pretty \
      node "$CLI_BIN" \
      --output pretty \
      --ui react \
      workflow preview \
      --workflow-template condition-route

    run_pretty_stdout_only workflow_create_pretty \
      node "$CLI_BIN" \
      --output pretty \
      --ui react \
      workflow create \
      --workflow-template condition-route

    run_pretty_stdout_only upgrade_pretty \
      node "$CLI_BIN" \
      --output pretty \
      --ui react \
      upgrade

    if [[ "$ALLOW_CONNECT_FAILURE" == "1" ]]; then
      set +e
      run_pretty_stdout_only connect_pretty \
        node "$CLI_BIN" \
        --output pretty \
        --ui react \
        connect
      set -e
    else
      run_pretty_stdout_only connect_pretty \
        node "$CLI_BIN" \
        --output pretty \
        --ui react \
        connect
    fi

    run_pretty_stdout_only workflow_preview_no_interactive_pretty \
      node "$CLI_BIN" \
      --output pretty \
      --ui react \
      --no-interactive \
      workflow preview \
      --workflow-template parallel-review
  else
    printf 'warning: RUN_PRETTY_CHECKS=1 was requested, but stderr is not a TTY. skipping manual React-shell checks.\n' >&2
  fi
fi

run_json workspace_rollback_json \
  node "$CLI_BIN" \
  --output json \
  --workspace-action rollback \
  --workspace-plan "$EXEC_PLAN_PATH" \
  workspace

ROLLBACK_PATH="$(
  json_field "$REPORT_ROOT/workspace_rollback_json.stdout.json" "command_result.details.rollback_path"
)"
assert_file "$ROLLBACK_PATH"

if [[ ! -f "$INIT_CONFIG_PATH" ]]; then
  fail "Tool-managed config disappeared after rollback: $INIT_CONFIG_PATH"
fi

if [[ ! -f "$REPO_LOCAL_CONFIG_PATH" && "$ALLOW_EXISTING_REPO_LOCAL" == "1" ]]; then
  printf 'warning: repo-local config at %s no longer exists after rollback.\n' "$REPO_LOCAL_CONFIG_PATH" >&2
fi

if [[ -f "$REPO_LOCAL_CONFIG_PATH" && "$ALLOW_EXISTING_REPO_LOCAL" != "1" ]]; then
  fail "Repo-local config still exists after rollback: $REPO_LOCAL_CONFIG_PATH"
fi

cat >"$REPORT_ROOT/summary.txt" <<EOF
Project-027 real-project validation completed.

Governor repo: $GOVERNOR_REPO
Target repo: $TARGET_REPO
Acceptance home: $ACCEPTANCE_HOME
Report root: $REPORT_ROOT

Validated artifacts:
- init config: $INIT_CONFIG_PATH
- workspace dry-run plan: $PLAN_PATH
- workspace execute plan: $EXEC_PLAN_PATH
- workspace execution report: $EXECUTION_PATH
- workflow definition: $DEFINITION_PATH
- workflow create compiled IR: $CREATE_IR_PATH
- workflow edit compiled IR: $EDIT_IR_PATH
- upgrade report: $UPGRADE_REPORT_PATH
- upgrade auto-migrated config: $UPGRADE_AUTO_CONFIG_PATH
- upgrade rollback snapshot: $UPGRADE_ROLLBACK_SNAPSHOT_PATH
- workspace rollback report: $ROLLBACK_PATH

Source tool-managed workspace root:
- $DRY_RUN_SOURCE_WORKSPACE_ROOT

Repo-local workspace root:
- $REPO_LOCAL_ROOT
EOF

cat <<EOF

Automated contract and artifact checks completed successfully.
Report root: $REPORT_ROOT
Summary: $REPORT_ROOT/summary.txt

If you also need visual React-shell confirmation, re-run with:
  RUN_PRETTY_CHECKS=1 TARGET_REPO="$TARGET_REPO" bash "$GOVERNOR_REPO/scripts/acceptance/run-project-027-real-project-validation.sh"

EOF
