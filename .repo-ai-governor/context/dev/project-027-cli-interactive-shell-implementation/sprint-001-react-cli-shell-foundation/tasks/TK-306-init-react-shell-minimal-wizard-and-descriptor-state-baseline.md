# TK-306 `init` React shell 最小向导与 descriptor/state baseline

- Status: completed
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P0
- Project: `project-027-cli-interactive-shell-implementation`
- Sprint: `sprint-001-react-cli-shell-foundation`

## 1. 任务目标

把 `init` 做成最小可用的 React 风格向导，先打通字段收集、确认、提交和失败回退闭环。

## 2. Depends On

1. `TK-305`
2. `init-command`
3. `descriptor registry`

## 3. 预期产物

1. `init` shell baseline
2. descriptor / state baseline
3. 最小表单流转与确认层

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-001-react-cli-shell-foundation/tasks/TK-305-shell-runner-ui-mode-resolver-and-stderr-sigint-baseline.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-interactive-shell-contract.md`
3. `apps/cli/src/commands/init-command.ts`
4. `apps/cli/src/runtime/interactive-shell-ui-mode-resolver.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/plan.md`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-001-react-cli-shell-foundation/plan.md`

## 6. 实施计划

1. 以 descriptor/state 驱动方式补齐 `init` 的最小字段收集、确认与提交流转。
2. 将 React 路径限制在 `stderr` 渲染面，classic path 保持稳定 fallback。
3. 只覆盖 M1 必需字段，不提前把 `connect/workspace/workflow/upgrade` 合流到本任务。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm vitest run --config vitest.packages.config.ts apps/cli/test/runtime/interactive-shell-ui-mode-resolver.test.ts apps/cli/test/runtime/init-react-shell-runner.test.ts apps/cli/test/cli-output-contract.integration.test.ts`

## 8. Delivery Verification

1. `init` React 路径与 classic fallback 保持双通道可用。
2. `init-manifest.json` 回写真实交互选择，不允许交互态与落盘配置漂移。

## 9. 执行记录

1. 2026-03-28：任务创建，状态切换为 `in_progress`，开始落地 init 最小向导闭环。
2. 2026-03-28：新增 `init-shell-descriptor-registry.ts` 与 `init-react-shell-runner.ts`，把 `init` 的 workspace mode、default locale、confirmation、submit 状态固化为 descriptor/state 驱动的最小向导。
3. 2026-03-28：`apps/cli/src/commands/init-command.ts` 现在根据 `ui_mode` 在 `react/classic/none` 之间分流，React 路径只写 `stderr`，classic 路径作为稳定 fallback 保留。
4. 2026-03-28：`init-manifest.json` 的 `workspaceMode` 改为记录真实交互选择，避免交互改写配置后 manifest 仍停留旧值。

## 10. 产出

1. `apps/cli/src/runtime/init-shell-descriptor-registry.ts`
2. `apps/cli/src/runtime/init-react-shell-runner.ts`
3. `apps/cli/src/commands/init-command.ts`
4. `apps/cli/test/runtime/init-react-shell-runner.test.ts`
