# TK-537 implement session note persistence projection and session-shell startup lazy-load cutover

- Status: planned
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P1
- Project: `project-043-cli-session-shell-productization-rollout`
- Sprint: `sprint-003-session-note-and-startup-budget`

## 1. 任务目标

在 `TK-536` 冻结的边界之上，落成 session note persistence/projection，并把 session-first startup path 切到明确的 lazy-load boundary 与 budget instrumentation。

## 2. Depends On

1. `TK-536`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/module-overview.md`
3. `apps/cli/src/main.ts`
4. `apps/cli/src/runtime/interactive-shell/session-shell-service-client.ts`

## 3. 预期产物

1. session note persistence/projection implementation
2. session-shell startup lazy-load cutover
3. startup instrumentation evidence

## 4. Required Inputs

1. `TK-536`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/module-overview.md`
3. `apps/cli/src/main.ts`
4. `apps/cli/src/runtime/interactive-shell/session-shell-service-client.ts`
5. `.repo-ai-governor/draft/cli-borrowed-capabilities-productization-technical-solution.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-043-cli-session-shell-productization-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-043-cli-session-shell-productization-rollout/sprint-003-session-note-and-startup-budget/plan.md`
3. `.repo-ai-governor/draft/runtime-session-durable-memory-and-sqlite-fs-cutover-technical-solution.md`

## 6. 实施计划

1. 在 orchestration/durable-storage seam 上补 session note persistence 与 projection。
2. 将 session-first startup path 切到明确的 lazy-load boundary 与 budget instrumentation。
3. 补齐 note / startup path 的 targeted verification 与 diagnostics evidence。

## 7. Development Verification

1. 后续实现窗口需补 session note projection tests
2. 后续实现窗口需补 startup lazy-load regression checks
3. `node ./scripts/governance/check-task-ledger-sync.js`

## 8. Delivery Verification

1. 后续实现完成并宣告 `completed` 前，必须补 `pnpm run build`
2. 后续实现完成并宣告 `completed` 前，必须补 session note projection / startup diagnostics evidence
3. 后续实现完成并宣告 `completed` 前，必须通过 `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；承接 session note persistence 与 startup lazy-load cutover 实现。

## 10. 产出

1. 待执行：session note persistence/projection implementation
2. 待执行：startup lazy-load cutover
3. 待执行：startup instrumentation evidence
