# run/check/review/review-verify 核心逻辑下沉基线（TK-411）

- Status: active
- Date: 2026-03-19
- Milestone: `M4`
- Sprint: `sprint-002`
- Task: `TK-411`

## 1. 目标

将 `run/check/review/review-verify` 的业务执行逻辑从 CLI 入口层下沉到 packages，形成稳定的调用边界、统一的结果契约与可测试的核心执行单元。

## 2. 下沉边界

1. `apps/cli` 只保留参数解析、上下文装配、命令路由与结果渲染。
2. `packages/core-runtime` 负责命令级执行编排与阶段驱动。
3. `packages/core-policy` 负责风险评估、门禁决策与阻断语义。
4. `packages/core-process` 负责流程阶段模型与状态推进。
5. `packages/adapter-sdk` 负责工具调用抽象与能力协商。

## 3. 命令执行契约（Draft）

```ts
enum GovernorCommandKind {
  Run = "run",
  Check = "check",
  Review = "review",
  ReviewVerify = "review-verify",
}

enum CommandExecutionOutcome {
  Succeeded = "succeeded",
  Failed = "failed",
  Blocked = "blocked",
  Cancelled = "cancelled",
}

enum CommandExecutionMode {
  Interactive = "interactive",
  NonInteractive = "non-interactive",
}
```

CS-009 落地要求：有限集合在代码实现阶段集中落到 `src/constants/` 或 monorepo 对应 `shared-*` 常量包。

## 4. 调用链路基线

1. CLI 命令入口 -> `CommandRouter`。
2. `CommandRouter` -> `CoreCommandExecutor`（按 `GovernorCommandKind`）。
3. `CoreCommandExecutor` -> policy pre-check -> process stage run -> adapter invoke。
4. 执行结束统一回写 `execution_session_id`、`workspace_mode`、`decision_trace`。

## 5. 结果对象基线

1. 统一输出字段：`command_kind`、`outcome`、`started_at`、`ended_at`、`duration_ms`。
2. 失败输出包含：`failure_stage`、`error_category`、`retriable`。
3. 被阻断输出包含：`policy_gate_id`、`risk_level`、`hitl_required`。

## 6. 验证要求

1. 四个命令共享同一执行入口契约。
2. CLI 与核心包依赖方向无反向引用。
3. 回归验证可复用到 `TK-412`、`TK-414`、`TK-416`。

## 7. 后续任务输入映射

1. `TK-412`：消费命令下沉边界实现 CLI 瘦身。
2. `TK-414`：消费执行结果与门禁接入点，完成入口收口。
3. `TK-416`：消费命令级兼容回归输入与失败分类。
4. `TK-502`：消费主链路执行入口用于集成/E2E 测试设计。

## 8. 验收标准

1. 命令执行逻辑下沉边界明确且可实施。
2. 结果模型可作为契约测试与回归测试输入。
3. 下游任务无需二次定义命令语义即可直接消费。
