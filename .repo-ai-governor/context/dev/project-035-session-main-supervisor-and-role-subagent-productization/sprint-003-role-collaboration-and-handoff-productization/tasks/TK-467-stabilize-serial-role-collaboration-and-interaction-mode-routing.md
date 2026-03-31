# TK-467 stabilize serial role collaboration and interaction-mode routing

- Status: planned
- Date: 2026-03-31
- Owner: AI-Agent
- Priority: P0
- Project: `project-035-session-main-supervisor-and-role-subagent-productization`
- Sprint: `sprint-003-role-collaboration-and-handoff-productization`

## 1. 任务目标

让 `session.main` supervisor 稳定支持至少一条真实 serial collaboration 路径，并把 direct answer / single-role delegate / serial collaboration / command handoff 的 interaction mode 路由收敛为可审计结果。

## 2. Depends On

1. `TK-466`

## 3. 预期产物

1. `SessionMainIntentRouter` 决策矩阵稳定化
2. 一条真实 `planner -> reviewer` 或等价 serial collaboration path
3. `interactionMode / routerDecisionReason / invokedRoleIds[]` 最小 metadata 回灌
4. serial collaboration 相关 regression coverage

## 4. 验证

1. `pnpm run build`
2. serial collaboration 相关 `apps/cli` / `packages/core-orchestration-service` regression tests
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 5. Execution Notes

1. 2026-03-31：任务创建，状态初始化为 `planned`；优先锁定一条稳定 serial path，而不是一开始就把所有 roles 都做成自由组合。
