# Notification-Dispatcher 抽离基线（TK-114）

- Status: active
- Date: 2026-03-19
- Milestone: `M1`
- Sprint: `sprint-002`
- Task: `TK-114`

## 1. 目标

定义 `notification-dispatcher` 的抽离边界、统一通知 Provider 契约与回退策略，确保 HITL 触发（`confirm/escalate`）后的通知分发具备稳定接口、可审计回执与可扩展渠道能力。

## 2. 范围与非目标

1. 范围：
   - `packages/notification-dispatcher` 的职责、目录结构与公共入口基线。
   - 通知分发最小契约（触发条件、最小载荷、回执模型、重试与回退）。
   - 与 `core-policy`、`core-audit`、`notification-providers/*` 的边界与协作方式。
2. 非目标：
   - 本任务不实现所有渠道的完整 provider 能力（后续 `TK-311`、`TK-312` 落地）。
   - 本任务不实现策略判定逻辑本身（属于 `core-policy`）。
   - 本任务不在 M1 完成终态通知编排闭环，仅固定可执行契约与迁移路径。

## 3. 包职责边界

### 3.1 `notification-dispatcher` 负责

1. 接收 HITL 触发事件并路由到主通知渠道。
2. 执行重试、退避与备用渠道回退策略。
3. 统一输出通知回执（成功/失败/升级）并写入审计事件。
4. 向上游暴露稳定分发接口，屏蔽渠道 provider 细节差异。

### 3.2 `notification-dispatcher` 不负责

1. 策略命中计算（`allow/confirm/block/escalate` 决策由 `core-policy` 负责）。
2. 具体渠道 SDK 调用实现（由 `notification-providers/*` 负责）。
3. CLI 交互渲染与命令参数解析（由 `apps/cli` 与 reporting 负责）。

## 4. 依赖方向约束（M1 阶段）

1. `notification-dispatcher` 可依赖：
   - `core-policy`
   - `core-audit`
   - `config`
   - `shared-types`
   - `shared-utils`
2. `notification-dispatcher` 不可依赖：
   - `apps/cli`
   - `core-runtime`
   - `adapters/*`
   - `memory-providers/*`
3. 协作方向：
   - `notification-providers/*` 仅依赖 `notification-dispatcher/shared-*`。
   - `core-runtime` 只调用 dispatcher 公共入口，不依赖具体 provider。

## 5. 目录与入口基线

```text
packages/notification-dispatcher/
  src/
    constants/
      notification-channel.ts
      notification-dispatch-status.ts
      hitl-trigger-type.ts
      notification-fallback-strategy.ts
    shared-types/
      notification-provider.interface.ts
      notification-dispatch-request.interface.ts
      notification-dispatch-result.interface.ts
      index.ts
    provider-registry.ts
    notification-policy-router.ts
    notification-dispatcher-runtime.ts
    retry-backoff.ts
    index.ts
  test/
    notification-dispatcher-runtime.contract.test.ts
    notification-policy-router.test.ts
  README.md
```

说明：
1. 命名遵循 `CS-014`。
2. 有限集合值集中于 `src/constants/`，对齐 `CS-009`。
3. 对外统一通过 `index.ts` 暴露稳定入口，provider 仅消费 `shared-types` 契约。

## 6. 最小通知契约（M1 Draft）

```ts
enum NotificationChannel {
  Email = "email",
  Webhook = "webhook",
  ChatIm = "chat-im",
  IssueSystem = "issue-system",
}

enum NotificationDispatchStatus {
  Sent = "sent",
  RetryScheduled = "retry-scheduled",
  FallbackSent = "fallback-sent",
  Failed = "failed",
  Escalated = "escalated",
}

enum HitlTriggerType {
  ConfirmRequired = "confirm-required",
  EscalateRequired = "escalate-required",
  ThresholdReached = "threshold-reached",
}

interface NotificationDispatchRequest {
  executionId: string;
  executionSessionId: string;
  stageId: string;
  routeKey: string;
  riskLevel: string;
  requiredAction: string;
  deadlineAt: string;
  workspaceId: string;
  primaryChannel: NotificationChannel;
  fallbackChannels: NotificationChannel[];
  payload: Record<string, unknown>;
}

interface NotificationDispatchResult {
  status: NotificationDispatchStatus;
  channel: NotificationChannel;
  providerId: string;
  attemptCount: number;
  receiptId?: string;
  notifiedAt: string;
  notifiedAtDisplay: string;
  errorCode?: string;
  nextAction?: string;
}
```

契约约束：
1. 最小通知载荷必须包含：`execution_id`、`stage_id`、`route_key`、`risk_level`、`required_action`、`deadline_at`。
2. `notifiedAt` 使用 RFC3339 秒级时间戳；`notifiedAtDisplay` 使用人类可读时间。
3. 主渠道失败时必须按策略重试或切换备用渠道，不允许静默丢失。
4. 回执必须可回链 `executionId` + `executionSessionId` 并进入审计记录。

### 6.1 Shared 包放置策略（针对本节契约）

1. 默认放在 `notification-dispatcher/src/shared-types/`：
   - `NotificationDispatchRequest/Result` 与 provider 接口属于通知域公共 API。
2. 默认不放到 `packages/shared-types`：
   - `NotificationChannel`、`HitlTriggerType` 等仍属通知域专属语义。
3. 若后续抽到 `packages/shared-types`：
   - `notification-dispatcher` 必须继续 re-export，保持单一契约入口。

## 7. Provider 扩展与回退策略基线

`NotificationProviderCapability` 最小字段：
1. `supportsMarkdown`
2. `supportsThreadReply`
3. `supportsMentionRouting`
4. `supportsAttachment`
5. `supportsDeliveryReceipt`

回退策略要求：
1. 支持 `fixed-delay` 与 `exponential-backoff` 两类退避策略。
2. 达到 `maxAttempts` 仍失败时必须升级为 `Escalated` 并输出 `nextAction`。
3. 备用渠道顺序由策略配置驱动，且每次切换都写入审计事件。

## 8. 后端落地基线（与总方案对齐）

1. M1：固定 dispatcher 契约与 provider 装配接口。
2. M3：`TK-311` 先落地 `notification-providers/webhook` 基线。
3. M3：`TK-312` 抽象 `email/chat-im/issue-system` 回退通道并接入策略映射。

## 9. 抽离执行步骤（建议）

1. 建包：创建 `packages/notification-dispatcher` 最小结构与入口。
2. 契约落位：抽取 request/result/provider 接口与状态常量。
3. 桥接：将现有 HITL 触发点统一改为调用 dispatcher。
4. 收口：移除命令层内散落的通知分发逻辑与渠道分支判断。

## 10. 回归与验收口径

1. `build`：根级构建覆盖 `notification-dispatcher` 包编译。
2. `contract`：至少覆盖主渠道成功、重试成功、备用渠道回退、最终升级四类路径。
3. `bridge`：HITL 触发后通知回执可被审计链路消费。
4. `m1-exit`：`TK-116` 退出回归必须包含 dispatcher 契约与回退策略验证证据。

## 11. 后续任务输入映射

1. `TK-116`：纳入 M1 退出回归证据（dispatcher 契约 + 依赖方向）。
2. `TK-311`：作为 webhook provider 基线接入输入。
3. `TK-312`：作为多渠道回退抽象输入。

## 12. 验收标准

1. 通知域职责边界清晰，不与 policy/runtime/provider 混淆。
2. 统一分发契约可直接指导 `notification-providers/*` 实现。
3. 产物已登记依赖注册表并被至少两个后续任务回链消费。
