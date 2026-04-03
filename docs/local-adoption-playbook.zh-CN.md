# 本地接入与采用手册

## 1. 适用范围

本手册面向需要在本地仓库接入、调试、升级 `repo-ai-governor` 的用户，目标是不依赖 npm 发布也能完成可重复执行的治理流程。

## 2. 安装策略矩阵

| 模式 | 适用场景 | 命令 |
|---|---|---|
| `path` | 本地快速迭代 | `pnpm add --save-exact <governor-repo>` |
| `link` | 源码联调 | `pnpm add --save-exact link:<governor-repo>` |
| `tgz` | 候选发布/GA 演练与可复现安装 | `pnpm pack --json` + `pnpm add --save-exact <tarball>` |
| `dist-binary` | 面向 Yarn/npm 或已有脏工作树仓库的无侵入演练 | `node <governor-repo>/dist/bin/repo-ai-governor.js <command>` |

当前口径：

1. `path + link` 仍是默认本地接入路径。
2. `tgz` 可用于 clean-room 与候选发布演练，但安装环境需要能访问 npm registry。
3. `tgz` 不是离线自包含安装；`commander`、`i18next`、`yaml` 等外部依赖仍会在 `pnpm add` 阶段解析。
4. 当你需要先验证 CLI 行为、又不想立刻改动已有 Yarn/npm 仓库依赖图时，优先使用 `dist-binary` 演练路径。

## 2.1 已发布 package 参考资产面

已发布 tarball 应包含：

1. `README.md` 与 `README.zh-CN.md`
2. `docs/local-adoption-playbook.md` 与 `docs/local-adoption-playbook.zh-CN.md`
3. `examples/`
4. `integrations/ide/` 与 `integrations/desktop/`
5. `.codex/skills/`

`.codex/skills/` 下的 repo-local skills 仅作为参考资产随包发布。如需在目标仓库中被 Codex 发现，请将所需 skill 复制到目标仓库自己的 `.codex/skills/` 目录。

## 3. 初始化与只读预检

在目标仓库执行基线命令链：

```bash
pnpm exec repo-ai-governor --help
pnpm exec repo-ai-governor init --output json
pnpm exec repo-ai-governor doctor --output json
pnpm exec repo-ai-governor check --output json
```

如果是首次接入并希望通过问答引导完成配置，可使用：

```bash
pnpm exec repo-ai-governor init --output pretty
```

在本地 TTY + `pretty` 输出下，交互问答默认开启；CI/脚本化 bootstrap 可加 `--no-interactive` 关闭交互。

如果你使用 `dist-binary` 演练，请将 `pnpm exec repo-ai-governor` 替换为：

```bash
node <governor-repo>/dist/bin/repo-ai-governor.js <command>
```

当仓库不可写时，`doctor` 应返回只读 attach 语义。

基于真实 pilot 的补充说明：

1. `init` 默认会落到 `tool_managed`，因此全新目标仓库未必会立刻生成 `.repo-ai-governor/`。
2. 全新外部仓库中，`doctor` 可能出现 `baseline_docs missing=5/5` warning；当前应视为 external-adopter baseline，而不是 bootstrap failure。
3. 外部目标仓库中，`check` 可能出现 `check-task-ledger-sync=script_not_found` 等 warning；除非该仓库也同时 vendoring 了 self-host 治理脚本，否则这是当前预期。

session-first shell 快速演练：

```bash
pnpm exec repo-ai-governor --output pretty
pnpm exec repo-ai-governor --output pretty "summarize this repository"
pnpm exec repo-ai-governor resume --help
```

快速验收点：

1. 在本地 TTY + `pretty` 模式下，无子命令入口应附着到 `stderr` 上的 session shell。
2. 手工验证建议覆盖 `/help`、`/theme calm`、`/agent main`、`/history`、`/search <term>`、`/multiline`、`!pwd`、`/exit`，然后再执行 `resume [session-id]`。
3. `--no-interactive`、非 TTY 与 `plain/json` 不应进入 session shell。

## 3.1 多 AI 工具接入（Codex / Claude Code / GitHub Copilot）

建议按“工具可用性 -> 候选配置生成 -> adapter 诊断 -> traced dry-run”四步执行：

1. 先确认你要接入的 AI 工具在目标仓库内可独立工作：
   - Codex CLI：`codex --help`
   - Claude Code CLI：`claude --help`
   - GitHub Copilot：确认 IDE 对话可用；CLI 偏重场景建议先确认 `gh auth status`。
2. 先生成一份 candidate adapters baseline：

