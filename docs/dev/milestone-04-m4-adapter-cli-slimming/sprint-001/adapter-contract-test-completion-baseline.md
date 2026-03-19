# Adapter 契约测试补齐基线（TK-405）

- Status: active
- Date: 2026-03-19
- Milestone: `M4`
- Sprint: `sprint-001`
- Task: `TK-405`

## 1. 目标

为 `adapter-sdk` 与首批三类 adapter（Codex/Copilot/Claude）建立统一契约测试覆盖模型，保证跨工具行为一致与降级行为可验证。

## 2. 测试范围

1. 接口契约：`probe/invokeStage/streamEvents/requestConfirmation`。
2. 能力声明契约：能力矩阵字段完整性与类型一致性。
3. 错误归一契约：`transient/permanent/timeout/cancelled/policy_blocked` 映射。
4. 降级契约：primary 不可用时 fallback/escalate/block 行为。
5. 审计契约：关键字段回写完整性。

## 3. 测试结果模型（Draft）

```ts
enum AdapterContractCaseResult {
  Passed = "passed",
  Failed = "failed",
  Skipped = "skipped",
}

enum AdapterContractCaseType {
  Interface = "interface",
  CapabilityMatrix = "capability-matrix",
  ErrorMapping = "error-mapping",
  Degradation = "degradation",
  Audit = "audit",
}
```

CS-009 落地要求：有限集合在代码实现阶段统一落到 `src/constants/`。

## 4. 覆盖基线

1. 每个 adapter 至少覆盖 5 类 case（接口/能力/错误/降级/审计）。
2. 每个 `routeKey` 至少覆盖 1 条 primary 正常路径和 1 条 fallback 路径。
3. 至少包含 1 条 `escalate` 与 1 条 `block` 失败路径用例。

## 5. 回归输入输出

1. 输入：`adapter-sdk` 契约定义 + 三工具模块化基线 + 能力矩阵策略。
2. 输出：
   - 契约覆盖矩阵（adapter x case type）。
   - 失败用例摘要（含 routeKey/surface/error class）。
   - 与 `TK-416` 兼容回归可复用的证据清单。

## 6. 后续任务输入映射

1. `TK-416`：消费契约测试覆盖与失败摘要作为兼容性回归输入。
2. `TK-501`：消费 adapter 契约覆盖模型作为 M5 合同测试扩展输入。

## 7. 验收标准

1. 关键 adapter 契约覆盖维度齐全。
2. 降级与错误映射场景可稳定复现与断言。
3. 回归证据可直接复用于后续里程碑测试任务。
