# Adapter-SDK 初版契约基线（TK-105）

- Status: active
- Date: 2026-03-19
- Milestone: `M1`
- Sprint: `sprint-001`
- Task: `TK-105`

## 1. 目标

定义 `adapter-sdk` 的初版统一契约，确保不同 AI 工具适配器在 `probe / invoke / stream / confirmation` 维度具备一致接口，并可支持能力矩阵与降级策略。

## 2. 范围与非目标

1. 范围：
   - `packages/adapter-sdk` 的接口、模型与错误语义基线。
   - 适配器能力声明与降级决策输入字段。
   - M1 阶段最小兼容契约（供 `TK-106` 桥接和后续 `TK-405` 契约测试）。
2. 非目标：
   - 本任务不实现具体适配器（Codex/Copilot/Claude）代码。
   - 本任务不定义各工具私有参数全集，仅定义统一抽象层。

## 3. 契约职责边界

### 3.1 `adapter-sdk` 负责

1. 统一接口定义（`probe`、`invokeStage`、`streamEvents?`、`requestConfirmation?`）。
2. 通用请求/响应模型（含执行上下文、会话、审计字段）。
3. 能力矩阵声明模型（结构化输出/并行/流式/审批回调等）。
4. 错误类型与可恢复性语义（`transient / permanent / policy-blocked`）。

### 3.2 `adapter-sdk` 不负责

1. 具体 provider SDK 封装（属于 `adapters/*`）。
2. 策略判定与人工审批决策（属于 `core-policy`/HITL）。
3. 流程编排与状态机推进（属于 `core-process`/runtime）。

## 4. 依赖方向约束

1. `adapter-sdk` 可依赖：
   - `shared-types`
   - `shared-utils`
2. `adapter-sdk` 不可依赖：
   - `apps/cli`
   - `adapters/*`（避免接口层反向耦合实现层）
   - 任何具体工具 SDK
3. `adapters/*` 只能依赖 `adapter-sdk`，不得跨越依赖直接耦合 CLI。

## 5. 目录与入口基线

```text
packages/adapter-sdk/
  src/
    adapter-contract.ts
    adapter-capability-model.ts
    adapter-error-model.ts
    index.ts
  test/
    adapter-contract.test.ts
    adapter-capability-model.test.ts
  README.md
```

说明：
1. 命名遵循 `CS-014`。
2. `index.ts` 仅导出稳定公共契约，不导出内部工具适配细节。

## 6. 初版接口契约（Draft v1）

```ts
type AdapterId = string;
type ExecutionSessionId = string;
```

```ts
interface AdapterProbeResult {
  adapterId: AdapterId;
  available: boolean;
  capabilities: AdapterCapabilityMatrix;
  message?: string;
}
```

```ts
interface AdapterInvokeRequest {
  adapterId: AdapterId;
  executionId: string;
  stageId: string;
  executionSessionId: ExecutionSessionId;
  roleProfileId: string;
  input: Record<string, unknown>;
}
```

```ts
enum AdapterInvokeStatus {
  Succeeded = "succeeded",
  Failed = "failed",
  RequiresConfirmation = "requires_confirmation",
}

interface AdapterInvokeResult {
  status: AdapterInvokeStatus;
  output?: Record<string, unknown>;
  error?: AdapterError;
  telemetry: AdapterTelemetry;
}
```

```ts
enum AdapterErrorCategory {
  Transient = "transient",
  Permanent = "permanent",
  PolicyBlocked = "policy-blocked",
}

interface AdapterError {
  code: string;
  category: AdapterErrorCategory;
  message: string;
  retryable: boolean;
}
```

实现约束（对齐 `CS-009`）：
1. 上述有限集合值在实现中必须集中放在 `packages/adapter-sdk/src/constants/` 下管理。
2. 业务代码禁止散落重复字面量，统一引用常量或 enum 定义。

### 6.1 Shared 包放置策略（针对本节契约）

1. 默认不放到 `shared-types`：
   - `AdapterInvokeStatus`、`AdapterErrorCategory`、`AdapterInvokeResult`、`AdapterError` 属于 adapter 域语义，应由 `adapter-sdk` 维护。
2. 可放到 `shared-types` 的前提：
   - 该类型已成为跨域通用基础类型（非 adapter 专属语义），且被多个非 adapter 域共同消费。
3. 若后续抽到 `shared-types`：
   - `adapter-sdk` 必须继续对外 re-export，保持调用方以 `adapter-sdk` 为单一契约入口，避免导入路径分裂。

## 7. 能力矩阵基线

`AdapterCapabilityMatrix` 至少包含：
1. `supportsToolCall`
2. `supportsStructuredOutput`
3. `supportsParallelTasks`
4. `supportsStreaming`
5. `supportsApprovalCallback`

降级要求：
1. 当能力缺失时必须返回显式降级理由，不得静默降级。
2. 降级决策应携带替代路径建议（例如 `fallback_to_non_streaming`）。

## 8. 抽离执行步骤（建议）

1. 建包：创建 `packages/adapter-sdk` 最小结构。
2. 迁移：抽取现有适配层中可复用的通用类型与错误模型。
3. 统一：CLI/runtime 只依赖 `adapter-sdk` 契约，不依赖具体适配实现类型。
4. 验证：通过桥接回归与契约测试验证兼容性。

## 9. 回归与验收口径

1. `build`：
   - 根级构建包含 `adapter-sdk`。
2. `bridge`：
   - `TK-106` 中验证 CLI 对统一接口调用行为稳定。
3. `contract`：
   - `TK-405` 中基于该契约补齐 adapter contract tests。
4. `m1-exit`：
   - `TK-116` 中纳入 adapter 契约与能力矩阵回归证据。

## 10. 后续任务输入映射

1. `TK-106`：消费该契约完成 CLI 与核心包桥接回归。
2. `TK-116`：纳入 M1 退出回归证据。
3. `TK-405`：作为 adapter 契约测试补齐的事实源。

## 11. 验收标准

1. 接口边界清晰且不与具体适配实现耦合。
2. 初版模型可直接指导后续 `adapters/*` 实现和契约测试。
3. 产物已登记依赖注册表并被至少两个后续任务回链消费。
