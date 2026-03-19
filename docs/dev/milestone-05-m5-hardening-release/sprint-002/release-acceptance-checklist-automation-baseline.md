# 发布验收 checklist 自动化基线（TK-513）

- Status: active
- Date: 2026-03-19
- Milestone: `M5`
- Sprint: `sprint-002`
- Task: `TK-513`

## 1. 目标

定义发布验收 checklist 自动化基线，把契约覆盖、门禁稳定、版本策略、发布流程、产物完整性等输入自动汇总为可执行发布准入清单。

## 2. 自动化输入域

1. 契约覆盖结果。
2. integration/e2e 主链路结果。
3. 依赖边界与产物完整性门禁结果。
4. 版本策略门禁与发布阶段门禁结果。
5. 迁移与回滚演练记录。

## 3. Checklist 自动化模型（Draft）

```ts
enum ChecklistItemSource {
  ContractCoverage = "contract-coverage",
  IntegrationE2e = "integration-e2e",
  DependencyBoundary = "dependency-boundary",
  ArtifactIntegrity = "artifact-integrity",
  VersionPolicy = "version-policy",
  ReleaseFlow = "release-flow",
  MigrationRollback = "migration-rollback",
}

enum ChecklistItemStatus {
  Passed = "passed",
  Failed = "failed",
  Blocked = "blocked",
  Waived = "waived",
}

enum ChecklistGenerationMode {
  Full = "full",
  Delta = "delta",
}
```

CS-009 落地要求：有限集合在实现阶段集中管理。

## 4. 自动化规则

1. 每个输入域至少生成 1 条强制验收项。
2. 关键项失败自动标记 release block。
3. `waived` 需要审批人和理由。
4. 清单输出支持机器与人工双视图。

## 5. 输出产物

1. 自动化 checklist schema。
2. 失败条目摘要与重试建议。
3. 发布审计附录（who/when/why）。

## 6. 后续任务输入映射

1. `TK-516`：消费自动化 checklist 结果作为 GA readiness 评审核心材料。

## 7. 验收标准

1. 自动化清单生成规则可执行。
2. 关键失败可直接阻断发布。
3. 结果可追踪可审计。
