# TK-305 shell runner、UI mode resolver 与 stderr/SIGINT baseline

- Status: in_progress
- Task ID: `TK-305`
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P0
- Project: `project-027-cli-interactive-shell-implementation`
- Sprint: `sprint-001-react-cli-shell-foundation`

## 1. 任务目标

建立 React shell 的最小运行骨架，固化 `ui_mode` 解析优先级、`stderr` 渲染边界与 `SIGINT` 清理语义。

## 2. 产出

1. shell runner / mode resolver baseline
2. `stderr` 输出通道约束
3. `SIGINT` / fallback 处理骨架

## 3. 约束

1. `--no-interactive`、非 TTY、`json/plain` 必须强制回退到 `none`。
2. shell 必须只渲染到 `stderr`，不污染 machine output。
3. 生命周期管理必须显式包含 unmount / restore 行为。
