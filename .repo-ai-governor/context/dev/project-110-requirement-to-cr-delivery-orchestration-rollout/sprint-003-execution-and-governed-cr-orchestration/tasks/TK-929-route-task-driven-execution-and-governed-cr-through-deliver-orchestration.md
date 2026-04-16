# TK-929 route task-driven execution and governed CR through deliver orchestration

- Status: completed
- Date: 2026-04-16
- Owner: AI-Agent
- Priority: P1
- Project: `project-110-requirement-to-cr-delivery-orchestration-rollout`
- Sprint: `sprint-003-execution-and-governed-cr-orchestration`

## 1. 任务目标

把 run、review、review-verify 与 clean-round recheck 接入 deliver phase machine

## 2. Depends On

1. DA-915

## 3. 预期产物

1. runtime execution and review orchestration artifact for TK-929
2. task card update for TK-929
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/dev/project-109-requirement-to-cr-delivery-solution-review-and-promotion-prep/sprint-001-solution-review-and-promotion-handoff/tasks/DA-915-requirement-to-cr-delivery-promotion-and-rollout-decomposition-handoff.md
2. .repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md
3. .repo-ai-governor/context/current-context.md
4. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-003-execution-and-governed-cr-orchestration/plan.md

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/plan.md
2. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. pnpm run build
2. pnpm exec vitest run apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts
3. pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts
4. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-003-execution-and-governed-cr-orchestration/tasks" --task-id TK-929

## 8. Delivery Verification

1. pnpm run build
2. pnpm exec vitest run apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts
3. pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts
4. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-003-execution-and-governed-cr-orchestration/tasks" --task-id TK-929
5. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-003-execution-and-governed-cr-orchestration/tasks" --task-id TK-929
6. node ./scripts/governance/check-task-ledger-sync.js
7. node ./scripts/governance/check-sprint-plan-status-sync.js
8. node ./scripts/governance/check-code-review-status-sync.js
9. node ./scripts/governance/check-worktree-review-target.js

## 9. 执行记录

1. 2026-04-16：任务创建，状态初始化为 `planned`。
2. 2026-04-17：随着 sprint-002 closeout 与 `current-context` 切换，本任务已激活为新的 primary implementation boundary，开始推进 execution/review/review-verify deliver orchestration 接线。
3. 2026-04-17：已完成 orchestration-owned delivery pending-action vocabulary 扩展，并把新的 execution/review/review-verify/clean-recheck action 集合从 `packages/core-orchestration-service` 导出给 CLI session-shell 复用，避免 presenter 侧再维护第二套 finite truth。
4. 2026-04-17：已完成 `governance_run`、`review_queue` 与 `review_verify` 的 `deliveryWorkflowUpdate` 接线；CLI runtime 现在会把 canonical review artifact path/status、review verify decision、ledger backfill backlink 映射回 deliver phase machine，并在后续 update 未重复声明时保留既有 `selectedTargetStream`。
5. 2026-04-17：已补充 session-shell 与 local orchestration service 聚焦测试，覆盖 governed run/review/review-verify deliver overlay 映射与 selected stream persistence；同窗口 `pnpm run build`、两组定向 vitest 已通过，任务进入 fresh reviewer CR round 准备窗口，状态保持 `in_progress`。
6. 2026-04-17：`CR-001 ~ CR-003` 已全部 `resolved`，其中 latest fresh reviewer clean round `CR-003` 未发现新的 actionable finding；本任务切换为 `completed`，实现边界正式移交给 `TK-930` 承接 sprint-003 closeout 与 sprint-004 activation handoff。

## 10. 产出

1. `packages/core-orchestration-service` 已补齐 execution/review/review-verify/clean recheck 的 delivery pending-action 常量与导出面。
2. `apps/cli` 已把 governed `run`、`review`、`review-verify` 的 artifact/status/backlink 输出投影为 presenter-safe `deliveryWorkflowUpdate`，并保持 deliver overlay 只回链 canonical review truth。
3. `apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts` 与 `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts` 已新增 sprint-003 聚焦覆盖。
