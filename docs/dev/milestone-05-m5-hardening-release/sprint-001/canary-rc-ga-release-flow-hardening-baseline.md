# canary -> rc -> ga 发布流程固化基线（TK-505）

- Status: active
- Date: 2026-03-19
- Milestone: `M5`
- Sprint: `sprint-001`
- Task: `TK-505`

## 1. 目标

固化分级发布流程和升级闸门，确保 canary、rc、ga 三阶段可观测、可回滚、可审计。

## 2. 阶段定义

1. canary：小流量验证核心能力与门禁稳定性。
2. rc：预发布候选，执行全量回归与签核。
3. ga：正式发布，进入稳定运维窗口。

## 3. 发布流程模型（Draft）

```ts
enum ReleaseStage {
  Canary = "canary",
  Rc = "rc",
  Ga = "ga",
}

enum ReleasePromotionDecision {
  Promote = "promote",
  Hold = "hold",
  Rollback = "rollback",
}

enum ReleaseGateResult {
  Passed = "passed",
  Failed = "failed",
  Blocked = "blocked",
}
```

CS-009 落地要求：有限集合在实现阶段集中管理。

## 4. 升级与回滚准入

1. 进入 rc 前，质量门禁需全部通过。
2. 进入 ga 前，必须完成发布验收 checklist。
3. 任一关键 gate 失败触发 `hold/rollback`。
4. 回滚动作必须记录影响范围与恢复证据。

## 5. 输出产物

1. 阶段升级决策记录。
2. 回滚预案与触发阈值清单。
3. 发布审计日志最小字段模板。

## 6. 后续任务输入映射

1. `TK-512`：消费阶段策略编写迁移与回滚手册。
2. `TK-513`：消费阶段准入规则自动生成发布验收清单。
3. `TK-516`：消费分级发布证据用于 GA readiness 审核。

## 7. 验收标准

1. 三阶段发布流程规则完整。
2. 升级、阻断、回滚路径明确。
3. 能直接支撑 M5 发布与评审任务。
