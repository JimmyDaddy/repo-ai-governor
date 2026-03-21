# verified_review_tk-033-agent-protocol-and-capability-matrix-baseline

- Status: verified
- Date: 2026-03-21
- Task: `TK-033`
- Scope: `adapter-sdk protocol contract + capability matrix baseline`

## 1. 审核结论

1. 通过。已交付统一 Agent 协议（`probe/invokeStage/streamEvents/requestConfirmation/cancel`）与 capability matrix 契约，并包含超时/取消与降级 fallback 的可消费语义。

## 2. 已核验证据

1. 新增 `packages/adapter-sdk` 包并暴露 `AgentProtocol` 抽象类与协议接口契约。
2. 新增 capability matrix 相关 enum 与 `AgentCapabilityEvaluator`，可输出 `unsupported/degraded` 差距与 fallback action。
3. `shared` 层新增 Agent 协议/能力矩阵标准错误码，满足统一错误模型约束。
4. 新增 `packages/adapter-sdk/test/agent-capability-evaluator.unit.test.ts` 覆盖能力满足、降级、不可用、fallback 覆写与协议抽象类可实现路径。

## 3. 验证命令

1. `pnpm install`（通过）
2. `pnpm run test:packages -- packages/adapter-sdk/test/agent-capability-evaluator.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run typecheck`（通过）
4. `pnpm run check`（通过）

## 4. 风险与后续

1. 本任务完成协议与能力契约基线，`routeKey` 主备路由与多 surface 降级编排将在 `TK-034` 落地实现。
