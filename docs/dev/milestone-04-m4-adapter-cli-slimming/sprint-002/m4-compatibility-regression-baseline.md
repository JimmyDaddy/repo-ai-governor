# M4 兼容性回归基线（TK-416）

- Status: active
- Date: 2026-03-19
- Milestone: `M4`
- Sprint: `sprint-002`
- Task: `TK-416`

## 1. 目标

建立 M4 兼容性回归闭环，覆盖 adapter 模块化、CLI 瘦身、入口门禁、slot 安全与性能阈值，验证 M4 成果可稳定衔接 M5 质量与发布阶段。

## 2. 回归维度

1. 命令执行兼容：`run/check/review/review-verify`。
2. 适配器兼容：Codex/Copilot/Claude 能力与降级路径。
3. 入口兼容：参数路由、权限门禁、风险阻断。
4. 安全兼容：slot 执行拦截与审计字段。
5. 性能兼容：预算阈值与瓶颈分类稳定性。

## 3. 回归结果模型（Draft）

```ts
enum CompatibilityRegressionResult {
  Passed = "passed",
  Failed = "failed",
  Blocked = "blocked",
}

enum CompatibilitySurface {
  CommandFlow = "command-flow",
  AdapterFlow = "adapter-flow",
  EntryGate = "entry-gate",
  SlotSecurity = "slot-security",
  Performance = "performance",
}

enum CompatibilityEvidenceType {
  ExecutionLog = "execution-log",
  PolicyDecisionTrace = "policy-decision-trace",
  NotificationReceipt = "notification-receipt",
  PerformanceSample = "performance-sample",
}
```

CS-009 落地要求：有限集合在实现阶段统一管理。

## 4. 最小回归场景

1. 三适配器在四命令主路径均可执行。
2. 门禁 `confirm/escalate/reject` 路径可正确触发。
3. slot 高风险路径触发人工确认并可回灌。
4. 性能超过阈值时可正确标记并输出瓶颈类别。

## 5. 回归结论口径

1. `passed`：核心场景全部通过，无 blocker。
2. `failed`：存在功能性失败但可定位并重试。
3. `blocked`：存在策略阻断或关键依赖缺失，需人工处理。

## 6. 后续任务输入映射

1. `TK-511`：消费兼容回归结果定义质量门禁稳定目标。
2. `TK-514`：消费回归证据结构作为报告收口输入。
3. `TK-516`：消费 M4 回归结论作为 GA readiness 评审输入。

## 7. 验收标准

1. M4 关键能力具备统一回归定义与证据类型。
2. 回归结果可直接回链到 session 与策略决策。
3. M5 质量与发布任务可无缝复用。
