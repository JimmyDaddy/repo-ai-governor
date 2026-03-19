# 依赖产物自动注册与上下文注入运行时基线（TK-307）

- Status: active
- Date: 2026-03-19
- Milestone: `M3`
- Sprint: `sprint-001`
- Task: `TK-307`

## 1. 目标

将 Artifact Registry 与 Dependency Resolver 契约接入运行时，实现“产物生成即注册、任务执行前依赖解析与上下文注入”。

## 2. 运行时接入契约（Draft）

```ts
enum ArtifactRegistrationMode {
  Auto = "auto",
  Manual = "manual",
}

enum DependencyInjectionStatus {
  Injected = "injected",
  Skipped = "skipped",
  Blocked = "blocked",
}

enum DependencyFailureReason {
  Missing = "missing",
  Incompatible = "incompatible",
  Inactive = "inactive",
}
```

## 3. 接入流程

1. 阶段产物完成后自动注册 artifact（含版本与状态）。
2. 下阶段执行前解析 `depends_on_artifacts`。
3. 解析成功后注入执行上下文。
4. 解析失败按策略触发 `block/escalate/warn`。
5. 回写审计字段（producer/consumer/resolution_status）。

## 4. 与编译和策略联动

1. 编译产物默认加入自动注册白名单。
2. Policy Gate 使用依赖解析结果参与风险决策。

## 5. 失败处理

1. `missing/incompatible/inactive` 必须显式出错，不允许静默跳过。
2. 命中 `block` 时禁止进入下一阶段。

## 6. 后续任务输入映射

1. `TK-316`：作为 M3 E2E 编排链路的依赖注入验证输入。
2. `TK-501`：作为 M5 契约测试关键覆盖输入。
3. `TK-503`：作为依赖边界 blocking gate 的运行时事实输入。

## 7. 验收标准

1. 自动注册与注入流程可追溯、可阻断、可审计。
2. 与 TK-217 契约字段保持一致。
3. 产物已登记依赖注册表并被至少两个后续任务回链消费。
