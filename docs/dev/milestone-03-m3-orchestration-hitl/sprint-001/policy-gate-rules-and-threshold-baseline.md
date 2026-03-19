# Policy Gate 规则与阈值基线（TK-303）

- Status: active
- Date: 2026-03-19
- Milestone: `M3`
- Sprint: `sprint-001`
- Task: `TK-303`

## 1. 目标

定义 Policy Gate 的规则模型、风险阈值与路由决策语义，确保执行阶段可稳定输出 `allow/confirm/block/escalate`，并与 compiler issue、HITL、审计链路一致。

## 2. 规则契约（Draft）

```ts
enum PolicyDecision {
  Allow = "allow",
  Confirm = "confirm",
  Block = "block",
  Escalate = "escalate",
}

enum PolicyRiskLevel {
  Low = "low",
  Medium = "medium",
  High = "high",
  Critical = "critical",
}

enum PolicyTriggerType {
  CompileIssue = "compile-issue",
  StageOutput = "stage-output",
  DependencyResolution = "dependency-resolution",
  PermissionScope = "permission-scope",
}
```

CS-009 落地要求：策略有限集合必须集中在 `src/constants/`。

## 3. 阈值基线

1. `low` -> 默认 `allow`。
2. `medium` -> 默认 `confirm`。
3. `high` -> 默认 `escalate`。
4. `critical` -> 默认 `block`。

## 4. 与编译和会话联动

1. `compileErrors>0` 必须 `block`。
2. `compileWarnings>0` 至少 `confirm`。
3. 依赖解析 `missing/incompatible` 必须 `block/escalate`。
4. 决策结果必须写入 session 事件流与审计事件。

## 5. 后续任务输入映射

1. `TK-304`：使用策略决策映射 HITL 模型。
2. `TK-305`：使用策略决策结果设计人工回灌字段。
3. `TK-306`：使用风险等级驱动超时/取消恢复路径。

## 6. 验收标准

1. 决策模型与阈值语义已固定。
2. 与编译、HITL、审计链路具备可执行衔接。
3. 产物已登记依赖注册表并被至少两个后续任务回链消费。
