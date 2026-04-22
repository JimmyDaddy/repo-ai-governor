# TK-1041 verify direct-workbench evidence boundary and support-truth readiness

- Status: planned
- Date: 2026-04-22
- Owner: AI-Agent
- Priority: P1
- Project: `project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout`
- Sprint: `sprint-003-richer-graph-editing-and-support-truth-readiness`

## 1. 任务目标

基于 `TK-1049 / TK-1050` 的代码与 evidence 产物，验证 direct graph editing、runtime lanes 与 HITL decision cockpit 的 evidence boundary，并评估是否具备增强 support-truth claim 的前提。

## 2. Depends On

1. `TK-1049`
2. `TK-1050`

## 3. 预期产物

1. evidence/readiness assessment
2. support-truth disposition recommendation
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-003-richer-graph-editing-and-support-truth-readiness/tasks/TK-1049-implement-richer-graph-editing-and-projection-backed-workflow-studio.md`
2. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-003-richer-graph-editing-and-support-truth-readiness/tasks/TK-1050-land-direct-workbench-evidence-suite-and-support-truth-readiness-package.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/governance-workbench-aggregation-facade-contract.md`

## 5. Traceback References

1. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
2. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/plan.md`
3. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks/DA-1037-vscode-direct-workbench-promotion-and-rollout-decomposition-handoff.md`

## 6. 实施计划

1. 校验 richer graph-editing、runtime lanes 与 HITL cockpit 的代码与 evidence 产物是否满足现有 support-truth 边界。
2. 形成 `strengthen claim` 或 `stay fail-closed` 的正式结论。
3. 为 `TK-1042` closeout 提供 delivery evidence package。

## 7. Development Verification

1. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-003-richer-graph-editing-and-support-truth-readiness/tasks"`

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-003-richer-graph-editing-and-support-truth-readiness/tasks"`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-22：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：direct-workbench evidence boundary and support-truth readiness summary
