# 通知回退通道抽象基线（TK-312）

- Status: active
- Date: 2026-03-19
- Milestone: `M3`
- Sprint: `sprint-002`
- Task: `TK-312`

## 1. 目标

在 webhook 基线之上建立通知回退通道抽象，统一 email/chat-im/issue-system 的接入与失败升级语义。

## 2. 回退契约（Draft）

```ts
enum NotificationFallbackChannel {
  Email = "email",
  ChatIM = "chat-im",
  IssueSystem = "issue-system",
}

enum NotificationFallbackPolicy {
  Ordered = "ordered",
  RiskBased = "risk-based",
}

enum NotificationFallbackResult {
  Delivered = "delivered",
  Escalated = "escalated",
  Exhausted = "exhausted",
}
```

CS-009 落地要求：以上有限集合在代码实现阶段集中到 `src/constants/` 管理。

## 3. 风险分级路由（基线）

1. `medium`：`webhook -> chat-im`。
2. `high`：`webhook -> chat-im -> email`。
3. `critical`：`webhook -> chat-im -> email -> issue-system`。

## 4. 失败与升级

1. 单通道失败记录 `channel`, `attempt`, `error_type`。
2. 全链路失败输出 `exhausted` 并触发 `escalate`。
3. 升级后必须携带原始通知上下文与失败摘要。

## 5. 后续任务输入映射

1. `TK-316`：验证多通道回退链路与升级闭环。
2. `TK-416`：验证不同执行环境的通道兼容行为。

## 6. 验收标准

1. 回退链路可配置、可扩展、可审计。
2. 风险等级与通道路由策略可解释。
3. 通道耗尽后升级路径明确。
