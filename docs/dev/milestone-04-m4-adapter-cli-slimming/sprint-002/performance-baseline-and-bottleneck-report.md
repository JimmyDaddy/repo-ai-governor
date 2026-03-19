# 性能基线与瓶颈报告（TK-415）

- Status: active
- Date: 2026-03-19
- Milestone: `M4`
- Sprint: `sprint-002`
- Task: `TK-415`

## 1. 目标

建立 M4 阶段命令链路性能基线，识别主要瓶颈类别，并给出后续门禁与可观测收口可复用的指标模型。

## 2. 测试场景

1. `run`：典型多阶段执行。
2. `check`：规则校验与静态分析链路。
3. `review`：评审生成链路。
4. `review-verify`：评审复核链路。

## 3. 指标契约（Draft）

```ts
enum PerformanceScenario {
  Run = "run",
  Check = "check",
  Review = "review",
  ReviewVerify = "review-verify",
}

enum BottleneckCategory {
  AdapterLatency = "adapter-latency",
  PolicyEvaluation = "policy-evaluation",
  Serialization = "serialization",
  FileSystemIo = "file-system-io",
  CpuBound = "cpu-bound",
}

enum PerformanceBudgetStatus {
  WithinBudget = "within-budget",
  NearLimit = "near-limit",
  Exceeded = "exceeded",
}
```

CS-009 落地要求：有限集合在实现阶段统一归档到常量层。

## 4. 基线预算（建议值）

1. `run`：P95 <= 45s。
2. `check`：P95 <= 35s。
3. `review`：P95 <= 50s。
4. `review-verify`：P95 <= 55s。

## 5. 瓶颈观察口径

1. 阶段级耗时拆分（parse/policy/compile/adapter/record）。
2. 失败重试次数与总增量耗时。
3. 高风险门禁触发占比对吞吐的影响。

## 6. 后续任务输入映射

1. `TK-416`：消费性能场景和阈值执行兼容性回归。
2. `TK-511`：消费预算状态与瓶颈分类作为质量门禁稳定性输入。
3. `TK-514`：消费性能指标模型作为可观测与报告收口输入。

## 7. 验收标准

1. 四类命令均有统一性能指标口径。
2. 瓶颈分类可落地到优化任务。
3. 指标与阈值可被 M5 门禁与报告直接复用。
