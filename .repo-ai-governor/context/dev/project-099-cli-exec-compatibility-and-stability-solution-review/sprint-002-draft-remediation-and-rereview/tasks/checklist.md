# checklist

- [x] TK-837 remediate cli-exec compatibility and stability productization draft against blocking review findings
  - 2026-04-13：任务创建，状态初始化为 `in_progress`，目标是按 `TK-835` 的两条 blocking finding 直接修订 draft。
  - 2026-04-13：已把 compatibility taxonomy 改写为 `scenario class x required preserved facts`，并补齐 owner / surface / evidence mapping。
  - 2026-04-13：已定义 `cli_exec_compatibility_full / runtime_foundation / adapter_slice` 三档 profile、trigger matrix 与 evidence write-back contract；任务完成。
- [x] TK-838 rereview updated cli-exec compatibility and stability productization draft and update lifecycle approval state
  - 2026-04-13：任务创建，状态初始化为 `planned`，等待 `TK-837` 完成后执行 re-review-after-updates。
  - 2026-04-13：已基于修订后的 draft 复查上一轮两条 blocking finding，并确认 `scenario/invariant matrix` 与 canonical verification profile 都已清楚收口。
  - 2026-04-13：已完成 fresh delegated reviewer round，reviewer 返回 `no actionable findings`；canonical review artifact verdict 与 lifecycle 状态均已推进到 `approved`。
- [x] TK-839 finalize project-099 sprint-002 closeout and restore idle context
  - 2026-04-13：任务创建并在同一窗口完成，用于承接 `TK-838` 之后的 final closeout write-back。
  - 2026-04-13：已更新 project-099 completion audit summary，并将 `stream-project-099-sprint-002` 追加到 completed stream history。
  - 2026-04-13：已完成 `project-099` task-ledger sync、sprint-status 与 worktree-review-target 检查；最终 `current-context.md` 保持 idle。
  - 2026-04-13：已追加 stream-project-099-sprint-002 到 completed-streams-history，并明确 handoff 为 approved but not promoted。
