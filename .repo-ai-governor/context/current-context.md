# Workspace Current Context

## Primary Stream

- Status: active
- Project: `project-036-runtime-durable-storage-and-registry-cutover`
- Sprint: `sprint-001-session-durable-storage-foundation`
- Docs root: `.repo-ai-governor/context/dev/project-036-runtime-durable-storage-and-registry-cutover`
- Task records: `.repo-ai-governor/context/dev/project-036-runtime-durable-storage-and-registry-cutover/sprint-001-session-durable-storage-foundation/tasks/`
- Review records: `.repo-ai-governor/context/dev/project-036-runtime-durable-storage-and-registry-cutover/sprint-001-session-durable-storage-foundation/review/`
- Note: `project-036` 已从 approved `runtime.durable-storage` formal solution 显式激活，当前 primary stream 承接 sqlite-fs session truth、artifact registry sqlite truth 与 tasks.csv sqlite projection/read-model implementation roadmap。

## Active Streams

- `primary`: project=`project-036-runtime-durable-storage-and-registry-cutover`, sprint=`sprint-001-session-durable-storage-foundation`, docs=`.repo-ai-governor/context/dev/project-036-runtime-durable-storage-and-registry-cutover`, plan=`.repo-ai-governor/context/dev/project-036-runtime-durable-storage-and-registry-cutover/sprint-001-session-durable-storage-foundation/plan.md`, tasks=`.repo-ai-governor/context/dev/project-036-runtime-durable-storage-and-registry-cutover/sprint-001-session-durable-storage-foundation/tasks/`, checklist=`.repo-ai-governor/context/dev/project-036-runtime-durable-storage-and-registry-cutover/sprint-001-session-durable-storage-foundation/tasks/checklist.md`, csv=`.repo-ai-governor/context/dev/project-036-runtime-durable-storage-and-registry-cutover/sprint-001-session-durable-storage-foundation/tasks/tasks.csv`, review=`.repo-ai-governor/context/dev/project-036-runtime-durable-storage-and-registry-cutover/sprint-001-session-durable-storage-foundation/review/`, status=`active`, note=`First implementation sprint after runtime.durable-storage formal promotion; owns sqlite-fs session durable truth baseline and append-only session event-log cutover`

## Planned Follow-Up Streams

- `planned-1`: project=`project-036-runtime-durable-storage-and-registry-cutover`, sprint=`sprint-002-artifact-registry-sqlite-truth-and-rendered-views`, docs=`.repo-ai-governor/context/dev/project-036-runtime-durable-storage-and-registry-cutover`, plan=`.repo-ai-governor/context/dev/project-036-runtime-durable-storage-and-registry-cutover/sprint-002-artifact-registry-sqlite-truth-and-rendered-views/plan.md`, tasks=`.repo-ai-governor/context/dev/project-036-runtime-durable-storage-and-registry-cutover/sprint-002-artifact-registry-sqlite-truth-and-rendered-views/tasks/`, checklist=`.repo-ai-governor/context/dev/project-036-runtime-durable-storage-and-registry-cutover/sprint-002-artifact-registry-sqlite-truth-and-rendered-views/tasks/checklist.md`, csv=`.repo-ai-governor/context/dev/project-036-runtime-durable-storage-and-registry-cutover/sprint-002-artifact-registry-sqlite-truth-and-rendered-views/tasks/tasks.csv`, review=`.repo-ai-governor/context/dev/project-036-runtime-durable-storage-and-registry-cutover/sprint-002-artifact-registry-sqlite-truth-and-rendered-views/review/`, status=`planned`, note=`Carries sqlite-backed artifact registry canonical truth and rendered CSV compatibility cutover`
- `planned-2`: project=`project-036-runtime-durable-storage-and-registry-cutover`, sprint=`sprint-003-task-ledger-sqlite-projection-and-audit-read-model`, docs=`.repo-ai-governor/context/dev/project-036-runtime-durable-storage-and-registry-cutover`, plan=`.repo-ai-governor/context/dev/project-036-runtime-durable-storage-and-registry-cutover/sprint-003-task-ledger-sqlite-projection-and-audit-read-model/plan.md`, tasks=`.repo-ai-governor/context/dev/project-036-runtime-durable-storage-and-registry-cutover/sprint-003-task-ledger-sqlite-projection-and-audit-read-model/tasks/`, checklist=`.repo-ai-governor/context/dev/project-036-runtime-durable-storage-and-registry-cutover/sprint-003-task-ledger-sqlite-projection-and-audit-read-model/tasks/checklist.md`, csv=`.repo-ai-governor/context/dev/project-036-runtime-durable-storage-and-registry-cutover/sprint-003-task-ledger-sqlite-projection-and-audit-read-model/tasks/tasks.csv`, review=`.repo-ai-governor/context/dev/project-036-runtime-durable-storage-and-registry-cutover/sprint-003-task-ledger-sqlite-projection-and-audit-read-model/review/`, status=`planned`, note=`Builds tasks.csv sqlite projection/read-model while keeping tasks.csv as human-readable canonical source`
- `planned-3`: project=`project-036-runtime-durable-storage-and-registry-cutover`, sprint=`sprint-004-migration-verification-and-cutover-governance`, docs=`.repo-ai-governor/context/dev/project-036-runtime-durable-storage-and-registry-cutover`, plan=`.repo-ai-governor/context/dev/project-036-runtime-durable-storage-and-registry-cutover/sprint-004-migration-verification-and-cutover-governance/plan.md`, tasks=`.repo-ai-governor/context/dev/project-036-runtime-durable-storage-and-registry-cutover/sprint-004-migration-verification-and-cutover-governance/tasks/`, checklist=`.repo-ai-governor/context/dev/project-036-runtime-durable-storage-and-registry-cutover/sprint-004-migration-verification-and-cutover-governance/tasks/checklist.md`, csv=`.repo-ai-governor/context/dev/project-036-runtime-durable-storage-and-registry-cutover/sprint-004-migration-verification-and-cutover-governance/tasks/tasks.csv`, review=`.repo-ai-governor/context/dev/project-036-runtime-durable-storage-and-registry-cutover/sprint-004-migration-verification-and-cutover-governance/review/`, status=`planned`, note=`Owns migration, doctor/verify, rebuild/render and durable-storage cutover governance closeout`

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
