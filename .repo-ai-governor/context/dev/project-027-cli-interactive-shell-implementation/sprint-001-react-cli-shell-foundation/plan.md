# sprint-001-react-cli-shell-foundation 计划

- Status: completed
- Date: 2026-03-28
- Project: `project-027-cli-interactive-shell-implementation`

## 1. Sprint Goal

建立 React shell 的运行骨架、UI mode 解析、`stderr` 输出边界与 `init` 的最小可用交互闭环。

## 2. Task Package

1. `TK-304` project-027 激活与 React shell implementation handoff（completed）
2. `TK-305` shell runner、UI mode resolver 与 stderr/SIGINT baseline（completed）
3. `TK-306` `init` React shell 最小向导与 descriptor/state baseline（completed）
4. `TK-307` M1 回归测试、fallback 与 non-interactive contract gate（completed）

## 3. Exit Criteria

1. `--ui react` 的入口可解析并进入 shell runner。
2. `--no-interactive`、非 TTY、`json/plain` 仍稳定回退到 `none`。
3. `init` 的 React shell 能完成最小字段收集、确认与提交。
4. `stderr` 渲染、`SIGINT` 清理与 classic fallback 有明确实现边界。

## 4. Completion Notes

1. 这个 sprint 只负责 shell foundation，不扩展 `connect/workspace/workflow/upgrade`。
2. `descriptor` 与 `session` 先做最小可测试形态，避免业务逻辑回流到组件层。
3. 2026-03-28：M1 foundation 已完成，`--ui react`、`ui_mode` resolver、stderr-only `init` minimal wizard、classic fallback 与回归测试基线均已落地。
