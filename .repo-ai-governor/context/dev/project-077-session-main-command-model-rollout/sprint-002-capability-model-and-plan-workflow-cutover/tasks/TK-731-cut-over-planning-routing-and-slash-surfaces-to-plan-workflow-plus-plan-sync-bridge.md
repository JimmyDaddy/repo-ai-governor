# TK-731 cut over planning routing and slash surfaces to `/plan` workflow plus `/plan sync` bridge

- Status: completed
- Date: 2026-04-10
- Owner: AI-Agent
- Priority: P0
- Project: `project-077-session-main-command-model-rollout`
- Sprint: `sprint-002-capability-model-and-plan-workflow-cutover`

## 1. 任务目标

把 planning request routing 与 slash surface 切到新的产品心智：`/plan <goal>` 走 AI fixed workflow，`/plan sync` 才桥接 legacy deterministic ledger action。

## 2. Depends On

1. `TK-730`
2. `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`
3. `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`

## 3. 预期产物

1. planning routing cutover
2. slash registry support for `/plan sync`
3. regression coverage for planner workflow vs legacy sync bridge

## 4. Required Inputs

1. `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`
2. `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
3. `apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
4. `apps/cli/test/runtime/session-slash-command-registry.test.ts`

## 5. Traceback References

1. `TK-729`
2. `TK-730`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/session-main-capability-interaction-model-contract.md`

## 6. 实施计划

1. 把 planning request 从 direct command handoff 改到 planner workflow path。
2. 为 `/plan sync` 增加 deterministic bridge，同时保留 `@planner` raw role 协作入口。
3. 增加单测覆盖自然语言 planning request 与 slash routing 的新分层。

## 7. Development Verification

1. `pnpm run build`
2. `pnpm vitest apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts --run`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-10：任务创建，状态初始化为 `planned`。
2. 2026-04-10：把 natural-language planning request 改为在有 supervisor runtime 时隐式委托给 `planner` role，而不再默认桥接裸 `plan --output pretty`。
3. 2026-04-10：为 session shell 增加 `/plan` AI workflow 和 `/plan sync` deterministic bridge 语义，同时保留 hidden `/verify` 兼容入口以等待 sprint-003 正式删除。
4. 2026-04-10：补齐 session-shell / parity / output-contract 回归，确认新的 planning routing 与 discoverability 通过 targeted tests 与 `pnpm run build`。

## 10. 产出

1. 已完成：planning routing cutover
2. 已完成：`/plan sync` bridge and regression coverage
