# Repo AI Governor

面向目标仓库使用者的本地 AI 治理 CLI，可把 Codex、Claude Code、GitHub Copilot 等工具接到同一套受治理流程里。

- 英文指南：`README.md`
- 本地接入手册：`docs/local-adoption-playbook.zh-CN.md`
- 维护者验收手册：`docs/maintainer-validation-playbook.zh-CN.md`
- 支持矩阵：`docs/support-matrix.zh-CN.md`
- 示例资产：`examples/`
- 变更日志：`CHANGELOG.zh-CN.md`

## 1. 当前公开能力面

当前公开 CLI 与包级 surface 包括：

1. 初始化与审计：`init`、`doctor`、`check`
2. 受管仓库安装生命周期：`adopt list`、`adopt apply`、`adopt diff`、`adopt verify`、`adopt upgrade`、`adopt remove`
3. 多工具接入：`connect`、`verify`
4. 受治理执行：`plan`、`run`、`review`、`review-verify`
5. 会话优先入口：无子命令执行 `repo-ai-governor`，再用 `resume`
6. 流程与 schema 生命周期工具：`workflow`、`upgrade`
7. workspace 与壳层偏好：`workspace`、`set-ui-theme`
8. 低层宿主分发：`host export`、`host verify`、`host pack`
9. 可选 secondary/public package surface：源码仓 VS Code companion、desktop foundation，以及根包公开导出 `@cjhdev/repo-ai-governor/service-host`

这些 surface 的正式支持边界以 `docs/support-matrix.zh-CN.md` 为准。

## 2. 快速开始

### 2.1 前置条件

1. Node.js `>=18`
2. 使用 `path`、`link`、`tgz` 安装方式时需要 `pnpm`
3. 一个准备接入治理流程的目标仓库

### 2.2 选择安装方式

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

### 2.3 在目标仓库跑通第一轮

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
5. 人类可读的 help 与状态文案支持本地化；如果你想固定语言，可以显式传 `--locale en-US` 或 `--locale zh-CN`。

### 2.4 应用受管 adoption baseline

```bash
pnpm exec repo-ai-governor adopt list --output json
pnpm exec repo-ai-governor adopt apply adopter-complete --repo . --hosts codex,claude-code,github-copilot --output json
pnpm exec repo-ai-governor adopt verify --repo . --output json
```

当你想走“整仓安装”的首选路径，而不是手工 staging 低层 host export 时，使用这组命令。

说明：

1. 内置 adoption pack 会把受管宿主资产、guide 与安装元数据写到 `.repo-ai-governor/adoption/installations/**`。
2. 内置 `adopt apply` 不要求目标仓库预先存在 source-local `.codex/skills/**`。
3. 如果要走高级 self-host 路径，请使用 `adopt apply adopter-complete --adoption-profile self-host-complete --workspace-mode repo_local`。

## 3. 常见使用路径

### 3.1 安装或维护一套受管仓库 baseline

```bash
pnpm exec repo-ai-governor adopt apply adopter-complete --repo . --hosts codex,claude-code,github-copilot --output json
pnpm exec repo-ai-governor adopt verify --repo . --output json
pnpm exec repo-ai-governor adopt diff --repo . --output json
pnpm exec repo-ai-governor adopt upgrade adopter-complete --repo . --output json
pnpm exec repo-ai-governor adopt remove adopter-complete --repo . --force --output json
```

适合在目标仓库上使用正式支持的高层安装、漂移检查、升级与移除路径。

### 3.2 接入多种 AI 工具

```bash
pnpm exec repo-ai-governor connect --tools codex,claude-code --preset multi-tool-default --output json
pnpm exec repo-ai-governor doctor --adapters --fix --output json
pnpm exec repo-ai-governor verify --adapters --output json
pnpm exec repo-ai-governor run --output json --dry-run --trace
```

这条路径会生成可审阅的 candidate 配置、检查 adapter readiness，并在真实执行前完成一轮 dry-run 验证。

### 3.3 跑通第一条受治理流程

```bash
pnpm exec repo-ai-governor plan --output json
pnpm exec repo-ai-governor run --output json --dry-run --trace
pnpm exec repo-ai-governor review --output json
pnpm exec repo-ai-governor review-verify --output json
```

适合第一次体验完整的 plan -> run -> review -> verify 闭环，并查看 workspace 下的审计产物。

### 3.4 切换 workspace 模式或壳层主题

```bash
pnpm exec repo-ai-governor workspace dry-run --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace execute --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace rollback <plan-path> --output json
pnpm exec repo-ai-governor workspace set-ui-theme --output pretty
pnpm exec repo-ai-governor set-ui-theme calm --theme-scope workspace --output pretty
```

请保留命令输出中的 `plan-path`，它就是这次迁移的 rollback 参考。

`workspace` 还支持直接短写 `clear-config` 与 `switch-branch`。在交互式 TTY + `pretty` 模式下，`workspace set-ui-theme` 或顶层 `set-ui-theme` 如果省略 `[theme]`，会直接打开主题 selector。

### 3.5 预览、应用与回滚 Upgrade

```bash
pnpm exec repo-ai-governor upgrade --output json
pnpm exec repo-ai-governor upgrade apply <report-path> --confirm-upgrade approve --output json
pnpm exec repo-ai-governor upgrade rollback <apply-receipt-or-rollback-snapshot> --output json
```

