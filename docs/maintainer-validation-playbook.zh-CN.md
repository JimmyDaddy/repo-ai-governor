# Maintainer 验证手册

这份 playbook 面向维护、验证或发布 `repo-ai-governor` 本身的人员。

当你需要回答这些问题时，用它最合适：

1. 哪条命令链能证明当前 packaged CLI surface？
2. 哪些检查属于 adopter truth，哪些只是 maintainer confidence？
3. 验证跑完后应该去哪里找证据？
4. VS Code、desktop、宿主原生资产、release gates 分别该走哪条 runbook？

这份文档只讲流程，不重新定义支持状态。`docs/support-matrix.zh-CN.md` 仍然是唯一的公开支持真值。

## 1. 先用对真值面

建议把文档职责分开理解：

| 文档 | 作用 |
|---|---|
| `README.zh-CN.md` | 产品概览和最短上手路径 |
| `docs/local-adoption-playbook.zh-CN.md` | adopter runbook |
| `docs/support-matrix.zh-CN.md` | 正式支持真值 |
| `docs/maintainer-validation-playbook.zh-CN.md` | maintainer 验证流程和证据路由 |
| `docs/ga-readiness-evidence.zh-CN.md` | 更广义的 GA 信号汇总 |

简单规则：

1. 如果你在描述“支持什么”，更新 `docs/support-matrix.zh-CN.md`
2. 如果你在说明“怎么验证”，更新这份 playbook
3. 如果你在记录更高层的 release-readiness 判断，更新 `docs/ga-readiness-evidence.zh-CN.md`

## 2. 先明确你的验证目标

按你要回答的问题选择 runbook：

| 目标 | 主命令 | 它证明什么 |
|---|---|---|
| 检查已发布 CLI 及随包文档 / 参考资产 | `pnpm run release:verify-local`、`pnpm pack --json --dry-run` | 本地打包面 truthfulness |
| 演练 clean-room 安装路径 | `pnpm run release:verify-cleanroom-local-install` | install-mode 证据 |
| 演练真实项目里的交互行为 | 先 build，再跑 real-target 命令链 | 真实目标仓库的操作者体验 |
| 复核 examples 与 docs-backed scenarios | `pnpm run check:examples-doc-smoke`、`pnpm run check:examples-runtime-smoke` | 示例一致性与可运行契约 |
| 复核 VS Code companion 边界 | 定向 vitest + `release:verify-vscode-extension-distribution` | editor-native companion 的打包与契约 |
| 复核宿主原生资产边界 | 定向 vitest + `release:verify-host-distribution` | Codex / Claude Code / GitHub Copilot 宿主 follow-up 边界 |
| 复核 desktop foundation 边界 | 定向 vitest + `check:desktop-entry-smoke` + `release:verify-local` | desktop foundation-only 真值 |
| 复核官方治理模板目录 | 定向 vitest + `pnpm run build` | pack catalog 契约与 runtime loader 兼容性 |
| 做更广义的 release 判断 | `pnpm run check`、`pnpm run release:ga-check` | wider release 所需的 maintainer confidence |

## 3. 已发布包面的验证

当你想回答“当前打包后的 CLI surface 到底交付了什么、文档有没有说实话”时，用这条 runbook。

```bash
cd <governor-repo>
pnpm run release:verify-local
pnpm pack --json --dry-run
```

这组命令重点回答：

1. 当前 packaged CLI 行为是否仍与文档描述一致？
2. tarball 是否仍携带预期的 adopter 文档和参考资产？
3. 我们有没有无意中夸大 secondary surface 的 packaged support？

当前 published tarball 预期至少包含：

1. `README.md` 和 `README.zh-CN.md`
2. `docs/local-adoption-playbook.md` 和 `docs/local-adoption-playbook.zh-CN.md`
3. `docs/maintainer-validation-playbook.md` 和 `docs/maintainer-validation-playbook.zh-CN.md`
4. `docs/support-matrix.md` 和 `docs/support-matrix.zh-CN.md`
5. `examples/`
6. `integrations/ide/` 和 `integrations/desktop/`
7. `.codex/skills/`

repo-local skills 以参考资产形式随包，不会自动安装进目标仓库。

## 4. 真实项目演练

当你需要在扩大 rollout 或改变公开叙事前，先拿到一个真实目标仓库的证据时，用这条路径。

当前 wrapper 入口：

```bash
TARGET_REPO=/absolute/path/to/real-target-repo \
bash "$GOVERNOR_REPO/scripts/acceptance/run-project-027-real-project-validation.sh"
```

建议环境变量：

```bash
export GOVERNOR_REPO=/absolute/path/to/repo-ai-governor
export TARGET_REPO=/absolute/path/to/real-target-repo
export CLI_BIN="$GOVERNOR_REPO/dist/bin/repo-ai-governor.js"
export ACCEPTANCE_HOME="$TARGET_REPO/.project-027-acceptance/home"
export REPO_LOCAL_ROOT="$TARGET_REPO/.repo-ai-governor"
```

最小演练链：

```bash
cd "$GOVERNOR_REPO"
pnpm run build

HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json init
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json doctor
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json check
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json --workspace-action dry-run --workspace-mode repo_local --workspace-root "$REPO_LOCAL_ROOT" workspace
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json --workspace-action execute --workspace-mode repo_local --workspace-root "$REPO_LOCAL_ROOT" workspace
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json --workspace-action rollback --workspace-plan <plan-path> workspace
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output pretty --ui react
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" resume
```

