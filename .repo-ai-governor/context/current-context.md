# Workspace Current Context

## Primary Stream

- Status: active
- Project: `project-013-remote-provider-and-adapter-ops`
- Sprint: `sprint-001-remote-provider-real-invocation-baseline`
- Docs root: `.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops`
- Task records: `.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops/sprint-001-remote-provider-real-invocation-baseline/tasks/`
- Review records: `.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops/sprint-001-remote-provider-real-invocation-baseline/review/`

## Active Streams

- `primary`: project=`project-013-remote-provider-and-adapter-ops`, sprint=`sprint-001-remote-provider-real-invocation-baseline`, docs=`.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops`, plan=`.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops/plan.md`, tasks=`.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops/sprint-001-remote-provider-real-invocation-baseline/tasks/`, checklist=`.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops/sprint-001-remote-provider-real-invocation-baseline/tasks/checklist.md`, csv=`.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops/sprint-001-remote-provider-real-invocation-baseline/tasks/tasks.csv`, review=`.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops/sprint-001-remote-provider-real-invocation-baseline/review/`, status=`active`

## Completed Stream History

- File: `.repo-ai-governor/context/completed-streams-history.md`
- Scope: completed streams only; use for historical tracebacks, migration, or audit lookup.
- Default Load: `false`

## Update Rules

1. 切换项目或 sprint 时，优先更新本文件而不是修改 `AGENTS.md`。
2. 如需并发执行多个任务流，请在 `Active Streams` 中追加新条目，并保持只有一个 `primary`。
3. 当某个 stream 进入 `completed` 时，将其从 `Active Streams` 移入 `.repo-ai-governor/context/completed-streams-history.md`。
4. 已拆解但尚未启动的 follow-up sprint 可登记到 `Planned Follow-Up Streams`，避免与默认 active execution surface 混淆。
5. 开始执行前，先把任务、checklist、CSV 和 review 路径同步到对应 active stream 条目。
6. `Worktree Review Target` 只在“已完成 stream 仍持有未收口 CR”时使用；不需要 CR 的 completed stream 直接进入 history，不占用该槽位。
7. `Worktree Review Target` 只允许保留一个默认 target；若同一 worktree 同时存在多个 completed stream 的 CR 尾项，必须显式指定 report 路径，或先收完一个再切换另一个。
8. 当最后一个 pending/verified CR 收口为 `resolved` 后，必须在同一工作流中自动移除 `Worktree Review Target`，避免悬挂 override 持续污染默认上下文。
