# Repo AI Governor

面向目标仓库使用者的本地 AI 治理 CLI，可把 Codex、Claude Code、GitHub Copilot 等工具接到同一套受治理流程里。

- 英文指南：`README.md`
- 本地接入手册：`docs/local-adoption-playbook.zh-CN.md`
- 维护者验收手册：`docs/maintainer-validation-playbook.zh-CN.md`
- 支持矩阵：`docs/support-matrix.zh-CN.md`
- 示例资产：`examples/`
- 变更日志：`CHANGELOG.zh-CN.md`

## 1. 快速开始

### 1.1 前置条件

1. Node.js `>=18`
2. 使用 `path`、`link`、`tgz` 安装方式时需要 `pnpm`
3. 一个准备接入治理流程的目标仓库

### 1.2 选择安装方式

假设本仓库根目录为 `<governor-repo>`，目标仓库为 `<target-repo>`。

推荐决策顺序：

1. 目标仓库已经使用 `pnpm`，且想走默认本地接入时，先选 `path`。
2. 只有在目标仓库需要紧跟本地 governor 源码变化时，才切到 `link`。
3. 目标仓库是脏工作树、使用 Yarn/npm，或你想先做无安装的 CLI/runtime 演练时，使用 `dist-binary`。
4. 只有在安装环境仍能访问 npm registry、且你明确要做“联网的 packaged CLI 安装演练”时，才使用 `tgz`。

这些安装模式的正式 acceptance contract 以 `docs/support-matrix.zh-CN.md` 为准。

#### 方式 A：`path`

```bash
cd <target-repo>
pnpm add --save-exact <governor-repo>
```

适合最直接的本地接入。

#### 方式 B：`link`

```bash
cd <target-repo>
pnpm add --save-exact link:<governor-repo>
```

适合让目标仓库持续跟随本地 governor 源码变化。

#### 方式 C：`tgz`

```bash
cd <governor-repo>
pnpm pack --json

cd <target-repo>
pnpm add --save-exact /绝对路径/cjhdev-repo-ai-governor-<version>.tgz
```

适合做“联网的 packaged CLI 安装演练”，但仍需要安装环境能访问 registry，也不会因此扩大 VS Code 或其他 secondary surface 的打包支持口径。

#### 方式 D：`dist-binary`

```bash
cd <governor-repo>
pnpm run build

cd <target-repo>
node <governor-repo>/dist/bin/repo-ai-governor.js --help
```

适合先验证 CLI/runtime 行为、暂时不改目标仓库依赖图的场景；它不证明 packaged install 已经成立。

### 1.3 在目标仓库跑通第一轮

```bash
pnpm exec repo-ai-governor --help
pnpm exec repo-ai-governor init --output pretty
pnpm exec repo-ai-governor doctor --output json
pnpm exec repo-ai-governor check --output json
```

如果你走的是 `dist-binary` 路径，请把 `pnpm exec repo-ai-governor` 替换为：

```bash
node <governor-repo>/dist/bin/repo-ai-governor.js <command>
```

你可以预期：

1. `init --output pretty` 会带你走一轮首次接入问答。
2. 在本地 TTY + `pretty` 模式下，无子命令入口会打开 session-first shell，并渲染到 `stderr`。
3. `resume [session-id]` 可恢复最近一次或指定的持久化会话。
4. 全新的外部仓库仍可能出现 `baseline_docs missing=5/5`、`script_not_found` 之类 self-host 相关 warning；除非你本来就要 vendoring 本仓库自己的治理文档和脚本，否则应把它们视为提示而不是失败。

## 2. 常见使用路径

### 2.1 接入多种 AI 工具

```bash
pnpm exec repo-ai-governor connect --tools codex,claude-code --preset multi-tool-default --output json
pnpm exec repo-ai-governor doctor --adapters --fix --output json
pnpm exec repo-ai-governor verify --adapters --output json
pnpm exec repo-ai-governor run --output json --dry-run --trace
```

这条路径会生成可审阅的 candidate 配置、检查 adapter readiness，并在真实执行前完成一轮 dry-run 验证。

### 2.2 跑通第一条受治理流程

```bash
pnpm exec repo-ai-governor plan --output json
pnpm exec repo-ai-governor run --output json --dry-run --trace
pnpm exec repo-ai-governor review --output json
pnpm exec repo-ai-governor review-verify --output json
```

适合第一次体验完整的 plan -> run -> review -> verify 闭环，并查看 workspace 下的审计产物。

### 2.3 切换 workspace 模式

```bash
pnpm exec repo-ai-governor workspace dry-run --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace execute --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace rollback <plan-path> --output json
```

请保留命令输出中的 `plan-path`，它就是这次迁移的 rollback 参考。

### 2.4 预览、应用与回滚 Upgrade

```bash
pnpm exec repo-ai-governor upgrade --output json
pnpm exec repo-ai-governor upgrade apply <report-path> --confirm-upgrade approve --output json
pnpm exec repo-ai-governor upgrade rollback <apply-receipt-or-rollback-snapshot> --output json
```

先跑 `upgrade` preview。保留 preview 输出里的 `report_path`，以及 apply 输出里的 `apply_receipt_path`；这两类产物就是 adopter-facing apply/rollback 路径的正式 hand-off 参考。

## 3. 给外部 adopter 的提醒

1. `dist-binary` 演练证明的是 CLI/runtime 行为，不等于已经验证 package install surface。
2. `tgz` 不是离线自包含安装；安装阶段仍会从 npm registry 解析外部依赖。
3. `tgz` 路径验证的只是“已发布 CLI tarball + 随包文档/参考资产”这条打包面；它不会扩大 VS Code、VSIX、Marketplace 或其他 secondary surface 的打包支持声明。
4. 如果目标仓库本身是 Yarn/npm，或者已有脏工作树，建议先走 `dist-binary`；否则默认先用 `path`，只有在工作流需要时再切到 `link` 或 `tgz`。
5. session shell、React shell、workflow/upgrade、HITL 通知、故障排查等更完整说明，请看本地接入手册。
6. 可选的 VS Code companion surface 目前只支持从已构建的 governor 源码仓通过 `apps/vscode-extension` 启动；已发布的 npm/tgz 安装面即便仍带有内部 `dist/apps/vscode-extension/**` 产物，也不提供正式支持的 VSIX、Marketplace 或可安装扩展 bundle。
7. 仓库内的 Codex 本地工作流辅助能力位于 `.codex/skills/`；它们主要服务 self-host 与维护者流程，外部 adopter 只有在希望复用同样的本地 skill 体验时才需要一并 vendoring。

## 4. 继续阅读

1. `docs/local-adoption-playbook.zh-CN.md`：面向使用者的完整接入、onboarding、rollback、workflow 与 troubleshooting 手册。
2. `docs/support-matrix.zh-CN.md`：当前 install mode、adapter 与验证范围的支持边界。
3. `docs/maintainer-validation-playbook.zh-CN.md`：只面向维护/发布 `repo-ai-governor` 本身的人员。
4. `examples/`：团队接入演练和模板资产入口。
