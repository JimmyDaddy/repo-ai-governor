# checklist

- [x] TK-032 Role Registry 与 Role Profile 生命周期基线
  - 2026-03-21: 任务启动，状态切换为 `in_progress`，开始实现 role registry 契约、config roles 校验与 runtime 角色消费接线。
  - 2026-03-21: 完成 `packages/core-role-registry` 基线、`config roles` 校验与 `core-runtime` 角色解析接线，并补齐包级测试覆盖。
  - 2026-03-21: 通过 `pnpm run typecheck`、`pnpm run test:packages -- packages/config/test/config.unit.test.ts packages/core-role-registry/test/role-registry.unit.test.ts packages/core-runtime/test/process-runtime-engine.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run check`，任务状态切换为 `completed`。
- [x] TK-033 Agent 协议与 Capability Matrix 基线
  - 2026-03-21: 任务启动，状态切换为 `in_progress`，开始落地 `probe/invokeStage/streamEvents/requestConfirmation/cancel` 协议与 capability matrix 契约。
  - 2026-03-21: 完成 `packages/adapter-sdk` 契约基线（协议抽象类、capability matrix、fallback evaluator）并补齐包级测试与 alias 接线。
  - 2026-03-21: 通过 `pnpm install`、`pnpm run test:packages -- packages/adapter-sdk/test/agent-capability-evaluator.unit.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run typecheck`、`pnpm run check`，任务状态切换为 `completed`。
- [x] TK-034 Adapter SDK 与 routeKey 主备路由基线
  - 2026-03-21: 任务启动，状态切换为 `in_progress`，开始实现 `routeKey` 主路由/备路由解析、能力降级回退与标准化错误映射。
  - 2026-03-21: 完成 `AgentRouteRegistry`、`AgentRouteRunner`、`AgentProtocolErrorMapper`，并补齐 route fallback smoke 测试覆盖。
  - 2026-03-21: 通过 `pnpm run test:packages -- packages/adapter-sdk/test/agent-capability-evaluator.unit.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run typecheck`、`pnpm run check`，任务状态切换为 `completed`。
- [x] TK-035 sprint-001 出口验收与 sprint-002 输入约束
  - 2026-03-21: 任务启动，状态切换为 `in_progress`，开始汇总 sprint-001 验收证据并沉淀 sprint-002 输入约束。
  - 2026-03-21: 产出 `DA-044` 与 `DA-045`，并更新 `TK-038` 对 `DA-045` 的显式依赖回链。
  - 2026-03-21: 通过 `node ./scripts/governance/reconcile-artifact-dependencies.js`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-artifact-registry-lifecycle.js`、`pnpm run check`，任务状态切换为 `completed`。
