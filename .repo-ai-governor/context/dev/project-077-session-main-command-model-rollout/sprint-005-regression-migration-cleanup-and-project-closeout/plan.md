# sprint-005-regression-migration-cleanup-and-project-closeout 计划

- Status: active
- Date: 2026-04-10
- Project: `project-077-session-main-command-model-rollout`
- Sprint Goal: 清理 `/verify` 残余、补齐 command-model end-to-end regressions，并完成 delivery/project closeout。

## 1. Task Package

1. `TK-738` remove remaining hidden `/verify` shims and docs residue
2. `TK-739` add end-to-end regressions for plan review run and verify removal paths
3. `TK-740` finalize delivery rollout closeout and project completion audit

## 2. Exit Criteria

1. hidden `/verify` shim、help residue、i18n 文案与 README/IDE wrapper 残留全部清除。
2. `/plan` vs `/plan sync`、`/review` vs `/review verify`、deleted `/verify` migration path、narrowed `/run` semantics、raw `@planner/@reviewer` bypass 都有回归覆盖。
3. delivery registry、project completion audit、current-context/history、artifact/task ledgers 已同步到最终 closeout 状态。

## 3. Milestones

1. 2026-04-10：sprint 创建，初始状态为 `planned`，等待 sprint-004 clean closeout 后激活。
2. 2026-04-10：`TK-746 / DA-746` 已完成 sprint-004 closeout 与 sprint-005 activation handoff，`sprint-005` 现已接管为新的 primary execution surface。
