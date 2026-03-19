# 可观测与报告基线收口（TK-514）

- Status: active
- Date: 2026-03-19
- Milestone: `M5`
- Sprint: `sprint-002`
- Task: `TK-514`

## 1. 目标

收口可观测与报告基线，统一质量门禁、发布链路、审计回放、性能趋势的指标与报表输出模型。

## 2. 收口范围

1. 质量门禁稳定性指标。
2. 发布阶段通过与阻断指标。
3. 审计回放报告指标。
4. 性能基线与瓶颈趋势指标。

## 3. 报告模型（Draft）

```ts
enum ObservabilityMetricDomain {
  QualityGate = "quality-gate",
  ReleaseFlow = "release-flow",
  AuditReplay = "audit-replay",
  Performance = "performance",
}

enum ReportGranularity {
  Daily = "daily",
  Sprint = "sprint",
  Release = "release",
}

enum ReportPublicationStatus {
  Draft = "draft",
  Published = "published",
  Archived = "archived",
}
```

CS-009 落地要求：有限集合在实现阶段统一落到常量层。

## 4. 收口要求

1. 指标命名和口径统一。
2. 报告最小字段满足治理和发布双侧需求。
3. 指标异常可回链到任务、会话和门禁记录。

## 5. 输出产物

1. 指标字典与报表模板。
2. 周期发布与归档策略。
3. 异常告警与责任分发建议。

## 6. 后续任务输入映射

1. `TK-516`：消费统一报表作为 GA readiness 证据集合。

## 7. 验收标准

1. 报告口径统一且可持续维护。
2. 指标与证据可双向回链。
3. 可直接用于 GA 最终评审。
