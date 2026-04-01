# TK-476 migrate shared session manager and runtime consumers to append-only session event log semantics

- Status: planned
- Date: 2026-04-02
- Owner: AI-Agent
- Priority: P0
- Project: `project-036-runtime-durable-storage-and-registry-cutover`
- Sprint: `sprint-001-session-durable-storage-foundation`

## 1. 任务目标

让 `SharedSessionManager`、`local-orchestration-service-session-runtime`、`/resume`、replay 与 shell diagnostics 从“整份 session payload 回写”迁移到 `append-only session event log + summary/projection` 语义。

## 2. Depends On

1. `TK-475`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/contracts/session-durable-storage-contract.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/adrs/sqlite-fs-default-runtime-truth-and-rendered-csv-views.md`

## 3. 预期产物

1. `SharedSessionManager` 的 append-only durable write path
2. `/resume` 与 replay 的 event-log-based restore path
3. session diagnostics / projection 写入与消费基线
4. 针对 long-running turn / missing-session / canonical turn index 的回归验证

## 4. 实施计划

1. 将 session 写入语义拆为 summary、event append 与 diagnostics/projection 更新。
2. 让 canonical `turn_index` 以 `TURN_SUBMITTED` 为单调推进锚点。
3. 重写 `/resume`、replay 与 shell diagnostics 的事实源，使其以 metadata + event log + projection 恢复。
4. 补齐长任务、失败收尾、mid-turn recovery 与 cross-manager consistency regression。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `pnpm run build`
3. `packages/core-session/**`、`packages/core-orchestration-service/**`、`apps/cli/**` 的定向 durable-session 回归集合

## 6. 执行记录

1. 2026-04-02：任务创建，状态初始化为 `planned`。