```bash
pnpm exec repo-ai-governor connect --tools codex,claude-code --preset multi-tool-default --output json
```

如需显式覆盖角色路由：

```bash
pnpm exec repo-ai-governor connect \
  --tools codex,claude-code,github-copilot \
  --preset multi-tool-default \
  --role-binding planner=codex,claude-code \
  --role-binding reviewer=claude-code,codex \
  --output json
```

3. 在应用到活动配置前先审阅生成结果：
   - 候选 YAML：`<workspace_root>/context/diagnostics/connect/<connect-id>.governor.yaml`
   - 诊断 JSON：`<workspace_root>/context/diagnostics/connect/<connect-id>.json`
   - `connect` 不会原地改写活动 `governor.yaml`；它只生成可审阅的 candidate artifact。
   - 如果你希望 candidate `adapters` block 完整替换当前配置，而不是 merge，可显式传 `--overwrite`。
   - 当前可用 preset 为 `single-tool-minimal`、`multi-tool-default`、`single-tool-all-roles`、`restricted-network-safe`。
4. 运行 adapter 诊断与 traced dry-run 验证：

```bash
pnpm exec repo-ai-governor doctor --adapters --output json
pnpm exec repo-ai-governor doctor --adapters --fix --output json
pnpm exec repo-ai-governor verify --adapters --output json
pnpm exec repo-ai-governor run --output json --dry-run --trace
```

重点检查：

1. `connect` 的 JSON 应返回 `candidate_config_path`、`candidate_config_valid`、`selected_tools`、`onboardingContract` 与 `agentView`。
2. 如果当前 workspace 还带着不完整的 local-model 基线，`connect` 可能返回 `candidateConfigValidationError`，但仍应继续写出 candidate artifact 和 diagnostics payload。
3. `doctor --adapters --fix` 只做 safe-local repair，例如补可写工作区/配置/内存目录；认证、CLI 安装、代理设置和本地模型下载仍保留在 `nextAction`。
4. `verify --adapters` 会输出 onboarding contract、role/tool matrix 与 `agentView`；若状态为 `fail`，应视为真实执行前的硬阻断。
5. `run --dry-run --trace` 还会输出 agent projection 细节，以及一个位于 `<workspace_root>/context/diagnostics/run/agent-supervisor/<execution_id>.json` 的 LangGraph supervisor artifact。

## 3.2 升级分析与回滚准备

在把 schema 迁移结果写回 `governor.yaml` 之前，先执行 `upgrade`：

```bash
pnpm exec repo-ai-governor upgrade --output pretty
pnpm exec repo-ai-governor upgrade --output json
```

输出解释：

1. `upgrade_report` 是权威 schema diff 产物，包含差异摘要、迁移建议与 confirmation items。
2. `upgrade_auto_migrated_config` 只是 analyze-only 候选配置；替换 `governor.yaml` 前应先与当前文件比对。
3. `upgrade_rollback_snapshot` 是 canonical rollback source；建议与本次配置变更一起保存。
4. 如果输出出现 `confirmation_items` warning，或 blocking 数量非零，应先完成人工确认，再决定是否写回迁移后的配置。
5. 只有升级后的配置至少通过一轮 `doctor` + `check` 后，才可以移除最近一次 rollback reference。
6. 在本地 TTY + `pretty` 模式下，`upgrade` 会默认进入 React shell，并只把分析回执渲染到 `stderr`；如需更安静的人类可读运行，可显式指定 `--ui none` 或 `--ui classic`，stdout 机器可读契约保持不变。
7. 如需切换 React shell 预设主题，可在本地验证命令上添加 `--ui-theme governor|catppuccin|calm`。

## 3.3 Workflow 定义预览与保存

使用 workflow surface 先预览内置拓扑，再保存一份通过校验的活动定义：

```bash
pnpm exec repo-ai-governor workflow preview --workflow-template loop-guarded --output json
pnpm exec repo-ai-governor workflow create --workflow-template condition-route --output json
pnpm exec repo-ai-governor workflow edit --output pretty
```

输出解释：

1. `workflow preview` 始终保持只读，不会写入 workflow 相关产物。
2. `workflow create` 与 `workflow edit` 会把当前活动 workflow definition 保存到 `<workspace_root>/context/workflow/active-workflow.definition.json`。
3. 成功的 create/edit 还会额外写入一份通过编译器接受的快照到 `<workspace_root>/context/compiled-ir/<execution_id>.json`。
4. Loop 节点必须同时声明 `maxCycles` 与 `maxWallTimeSeconds`；Condition 节点分支必须使用非空且唯一的 `conditionKey`，否则会阻断持久化。
5. 若当前 workspace 已存在保存过的 workflow，`workflow edit` 会优先载入该定义；如需从内置模板重新生成活动定义，可显式传入 `--workflow-template`。

