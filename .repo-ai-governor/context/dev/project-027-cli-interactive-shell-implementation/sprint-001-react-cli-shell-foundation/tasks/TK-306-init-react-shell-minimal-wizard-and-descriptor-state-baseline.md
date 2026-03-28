# TK-306 `init` React shell 最小向导与 descriptor/state baseline

- Status: in_progress
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
