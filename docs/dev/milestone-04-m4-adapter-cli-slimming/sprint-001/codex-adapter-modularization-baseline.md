# Codex Adapter 模块化基线（TK-401）

- Status: active
- Date: 2026-03-19
- Milestone: `M4`
- Sprint: `sprint-001`
- Task: `TK-401`

## 1. 目标

将 Codex 入口能力从通用执行路径中解耦，形成可独立演进的 adapter 模块，并与 `adapter-sdk` 契约保持一致。

## 2. 模块边界与目录建议

1. 目标模块：`packages/adapters/codex/`。
2. 模块职责：
   - 实现 `adapter-sdk` 统一接口（`probe/invokeStage/streamEvents/requestConfirmation`）。
   - 暴露 Codex 能力声明、错误映射与运行时元数据。
3. 禁止职责：
   - 不直接承担流程编排、策略决策与会话治理。
   - 不依赖 `apps/cli`、`core-runtime` 或其他具体 adapter。

## 3. Codex Adapter 契约（Draft）

```ts
enum AdapterSurface {
  CodexCLI = "codex-cli",
}

enum AdapterInvocationMode {
  Sync = "sync",
  Streaming = "streaming",
}

enum AdapterExecutionResult {
  Passed = "passed",
  Failed = "failed",
  TimedOut = "timed-out",
  Cancelled = "cancelled",
}

enum AdapterCapabilityKey {
  ToolCalling = "tool-calling",
  StructuredOutput = "structured-output",
  ParallelTask = "parallel-task",
  Streaming = "streaming",
  ConfirmationCallback = "confirmation-callback",
}
```

CS-009 落地要求：有限集合在代码实现阶段统一落到 `src/constants/`。

## 4. 能力声明与降级行为

1. 必须输出 `capability matrix`，至少包含：
   - `tool-calling`
   - `structured-output`
   - `parallel-task`
   - `streaming`
   - `confirmation-callback`
2. 当某能力不可用时：
   - 优先切换同角色 fallback surface（由 `routeKey` 策略决定）。
   - 无 fallback 时触发 `escalate/block`，禁止静默失败。

## 5. 错误与审计映射

1. Adapter 错误需归一到统一错误契约：`transient/permanent/timeout/cancelled/policy_blocked`。
2. 审计至少回写：
   - `surface=codex-cli`
   - `agent_role`, `role_profile_id`
   - `status`, `started_at`, `ended_at`
   - `execution_session_id`

## 6. 与后续任务的接口关系

1. `TK-404`：消费 Codex 能力声明，汇总三工具能力矩阵与降级策略。
2. `TK-405`：消费 Codex 契约定义，补齐 adapter 契约测试场景。
3. `TK-406`：消费 Codex 模块边界，冻结 CLI 路由层适配边界。

## 7. 验收标准

1. Codex adapter 的职责边界、接口和错误映射清晰。
2. 能力声明与降级语义可被策略层直接消费。
3. 对下游矩阵、契约测试和路由冻结任务具备可复用输入。
