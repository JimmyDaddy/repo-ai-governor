# TK-996 implement terminal and filesystem bridge runtime hardening

- Status: completed
- Date: 2026-04-20
- Owner: AI-Agent
- Priority: P1
- Project: `project-115-acp-execution-bridge-rollout`
- Sprint: `sprint-003-permission-terminal-filesystem-bridge-hardening`

## 1. 任务目标

完成 terminal/* fs/* capability-gated bridge、cleanup 与 fail-closed 语义

## 2. Depends On

1. TK-995

## 3. 预期产物

1. host operation bridge artifact for TK-996
2. task card update for TK-996
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/current-context.md
2. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-003-permission-terminal-filesystem-bridge-hardening/plan.md

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/plan.md
2. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. `pnpm exec vitest run apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts apps/cli/test/runtime/cli-acp-session-runtime.test.ts`
2. `pnpm exec tsc -p tsconfig.json --noEmit`
3. `node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-003-permission-terminal-filesystem-bridge-hardening/tasks" --task-id TK-996`

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-003-permission-terminal-filesystem-bridge-hardening/tasks" --task-id TK-996
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-003-permission-terminal-filesystem-bridge-hardening/tasks" --task-id TK-996
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-20：任务创建，状态初始化为 `planned`。
2. 2026-04-20：`TK-995` 完成后，本任务切换为 `in_progress`，开始梳理 terminal/* 与 fs/* bridge 的 capability-gated fail-closed 语义和 cleanup 边界。
3. 2026-04-20：在 `CliAcpTransportClientRuntime` 中补齐 fixture-backed `tool_call` bridge、terminal carrier tracking、filesystem capability gate，以及 cancel 后的 terminal/permission carrier cleanup。
4. 2026-04-20：新增 terminal/fs available path、missing capability fail-closed、cancel cleanup 三类回归测试，并通过 targeted vitest 与 `tsc --noEmit`。

## 10. 产出

1. `CliAcpTransportClientRuntime` 已支持 capability-gated fixture tool-call events，能对 `terminal/*` 和 `fs/*` 的 bridge 请求保持 fail-closed，而不是静默回落。
2. transport-scoped `terminalIds` 现已在 cancel cleanup 时自动清空，保持 retained failed turn 的 host-operation carrier truth 可回收。
