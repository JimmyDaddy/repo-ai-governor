# TK-994 verify fixture-backed acp contract baseline and sprint-002 handoff

- Status: completed
- Date: 2026-04-20
- Owner: AI-Agent
- Priority: P1
- Project: `project-115-acp-execution-bridge-rollout`
- Sprint: `sprint-002-executable-acp-exec-baseline`

## 1. 任务目标

补齐 fixture-backed contract tests 与 sprint-003 handoff 建议

## 2. Depends On

1. TK-993

## 3. 预期产物

1. verification handoff artifact for TK-994
2. task card update for TK-994
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/current-context.md
2. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-002-executable-acp-exec-baseline/plan.md

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/plan.md
2. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. pnpm vitest run apps/cli/test/runtime/cli-acp-session-runtime.test.ts apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts
2. pnpm exec tsc -p tsconfig.json --noEmit
3. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-002-executable-acp-exec-baseline/tasks" --task-id TK-994

## 8. Delivery Verification

1. pnpm run build
2. pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1
3. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-002-executable-acp-exec-baseline/tasks" --task-id TK-994
4. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-002-executable-acp-exec-baseline/tasks" --task-id TK-994
5. node ./scripts/governance/check-task-ledger-sync.js
6. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-20：任务创建，状态初始化为 `planned`。
2. 2026-04-20：完成 sprint-002 定向验证集、根级 TS 编译、`pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`，确认 ACP fixture-backed invoke/stream/cancel baseline 没有击穿 session-main、onboarding 或 adapter-sdk smoke 边界。
3. 2026-04-20：为 sprint-003 记录 handoff truth：`requestConfirmation` 仍保持 fail-closed，probe 侧仍由 host readiness evidence 保守门控，下一 sprint 需要补齐 permission bridge、terminal/filesystem capability gating 与 cleanup-safe cancel hardening。

## 10. 产出

1. sprint-002 verification evidence：ACP runtime targeted vitest、session-main/onboarding smoke、root `tsc --noEmit`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`。
2. sprint-003 handoff recommendation：以现有 shared invocation + cancel baseline 为基础，继续推进 permission / terminal / filesystem bridge hardening，不放宽 probe truth 或 support wording。
