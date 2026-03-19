# 共享 execution_session_id 事件总线基线（TK-213）

- Status: active
- Date: 2026-03-19
- Milestone: `M2`
- Sprint: `sprint-002`
- Task: `TK-213`

## 1. 目标

定义跨 Agent 共享 `execution_session_id` 的事件总线契约，确保多角色协作在同一会话上下文中有序写入、可追踪、可回放，并为 HITL 与审计链路提供统一事件事实源。

## 2. 范围与非目标

1. 范围：
   - 固化事件主题、事件包络和顺序语义。
   - 固化发布/消费边界与幂等要求。
   - 固化与 `core-session`、`core-memory`、`notification-dispatcher`、`audit` 的对接点。
2. 非目标：
   - 本任务不实现消息中间件选型与部署。
   - 本任务不实现 session 快照恢复细节（由 `TK-214` 负责）。
   - 本任务不实现策略引擎判定逻辑（属于 M3 `core-policy` 闭环）。

## 3. 事件主题与包络契约（Draft）

```ts
enum SessionEventTopic {
  StageLifecycle = "stage-lifecycle",
  PolicyDecision = "policy-decision",
  HumanDecision = "human-decision",
  MemoryDelta = "memory-delta",
  ArtifactRegistered = "artifact-registered",
  NotificationDispatched = "notification-dispatched",
}

enum SessionEventActorType {
  Agent = "agent",
  Human = "human",
  System = "system",
}

enum SessionEventDeliveryStatus {
  Accepted = "accepted",
  Processed = "processed",
  Replayed = "replayed",
  Rejected = "rejected",
}

interface SharedSessionEvent {
  eventId: string;
  executionId: string;
  executionSessionId: string;
  topic: SessionEventTopic;
  actorType: SessionEventActorType;
  roleProfileId?: string;
  skillId?: string;
  sequence: number;
  occurredAt: string; // RFC3339 秒级
  occurredAtDisplay: string; // YYYY-MM-DD HH:mm:ss UTC±HH:MM
  sourceTaskId?: string;
  deliveryStatus: SessionEventDeliveryStatus;
  payload: Record<string, unknown>;
}
```

CS-009 落地要求：
1. `SessionEventTopic`、`SessionEventActorType`、`SessionEventDeliveryStatus` 必须集中定义在 `src/constants/`。
2. 事件路由与校验逻辑禁止散落字面量，统一引用常量。

## 4. 顺序、幂等与一致性语义

1. 同一 `execution_session_id` 下 `sequence` 必须单调递增。
2. `eventId` 在同一会话内必须唯一，重复写入按幂等处理。
3. 写入失败可重试，但不可改变既有事件顺序。
4. 非法会话或越序事件必须标记 `rejected` 并写审计。

## 5. 发布/消费边界

1. 发布方：`Process Runtime`、`Policy Gate Engine`、`Agent Coordinator`、`Notification Dispatcher`。
2. 消费方：`core-session`（会话状态）、`core-memory`（增量上下文）、`Audit Recorder`（审计事件）、`Report Builder`（报告视图）。
3. 人工介入事件必须包含 `actorType=human` 与决策摘要字段，供回放解释。

## 6. 存储与传输扩展基线

1. 基线落地：文件/CSV 事件日志（通过 `memory-store-adapter`）。
2. 可扩展落地：本地数据库或线上数据库/消息系统。
3. 扩展约束：上层只依赖总线契约，不依赖具体中间件 SDK。

## 7. 失败模型与恢复接口

1. `transient`：可重试并保留序列号占位。
2. `concurrency_conflict`：触发冲突审计事件，要求人工或策略裁决。
3. `timeout/cancelled`：写入中断事件并触发快照检查点。

## 8. 后续任务输入映射

1. `TK-214`：消费事件序列建立 session 快照切片与回放入口。
2. `TK-215`：复用事件字段补齐审计模型（`executionSessionId/roleProfileId/skillId`）。
3. `TK-315`：作为多 Agent 共享 session 约束接入的核心输入。
4. `TK-316`：作为 M3 端到端链路回归的事件观测基线。

## 9. 验收标准

1. 事件主题、包络字段与顺序语义已固定。
2. 共享会话的幂等、顺序、失败处理规则具备可执行约束。
3. 产物已登记依赖注册表并被至少两个后续任务回链消费。
