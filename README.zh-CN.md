# Repo AI Governor

面向仓库本地的 AI 治理 CLI，用于执行流程化、多角色的治理工作流。

- 英文指南：`README.md`
- 本地接入手册：`docs/local-adoption-playbook.zh-CN.md`
- 仓库本地 skill 参考：`.codex/skills/`
- 示例资产：`examples/`
- 变更日志：`CHANGELOG.zh-CN.md`

## 1. 5~15 分钟快速接入

## 1.1 前置条件

1. Node.js `>=18`
2. `pnpm`
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

适用边界（2026-03-26 实测）：

1. `tgz` clean-room 安装在 `pnpm add` 可访问 npm registry 时可稳定通过。
2. tarball 不是离线自包含安装：`commander`、`i18next`、`yaml` 等外部依赖仍会在 `pnpm add` 阶段解析。
3. 完全受限网络或离线环境请优先使用已完成 bootstrap 的 governor checkout，并通过 `path` / `link` 接入。

## 1.3 打包参考资产面

已发布 tarball 应包含：

1. `README.md` 与 `README.zh-CN.md`
2. `docs/local-adoption-playbook.md` 与 `docs/local-adoption-playbook.zh-CN.md`
3. `examples/`
4. `integrations/ide/` 与 `integrations/desktop/`
5. `.codex/skills/`

`.codex/skills/` 下的 repo-local skills 作为参考资产随包发布，但不会自动复制到目标仓库工作区。

## 1.4 初始化命令链

在 `<target-repo>` 下执行：

```bash
pnpm exec repo-ai-governor --help
pnpm exec repo-ai-governor init --output json
pnpm exec repo-ai-governor doctor --output json
pnpm exec repo-ai-governor check --output json
```

预期结果：

1. 全部命令返回 JSON，且 `status=success`。
2. `doctor` 在 `command_result.attach_mode` 中返回 attach 模式。
3. `check` 在 `command_result.check_totals` 中返回门禁统计。

## 1.5 只读接入预检

通过 `doctor` 判断当前仓库是否可写：

```bash
pnpm exec repo-ai-governor doctor --output json
```

当仓库不可写时，应返回只读 attach 语义，而不是直接崩溃。

## 2. 完整治理闭环（Stage 9A/9B 基线）

```bash
pnpm exec repo-ai-governor plan --output json
pnpm exec repo-ai-governor run --output json --dry-run --trace
pnpm exec repo-ai-governor review --output json
pnpm exec repo-ai-governor review-verify --output json
```

该链路会在工作区产出 review-verify 与 ledger-backfill 相关产物。

## 3. Workspace 模式与回滚

默认模式为 `tool_managed`。如需切换到 `repo_local`，可在 `.repo-ai-governor/governor.yaml` 配置：

```yaml
schemaVersion: "1.1"
workspace:
  mode: repo_local
  migrationPolicy: copy_verify_switch_rollback
```

回滚时，将 `workspace.mode` 改回 `tool_managed`，再执行 `init` 与 `doctor`。

## 4. 示例与门禁

以下命令需在 `<governor-repo>` 执行（属于仓库维护脚本，不是目标仓库 CLI 子命令）：

- 示例目录：`examples/`
- 文档 smoke：`pnpm run check:examples-doc-smoke`
- 运行 smoke：`pnpm run check:examples-runtime-smoke`
- 聚合 smoke：`pnpm run check:examples-smoke`

仓库全量验证：

```bash
pnpm run check
```

## 5. 常见问题

1. `pnpm add <tarball>` 报 `ENOTFOUND` 或 registry 解析失败：`tgz` 仍依赖 npm registry；请改用 `path` / `link` 或在联网环境安装。
2. 源码接入后出现 `ERR_MODULE_NOT_FOUND`：在 governor 仓库执行 `pnpm install` 并重新构建。
3. runtime smoke 解析失败：确保自动化调用统一使用 `--output json`。
4. `review-verify` 无待消费请求：先执行一次 `review`。
5. workspace 根路径异常：检查 `governor.yaml.workspace.mode` 与当前执行目录。

## 6. 下一步

1. 阅读 `docs/local-adoption-playbook.zh-CN.md` 获取 clean-room 与升级细则。
2. 如需 Codex 仓库本地 skill 模板，可查看 `.codex/skills/`。
3. 使用 `examples/` 作为团队接入演练入口。
4. 在 `CHANGELOG.zh-CN.md` 跟踪升级与迁移说明。
