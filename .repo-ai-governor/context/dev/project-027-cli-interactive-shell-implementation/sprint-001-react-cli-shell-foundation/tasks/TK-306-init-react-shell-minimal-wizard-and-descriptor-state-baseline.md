# TK-306 `init` React shell 最小向导与 descriptor/state baseline

- Status: completed
- Task ID: `TK-306`
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P0
- Project: `project-027-cli-interactive-shell-implementation`
- Sprint: `sprint-001-react-cli-shell-foundation`

## 1. 任务目标

把 `init` 做成最小可用的 React 风格向导，先打通字段收集、确认、提交和失败回退闭环。

## 2. 产出

1. `init` shell baseline
2. descriptor / state baseline
3. 最小表单流转与确认层

## 3. 约束

1. 只实现 M1 必需字段与状态，不提前扩展 `connect/workspace/workflow/upgrade`。
2. descriptor 负责字段定义，组件只做渲染和事件转发。
3. `classic` fallback 必须始终可用。

## 4. 执行记录

1. 2026-03-28：新增 `init-shell-descriptor-registry.ts` 与 `init-react-shell-runner.ts`，把 `init` 的 workspace mode、default locale、confirmation、submit 状态固化为 descriptor/state 驱动的最小向导。
2. 2026-03-28：`apps/cli/src/commands/init-command.ts` 现在根据 `ui_mode` 在 `react/classic/none` 之间分流，React 路径只写 `stderr`，classic 路径作为稳定 fallback 保留。
3. 2026-03-28：`init-manifest.json` 的 `workspaceMode` 改为记录真实交互选择，避免交互改写配置后 manifest 仍停留旧值。
