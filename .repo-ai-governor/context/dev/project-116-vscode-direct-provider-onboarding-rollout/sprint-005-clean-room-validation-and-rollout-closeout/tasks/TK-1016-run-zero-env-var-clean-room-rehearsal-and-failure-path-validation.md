# TK-1016 run zero-env-var clean-room rehearsal and failure-path validation

- Status: completed
- Date: 2026-04-21
- Owner: AI-Agent
- Priority: P1
- Project: `project-116-vscode-direct-provider-onboarding-rollout`
- Sprint: `sprint-005-clean-room-validation-and-rollout-closeout`

## 1. 任务目标

Validate the supported plugin path without manual env-var setup.

## 2. Depends On

1. prepare support-truth boundary recommendation and sprint handoff

## 3. 预期产物

1. clean-room evidence artifact for TK-1016
2. task card update for TK-1016
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/current-context.md
2. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-005-clean-room-validation-and-rollout-closeout/plan.md

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/plan.md
2. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/cli-user-config-projection-service.test.ts apps/cli/test/connect-phase2.integration.test.ts`
2. `pnpm run build`
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run release:pack-vscode-extension -- --report .repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-005-clean-room-validation-and-rollout-closeout/project-116-sprint-005-vscode-extension-pack-report-20260420T193604Z.json`
5. `pnpm run release:verify-vscode-extension-distribution -- --output .repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-005-clean-room-validation-and-rollout-closeout/project-116-sprint-005-vscode-distribution-report-20260420T193604Z.json`
6. `node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-005-clean-room-validation-and-rollout-closeout/tasks" --task-id TK-1016`

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-005-clean-room-validation-and-rollout-closeout/tasks" --task-id TK-1016
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-005-clean-room-validation-and-rollout-closeout/tasks" --task-id TK-1016
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-20：任务创建，状态初始化为 `planned`。
2. 2026-04-21：`sprint-004-docs-distribution-and-workbench-evidence` 已完成 closeout write-back，当前任务切换为 `in_progress`，作为 `project-116 / sprint-005-clean-room-validation-and-rollout-closeout` 的首个 active execution boundary。
3. 2026-04-21：已完成 zero-env-var clean-room evidence window：VS Code direct-onboarding targeted tests、CLI `credentialRef` zero-env-var regression、`pnpm run build`、`pnpm run test:packages`、fresh pack report，以及 packaged-root / extracted-VSIX scratch-isolated distribution verification 全部通过。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-005-clean-room-validation-and-rollout-closeout/project-116-sprint-005-vscode-extension-pack-report-20260420T193604Z.json`
2. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-005-clean-room-validation-and-rollout-closeout/project-116-sprint-005-vscode-distribution-report-20260420T193604Z.json`
3. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-005-clean-room-validation-and-rollout-closeout/project-116-sprint-005-zero-env-var-clean-room-summary.md`
