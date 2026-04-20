# TK-997 verify failure-path matrix and sprint-003 handoff

- Status: completed
- Date: 2026-04-20
- Owner: AI-Agent
- Priority: P1
- Project: `project-115-acp-execution-bridge-rollout`
- Sprint: `sprint-003-permission-terminal-filesystem-bridge-hardening`

## 1. 任务目标

覆盖 capability missing permission reject terminal timeout 等 failure-path 并整理下阶段 handoff

## 2. Depends On

1. TK-996

## 3. 预期产物

1. verification handoff artifact for TK-997
2. task card update for TK-997
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

1. `pnpm exec vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts`
2. `pnpm run build`
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
4. `node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-003-permission-terminal-filesystem-bridge-hardening/tasks" --task-id TK-997`

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-003-permission-terminal-filesystem-bridge-hardening/tasks" --task-id TK-997
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-003-permission-terminal-filesystem-bridge-hardening/tasks" --task-id TK-997
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-20：任务创建，状态初始化为 `planned`。
2. 2026-04-20：`TK-996` 完成后，本任务切换为 `in_progress`，开始执行 sprint-003 的 failure-path matrix、broader runtime verification 与 handoff 收口。
3. 2026-04-20：完成 ACP sprint-003 broader verification，覆盖 adapter routing、session supervisor、agent onboarding、adapter-sdk smoke、`pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`。
4. 2026-04-20：sprint-003 implementation/verification boundary 已完成，下一步进入 fresh delegated CR round 与 reviewer-clean 收口。

## 10. 产出

1. sprint-003 failure-path matrix 已具备 replayable verification evidence，覆盖 permission bridge、terminal/filesystem capability gate、routing truth 与 package-level regression。
2. sprint-003 已准备好进入 scoped CR loop，后续以 review artifact、triage 修复与 boundary gate 收口。
