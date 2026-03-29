# Project-027 真实项目验收与实施程度检查手册（Draft）

- Status: draft
- Date: 2026-03-29
- Scope: `project-027-cli-interactive-shell-implementation`
- Related:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
  - `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/project-027-completion-audit-summary.md`
  - `README.md`
  - `docs/local-adoption-playbook.md`

## 1. 目的

本文用于把 `project-027-cli-interactive-shell-implementation` 截至 `2026-03-29` 的实施结论、真实项目验收思路，以及一套可直接复用的验收脚本模板沉淀到 draft 中，方便后续：

1. 在真实目标仓库中验证 React CLI shell 是否可用。
2. 验证 `stdout / stderr` 输出边界是否稳定。
3. 验证 `workflow / workspace / upgrade / connect / init` 这些 surface 是否满足当前技术方案承诺。
4. 给后续技术方案 promotion 或新增 adopter playbook 时提供复用底稿。

## 2. 截至 2026-03-29 的实施程度

### 2.1 已完成的能力

1. `init` 已具备 React shell foundation，并保持 `--no-interactive`、非 TTY、`plain/json` 的 fallback 语义。
2. `connect` 已接入共享 React shell summary surface，并可写出诊断产物；配合 `--record-ledger --task-id` 时还可写出 ledger backfill 产物。
3. `workspace` 已具备 dry-run / execute / rollback 的共享 React shell summary，且保留明确 rollback reference。
4. `workflow preview` 已落地为只读入口，不写 workflow definition / compiled IR。
5. `workflow create` 与 `workflow edit` 已落地，且会持久化：
   - `<workspace_root>/context/workflow/active-workflow.definition.json`
   - `<workspace_root>/context/compiled-ir/<execution_id>.json`
6. `workflow edit` 在存在已保存 definition 且未显式传入 `--workflow-template` 时，会优先加载 workspace 中已保存的活动定义。
7. `upgrade` 已接入显式 React shell PoC，但仍保持 `--ui react` 显式启用，不是默认切换。
8. adopter-facing README / playbook / help surface 已与当前实现对齐。

### 2.2 当前集成版本

以下版本以仓库 `package.json` 为准，是当前实现使用的本地真值：

1. `ink@6.8.0`
2. `@inkjs/ui@2.0.0`
3. `react@19.2.4`

### 2.3 仍然不是本轮承诺的内容

1. `upgrade` 还没有默认切到 React shell，只支持显式 `--ui react`。
2. 深度鼠标交互、alternate screen、全屏 TUI 不在当前模块承诺范围内。
3. 当前仓库的 `pnpm run check` 仍会被既有 artifact lifecycle backlog 阻断；这不是 `project-027` 本身的功能回归。

## 3. 真实项目验收原则

1. 先用 `dist` 二进制在真实仓库演练，再决定是否走 `path / link / tgz` 安装路线。
2. 先做低侵入验证，再做会落盘的 `workspace execute`、`workflow create/edit`、`rollback`。
3. React shell 的核心验收点不是“界面好不好看”，而是：
   - 只占用 `stderr`
   - 不污染既有 `stdout` summary / JSON contract
   - 在 `--no-interactive`、非 TTY、`plain/json` 下能稳定回退
4. `workflow preview` 必须保持只读。
5. `workflow create/edit` 必须同时满足“可保存 definition”与“可产出 compiler-accepted IR snapshot”。
6. `upgrade --ui react` 必须被当作显式 operator aid，而不是默认行为。
7. 若目标仓库不是本仓库这种 self-host 场景，`doctor/check` 里出现 `baseline_docs missing=5/5` 或 `script_not_found` 一类 warning 时，不应直接误判为 `project-027` 失败，需要结合目标仓库是否自带治理脚本再解释。

## 4. 环境假设

建议在一个真实但可控的仓库里验证，例如：

1. 一个你们团队正在使用、但允许创建临时验证分支的仓库。
2. 一个真实工程的临时 clone。
3. 一个对依赖图和工作区切换更敏感的 Yarn / npm / pnpm 仓库，用来专门验证 `dist` 二进制 rehearsal。

推荐预设：

