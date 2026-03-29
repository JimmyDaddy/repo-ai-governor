# Workspace Current Context

## Primary Stream

- Status: active
- Project: `project-027-cli-interactive-shell-implementation`
- Sprint: `sprint-003-react-cli-shell-default-cutover`
- Docs root: `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation`
- Task records: `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-003-react-cli-shell-default-cutover/tasks/`
- Review records: `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-003-react-cli-shell-default-cutover/review/`
- Note: `project-027 / sprint-003` 已于 2026-03-29 完成 `workflow create/edit/save`、DSL 编辑守护、`upgrade` 显式 React PoC 与 closeout，并已产出 `project-027-completion-audit-summary.md`；因下一条 primary stream 尚未激活，当前仍临时保留为 active closeout surface。

## Active Streams

- `primary`: project=`project-027-cli-interactive-shell-implementation`, sprint=`sprint-003-react-cli-shell-default-cutover`, docs=`.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation`, plan=`.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/plan.md`, tasks=`.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-003-react-cli-shell-default-cutover/tasks/`, checklist=`.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-003-react-cli-shell-default-cutover/tasks/checklist.md`, csv=`.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-003-react-cli-shell-default-cutover/tasks/tasks.csv`, review=`.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-003-react-cli-shell-default-cutover/review/`, status=`active`

## Planned Follow-Up Streams

- `planned`: project=`project-028-multi-ai-tools-onboarding-role-agent-projection`, sprint=`sprint-001-contract-baseline-and-boundary-lock`, docs=`.repo-ai-governor/context/dev/project-028-multi-ai-tools-onboarding-role-agent-projection`, plan=`.repo-ai-governor/context/dev/project-028-multi-ai-tools-onboarding-role-agent-projection/plan.md`, tasks=`.repo-ai-governor/context/dev/project-028-multi-ai-tools-onboarding-role-agent-projection/sprint-001-contract-baseline-and-boundary-lock/tasks/`, checklist=`.repo-ai-governor/context/dev/project-028-multi-ai-tools-onboarding-role-agent-projection/sprint-001-contract-baseline-and-boundary-lock/tasks/checklist.md`, csv=`.repo-ai-governor/context/dev/project-028-multi-ai-tools-onboarding-role-agent-projection/sprint-001-contract-baseline-and-boundary-lock/tasks/tasks.csv`, review=`.repo-ai-governor/context/dev/project-028-multi-ai-tools-onboarding-role-agent-projection/sprint-001-contract-baseline-and-boundary-lock/review/`, status=`planned`, note=`follow-up stream for the approved multi-tool onboarding and role-agent projection technical solution; decomposed into sprint-001 through sprint-004`
- `planned`: project=`project-029-cli-session-first-agent-shell`, sprint=`sprint-001-entrypoint-session-shell-foundation`, docs=`.repo-ai-governor/context/dev/project-029-cli-session-first-agent-shell`, plan=`.repo-ai-governor/context/dev/project-029-cli-session-first-agent-shell/plan.md`, tasks=`.repo-ai-governor/context/dev/project-029-cli-session-first-agent-shell/sprint-001-entrypoint-session-shell-foundation/tasks/`, checklist=`.repo-ai-governor/context/dev/project-029-cli-session-first-agent-shell/sprint-001-entrypoint-session-shell-foundation/tasks/checklist.md`, csv=`.repo-ai-governor/context/dev/project-029-cli-session-first-agent-shell/sprint-001-entrypoint-session-shell-foundation/tasks/tasks.csv`, review=`.repo-ai-governor/context/dev/project-029-cli-session-first-agent-shell/sprint-001-entrypoint-session-shell-foundation/review/`, status=`planned`, note=`follow-up stream for the accepted session-first CLI shell technical solution; task ids reserved in the fresh TK-401~TK-416 range to avoid collision with existing streams`

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
