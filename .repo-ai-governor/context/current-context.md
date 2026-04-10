# Workspace Current Context

## Primary Stream

- Status: active
- Project: `project-077-session-main-command-model-rollout`
- Sprint: `sprint-005-regression-migration-cleanup-and-project-closeout`
- Docs root: `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout`
- Task records: `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-005-regression-migration-cleanup-and-project-closeout/tasks/`
- Review records: `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-005-regression-migration-cleanup-and-project-closeout/review/`
- Note: `2026-04-10` 已在 `sprint-004` 全部 `TK` / `CR` 终态后，通过 `TK-746 / DA-746` 将 primary execution surface 切换到 `sprint-005`；`sprint-004` 已迁入 completed stream history。

## Active Streams

- `primary`: project=`project-077-session-main-command-model-rollout`, sprint=`sprint-005-regression-migration-cleanup-and-project-closeout`, docs=`.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout`, plan=`.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-005-regression-migration-cleanup-and-project-closeout/plan.md`, tasks=`.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-005-regression-migration-cleanup-and-project-closeout/tasks/`, checklist=`.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-005-regression-migration-cleanup-and-project-closeout/tasks/checklist.md`, csv=`.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-005-regression-migration-cleanup-and-project-closeout/tasks/tasks.csv`, review=`.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-005-regression-migration-cleanup-and-project-closeout/review/`, status=`active`

## Planned Follow-Up Streams

- 当前无已登记的 planned follow-up stream。

## Completed Stream History

- File: `.repo-ai-governor/context/completed-streams-history.md`
- Scope: completed streams only; use for historical tracebacks, migration, or audit lookup.
- Default Load: `false`

## Update Rules

1. 切换项目或 sprint 时，优先更新本文件而不是修改 `AGENTS.md`。
2. 如需并发执行多个任务流，请在 `Active Streams` 中追加新条目，并保持只有一个 `primary`。
3. 当某个 stream 进入 `completed` 时，将其从 `Active Streams` 移入 `.repo-ai-governor/context/completed-streams-history.md`。
4. 例外：若仓库尚未显式激活下一条主执行流，最近完成且仍承担 closeout / CR 尾项的 stream 可临时保留为 active closeout surface。若 project-final CR rounds 继续复用 final sprint 的 `tasks/` 与 `review/` surface，则该 final sprint 可在最后一个 project-final `CR` `resolved` 前保持 `active`；一旦 project-final CR 收口，project/sprint plan 与 tasks.csv 必须立即恢复到 `completed` 真值并进入最终 closeout。
5. 已拆解但尚未启动的 follow-up sprint 可登记到 `Planned Follow-Up Streams`，避免与默认 active execution surface 混淆。
6. 开始执行前，先把任务、checklist、CSV 和 review 路径同步到对应 active stream 条目。
7. `Worktree Review Target` 只在“已完成 stream 仍持有未收口 CR”时使用；不需要 CR 的 completed stream 直接进入 history，不占用该槽位。
8. `Worktree Review Target` 只允许保留一个默认 target；若同一 worktree 同时存在多个 completed stream 的 CR 尾项，必须显式指定 report 路径，或先收完一个再切换另一个。
9. 当最后一个 pending/verified CR 收口为 `resolved` 后，必须在同一工作流中自动移除 `Worktree Review Target`，避免悬挂 override 持续污染默认上下文。
