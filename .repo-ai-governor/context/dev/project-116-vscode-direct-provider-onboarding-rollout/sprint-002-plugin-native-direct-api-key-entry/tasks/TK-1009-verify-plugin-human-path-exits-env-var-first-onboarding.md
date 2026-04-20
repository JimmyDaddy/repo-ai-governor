# TK-1009 verify plugin human path exits env-var-first onboarding

- Status: completed
- Date: 2026-04-20
- Owner: AI-Agent
- Priority: P1
- Project: `project-116-vscode-direct-provider-onboarding-rollout`
- Sprint: `sprint-002-plugin-native-direct-api-key-entry`

## 1. 任务目标

Prove the plugin human path no longer requires credentialEnvVar authoring.

## 2. Depends On

1. persist managed secret credentialRef and provider config through explicit mutation seam

## 3. 预期产物

1. verification handoff artifact for TK-1009
2. task card update for TK-1009
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

1. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/connect-phase2.integration.test.ts`
2. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-002-plugin-native-direct-api-key-entry/tasks" --task-id TK-1009

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-002-plugin-native-direct-api-key-entry/tasks" --task-id TK-1009
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-002-plugin-native-direct-api-key-entry/tasks" --task-id TK-1009
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js
5. `pnpm run build`
6. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 9. 执行记录

1. 2026-04-20：任务创建，状态初始化为 `planned`。
2. 2026-04-20：已完成 plugin-human-path verification：controller integration、service/runtime tests、presentation builder coverage、CLI onboarding runtime tests 与 `connect-phase2.integration` 均确认 direct-entry path 不再要求作者填写 `credentialEnvVar`，并且 user-config 带 `credentialRef` 时 connect candidate 会维持 zero-env-var truth。
3. 2026-04-20：为避免 integration suite 误读开发机真实 `user-config.yaml`，`connect-phase2.integration` 默认 HOME 已切换到隔离测试目录；只有显式传入 HOME 的用例才消费自定义 user-config。
4. 2026-04-20：same-window verification 已通过：`apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`、`apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`、`apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`、`apps/cli/test/runtime/agent-onboarding-runtime.test.ts`、`apps/cli/test/connect-phase2.integration.test.ts`、`pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`。

## 10. 产出

1. `/Users/jimmydaddy/study/ai-governor/apps/cli/test/connect-phase2.integration.test.ts`
2. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/agent-onboarding-runtime.ts`
3. `/Users/jimmydaddy/study/ai-governor/apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
4. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
