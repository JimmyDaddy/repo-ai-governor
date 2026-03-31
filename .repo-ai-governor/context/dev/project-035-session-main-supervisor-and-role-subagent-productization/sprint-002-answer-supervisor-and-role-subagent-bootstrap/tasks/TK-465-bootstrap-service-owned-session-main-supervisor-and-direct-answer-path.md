# TK-465 bootstrap service-owned session.main supervisor and direct answer path

- Status: completed
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
2. 2026-03-31：`sprint-002` 已显式激活；当前进入实现阶段，先读取 `session.main` 现有 runtime / dispatcher / transcript consumption seam，收敛最小 direct answer contract。
3. 2026-03-31：已完成 `SessionMainSupervisorRuntimeContract`、`SessionMainSupervisorTurnContext/Outcome`、`interactionMode` 常量与 shared session payload 回灌；`LocalOrchestrationServiceSessionRuntime` 现可通过注入 seam 产出真实 `assistantMessage`。
4. 2026-03-31：CLI 侧已新增 `CliSessionMainSupervisorRuntime`，通过现有 `CliAdapterRoutingRuntime + AgentRouteRunner` 执行 `session.main.answer` direct answer path，并通过 `embeddedShellDependencies` 注入 session shell owner runtime。
5. 2026-03-31：已补齐 core shell direct-answer payload、CLI route-runner direct answer 与 session shell resume markdown answer parity regressions，并通过 `pnpm run build` 验证。
6. 2026-03-31：working-tree CR 认可 direct-answer governance bypass 风险后，已补充 no-tool direct-answer hard guard；unsafe surface 现仅允许 safe fallback 或 governed fallback answer，并补齐“tool-capable surface 不会被 invoke”回归。