## 4. Workspace 模式切换与回滚

默认模式是 `tool_managed`。

如需切换 `repo_local`，建议使用显式迁移命令：

```bash
pnpm exec repo-ai-governor workspace dry-run --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace execute --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace rollback <plan-path> --output json
```

回滚步骤：

1. 保留 `workspace dry-run` 或 `workspace execute` 输出中的 `plan-path`。
2. 使用同一个 `plan-path` 执行显式 rollback。
3. 重新执行 `doctor`，确认 `workspaceRoot` 已恢复到 `tool_managed`。

如果你不想在每次命令上重复 `--ui-theme`，可以用下面的命令持久化当前工作区默认 React shell 主题：

```bash
pnpm exec repo-ai-governor workspace set-ui-theme calm --output json
```

如果你更想从可用预设里直接挑选，也可以打开交互式 selector：

```bash
pnpm exec repo-ai-governor workspace set-ui-theme --output pretty
pnpm exec repo-ai-governor set-ui-theme --output pretty
```

如果你想给所有工作区统一设置一个全局默认 React shell 主题，可执行：

```bash
pnpm exec repo-ai-governor set-ui-theme calm --output json
```

主题与重置说明：

1. 主题优先级固定为命令覆盖 `--ui-theme` > workspace 默认值 > 全局 CLI 默认值。
2. `set-ui-theme` 默认会把 `ui.react.theme` 写入当前活动 `governor.yaml`；新生成的配置默认带有 `ui.react.theme: governor`。
3. 如果当前同时存在 repo-local selector config，workspace 范围的 `set-ui-theme` 只会在该 selector 文件原本已存在时保持同步。
4. 顶层 `set-ui-theme <preset>` 默认作用于 global，会写入 `~/.repo-ai-governor/cli-preferences.yaml`，不会改动 workspace 配置；只有你明确传 `--theme-scope workspace` 时，这个快捷入口才会落到当前 workspace。
5. `pnpm exec repo-ai-governor set-ui-theme --help` 会列出可用预设，而在交互式 TTY + `pretty` 模式下省略 `[theme]` 则会直接打开 selector。
6. 当你只想在验证时临时切换外观，继续使用 `--ui-theme governor|catppuccin|calm` 即可。
7. 如需移除当前 selector/config 文件但保留 workflow、diagnostics、review 等产物，可执行 `pnpm exec repo-ai-governor workspace clear-config --output json`。
8. 旧的 `--workspace-action ...` 长写法仍可继续使用；更推荐人工执行时使用 `workspace <action> [value]` 的短写。

Artifact locality 合同：

1. `workspace dry-run` 会把计划产物写到当前活动 workspace 根。
2. 成功执行 `workspace execute` 后，plan/execution 产物会重写到目标 workspace 根。
3. `workspace rollback` 会把 rollback 产物写到恢复后的 source workspace 根，并在 cleanup 成功后移除空的 `.repo-ai-governor-migration/<migration-id>` scratch 目录。
4. 如果 `workspace execute` 失败，请先查看 stderr 或 JSON `error_details.report_path` 给出的 failure summary 产物，再决定是否重试。
5. 如果 rollback 结束时出现 `workspace_scratch_cleanup` warning，应先确认回滚状态稳定，再手工清理保留的 scratch 根目录。

## 4.1 真实项目验收 Runbook

如果你想在一个真实目标仓库中先完整验证当前 interactive-shell 交付，再决定是否更大范围采用，建议按下面这条 runbook 执行。自动化 wrapper 仍覆盖 `project-027` 的命令内 React shell 基线；`project-029` 的 session-first shell 则继续放在同一轮手工演练窗口里验收。

自动化脚本入口：

```bash
TARGET_REPO=/absolute/path/to/real-target-repo \
bash "$GOVERNOR_REPO/scripts/acceptance/run-project-027-real-project-validation.sh"
```

推荐顺序：

1. 先在 governor 仓库里构建 `dist`，然后优先用 `dist` 二进制演练，而不是一开始就改目标仓库依赖。
2. 第一轮先走低侵入的 `tool_managed` 沙箱 bootstrap 验证，脚本内部会通过隔离 `HOME` 来避免污染宿主默认 workspace。
3. 只有在准备好观察持久化产物与 rollback reference 时，再切到 `repo_local`。
4. React shell 要在真实 TTY 中观察，但同一批 surface 还要再用 `json` 或 `--no-interactive` 跑一轮，确认 stdout contract 没有回归。

