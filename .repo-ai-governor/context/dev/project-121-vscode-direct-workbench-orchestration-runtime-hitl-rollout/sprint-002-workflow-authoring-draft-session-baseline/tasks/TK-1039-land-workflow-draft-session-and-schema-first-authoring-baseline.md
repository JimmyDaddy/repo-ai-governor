# TK-1039 land workflow draft session and schema-first authoring baseline

- Status: planned
- Date: 2026-04-22
- Owner: AI-Agent
- Priority: P1
- Project: `project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout`
- Sprint: `sprint-002-workflow-authoring-draft-session-baseline`

## 1. 任务目标

在 `TK-1046 / TK-1047 / TK-1048` 落地后，将 workflow draft session、revision token、conflict-safe patch mutation 与 schema-first authoring baseline 收口为真实 implementation package。

## 2. Depends On

1. `TK-1046`
2. `TK-1047`
3. `TK-1048`

## 3. 预期产物

1. workflow draft-session baseline implementation slice
2. schema-first authoring 和 graph projection scope
3. sprint-002 baseline acceptance summary and aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline/tasks/TK-1046-extend-workflow-draft-session-contract-and-client-seams.md`
2. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline/tasks/TK-1047-implement-draft-session-mutation-runtime-and-replace-cli-workflow-bridge.md`
3. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline/tasks/TK-1048-wire-vscode-workflow-studio-authoring-model-and-command-surfaces.md`
4. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline/plan.md`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/direct-workbench-orchestration-runtime-hitl-contract.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/plan.md`
2. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
3. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks/DA-1037-vscode-direct-workbench-promotion-and-rollout-decomposition-handoff.md`

## 6. 实施计划

1. 复核 `TK-1046 / TK-1047 / TK-1048` 的交付是否完整 materialize 了 revision / patch / conflict contract。
2. 冻结 `Workflow Studio Authoring` 的 schema-first activation slice、non-goals 与 evidence boundary。
3. 为 richer graph-editing readiness 准备下一 sprint handoff。

## 7. Development Verification

1. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline/tasks"`

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline/tasks"`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-22：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：workflow draft-session implementation summary