先跑 `upgrade` preview。保留 preview 输出里的 `report_path`，以及 apply 输出里的 `apply_receipt_path`；这两类产物就是 adopter-facing apply/rollback 路径的正式 hand-off 参考。

### 3.6 刷新可选的源码仓宿主 follow-up 资产

```bash
pnpm exec repo-ai-governor host export --host codex --mode project-local --output-dir .repo-ai-governor/generated/hosts/codex --apply-to-repo /absolute/path/to/<target-repo>
pnpm exec repo-ai-governor host verify --manifest .repo-ai-governor/generated/hosts/codex/host-export.manifest.json
pnpm exec repo-ai-governor host export --host github-copilot --mode project-local --copilot-target repo-local --output-dir .repo-ai-governor/generated/hosts/github-copilot --apply-to-repo /absolute/path/to/<target-repo>
pnpm exec repo-ai-governor host verify --manifest .repo-ai-governor/generated/hosts/github-copilot/host-export.manifest.json
pnpm exec repo-ai-governor host pack --host claude-code --mode plugin-bundle --output-dir .repo-ai-governor/generated/hosts/claude-code-plugin --bundle-dir .repo-ai-governor/generated/bundles/claude-code
pnpm exec repo-ai-governor host verify --manifest .repo-ai-governor/generated/hosts/claude-code-plugin/host-export.manifest.json
```

这些命令应从 `<governor-repo>` 执行，且 `--apply-to-repo` 必须显式指向真正接收生成文件的 adopter 仓库根目录。

只有当你在已构建的 governor 源码仓上，需要在常规 CLI bootstrap 之外再生成可选的宿主原生 follow-up 资产时，才使用这条路径。

当前公开 host family 已包含 Codex、Claude Code 与 GitHub Copilot。对于 GitHub Copilot，请把 adopter-facing 流程限制在 `repo-local` 等公开 target 上；`github-com-agent` 仍保持 reserved 且 fail-closed，除非支持矩阵另有更新。

正式刷新路径固定为：更新 governor 源码 checkout 或 vendored 的宿主侧 skills，然后重新执行 `host export` 或 `host pack`，最后重新执行 `host verify`。这属于源码仓 follow-up surface，不属于 packaged-install baseline，也不是一条独立的 host installer contract。

## 4. 给外部 adopter 的提醒

1. `dist-binary` 演练证明的是 CLI/runtime 行为，不等于已经验证 package install surface。
2. `tgz` 不是离线自包含安装；安装阶段仍会从 npm registry 解析外部依赖。
3. `tgz` 路径验证的只是“已发布 CLI tarball + 随包文档/参考资产”这条打包面；它不会把 VS Code 的打包支持扩大到“源码仓本地生成 VSIX / packaged extension root”之外，也不会提供 Marketplace 或已发布可安装扩展的支持声明。
4. 如果目标仓库本身是 Yarn/npm，或者已有脏工作树，建议先走 `dist-binary`；否则默认先用 `path`，只有在工作流需要时再切到 `link` 或 `tgz`。
5. session shell、React shell、workflow/upgrade、宿主分发、workspace 工具、HITL 通知、故障排查等更完整说明，请看本地接入手册。
6. 可选的 VS Code companion surface 现在支持两条路径：从已构建的 governor 源码仓通过 `apps/vscode-extension` 启动 extension-development host，或从同一源码仓本地生成 VSIX / packaged extension root。已发布的 npm/tgz 安装面即便仍带有内部 `dist/apps/vscode-extension/**` 产物，也不会交付正式支持的可安装扩展 bundle，Marketplace 仍不在支持范围内。
7. 可选 desktop surface 继续保持 desktop foundation-only，并且只在已构建的 governor 源码仓上正式支持。当前没有正式支持的独立桌面安装器、已发布桌面 bundle 或 packaged desktop product claim。
8. 内置 `adopt apply` 不要求目标仓库预先存在 source-local `.codex/skills/**`；仓库内的 Codex 本地工作流辅助能力位于 `.codex/skills/`，主要服务 self-host 与维护者流程，外部 adopter 只有在希望复用同样的本地 skill 体验时才需要一并 vendoring。
9. 可选的宿主原生 follow-up 资产（`host export` / `host verify` / `host pack`）只在源码仓 follow-up surface 上正式支持。公开 host family 已包含 Codex、Claude Code 与 GitHub Copilot，但不同 target 的支持边界仍有差异；请保留 manifest/verification summary，在 governor 或技能资产刷新后重新执行对应 host 命令并重新 `host verify`，同时继续把 `github-com-agent` 视为 `docs/support-matrix.zh-CN.md` 明确放行前的 reserved/blocked target。
10. 若要在 clean-room 或 desktop-sidecar 场景下启动本地 service host，只支持通过根包公开导出 `@cjhdev/repo-ai-governor/service-host` 引入；不要深导入内部 `dist/**` host 文件。

## 5. 继续阅读

1. `docs/local-adoption-playbook.zh-CN.md`：面向使用者的完整接入、onboarding、rollback、workflow 与 troubleshooting 手册。
2. `docs/support-matrix.zh-CN.md`：当前 install mode、adapter 与验证范围的支持边界。
3. `docs/maintainer-validation-playbook.zh-CN.md`：只面向维护/发布 `repo-ai-governor` 本身的人员。
4. `examples/`：团队接入演练和模板资产入口。
