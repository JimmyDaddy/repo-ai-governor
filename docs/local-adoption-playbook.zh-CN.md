# 本地接入与采用手册

## 1. 适用范围

本手册面向在目标仓库中接入 `repo-ai-governor` 的使用者，重点是安装、初始化、多工具接入、日常治理流程和常见排障，不要求先理解本仓库自己的 self-host 发布/验收流程。

如果你维护或发布的是 `repo-ai-governor` 本身，请改看 `docs/maintainer-validation-playbook.zh-CN.md`。

## 2. 安装策略矩阵

| 模式 | 典型用途 | 命令 |
|---|---|---|
| `path` | 最直接的本地接入 | `pnpm add --save-exact <governor-repo>` |
| `link` | 源码联调 | `pnpm add --save-exact link:<governor-repo>` |
| `tgz` | 打包安装演练 | `pnpm pack --json` + `pnpm add --save-exact <tarball>` |
| `dist-binary` | 对 Yarn/npm 或脏工作树做无侵入演练 | `node <governor-repo>/dist/bin/repo-ai-governor.js <command>` |

选择建议：

1. 默认先选 `path`。
2. 只有在目标仓库需要跟随本地 governor 源码变化时，才选 `link`。
3. 只有在安装环境仍能访问 npm registry、且你明确要演练打包安装时，才选 `tgz`。
4. 目标仓库是脏工作树、使用 Yarn/npm，或你只想先验证 CLI/runtime 行为时，选 `dist-binary`。

这些安装模式的正式 acceptance contract 以 `docs/support-matrix.zh-CN.md` 为准。

## 3. 初始化目标仓库

在目标仓库执行：

```bash
pnpm exec repo-ai-governor --help
pnpm exec repo-ai-governor init --output pretty
pnpm exec repo-ai-governor doctor --output json
pnpm exec repo-ai-governor check --output json
```

如果你使用 `dist-binary` 路径，请把 `pnpm exec repo-ai-governor` 替换为：

```bash
node <governor-repo>/dist/bin/repo-ai-governor.js <command>
```

成功标准：

1. `init --output pretty` 能完成一轮引导式初始化。
2. `doctor` 会输出 attach/write-mode 事实，而不是崩溃。
3. `check` 即使面对外部仓库，也能返回机器可读结果。

给外部 adopter 的提示：

1. 全新目标仓库仍可能出现 `baseline_docs missing=5/5` 或 `script_not_found` 之类 warning。
2. 除非你的目标仓库本来就要 vendoring 本仓库自己的治理文档和脚本，否则应把这些 warning 当成提示，而不是失败。
3. `init` 默认是 `tool_managed`，所以全新目标仓库未必会立刻生成 `.repo-ai-governor/`。

## 4. Session Shell 快速上手

如果你更喜欢“对话式入口”而不是一次性子命令，可以直接用 session shell：

```bash
pnpm exec repo-ai-governor --output pretty
pnpm exec repo-ai-governor --output pretty "summarize this repository"
pnpm exec repo-ai-governor resume [session-id]
```

快速检查点：

1. 在本地 TTY + `pretty` 模式下，无子命令入口应附着到 `stderr` 上的 session shell。
2. `/help`、`/history`、`/search <term>`、`/multiline`、`!<shell-command>` 应可用。
3. `resume` 应能恢复最近一次或指定的持久化会话。
4. `--no-interactive`、非 TTY、`plain`、`json` 不应进入交互壳层。

## 5. 多工具接入

如果你想把 Codex、Claude Code、GitHub Copilot 一类 adapter 接到同一套仓库基线，可使用：

```bash
pnpm exec repo-ai-governor connect --tools codex,claude-code --preset multi-tool-default --output json
pnpm exec repo-ai-governor doctor --adapters --fix --output json
pnpm exec repo-ai-governor verify --adapters --output json
pnpm exec repo-ai-governor run --output json --dry-run --trace
```

需要关注的点：

1. `connect` 会写 candidate 配置，不会直接原地改写活动 `governor.yaml`。
2. `doctor --adapters --fix` 只做 safe-local 修复；认证、安装和下载仍属于 follow-up。
3. `verify --adapters` 可以看作真实执行前的 readiness 决策点。
4. `run --dry-run --trace` 是验证路由和 projected descriptor 最安全的方式。

常用产物路径：

1. candidate 配置：`<workspace_root>/context/diagnostics/connect/<connect-id>.governor.yaml`
2. candidate 诊断：`<workspace_root>/context/diagnostics/connect/<connect-id>.json`
3. traced dry-run 诊断：`<workspace_root>/context/diagnostics/run/`

## 6. 第一条受治理流程

如果你想体验完整的 plan -> run -> review -> verify 闭环，可执行：

```bash
pnpm exec repo-ai-governor plan --output json
pnpm exec repo-ai-governor run --output json --dry-run --trace
pnpm exec repo-ai-governor review --output json
pnpm exec repo-ai-governor review-verify --output json
```

