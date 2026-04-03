# sprint-003-graceful-interrupt-cutover-and-governance-closeout 计划

- Status: active
- Date: 2026-04-03
- Project: `project-037-agent-invoke-liveness-and-timeout-governance-rollout`
- Sprint Goal: 承接从 `sprint-001` 迁入的 `Codex` graceful interrupt / watchdog 残余实现，并将 invoke-liveness state machine 正式接入 `session.main`、interactive shell、doctor/verify 与 delivery gate，完成预算、回归矩阵与 cutover closeout。

## 1. Task Package

1. `TK-487` roll codex onto shared invoke liveness watchdog graceful interrupt and partial output preservation
2. `TK-490` route session-main interactive shell and doctor verify through invoke liveness diagnostics
3. `TK-491` deliver invoke liveness regression budgets cutover governance and rollout closeout

## 2. Exit Criteria

1. `Codex` 已补齐 shared invoke-liveness 尚未收口的 `transport_idle_suspect / semantic_stall_suspect / graceful_interrupting / hard_terminating` 投影、soft interrupt / hard terminate 双阶段终止与 partial-output preservation 链路。
2. `session.main`、interactive shell 与 execution details 已消费 shared invoke-liveness projection。
3. `doctor/verify` 能解释 invoke 为何继续等待、为何进入 grace、为何被最终保险丝终止。
4. route / role / surface 级 timeout budget 已具备明确配置与回归矩阵。
5. cutover governance、回滚边界、delivery closeout 与项目验收条件已全部收口。

## 3. Milestones

1. 2026-04-02：创建 planned `sprint-003`，冻结 `TK-490`、`TK-491` 作为 diagnostics/cutover/governance closeout package。
2. 2026-04-03：将 `TK-487` 从 `sprint-001` 迁入 `sprint-003`，显式承接残余 `Codex` watchdog / graceful interrupt / hard terminate closeout，避免已 completed 的 `sprint-001` 继续悬挂未完成实现任务。
3. 2026-04-03：在 `TK-489` 收口后将 `sprint-003` 提升为新的 primary planning surface；当前 focus 回到 `TK-487`、`TK-490`、`TK-491` 的 graceful interrupt cutover 与 governance closeout。
