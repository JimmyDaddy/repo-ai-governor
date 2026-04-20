# TK-975 freeze plugin-primary workflow and automation contract

- Status: completed
- Date: 2026-04-18
- Owner: AI-Agent
- Priority: P1
- Project: `project-114-vscode-plugin-full-ownership-and-zero-cli-user-path`
- Sprint: `sprint-004-workflow-authoring-run-review-and-automation-primaryization`

## 1. 任务目标

Freeze the plugin-primary contract for workflow authoring, run-control, review, and automation user journeys.

## 2. Depends On

1. prepare sprint-003 exit acceptance and sprint-004 handoff

## 3. 预期产物

1. workflow contract artifact for TK-975
2. task card update for TK-975
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/plan.md
2. .repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md
3. .repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-001-launch-authoring-contract-tests/tasks/DA-846-cli-exec-launch-authoring-contract-tests-promotion-cutover.md
4. .repo-ai-governor/context/current-context.md
5. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-004-workflow-authoring-run-review-and-automation-primaryization/plan.md

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/plan.md
2. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. 待执行：按任务范围补充 fast/targeted verification。
2. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-004-workflow-authoring-run-review-and-automation-primaryization/tasks" --task-id TK-975

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-004-workflow-authoring-run-review-and-automation-primaryization/tasks" --task-id TK-975
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-004-workflow-authoring-run-review-and-automation-primaryization/tasks" --task-id TK-975
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-18：任务创建，状态初始化为 `planned`。
2. 2026-04-18：随着 sprint-004 activation 完成，TK-975 状态切换为 `active`，并作为当前首个 implementation lane 开始冻结 workflow / run-control / review / automation 的 plugin-primary contract。
3. 2026-04-18：冻结 sprint-004 plugin-primary contract：automation queue 默认进入 Workflow Studio、review-only workflow-studio action 改为插件内 review detail、terminal handoff 降为 compatibility-only、temporary bridge 仅保留为 exit-evidence 而不再作为主 run-control。

## 10. 产出

1. `apps/vscode-extension/src/constants/vscode-extension.constant.ts`
2. `apps/vscode-extension/src/runtime/vscode-extension-contract.ts`
3. `apps/vscode-extension/package.json`
