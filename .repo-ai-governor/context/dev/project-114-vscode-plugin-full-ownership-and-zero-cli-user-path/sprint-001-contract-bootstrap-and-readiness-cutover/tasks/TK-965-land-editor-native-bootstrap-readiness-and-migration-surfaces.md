# TK-965 land editor-native bootstrap readiness and migration surfaces

- Status: completed
- Date: 2026-04-18
- Owner: AI-Agent
- Priority: P1
- Project: `project-114-vscode-plugin-full-ownership-and-zero-cli-user-path`
- Sprint: `sprint-001-contract-bootstrap-and-readiness-cutover`

## 1. 任务目标

Plan the editor-native bootstrap, readiness, and migration affordances that replace the visible CLI-first starting path.

## 2. Depends On

1. implement plugin-native bootstrap and readiness service seams

## 3. 预期产物

1. workbench surface artifact for TK-965
2. task card update for TK-965
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. apps/vscode-extension/README.md
2. .repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md
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

1. pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-host.activation.test.ts
2. pnpm run build

## 8. Delivery Verification

1. pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test
2. pnpm run build
3. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-001-contract-bootstrap-and-readiness-cutover/tasks" --task-id TK-965
4. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-001-contract-bootstrap-and-readiness-cutover/tasks" --task-id TK-965
5. node ./scripts/governance/check-task-ledger-sync.js
6. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-18：任务创建，状态初始化为 `planned`。
2. 2026-04-18：将 workbench overview、workflow studio、host activation、temporary bridge action 与 bootstrap/readiness 节点切换为 editor-native service-backed surface，并同步更新 extension tests；当前任务切换为 `completed`。

## 10. 产出

1. apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts
2. apps/vscode-extension/src/runtime/vscode-extension-host.ts
3. apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts
4. apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts
5. apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts
