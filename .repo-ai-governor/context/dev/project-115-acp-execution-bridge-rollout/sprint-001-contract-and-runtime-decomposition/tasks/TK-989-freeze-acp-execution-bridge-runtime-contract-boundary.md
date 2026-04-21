# TK-989 freeze acp execution bridge runtime contract boundary

- Status: completed
- Date: 2026-04-20
- Owner: AI-Agent
- Priority: P1
- Project: `project-115-acp-execution-bridge-rollout`
- Sprint: `sprint-001-contract-and-runtime-decomposition`

## 1. 任务目标

固定 ACP execution bridge 的 contract gap、runtime owner 与 rollout acceptance 边界

## 2. Depends On

1. scaffold baseline

## 3. 预期产物

1. contract baseline artifact for TK-989
2. task card update for TK-989
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/draft/acp-execution-bridge-and-invoke-stream-confirm-cutover-technical-solution.md
2. .repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-003-phase-f-secure-authoring-and-user-settings/review/approved_solution_review_acp-execution-bridge-and-invoke-stream-confirm-cutover.md
3. .repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-host-facing-transport-formalization-and-distribution-boundary.md
4. .repo-ai-governor/context/current-context.md
5. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-001-contract-and-runtime-decomposition/plan.md

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/plan.md
2. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/cli-acp-session-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts --maxWorkers=1 --maxConcurrency=1
2. pnpm run build
3. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-001-contract-and-runtime-decomposition/tasks" --task-id TK-989

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-001-contract-and-runtime-decomposition/tasks" --task-id TK-989
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-001-contract-and-runtime-decomposition/tasks" --task-id TK-989
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-20：任务创建，状态初始化为 `planned`。
2. 2026-04-20：任务切换为 `in_progress`，同步激活 `current-context.md`、project-115 plan 与 sprint-001 plan，并固定当前窗口只在 `project-115 / sprint-001` 内推进 ACP execution bridge runtime boundary。
3. 2026-04-20：通过 `CliAcpHostAvailabilityResolution`、`CliAcpInvocationContext`、`CliAcpInvocationExecutionState` 与 `CliAcpHostProtocol` owner composition 明确 probe / invoke / stream / confirm / cancel 的 runtime ownership，保持 `acp_exec` fail-closed 且不回退成 `cli_exec` alias；同窗口 `pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/cli-acp-session-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts --maxWorkers=1 --maxConcurrency=1` 与 `pnpm run build` 已通过，当前任务切换为 `completed`。

## 10. 产出

1. `.repo-ai-governor/context/current-context.md`、`.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/plan.md` 与 `.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-001-contract-and-runtime-decomposition/plan.md` 已写回 sprint-001 active truth，并把 contract boundary 固定为当前 primary execution surface。
2. `apps/cli/src/types/interfaces/cli-acp-host-runtime.interface.ts`、`apps/cli/src/types/interfaces/index.ts`、`apps/cli/src/types/index.ts` 与 `apps/cli/src/runtime/cli-acp-host-protocol.ts` 已落地 ACP host-facing runtime contract baseline，明确 capability discovery、shared invocation context 与 fail-closed entrypoint contract。
