# Workspace Current Context

## Primary Stream

- Status: active
- Stream: `stream-project-104-sprint-002`
- Project: `project-104-cli-exec-onboarding-adoption-readiness-rollout`
- Sprint: `sprint-002-playbook-readback-and-support-evidence-prep`
- Docs: `.repo-ai-governor/context/dev/project-104-cli-exec-onboarding-adoption-readiness-rollout`
- Plan: `.repo-ai-governor/context/dev/project-104-cli-exec-onboarding-adoption-readiness-rollout/sprint-002-playbook-readback-and-support-evidence-prep/plan.md`
- Tasks: `.repo-ai-governor/context/dev/project-104-cli-exec-onboarding-adoption-readiness-rollout/sprint-002-playbook-readback-and-support-evidence-prep/tasks/`
- Checklist: `.repo-ai-governor/context/dev/project-104-cli-exec-onboarding-adoption-readiness-rollout/sprint-002-playbook-readback-and-support-evidence-prep/tasks/checklist.md`
- CSV: `.repo-ai-governor/context/dev/project-104-cli-exec-onboarding-adoption-readiness-rollout/sprint-002-playbook-readback-and-support-evidence-prep/tasks/tasks.csv`
- Review: `.repo-ai-governor/context/dev/project-104-cli-exec-onboarding-adoption-readiness-rollout/sprint-002-playbook-readback-and-support-evidence-prep/review/`
- Note: `2026-04-14` `project-104 / sprint-001` 已在 `CR-001` finding round 与 `CR-002` clean recheck 后完成 closeout；当前 `sprint-002` 的 `CR-001` accepted findings 已修复、`CR-002` latest fresh recheck clean，下一步在同一 sprint surface 上完成 sprint boundary closeout、local commit 与 project-final review。

## Active Streams

- `stream-project-104-sprint-002`: role=`primary`, primary=`true`, project=`project-104-cli-exec-onboarding-adoption-readiness-rollout`, sprint=`sprint-002-playbook-readback-and-support-evidence-prep`, docs=`.repo-ai-governor/context/dev/project-104-cli-exec-onboarding-adoption-readiness-rollout`, plan=`.repo-ai-governor/context/dev/project-104-cli-exec-onboarding-adoption-readiness-rollout/sprint-002-playbook-readback-and-support-evidence-prep/plan.md`, tasks=`.repo-ai-governor/context/dev/project-104-cli-exec-onboarding-adoption-readiness-rollout/sprint-002-playbook-readback-and-support-evidence-prep/tasks/`, checklist=`.repo-ai-governor/context/dev/project-104-cli-exec-onboarding-adoption-readiness-rollout/sprint-002-playbook-readback-and-support-evidence-prep/tasks/checklist.md`, csv=`.repo-ai-governor/context/dev/project-104-cli-exec-onboarding-adoption-readiness-rollout/sprint-002-playbook-readback-and-support-evidence-prep/tasks/tasks.csv`, review=`.repo-ai-governor/context/dev/project-104-cli-exec-onboarding-adoption-readiness-rollout/sprint-002-playbook-readback-and-support-evidence-prep/review/`, status=`active`, note=`2026-04-14 sprint-002 的 \`CR-001\` accepted findings 已修复，\`CR-002\` latest fresh recheck clean；当前在同一 sprint surface 上进入 boundary closeout、local commit 与 project-final review。`

## Planned Follow-Up Streams

- `stream-project-105-sprint-001`: primary=`false`, project=`project-105-acp-host-facing-transport-rollout`, sprint=`sprint-001-acp-host-facing-transport-rollout`, docs=`.repo-ai-governor/context/dev/project-105-acp-host-facing-transport-rollout`, plan=`.repo-ai-governor/context/dev/project-105-acp-host-facing-transport-rollout/sprint-001-acp-host-facing-transport-rollout/plan.md`, tasks=`.repo-ai-governor/context/dev/project-105-acp-host-facing-transport-rollout/sprint-001-acp-host-facing-transport-rollout/tasks/`, checklist=`.repo-ai-governor/context/dev/project-105-acp-host-facing-transport-rollout/sprint-001-acp-host-facing-transport-rollout/tasks/checklist.md`, csv=`.repo-ai-governor/context/dev/project-105-acp-host-facing-transport-rollout/sprint-001-acp-host-facing-transport-rollout/tasks/tasks.csv`, review=`.repo-ai-governor/context/dev/project-105-acp-host-facing-transport-rollout/sprint-001-acp-host-facing-transport-rollout/review/`, status=`planned`, note=`2026-04-14 在保留 2026-04-13 TK-855 promotion handoff 来源的基础上扩展为多 sprint execution-ready scaffold；作为 technical-solution.acp-host-facing-transport-formalization 的 followup_required rollout stream，默认作为第 5 条执行流保留到前置 cli_exec 主链收口后再激活。`

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
