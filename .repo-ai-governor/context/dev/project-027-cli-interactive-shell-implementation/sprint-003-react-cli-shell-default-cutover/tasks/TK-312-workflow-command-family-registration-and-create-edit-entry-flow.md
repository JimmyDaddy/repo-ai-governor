# TK-312 `workflow` 命令家族注册与 create/edit 入口流

- Status: completed
- Date: 2026-03-29
- Owner: AI-Agent
- Priority: P0
- Project: `project-027-cli-interactive-shell-implementation`
- Sprint: `sprint-003-react-cli-shell-default-cutover`

## 1. 任务目标

将 `workflow` 注册为显式 Commander 子命令家族，并补齐 `create/edit/preview` 的入口选择与最小编辑流起点。

## 2. Depends On

1. `TK-311`

## 3. 预期产物

1. `CliCommandName.WORKFLOW` 与 Commander 子命令树
2. `workflow create/edit/preview` 入口流
3. help surface / action selection 更新

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/plan.md`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-003-react-cli-shell-default-cutover/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-interactive-shell-contract.md`
4. `.repo-ai-governor/draft/interactive-cli-react-style-technical-solution.md`
5. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-002-react-cli-shell-surface-expansion/tasks/TK-311-workflow-preview-readonly-summary-and-m2-regression-gate.md`

## 5. Traceback References

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-002-react-cli-shell-surface-expansion/tasks/TK-311-workflow-preview-readonly-summary-and-m2-regression-gate.md`

## 6. 实施计划

1. 在 `CliCommandName` / Commander 中显式注册 `workflow create/edit/preview`，避免隐藏字符串分支。
2. 提供动作选择页和最小 create/edit 入口流，把只读 preview 扩展到可编辑入口。
3. 保持帮助面、fallback 与命令帮助文本同源更新。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. 补齐并运行 `workflow` 命令树、动作选择页与 create/edit 入口流的定向测试。

## 8. Delivery Verification

1. `pnpm run check`
2. `workflow` 入口必须只通过显式子命令树到达，且不破坏 `--no-interactive`、非 TTY 与 machine output contract。

## 9. 执行记录

1. 2026-03-28：任务创建，状态初始化为 `planned`。
2. 2026-03-28：依据技术方案 draft 的 M3 清单，改为收口 `workflow` 命令家族注册与 create/edit 入口流。
3. 2026-03-29：任务切换为 `in_progress`，开始把 preview-only 基线扩展到显式 `workflow create/edit/preview` 入口与最小编辑流起点。
4. 2026-03-29：实现完成，已落地 `workflow create/edit/preview` 显式子命令树、共享 shell `entryMode`、create/edit 最小入口流与帮助面更新。
5. 2026-03-29：验证通过 `pnpm -s tsc -p tsconfig.json --noEmit` 与 `pnpm -s vitest run --config vitest.packages.config.ts apps/cli/test/commands/workflow-command.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-output-presenter.unit.test.ts`。
6. 2026-03-29：`pnpm run check` 已尝试执行，但当前被仓库既有 artifact lifecycle backlog（`.repo-ai-governor/context/artifact-registry/artifacts.csv` rows 26-50）阻断，非本任务改动引入。

## 10. 产出

1. 已完成：`CliCommandName.WORKFLOW` 与显式 Commander 子命令树，覆盖 `workflow create/edit/preview`。
2. 已完成：`workflow create/edit/preview` 入口流、共享 shell `entryMode` 与帮助面更新。
3. 已完成：对应测试与命令路由证据
   - `apps/cli/test/commands/workflow-command.test.ts`
   - `apps/cli/test/cli-skeleton.integration.test.ts`
   - `apps/cli/test/cli-output-contract.integration.test.ts`
4. 已知阻断：仓库级 `pnpm run check` 当前失败于既有 `artifact-lifecycle` 治理积压，需单独窗口清理 rows 26-50 的旧 `active` artifact。
