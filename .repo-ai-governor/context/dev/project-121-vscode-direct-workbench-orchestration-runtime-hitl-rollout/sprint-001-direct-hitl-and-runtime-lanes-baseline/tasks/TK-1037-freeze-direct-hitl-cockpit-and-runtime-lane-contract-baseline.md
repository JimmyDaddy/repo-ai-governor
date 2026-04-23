# TK-1037 freeze direct hitl cockpit and runtime-lane contract baseline

- Status: completed
- Date: 2026-04-22
- Owner: AI-Agent
- Priority: P1
- Project: `project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout`
- Sprint: `sprint-001-direct-hitl-and-runtime-lanes-baseline`

## 1. 任务目标

冻结 direct HITL cockpit 与 runtime-lane baseline 的 execution-facing contract、DTO/backlink 要求与 risk/SLA reuse 边界。

## 2. Depends On

1. `technical-solution.vscode-direct-workbench-orchestration-runtime-hitl`
2. `.repo-ai-governor/draft/approved_solution_review_vscode-direct-workbench-orchestration-runtime-hitl.md`

## 3. 预期产物

1. direct HITL / runtime lanes 的 implementation-ready scope
2. planned sprint scaffold 与 activation handoff artifact
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. `.repo-ai-governor/draft/approved_solution_review_vscode-direct-workbench-orchestration-runtime-hitl.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/direct-workbench-orchestration-runtime-hitl-contract.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/risk-facts-and-hitl-sla-contract.md`
4. `.repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/tasks/DA-934-vscode-workbench-promotion-and-rollout-decomposition-handoff.md`

## 5. Traceback References

1. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
2. `.repo-ai-governor/context/current-context.md`
3. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/plan.md`

## 6. 实施计划

1. 冻结 `queryRoleLaneStatus / querySessionContinuity / queryHitlDecisionPacket` 的最小 payload 与 backlink contract。
2. 定义 `Phase A` 的 implementation slice、evidence 需求与 fail-closed guard。
3. 产出 `DA-1037` 并为 `sprint-002` workflow draft-session baseline 做 activation handoff。

## 7. Development Verification

1. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks" --task-id TK-1037 --task-id TK-1038`

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks"`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-22：任务创建，状态初始化为 `planned`。
2. 2026-04-22：将 direct-workbench formal contract、ADR、module overview、manifest、lifecycle/delivery registry 与 `project-121` scaffold dirty baseline 吸收到 `sprint-001`，并把 `current-context.md` 激活到 `project-121 / sprint-001`。
3. 2026-04-22：确认 `DA-1037` 作为 `sprint-001 -> sprint-002` activation handoff 保持可回放，当前 sprint baseline 不提前提升 public/support truth。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks/DA-1037-vscode-direct-workbench-promotion-and-rollout-decomposition-handoff.md`
2. `.repo-ai-governor/context/current-context.md`
3. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/plan.md`
