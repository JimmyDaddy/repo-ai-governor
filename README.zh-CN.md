# Repo AI Governor

面向仓库本地的 AI 治理 CLI，用于执行流程化、多角色的治理工作流。

- 英文指南：`README.md`
- 本地接入手册：`docs/local-adoption-playbook.zh-CN.md`
- 正式支持矩阵：`docs/support-matrix.zh-CN.md`
- GA 就绪证据：`docs/ga-readiness-evidence.zh-CN.md`
- 仓库本地 skill 参考：`.codex/skills/`
- 示例资产：`examples/`
- 变更日志：`CHANGELOG.zh-CN.md`

## 1. 5~15 分钟快速接入

## 1.1 前置条件

1. Node.js `>=18`
2. `pnpm`，用于 `path` / `link` / `tgz` 等 package-based 安装方式
3. 一个准备接入治理流程的目标仓库

## 1.2 本地安装方式

假设本仓库根目录为 `<governor-repo>`，目标仓库为 `<target-repo>`。

### 方式 A：`path`（推荐本地迭代）

```bash
cd <target-repo>
pnpm add --save-exact <governor-repo>
```

### 方式 B：`link`（推荐高频联调）

```bash
cd <target-repo>
pnpm add --save-exact link:<governor-repo>
```

### 方式 C：`tgz`（候选发布演练；需要 registry 访问）

```bash
cd <governor-repo>
pnpm pack --json

cd <target-repo>
pnpm add --save-exact /绝对路径/cjhdev-repo-ai-governor-<version>.tgz
```

### 方式 D：`dist` 二进制（适合非 `pnpm` 或已有脏工作树仓库的无侵入演练）

```bash
cd <governor-repo>
pnpm run build

cd <target-repo>
node <governor-repo>/dist/bin/repo-ai-governor.js --help
```

适用边界（2026-03-26 实测）：

1. `tgz` clean-room 安装在 `pnpm add` 可访问 npm registry 时可稳定通过。
2. tarball 不是离线自包含安装：`commander`、`i18next`、`yaml` 等外部依赖仍会在 `pnpm add` 阶段解析。
3. 完全受限网络或离线环境请优先使用已完成 bootstrap 的 governor checkout，并通过 `path` / `link` 接入。
4. 对已有 Yarn/npm 依赖图或不希望先改依赖清单的仓库，可优先使用 `dist` 二进制演练；它验证的是 CLI 行为，不是 package install surface。

## 1.3 打包参考资产面

已发布 tarball 应包含：

1. `README.md` 与 `README.zh-CN.md`
2. `docs/local-adoption-playbook.md` 与 `docs/local-adoption-playbook.zh-CN.md`
3. `examples/`
4. `integrations/ide/` 与 `integrations/desktop/`
5. `.codex/skills/`

`.codex/skills/` 下的 repo-local skills 作为参考资产随包发布，但不会自动复制到目标仓库工作区。

## 1.4 初始化命令链

在 `<target-repo>` 下执行。

package-based 安装路径：

```bash
pnpm exec repo-ai-governor --help
pnpm exec repo-ai-governor init --output json
pnpm exec repo-ai-governor doctor --output json
pnpm exec repo-ai-governor check --output json
```

如果是首次配置并希望走引导式交互，可使用：

```bash
pnpm exec repo-ai-governor init --output pretty
```

