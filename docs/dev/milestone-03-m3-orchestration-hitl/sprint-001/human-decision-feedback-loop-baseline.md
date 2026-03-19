# 人工决策回灌链路基线（TK-305）

- Status: active
- Date: 2026-03-19
- Milestone: `M3`
- Sprint: `sprint-001`
- Task: `TK-305`

## 1. 目标

定义人工决策回灌模型与写回路径，确保 HITL 决策可稳定回写到 session、memory、audit，并驱动后续阶段继续执行或阻断。

## 2. 回灌契约（Draft）

```ts
enum DecisionFeedbackTarget {
  Session = "session",
  Memory = "memory",
  RuntimeState = "runtime-state",
  Audit = "audit",
}

enum DecisionFeedbackResult {
  Applied = "applied",
  PartiallyApplied = "partially-applied",
  Failed = "failed",
}
```

## 3. 回灌流程

1. 读取待处理决策（`pending`）。
2. 写回 session 事件与 sequence。
3. 写回 memory delta 与决策摘要。
4. 更新 runtime 阶段状态并触发下一跳。
5. 写审计事件并记录结果。

## 4. 失败与补偿

1. 任一路径写回失败必须返回 `partially-applied/failed`。
2. 失败必须触发补偿事件并进入人工确认或恢复流程。

## 5. 后续任务输入映射

1. `TK-306`：复用回灌失败语义进入恢复模型。
2. `TK-316`：作为 M3 E2E 回归的关键链路输入。

## 6. 验收标准

1. 回灌目标与结果语义已固定。
2. 回灌失败可追溯并具备补偿路径。
3. 产物已登记依赖注册表并被至少两个后续任务回链消费。
