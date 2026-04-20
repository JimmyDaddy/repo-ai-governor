# TK-971 freeze adopt-host-verify-upgrade bridge-exit contract

- Status: completed
- Date: 2026-04-18
- Owner: AI-Agent
- Priority: P1
- Project: `project-114-vscode-plugin-full-ownership-and-zero-cli-user-path`
- Sprint: `sprint-003-adopt-host-verify-upgrade-service-native-cutover`

## 1. 任务目标

Freeze the bridge-exit contract for adopt, host, verify, and upgrade so user-visible CLI ownership can be removed safely.

## 2. Depends On

1. prepare sprint-002 exit acceptance and sprint-003 handoff

## 3. 预期产物

1. bridge-exit contract artifact for TK-971
2. task card update for TK-971
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-003-onboarding-adoption-readiness/tasks/DA-852-cli-exec-onboarding-and-adoption-readiness-promotion-cutover.md
2. .repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-004-acp-host-facing-transport-formalization/tasks/DA-855-acp-host-facing-transport-formalization-promotion-cutover.md
3. .repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md
4. .repo-ai-governor/context/current-context.md
5. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-003-adopt-host-verify-upgrade-service-native-cutover/plan.md

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/plan.md
2. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. 待执行：按任务范围补充 fast/targeted verification。
2. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-003-adopt-host-verify-upgrade-service-native-cutover/tasks" --task-id TK-971

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-003-adopt-host-verify-upgrade-service-native-cutover/tasks" --task-id TK-971
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-003-adopt-host-verify-upgrade-service-native-cutover/tasks" --task-id TK-971
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-18：任务创建，状态初始化为 `planned`。
2. 2026-04-18：随着 sprint-003 activation 完成，TK-971 状态切换为 `active`，并作为当前首个 implementation lane 开始冻结 adopt / host / verify / upgrade 的 bridge-exit contract。
3. 2026-04-18：冻结 sprint-003 bridge-exit contract：VS Code 主用户路径改为直接携带 `workspaceOperationKind / workspaceOperationArguments` 的 service-native request；`temporaryBridge` 只保留为兼容性证据、receipt/backlink provenance 与 exit-criteria trace，不再承担主执行语义。

## 10. 产出

1. `apps/vscode-extension/src/types/interfaces/vscode-extension-surface.interface.ts`
2. `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
