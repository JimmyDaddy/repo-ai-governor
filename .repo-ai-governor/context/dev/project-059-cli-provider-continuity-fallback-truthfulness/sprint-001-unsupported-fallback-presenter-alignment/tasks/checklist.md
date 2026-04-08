# checklist

- [x] TK-655 implement provider continuation fallback-aware presenter truthfulness
  - 2026-04-08：任务创建，状态初始化为 `in_progress`；本轮直接沿 presenter truth surface 修正 unsupported + fallback-active 的输出。
  - 2026-04-08：已为 presenter-safe `providerContinuationSummary` 增加 `lightweightSessionFallbackApplied` 真值，用于区分 fallback 已生效与未生效的 unsupported 场景。
  - 2026-04-08：已更新 transcript presenter 与 i18n 文案：unsupported + fallback-active 现在按“连续性已通过轻量摘要保住”的信息展示；无 fallback 时继续保留 truthful unsupported 提示。
  - 2026-04-08：`pnpm vitest run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts --maxWorkers=1 --maxConcurrency=1` 与 `pnpm run build` 全部通过，任务完成。
- [x] TK-656 finalize project-059 closeout and clear the active primary stream
  - 2026-04-08：任务创建，状态初始化为 `planned`；等待 `TK-655` 完成后激活。
  - 2026-04-08：已写入 `DA-656` 与 `project-059` completion audit summary，并把 `project-059 / sprint-001` 恢复为最终 `completed` 真值。
  - 2026-04-08：已将当前 primary stream 从 `current-context.md` 移入 `completed-streams-history.md`，当前 worktree 不再保留 active primary stream。