在本地 TTY + `pretty` 输出下，交互问答默认开启；CI/脚本场景可加 `--no-interactive` 关闭交互。
在本地 TTY + `pretty` 输出下，`repo-ai-governor` 无子命令入口现在会默认附着到 `stderr` 上的 session-first shell；如果你要恢复最近一次或指定的持久化会话，可执行 `pnpm exec repo-ai-governor resume [session-id]`。
session shell 支持自然语言对话，以及 `/help`、`/resume`、`/clear`、`/theme`、`/agent`、`/history`、`/search`、`/multiline` 和 `!<shell-command>` passthrough。也可以直接用 `pnpm exec repo-ai-governor --output pretty "summarize this repository"` 带首轮 prompt 启动。
现在输入 `/` 会即时打开 live slash palette，`Up/Down`、`Tab`、`Esc` 与 `Ctrl+L` 也都留在同一条 Ink-owned input loop 内，不再退回 frame 外的 line editor。
`workflow`、`upgrade` 这类命令内交互 surface 仍然默认进入 React shell；在 `--no-interactive`、非 TTY 或 `plain/json` 场景下，两类壳层都会自动回退到 `none`，因此 CI 与 agent 风格的机器消费路径继续保持原有非交互契约。
如需只在当前命令切换 React shell 外观，可额外指定 `--ui-theme governor|catppuccin|calm`，不会改变 stdout 输出契约。
主题优先级为 `--ui-theme` 单次覆盖 > workspace 默认值 > 全局 CLI 默认值。
如果你想查看有哪些主题可用，可执行 `pnpm exec repo-ai-governor set-ui-theme --help`。
在交互式 TTY + `pretty` 模式下，也可以省略预设，直接通过 `pnpm exec repo-ai-governor set-ui-theme --output pretty` 或 `pnpm exec repo-ai-governor workspace set-ui-theme --output pretty` 打开 selector。
如果想持久化当前 workspace 的默认主题，可执行 `pnpm exec repo-ai-governor workspace set-ui-theme calm --output json`。
如果想持久化所有 workspace 共享的全局默认主题，可执行 `pnpm exec repo-ai-governor set-ui-theme calm --output json`。

如果你使用 `dist` 二进制演练，请将 `pnpm exec repo-ai-governor` 替换为：

```bash
node <governor-repo>/dist/bin/repo-ai-governor.js <command>
```

预期结果：

1. 全部命令返回 JSON，且 `status=success`。
2. `init` 默认采用 `tool_managed`，所以全新目标仓库未必会立刻出现 `.repo-ai-governor/`。
3. `doctor` 在 `command_result.attach_mode` 中返回 attach 模式；全新的外部 adopter 仓库还可能出现 `baseline_docs missing=5/5` warning。
4. `check` 在 `command_result.check_totals` 中返回门禁统计；非 self-host 目标仓库可能出现 governance `script_not_found` warning。
5. 在本地 TTY + `pretty` 模式下，无子命令入口会附着到 session shell；`resume [session-id]` 可恢复最近一次或指定的持久化会话。
6. 在 session shell 内，输入 `/` 应即时出现 live slash palette；`Tab` 可补全当前高亮命令，`Ctrl+L` 只清理本地 live surface。

## 1.5 只读接入预检

通过 `doctor` 判断当前仓库是否可写：

```bash
pnpm exec repo-ai-governor doctor --output json
```

当仓库不可写时，应返回只读 attach 语义，而不是直接崩溃。

## 1.6 多工具接入基线

如果你想把 Codex / Claude Code / GitHub Copilot 风格的 adapter 角色接到同一个仓库基线上，建议按下面这条命令链执行：

```bash
pnpm exec repo-ai-governor connect --tools codex,claude-code --preset multi-tool-default --output json
pnpm exec repo-ai-governor doctor --adapters --fix --output json
pnpm exec repo-ai-governor verify --adapters --output json
pnpm exec repo-ai-governor run --output json --dry-run --trace
```

说明：

1. `connect` 不会原地改写活动 `governor.yaml`；它会把候选配置写到 `<workspace_root>/context/diagnostics/connect/<connect-id>.governor.yaml`，并在 JSON 中返回 `candidate_config_path` / `candidate_config_valid`。
2. 当前可用 preset 包括 `single-tool-minimal`、`multi-tool-default`、`single-tool-all-roles`、`restricted-network-safe`。如需显式覆盖路由，可使用 `--single-tool-all-roles <tool>` 或重复 `--role-binding role=tool[,fallback]`。
3. `doctor --adapters --fix` 只会执行 safe-local 修复，例如补可写工作区/配置/内存目录；登录、CLI 安装、代理设置和本地模型下载仍然只会落到 `nextAction`。
4. `verify --adapters` 会返回 onboarding contract、role/tool matrix 与 `agent_view`；`run --dry-run --trace` 则会在不进入真实发布执行的前提下演练 projected descriptors 与 LangGraph supervisor diagnostics。

