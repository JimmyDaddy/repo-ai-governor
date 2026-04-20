# TK-990 decompose transport client session turn and host-operation runtimes

- Status: completed
- Date: 2026-04-20
- Owner: AI-Agent
- Priority: P1
- Project: `project-115-acp-execution-bridge-rollout`
- Sprint: `sprint-001-contract-and-runtime-decomposition`

## 1. 任务目标

拆解 capability/session/turn/host-operation runtimes 并收敛 shared invocation state

## 2. Depends On

1. TK-989

## 3. 预期产物

1. runtime decomposition artifact for TK-990
2. task card update for TK-990
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-runtime-hardening-and-explicit-acp-extension-seam.md
2. .repo-ai-governor/context/current-context.md
3. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-001-contract-and-runtime-decomposition/plan.md

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/plan.md
2. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/cli-acp-session-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts --maxWorkers=1 --maxConcurrency=1
2. pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts --maxWorkers=1 --maxConcurrency=1
3. pnpm run build
4. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-001-contract-and-runtime-decomposition/tasks" --task-id TK-990

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-001-contract-and-runtime-decomposition/tasks" --task-id TK-990
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-001-contract-and-runtime-decomposition/tasks" --task-id TK-990
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-20：任务创建，状态初始化为 `planned`。
2. 2026-04-20：任务切换为 `in_progress`，将 `CliAcpHostProtocol` 拆解为 capability/session/prompt-turn/host-operation/transport-client 五个 owner，并把 shared invocation state 保持为 transport-scoped additive truth。
3. 2026-04-20：新增 `cli-acp-capability-discovery-runtime.ts`、`cli-acp-execution-state-store.ts`、`cli-acp-host-operation-runtime.ts`、`cli-acp-prompt-turn-runtime.ts`、`cli-acp-session-runtime.ts`、`cli-acp-transport-client-runtime.ts` 与 `cli-acp-session-runtime.test.ts`，验证 shared invocation reuse 与 host protocol decomposition 不破坏现有 probe-only baseline；同窗口 targeted runtime vitest、project-115 baseline vitest 与 `pnpm run build` 已通过，当前任务切换为 `completed`。

## 10. 产出

1. `apps/cli/src/runtime/cli-acp-capability-discovery-runtime.ts`、`apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`、`apps/cli/src/runtime/cli-acp-session-runtime.ts`、`apps/cli/src/runtime/cli-acp-prompt-turn-runtime.ts`、`apps/cli/src/runtime/cli-acp-host-operation-runtime.ts` 与 `apps/cli/src/runtime/cli-acp-execution-state-store.ts` 已完成 runtime ownership 拆解。
2. `apps/cli/test/runtime/cli-acp-session-runtime.test.ts` 与更新后的 `apps/cli/src/runtime/cli-acp-host-protocol.ts` 已固定 invoke/stream shared invocation seam、confirmation/cancel owner split 与 fail-closed transport boundary。
