# TK-991 prepare sprint-001 handoff and activation recommendation

- Status: completed
- Date: 2026-04-20
- Owner: AI-Agent
- Priority: P1
- Project: `project-115-acp-execution-bridge-rollout`
- Sprint: `sprint-001-contract-and-runtime-decomposition`

## 1. 任务目标

整理 promotion handoff、phase map 与 sprint-002 activation recommendation

## 2. Depends On

1. TK-990

## 3. 预期产物

1. governance handoff artifact for TK-991
2. task card update for TK-991
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-003-phase-f-secure-authoring-and-user-settings/review/approved_solution_review_acp-execution-bridge-and-invoke-stream-confirm-cutover.md
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

1. pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts --maxWorkers=1 --maxConcurrency=1
2. pnpm run build
3. pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1
4. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-001-contract-and-runtime-decomposition/tasks" --task-id TK-991

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-001-contract-and-runtime-decomposition/tasks" --task-id TK-991
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-001-contract-and-runtime-decomposition/tasks" --task-id TK-991
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-20：任务创建，状态初始化为 `planned`。
2. 2026-04-20：任务切换为 `in_progress`，把 sprint-001 当前真值回写到 project/sprint plans，并更新 decomposition handoff 文档，避免继续保留“下一步先激活 sprint-001”的过期表述。
3. 2026-04-20：`DA-989` 已更新为当前运行中的 sprint-001 handoff boundary，明确 sprint-002 只能在本 sprint 完成 fresh CR round、accepted finding 修复与 boundary commit 之后再激活；同窗口 `pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 已通过，当前任务切换为 `completed`。
4. 2026-04-20：`CR-001` 已在同窗口完成 accepted finding 修复与复验，当前 handoff recommendation 已被消费：`current-context.md`、completed stream history、project plan 与 sprint-002 plan 已同步切到 `sprint-002-executable-acp-exec-baseline` activation truth。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-001-contract-and-runtime-decomposition/tasks/DA-989-acp-execution-bridge-promotion-and-rollout-decomposition-handoff.md` 已更新为当前 runtime decomposition truth，并补充 sprint-002 activation recommendation。
2. `project-115` 与 sprint-001/sprint-002 plans、`current-context.md` 以及 completed stream history 已在 `CR-001` resolved 后同步到 activation truth，确保下一条 execution surface 正式切到 `TK-992`。