## 2. 完整治理闭环（Stage 9A/9B 基线）

```bash
pnpm exec repo-ai-governor plan --output json
pnpm exec repo-ai-governor run --output json --dry-run --trace
pnpm exec repo-ai-governor review --output json
pnpm exec repo-ai-governor review-verify --output json
```

该链路会在工作区产出 review-verify 与 ledger-backfill 相关产物。

## 3. Workspace 模式与回滚

默认模式为 `tool_managed`。如需切换到 `repo_local`，建议使用 CLI 迁移路径：

```bash
pnpm exec repo-ai-governor workspace dry-run --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace execute --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace rollback <plan-path> --output json
```

如果你不想每次都带 `--ui-theme`，可以用下面的命令持久化当前工作区默认主题：

```bash
pnpm exec repo-ai-governor workspace set-ui-theme calm --output json
```

如果你想直接打开交互式 selector，而不是手输预设：

```bash
pnpm exec repo-ai-governor workspace set-ui-theme --output pretty
pnpm exec repo-ai-governor set-ui-theme --output pretty
```

如果你想给所有工作区统一设置一个全局默认主题，可执行：

```bash
pnpm exec repo-ai-governor set-ui-theme calm --output json
```

说明：

1. 单独执行 `init` 仍会停留在 `tool_managed`；只有 `workspace execute` 后才会真正落 repo-local 工作区面。
2. `workspace dry-run` 会把计划产物写到当前活动 workspace 根；成功执行 `workspace execute` 后，plan/execution 产物会重写到目标 workspace 根。
3. `workspace rollback` 会把 rollback 产物写到恢复后的 source workspace 根，并在 cleanup 成功后移除空的 `.repo-ai-governor-migration/<migration-id>` scratch 目录。
4. 主题优先级固定为命令覆盖 `--ui-theme` > workspace 默认值 > 全局 CLI 默认值。
5. `workspace set-ui-theme <preset>` 会写入当前活动工作区配置；如果 repo-local selector config 也在使用中，只有该 selector 文件原本已存在时才会同步。
6. 顶层 `set-ui-theme <preset>` 默认作用于 global，会把全局 CLI 偏好写入 `~/.repo-ai-governor/cli-preferences.yaml`，不会改动 workspace 配置；如果你刻意想让这个快捷入口只改当前 workspace，可显式传 `--theme-scope workspace`。
7. `set-ui-theme --help` 会列出可用主题，而在交互式 TTY + `pretty` 模式下省略 `[theme]` 则会直接打开 selector。
8. 新生成的配置默认带有 `ui.react.theme: governor`；`--ui-theme governor|catppuccin|calm` 仍保留为单次命令覆盖。
9. `workspace clear-config --output json` 可用于干净地重置当前 selector/config 文件，而不会删除其它工作区产物。
10. 旧的 `--workspace-action ...` 长写法仍保留给脚本使用；`workspace <action> [value]` 是更短的人手执行写法。

### Workflow 定义预览、保存与显式 Upgrade Shell

```bash
pnpm exec repo-ai-governor workflow preview --workflow-template loop-guarded --output json
pnpm exec repo-ai-governor workflow create --workflow-template condition-route --output json
pnpm exec repo-ai-governor workflow edit --output pretty
pnpm exec repo-ai-governor upgrade --output pretty
```

说明：

1. `workflow preview` 始终保持只读，不会写入 workflow 相关产物。
2. `workflow create` 与 `workflow edit` 会把当前活动 workflow definition 保存到 `<workspace_root>/context/workflow/active-workflow.definition.json`，并在 `<workspace_root>/context/compiled-ir/<execution_id>.json` 下持久化一份 compiled IR snapshot。
3. Loop 节点在保存前必须同时带有 `maxCycles` 与 `maxWallTimeSeconds`；Condition 节点的分支必须使用非空且唯一的 `conditionKey`。
4. 在本地 TTY + `pretty` 模式下，`workflow` 与 `upgrade` 会默认进入 React shell，并只占用 `stderr`；如果需要压制该壳层，可显式添加 `--ui none` 或 `--ui classic`，同时保持现有 stdout 输出契约不变。
5. React shell 目前提供 `governor`、`catppuccin`、`calm` 三套预设；持久化默认值来自 `ui.react.theme`，而 `--ui-theme` 仍只覆盖当前命令。

