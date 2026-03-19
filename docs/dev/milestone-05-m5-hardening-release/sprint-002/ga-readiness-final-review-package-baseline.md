# GA readiness 最终评审包基线（TK-516）

- Status: active
- Date: 2026-03-19
- Milestone: `M5`
- Sprint: `sprint-002`
- Task: `TK-516`

## 1. 目标

定义 GA 最终评审包结构与准入规则，把质量、发布、治理、隐私、审计证据统一收口为可决策材料。

## 2. 评审包结构

1. 执行摘要：里程碑目标达成与剩余风险。
2. 质量与测试：契约、integration/e2e、门禁稳定性结论。
3. 发布与回滚：版本策略、分级发布、迁移回滚演练结论。
4. 治理与合规：隐私保留验收、审计回放、可观测报告。
5. 决策与行动：GA 结论与后续行动项。

## 3. 评审决策模型（Draft）

```ts
enum GaReadinessDecision {
  Approve = "approve",
  ConditionalApprove = "conditional-approve",
  Defer = "defer",
  Reject = "reject",
}

enum GaRiskLevel {
  Low = "low",
  Medium = "medium",
  High = "high",
  Critical = "critical",
}

enum GaEvidenceStatus {
  Complete = "complete",
  Partial = "partial",
  Missing = "missing",
}
```

CS-009 落地要求：有限集合在实现阶段统一归档到常量层。

## 4. 准入规则

1. 关键证据 `GaEvidenceStatus=Complete`。
2. 无 `Critical` 风险未处置项。
3. 所有阻断 gate 已清零或有批准豁免。
4. 决策日志可回链任务、产物与执行会话。

## 5. 输出产物

1. GA 最终评审包模板。
2. 决策记录与签核字段定义。
3. 发布后跟踪行动项清单。

## 6. 验收标准

1. 评审包结构完整且可操作。
2. 决策与风险语义明确可审计。
3. 可作为项目 GA 结项依据。
