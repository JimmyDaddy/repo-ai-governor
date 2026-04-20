# TK-976 implement workflow authoring run-control review and automation seams

- Status: completed
- Date: 2026-04-18
- Owner: AI-Agent
- Priority: P1
- Project: `project-114-vscode-plugin-full-ownership-and-zero-cli-user-path`
- Sprint: `sprint-004-workflow-authoring-run-review-and-automation-primaryization`

## 1. 任务目标

Plan the service-backed seams that let workflow authoring, run-control, review, and automation stay plugin-primary without shadow state.

## 2. Depends On

1. freeze plugin-primary workflow and automation contract

## 3. 预期产物

1. service seam artifact for TK-976
2. task card update for TK-976
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/plan.md
2. .repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-001-launch-authoring-contract-tests/tasks/DA-846-cli-exec-launch-authoring-contract-tests-promotion-cutover.md
3. .repo-ai-governor/context/current-context.md
4. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-004-workflow-authoring-run-review-and-automation-primaryization/plan.md

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/plan.md
2. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. 待执行：按任务范围补充 fast/targeted verification。
2. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-004-workflow-authoring-run-review-and-automation-primaryization/tasks" --task-id TK-976

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-004-workflow-authoring-run-review-and-automation-primaryization/tasks" --task-id TK-976
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-004-workflow-authoring-run-review-and-automation-primaryization/tasks" --task-id TK-976
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-18：任务创建，状态初始化为 `planned`。
2. 2026-04-18：补齐 workflow / automation seam：新增 `repoAiGovernor.openWorkflowStudio` command，controller 会先揭示 Governor workbench container 再刷新/显示 Workflow Studio；handoff target 选择不再自动回落到 terminal，explicit terminal target 也只保留 compatibility-only 提示。

## 10. 产出

1. `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
2. `apps/vscode-extension/src/runtime/vscode-extension-host.ts`
3. `apps/vscode-extension/src/runtime/vscode-extension-workflow-studio-provider.ts`
