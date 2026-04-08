# project-068-p2-fallback-and-reserved-target-followups 计划

- Status: completed
- Date: 2026-04-08
- Stage Mapping: constrained surfaces follow-up
- Phase Mapping: local-model capability ceiling + reserved host target follow-up
- Upstream:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/current-surface-baseline-classification-and-followup-decomposition.md`
  - `.repo-ai-governor/context/dev/project-072-current-surface-priority-promotion-and-decomposition/sprint-001-promotion-and-formal-followup-decomposition/tasks/DA-696-current-surface-priority-promotion-and-followup-decomposition-handoff.md`

## 1. 目标

1. 明确 `local-model` 的能力上限与 promoted use case，而不是模糊地等待“以后再看”。
2. 为 `github-com-agent` 这种 reserved target 准备后续 contract，但不抢占当前主线资源。

## 2. Sprint 细化

## 2.1 sprint-001-local-model-capability-ceiling-and-promoted-use-case

- Status: completed
- Sprint Goal: 冻结 `local-model` 能力天花板与 promoted use case。
- Task Package: `TK-682`、`TK-683`、`TK-710`。

## 2.2 sprint-002-github-com-agent-target-followup

- Status: completed
- Sprint Goal: 为 `github-com-agent` target 建立 follow-up contract 与 exit criteria。
- Task Package: `TK-684`、`TK-685`、`TK-686`、`TK-712`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-682 | sprint-001 | freeze local-model capability ceiling and promoted use-case contract | product/contract | project-066 recommended | completed |
| TK-683 | sprint-001 | implement constrained local-model capability follow-up or explicit non-goal guardrails | implementation/boundary | TK-682 | completed |
| TK-710 | sprint-001 | sprint-001 closeout and sprint-002 activation handoff | closeout/handoff | TK-682、TK-683、CR-001 | completed |
| TK-684 | sprint-002 | freeze github-com-agent target contract and blocked-mode exit criteria | host/contract | TK-710 | completed |
| TK-685 | sprint-002 | implement github-com-agent export verify follow-up or reserved-boundary reinforcement | host/follow-up | TK-684 | completed |
| TK-686 | sprint-002 | close P2 follow-up recommendation and backlog handoff | closeout/backlog | TK-684、TK-685 | completed |
| TK-712 | sprint-002 | sprint-002 closeout and project-final review activation handoff | closeout/handoff | TK-684、TK-685、TK-686、CR-001 | completed |
| TK-713 | sprint-002 | finalize project-068 closeout and clear the active primary stream | closeout/audit | CR-002 | completed |

## 4. 依赖产物策略

1. 先冻结 `local-model` 能力天花板，再进入 reserved target 合同化工作。
2. `github-com-agent` follow-up 只承接 blocked-mode exit criteria 与 reserve-boundary reinforcement，不提前承诺主线实现。

## 5. DoD（project-068）

1. `local-model` 不再长期停留在“知道是 fallback-only，但没有进一步产品判断”的状态。
2. reserved target 有清晰 follow-up contract，而不是只存在 blocked export 资产。

## 6. 里程碑记录

1. 2026-04-08：作为 `project-072` follow-up decomposition 产物创建，当前保持 `planned`。
2. 2026-04-08：`project-066` final closeout 完成后被激活为当前 primary project，`sprint-001 / TK-682` 进入执行窗口；当前 project 保持 `P2 deferred` contract，不扩张为新的 secondary-surface 产品化实现。
3. 2026-04-08：`TK-682` 与 `TK-683` 已用 docs/support-truth guardrail 收口 `local-model` capability ceiling、promoted use case 与 explicit non-goal；当前 sprint 下一边界进入 fresh reviewer CR loop。
4. 2026-04-08：`CR-001` 已完成 2 个 accepted findings 的最小修复并 clean `resolved`；`TK-710 / DA-710` 已完成 `sprint-001` closeout，并把下一条 primary boundary 固定为 `sprint-002 / TK-684`。
5. 2026-04-08：`TK-684`、`TK-685` 与 `TK-686` 已完成 `github-com-agent` reserved-target contract freeze、fail-closed evidence refresh 与 `DA-711` backlog handoff；当前 sprint 实现面已清零，下一边界进入 `sprint-002` fresh reviewer CR loop。
6. 2026-04-08：`CR-001` 已 clean `resolved`，`TK-712 / DA-712` 已完成 `sprint-002` closeout，并把下一边界切换为 `project-068` project-final CR loop。
7. 2026-04-08：`CR-002` 已作为 `project-068` 的 project-final delegated review round 创建并进入 `review_pending`；当前 project 继续保持 `P2 deferred` closeout-only boundary，待该轮 clean 后再进入最终 closeout。
8. 2026-04-08：`CR-002` 已完成 accepted finding 修复并 clean `resolved`；`TK-713 / DA-713` 已完成 final closeout write-back，`project-068` 正式进入 `completed`，并在此里程碑回链 [project-068 completion audit summary](./project-068-p2-fallback-and-reserved-target-followups-completion-audit-summary.md)。
