# sprint-003-phase-c-workflow-studio-and-full-workbench-cutover 计划

- Status: completed
- Date: 2026-04-16
- Sprint Goal: 规划 workflow studio、support-truth evidence 与 full workbench cutover
- Project: `project-112-vscode-governance-workbench-rollout`
- Upstream:
  - `.repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/tasks/DA-934-vscode-workbench-promotion-and-rollout-decomposition-handoff.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`

## 1. Scope

1. 完成 Phase C 的 workflow studio、desktop decision surface 与 support-truth cutover evidence plan。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-940 | plan workflow studio cutover and primary workbench support-truth evidence | DA-934 | completed |
| TK-941 | finalize project-112 rollout closeout and delivery evidence handoff | plan workflow studio cutover and primary workbench support-truth evidence | completed |

## 3. Exit Criteria

1. workflow studio/full-workbench cutover path、desktop decision surface 与 support-truth evidence 已收口。

## 4. Sprint Notes

1. 只有 evidence 与 support-truth 一起收口后，才允许 public claim 切到 primary workbench。
2. `2026-04-17` sprint-002 已在 `CR-012` clean round 与 `DA-939` handoff 后完成 closeout；当前 sprint 被激活为新的 primary execution surface，`TK-940` 切换为 `in_progress`。
3. `2026-04-17` `TK-940` 已完成 workflow studio、desktop decision surface 与 support-truth gate evidence 的 implementation boundary，并通过 targeted vitest bundle + `pnpm run build`；当前 sprint 进入 fresh reviewer CR loop，clean 后再激活 `TK-941`。
4. `2026-04-17` latest fresh reviewer round `CR-002` 已 clean `resolved`；当前 sprint 已达到 sprint-level exit acceptance 条件，但因 project-112 仍需额外执行一次 `project-final` fresh reviewer loop，`TK-941` 现负责保留 sprint-003 为 active review surface 并写入 handoff truth。
5. `2026-04-17` `DA-941`、closeout ledger sync 与 `pnpm run check` 已通过；当前 sprint-003 已满足本地 boundary commit 条件，但在 project-final clean round 完成前仍保持 `active`。
6. `2026-04-17` project-final `CR-003` 已在 README public-surface truth 修复后 `resolved`；当前 sprint 已完成 final closeout write-back，并与 project plan、current-context、completed history 一起恢复到最终 `completed` 真值。
