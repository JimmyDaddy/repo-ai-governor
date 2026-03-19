# 权限/风险门禁在入口层收口基线（TK-414）

- Status: active
- Date: 2026-03-19
- Milestone: `M4`
- Sprint: `sprint-002`
- Task: `TK-414`

## 1. 目标

在 CLI 入口层统一收敛权限校验与风险门禁触发点，确保核心执行在进入运行前完成一致的准入判断与人工介入触发。

## 2. 收口原则

1. 入口层只负责触发门禁，不在本层实现复杂业务策略。
2. 风险判定由 `core-policy` 执行，入口层消费判定结果。
3. 命中 `confirm/escalate/reject` 时统一走通知与 HITL 链路。

## 3. 门禁决策契约（Draft）

```ts
enum EntryRiskLevel {
  Low = "low",
  Medium = "medium",
  High = "high",
  Critical = "critical",
}

enum EntryGateDecision {
  Allow = "allow",
  Confirm = "confirm",
  Escalate = "escalate",
  Reject = "reject",
}

enum EntryGateFailureCategory {
  PermissionDenied = "permission-denied",
  PolicyBlocked = "policy-blocked",
  CapabilityMismatch = "capability-mismatch",
  Timeout = "timeout",
}
```

CS-009 落地要求：有限集合在实现阶段集中管理。

## 4. 门禁执行时序

1. CLI 解析命令并生成执行请求。
2. 入口层调用 policy gate 评估风险与权限。
3. `allow` 直接进入核心执行；其他决策写入审计并触发通知。
4. 人工决策回灌后重试或终止，结果写回 session。

## 5. 通知与审计联动

1. `confirm/escalate` 必须携带通知通道与回执状态。
2. 所有 `reject` 结果记录阻断原因、策略规则 ID 与时间戳。
3. 同步关联 `execution_session_id` 与 `workspace_id`。

## 6. 后续任务输入映射

1. `TK-416`：消费门禁决策路径执行兼容回归。
2. `TK-503`：消费入口门禁收口模型切换依赖边界检查为 blocking。
3. `TK-512`：消费失败类别与回滚决策构建迁移/回滚手册。

## 7. 验收标准

1. 权限与风险门禁触发点在入口层统一。
2. 决策结果可被通知与 HITL 闭环消费。
3. 阻断路径具备完整审计与可回放能力。
