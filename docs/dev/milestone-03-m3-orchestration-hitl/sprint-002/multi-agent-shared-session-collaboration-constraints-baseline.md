# 多 Agent 共享 Session 协作约束基线（TK-315）

- Status: active
- Date: 2026-03-19
- Milestone: `M3`
- Sprint: `sprint-002`
- Task: `TK-315`

## 1. 目标

定义多 Agent 在同一 `execution_session_id` 下的协作约束、冲突处理与审计规则，保障执行方向一致与可回放。

## 2. 协作契约（Draft）

```ts
enum SessionCollaborationMode {
  Shared = "shared",
}

enum SessionMutationPolicy {
  MergePatch = "merge-patch",
  LastWriterWins = "last-writer-wins",
  ManualResolve = "manual-resolve",
}

enum SessionConsistencyStatus {
  Consistent = "consistent",
  ConflictDetected = "conflict-detected",
  Reconciled = "reconciled",
}
```

CS-009 落地要求：以上有限集合在代码实现阶段集中到 `src/constants/` 管理。

## 3. 协作不变量

1. 同一执行链路必须共享同一个 `execution_session_id`。
2. 阶段执行前读取最新 session 快照。
3. 阶段完成后回写增量上下文与事件。
4. Policy 决策、HITL 决策、CR 状态必须写入 session 事件流。

## 4. 冲突与恢复

1. 冲突检测基于 `session_version + change_set`。
2. 默认策略 `merge-patch`，冲突不可解则 `manual-resolve`。
3. 冲突事件必须追加审计并可回放。

## 5. 后续任务输入映射

1. `TK-316`：消费共享 session 协作约束做端到端回归。
2. `TK-416`：消费冲突处理策略做兼容性回归。
3. `TK-506`：消费会话一致性事件做审计回放链路设计。

## 6. 验收标准

1. 多 Agent 协作不变量明确且可验证。
2. 冲突检测与处理策略可执行。
3. 会话事件流满足审计与回放要求。
