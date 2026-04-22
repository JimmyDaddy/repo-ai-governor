# TK-1040 close sprint-002 and hand off richer graph-editing readiness

- Status: planned
- Date: 2026-04-22
- Owner: AI-Agent
- Priority: P1
- Project: `project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout`
- Sprint: `sprint-002-workflow-authoring-draft-session-baseline`

## 1. 任务目标

在 workflow draft-session baseline 收口后完成 sprint-002 handoff，并把 richer graph-editing / support-truth readiness 约束切换到 sprint-003。

## 2. Depends On

1. `TK-1039`

## 3. 预期产物

1. sprint-002 closeout/handoff note
2. sprint-003 activation recommendation
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline/tasks/TK-1039-land-workflow-draft-session-and-schema-first-authoring-baseline.md`
2. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-003-richer-graph-editing-and-support-truth-readiness/plan.md`
3. `.repo-ai-governor/context/current-context.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/plan.md`

## 6. 实施计划

1. 收口 sprint-002 planned ledger 与 workflow authoring baseline 的对应关系。
2. 明确 sprint-003 的 evidence/readiness 范围与 fail-closed 条件。
3. 保留 public support wording 仍需 evidence-gated 的 handoff 说明。

## 7. Development Verification

1. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline/tasks"`

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline/tasks"`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-22：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：sprint-002 closeout and sprint-003 activation note