1. `GOVERNOR_REPO=<repo-ai-governor 本地仓库绝对路径>`
2. `TARGET_REPO=<真实目标仓库绝对路径>`
3. 在 `TARGET_REPO` 中先切一个临时分支，例如 `validation/project-027`
4. 使用 Node `>=18`
5. 在执行前先确认 `git status --short` 可接受，因为 `workspace execute` 与 `workflow create/edit` 会写入文件

## 5. 验收矩阵

| Surface | 推荐命令 | 核心验收点 |
|---|---|---|
| `init` | `node <governor-repo>/dist/bin/repo-ai-governor.js --output pretty --ui react init` | 首次初始化时可显示 React shell；`--no-interactive` 时可回退 |
| `connect` | `node <governor-repo>/dist/bin/repo-ai-governor.js --output pretty --ui react connect` | 共享 shell 只占 `stderr`；诊断产物可落盘 |
| `workspace dry-run` | `node <governor-repo>/dist/bin/repo-ai-governor.js --output json --workspace-action dry-run --workspace-mode repo_local workspace` | 生成 plan artifact，且保留 rollback reference |
| `workspace execute` | `node <governor-repo>/dist/bin/repo-ai-governor.js --output json --workspace-action execute --workspace-mode repo_local workspace` | plan artifact 被迁移到目标 workspace；execution artifact 存在 |
| `workspace rollback` | `node <governor-repo>/dist/bin/repo-ai-governor.js --output json --workspace-action rollback --workspace-plan <plan-path> workspace` | rollback artifact 存在；selector 恢复 |
| `workflow preview` | `node <governor-repo>/dist/bin/repo-ai-governor.js --output pretty --ui react workflow preview --workflow-template loop-guarded` | 只读；不写 definition / compiled IR；React shell 只占 `stderr` |
| `workflow create` | `node <governor-repo>/dist/bin/repo-ai-governor.js --output json workflow create --workflow-template condition-route` | 写入活动 definition 与 compiled IR |
| `workflow edit` | `node <governor-repo>/dist/bin/repo-ai-governor.js --output json workflow edit` | 优先加载已保存 definition；继续写 compiled IR |
| `upgrade` | `node <governor-repo>/dist/bin/repo-ai-governor.js --output pretty --ui react upgrade` | React shell 为显式 opt-in；report/auto-migrated-config/rollback-snapshot 完整产出 |

## 6. 推荐执行顺序

### 6.1 第一阶段：低侵入 rehearsal

1. 先在 `repo-ai-governor` 仓库执行 `pnpm run build`。
2. 在真实目标仓库里，优先使用 `node <governor-repo>/dist/bin/repo-ai-governor.js ...` 运行，而不是一开始就改依赖。
3. 先跑：
   - `--help`
   - `init --output json`
   - `doctor --output json`
   - `check --output json`
4. 这一步的目的不是“证明所有治理能力都健康”，而是确认：
   - 命令可执行
   - 输出 contract 稳定
   - 对真实仓库没有出现意料外崩溃

### 6.2 第二阶段：切到 repo-local 进行可见产物验收

1. 用 `workspace dry-run` 生成迁移计划。
2. 用 `workspace execute` 切到 `repo_local`。
3. 然后再执行 `workflow create/edit`、`connect`、`upgrade`，这样产物会更容易在目标仓库内观察。

### 6.3 第三阶段：React shell 观察与 fallback 验收

1. 在真实 TTY 中执行 `--output pretty --ui react`。
2. 同时把 `stdout` 重定向到文件，人工观察终端里的 `stderr` shell。
3. 再执行一轮 `--output json` 和 `--no-interactive`，确认 fallback 行为稳定。

## 7. 真实项目验收脚本（自动化模板）

下面这份脚本优先做三类事情：

1. 用 `dist` 二进制执行真实仓库演练。
2. 自动检查 JSON contract 与关键产物路径。
3. 把人工 React shell 观察步骤留成脚本末尾的明确指令。

仓库内现成脚本入口：

```bash
TARGET_REPO=/absolute/path/to/real-target-repo \
bash scripts/acceptance/run-project-027-real-project-validation.sh
```

