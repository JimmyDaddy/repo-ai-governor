# TK-307 M1 回归测试、fallback 与 non-interactive contract gate

- Status: in_progress
- Task ID: `TK-307`
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P0
- Project: `project-027-cli-interactive-shell-implementation`
- Sprint: `sprint-001-react-cli-shell-foundation`

## 1. 任务目标

为 M1 基线补齐测试和门禁，确保 shell foundation 不破坏现有 automation contract。

## 2. 产出

1. 单元测试基线
2. 组件/集成测试基线
3. non-interactive / fallback gate

## 3. 约束

1. `--no-interactive` 与 machine output contract 优先于任何 shell 默认行为。
2. 测试必须覆盖 `stderr` 渲染、SIGINT 与 fallback。
3. 失败路径必须可诊断，不允许静默退化。
