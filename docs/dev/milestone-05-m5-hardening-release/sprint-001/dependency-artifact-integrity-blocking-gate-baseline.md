# 依赖产物完整性切换为 blocking gate 基线（TK-507）

- Status: active
- Date: 2026-03-19
- Milestone: `M5`
- Sprint: `sprint-001`
- Task: `TK-507`

## 1. 目标

把依赖产物完整性检查从提示模式切换为发布阻断门禁，确保任务链路依赖的产物存在、状态有效、引用一致。

## 2. 检查维度

1. 产物存在性：`artifact_path` 可访问。
2. 状态有效性：registry 中 `status=active`。
3. 引用一致性：`dependent_tasks` 与任务卡 `Depends On/Input References` 一致。
4. 新鲜度检查：`last_updated_at` 未超过策略阈值。

## 3. 完整性门禁模型（Draft）

```ts
enum ArtifactIntegrityIssueType {
  MissingArtifact = "missing-artifact",
  InactiveArtifact = "inactive-artifact",
  DependencyMismatch = "dependency-mismatch",
  StaleArtifact = "stale-artifact",
}

enum ArtifactIntegrityGateMode {
  WarningOnly = "warning-only",
  Blocking = "blocking",
}

enum ArtifactIntegrityGateResult {
  Passed = "passed",
  Failed = "failed",
}
```

CS-009 落地要求：有限集合在实现阶段集中管理。

## 4. 执行策略

1. 本地开发允许 warning 预检。
2. CI/release 流程默认 blocking。
3. 任一完整性问题触发失败并输出修复建议。

## 5. 输出产物

1. 机器可读完整性检查结果。
2. 人类可读问题摘要与修复提示。
3. 检查统计与趋势快照。

## 6. 后续任务输入映射

1. `TK-511`：消费完整性阻断稳定率作为质量门禁指标。
2. `TK-513`：消费完整性检查接入发布验收 checklist 自动化。
3. `TK-515`：消费产物存续状态映射数据保留策略。

## 7. 验收标准

1. 依赖产物缺失或不一致可稳定阻断。
2. 报告口径与修复建议清晰可执行。
3. 与边界门禁、版本门禁可组合运行。
