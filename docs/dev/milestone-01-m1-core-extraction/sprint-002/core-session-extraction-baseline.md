# Core-Session 抽离基线（TK-112）

- Status: active
- Date: 2026-03-19
- Milestone: `M1`
- Sprint: `sprint-002`
- Task: `TK-112`

## 1. 目标

定义 `core-session` 的抽离边界、共享会话契约与迁移路径，确保多 Agent 在同一 `execution_session_id` 下协作时具备统一的生命周期、事件流、快照与回放语义。

## 2. 范围与非目标

1. 范围：
   - `packages/core-session` 的职责、目录结构与公共入口基线。
   - session 生命周期（open/reuse/finalize）与事件流写入契约。
   - session 快照/回放与并发冲突最小约束。
2. 非目标：
   - 本任务不实现具体存储实现与 provider（由 `memory-store-adapter` / `memory-providers/*` 负责）。
   - 本任务不实现策略判定与人工闸口逻辑（属于 `core-policy` / HITL）。
   - 本任务不替换全部旧调用路径，只固定可渐进迁移的桥接方案。

## 3. 包职责边界

### 3.1 `core-session` 负责

1. 管理 `execution_session_id` 生命周期（创建、复用、终止）。
2. 管理 session 事件流写入与顺序约束（阶段开始/结束、策略命中、人工决策、CR 状态变更）。
3. 输出 session 快照与回放输入（含会话状态、记忆增量、关键产物索引）。
4. 提供并发写入最小冲突控制语义（版本戳或序列号）。

### 3.2 `core-session` 不负责

1. 记忆持久化细节（属于 `core-memory` + `memory-store-adapter`）。
2. 具体模型调用与角色路由（属于 `adapter-sdk` / `adapters/*` / `core-runtime`）。
3. 通知渠道分发（属于 `notification-dispatcher`）。

## 4. 依赖方向约束（M1 阶段）

1. `core-session` 可依赖：
   - `core-memory`
   - `shared-types`
   - `shared-utils`
   - `config`
2. `core-session` 不可依赖：
   - `apps/cli`
   - `adapters/*`
   - `memory-providers/*`
   - `notification-providers/*`
3. 协作方向：
   - `core-runtime` 可依赖 `core-session`；
   - `core-session` 不反向依赖 runtime/adapter 实现。

## 5. 目录与入口基线

```text
packages/core-session/
  src/
    constants/
      session-status.ts
      session-event-type.ts
    session-model.ts
    session-manager.ts
    session-event-log.ts
    session-snapshot.ts
    session-replay.ts
    index.ts
  test/
    session-manager.test.ts
    session-snapshot.test.ts
    session-replay.test.ts
  README.md
```

说明：
1. 命名遵循 `CS-014`。
2. 有限集合值集中在 `src/constants/`，对齐 `CS-009`。
3. 对外统一通过 `index.ts` 暴露稳定契约入口。

## 6. 最小 Session 契约（M1 Draft）

```ts
enum SessionStatus {
  Open = "open",
  Blocked = "blocked",
  Completed = "completed",
  Cancelled = "cancelled",
}

enum SessionEventType {
  StageStarted = "stage-started",
  StageCompleted = "stage-completed",
  PolicyEvaluated = "policy-evaluated",
  HumanDecisionRecorded = "human-decision-recorded",
  ReviewStateChanged = "review-state-changed",
}

interface SessionOpenRequest {
  executionId: string;
  workspaceId: string;
  executionSessionId?: string;
}

interface SessionEventRecord {
  executionSessionId: string;
  eventType: SessionEventType;
  stageId?: string;
  routeKey?: string;
  payload: Record<string, unknown>;
  sequence: number;
  occurredAt: string;
}

interface SessionSnapshot {
  executionSessionId: string;
  status: SessionStatus;
  sequence: number;
  memoryScope: string[];
  memoryDelta: Record<string, unknown>;
  startedAt: string;
  endedAt?: string;
  startedAtDisplay: string;
  endedAtDisplay?: string;
}
```

契约约束：
1. 同一执行链路必须复用同一 `execution_session_id`。
2. 事件写入必须携带单调递增 `sequence`，用于冲突检测与回放排序。
3. `startedAt/endedAt` 使用 RFC3339 秒级时间戳；`startedAtDisplay/endedAtDisplay` 使用人类可读时间格式。
4. `SessionStatus`、`SessionEventType` 在实现中必须集中于 `packages/core-session/src/constants/`。

### 6.1 Shared 包放置策略（针对本节契约）

1. 默认不放到 `shared-types`：
   - `SessionStatus`、`SessionEventType`、`SessionSnapshot` 属于 session 域语义。
2. 可放到 `shared-types` 的前提：
   - 类型已成为跨域通用基础语义且被多个非 session 域复用。
3. 若后续抽到 `shared-types`：
   - `core-session` 必须继续 re-export，保持单一契约入口。

## 7. 抽离执行步骤（建议）

1. 建包：创建 `packages/core-session` 最小结构与入口。
2. 迁移：将执行链路中的 session 生命周期控制与快照拼装逻辑收敛到 `session-manager.ts`。
3. 事件化：把策略命中、人工决策、CR 状态变化统一写入 `session-event-log.ts`。
4. 桥接：CLI/runtime 先通过兼容层调用 `core-session`，再逐步移除旧路径重复逻辑。

## 8. 回归与验收口径

1. `build`：
   - 根级构建可覆盖 `core-session` 包编译。
2. `test`：
   - 至少覆盖 open/reuse/finalize、事件序列、有序回放三类单测。
3. `bridge`：
   - `TK-113` 接入存储契约时，不引入 session 对 provider 的反向依赖。
4. `m1-exit`：
   - `TK-116` 退出回归需包含 session 生命周期与回放验证证据。

## 9. 后续任务输入映射

1. `TK-113`：消费该基线对齐 `snapshot/archive` 存储契约。
2. `TK-116`：将该基线纳入 M1 退出回归证据包。
3. `TK-213`：作为共享 `execution_session_id` 事件总线实现输入。
4. `TK-214`：作为 session 快照与回放实现输入。

## 10. 验收标准

1. session 域职责边界清晰，不与 memory/store/runtime 混淆。
2. 最小 session 契约可直接指导后续实现与测试。
3. 产物已登记依赖注册表并被至少两个后续任务回链消费。
