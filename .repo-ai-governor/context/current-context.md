# Workspace Current Context

## Primary Stream

- Status: active
- Project: `project-030-runtime-agent-projection-phase-2-productization`
- Sprint: `sprint-003-smoke-gate-and-agent-view-presentation`
- Docs root: `.repo-ai-governor/context/dev/project-030-runtime-agent-projection-phase-2-productization`
- Task records: `.repo-ai-governor/context/dev/project-030-runtime-agent-projection-phase-2-productization/sprint-003-smoke-gate-and-agent-view-presentation/tasks/`
- Review records: `.repo-ai-governor/context/dev/project-030-runtime-agent-projection-phase-2-productization/sprint-003-smoke-gate-and-agent-view-presentation/review/`
- Note: `project-030-runtime-agent-projection-phase-2-productization` 已于 2026-03-30 激活，用于承接 `runtime.agent-projection` phase-2 productization follow-up。`sprint-001-technical-solution-and-phase-map` 已完成 draft、formal promotion cutover 与 phase map 产出并进入 closeout history；`sprint-002-connect-apply-and-diagnostics-contract` 与 `sprint-003-smoke-gate-and-agent-view-presentation` 已于 2026-03-30 完成 `connect diff/apply`、candidate diff / merge explain、adopter smoke automation 与 shared presenter 落地。当前保留 `sprint-003` 作为 active closeout surface，直到下一条主执行流显式激活；项目下一条待执行流为 `sprint-004-ui-consumer-and-rollout-closeout`。经 2026-03-30 跨项目排序复核，推荐执行顺序锁定为 `project-030 / sprint-002 -> project-030 / sprint-003 -> project-031 / sprint-001~004 -> project-030 / sprint-004`。`project-028 / sprint-004` 已迁入 completed history。

## Active Streams

- `primary`: project=`project-030-runtime-agent-projection-phase-2-productization`, sprint=`sprint-003-smoke-gate-and-agent-view-presentation`, docs=`.repo-ai-governor/context/dev/project-030-runtime-agent-projection-phase-2-productization`, plan=`.repo-ai-governor/context/dev/project-030-runtime-agent-projection-phase-2-productization/plan.md`, tasks=`.repo-ai-governor/context/dev/project-030-runtime-agent-projection-phase-2-productization/sprint-003-smoke-gate-and-agent-view-presentation/tasks/`, checklist=`.repo-ai-governor/context/dev/project-030-runtime-agent-projection-phase-2-productization/sprint-003-smoke-gate-and-agent-view-presentation/tasks/checklist.md`, csv=`.repo-ai-governor/context/dev/project-030-runtime-agent-projection-phase-2-productization/sprint-003-smoke-gate-and-agent-view-presentation/tasks/tasks.csv`, review=`.repo-ai-governor/context/dev/project-030-runtime-agent-projection-phase-2-productization/sprint-003-smoke-gate-and-agent-view-presentation/review/`, status=`active`, note=`sprint-002 and sprint-003 completed; sprint-003 retained as active closeout surface until sprint-004 or project-031 activation`

## Planned Follow-Up Streams

- `project-030-runtime-agent-projection-phase-2-productization`: next planned sprint=`sprint-004-ui-consumer-and-rollout-closeout`, note=`sprint-002 and sprint-003 are complete; activate sprint-004 after project-031 or when the team wants to land the formal UI consumer baseline and rollout closeout`
- `project-031-session-shell-ink-input-productization`: next planned sprint=`sprint-001-activation-and-ink-input-baseline`, note=`activate after project-030 sprint-003 lands adopter smoke gate and agentView presenter semantics; once Ink-owned input cutover settles, return to project-030 sprint-004 for formal UI consumer closeout`

## Completed Stream History

- File: `.repo-ai-governor/context/completed-streams-history.md`
- Scope: completed streams only; use for historical tracebacks, migration, or audit lookup.
- Default Load: `false`

## Update Rules

1. 切换项目或 sprint 时，优先更新本文件而不是修改 `AGENTS.md`。
2. 如需并发执行多个任务流，请在 `Active Streams` 中追加新条目，并保持只有一个 `primary`。
3. 当某个 stream 进入 `completed` 时，将其从 `Active Streams` 移入 `.repo-ai-governor/context/completed-streams-history.md`。
4. 例外：若仓库尚未显式激活下一条主执行流，最近完成且仍承担 closeout / CR 尾项的 stream 可临时保留为 active closeout surface，但对应 project/sprint plan 与 tasks.csv 仍必须保持 `completed` 真值。
5. 已拆解但尚未启动的 follow-up sprint 可登记到 `Planned Follow-Up Streams`，避免与默认 active execution surface 混淆。
6. 开始执行前，先把任务、checklist、CSV 和 review 路径同步到对应 active stream 条目。
7. `Worktree Review Target` 只在“已完成 stream 仍持有未收口 CR”时使用；不需要 CR 的 completed stream 直接进入 history，不占用该槽位。
8. `Worktree Review Target` 只允许保留一个默认 target；若同一 worktree 同时存在多个 completed stream 的 CR 尾项，必须显式指定 report 路径，或先收完一个再切换另一个。
9. 当最后一个 pending/verified CR 收口为 `resolved` 后，必须在同一工作流中自动移除 `Worktree Review Target`，避免悬挂 override 持续污染默认上下文。