常见输出目录位于活动 workspace 根下，例如：

1. `context/review-queue/requests`
2. `context/review-queue/results`
3. `context/ledger-backfill/review-verify`

当 active workspace 暴露 canonical sprint `tasks/` 时，这条 review 链还会自动分配一张 `CR-xxx` 任务卡，并让它和 review lifecycle 状态保持同步。

## 7. Workspace 模式与回滚

默认模式是 `tool_managed`。只有当你希望把治理工作区持久化到目标仓库内时，再切换到 `repo_local`。

```bash
pnpm exec repo-ai-governor workspace dry-run --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace execute --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace rollback <plan-path> --output json
```

建议习惯：

1. 保留 `workspace dry-run` 或 `workspace execute` 输出里的 `plan-path`。
2. 迁移或回滚后重新执行 `doctor`，确认活动 `workspaceRoot`。
3. 如果迁移失败，先看 failure-summary 产物，再决定是否重试。

## 8. 进阶能力

### 8.1 Workflow 与 Upgrade

```bash
pnpm exec repo-ai-governor workflow preview --workflow-template loop-guarded --output json
pnpm exec repo-ai-governor workflow create --workflow-template condition-route --output json
pnpm exec repo-ai-governor workflow edit --output pretty
pnpm exec repo-ai-governor upgrade --output pretty
pnpm exec repo-ai-governor upgrade --output json
```

这些命令适合：

1. 预览或持久化活动 workflow 定义。
2. 在修改 `governor.yaml` 前先分析 schema upgrade。
3. 在本地 TTY 中使用更丰富的 React shell 交互面。

常见产物：

1. workflow definition：`<workspace_root>/context/workflow/active-workflow.definition.json`
2. compiled IR snapshot：`<workspace_root>/context/compiled-ir/<execution_id>.json`
3. upgrade report：`<workspace_root>/context/upgrade/`

### 8.2 HITL 通知 Provider

可以通过环境变量启用 webhook 风格的 HITL 通知：

```bash
export REPO_AI_GOVERNOR_NOTIFICATION_WEBHOOK_URL="https://example.com/webhook"
export REPO_AI_GOVERNOR_NOTIFICATION_CHAT_IM_URL="https://example.com/chat-im"
pnpm exec repo-ai-governor run --output json
```

### 8.3 内置治理模板

已发布包通过 `@repo-ai-governor/standards` 暴露三套内置治理模板：

1. `workflowReviewGovernancePack`
2. `pythonMinimalGovernancePack`
3. `goMinimalGovernancePack`

如果你希望 adopter-facing 的治理流程本身就内置独立 `CR-xxx` 评审任务卡，以及 `review_pending -> verified -> resolved` 生命周期同步，请先引入 `workflowReviewGovernancePack`。

然后再按语言需要叠加 `pythonMinimalGovernancePack` 或 `goMinimalGovernancePack`，以及团队或仓库自己的 override。

## 9. 故障排查与已知限制

1. `pnpm add <tarball>` 报 `ENOTFOUND` 时，通常是安装环境无法访问 npm registry；请改用 `path`、`link` 或 `dist-binary`。
2. `dist-binary` 验证的是 CLI/runtime 行为，不等于验证了 package install surface。
3. `tgz` 不是离线自包含安装；安装阶段仍会解析外部依赖。
4. 如果目标仓库本身是 Yarn/npm 或已有脏工作树，建议先用 `dist-binary`；否则默认先用 `path`，只有在工作流需要时再切换到 `link` 或 `tgz`。
5. `baseline_docs missing=5/5`、`script_not_found` 这类 self-host warning，在外部 adopter 仓库里通常是预期现象。

## 10. 可选 self-host 资产

1. 仓库内的 Codex 辅助能力位于 `.codex/skills/`；外部 adopter 如果不打算复用同样的 self-host skill/workflow，可以直接忽略。
2. 这些资产属于本地 AI 工具辅助层，不是上文安装路径成立的前置条件。

## 11. Remote-api rehearsal

只有当你想验证真实 provider 调用，而不是 fixture/local smoke 时，才需要执行这条 remote-api rehearsal：

```bash
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
pnpm run release:verify-local
```

说明：

1. `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 只在 remote-api rehearsal 窗口需要；普通本地接入仍可停留在 fixture-backed 或 dist-binary 路径。
2. 如果你选择的安装方式仍需解析依赖，这条演练同样要求环境能访问 npm registry。

## 12. 下一步

1. `docs/support-matrix.zh-CN.md`：查看当前 install mode、adapter 与验证边界。
2. `examples/`：作为团队接入演练和模板资产入口。
3. `CHANGELOG.zh-CN.md`：查看升级与迁移说明。
4. `docs/maintainer-validation-playbook.zh-CN.md`：只在你维护或发布 `repo-ai-governor` 本身时阅读。
