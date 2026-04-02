# sprint-003-graceful-interrupt-cutover-and-governance-closeout 计划

- Status: planned
- Date: 2026-04-02
- Project: `project-037-agent-invoke-liveness-and-timeout-governance-rollout`
- Sprint Goal: 将 invoke-liveness state machine 正式接入 `session.main`、interactive shell、doctor/verify 与 delivery gate，并完成预算、回归矩阵与 cutover closeout。

## 1. Task Package

1. `TK-490` route session-main interactive shell and doctor verify through invoke liveness diagnostics
2. `TK-491` deliver invoke liveness regression budgets cutover governance and rollout closeout

## 2. Exit Criteria

1. `session.main`、interactive shell 与 execution details 已消费 shared invoke-liveness projection。
2. `doctor/verify` 能解释 invoke 为何继续等待、为何进入 grace、为何被最终保险丝终止。
3. route / role / surface 级 timeout budget 已具备明确配置与回归矩阵。
4. cutover governance、回滚边界、delivery closeout 与项目验收条件已全部收口。

## 3. Milestones

1. 2026-04-02：创建 planned `sprint-003`，冻结 `TK-490`、`TK-491` 作为 diagnostics/cutover/governance closeout package。
