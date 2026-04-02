# TK-502 integrate remote-api streaming liveness and execution diagnostics projection

- Status: planned
- Date: 2026-04-02
- Owner: AI-Agent
- Priority: P1
- Project: `project-037-agent-invoke-liveness-and-timeout-governance-rollout`
- Sprint: `sprint-002-cross-adapter-liveness-rollout-and-diagnostics`

## 1. 任务目标

让 `remote_api` stream 活动、request id、abort/cancel 语义与 partial-output 快照正式接入 shared invoke-liveness contract、execution summary 与 execution event stream。

## 2. Depends On

1. `TK-486`
2. `TK-501`
3. `packages/adapters/codex/src/codex-agent-adapter.ts`
4. `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
5. `packages/adapter-sdk/src/types/interfaces/agent-protocol.interface.ts`

## 3. 预期产物

1. remote-api stream -> invoke-liveness signal 映射
2. `remote_request_id` / cancel mechanism 投影
3. execution summary / event stream liveness 对齐
4. partial-output preservation 基线
5. remote-api stall / abort diagnostics baseline

## 4. 实施计划

1. 将 OpenAI / Anthropic stream token 与 completion 信号映射到 shared liveness collector。
2. 为 remote-api 路径 materialize `last_transport_activity_at`、`last_semantic_progress_at` 与 `remote_request_id`。
3. 将 `local_abort_only` / provider cancel attempt 语义接入 execution diagnostics 和终态分类。
4. 补齐 remote-api stream 定向回归与 execution summary 验证。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run build`
4. `remote_api stream + invoke-liveness` 相关定向测试集合

## 6. 执行记录

1. 2026-04-02：任务创建，状态初始化为 `planned`；从 `TK-501` baseline 拆分 remote-api streaming liveness / execution diagnostics follow-through。
