# TK-1015 prepare support-truth boundary recommendation and sprint handoff

- Status: completed
- Date: 2026-04-21
- Owner: AI-Agent
- Priority: P1
- Project: `project-116-vscode-direct-provider-onboarding-rollout`
- Sprint: `sprint-004-docs-distribution-and-workbench-evidence`

## 1. 任务目标

Summarize the docs/evidence boundary before final validation and closeout.

## 2. Depends On

1. capture built-source and local-vsix direct-onboarding evidence

## 3. 预期产物

1. support truth handoff artifact for TK-1015
2. task card update for TK-1015
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

1. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
2. `pnpm run build`
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run release:verify-vscode-extension-distribution -- --output .repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/project-116-sprint-004-vscode-distribution-report-20260420T185446Z.json`
5. `pnpm pack --json --dry-run`
6. `pnpm run check:ide-entry-smoke`
7. `pnpm run check:ide-docs-parity`
8. `node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/tasks" --task-id TK-1015`

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/tasks" --task-id TK-1015
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/tasks" --task-id TK-1015
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-20：任务创建，状态初始化为 `planned`。
2. 2026-04-21：收敛 direct-provider-onboarding 支持边界建议，明确当前可以公开宣称“插件人类路径不再要求手工 `credentialEnvVar` authoring、raw API key 留在 managed secret backend、public docs 已对齐 built-source/local-VSIX 证据”，同时把 zero-env-var clean-room 证明与项目 closeout 保留给 sprint-005。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/project-116-sprint-004-support-truth-boundary-handoff.md`
2. sprint-005 handoff 输入：`project-116-sprint-004-vscode-distribution-report-20260420T185446Z.json` 与 `project-116-sprint-004-built-source-and-local-vsix-direct-onboarding-summary.md`