建议环境：

```bash
export GOVERNOR_REPO=/absolute/path/to/repo-ai-governor
export TARGET_REPO=/absolute/path/to/real-target-repo
export CLI_BIN="$GOVERNOR_REPO/dist/bin/repo-ai-governor.js"
export ACCEPTANCE_HOME="$TARGET_REPO/.project-027-acceptance/home"
export REPO_LOCAL_ROOT="$TARGET_REPO/.repo-ai-governor"

cd "$GOVERNOR_REPO"
pnpm run build

cd "$TARGET_REPO"
```

低侵入 bootstrap 演练：

```bash
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json init
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json doctor
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json check
```

说明：

1. 全新外部仓库可能会出现 `baseline_docs missing=5/5` 或 `script_not_found` warning；除非目标仓库本来就应该 vendoring self-host 治理脚本，否则这更像 external-adopter baseline 信号，而不是功能失败。
2. 这一轮的目标是验证命令稳定性与机器可读输出，而不是证明目标仓库已经满足所有 self-host 治理门禁。

Workspace 切换与回滚演练：

```bash
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json --workspace-action dry-run --workspace-mode repo_local --workspace-root "$REPO_LOCAL_ROOT" workspace
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json --workspace-action execute --workspace-mode repo_local --workspace-root "$REPO_LOCAL_ROOT" workspace
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json --workspace-action rollback --workspace-plan <plan-path> workspace
```

Workflow 与 upgrade 验证：

```bash
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json workflow preview --workflow-template loop-guarded
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json workflow create --workflow-template condition-route
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json workflow edit
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json upgrade
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json connect
```

真实 TTY 中的 React shell 手工检查：

```bash
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output pretty --ui react workflow preview --workflow-template condition-route > workflow-preview.stdout.txt
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output pretty --ui react workflow create --workflow-template condition-route > workflow-create.stdout.txt
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output pretty --ui react upgrade > upgrade.stdout.txt
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output pretty --ui react connect > connect.stdout.txt
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output pretty --ui react --no-interactive workflow preview --workflow-template parallel-review > workflow-preview.no-interactive.stdout.txt
```

真实 TTY 中的 session shell 手工检查：

```bash
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output pretty
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output pretty "summarize the repository layout"
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" resume
```

期望观察结果：

1. React shell 文本只在终端 `stderr` 中可见，不应出现在重定向的 stdout 文件里。
2. `workflow preview` 必须保持只读，不创建 workflow definition 或 compiled IR 产物。
3. `workflow create` 与 `workflow edit` 必须持久化：
   - `<workspace_root>/context/workflow/active-workflow.definition.json`
   - `<workspace_root>/context/compiled-ir/<execution_id>.json`
4. `upgrade` 必须写出：
   - `context/upgrade/<upgrade_id>.report.json`
   - `context/upgrade/<upgrade_id>.auto-migrated-config.json`
   - `context/upgrade/<upgrade_id>.rollback-snapshot.yaml`
5. 在本地 TTY + `pretty` 模式下，`upgrade` 默认进入 React shell；`--ui none` 与 `--ui classic` 仍是关闭该壳层的路径。
6. `--no-interactive` 运行时应正常回退，不渲染 React shell。
7. 在本地 TTY + `pretty` 模式下，无子命令入口应附着到 session shell，带引号的启动 prompt 会作为首轮消息发送，而 `resume` 可以重新附着最近一次持久化会话。
8. session shell 的手工检查应确认 slash command 可发现性（`/help`）、route/theme 自检（`/agent`、`/theme`）、history/search recall、多行输入与 `!` passthrough 都成立，且不会污染重定向的 stdout。
9. session shell 的手工检查还应确认 live Ink 输入行为：输入 `/` 会即时打开 palette，`Up/Down` 可切换高亮，`Tab` 会补全高亮命令，`Esc` 会关闭 palette，`Ctrl+L` 只清理本地 live surface，paste / CJK 输入保持完整。

当下面这些条件同时满足时，可视为本次真实项目验收通过：

1. `dist` 二进制能在真实目标仓库中直接运行。
2. React shell 只占用 `stderr`。
3. `json` 与 `--no-interactive` 流程保持既有 stdout contract。
4. `workspace` 的 plan / execution / rollback 产物都可追踪。
5. `workflow create/edit` 会落盘 definition 与 compiled IR，而 `workflow preview` 始终保持只读。
6. 无论通过默认路由还是显式 `--ui react` 进入 React shell，`upgrade` 都必须完整产出三类 artifact。
7. session-shell 默认入口、带引号的首轮 prompt 与 `resume` 在真实 TTY 中表现一致，同时不影响 `json` 与 `--no-interactive` 契约。
8. live slash palette 与键盘行为（`/`、`Up/Down`、`Tab`、`Esc`、`Ctrl+L`）在真实 TTY 烟雾验证中表现一致。

