# sprint-002-react-cli-shell-surface-expansion 计划

- Status: active
- Date: 2026-03-28
- Project: `project-027-cli-interactive-shell-implementation`

## 1. Sprint Goal

固化共享 descriptor/shell 框架，接入 `connect/workspace`，让 `init` 默认走 React，并先把 `workflow` 做成只读预览。

## 2. Task Package

1. `TK-308` 共享 descriptor registry、字段渲染器与步骤引擎基线（in_progress）
2. `TK-309` `connect/workspace` 共享壳层接入与 help/error/footer 统一（completed）
3. `TK-310` `init` 默认 React 路由与 classic fallback 体验策略（planned）
4. `TK-311` `workflow preview` 只读摘要与 M2 回归 gate（planned）

## 3. Exit Criteria

1. `init/connect/workspace` 共享同一套 descriptor registry、字段渲染器、步骤推进器与 help/error/footer。
2. `init` 在 `TTY + pretty + interactive` 下默认走 React，并保留明确的 classic fallback 与错误提示策略。
3. `workflow preview` 提供模板选择、流程摘要与 compiled IR 预览，但不改写流程文件。
4. M2 regression gate 锁定 `stderr-only`、`pretty/plain/json`、非 TTY 与 `--no-interactive` contract，并统一以 `ink@6.8.0 + @inkjs/ui@2.0.0` 作为实现底座。

## 4. Completion Notes

1. 这个 sprint 已激活；先交付共享壳层与默认路由策略，再收口 `workflow preview`。
2. `workflow preview` 必须保持只读；`workflow create/edit/save` 与更深的 DSL 编辑能力留给 `sprint-003`。
3. 版本基线固定为 `ink@6.8.0` 与 `@inkjs/ui@2.0.0`；字段控件优先复用 `@inkjs/ui`，shell 生命周期与布局优先落在 `Ink` 原生能力之上。
4. 2026-03-28：完成 `TK-309`，`connect/workspace` 已切入共享 descriptor/shell 基线，并统一了 help/error/footer 与 i18n runtime 接线。
