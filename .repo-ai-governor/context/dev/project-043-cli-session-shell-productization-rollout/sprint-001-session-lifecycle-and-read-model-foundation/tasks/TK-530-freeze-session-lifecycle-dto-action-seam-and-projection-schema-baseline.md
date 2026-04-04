# TK-530 freeze session lifecycle dto action seam and projection schema baseline

- Status: completed
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P0
- Project: `project-043-cli-session-shell-productization-rollout`
- Sprint: `sprint-001-session-lifecycle-and-read-model-foundation`

## 1. 任务目标

冻结 session lifecycle 的增量 action seam、DTO 命名与 session projection/read-model 字段边界，使后续实现不再在 orchestration、durable-storage 与 interactive shell presenter 层各自演化独立语义。

## 2. Depends On

1. `.repo-ai-governor/draft/cli-borrowed-capabilities-productization-technical-solution.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/module-overview.md`
4. `apps/cli/src/runtime/interactive-shell/session-shell-service-client.ts`

## 3. 预期产物

1. lifecycle action seam 对齐方案
2. session projection/read-model 最小字段集合
3. `TK-531 / TK-532` 的统一实现边界

## 4. Required Inputs

1. `.repo-ai-governor/draft/cli-borrowed-capabilities-productization-technical-solution.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/module-overview.md`
4. `apps/cli/src/runtime/interactive-shell/session-shell-service-client.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-043-cli-session-shell-productization-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-043-cli-session-shell-productization-rollout/sprint-001-session-lifecycle-and-read-model-foundation/plan.md`
3. `.repo-ai-governor/context/dev/project-038-session-main-capability-explainer-productization/sprint-004-cli-borrowed-capabilities-rollout-decomposition/tasks/TK-529-decompose-cli-borrowed-capabilities-draft-into-planned-implementation-rollout-project-and-sprint-packages.md`

## 6. 实施计划

1. 盘点当前 session shell client / runner 与 draft 中 lifecycle completeness 的差距。
2. 冻结 `fork / archive / unarchive / compact / rollback-to-turn` 的 action seam 和 DTO 边界。
3. 冻结 session projection/read-model 的最小字段集合与 consumer 约束。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. docs-only decomposition；当前阶段未修改 `apps/**`、`packages/**`、`bin/**`、`test/**`

## 8. Delivery Verification

1. 当前拆解窗口需通过 `node ./scripts/governance/check-task-ledger-sync.js`
2. 当前拆解窗口需通过 `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. 后续实现完成并宣告 `completed` 前，必须补 `pnpm run build`、session lifecycle integration tests 与 projection rebuild evidence

## 9. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；承接 lifecycle seam 与 projection schema 冻结，不在本任务里直接实现 service action。
2. 2026-04-04：完成 session lifecycle seam freeze 回填；`apps/cli/src/runtime/interactive-shell/session-shell-service-client.ts` 与 `apps/cli/src/runtime/interactive-shell/session-shell-transcript-store.ts` 已形成统一 lifecycle/projection contract。

## 10. 产出

1. 已完成：session lifecycle action seam alignment note -> `apps/cli/src/runtime/interactive-shell/session-shell-service-client.ts`
2. 已完成：session projection/read-model field baseline -> `apps/cli/src/runtime/interactive-shell/session-shell-transcript-store.ts`
3. 已完成：`TK-531 / TK-532` 实施边界冻结记录 -> `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
