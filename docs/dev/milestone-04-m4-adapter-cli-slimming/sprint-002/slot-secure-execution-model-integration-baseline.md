# Slot 安全执行模型接入基线（TK-413）

- Status: active
- Date: 2026-03-19
- Milestone: `M4`
- Sprint: `sprint-002`
- Task: `TK-413`

## 1. 目标

把 Slot 执行流程接入统一安全模型，确保 slot 输入、执行动作与输出产物在多 Agent 协作场景中具备可校验、可阻断、可审计能力。

## 2. 安全模型范围

1. Slot 输入完整性校验。
2. Slot 执行动作权限校验。
3. Slot 输出产物约束校验。
4. Slot 与 `execution_session_id` 的追踪绑定。

## 3. 安全契约（Draft）

```ts
enum SlotSecurityLevel {
  Low = "low",
  Medium = "medium",
  High = "high",
  Critical = "critical",
}

enum SlotSecurityDecision {
  Allow = "allow",
  Confirm = "confirm",
  Escalate = "escalate",
  Block = "block",
}

enum SlotIntegrityResult {
  Passed = "passed",
  Failed = "failed",
  Missing = "missing",
}
```

CS-009 落地要求：有限集合在实现阶段统一落到常量层。

## 4. 执行拦截点

1. `before_slot_execute`：检查输入契约与来源可信度。
2. `during_slot_execute`：检查权限升级请求与动态风险变化。
3. `after_slot_execute`：检查输出产物类型与敏感信息约束。

## 5. 审计字段

1. `slot_id`、`slot_type`、`security_level`。
2. `security_decision`、`decision_source`。
3. `artifact_fingerprint`、`recorded_at`（秒级时间戳）。

## 6. 后续任务输入映射

1. `TK-414`：消费 slot 安全决策结果收敛入口门禁。
2. `TK-416`：消费安全模型路径进行兼容性回归。
3. `TK-502`：消费 slot 安全链路作为 integration/e2e 主场景输入。

## 7. 验收标准

1. Slot 执行链路具备前中后拦截点。
2. 决策语义可与 HITL 与通知机制衔接。
3. 安全审计字段满足回归与追责需求。
