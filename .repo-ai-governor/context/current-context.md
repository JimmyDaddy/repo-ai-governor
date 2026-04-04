# Workspace Current Context

## Primary Stream

- Status: active
- Project: `project-042-cli-command-thin-baseline-enhancement-rollout`
- Sprint: `sprint-003-review-lifecycle-and-ledger-backfill`
- Docs root: `.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout`
- Task records: `.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/sprint-003-review-lifecycle-and-ledger-backfill/tasks/`
- Review records: `.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/sprint-003-review-lifecycle-and-ledger-backfill/review/`
- Note: `project-042` 已于 2026-04-04 完成 `upgrade / plan / review / review-verify` 三段式产品化闭环；在下一条 primary stream 显式激活前，当前 worktree 继续保留 `sprint-003` 作为 active closeout surface，便于审计、回放与交付追踪。

## Active Streams

- `primary`: project=`project-042-cli-command-thin-baseline-enhancement-rollout`, sprint=`sprint-003-review-lifecycle-and-ledger-backfill`, docs=`.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout`, plan=`.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/plan.md`, tasks=`.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/sprint-003-review-lifecycle-and-ledger-backfill/tasks/`, checklist=`.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/sprint-003-review-lifecycle-and-ledger-backfill/tasks/checklist.md`, csv=`.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/sprint-003-review-lifecycle-and-ledger-backfill/tasks/tasks.csv`, review=`.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/sprint-003-review-lifecycle-and-ledger-backfill/review/`, status=`active`, note=`Project-042 completed on 2026-04-04; sprint-003 is retained as the active closeout surface until the next primary stream is explicitly activated`

## Planned Follow-Up Streams

- `desktop-console-mvp-rollout`: project=`project-044-desktop-governance-console-mvp-foundation`, sprint=`sprint-001-shell-bootstrap-and-session-bridge-foundation`, docs=`.repo-ai-governor/context/dev/project-044-desktop-governance-console-mvp-foundation`, plan=`.repo-ai-governor/context/dev/project-044-desktop-governance-console-mvp-foundation/sprint-001-shell-bootstrap-and-session-bridge-foundation/plan.md`, tasks=`.repo-ai-governor/context/dev/project-044-desktop-governance-console-mvp-foundation/sprint-001-shell-bootstrap-and-session-bridge-foundation/tasks/`, checklist=`.repo-ai-governor/context/dev/project-044-desktop-governance-console-mvp-foundation/sprint-001-shell-bootstrap-and-session-bridge-foundation/tasks/checklist.md`, csv=`.repo-ai-governor/context/dev/project-044-desktop-governance-console-mvp-foundation/sprint-001-shell-bootstrap-and-session-bridge-foundation/tasks/tasks.csv`, review=`.repo-ai-governor/context/dev/project-044-desktop-governance-console-mvp-foundation/sprint-001-shell-bootstrap-and-session-bridge-foundation/review/`, status=`planned`, note=`Created on 2026-04-04 from project-041 desktop implementation handoff; scope is limited to Phase 0 + Phase 1 governance console MVP, with review/artifact pane still gated on service-owned query contracts`
- `cli-session-shell-rollout`: project=`project-043-cli-session-shell-productization-rollout`, sprint=`sprint-001-session-lifecycle-and-read-model-foundation`, docs=`.repo-ai-governor/context/dev/project-043-cli-session-shell-productization-rollout`, plan=`.repo-ai-governor/context/dev/project-043-cli-session-shell-productization-rollout/sprint-001-session-lifecycle-and-read-model-foundation/plan.md`, tasks=`.repo-ai-governor/context/dev/project-043-cli-session-shell-productization-rollout/sprint-001-session-lifecycle-and-read-model-foundation/tasks/`, checklist=`.repo-ai-governor/context/dev/project-043-cli-session-shell-productization-rollout/sprint-001-session-lifecycle-and-read-model-foundation/tasks/checklist.md`, csv=`.repo-ai-governor/context/dev/project-043-cli-session-shell-productization-rollout/sprint-001-session-lifecycle-and-read-model-foundation/tasks/tasks.csv`, review=`.repo-ai-governor/context/dev/project-043-cli-session-shell-productization-rollout/sprint-001-session-lifecycle-and-read-model-foundation/review/`, status=`planned`, note=`Created on 2026-04-04 from cli-borrowed-capabilities productization draft decomposition; keeps project-038 as temporary closeout surface until explicit activation`

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
