# verified_review_tk-034-adapter-sdk-and-routekey-fallback-baseline

- Status: verified
- Date: 2026-03-21
- Task: `TK-034`
- Scope: `adapter-sdk route registry/runner + protocol error mapping + smoke baseline`

## 1. 审核结论

1. 通过。`routeKey` 主备路由、能力降级回退与标准化错误映射基线已完整落地，可作为首批 adapters 的复用底座。

## 2. 已核验证据

1. 新增 `AgentRouteRegistry` 与 `AgentRouteRunner`，实现 `primary -> fallback` 路由选择、能力约束校验和降级回退决策。
2. 新增 `AgentProtocolErrorMapper`，覆盖 `probe/invoke/stream/confirmation/cancel` 的错误码映射。
3. `shared` 错误码新增 adapter-route / adapter-protocol 失败场景，满足统一错误模型约束。
4. 新增 `agent-route-runner.smoke.test.ts`，覆盖路由命中、回退、能力不满足与失败映射关键路径。

## 3. 验证命令

1. `pnpm run test:packages -- packages/adapter-sdk/test/agent-capability-evaluator.unit.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run typecheck`（通过）
3. `pnpm run check`（通过）

## 4. 风险与后续

1. 当前 `routeKey` 基线已覆盖单次 `dispatchStage` 调度，后续 `TK-036` 在接入具体 surface 实现时可继续扩展 stream/confirmation/cancel 的路由执行编排与审计聚合。
