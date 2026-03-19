# Copilot Adapter 模块化基线（TK-402）

- Status: active
- Date: 2026-03-19
- Milestone: `M4`
- Sprint: `sprint-001`
- Task: `TK-402`

## 1. 目标

将 GitHub Copilot 入口能力模块化到独立 adapter，实现与 `adapter-sdk` 一致的执行契约、能力声明和降级行为。

## 2. 模块边界与职责

1. 目标模块：`packages/adapters/github-copilot/`。
2. 模块职责：
   - 实现 `probe/invokeStage/streamEvents/requestConfirmation` 统一接口。
   - 暴露 Copilot 能力声明、错误归一与运行时元数据。
3. 依赖约束：
   - 仅依赖 `adapter-sdk/shared-types/shared-utils`。
   - 不依赖 `apps/cli` 与 `core-runtime`。

## 3. Copilot Adapter 契约（Draft）

```ts
enum CopilotSurface {
  CopilotChat = "copilot-chat",
}

enum CopilotInvocationMode {
  Sync = "sync",
  Streaming = "streaming",
}

enum CopilotExecutionResult {
  Passed = "passed",
  Failed = "failed",
  TimedOut = "timed-out",
  Cancelled = "cancelled",
}
```

CS-009 落地要求：有限集合在代码实现阶段统一落到 `src/constants/`。

## 4. 能力与降级语义

1. 必须声明：`tool-calling`, `structured-output`, `parallel-task`, `streaming`, `confirmation-callback`。
2. 能力不足处理：
   - 按 `routeKey` 切换 fallback surface。
   - 无 fallback 时触发 `escalate/block`，禁止静默失败。

## 5. 错误归一与审计字段

1. 错误归一：`transient/permanent/timeout/cancelled/policy_blocked`。
2. 审计字段最小集合：
   - `surface=copilot-chat`
   - `agent_role`, `role_profile_id`
   - `status`, `started_at`, `ended_at`
   - `execution_session_id`

## 6. 后续任务输入映射

1. `TK-404`：消费 Copilot 能力声明汇总能力矩阵。
2. `TK-405`：消费 Copilot 契约补齐 adapter 契约测试。
3. `TK-406`：消费 Copilot 模块边界冻结 CLI 路由层适配策略。

## 7. 验收标准

1. Copilot adapter 模块边界与接口语义清晰。
2. 能力声明和降级规则可被策略层直接消费。
3. 可作为 M4 sprint-001 后续任务可复用输入。
