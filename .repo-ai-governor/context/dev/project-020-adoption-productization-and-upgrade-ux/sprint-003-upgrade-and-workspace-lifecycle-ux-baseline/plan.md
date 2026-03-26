# sprint-003-upgrade-and-workspace-lifecycle-ux-baseline 计划

- Status: completed
- Date: 2026-03-26
- Project: `project-020-adoption-productization-and-upgrade-ux`

## 1. Sprint Goal

将 `UpgradeSchemaDiffService`、`WorkspaceMigrationService` 与相关 planner 能力切为 adopter 可操作、可 dry-run、可 rollback 的正式 CLI 用户路径。

## 2. Task Package

1. `TK-230` sprint-003 激活与 sprint-002 closeout handoff（completed）
2. `TK-231` upgrade command user path 与 confirmation/rollback reference baseline（completed）
3. `TK-232` workspace lifecycle CLI dry-run/execute/rollback/failure-summary baseline（completed）
4. `TK-233` sprint-003 出口验收与 sprint-004 adopter pilot 输入约束（completed）

## 3. Exit Criteria

1. `upgrade` 至少具备 schema diff、migration suggestions、confirmation items 与 rollback reference 的清晰 CLI 用户出口。
2. workspace lifecycle 至少具备 dry-run、execute、rollback 与 failure summary 的正式 CLI 用户路径。
3. adopter 能理解“将改什么、为什么阻断、如何回滚”，而不是只能消费底层 service 报告或手工读取 JSON。

## 4. Execution Notes

1. `sprint-003` 默认消费 `DA-229`，不再重复打包真值盘点。
2. 第一条实质任务优先收敛 `upgrade` 用户路径，因为 `CliUpgradeCommand` 当前只输出 diff artifact，尚未形成清晰的 adopter-facing action surface。
3. `sprint-004-adopter-pilot-and-documentation-closure` 尚未激活；当前仅保留 `sprint-003` 作为 completed closeout surface，等待显式选择 pilot 仓库后再切换主执行流。
