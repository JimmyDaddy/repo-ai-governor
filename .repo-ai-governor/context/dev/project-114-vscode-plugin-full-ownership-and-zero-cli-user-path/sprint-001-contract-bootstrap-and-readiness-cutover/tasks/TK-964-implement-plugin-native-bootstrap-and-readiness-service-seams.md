# TK-964 implement plugin-native bootstrap and readiness service seams

- Status: completed
- Date: 2026-04-18
- Owner: AI-Agent
- Priority: P1
- Project: `project-114-vscode-plugin-full-ownership-and-zero-cli-user-path`
- Sprint: `sprint-001-contract-bootstrap-and-readiness-cutover`

## 1. 任务目标

Define the service-backed bootstrap and readiness seams the plugin must consume before user-visible cutover work starts.

## 2. Depends On

1. freeze plugin full-ownership and zero-cli bootstrap contract

## 3. 预期产物

1. service seam artifact for TK-964
2. task card update for TK-964
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/tasks/DA-934-vscode-workbench-promotion-and-rollout-decomposition-handoff.md
2. apps/vscode-extension/README.md
3. .repo-ai-governor/context/current-context.md
4. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-001-contract-bootstrap-and-readiness-cutover/plan.md

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/plan.md
2. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts
2. pnpm run build

## 8. Delivery Verification

1. pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test
2. pnpm run build
3. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-001-contract-bootstrap-and-readiness-cutover/tasks" --task-id TK-964
4. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-001-contract-bootstrap-and-readiness-cutover/tasks" --task-id TK-964
5. node ./scripts/governance/check-task-ledger-sync.js
6. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-18：任务创建，状态初始化为 `planned`。
2. 2026-04-18：补齐了 orchestration-service client、sidecar host/client、core service shell/runtime 与 extension service runtime 的 typed workspace-ops seam，让 bootstrap/readiness 与 secure-authoring 默认走 service-backed 路径；当前任务切换为 `completed`。

## 10. 产出

1. packages/orchestration-service-client/src/constants/orchestration-service.constant.ts
2. packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts
3. packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts
4. packages/core-orchestration-service/src/local-orchestration-service-shell.ts
5. apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts
