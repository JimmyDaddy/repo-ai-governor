# TK-531 implement session lifecycle service actions and sqlite-backed session projection read model

- Status: planned
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P0
- Project: `project-043-cli-session-shell-productization-rollout`
- Sprint: `sprint-001-session-lifecycle-and-read-model-foundation`

## 1. 任务目标

在 `TK-530` 冻结的 seam 之上，落成 session lifecycle service actions 与 sqlite-backed session projection/read-model，使 CLI 能以 durable truth 驱动 resume/list/fork/archive continuity。

## 2. Depends On

1. `TK-530`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/module-overview.md`
3. `apps/cli/src/runtime/orchestration-service-runtime.ts`
4. `apps/cli/src/types/interfaces/cli-orchestration-service-runtime.interface.ts`

## 3. 预期产物

1. session lifecycle service action implementation
2. sqlite-backed session projection/read-model
3. 对应 integration / rebuild / migration 验证

## 4. Required Inputs

1. `TK-530`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/module-overview.md`
3. `apps/cli/src/runtime/orchestration-service-runtime.ts`
4. `apps/cli/src/types/interfaces/cli-orchestration-service-runtime.interface.ts`
5. `apps/cli/src/runtime/interactive-shell/session-shell-service-client.ts`

## 5. Traceback References

1. `.repo-ai-governor/draft/runtime-session-durable-memory-and-sqlite-fs-cutover-technical-solution.md`
2. `.repo-ai-governor/context/dev/project-043-cli-session-shell-productization-rollout/plan.md`
3. `.repo-ai-governor/context/dev/project-043-cli-session-shell-productization-rollout/sprint-001-session-lifecycle-and-read-model-foundation/plan.md`

## 6. 实施计划

1. 扩展 orchestration runtime / DTO interface，承载 lifecycle action seam。
2. 在 durable storage 方向上落成 session projection/read-model，并提供 rebuild/update path。
3. 为 lifecycle action 与 projection 读写补齐 integration / migration / rebuild 验证。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. 后续实现窗口需补 session lifecycle integration tests 与 projection rebuild tests

## 8. Delivery Verification

1. 后续实现完成并宣告 `completed` 前，必须补 `pnpm run build`
2. 后续实现完成并宣告 `completed` 前，必须补 session lifecycle integration / projection rebuild / migration evidence
3. 后续实现完成并宣告 `completed` 前，必须通过 `node ./scripts/governance/check-task-ledger-sync.js` 与 `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；承接 lifecycle service action 与 sqlite-backed session projection 实现。

## 10. 产出

1. 待执行：session lifecycle service action implementation
2. 待执行：session projection/read-model implementation
3. 待执行：lifecycle/projection verification evidence
