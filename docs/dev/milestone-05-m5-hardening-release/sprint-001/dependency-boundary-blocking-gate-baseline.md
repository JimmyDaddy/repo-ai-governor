# 依赖边界检查切换为 blocking gate 基线（TK-503）

- Status: active
- Date: 2026-03-19
- Milestone: `M5`
- Sprint: `sprint-001`
- Task: `TK-503`

## 1. 目标

将依赖方向与跨层引用检查从 warning 模式切换为 blocking gate，在边界违规时阻断 CI 与发布流程。

## 2. 阻断范围

1. packages 层反向依赖。
2. apps 直接跨越 adapter-sdk 访问底层实现。
3. 未在架构允许方向内的跨包引用。
4. 临时白名单过期未清理条目。

## 3. 门禁模型（Draft）

```ts
enum BoundaryViolationSeverity {
  Warning = "warning",
  Error = "error",
  Critical = "critical",
}

enum BoundaryGateMode {
  WarningOnly = "warning-only",
  Blocking = "blocking",
}

enum BoundaryGateResult {
  Passed = "passed",
  Failed = "failed",
}
```

CS-009 落地要求：有限集合在实现阶段集中落到常量层。

## 4. 执行策略

1. 本地开发可保留 warning 预检提示。
2. CI 与 release 流程统一使用 blocking 模式。
3. 任一 `error/critical` 违规触发非零退出码。
4. 违规报告必须带 `source_pkg -> target_pkg -> rule_id`。

## 5. 输出产物

1. 可机读违规报告（json/csv）。
2. 可人读违规摘要（markdown）。
3. 白名单审计差异报告。

## 6. 后续任务输入映射

1. `TK-511`：消费 gate 稳定率与违规趋势指标。
2. `TK-513`：消费 blocking 结果接入发布验收 checklist。
3. `TK-515`：消费违规类型映射数据治理与保留策略。

## 7. 验收标准

1. 边界违规可稳定阻断关键链路。
2. 报告产物可用于审计和回归。
3. 与发布阶段门禁策略可组合执行。
