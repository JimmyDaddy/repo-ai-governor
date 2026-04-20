# TK-1013 refresh vscode direct-onboarding docs and copy against runtime evidence

- Status: planned
- Date: 2026-04-20
- Owner: AI-Agent
- Priority: P1
- Project: `project-116-vscode-direct-provider-onboarding-rollout`
- Sprint: `sprint-004-docs-distribution-and-workbench-evidence`

## 1. 任务目标

Update plugin-facing docs and copy only after runtime evidence exists.

## 2. Depends On

1. verify provider lifecycle readiness parity and sprint handoff

## 3. 预期产物

1. docs package artifact for TK-1013
2. task card update for TK-1013
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/current-context.md
2. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/plan.md

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/plan.md
2. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. 待执行：按任务范围补充 fast/targeted verification。
2. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/tasks" --task-id TK-1013

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/tasks" --task-id TK-1013
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/tasks" --task-id TK-1013
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-20：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行后补齐
2. 待执行后补齐
