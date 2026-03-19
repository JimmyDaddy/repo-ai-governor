# M3 端到端编排链路回归基线（TK-316）

- Status: active
- Date: 2026-03-19
- Milestone: `M3`
- Sprint: `sprint-002`
- Task: `TK-316`

## 1. 目标

定义 M3 编排链路端到端回归范围、场景矩阵与验收门禁，覆盖策略路由、通知分发、角色治理与共享 session 协作。

## 2. 回归场景矩阵（基线）

1. `allow` 正常路径：编排通过 -> 阶段完成 -> 审计落盘。
2. `confirm` 路径：触发 webhook 通知 -> 人工决策回灌 -> 流程继续。
3. `escalate` 路径：主渠道失败 -> 多通道回退 -> 人工接管。
4. 自定义角色路径：`role_profile_id` 绑定 routeKey -> Agent/Skill 边界校验。
5. 共享 session 路径：多 Agent 并行写入 -> 冲突检测与 reconcile。
6. 中断恢复路径：timeout/cancelled/concurrency_conflict -> 快照恢复或阻断。

## 3. 回归输出契约（Draft）

```ts
enum RegressionResult {
  Passed = "passed",
  Failed = "failed",
  Blocked = "blocked",
}

enum RegressionCoverageLevel {
  Core = "core",
  Extended = "extended",
}

enum RegressionEvidenceType {
  AuditEvent = "audit-event",
  SessionSnapshot = "session-snapshot",
  NotificationReceipt = "notification-receipt",
}
```

CS-009 落地要求：以上有限集合在代码实现阶段集中到 `src/constants/` 管理。

## 4. 关键验收指标

1. 核心场景通过率 100%。
2. HITL 通知成功或可回退率 100%。
3. 共享 session 冲突事件可追溯率 100%。
4. 端到端执行链路每步都有审计证据。

## 5. 下游任务输入映射

1. `TK-416`：消费 M3 端到端结果作为兼容性回归输入。
2. `TK-516`：消费 M3 回归证据作为 GA readiness 评审输入。

## 6. 验收标准

1. 场景矩阵覆盖 M3 核心能力。
2. 结果输出与证据类型可统一归档。
3. 与 M4/M5 回归与发布评审链路可直接衔接。
