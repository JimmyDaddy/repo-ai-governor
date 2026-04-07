# 本地接入与采用手册

## 1. 适用范围

本手册面向在目标仓库中接入 `repo-ai-governor` 的使用者，重点是安装、初始化、多工具接入、日常治理流程和常见排障，不要求先理解本仓库自己的 self-host 发布/验收流程。

如果你维护或发布的是 `repo-ai-governor` 本身，请改看 `docs/maintainer-validation-playbook.zh-CN.md`。

## 2. 安装策略矩阵

| 模式 | 典型用途 | 命令 |
|---|---|---|
| `path` | 最直接的本地接入 | `pnpm add --save-exact <governor-repo>` |
| `link` | 源码联调 | `pnpm add --save-exact link:<governor-repo>` |
| `tgz` | 联网的 packaged CLI 安装演练 | `pnpm pack --json` + `pnpm add --save-exact <tarball>` |
| `dist-binary` | 对 Yarn/npm 或脏工作树做 CLI/runtime 无侵入演练 | `node <governor-repo>/dist/bin/repo-ai-governor.js <command>` |

选择建议：

1. 默认先选 `path`。
2. 只有在目标仓库需要跟随本地 governor 源码变化时，才选 `link`。
3. 只有在安装环境仍能访问 npm registry、且你明确要演练“联网的 packaged CLI 安装”时，才选 `tgz`。
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

### 3.1 可选的 VS Code Secondary Surface

只有当你想在常规 CLI bootstrap 之上再验证 editor-native companion 时，才需要这条路径：

```bash
cd <governor-repo>
pnpm run build

code --extensionDevelopmentPath <governor-repo>/apps/vscode-extension <target-repo>
```

边界说明：

1. 当前正式支持只覆盖源码仓 checkout 路径；启动 extension-development host 之前，请先完成 governor 源仓构建。
2. 已发布的 npm/tgz 包面不包含 `apps/vscode-extension` workspace 或可安装扩展 bundle；其中即便仍有内部 `dist/apps/vscode-extension/**` 产物，也不构成正式支持的 npm/VSIX/Marketplace 分发。
3. review、HITL、recover、terminate 等 trust-sensitive 命令仍受 `Workspace Trust` 保护，因此请在 trusted workspace 中验证这些能力。
4. 当前 VS Code MVP 只是面向 execution/review/HITL/context 的 service-backed companion，不替代常规 CLI bootstrap 路径或 session shell。

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
5. `tool_transport_matrix` 现在会投影 effective transport truth；像 `codex`、`claude-code`、`github-copilot` 这样的 CLI-backed adapter，即使配置里没显式写 `transport`，也会显示 `cli_exec`。
6. 只要 `report`、`replay`、`diagnostics_trace` 都已落盘，`warn` 或失败的 dry-run 仍然是有价值的正式证据，因为它保留了失败 stage 与 adapter attribution，便于后续修正 routing。
7. 在当前已验证的 `codex` 基线中，`run --dry-run --trace` 已可通过真实 `cli_exec` 路由完成基线 `prepare -> execute -> report` 链路，且不会执行受治理文件改动或依赖变更；但它仍会在活动 governor workspace 下持久化审计产物，因此在放开非 dry-run 之前，应优先把它视为成功信号。
8. `github-copilot` 现在在 tester-route verify 上也遵循同样的 CLI-backed truth；而 `local-model` 仍应被理解为受能力约束的 fallback surface，而不是 `tool_calling` / `structured_output` 必需角色的完整替代品。

常用产物路径：

1. candidate 配置：`<workspace_root>/context/diagnostics/connect/<connect-id>.governor.yaml`
2. candidate 诊断：`<workspace_root>/context/diagnostics/connect/<connect-id>.json`
3. verify 诊断：`<workspace_root>/context/diagnostics/verify/`
4. traced dry-run 诊断：`<workspace_root>/context/diagnostics/run/` 与 `<workspace_root>/context/diagnostics/trace/`

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

正式 contract：

