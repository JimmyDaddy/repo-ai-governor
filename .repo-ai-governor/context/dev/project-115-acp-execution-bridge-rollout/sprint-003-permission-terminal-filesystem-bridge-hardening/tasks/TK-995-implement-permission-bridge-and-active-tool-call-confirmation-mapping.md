# TK-995 implement permission bridge and active tool-call confirmation mapping

- Status: completed
- Date: 2026-04-20
- Owner: AI-Agent
- Priority: P1
- Project: `project-115-acp-execution-bridge-rollout`
- Sprint: `sprint-003-permission-terminal-filesystem-bridge-hardening`

## 1. 任务目标

完成 requestConfirmation 到 session/request_permission 的受限 bridge cutover

## 2. Depends On

1. sprint-002-executable-acp-exec-baseline planned handoff

## 3. 预期产物

1. permission bridge artifact for TK-995
2. task card update for TK-995
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
3. `node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-003-permission-terminal-filesystem-bridge-hardening/tasks" --task-id TK-995`

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-003-permission-terminal-filesystem-bridge-hardening/tasks" --task-id TK-995
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-003-permission-terminal-filesystem-bridge-hardening/tasks" --task-id TK-995
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-20：任务创建，状态初始化为 `planned`。
2. 2026-04-20：`CR-008` 确认 sprint-002 reviewer-clean 后，本任务切换为 `in_progress`，作为 sprint-003-permission-terminal-filesystem-bridge-hardening 的首个 active execution surface。
3. 2026-04-20：补齐 confirmation -> invocationState lookup，把 `requestConfirmation` 收敛到 active ACP turn 上的 metadata-driven permission bridge，并对缺失/非法 metadata 保持 fail-closed。
4. 2026-04-20：新增 active confirmation bridge / invalid metadata / settled-turn fail-closed / session confirmation lookup tests，并通过 targeted vitest 与 `tsc --noEmit`。

## 10. 产出

1. `CliAcpSessionRuntime` / `CliAcpHostOperationRuntime` 已支持 confirmation request 到 active invocation state 的 transport-scoped lookup。
2. `CliAcpTransportClientRuntime` 已支持 metadata-driven permission bridge、permissionRequestIds correlation persistence，以及 live-turn-only fail-closed semantics。
