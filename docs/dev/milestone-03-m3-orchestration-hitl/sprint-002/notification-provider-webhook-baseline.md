# Notification Provider Webhook 基线（TK-311）

- Status: active
- Date: 2026-03-19
- Milestone: `M3`
- Sprint: `sprint-002`
- Task: `TK-311`

## 1. 目标

建立 webhook 通知 provider 的最小可用契约，确保 HITL `confirm/escalate` 场景可稳定通知并回写审计字段。

## 2. Provider 契约（Draft）

```ts
enum NotificationChannelType {
  Webhook = "webhook",
}

enum NotificationDeliveryStatus {
  Sent = "sent",
  Retrying = "retrying",
  Failed = "failed",
  FallbackTriggered = "fallback-triggered",
}

enum NotificationErrorType {
  Network = "network",
  Timeout = "timeout",
  InvalidPayload = "invalid-payload",
  Unauthorized = "unauthorized",
}
```

CS-009 落地要求：以上有限集合在代码实现阶段集中到 `src/constants/` 管理。

## 3. 最小通知载荷

1. `execution_id`
2. `execution_session_id`
3. `stage_id`
4. `route_key`
5. `risk_level`
6. `required_action`
7. `deadline_at`
8. `notified_at_display`

## 4. 可靠性策略

1. 主渠道固定为 `webhook`。
2. 失败后执行 `retry + backoff`。
3. 达到阈值后输出 `fallback-triggered`，由 `TK-312` 的回退策略接管。
4. 每次发送结果必须写入审计事件（`notification_channel`, `notification_status`）。

## 5. 后续任务输入映射

1. `TK-312`：消费 webhook 失败模型扩展多通道回退。
2. `TK-316`：消费 webhook 触发与失败回退路径做 E2E 回归。
3. `TK-416`：消费通知兼容性与降级行为做跨阶段回归。

## 6. 验收标准

1. webhook provider 输入输出与错误模型清晰。
2. 通知结果可追踪到审计字段。
3. 与 HITL 决策触发点可直接衔接。
