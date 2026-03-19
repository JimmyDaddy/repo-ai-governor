# 数据隐私与保留策略验收基线（TK-515）

- Status: active
- Date: 2026-03-19
- Milestone: `M5`
- Sprint: `sprint-002`
- Task: `TK-515`

## 1. 目标

建立数据隐私与保留策略验收基线，明确哪些数据可收集、可保留、可删除，并把策略约束接入发布验收链路。

## 2. 验收范围

1. 审计与回放数据字段分级。
2. 依赖产物与执行日志保留窗口。
3. 敏感字段脱敏与访问控制。
4. 过期数据清理与审计追踪。

## 3. 策略模型（Draft）

```ts
enum DataClassification {
  Public = "public",
  Internal = "internal",
  Sensitive = "sensitive",
  Restricted = "restricted",
}

enum RetentionAction {
  Retain = "retain",
  Anonymize = "anonymize",
  Delete = "delete",
}

enum PrivacyComplianceResult {
  Passed = "passed",
  Failed = "failed",
  Waived = "waived",
}
```

CS-009 落地要求：有限集合在实现阶段统一管理。

## 4. 验收规则

1. `sensitive/restricted` 字段默认禁止长周期保留。
2. 所有保留策略必须有 legal/governance 依据。
3. 删除和脱敏动作必须有审计记录。
4. 违规策略阻断发布评审。

## 5. 输出产物

1. 数据分类与保留策略清单。
2. 验收结果与例外审批记录。
3. 生命周期操作审计模板。

## 6. 后续任务输入映射

1. `TK-516`：消费隐私与保留验收结果作为 GA readiness 必选项。

## 7. 验收标准

1. 数据策略与实际产物链路一致。
2. 违规场景可检测、可阻断、可追责。
3. 能直接用于最终发布评审。