这条 runbook 的价值在于验证真实操作者体验，而不只是测试覆盖率。

## 5. 示例与文档 Smoke

当你修改了 examples、adopter 文档或 examples 依赖的命令叙事时，用这条路径。

```bash
cd <governor-repo>
pnpm run check:examples-doc-smoke
pnpm run check:examples-runtime-smoke
pnpm run check:examples-smoke
```

它最适合回答这几个问题：

1. example docs 是否仍描述了可运行命令链？
2. example 断言是否仍与真实输出契约一致？
3. 文档有没有在没人注意的情况下偏离 example 资产？

## 6. Secondary Surface 验证

### VS Code companion

当你要刷新 editor-native companion 边界时，用：

```bash
pnpm exec vitest run apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts --maxWorkers=1 --maxConcurrency=1
pnpm run build
pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-064-vscode-extension-distribution-report.json
pnpm pack --json --dry-run
pnpm run check:ide-entry-smoke
pnpm run check:ide-docs-parity
```

可选人工演练：

```bash
code --extensionDevelopmentPath <governor-repo>/apps/vscode-extension <target-repo>
```

### 宿主原生资产边界

当你要刷新 Codex / Claude Code / GitHub Copilot 的宿主 follow-up story 时，用：

```bash
pnpm exec vitest run apps/cli/test/commands/host-command.test.ts apps/cli/test/host-command.integration.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts --maxWorkers=1 --maxConcurrency=1
pnpm run build
pnpm run release:verify-host-distribution -- --output .tmp/project-067-sprint-001-host-distribution-report.json
```

如果变更触及 GitHub.com reserved target 契约，还要额外执行：

```bash
pnpm run release:verify-github-com-agent-reserved-target -- --output .tmp/project-068-sprint-002-github-com-agent-reserved-target-report.json
```

### Desktop foundation

当你要刷新 desktop foundation-only 边界时，用：

```bash
pnpm exec vitest run apps/desktop/test/desktop-governance-console-view-model-builder.test.ts apps/desktop/test/desktop-preload-bridge.test.ts apps/desktop/test/desktop-shell-bootstrap.test.ts apps/desktop/test/desktop-session-bridge.test.ts test/desktop-entry-smoke.integration.test.ts --maxWorkers=1 --maxConcurrency=1
pnpm run build
pnpm run check:desktop-entry-smoke
pnpm run release:verify-local -- --output .tmp/project-065-sprint-001-desktop-foundation-report.json
```

## 7. 官方治理模板目录验证

当你修改了内置 standards-pack catalog、pack runtime loading 或相关文档时，用：

```bash
pnpm exec vitest run packages/standards/test/language-minimal-governance-packs.integration.test.ts packages/standards/test/standards-runtime-loader.integration.test.ts packages/config/test/config.unit.test.ts --maxWorkers=1 --maxConcurrency=1
pnpm run build
```

这条 runbook 回答的问题是：“文档里写的官方 pack 目录，是否仍与产品实际可加载、可验证的能力一致？”

## 8. Clean-room 与 Release Gates

当你需要的是更高信心的 maintainer gate，而不是某个子系统的局部刷新时，用：

```bash
cd <governor-repo>
pnpm run release:verify-cleanroom-local-install
pnpm run check
pnpm run release:verify-host-distribution
pnpm run release:verify-local
pnpm run release:ga-check
```

这组命令可以理解成一条递进阶梯：

1. `release:verify-cleanroom-local-install` 证明 install-mode 行为
2. `check` 证明仓库级质量基线
3. `release:verify-host-distribution` 复核宿主原生 follow-up surface
4. `release:verify-local` 复核 packaged / local distribution surface
5. `release:ga-check` 是维护者更广义的发布决策 gate

## 9. 证据管理预期

当你更新文档或支持声明时，尽量保持证据模型干净：

1. 支持边界变化时，先更新 `docs/support-matrix.zh-CN.md`
2. 这份 playbook 只负责命令顺序、操作者意图和证据回链
3. 每条验证链尽量只保留一份权威 evidence file，不要到处散落状态说明
4. 不要把这份 playbook 写成第二张 support matrix

这份 runbook 常引用的 evidence 路径包括：

1. `.tmp/project-063-sprint-001-local-distribution-report.json`
2. `.tmp/project-063-sprint-001-cleanroom-tgz-report.json`
3. `.tmp/project-064-vscode-extension-distribution-report.json`
4. `.tmp/project-065-sprint-001-desktop-foundation-report.json`
5. `.tmp/project-067-sprint-001-host-distribution-report.json`
6. `.tmp/project-068-sprint-002-github-com-agent-reserved-target-report.json`
7. `.tmp/project-076-sprint-003-cleanroom-report.json`
8. `.tmp/project-076-sprint-003-local-distribution-report.json`

## 10. 如何理解 adopter warning

全新的外部仓库仍可能看到这些 warning：

1. `baseline_docs missing=5/5`
2. `script_not_found`

解释方式要谨慎：

1. 对 adopter 来说，除非目标仓库本来就在 vendoring 本仓库治理栈，否则通常只是 informational
2. 对 maintainer 来说，它们是判断 adopter 文档是否把预期讲清楚的有用信号

## 11. 相关文档

1. `README.zh-CN.md`
2. `docs/local-adoption-playbook.zh-CN.md`
3. `docs/support-matrix.zh-CN.md`
4. `docs/ga-readiness-evidence.zh-CN.md`
5. `examples/`
