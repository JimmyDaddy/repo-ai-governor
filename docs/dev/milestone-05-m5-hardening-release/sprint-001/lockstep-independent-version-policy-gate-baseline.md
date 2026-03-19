# lockstep/independent 版本策略门禁基线（TK-504）

- Status: active
- Date: 2026-03-19
- Milestone: `M5`
- Sprint: `sprint-001`
- Task: `TK-504`

## 1. 目标

固化 monorepo 版本策略门禁，确保 lockstep 与 independent 包组按约束进行发布与兼容性检查。

## 2. 包组策略

1. lockstep：`core-*`、`adapter-sdk`、`shared-*`。
2. independent：`adapters/*`、`memory-providers/*`、`notification-providers/*`。
3. 跨组契约版本变化必须触发兼容性验证。

## 3. 版本门禁模型（Draft）

```ts
enum PackageReleaseGroup {
  Lockstep = "lockstep",
  Independent = "independent",
}

enum VersionDriftStatus {
  Aligned = "aligned",
  Drifted = "drifted",
  Incompatible = "incompatible",
}

enum VersionPolicyGateResult {
  Passed = "passed",
  Failed = "failed",
  Blocked = "blocked",
}
```

CS-009 落地要求：有限集合在实现阶段统一归档到常量层。

## 4. 检查规则

1. lockstep 组版本必须完全一致。
2. independent 组允许独立升级，但需满足最小兼容约束。
3. 若 `adapter-sdk` 发生 major 变化，强制触发契约回归。

## 5. 输出产物

1. 包组版本一致性报告。
2. 漂移风险摘要与阻断建议。
3. 兼容性验证触发记录。

## 6. 后续任务输入映射

1. `TK-513`：消费版本门禁结果生成发布验收规则。
2. `TK-516`：消费版本风险摘要作为 GA readiness 输入。

## 7. 验收标准

1. lockstep/independent 边界与规则清晰可执行。
2. 漂移检测与阻断结果可复现。
3. 与发布流程门禁能够直接对接。
