# TK-972 implement service-native adopt-host-verify-upgrade orchestration seams

- Status: completed
- Date: 2026-04-18
- Owner: AI-Agent
- Priority: P1
- Project: `project-114-vscode-plugin-full-ownership-and-zero-cli-user-path`
- Sprint: `sprint-003-adopt-host-verify-upgrade-service-native-cutover`

## 1. 任务目标

Plan the service-native orchestration seams and receipts that replace temporary CLI-bridge user journeys.

## 2. Depends On

1. freeze adopt-host-verify-upgrade bridge-exit contract

## 3. 预期产物

1. service seam artifact for TK-972
2. task card update for TK-972
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-003-onboarding-adoption-readiness/tasks/DA-852-cli-exec-onboarding-and-adoption-readiness-promotion-cutover.md
2. .repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-004-acp-host-facing-transport-formalization/tasks/DA-855-acp-host-facing-transport-formalization-promotion-cutover.md
3. .repo-ai-governor/context/current-context.md
4. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-003-adopt-host-verify-upgrade-service-native-cutover/plan.md

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/plan.md
2. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. 待执行：按任务范围补充 fast/targeted verification。
2. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-003-adopt-host-verify-upgrade-service-native-cutover/tasks" --task-id TK-972

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-003-adopt-host-verify-upgrade-service-native-cutover/tasks" --task-id TK-972
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-003-adopt-host-verify-upgrade-service-native-cutover/tasks" --task-id TK-972
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-18：任务创建，状态初始化为 `planned`。
2. 2026-04-18：将 extension repository-operation 主路径切到 service-native orchestration seam：`stageTemporaryBridge` 现在优先消费 direct workspace-operation request，并在无预选 bridge 时通过 queue-overview catalog 提供原生 operation picker，覆盖 adopt / host / verify / upgrade preview / upgrade apply 的受治理执行入口。

## 10. 产出

1. `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
2. `apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