## 4. HITL 通知 Provider

可以通过环境变量启用真实 HITL 通知渠道：

```bash
export REPO_AI_GOVERNOR_NOTIFICATION_WEBHOOK_URL="https://example.com/webhook"
export REPO_AI_GOVERNOR_NOTIFICATION_CHAT_IM_URL="https://example.com/chat-im"
pnpm exec repo-ai-governor run --output json
```

说明：

1. `REPO_AI_GOVERNOR_NOTIFICATION_WEBHOOK_URL` 用于启用主 webhook provider。
2. `REPO_AI_GOVERNOR_NOTIFICATION_CHAT_IM_URL` 用于启用备选 `chat_im` provider，覆盖主渠道失败演练。
3. 每个渠道还支持可选参数：`*_AUTH_TOKEN`、`*_HEADERS_JSON`、`*_TIMEOUT_MS`、`*_BACKOFF_BASE_MS`。
4. 如果没有配置外部 provider，CLI 仍会保留本地 notification artifact fallback，方便演练与调试。

## 5. 示例与门禁

以下命令需在 `<governor-repo>` 执行（属于仓库维护脚本，不是目标仓库 CLI 子命令）：

- 示例目录：`examples/`
- 文档 smoke：`pnpm run check:examples-doc-smoke`
- 运行 smoke：`pnpm run check:examples-runtime-smoke`
- 聚合 smoke：`pnpm run check:examples-smoke`

仓库全量验证：

```bash
pnpm run check
```

## 6. 常见问题

1. `pnpm add <tarball>` 报 `ENOTFOUND` 或 registry 解析失败：`tgz` 仍依赖 npm registry；请改用 `path` / `link` 或在联网环境安装。
2. 源码接入后出现 `ERR_MODULE_NOT_FOUND`：在 governor 仓库执行 `pnpm install` 并重新构建。
3. 全新外部 adopter 仓库中 `doctor` 报 `baseline_docs missing=5/5`：这是当前 external-adopter 基线，除非你主动把 self-host 治理文档一起 vendoring 到目标仓库。
4. 外部目标仓库里 `check` 报 governance `script_not_found`：这是当前预期，除非该仓库也携带 self-host 的治理脚本。
5. 目标仓库本身是 Yarn/npm 或已有脏工作树：先走 `dist` 二进制演练路径，再决定是否落正式 package 安装。
6. 请保留最近一次 `workspace execute` 输出中的 `plan-path`；当目标 workspace 成为活动面后，它就是 canonical rollback reference。
7. rollback 完成后，rollback 产物会跟随恢复后的 source workspace 根；如需确认当前活动工作区面，请重新执行 `doctor`。
8. 如果 `upgrade` 对 `confirmation_items` 给出 warning，请先查看 `upgrade_report` 与 `upgrade_auto_migrated_config`，保留 `upgrade_rollback_snapshot`，在确认完成前不要覆盖 `governor.yaml`。
9. 如果 `workspace execute` 失败，请先查看报错中给出的 failure summary 产物，再决定是否重试；显式 rollback 仍使用保存下来的 `plan-path`。

## 7. 下一步

1. 阅读 `docs/local-adoption-playbook.zh-CN.md` 获取 clean-room 与升级细则。
2. 如需 Codex 仓库本地 skill 模板，可查看 `.codex/skills/`。
3. 使用 `examples/` 作为团队接入演练入口。
4. 在 `CHANGELOG.zh-CN.md` 跟踪升级与迁移说明。
5. Python / Go 最小治理模板入口见 `docs/local-adoption-playbook.zh-CN.md`，该路径会随发布包一并提供。
6. 正式支持边界与最新 clean-room smoke 快照请见 `docs/support-matrix.zh-CN.md`。
7. 11 项 GA 信号证据与条件项说明请见 `docs/ga-readiness-evidence.zh-CN.md`。
