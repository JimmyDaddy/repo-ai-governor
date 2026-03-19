# 超时/取消/并发冲突恢复基线（TK-306）

- Status: active
- Date: 2026-03-19
- Milestone: `M3`
- Sprint: `sprint-001`
- Task: `TK-306`

## 1. 目标

定义执行中断（timeout/cancelled/concurrency_conflict）的分类处理、恢复策略与回滚边界，形成可执行恢复模型并与 session 快照/审计一致。

## 2. 恢复契约（Draft）

```ts
enum InterruptionType {
  Timeout = "timeout",
  Cancelled = "cancelled",
  ConcurrencyConflict = "concurrency-conflict",
}

enum RecoveryAction {
  Retry = "retry",
  ResumeFromSnapshot = "resume-from-snapshot",
  Rollback = "rollback",
  Escalate = "escalate",
  Abort = "abort",
}

enum RecoveryStatus {
  Recovered = "recovered",
  Partial = "partial",
  Failed = "failed",
}
```

## 3. 决策矩阵

1. `timeout`：优先 `retry`，超阈值后 `escalate/abort`。
2. `cancelled`：保留中断快照并 `abort`。
3. `concurrency_conflict`：优先 `resume-from-snapshot`，无法合并则 `escalate`。

## 4. 审计与会话要求

1. 必填字段：`cancellation_reason`, `timeout_scope`, `interruption_type`, `recovery_action`。
2. 恢复前后必须落快照并追加 session 事件。

## 5. 后续任务输入映射

1. `TK-316`：作为端到端中断恢复回归输入。
2. `TK-416`：作为兼容性回归中的异常恢复输入。

## 6. 验收标准

1. 中断分类、恢复动作与结果语义已固定。
2. 与 M2 错误模型与 session 快照契约保持一致。
3. 产物已登记依赖注册表并被至少两个后续任务回链消费。
