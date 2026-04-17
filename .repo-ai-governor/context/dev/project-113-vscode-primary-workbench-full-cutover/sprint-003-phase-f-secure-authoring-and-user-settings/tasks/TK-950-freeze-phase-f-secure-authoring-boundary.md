# TK-950 freeze phase-f secure authoring boundary

- Status: in_progress
- Date: 2026-04-17
- Owner: AI-Agent
- Priority: P1
- Project: `project-113-vscode-primary-workbench-full-cutover`
- Sprint: `sprint-003-phase-f-secure-authoring-and-user-settings`

## 1. 任务目标

冻结 secure authoring、user settings、secret readiness 与 trust-sensitive interaction boundary。

## 2. Depends On

1. prepare sprint-002 exit acceptance and phase-f handoff

## 3. 预期产物

1. secure authoring contract artifact for TK-950
2. task card update for TK-950
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/dev/project-091-session-shell-secure-secret-input-promotion-and-decomposition/sprint-001-review-promotion-and-followup-decomposition/tasks/DA-804-session-shell-secure-secret-input-promotion-and-rollout-decomposition-handoff.md
2. .repo-ai-governor/context/dev/project-088-local-user-config-and-secret-command-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-786-local-user-config-promotion-and-rollout-decomposition-handoff.md
3. .repo-ai-governor/context/current-context.md
4. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-003-phase-f-secure-authoring-and-user-settings/plan.md

## 5. Traceback References

1. .repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/tasks/DA-934-vscode-workbench-promotion-and-rollout-decomposition-handoff.md
2. .repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md
3. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/plan.md
4. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. 待执行：按任务范围补充 fast/targeted verification。
2. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-003-phase-f-secure-authoring-and-user-settings/tasks" --task-id TK-950

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-003-phase-f-secure-authoring-and-user-settings/tasks" --task-id TK-950
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-003-phase-f-secure-authoring-and-user-settings/tasks" --task-id TK-950
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-17：任务创建，状态初始化为 `planned`。
2. 2026-04-17：随着 sprint-002 在 `CR-003` clean round 后完成 closeout，当前任务已切换为 `in_progress`，开始从 clean baseline 冻结 secure authoring、user settings、secret readiness 与 trust-sensitive interaction boundary。

## 10. 产出

1. 待执行后补齐
2. 待执行后补齐
