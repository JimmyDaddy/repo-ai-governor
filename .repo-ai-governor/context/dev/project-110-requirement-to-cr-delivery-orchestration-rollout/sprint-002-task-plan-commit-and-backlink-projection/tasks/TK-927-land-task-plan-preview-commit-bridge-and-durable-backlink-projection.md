# TK-927 land task plan preview-commit bridge and durable backlink projection

- Status: completed
- Date: 2026-04-16
- Owner: AI-Agent
- Priority: P1
- Project: `project-110-requirement-to-cr-delivery-orchestration-rollout`
- Sprint: `sprint-002-task-plan-commit-and-backlink-projection`

## 1. 任务目标

把 task decomposition preview/commit 与 deliver durable backlink summary 接到 Phase B baseline

## 2. Depends On

1. DA-915

## 3. 预期产物

1. runtime orchestration plus durable storage artifact for TK-927
2. task card update for TK-927
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/dev/project-109-requirement-to-cr-delivery-solution-review-and-promotion-prep/sprint-001-solution-review-and-promotion-handoff/tasks/DA-915-requirement-to-cr-delivery-promotion-and-rollout-decomposition-handoff.md
2. .repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/contracts/session-durable-storage-contract.md
3. .repo-ai-governor/context/current-context.md
4. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-002-task-plan-commit-and-backlink-projection/plan.md

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/plan.md
2. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. pnpm run build
2. pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/session-shell-runner.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts --maxWorkers=1 --maxConcurrency=1
3. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-002-task-plan-commit-and-backlink-projection/tasks" --task-id TK-927

## 8. Delivery Verification

1. pnpm run build
2. pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/session-shell-runner.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts --maxWorkers=1 --maxConcurrency=1
3. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-002-task-plan-commit-and-backlink-projection/tasks" --task-id TK-927
4. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-002-task-plan-commit-and-backlink-projection/tasks" --task-id TK-927
5. node ./scripts/governance/check-task-ledger-sync.js
6. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-16：任务创建，状态初始化为 `planned`。
2. 2026-04-17：sprint-001 boundary commit `51cad3ca` 已落地；当前任务切换为 `in_progress`，开始把 task decomposition preview/commit 与 deliver durable backlink summary 接到 sprint-002 的 Phase B baseline。
3. 2026-04-17：已完成 `plan` preview/commit target stream receipt 扩展；preview/commit artifact details 现在会稳定携带 `target_stream_id`、`checklist_path`、`tasks_csv_path` 与 stream-level backlink inputs，供 delivery overlay 复用而不复制 canonical task body。
4. 2026-04-17：已完成 session-shell nested command bridge 与 shared-session delivery runtime 接线；`plan_preview` / `plan_commit` 的 JSON 结果现在会被归一为 presenter-safe `deliveryWorkflowUpdate`，并在 `appendSessionMessage()` 中合并回 canonical `deliveryWorkflowState` 与 turn-level presenter metadata。
5. 2026-04-17：已完成 transcript / React presenter / i18n 投影；command recap 现在会展示 delivery phase、pending action、selected stream、result summary 与 artifact backlinks，shell 只消费 summary/backlink metadata，不在 presenter 侧重算 canonical truth。
6. 2026-04-17：已完成 `pnpm run build` 与两组定向 session-shell/runtime 单测，当前实现进入 fresh reviewer CR round 准备窗口，任务状态切换为 `completed`。

## 10. 产出

1. `apps/cli/src/commands/plan-command.ts` 已把 active primary stream id、checklist/tasks.csv path 与 preview/commit receipt detail 暴露给 governed `plan` contract。
2. `packages/core-orchestration-service` 与 `apps/cli` 已把 plan-driven delivery summary/backlink 更新贯穿到 shared session、command recap transcript 与 React transcript related-links surface。
