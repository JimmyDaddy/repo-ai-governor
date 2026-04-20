# TK-963 freeze plugin full-ownership and zero-cli bootstrap contract

- Status: completed
- Date: 2026-04-18
- Owner: AI-Agent
- Priority: P1
- Project: `project-114-vscode-plugin-full-ownership-and-zero-cli-user-path`
- Sprint: `sprint-001-contract-bootstrap-and-readiness-cutover`

## 1. 任务目标

Freeze the plugin full-ownership, zero-CLI bootstrap, and readiness boundary for the follow-up rollout.

## 2. Depends On

1. DA-934
2. project-113 completion audit

## 3. 预期产物

1. contract baseline artifact for TK-963
2. task card update for TK-963
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md
2. .repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/tasks/DA-934-vscode-workbench-promotion-and-rollout-decomposition-handoff.md
3. .repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/project-113-vscode-primary-workbench-full-cutover-completion-audit-summary.md
4. .repo-ai-governor/context/current-context.md
5. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-001-contract-bootstrap-and-readiness-cutover/plan.md

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/plan.md
2. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-host.activation.test.ts
2. pnpm run build

## 8. Delivery Verification

1. pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test
2. pnpm run build
3. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-001-contract-bootstrap-and-readiness-cutover/tasks" --task-id TK-963
4. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-001-contract-bootstrap-and-readiness-cutover/tasks" --task-id TK-963
5. node ./scripts/governance/check-task-ledger-sync.js
6. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-18：任务创建，状态初始化为 `planned`。
2. 2026-04-18：冻结了 zero-cli bootstrap/readiness 的扩展契约面，新增 workspace-bootstrap / doctor / check / workflow-authoring command ids、capability classes、manifest activation events 与本地化标题；当前任务切换为 `completed`。

## 10. 产出

1. apps/vscode-extension/src/constants/vscode-extension.constant.ts
2. apps/vscode-extension/src/runtime/vscode-extension-contract.ts
3. apps/vscode-extension/package.json
4. apps/vscode-extension/package.nls.json
5. apps/vscode-extension/package.nls.zh-cn.json
