# 质量门禁稳定性达标基线（TK-511）

- Status: active
- Date: 2026-03-19
- Milestone: `M5`
- Sprint: `sprint-002`
- Task: `TK-511`

## 1. 目标

定义质量门禁稳定性达标基线，确保关键 gate 在连续执行窗口内具备稳定通过率、低波动和可解释失败分布。

## 2. 稳定性范围

1. 契约测试 gate 稳定性。
2. integration/e2e 主链路 gate 稳定性。
3. 依赖边界与依赖产物完整性 gate 稳定性。
4. 版本策略与发布准入 gate 稳定性。

## 3. 稳定性指标模型（Draft）

```ts
enum QualityGateType {
  Contract = "contract",
  IntegrationE2e = "integration-e2e",
  DependencyBoundary = "dependency-boundary",
  ArtifactIntegrity = "artifact-integrity",
  VersionPolicy = "version-policy",
  ReleaseReadiness = "release-readiness",
}

enum GateStabilityLevel {
  Stable = "stable",
  Flaky = "flaky",
  Unstable = "unstable",
}

enum GateTrendDirection {
  Improving = "improving",
  Flat = "flat",
  Degrading = "degrading",
}
```

CS-009 落地要求：有限集合在实现阶段统一落到常量层。

## 4. 达标阈值

1. 关键 gate 近 20 次执行通过率 >= 95%。
2. flakiness 触发率 <= 3%。
3. 平均恢复时间（MTTR）<= 1 day。
4. 无未解释 blocker。

## 5. 输出产物

1. gate 稳定性面板字段定义。
2. 波动根因分类与处置建议模板。
3. 与发布验收项映射关系。

## 6. 后续任务输入映射

1. `TK-513`：消费稳定性指标自动生成发布验收条目。
2. `TK-516`：消费稳定性结论作为 GA readiness 核心结论。

## 7. 验收标准

1. 稳定性指标、阈值、趋势语义清晰。
2. 可直接连接到发布验收与最终评审。
3. 结果口径可审计且可追踪。
