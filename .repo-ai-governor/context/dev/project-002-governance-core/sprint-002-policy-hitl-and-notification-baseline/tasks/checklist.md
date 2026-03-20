# checklist

- [x] TK-017 Change Risk Evaluator 基线
  - 2026-03-20: 任务启动，状态切换为 `in_progress`，开始实现 `core-change-risk` 风险事实归一化契约。
  - 2026-03-20: 完成交付，新增 `packages/core-change-risk` 与 `change-risk-evaluator` smoke 覆盖，并通过 `pnpm run typecheck`、`pnpm run test -- change-risk-evaluator.smoke.test.ts`、`pnpm run check`。
- [x] TK-018 Policy Gate Engine 基线
  - 2026-03-20: 任务启动，状态切换为 `in_progress`，开始实现 `core-policy` 策略规则引擎与 HITL 回灌契约。
  - 2026-03-20: 完成交付，新增 `packages/core-policy` 与 `policy-gate-engine` smoke 覆盖，并通过 `pnpm run typecheck`、`pnpm run test -- policy-gate-engine.smoke.test.ts`、`pnpm run check`。
  - 2026-03-20: 复核 `review_tk-017-tk-018-policy-risk-batch.md` 并完成修复：补齐 `riskLevel` 校验、HITL 错误码精度、`REVISE` 路径覆盖与架构依赖约束声明。
- [ ] TK-019 HITL 与 Notification Dispatcher 基线
- [ ] TK-020 sprint-002 出口验收与回滚基线
