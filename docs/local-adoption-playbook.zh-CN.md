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

如果你使用 `dist-binary` 演练，请将 `pnpm exec repo-ai-governor` 替换为：

```bash
node <governor-repo>/dist/bin/repo-ai-governor.js <command>
```

当仓库不可写时，`doctor` 应返回只读 attach 语义。

基于真实 pilot 的补充说明：

1. `init` 默认会落到 `tool_managed`，因此全新目标仓库未必会立刻生成 `.repo-ai-governor/`。
2. 全新外部仓库中，`doctor` 可能出现 `baseline_docs missing=5/5` warning；当前应视为 external-adopter baseline，而不是 bootstrap failure。
3. 外部目标仓库中，`check` 可能出现 `check-task-ledger-sync=script_not_found` 等 warning；除非该仓库也同时 vendoring 了 self-host 治理脚本，否则这是当前预期。

## 3.1 多 AI 工具接入（Codex / Claude Code / GitHub Copilot）

建议按“工具可用性 -> Governor 治理接线 -> 诊断验证”三步执行：

1. 先确认你要接入的 AI 工具在目标仓库内可独立工作（按实际入口任选）：
   - Codex CLI：`codex --help`
   - Claude Code CLI：`claude --help`
   - GitHub Copilot：在 IDE 中打开该仓库并确认 Copilot 对话可用（CLI 场景可先确认 `gh auth status` 已登录）。
2. 在 `.repo-ai-governor/governor.yaml` 注册角色契约（当前配置层以 `roles` 为入口，无需单独 `adapters` 段）：

```yaml
roles:
  - roleProfileId: coder-codex
    roleProfileVersion: "1.0.0"
    displayName: Codex Coder
    responsibilities:
      - implement task cards
    capabilities:
      - code generation
      - unit test update
    permissionCeiling:
      - repo.read
      - repo.write
    roleSource: custom
    status: active
```

3. 执行治理链路并验证接线结果：

```bash
pnpm exec repo-ai-governor run --output json --dry-run --trace
```

重点查看 `context/diagnostics/trace/<execution_id>.trace.json` 中：

1. `adapterInvocationSummary[].routeKey`：路由语义是否符合预期。
2. `adapterInvocationSummary[].handledBy`：当前由哪个执行面处理。
3. `summary.policyOutcome`：策略闸口是否按风险事实触发。

说明：

1. Stage 9A 基线下，`handledBy=cli-governance-runtime` 属于预期（治理链路先闭环）。
2. Stage 9B（`TK-082`）会继续收敛 Codex/Claude Code/Copilot 的真实调用路径，届时沿用同一诊断字段进行验证。

## 4. Workspace 模式切换与回滚

默认模式是 `tool_managed`。

如需切换 `repo_local`，建议使用显式迁移命令：

```bash
pnpm exec repo-ai-governor workspace --workspace-action dry-run --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace --workspace-action execute --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace --workspace-action rollback --workspace-plan <plan-path> --output json
```

回滚步骤：

1. 保留 `workspace dry-run` 或 `workspace execute` 输出中的 `plan-path`。
2. 使用同一个 `plan-path` 执行显式 rollback。
3. 重新执行 `doctor`，确认 `workspaceRoot` 已恢复到 `tool_managed`。

当前已知限制：

1. `workspace execute` / `rollback` 的正式产物仍主要位于 source `tool_managed` workspace，而不是当前 repo-local 根。
2. `rollback` 之后，目标仓库里可能仍残留空的 `.repo-ai-governor-migration/<migration-id>/backup` 目录。

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

## 8. clean-room 验证与差异说明

在 governor 仓库执行：

```bash
pnpm run release:verify-cleanroom-local-install
```

说明：

1. Stage 9A 基线要求 path/link 多轮重复验证。
2. Stage 9B+ 基线已将 `tgz` 安装 smoke 纳入验证，用于持续确认打包运行时依赖解析。
3. `tgz` 验证属于联网校验，不代表离线自包含安装已成立。

## 9. 接入期治理门禁

建议在本地交付前执行：
需在 `<governor-repo>` 执行：

```bash
pnpm run check
pnpm run release:verify-local
pnpm run release:ga-check
```

## 10. 升级检查清单

1. 阅读 `CHANGELOG.zh-CN.md` 的迁移说明。
2. 在全新目标仓库复跑初始化命令链。
3. 复跑 examples smoke。
4. 执行 clean-room 验证后再扩大 rollout。

## 11. 已知限制

1. `dist-binary` 只证明 CLI/runtime 行为成立，不等于已经验证 package install surface。
2. 在全新的外部 adopter 仓库里，`doctor` / `check` 仍会出现 external-baseline warning，除非你主动把 self-host 治理文档与脚本一起 vendoring 进去。
3. workspace migration 的 truthfulness 已经成立，但人体工程学还没完全收口：artifact locality 仍偏 source `tool_managed`，且 rollback 后 scratch cleanup 还不彻底。
