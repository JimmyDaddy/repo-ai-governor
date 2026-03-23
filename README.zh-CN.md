# Repo AI Governor

面向仓库本地的 AI 治理 CLI，用于执行流程化、多角色的治理工作流。

- 英文指南：`README.md`
- 本地接入手册：`docs/local-adoption-playbook.zh-CN.md`
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

### 方式 C：`tgz`（Stage 9B 跟进项，当前为已知限制）

```bash
cd <governor-repo>
pnpm pack --json

cd <target-repo>
pnpm add --save-exact /绝对路径/cjhdev-repo-ai-governor-<version>.tgz
```

已知限制（2026-03-22 实测）：
`tgz` 模式在 clean-room 下执行 `pnpm exec repo-ai-governor --help` 仍可能报
`ERR_MODULE_NOT_FOUND(@repo-ai-governor/cli)`。
Stage 9A 接入请优先使用 `path` / `link`，`tgz` 作为 Stage 9B 的 fix-forward 项处理。

## 1.3 初始化命令链

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

## 1.4 只读接入预检

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

1. `ERR_MODULE_NOT_FOUND`：在 governor 仓库执行 `pnpm install` 并重新构建。
2. runtime smoke 解析失败：确保自动化调用统一使用 `--output json`。
3. `review-verify` 无待消费请求：先执行一次 `review`。
4. workspace 根路径异常：检查 `governor.yaml.workspace.mode` 与当前执行目录。

## 6. 下一步

1. 阅读 `docs/local-adoption-playbook.zh-CN.md` 获取 clean-room 与升级细则。
2. 使用 `examples/` 作为团队接入演练入口。
3. 在 `CHANGELOG.zh-CN.md` 跟踪升级与迁移说明。
