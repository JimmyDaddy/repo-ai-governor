# 升级迁移指南与回滚手册基线（TK-512）

- Status: active
- Date: 2026-03-19
- Milestone: `M5`
- Sprint: `sprint-002`
- Task: `TK-512`

## 1. 目标

建立升级迁移和回滚手册基线，保证从旧版本到新版本迁移路径可验证、可回退、可审计。

## 2. 手册范围

1. 升级前检查：环境、配置、数据、依赖产物。
2. 升级步骤：分阶段发布与验证。
3. 回滚策略：触发阈值、回滚步骤、验证与恢复。
4. 事故处理：故障分级、沟通、责任与复盘。

## 3. 迁移回滚模型（Draft）

```ts
enum MigrationPhase {
  Precheck = "precheck",
  Execute = "execute",
  Verify = "verify",
  Complete = "complete",
}

enum RollbackTriggerType {
  GateFailure = "gate-failure",
  CompatibilityRegression = "compatibility-regression",
  DataRisk = "data-risk",
  ManualIntervention = "manual-intervention",
}

enum MigrationRunResult {
  Passed = "passed",
  Failed = "failed",
  RolledBack = "rolled-back",
}
```

CS-009 落地要求：有限集合在实现阶段统一管理。

## 4. 最小回滚链路

1. 检测失败 -> 触发回滚决策。
2. 停止新流量 -> 恢复上一稳定版本。
3. 核验关键链路与数据完整性。
4. 记录回滚证据并输出复盘条目。

## 5. 输出产物

1. 升级与回滚步骤模板。
2. 风险触发矩阵与责任分工。
3. 面向运维与发布的执行清单。

## 6. 后续任务输入映射

1. `TK-513`：消费手册步骤生成自动化验收项。
2. `TK-516`：消费迁移回滚证据作为评审输入。

## 7. 验收标准

1. 升级与回滚路径完整且可执行。
2. 触发条件与责任边界清晰。
3. 可直接用于 GA 前演练与验收。
