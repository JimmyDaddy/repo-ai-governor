# TK-465 bootstrap service-owned session.main supervisor and direct answer path

- Status: planned
- Date: 2026-03-31
- Owner: AI-Agent
- Priority: P0
- Project: `project-035-session-main-supervisor-and-role-subagent-productization`
- Sprint: `sprint-002-answer-supervisor-and-role-subagent-bootstrap`

## 1. 任务目标

在 `session.main` 上建立最小可工作的 supervisor bootstrap：让普通问句通过 service-owned runtime 产出真实 `assistantMessage`，并把 `interactionMode / selectedSurface / selectedBy` 回灌到 shared session truth。

## 2. Depends On

1. `TK-464`

## 3. 预期产物

1. `SessionMainSupervisorRuntimeContract` 与最小 `turn context / outcome` 结构
2. `session.main.answer` direct answer path
3. `TURN_COMPLETED` payload 最小 supervisor metadata 回灌
4. CLI / resume transcript 对真实 answer 的 consumer-side regression

## 4. 验证

1. `pnpm run build`
2. 相关 `apps/cli` / `packages/core-orchestration-service` regression tests
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 5. Execution Notes

1. 2026-03-31：任务创建，状态初始化为 `planned`；目标是先解决“进入 session.main 但没有真回答”的最小产品缺口。
