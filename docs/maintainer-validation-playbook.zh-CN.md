# 维护者验收手册

## 1. 适用人群

本手册面向维护、发布或验收 `repo-ai-governor` 本身的人员。它与 adopter-facing 的 `README` 和本地接入手册分开，避免把内部验证流程强行塞给普通使用者。

当你需要做下面这些事情时，请使用本手册：

1. 演练打包发布面。
2. 在扩大 rollout 前验证真实项目中的交互行为。
3. 在 governor 仓库里执行 clean-room、release、GA 风格的维护者验证。

### 1.1 正式 Support Truth 路由

1. `docs/support-matrix.zh-CN.md` 是唯一的公开 support truth surface；其中 `## 9. GA Support Truthfulness 快照` 是当前 closeout-facing 总结。
2. 本手册只负责命令顺序、维护者意图说明，以及到底层 evidence 文件的 backlinks。
3. `docs/ga-readiness-evidence.zh-CN.md` 负责更宽的 program-level GA signal matrix。

## 2. 已发布包的参考资产面

已发布 tarball 预期包含：

1. `README.md` 与 `README.zh-CN.md`
2. `docs/local-adoption-playbook.md` 与 `docs/local-adoption-playbook.zh-CN.md`
3. `docs/maintainer-validation-playbook.md` 与 `docs/maintainer-validation-playbook.zh-CN.md`
4. `examples/`
5. `integrations/ide/` 与 `integrations/desktop/`
6. `.codex/skills/`

`.codex/skills/` 只是参考资产，不会自动复制到目标仓库。
`apps/vscode-extension` 与 `apps/desktop` 这两个真实 app workspace 仍属于源码仓验证面；已发布 tarball 仍可能携带内部 `dist/**` 构建产物，但不会把这些 app workspace 作为独立 package-install 根目录交付。

## 3. 真实项目验收 Runbook

如果你想在一个真实目标仓库中验证当前 interactive-shell 交付，再决定是否扩大 rollout，可使用下面的路径。

当前 wrapper 脚本：

```bash
TARGET_REPO=/absolute/path/to/real-target-repo \
bash "$GOVERNOR_REPO/scripts/acceptance/run-project-027-real-project-validation.sh"
```

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

Workspace 切换与回滚演练：

```bash
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json --workspace-action dry-run --workspace-mode repo_local --workspace-root "$REPO_LOCAL_ROOT" workspace
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json --workspace-action execute --workspace-mode repo_local --workspace-root "$REPO_LOCAL_ROOT" workspace
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json --workspace-action rollback --workspace-plan <plan-path> workspace
```

交互壳层演练：

```bash
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output pretty --ui react workflow preview --workflow-template condition-route
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output pretty --ui react upgrade
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output pretty
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" resume
```

## 4. 示例与文档 Smoke

在 `<governor-repo>` 执行：

```bash
pnpm run check:examples-doc-smoke
pnpm run check:examples-runtime-smoke
pnpm run check:examples-smoke
```

这些命令用于确认：

1. 根级 examples 仍然成体系。
2. 示例文档和可运行资产没有静默漂移。
3. 示例层的运行预期仍然成立。

### 4.1 VS Code Secondary Surface 验证

当你需要刷新 editor-native companion 的正式支持边界时，使用这条 runbook：

```bash
pnpm exec vitest run apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts --maxWorkers=1 --maxConcurrency=1
pnpm run build
pnpm pack --json --dry-run
pnpm run check:ide-entry-smoke
pnpm run check:ide-docs-parity
pnpm exec biome check apps/vscode-extension/src apps/vscode-extension/test apps/vscode-extension/package.json apps/vscode-extension/README.md
```

可选的人工演练：

```bash
code --extensionDevelopmentPath <governor-repo>/apps/vscode-extension <target-repo>
```

说明：

1. 当前正式支持只覆盖“已构建源码仓 + extension-development host”这条路径。
2. 通过 `pnpm pack --json --dry-run` 核对已发布产物仍不包含扩展 workspace 与可安装 bundle；即便保留内部 `dist/apps/vscode-extension/**` 产物，也不能把它误当成正式扩展分发。
3. 在新增独立 packaging rehearsal 并同步写入 `docs/support-matrix.zh-CN.md` 之前，不要对 npm/tgz、VSIX 或 Marketplace 做正式支持声明。

## 5. Clean-room 与 Release 验证

在 `<governor-repo>` 执行 clean-room 安装验证：

```bash
pnpm run release:verify-cleanroom-local-install
```

在 `<governor-repo>` 执行更完整的维护者门禁：

```bash
pnpm run check
pnpm run release:verify-local
pnpm run release:ga-check
```

说明：

1. `release:verify-cleanroom-local-install` 用于验证 packaged-install 路径，并支持通过 `--output <path>` 输出机器可读报告。
2. `release:verify-local` 适合 rollout 前的本地维护者验证。
3. `release:ga-check` 面向维护者的发布准备判断，不适合作为普通 adopter 的日常命令。
4. 当前本手册预期回链的 `project-052` 结构化 evidence 包括 `.tmp/project-052-sprint-001-cleanroom-report.json`、`.tmp/project-052-sprint-001-local-distribution-report.json` 与 `.tmp/project-052-sprint-002-command-rehearsal-summary.json`。
5. 当这些信号变化时，应先更新 `docs/support-matrix.zh-CN.md`，而不是在本手册里再维护第二张状态表。

## 6. 如何理解 external-adopter warning

全新的外部仓库里可能仍会出现：

1. `baseline_docs missing=5/5`
2. `script_not_found`

解释方式：

1. 对 adopter 来说，除非目标仓库本来就要 vendoring 本仓库自己的 self-host 治理栈，否则这些通常只是提示。
2. 对维护者来说，它们也是有价值的信号，用来检查用户入口文档是否足够清楚地解释了 external-adopter baseline。

## 7. 相关文档

1. `README.md`
2. `README.zh-CN.md`
3. `docs/local-adoption-playbook.md`
4. `docs/local-adoption-playbook.zh-CN.md`
5. `docs/support-matrix.zh-CN.md`
6. `docs/ga-readiness-evidence.zh-CN.md`
7. `.tmp/project-052-sprint-001-cleanroom-report.json`
8. `.tmp/project-052-sprint-001-local-distribution-report.json`
9. `.tmp/project-052-sprint-002-command-rehearsal-summary.json`
