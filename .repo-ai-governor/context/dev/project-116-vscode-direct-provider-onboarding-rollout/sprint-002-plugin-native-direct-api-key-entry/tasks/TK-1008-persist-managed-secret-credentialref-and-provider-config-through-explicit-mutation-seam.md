# TK-1008 persist managed secret credentialRef and provider config through explicit mutation seam

- Status: completed
- Date: 2026-04-20
- Owner: AI-Agent
- Priority: P1
- Project: `project-116-vscode-direct-provider-onboarding-rollout`
- Sprint: `sprint-002-plugin-native-direct-api-key-entry`

## 1. 任务目标

Commit secret-backed onboarding outcomes through the service-owned mutation facade.

## 2. Depends On

1. implement plugin-native direct api key entry and secure capture

## 3. 预期产物

1. mutation seam artifact for TK-1008
2. task card update for TK-1008
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

1. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-service-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/cli/test/runtime/cli-user-config-projection-service.test.ts`
2. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-002-plugin-native-direct-api-key-entry/tasks" --task-id TK-1008

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-002-plugin-native-direct-api-key-entry/tasks" --task-id TK-1008
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-002-plugin-native-direct-api-key-entry/tasks" --task-id TK-1008
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js
5. `pnpm run build`
6. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 9. 执行记录

1. 2026-04-20：任务创建，状态初始化为 `planned`。
2. 2026-04-20：已完成 service-owned mutation seam 收口：provider-onboarding apply 在 embedded/runtime-service 与 local orchestration service 两条路径上都通过 managed secret backend 写入 raw API key、持久化非敏感 provider config + `credentialRef`，并主动清理 `tools.<tool>.remoteApi.credentialEnvVar`，避免 direct-entry path 回落到 env-var-first。
3. 2026-04-20：CLI projection / connect candidate 语义已同步更新：当 `credentialRef` 已存在时，不再默认合成 `credentialEnvVar`，从而保证 zero-env-var selector truth 可以稳定穿透到 connect candidate、service runtime 与 package tests。
4. 2026-04-20：same-window verification 已通过：`apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`、`packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`、`apps/cli/test/runtime/cli-user-config-projection-service.test.ts`、`pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`。

## 10. 产出

1. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
2. `/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`
3. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-user-config-projection-service.ts`
4. `/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`
