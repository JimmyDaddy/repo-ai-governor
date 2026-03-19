# HITL 决策模型基线（confirm/escalate/reject，TK-304）

- Status: active
- Date: 2026-03-19
- Milestone: `M3`
- Sprint: `sprint-001`
- Task: `TK-304`

## 1. 目标

定义 HITL 决策状态机与输入输出契约，确保人工介入在 `confirm/escalate/reject` 场景下有统一语义、可追溯事件和可恢复流程。

## 2. 决策契约（Draft）

```ts
enum HumanDecisionType {
  Approve = "approve",
  Reject = "reject",
  Revise = "revise",
  Escalate = "escalate",
}

enum HumanDecisionStatus {
  Pending = "pending",
  Applied = "applied",
  Expired = "expired",
  Cancelled = "cancelled",
}

enum HumanDecisionTimeoutAction {
  Block = "block",
  Escalate = "escalate",
  AutoReject = "auto-reject",
}
```

## 3. 状态机

1. `pending` -> `applied`：收到人工决策并成功回灌。
2. `pending` -> `expired`：超时未处理。
3. `pending` -> `cancelled`：执行链路取消。

## 4. 与 Policy Gate/Notification 联动

1. `confirm` 路径触发 HITL 并等待 `approve/reject/revise`。
2. `escalate` 路径触发升级通知并指定审批组。
3. 决策超时按 `HumanDecisionTimeoutAction` 执行。

## 5. 后续任务输入映射

1. `TK-305`：消费决策记录模型完成回灌链路。
2. `TK-306`：消费超时动作语义完成恢复策略。
3. `TK-311`：消费通知触发点接入 webhook provider。

## 6. 验收标准

1. HITL 状态机与超时语义已固定。
2. 与策略/通知/审计链路接口清晰。
3. 产物已登记依赖注册表并被至少两个后续任务回链消费。
