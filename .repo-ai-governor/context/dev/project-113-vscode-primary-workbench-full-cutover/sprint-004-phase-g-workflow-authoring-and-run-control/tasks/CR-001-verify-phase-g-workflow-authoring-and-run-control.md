# CR-001 verify phase-g workflow authoring and run control

- Status: planned
- Date: 2026-04-17
- Owner: AI-Agent
- Priority: P1
- Project: `project-113-vscode-primary-workbench-full-cutover`
- Sprint: `sprint-004-phase-g-workflow-authoring-and-run-control`

## 1. 任务目标

验证 Phase G workflow authoring/run-control 的 service/runtime/docs delta，并收敛 accepted findings。

## 2. Depends On

1. prepare sprint-004 exit acceptance and phase-h handoff

## 3. 预期产物

1. review artifact for CR-001
2. task card update for CR-001
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md
2. apps/vscode-extension/README.md
3. .repo-ai-governor/context/current-context.md
4. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-004-phase-g-workflow-authoring-and-run-control/plan.md

## 5. Traceback References

1. .repo-ai-governor/context/dev/project-109-requirement-to-cr-delivery-solution-review-and-promotion-prep/sprint-001-solution-review-and-promotion-handoff/tasks/DA-915-requirement-to-cr-delivery-promotion-and-rollout-decomposition-handoff.md
2. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/plan.md
3. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. 待执行：按本轮 review boundary 补充定向验证命令。
2. node ./scripts/governance/check-code-review-status-sync.js

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-004-phase-g-workflow-authoring-and-run-control/tasks" --task-id CR-001
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-004-phase-g-workflow-authoring-and-run-control/tasks" --task-id CR-001
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js
5. node ./scripts/governance/check-code-review-status-sync.js

## 9. 执行记录

1. 2026-04-17：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行后补齐
2. 待执行后补齐
