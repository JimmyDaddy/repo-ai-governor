# TK-476 migrate shared session manager and runtime consumers to append-only session event log semantics

- Status: completed
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
2. 2026-04-02：状态切换为 `active`，开始将 `SharedSessionManager` 的 durable write path 从单条 legacy session blob 回写迁移到 `session summary + append-only session event records + diagnostic projection`。
3. 2026-04-02：完成第一批实现：`SharedSessionManager` 现按 `sessionId` 摘要记录 + `sessionId:event:*` append-only event records 持久化，并在首次读取 legacy blob 时自动迁移到新模型；terminal/detail-rich turn event 会额外写入 session diagnostic projection。
4. 2026-04-02：`local-orchestration-service-session-runtime` 已将 canonical `turnIndex` 明确写入 `TURN_SUBMITTED` payload，并改为优先使用 session summary 的 `turnCount` 作为下一轮 turn 锚点；`toSessionSummary` / subscription sequence 也改为读取 summary/event-log 元数据而不是假设整份 events blob 重写。
5. 2026-04-02：验证通过：`pnpm exec biome check packages/core-session/src/shared-session-manager.ts packages/core-session/src/types/interfaces/shared-session.interface.ts packages/core-session/src/types/interfaces/index.ts packages/core-session/test/shared-session-manager.unit.test.ts packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`；`/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run packages/core-session/test/shared-session-manager.unit.test.ts test/memory-session-store.integration.test.ts test/memory-sqlite-fs-provider.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts --maxWorkers=1 --maxConcurrency=1`；`/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run apps/cli/test/runtime/session-shell-transcript-store.test.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/react-cli-runner.test.ts --maxWorkers=1 --maxConcurrency=1`；`pnpm run build`。
6. 2026-04-02：确认 `TK-476` 目标已达成并切换为 `completed`；当前基线采用 `session summary + append-only event records + diagnostic projection` 的等价 durable schema/transaction 语义，`/resume`、subscription replay 与 shell consumer 继续通过 `getSession()` 的 event-log hydrate 路径恢复，而不再依赖整份 session blob rewrite。
