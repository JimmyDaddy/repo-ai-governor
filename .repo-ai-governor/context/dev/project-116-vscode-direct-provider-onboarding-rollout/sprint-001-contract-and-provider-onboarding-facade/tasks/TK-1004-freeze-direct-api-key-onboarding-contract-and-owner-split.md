# TK-1004 freeze direct-api-key onboarding contract and owner split

- Status: completed
- Date: 2026-04-20
- Owner: AI-Agent
- Priority: P1
- Project: `project-116-vscode-direct-provider-onboarding-rollout`
- Sprint: `sprint-001-contract-and-provider-onboarding-facade`

## 1. 任务目标

Lock the host-facing direct onboarding boundary and owner split without redefining runtime.agent-projection truth.

## 2. Depends On

1. scaffold baseline

## 3. 预期产物

1. contract baseline artifact for TK-1004
2. task card update for TK-1004
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/draft/approved_solution_review_vscode-plugin-direct-api-key-and-secret-backed-provider-onboarding.md
2. .repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/provider-onboarding-and-direct-api-key-entry-contract.md
3. .repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/vscode-plugin-direct-api-key-and-secret-backed-provider-onboarding.md
4. .repo-ai-governor/context/current-context.md
5. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-001-contract-and-provider-onboarding-facade/plan.md

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/plan.md
2. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`
2. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-001-contract-and-provider-onboarding-facade/tasks" --task-id TK-1004

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-001-contract-and-provider-onboarding-facade/tasks" --task-id TK-1004
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-001-contract-and-provider-onboarding-facade/tasks" --task-id TK-1004
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js
5. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
6. `pnpm run build`
7. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 9. 执行记录

1. 2026-04-20：任务创建，状态初始化为 `planned`。
2. 2026-04-20：`project-115` final closeout 已完成，当前任务切换为 `in_progress`，作为 `project-116 / sprint-001-contract-and-provider-onboarding-facade` 的首个 active execution boundary。
3. 2026-04-20：已冻结 owner split baseline：`query/apply provider onboarding` 进入 orchestration-service / sidecar / VS Code service seam，`runConnect` 继续保持 analyze-first + `credentialEnvVar` compatibility path，并通过 controller regression test 明确“不在 connect 流程里写 managed secret 或 `credentialRef`”。
4. 2026-04-20：same-window verification 已通过：`apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`、`apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`、`apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`、`pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 全部通过。

## 10. 产出

1. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-001-contract-and-provider-onboarding-facade/tasks/DA-1005-provider-onboarding-owner-split-and-contract-freeze.md`
2. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
3. `/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`
4. `/Users/jimmydaddy/study/ai-governor/packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`
