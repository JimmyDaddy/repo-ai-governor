# sprint-002-onboarding-and-adapter-matrix 计划

- Status: planned
- Date: 2026-03-28
- Project: `project-028-multi-ai-tools-onboarding-role-agent-projection`

## 1. Sprint Goal

落实 `connect / doctor / verify` 三段式 onboarding 链路与最小支持矩阵。

## 2. Task Package

1. `TK-306` 实现 connect 模板与路由基线生成。
2. `TK-307` 实现 doctor --adapters 探测与 safe_local 修复。
3. `TK-308` 实现 verify --adapters 矩阵报告。

## 3. Exit Criteria

1. `connect` 可生成 `single-tool-all-roles` 与 `multi-tool-default` 两类 preset，并输出可校验配置。
2. `doctor --adapters` 至少覆盖 1 条可自动修复路径与 1 条仅输出 `nextAction` 的路径。
3. `verify --adapters` 可输出 `pass / warn / fail` 三档判定并回链 `execution_id`。

## 4. Execution Notes

1. 本 sprint 只收敛 onboarding 行为与 adapter 矩阵，不触碰 projection 语义。
2. 所有不能自动修复的诊断都必须显式落到 `nextAction`，避免 silent failure。
