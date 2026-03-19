# 适配能力矩阵与降级策略基线（TK-404）

- Status: active
- Date: 2026-03-19
- Milestone: `M4`
- Sprint: `sprint-001`
- Task: `TK-404`

## 1. 目标

统一 Codex/Copilot/Claude 三类 adapter 的能力矩阵模型与降级策略，形成可配置、可审计、可阻断的路由决策依据。

## 2. 能力矩阵契约（Draft）

```ts
enum AdapterRouteKey {
  Planning = "planning",
  Coding = "coding",
  Testing = "testing",
  Reviewing = "reviewing",
}

enum AdapterCapabilityLevel {
  Full = "full",
  Partial = "partial",
  Unsupported = "unsupported",
}

enum DegradationDecision {
  UsePrimary = "use-primary",
  Fallback = "fallback",
  Escalate = "escalate",
  Block = "block",
}
```

CS-009 落地要求：有限集合在代码实现阶段统一落到 `src/constants/`。

## 3. 路由与降级规则

1. 每个 `routeKey` 绑定 `primary surface + fallback surfaces`。
2. primary 能力等级为 `full` 时优先执行 primary。
3. primary 为 `partial/unsupported` 时按策略尝试 fallback。
4. fallback 全不可用时触发 `escalate`；命中高风险策略时直接 `block`。

## 4. 最小矩阵维度

1. `surface`
2. `route_key`
3. `tool_calling_level`
4. `structured_output_level`
5. `streaming_level`
6. `confirmation_callback_level`
7. `degradation_policy_ref`

## 5. 审计要求

1. 每次路由决策必须记录：
   - `route_key`
   - `primary_surface`
   - `selected_surface`
   - `degradation_decision`
   - `policy_outcome`
2. 降级失败必须记录失败原因并回链 `execution_session_id`。

## 6. 后续任务输入映射

1. `TK-405`：消费矩阵定义补齐契约测试维度与覆盖目标。
2. `TK-406`：消费路由冻结规则收敛 CLI 路由设计。
3. `TK-416`：消费降级策略作为兼容性回归输入。

## 7. 验收标准

1. 三工具能力矩阵字段一致可比较。
2. 降级决策语义可执行且可审计。
3. 下游测试与路由任务可直接复用。
