# tests/integration 与 tests/e2e 主链路基线（TK-502）

- Status: active
- Date: 2026-03-19
- Milestone: `M5`
- Sprint: `sprint-001`
- Task: `TK-502`

## 1. 目标

定义 integration/e2e 主链路测试基线，验证从 CLI 入口到核心编排、策略门禁、适配器调用、审计回写的端到端可用性。

## 2. 主链路场景

1. `run` 正常链路（含 policy allow）。
2. `check` 链路（含契约与门禁检查）。
3. `review` 链路（含 HITL 通知触发）。
4. `review-verify` 链路（含人工回灌）。
5. workspace `tool_managed/repo_local` 双模式链路。

## 3. 测试场景模型（Draft）

```ts
enum MainlineScenarioType {
  Integration = "integration",
  EndToEnd = "end-to-end",
}

enum MainlineEnvironment {
  Local = "local",
  Ci = "ci",
}

enum MainlineExecutionResult {
  Passed = "passed",
  Failed = "failed",
  Blocked = "blocked",
}
```

CS-009 落地要求：有限集合在实现阶段统一管理。

## 4. 基线要求

1. 四命令主链路全覆盖。
2. 至少覆盖 1 条人工介入路径与 1 条降级路径。
3. 每条链路必须输出审计证据与结果摘要。

## 5. 输出产物

1. integration 场景清单与断言模板。
2. e2e 场景矩阵与失败回放索引。
3. 与发布验收对齐的通过条件清单。

## 6. 后续任务输入映射

1. `TK-511`：消费主链路稳定度指标。
2. `TK-513`：消费场景矩阵自动生成发布验收 checklist。
3. `TK-516`：消费端到端证据用于 GA readiness 审核。

## 7. 验收标准

1. integration/e2e 主链路覆盖边界清晰。
2. 场景结果可审计、可回放、可追踪。
3. 可直接驱动 M5 后续任务执行。
