# TK-993 land shared invocation store and stream attachment semantics

- Status: completed
- Date: 2026-04-20
- Owner: AI-Agent
- Priority: P1
- Project: `project-115-acp-execution-bridge-rollout`
- Sprint: `sprint-002-executable-acp-exec-baseline`

## 1. 任务目标

确保 invokeStage 与 streamEvents 共享同一次 turn execution，不发生双执行

## 2. Depends On

1. TK-992

## 3. 预期产物

1. shared execution artifact for TK-993
2. task card update for TK-993
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

1. pnpm vitest run apps/cli/test/runtime/cli-acp-session-runtime.test.ts apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts
2. pnpm exec tsc -p tsconfig.json --noEmit
3. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-002-executable-acp-exec-baseline/tasks" --task-id TK-993

## 8. Delivery Verification

1. pnpm run build
2. pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1
3. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-002-executable-acp-exec-baseline/tasks" --task-id TK-993
4. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-002-executable-acp-exec-baseline/tasks" --task-id TK-993
5. node ./scripts/governance/check-task-ledger-sync.js
6. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-20：任务创建，状态初始化为 `planned`。
2. 2026-04-20：将 `invokeStage` / `streamEvents` 的共享 turn ownership 固化到 transport-scoped execution map，确保 invoke-first 与 stream-first 两种顺序都只启动一次 ACP prompt-turn execution。
3. 2026-04-20：修正 `apps/cli/test/runtime/cli-acp-session-runtime.test.ts` 的 event shape 漂移，并新增 `cli-acp-prompt-turn-runtime.test.ts` 覆盖 shared execution、buffer replay 与无双执行约束。

## 10. 产出

1. `apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`：以 invocation key 维持共享 prompt-turn execution、waiter replay 与 buffered stream event attachment。
2. `apps/cli/test/runtime/cli-acp-session-runtime.test.ts`、`apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts`：证明 stream attach 不依赖调用顺序，且不会重复启动同一 ACP turn。
