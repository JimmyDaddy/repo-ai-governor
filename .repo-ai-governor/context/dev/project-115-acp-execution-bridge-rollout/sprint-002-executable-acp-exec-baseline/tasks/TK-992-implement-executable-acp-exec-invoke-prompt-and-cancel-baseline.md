# TK-992 implement executable acp_exec invoke prompt and cancel baseline

- Status: completed
- Date: 2026-04-20
- Owner: AI-Agent
- Priority: P1
- Project: `project-115-acp-execution-bridge-rollout`
- Sprint: `sprint-002-executable-acp-exec-baseline`

## 1. 任务目标

完成 session/new prompt cancel 主链路与 invokeStage self-sufficient baseline

## 2. Depends On

1. sprint-001-contract-and-runtime-decomposition planned handoff

## 3. 预期产物

1. execution baseline artifact for TK-992
2. task card update for TK-992
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

1. pnpm vitest run apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts
2. pnpm exec tsc -p tsconfig.json --noEmit
3. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-002-executable-acp-exec-baseline/tasks" --task-id TK-992

## 8. Delivery Verification

1. pnpm run build
2. pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1
3. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-002-executable-acp-exec-baseline/tasks" --task-id TK-992
4. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-002-executable-acp-exec-baseline/tasks" --task-id TK-992
5. node ./scripts/governance/check-task-ledger-sync.js
6. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-20：任务创建，状态初始化为 `planned`。
2. 2026-04-20：由于 `sprint-001-contract-and-runtime-decomposition` 已完成 delegated CR loop 并完成 activation handoff，当前任务切换为 `in_progress`；本窗口开始推进真实 `acp_exec` invoke prompt / cancel baseline，并明确禁止 `cli_exec` aliasing 与双执行。
3. 2026-04-20：实现 `CliAcpTransportClientRuntime` 的 fixture-backed `session/new -> session/prompt -> session/cancel` 主链路，`CliAcpPromptTurnRuntime` 改为向 transport owner 传递真实 request，`CliAcpHostOperationRuntime` 则通过 `CliAcpSessionRuntime.findInvocationState()` 回查共享 invocation 并执行 transport-scoped cancel。
4. 2026-04-20：补齐 `apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts` 与 routing/runtime 定向回归，验证 invoke self-sufficient、stream attach、cancel rejection 与无 `cli_exec` aliasing 的 ACP baseline。

## 10. 产出

1. `apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`：提供 fixture-backed ACP prompt-turn execution、buffered event replay 与 transport-scoped cancel acknowledgement。
2. `apps/cli/src/runtime/cli-acp-prompt-turn-runtime.ts`、`apps/cli/src/runtime/cli-acp-host-operation-runtime.ts`、`apps/cli/src/runtime/cli-acp-session-runtime.ts`：完成 request handoff、cancel lookup 与 invoke/stream shared execution wiring。
