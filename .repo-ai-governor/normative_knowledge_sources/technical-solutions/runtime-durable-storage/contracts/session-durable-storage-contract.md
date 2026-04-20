# Session Durable Storage Contract

- Status: active
- Date: 2026-04-16
- Contract ID: `contract.runtime.session-durable-storage.v1`
- Producer Module: `runtime.durable-storage`

## 1. 目标

定义 runtime session durable truth 的最小结构、写入语义与恢复边界，避免长任务在收尾阶段因为 session blob 整体回写失败而丢失 canonical session continuity。

## 2. Scope

1. `sessions` 摘要事实
2. `session_events` append-only event log
3. `session_diagnostics` / projection
4. `session_delivery_workflows` 或等价 delivery workflow projection
5. session write transaction 与 recovery/replay baseline

## 3. Required Contract

1. 默认 durable truth 应使用支持事务和稳定并发语义的 machine-readable backend；当前推荐默认值为 `sqlite-fs`。
2. session durable truth 不应继续以“整份 session payload blob 回写”为主要模型。
3. session 持久化至少应拆分为：
   - `sessions`
   - `session_events`
   - `session_diagnostics` 或等价 projection
4. `session_events` 必须支持 append-only 事件追加，作为 replay 与 `/resume` 的主要事实源。
5. `turn_count` / canonical `turn_index` 必须以 `TURN_SUBMITTED` 为单调推进锚点，而不是仅按 `TURN_COMPLETED` 计数。
6. 每次 session 变更至少要在同一事务里完成：
   - `append event`
   - `update session summary`
   - `update required projection`
7. 收尾阶段写入 `TURN_COMPLETED / TURN_FAILED` 时，不得依赖先读出完整历史 blob 才能完成写回。
8. `/resume`、replay 与 shell diagnostics 必须以 `session metadata + event log + latest projection` 为恢复事实源。
9. 当 `deliver` workflow 已进入 governed phase machine 时，durable storage 可以持有 presenter-safe workflow projection，包括：
   - `current_phase`
   - `related_artifact_paths`
   - `pending_confirmation`
   - `blocked_reason`
   - `phase_result_summaries`
10. 上述 delivery workflow projection 只能作为 orchestration summary / backlink 索引；不得替代 approved durable brief、technical-solution lifecycle、task ledger、review artifact 或 `CR-xxx` 的 canonical truth。

## 4. Recommended Physical Model

1. `sessions`
   - `session_id`
   - `status`
   - `execution_id`
   - `process_id`
   - `created_at`
   - `updated_at`
   - `closed_at`
   - `context_json`
   - `turn_count`
   - `last_event_id`
2. `session_events`
   - internal `id`
   - `session_id`
   - `event_id`
   - `event_index`
   - `event_type`
   - `created_at`
   - `payload_json`
   - `turn_index`
   - `stream_sequence`
3. `session_diagnostics`
   - internal `id`
   - `session_id`
   - `turn_index`
   - `category`
   - `detail_json`
   - `created_at`
4. `session_delivery_workflows`
   - internal `id`
   - `session_id`
   - `workflow_id`
   - `current_phase`
   - `pending_confirmation`
   - `blocked_reason`
   - `related_artifact_paths_json`
   - `phase_result_summaries_json`
   - `updated_at`

## 5. Non-Goals

1. 不规定 recall policy 与 memory semantic selection 细节。
2. 不规定 interactive shell presenter 的具体 UI 呈现。
3. 不要求所有 durable surfaces 同步采用同一张 schema。
4. 不创建新的 requirement lifecycle registry、solution lifecycle registry 或 review lifecycle registry。
