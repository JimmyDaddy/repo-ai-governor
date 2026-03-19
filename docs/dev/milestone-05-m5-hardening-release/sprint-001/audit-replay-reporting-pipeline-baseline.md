# 审计回放报告链路基线（TK-506）

- Status: active
- Date: 2026-03-19
- Milestone: `M5`
- Sprint: `sprint-001`
- Task: `TK-506`

## 1. 目标

构建审计回放报告链路基线，覆盖事件采集、回放重建、证据归档、报告输出全流程。

## 2. 链路范围

1. 采集：workspace/session/memory/policy/notification 关键事件。
2. 回放：按 `execution_session_id` 重建执行路径。
3. 报告：输出面向治理与发布的双视图结果。
4. 审计：保留最小必要字段并支持抽样核验。

## 3. 回放报告模型（Draft）

```ts
enum ReplayEvidenceType {
  AuditEvent = "audit-event",
  SessionSnapshot = "session-snapshot",
  PolicyDecision = "policy-decision",
  NotificationReceipt = "notification-receipt",
}

enum ReplayReportAudience {
  Engineering = "engineering",
  Governance = "governance",
  Release = "release",
}

enum ReplayPipelineResult {
  Passed = "passed",
  Failed = "failed",
  Partial = "partial",
}
```

CS-009 落地要求：有限集合在实现阶段统一落到常量层。

## 4. 输出要求

1. 报告包含执行摘要、关键决策链、异常定位。
2. 每条证据可回链源事件与时间戳（秒级）。
3. 报告结构同时支持机器消费与人工审阅。

## 5. 后续任务输入映射

1. `TK-514`：消费报告模型收口可观测与报告基线。
2. `TK-515`：消费证据保留字段对齐数据隐私与保留策略。
3. `TK-516`：消费审计回放报告作为 GA readiness 关键材料。

## 6. 验收标准

1. 回放链路字段完整且可追溯。
2. 报告视图满足技术与治理双重消费。
3. 可直接接入后续发布评审流程。
