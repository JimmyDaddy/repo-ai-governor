# TK-1007 implement plugin-native direct api key entry and secure capture

- Status: completed
- Date: 2026-04-20
- Owner: AI-Agent
- Priority: P1
- Project: `project-116-vscode-direct-provider-onboarding-rollout`
- Sprint: `sprint-002-plugin-native-direct-api-key-entry`

## 1. 任务目标

Land plugin-native provider onboarding forms and secure API-key entry.

## 2. Depends On

1. prepare sprint-001 handoff and activation recommendation

## 3. 预期产物

1. workbench surface artifact for TK-1007
2. task card update for TK-1007
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/current-context.md
2. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-002-plugin-native-direct-api-key-entry/plan.md

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/plan.md
2. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
2. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-002-plugin-native-direct-api-key-entry/tasks" --task-id TK-1007

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-002-plugin-native-direct-api-key-entry/tasks" --task-id TK-1007
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-002-plugin-native-direct-api-key-entry/tasks" --task-id TK-1007
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js
5. `pnpm run build`
6. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 9. 执行记录

1. 2026-04-20：任务创建，状态初始化为 `planned`。
2. 2026-04-20：`sprint-001-contract-and-provider-onboarding-facade` 已完成 closeout write-back，当前任务切换为 `in_progress`，作为 `project-116 / sprint-002-plugin-native-direct-api-key-entry` 的首个 active execution boundary。
3. 2026-04-20：已完成 plugin-native direct-entry connect flow：VS Code `runConnect()` 在 `remote_api` 路径下改为先解析 provider-onboarding snapshot，再通过 secure input 采集 API key，并把 provider/model/endpoint/api-key 作为 service-owned onboarding request 提交，而不再提示 `credentialEnvVar`。
4. 2026-04-20：same-window verification 已通过：`apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`、`apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`、`pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`。

## 10. 产出

1. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
2. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
3. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
