# TK-1011 land update-api-key reconnect-provider and degraded-state guidance

- Status: completed
- Date: 2026-04-20
- Owner: AI-Agent
- Priority: P1
- Project: `project-116-vscode-direct-provider-onboarding-rollout`
- Sprint: `sprint-003-readiness-cta-and-provider-lifecycle`

## 1. 任务目标

Add provider lifecycle actions and degraded-state guidance without shadow truth.

## 2. Depends On

1. converge overview status and doctor cta mapping with provider-onboarding snapshot

## 3. 预期产物

1. lifecycle UX artifact for TK-1011
2. task card update for TK-1011
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/current-context.md
2. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-003-readiness-cta-and-provider-lifecycle/plan.md

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/plan.md
2. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-chat-participant.test.ts`
2. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-003-readiness-cta-and-provider-lifecycle/tasks" --task-id TK-1011

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-003-readiness-cta-and-provider-lifecycle/tasks" --task-id TK-1011
4. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-003-readiness-cta-and-provider-lifecycle/tasks" --task-id TK-1011
5. node ./scripts/governance/check-task-ledger-sync.js
6. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-20：任务创建，状态初始化为 `planned`。
2. 2026-04-20：已将 `Update API Key` / `Reconnect Provider` / degraded `Run Doctor` 收敛为 provider lifecycle CTA，并保持所有动作继续落在现有 `runConnect` / `setManagedSecret` / `runDoctor` command seam 上。

## 10. 产出

1. `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
2. `apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
3. `apps/vscode-extension/test/vscode-extension-chat-participant.test.ts`