```bash
#!/usr/bin/env bash
set -euo pipefail

: "${GOVERNOR_REPO:=/absolute/path/to/repo-ai-governor}"
: "${TARGET_REPO:=/absolute/path/to/real-target-repo}"

CLI_BIN="$GOVERNOR_REPO/dist/bin/repo-ai-governor.js"
ACCEPTANCE_ROOT="$TARGET_REPO/.project-027-acceptance"
TOOL_MANAGED_ROOT="$ACCEPTANCE_ROOT/tool-managed/.repo-ai-governor"
REPO_LOCAL_ROOT="$TARGET_REPO/.repo-ai-governor"
REPORT_ROOT="$ACCEPTANCE_ROOT/reports/$(date +%Y%m%d-%H%M%S)"

mkdir -p "$REPORT_ROOT"

json_field() {
  node --input-type=module -e '
    import fs from "node:fs";
    const [filePath, fieldPath] = process.argv.slice(1);
    const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
    let cursor = payload;
    for (const segment of fieldPath.split(".")) {
      cursor = cursor?.[segment];
    }
    if (cursor === undefined) {
      console.error(`Missing field: ${fieldPath} in ${filePath}`);
      process.exit(2);
    }
    process.stdout.write(
      typeof cursor === "string" ? cursor : JSON.stringify(cursor),
    );
  ' "$1" "$2"
}

assert_file() {
  local file_path="$1"
  if [[ ! -f "$file_path" ]]; then
    echo "Missing expected file: $file_path" >&2
    exit 1
  fi
}

count_json_files() {
  local dir_path="$1"
  if [[ ! -d "$dir_path" ]]; then
    echo "0"
    return
  fi
  find "$dir_path" -type f -name '*.json' | wc -l | tr -d ' '
}

run_json() {
  local name="$1"
  shift
  local stdout_path="$REPORT_ROOT/${name}.stdout.json"
  local stderr_path="$REPORT_ROOT/${name}.stderr.log"

  echo "==> $name"
  (
    cd "$TARGET_REPO"
    "$@"
  ) >"$stdout_path" 2>"$stderr_path"
}

run_json_allow_fail() {
  local name="$1"
  shift
  local stdout_path="$REPORT_ROOT/${name}.stdout.json"
  local stderr_path="$REPORT_ROOT/${name}.stderr.log"

  echo "==> $name (allow-fail)"
  set +e
  (
    cd "$TARGET_REPO"
    "$@"
  ) >"$stdout_path" 2>"$stderr_path"
  local exit_code=$?
  set -e

  if [[ "$exit_code" -ne 0 ]]; then
    echo "Non-blocking failure captured for $name (exit=$exit_code)." >&2
    echo "Inspect: $stdout_path and $stderr_path" >&2
  fi
}

echo "==> building dist binary"
(
  cd "$GOVERNOR_REPO"
  pnpm install
  pnpm run build
)
assert_file "$CLI_BIN"

echo "==> baseline bootstrap in isolated tool-managed workspace"
run_json init_json \
  node "$CLI_BIN" \
  --output json \
  --workspace-mode tool_managed \
  --workspace-root "$TOOL_MANAGED_ROOT" \
  init

run_json doctor_json \
  node "$CLI_BIN" \
  --output json \
  --workspace-mode tool_managed \
  --workspace-root "$TOOL_MANAGED_ROOT" \
  doctor

run_json_allow_fail check_json \
  node "$CLI_BIN" \
  --output json \
  --workspace-mode tool_managed \
  --workspace-root "$TOOL_MANAGED_ROOT" \
  check

echo "==> workspace dry-run and execute into repo_local"
run_json workspace_dry_run_json \
  node "$CLI_BIN" \
  --output json \
  --workspace-action dry-run \
  --workspace-mode repo_local \
  --workspace-root "$REPO_LOCAL_ROOT" \
  workspace

PLAN_PATH="$(json_field "$REPORT_ROOT/workspace_dry_run_json.stdout.json" "command_result.details.plan_path")"
assert_file "$PLAN_PATH"

run_json workspace_execute_json \
  node "$CLI_BIN" \
  --output json \
  --workspace-action execute \
  --workspace-mode repo_local \
  --workspace-root "$REPO_LOCAL_ROOT" \
  workspace

EXEC_PLAN_PATH="$(json_field "$REPORT_ROOT/workspace_execute_json.stdout.json" "command_result.details.plan_path")"
EXECUTION_PATH="$(json_field "$REPORT_ROOT/workspace_execute_json.stdout.json" "command_result.details.execution_path")"
assert_file "$EXEC_PLAN_PATH"
assert_file "$EXECUTION_PATH"

COMPILED_IR_DIR="$REPO_LOCAL_ROOT/context/compiled-ir"
WORKFLOW_DIR="$REPO_LOCAL_ROOT/context/workflow"
mkdir -p "$COMPILED_IR_DIR" "$WORKFLOW_DIR"

PREVIEW_COUNT_BEFORE="$(count_json_files "$COMPILED_IR_DIR")"
run_json workflow_preview_json \
  node "$CLI_BIN" \
  --output json \
  --workspace-mode repo_local \
  --workspace-root "$REPO_LOCAL_ROOT" \
  workflow preview \
  --workflow-template loop-guarded
PREVIEW_COUNT_AFTER="$(count_json_files "$COMPILED_IR_DIR")"

if [[ "$PREVIEW_COUNT_BEFORE" != "$PREVIEW_COUNT_AFTER" ]]; then
  echo "workflow preview unexpectedly created compiled IR artifacts." >&2
  exit 1
fi

run_json workflow_create_json \
  node "$CLI_BIN" \
  --output json \
  --workspace-mode repo_local \
  --workspace-root "$REPO_LOCAL_ROOT" \
  workflow create \
  --workflow-template condition-route

DEFINITION_PATH="$(json_field "$REPORT_ROOT/workflow_create_json.stdout.json" "command_result.details.definition_path")"
CREATE_IR_PATH="$(json_field "$REPORT_ROOT/workflow_create_json.stdout.json" "command_result.details.compiled_ir_path")"
CREATE_SOURCE="$(json_field "$REPORT_ROOT/workflow_create_json.stdout.json" "command_result.details.definition_source")"
assert_file "$DEFINITION_PATH"
assert_file "$CREATE_IR_PATH"

if [[ "$CREATE_SOURCE" != "template_seed" ]]; then
  echo "workflow create should persist a template_seed definition, got: $CREATE_SOURCE" >&2
  exit 1
fi

run_json workflow_edit_json \
  node "$CLI_BIN" \
  --output json \
  --workspace-mode repo_local \
  --workspace-root "$REPO_LOCAL_ROOT" \
  workflow edit

EDIT_SOURCE="$(json_field "$REPORT_ROOT/workflow_edit_json.stdout.json" "command_result.details.definition_source")"
EDIT_IR_PATH="$(json_field "$REPORT_ROOT/workflow_edit_json.stdout.json" "command_result.details.compiled_ir_path")"
assert_file "$EDIT_IR_PATH"

if [[ "$EDIT_SOURCE" != "workspace_saved" ]]; then
  echo "workflow edit should load the saved workspace definition, got: $EDIT_SOURCE" >&2
  exit 1
fi

run_json upgrade_json \
  node "$CLI_BIN" \
  --output json \
  --workspace-mode repo_local \
  --workspace-root "$REPO_LOCAL_ROOT" \
  upgrade

UPGRADE_REPORT_PATH="$(json_field "$REPORT_ROOT/upgrade_json.stdout.json" "command_result.details.report_path")"
UPGRADE_AUTO_CONFIG_PATH="$(json_field "$REPORT_ROOT/upgrade_json.stdout.json" "command_result.details.auto_migrated_config_path")"
UPGRADE_ROLLBACK_SNAPSHOT_PATH="$(json_field "$REPORT_ROOT/upgrade_json.stdout.json" "command_result.details.rollback_snapshot_path")"
assert_file "$UPGRADE_REPORT_PATH"
assert_file "$UPGRADE_AUTO_CONFIG_PATH"
assert_file "$UPGRADE_ROLLBACK_SNAPSHOT_PATH"

run_json_allow_fail connect_json \
  node "$CLI_BIN" \
  --output json \
  --workspace-mode repo_local \
  --workspace-root "$REPO_LOCAL_ROOT" \
  connect

cat <<EOF

Automated contract/artifact validation completed.
Report root: $REPORT_ROOT

Manual React-shell checks to run in a real TTY before rollback:

1. Fresh-init check (use a fresh repo or clean the acceptance sandbox first):
   node "$CLI_BIN" --output pretty --ui react --workspace-mode tool_managed --workspace-root "$TOOL_MANAGED_ROOT" init

2. Workflow preview shell on stderr only:
   node "$CLI_BIN" --output pretty --ui react --workspace-mode repo_local --workspace-root "$REPO_LOCAL_ROOT" workflow preview --workflow-template condition-route > "$REPORT_ROOT/workflow-preview.pretty.stdout.txt"

3. Workflow create shell on stderr only:
   node "$CLI_BIN" --output pretty --ui react --workspace-mode repo_local --workspace-root "$REPO_LOCAL_ROOT" workflow create --workflow-template condition-route > "$REPORT_ROOT/workflow-create.pretty.stdout.txt"

4. Upgrade shell stays explicit opt-in:
   node "$CLI_BIN" --output pretty --ui react --workspace-mode repo_local --workspace-root "$REPO_LOCAL_ROOT" upgrade > "$REPORT_ROOT/upgrade.pretty.stdout.txt"

5. Optional connect shell:
   node "$CLI_BIN" --output pretty --ui react --workspace-mode repo_local --workspace-root "$REPO_LOCAL_ROOT" connect > "$REPORT_ROOT/connect.pretty.stdout.txt"

6. Fallback contract:
   node "$CLI_BIN" --output pretty --ui react --no-interactive --workspace-mode repo_local --workspace-root "$REPO_LOCAL_ROOT" workflow preview --workflow-template parallel-review > "$REPORT_ROOT/workflow-preview.no-interactive.stdout.txt"

Expected manual observations:

- Terminal stderr shows [react-shell:*] headers for the React-enabled commands.
- Redirected stdout files do not contain [react-shell:*].
- The --no-interactive command does not render React shell.

When all checks are done, run rollback:

node "$CLI_BIN" \
  --output json \
  --workspace-action rollback \
  --workspace-plan "$EXEC_PLAN_PATH" \
  --workspace-mode repo_local \
  --workspace-root "$REPO_LOCAL_ROOT" \
  workspace > "$REPORT_ROOT/workspace_rollback.stdout.json" 2> "$REPORT_ROOT/workspace_rollback.stderr.log"

EOF
```

