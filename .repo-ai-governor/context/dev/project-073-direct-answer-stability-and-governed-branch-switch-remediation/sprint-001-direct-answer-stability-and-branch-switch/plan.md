# sprint-001-direct-answer-stability-and-branch-switch 计划

- Status: completed
- Date: 2026-04-08
- Project: `project-073-direct-answer-stability-and-governed-branch-switch-remediation`
- Sprint Goal: 先完成 direct-answer 稳定性硬化，再补齐 session.main 的受治理分支切换路径，并在 clean CR loop 后完成 sprint closeout。

## 1. Task Package

1. `TK-714` stabilize session.main direct-answer preflight and liveness degradation handling
2. `TK-715` add governed branch-switch execution path for session.main
3. `TK-716` sprint-001 closeout and project-final review activation handoff
4. `TK-717` finalize project-073 closeout and restore idle context

## 2. Exit Criteria

1. direct-answer 对慢 probe、不可用 surface 与 liveness suspect 的处理已稳定且可验证。
2. “切换到 main 分支” 之类请求已拥有明确的受治理执行或确认链路。
3. sprint 内实现任务均已完成，相关 CR lifecycle 全部 clean `resolved`。

## 3. 里程碑记录

1. 2026-04-08：作为 `project-073` 的唯一 sprint 创建，初始状态为 `active`。
2. 2026-04-08：`TK-714` 已在创建窗口直接进入 `in_progress`，当前 sprint 先锁定 direct-answer 稳定性边界。
3. 2026-04-08：`TK-714` 已完成 direct-answer preflight 短路、invoke fallback 与 Codex liveness threshold 调整；当前 sprint 的下一边界进入该任务的 fresh reviewer CR loop。
4. 2026-04-08：`CR-001` 已接受并修复 direct-answer fallback relay-state 可见性问题，`TK-714` 当前边界 clean；sprint 下一边界切换为 `TK-715`。
5. 2026-04-08：`TK-715` 已完成受治理分支切换 capability / routing / CLI execution path 与 targeted regression tests；当前 sprint 边界进入该任务的 fresh reviewer CR loop。
6. 2026-04-08：`CR-002` 至 `CR-005` 已完成 fresh reviewer recheck 并全部 `resolved`；`TK-715` 当前边界 clean，sprint 下一边界切换为 `TK-716` closeout / handoff。
7. 2026-04-08：`TK-715` 边界提交已推送；`TK-716` 进入 `in_progress`，开始校对 sprint closeout 所需的 task-ledger / plan / review 真值，并准备 project-final review activation handoff。
8. 2026-04-08：`TK-716 / DA-716` 已完成 sprint closeout write-back；当前 sprint surface 保留为 `project-073` project-final delegated review loop 的默认 task/review 面，待 project-final CR 收口后再恢复最终 `completed` 真值。
9. 2026-04-08：`CR-006` 已 clean `resolved`，`TK-717 / DA-717` 已完成 project-final closeout；当前 sprint 恢复为最终 `completed` 真值。
