# tests/contract 全量覆盖关键契约基线（TK-501）

- Status: active
- Date: 2026-03-19
- Milestone: `M5`
- Sprint: `sprint-001`
- Task: `TK-501`

## 1. 目标

建立 M5 阶段关键契约全覆盖基线，保证 core、adapter、workspace、session、notification、policy 等跨层接口具备一致可验证行为。

## 2. 覆盖范围

1. `core-process` 与 `core-policy` 阶段契约。
2. `adapter-sdk` 与 adapter 能力/错误/降级契约。
3. workspace + memory + session 读写与审计字段契约。
4. notification-dispatcher 与 provider 回执契约。
5. 依赖产物注册与消费链路契约。

## 3. 契约测试模型（Draft）

```ts
enum ContractDomain {
  Core = "core",
  Adapter = "adapter",
  Workspace = "workspace",
  Session = "session",
  Policy = "policy",
  Notification = "notification",
  ArtifactDependency = "artifact-dependency",
}

enum ContractAssertionLevel {
  Required = "required",
  Recommended = "recommended",
  Optional = "optional",
}

enum ContractRunResult {
  Passed = "passed",
  Failed = "failed",
  Blocked = "blocked",
}
```

CS-009 落地要求：有限集合在实现阶段统一沉淀为常量。

## 4. 覆盖门槛

1. 关键域 `required` 契约覆盖率 100%。
2. 每个关键域至少 1 条失败路径断言。
3. 失败用例必须包含可定位字段：`domain`、`contract_id`、`failure_reason`。

## 5. 输出产物

1. 契约覆盖矩阵（domain x contract_id x result）。
2. 失败摘要与修复建议。
3. 对应 evidence 索引，可回链 `execution_session_id`。

## 6. 后续任务输入映射

1. `TK-511`：消费覆盖率与失败分布定义质量门禁稳定指标。
2. `TK-513`：消费覆盖矩阵生成发布验收 checklist 模板。
3. `TK-516`：消费关键契约达标结果作为 GA readiness 输入。

## 7. 验收标准

1. 关键契约域定义完整且可执行。
2. 覆盖门槛与失败证据口径统一。
3. 可直接驱动 M5 后续门禁与发布任务。