## 8. 关键产物检查清单

执行完成后，至少检查以下路径是否符合预期：

1. `context/workflow/active-workflow.definition.json`
2. `context/compiled-ir/<execution_id>.json`
3. `context/upgrade/<upgrade_id>.report.json`
4. `context/upgrade/<upgrade_id>.auto-migrated-config.json`
5. `context/upgrade/<upgrade_id>.rollback-snapshot.yaml`
6. `context/diagnostics/connect/<connect_id>.json`
7. `context/ledger-backfill/connect/<connect_id>.json`（仅在 `--record-ledger --task-id` 时）
8. `context/workspace/<migration_id>.plan.json`
9. `context/workspace/<migration_id>.execution.json`
10. `context/workspace/<migration_id>.rollback.json`

## 9. 通过标准

可以把 `project-027` 在真实项目中的验收结果判为“通过”，当且仅当以下条件同时满足：

1. `dist` 二进制可以在真实目标仓库里直接运行，不需要先发布 npm 包。
2. React shell 在真实 TTY 下能显示，且 shell 文本只出现在 `stderr`。
3. `--output json`、`--no-interactive`、非 TTY 场景不发生 contract 回归。
4. `workflow preview` 保持只读。
5. `workflow create/edit` 成功写出 definition 与 compiled IR，并满足当前编译/guardrail 约束。
6. `workspace dry-run / execute / rollback` 的 plan / execution / rollback artifact 可追踪。
7. `upgrade --ui react` 仅在显式启用时显示 shell，且 report / auto-migrated-config / rollback-snapshot 都存在。

## 10. 建议后续动作

1. 若这套真实项目验收流程在两个以上目标仓库稳定通过，可把本文内容提炼回正式 adopter playbook。
2. 若后续要把 `upgrade` 或更多命令切成 React 默认路径，应基于本文脚本继续扩展“stdout contract 不变”的回归集。
3. 若后续要做技术方案 promotion，可把本文作为 “solution delivered + real-project validation path” 的 supporting draft 输入。
