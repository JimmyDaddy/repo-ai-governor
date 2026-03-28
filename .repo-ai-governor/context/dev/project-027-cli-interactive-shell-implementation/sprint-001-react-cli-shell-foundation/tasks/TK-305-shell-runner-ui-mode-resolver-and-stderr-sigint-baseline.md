# TK-305 shell runner、UI mode resolver 与 stderr/SIGINT baseline

- Status: completed
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

## 4. 执行记录

1. 2026-03-28：新增 `apps/cli/src/constants/cli-interactive-shell.constant.ts`、`interactive-shell-ui-mode-resolver.ts` 与 `interactive-shell-stderr-renderer.ts`，建立 `ui_mode`、fallback 行为和 stderr-only renderer 基线。
2. 2026-03-28：`apps/cli/src/main.ts` 增加 `--ui <mode>` 解析，`CliRuntimeDebugOptions` 与 `CliNormalizedRuntimeDebugOptions` 扩展 `requestedUiMode/uiMode/uiFallbackBehavior`，并把 `--no-interactive`、非 TTY、`plain/json` 收敛到 `ui_mode=none`。
3. 2026-03-28：`init` React shell lifecycle 增加 `SIGINT` cancel + unmount 路径；非 `SIGINT` 初始化异常会回退 classic path 并记录 fallback check。
