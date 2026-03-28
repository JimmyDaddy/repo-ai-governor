# sprint-002-react-cli-shell-surface-expansion 计划

- Status: planned
- Date: 2026-03-28
- Project: `project-027-cli-interactive-shell-implementation`

## 1. Sprint Goal

将 React shell 扩展到 `connect/workspace/workflow`，补齐 descriptor、i18n 与异步校验能力。

## 2. Task Package

1. `TK-308` `connect/workspace` descriptor 化与表单映射扩展（planned）
2. `TK-309` `workflow` 命令树注册与 preview/edit 只读壳层（planned）
3. `TK-310` locale / i18n 注入与异步校验策略（planned）
4. `TK-311` M2 回归测试与 surface-expansion gate（planned）

## 3. Exit Criteria

1. `connect` 与 `workspace` 的表单化路径接入 descriptor registry。
2. `workflow` 子命令树与只读预览/编辑入口遵循正式 shell contract。
3. i18n、locale 注入与异步校验行为有明确实现约束。

## 4. Completion Notes

1. 这个 sprint 只在 M1 稳定后开启。
2. workflow 入口必须保持显式 Commander 子命令树注册，不允许隐藏字符串分支。