## 5. 本地调试路径

### 5.1 Dry-run 与 Trace

```bash
pnpm exec repo-ai-governor run --output json --dry-run --trace
```

### 5.2 Replay 回放

```bash
pnpm exec repo-ai-governor run --output json --replay <replay-file-path>
```

当已有运行产物时，可使用 replay 做确定性排障。

## 6. review-verify 与台账回写链路

执行协作闭环：

```bash
pnpm exec repo-ai-governor review --output json
pnpm exec repo-ai-governor review-verify --output json
```

关键产物目录位于 workspace `context` 下：

1. `context/review-queue/requests`
2. `context/review-queue/results`
3. `context/ledger-backfill/review-verify`

这些产物是 Stage 9B rehearsal 的前置条件，用于证明 review 验证与任务台账回写可审计、可回链。

## 7. 示例资产映射

根级 `examples/` 为标准演练入口：

1. `examples/single-role-minimal-flow`
2. `examples/multi-role-collaboration-flow`
3. `examples/hitl-escalation-flow`
4. `examples/restricted-network-degrade-flow`

对应校验命令：
需在 `<governor-repo>` 执行：

```bash
pnpm run check:examples-doc-smoke
pnpm run check:examples-runtime-smoke
pnpm run check:examples-smoke
```

## 7.1 最小语言模板基线

当前已发布包通过 `@repo-ai-governor/standards` 暴露两套内置最小治理模板：

1. `pythonMinimalGovernancePack`
   - 基线聚焦：`pyproject.toml`、`ruff format/check`、`pytest`、`pyright`
2. `goMinimalGovernancePack`
   - 基线聚焦：`go.mod/go.sum`、`go fmt ./...`、`go test ./...`、`go vet ./...`

推荐把它们作为 `official` 基线层，然后在其上叠加 team / repository overrides：

```ts
import {
  StandardsPackRegistry,
  goMinimalGovernancePack,
  pythonMinimalGovernancePack,
} from "@repo-ai-governor/standards";

const registry = new StandardsPackRegistry({
  packs: [pythonMinimalGovernancePack, goMinimalGovernancePack],
});
```

说明：

1. 该入口位于已发布的 `docs/` 与 `dist/` 范围内，适用于源码、tgz 与正式发布包用户。
2. 这两套模板是“最小产品化基线”，不是完整语言最佳实践全集。

## 8. clean-room 验证与差异说明

在 governor 仓库执行：

```bash
pnpm run release:verify-cleanroom-local-install
```

说明：

1. Stage 9A 基线要求 path/link 多轮重复验证。
2. Stage 9B+ 基线已将 `tgz` 安装 smoke 纳入验证，用于持续确认打包运行时依赖解析。
3. `tgz` 验证属于联网校验，不代表离线自包含安装已成立。
4. Stage 9 的 remote-api rehearsal 现已纳入 packaged-install smoke：脚本会写入一份 repo-local config，把 `codex` 与 `claude-code` 指向本地 stub endpoint，注入 `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`，并在不依赖真实 provider 账号的前提下验证 `doctor --adapters --fix` 与 `verify --adapters`。
5. 如需保留可审计的机器可读回执，可为 `release:verify-cleanroom-local-install` 追加 `--output <path>`；生成报告会包含各 install mode 的 remote-api rehearsal 摘要。

## 9. 接入期治理门禁

建议在本地交付前执行：
需在 `<governor-repo>` 执行：

```bash
pnpm run check
pnpm run release:verify-local
pnpm run release:ga-check
```

`release:verify-local` 现在也会执行一轮 dist-binary remote-api rehearsal，并支持通过 `pnpm run release:verify-local -- --output <path>` 产出 JSON 回执。

## 10. 升级检查清单

1. 阅读 `CHANGELOG.zh-CN.md` 的迁移说明。
2. 在全新目标仓库复跑初始化命令链。
3. 复跑 examples smoke。
4. 执行 clean-room 验证后再扩大 rollout。

## 11. 已知限制

1. `dist-binary` 只证明 CLI/runtime 行为成立，不等于已经验证 package install surface。
2. 在全新的外部 adopter 仓库里，`doctor` / `check` 仍会出现 external-baseline warning，除非你主动把 self-host 治理文档与脚本一起 vendoring 进去。
