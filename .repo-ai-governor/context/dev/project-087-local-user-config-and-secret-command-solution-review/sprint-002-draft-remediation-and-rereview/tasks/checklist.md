# checklist

- [x] TK-781 remediate local-user-config draft against blocking review findings
  - 2026-04-11：任务创建，状态初始化为 `in_progress`，目标是按 `TK-779` 的两条 blocking finding 直接修订 draft。
  - 2026-04-11：已把 formal landing 收敛到 `runtime.agent-projection` producer + `runtime.governance-clients` consumer，并明确该方案是 `technical-solution.api-key-remote-adapter-invocation` 的 companion follow-up。
  - 2026-04-11：已把 user-config authoring path 改写为 `tools.<surface>.remoteApi.*` 并补齐它到 `enabled_tools[] / configured_remote_api / selected_*` 的 canonical truth mapping；任务完成。
- [x] TK-782 re-review updated local-user-config draft and update lifecycle approval state
  - 2026-04-11：任务创建，状态初始化为 `planned`，等待 `TK-781` 完成后执行 re-review-after-updates。
  - 2026-04-11：已基于修订后的 draft 复查上一轮两条 blocking finding，确认 formal landing 与 canonical onboarding truth mapping 都已清楚收口。
  - 2026-04-11：已将 canonical review artifact verdict 推进到 `approved`，并把 lifecycle 状态同步更新为 `approved`；`final_paths` 继续保持空值。
- [x] TK-783 finalize project-087 sprint-002 closeout and restore idle context
  - 2026-04-11：任务创建，状态初始化为 `planned`，等待 `TK-782` 完成后执行 final closeout。
  - 2026-04-11：已将 `project-087` 的 project/sprint plan、completion audit、current-context 与 completed-stream history 同步回最终完成态。
  - 2026-04-11：已明确记录当前 handoff 为“technical solution 已批准，但尚未 promotion / active”；任务完成。