1. `dry-run` 与 `execute` 都要求传 `--workspace-mode <repo_local|tool_managed>`，并且都会交付一个可保存的 `plan_path`。
2. `execute` 会写出迁移后的 plan，以及 `context/workspace/<migration-id>.execution.json`；如果 execute 失败，重试前先看 `context/workspace/<migration-id>.failure.json`。
3. `rollback` 只接受前面保存下来的 `plan-path`，并写出 `context/workspace/<migration-id>.rollback.json`。
4. execute 或 rollback 之后都应重新跑 `doctor`，确认活动 `workspaceRoot`。

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
pnpm exec repo-ai-governor upgrade apply <report-path> --confirm-upgrade approve --output json
pnpm exec repo-ai-governor upgrade rollback <apply-receipt-or-rollback-snapshot> --output json
```

这些命令适合：

1. 预览或持久化活动 workflow 定义。
2. 在修改 `governor.yaml` 前先预览 schema upgrade。
3. 基于已审阅的 upgrade report 做一次显式确认 apply。
4. 从 apply receipt 或 rollback snapshot 回滚一次已应用的 upgrade。
5. 在本地 TTY 中使用更丰富的 React shell 交互面。

正式 upgrade contract：

1. Preview 会写出 `context/upgrade/<upgrade-id>.report.json`、`<upgrade-id>.auto-migrated-config.json` 与 `<upgrade-id>.rollback-snapshot.yaml`。
2. Apply 只接受 preview 的 `report_path` 加显式 `--confirm-upgrade approve`，随后写出一份 `*.apply-receipt.json` 与一份 verify receipt。
3. Rollback 接受 apply receipt 或 rollback snapshot，并写出一份 `*.rollback-receipt.json` 与一份 verify receipt。
4. 如果 preview 提示 blocking confirmation items，先停下来处理这些项，不要直接 apply。

常见产物：

1. workflow definition：`<workspace_root>/context/workflow/active-workflow.definition.json`
2. compiled IR snapshot：`<workspace_root>/context/compiled-ir/<execution_id>.json`
3. upgrade report：`<workspace_root>/context/upgrade/<upgrade-id>.report.json`
4. auto-migrated config preview：`<workspace_root>/context/upgrade/<upgrade-id>.auto-migrated-config.json`
5. upgrade rollback snapshot：`<workspace_root>/context/upgrade/<upgrade-id>.rollback-snapshot.yaml`
6. upgrade apply receipt：`<workspace_root>/context/upgrade/<apply-id>.apply-receipt.json`
7. upgrade rollback receipt：`<workspace_root>/context/upgrade/<rollback-id>.rollback-receipt.json`

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
4. `tgz` 路径验证的只是“已发布 CLI tarball + 随包文档/参考资产”这条打包面；它不会扩大 VS Code、VSIX、Marketplace 或其他 secondary surface 的打包支持声明。
5. 如果目标仓库本身是 Yarn/npm 或已有脏工作树，建议先用 `dist-binary`；否则默认先用 `path`，只有在工作流需要时再切换到 `link` 或 `tgz`。
5. `baseline_docs missing=5/5`、`script_not_found` 这类 self-host warning，在外部 adopter 仓库里通常是预期现象。
6. 如果 `upgrade` preview 提示存在 blocking confirmation items，不要直接 `apply`；先查看保存下来的 `report_path` 与 `auto_migrated_config_path`，修完配置漂移后再重新 preview。
7. 请同时保留 preview 的 `report_path`，以及 `apply_receipt_path` 或 `rollback_snapshot_path` 之一；正式 rollback 依赖这些 hand-off artifact，而不是靠手工猜路径。
8. `workspace execute` 或 `workspace rollback` 之后，都应重新执行 `doctor` 来确认活动 `workspaceRoot`，不要只凭目录结构变化判断是否成功。
9. 做 workspace migration 演练时，请在真实目标仓库或隔离的外部临时目录中执行。若直接在 governor 源仓库里跑，命令可能重新附着到该仓库的 Git root，产生误导性的 workspace 产物。
10. 在 acceptance 窗口里保留生成出的 `*.rollback.json` 或 `*.rollback-receipt.json`；它们就是证明迁移或 upgrade closeout 已干净完成的审计凭证。

## 10. 可选 self-host 资产

1. 仓库内的 Codex 辅助能力位于 `.codex/skills/`；外部 adopter 如果不打算复用同样的 self-host skill/workflow，可以直接忽略。
2. 这些资产属于本地 AI 工具辅助层，不是上文安装路径成立的前置条件。
3. `apps/vscode-extension` 只是面向源码仓评估的可选 secondary surface，不属于已发布 package-install baseline。

### 10.1 可选的 Codex / Claude Code 宿主原生生命周期

只有当你已经持有一份已构建的 governor 源码仓，并且希望把生成后的 Codex / Claude Code 资产应用到目标仓库或打成 plugin bundle 时，才走这条路径：

这些命令应从 `<governor-repo>` 执行，且 `--apply-to-repo` 必须显式指向真正接收生成文件的 adopter 仓库根目录。

```bash
pnpm exec repo-ai-governor host export --host codex --mode project-local --output-dir .repo-ai-governor/generated/hosts/codex --apply-to-repo /absolute/path/to/<target-repo>
pnpm exec repo-ai-governor host export --host claude-code --mode project-local --output-dir .repo-ai-governor/generated/hosts/claude-code --apply-to-repo /absolute/path/to/<target-repo>
pnpm exec repo-ai-governor host pack --host codex --mode plugin-bundle --output-dir .repo-ai-governor/generated/hosts/codex-plugin --bundle-dir .repo-ai-governor/generated/bundles/codex
pnpm exec repo-ai-governor host pack --host claude-code --mode plugin-bundle --output-dir .repo-ai-governor/generated/hosts/claude-code-plugin --bundle-dir .repo-ai-governor/generated/bundles/claude-code
```

随后请针对刚刚生成的 export 或 bundle manifest 重新执行校验：

```bash
pnpm exec repo-ai-governor host verify --manifest .repo-ai-governor/generated/hosts/codex/host-export.manifest.json
pnpm exec repo-ai-governor host verify --manifest .repo-ai-governor/generated/hosts/claude-code/host-export.manifest.json
pnpm exec repo-ai-governor host verify --manifest .repo-ai-governor/generated/hosts/codex-plugin/host-export.manifest.json
pnpm exec repo-ai-governor host verify --manifest .repo-ai-governor/generated/hosts/claude-code-plugin/host-export.manifest.json
```

正式 contract：

1. `host export` 是 Codex / Claude Code `project-local` follow-up 资产的正式路径，适用于把生成后的 AGENTS/skills/agents/hooks/MCP 文件落到目标仓库。
2. `host pack` 是 Codex / Claude Code plugin bundle 的正式路径，适用于从同一份已构建源码仓生成一份可安装的宿主侧 bundle。
3. 每次执行 `host export` 或 `host pack` 后，都必须针对对应 manifest 重新执行一次 `host verify`；只要 governor 源码或 vendored skills 有刷新，也必须再执行一轮。
4. 这些宿主原生资产的“升级”语义固定为：源码仓或 vendored skills 更新后，重新渲染并重新校验。它不是单独的 packaged installer，也不等于 `repo-ai-governor upgrade` 的契约。
5. 这些生成后的宿主资产属于源码仓 follow-up surface 和 adopter-facing distribution artifact；它们不能反向替代 `context/`、`tasks/`、`review/` 或审计台账这些 canonical governor workspace 真值。

## 11. Remote-api rehearsal

只有当你想验证真实 provider 调用，而不是默认的本地 CLI-backed / fallback 演练时，才需要执行这条 remote-api rehearsal：

```bash
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
pnpm run release:verify-local
```

说明：

1. `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 只在 remote-api rehearsal 窗口需要；普通本地接入仍可停留在默认 CLI-backed、fallback-only local-model 或 dist-binary 路径。
2. 如果你选择的安装方式仍需解析依赖，这条演练同样要求环境能访问 npm registry。

## 12. 下一步

1. `docs/support-matrix.zh-CN.md`：查看当前 install mode、adapter 与验证边界。
2. `examples/`：作为团队接入演练和模板资产入口。
3. `CHANGELOG.zh-CN.md`：查看升级与迁移说明。
4. `docs/maintainer-validation-playbook.zh-CN.md`：只在你维护或发布 `repo-ai-governor` 本身时阅读。
