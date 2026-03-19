# Session 快照与回放基线（TK-214）

- Status: active
- Date: 2026-03-19
- Milestone: `M2`
- Sprint: `sprint-002`
- Task: `TK-214`

## 1. 目标

定义共享 session 的快照与回放契约，确保执行过程在中断、人工介入、故障恢复、复盘审计场景下可重建上下文并保持结果可解释。

## 2. 范围与非目标

1. 范围：
   - 固化快照触发点、快照资产结构与校验字段。
   - 固化回放请求/结果契约与模式语义。
   - 固化与事件总线、记忆层、审计层的对接边界。
2. 非目标：
   - 本任务不实现编排引擎重试策略细节（由 M3 `TK-306` 负责）。
   - 本任务不实现完整可视化回放界面。
   - 本任务不改变 M2 之前既有台账结构，只增加回放所需索引字段。

## 3. 快照契约（Draft）

```ts
enum SessionSnapshotReason {
  StageBoundary = "stage-boundary",
  PolicyEscalation = "policy-escalation",
  HumanDecision = "human-decision",
  ManualCheckpoint = "manual-checkpoint",
  SessionFinalized = "session-finalized",
}

enum SessionReplayMode {
  ExplainOnly = "explain-only",
  DryRun = "dry-run",
  StateRestore = "state-restore",
}

enum SessionReplayResultStatus {
  Success = "success",
  Partial = "partial",
  Failed = "failed",
  Cancelled = "cancelled",
}

interface SessionSnapshotRecord {
  snapshotId: string;
  executionId: string;
  executionSessionId: string;
  reason: SessionSnapshotReason;
  sequenceFrom: number;
  sequenceTo: number;
  memorySnapshotRef: string;
  eventSliceRef: string;
  artifactRefs: string[];
  checksum: string;
  capturedAt: string; // RFC3339 秒级
  capturedAtDisplay: string; // YYYY-MM-DD HH:mm:ss UTC±HH:MM
}

interface SessionReplayRequest {
  executionSessionId: string;
  snapshotId: string;
  mode: SessionReplayMode;
  requestedBy: string;
  requestedAt: string;
  requestedAtDisplay: string;
}
```

CS-009 落地要求：
1. `SessionSnapshotReason`、`SessionReplayMode`、`SessionReplayResultStatus` 集中放在 `src/constants/`。
2. 回放模式分支逻辑禁止散落字面量，统一通过枚举驱动。

## 4. 快照触发策略

1. 阶段边界：每个 stage 完成后强制快照。
2. 策略升级：命中 `confirm/escalate/block` 前后各落一个检查点。
3. 人工决策：人工 `approve/reject/revise` 后落快照。
4. 会话结束：`completed/cancelled` 强制终态快照。

## 5. 回放流程基线

1. `resolve`：校验 `snapshotId` 与 `executionSessionId` 绑定关系。
2. `hydrate`：加载 `memorySnapshotRef + eventSliceRef + artifactRefs`。
3. `reconcile`：校验 checksum 与 sequence 连续性。
4. `replay`：按 `mode` 执行解释、演练或状态恢复。
5. `record`：回写回放结果与审计字段。

## 6. 错误处理与恢复约束

1. `snapshot_missing`：阻断回放并触发依赖补齐建议。
2. `checksum_mismatch`：标记为 `partial`，要求人工确认继续。
3. `sequence_gap`：触发 `concurrency_conflict` 路径并回写审计。
4. `restore_blocked`：当策略门禁阻断 `state-restore` 时自动降级到 `explain-only`。

## 7. 与存储与审计层边界

1. 快照存储通过 `memory-store-adapter` 统一 `snapshot/archive` 契约。
2. 快照与回放结果必须回链 `execution_id/execution_session_id`。
3. 审计记录至少包含 `snapshot_id/replay_mode/replay_result_status/requested_by`。

## 8. 后续任务输入映射

1. `TK-215`：复用快照/回放字段补齐审计模型。
2. `TK-216`：将快照与回放可用性纳入 M2 退出测试。
3. `TK-315`：作为多 Agent 共享 session 协作约束接入输入。
4. `TK-316`：作为 M3 端到端回归可解释链路输入。

## 9. 验收标准

1. 快照触发点、快照字段与回放模式语义已固定。
2. 回放错误分类与降级策略可直接指导实现与验证。
3. 产物已登记依赖注册表并被至少两个后续任务回链消费。
