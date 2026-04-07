# project-068-p2-fallback-and-reserved-target-followups 计划

- Status: planned
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

- Status: planned
- Sprint Goal: 冻结 `local-model` 能力天花板与 promoted use case。
- Task Package: `TK-682`、`TK-683`。

## 2.2 sprint-002-github-com-agent-target-followup

- Status: planned
- Sprint Goal: 为 `github-com-agent` target 建立 follow-up contract 与 exit criteria。
- Task Package: `TK-684`、`TK-685`、`TK-686`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-682 | sprint-001 | freeze local-model capability ceiling and promoted use-case contract | product/contract | project-066 recommended | planned |
| TK-683 | sprint-001 | implement constrained local-model capability follow-up or explicit non-goal guardrails | implementation/boundary | TK-682 | planned |
| TK-684 | sprint-002 | freeze github-com-agent target contract and blocked-mode exit criteria | host/contract | TK-683 | planned |
| TK-685 | sprint-002 | implement github-com-agent export verify follow-up or reserved-boundary reinforcement | host/follow-up | TK-684 | planned |
| TK-686 | sprint-002 | close P2 follow-up recommendation and backlog handoff | closeout/backlog | TK-684、TK-685 | planned |

## 4. 依赖产物策略

1. 先冻结 `local-model` 能力天花板，再进入 reserved target 合同化工作。
2. `github-com-agent` follow-up 只承接 blocked-mode exit criteria 与 reserve-boundary reinforcement，不提前承诺主线实现。

## 5. DoD（project-068）

1. `local-model` 不再长期停留在“知道是 fallback-only，但没有进一步产品判断”的状态。
2. reserved target 有清晰 follow-up contract，而不是只存在 blocked export 资产。
