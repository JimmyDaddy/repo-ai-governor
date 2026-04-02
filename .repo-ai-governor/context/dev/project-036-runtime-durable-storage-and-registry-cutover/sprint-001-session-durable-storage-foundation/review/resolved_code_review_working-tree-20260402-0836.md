# Code Review: project-036 sprint-001 working tree durable-session cutover

- Status: resolved
- Date: 2026-04-02
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `packages/core-session/src/shared-session-manager.ts`
2. `packages/core-session/src/types/interfaces/shared-session.interface.ts`
3. `packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts`
4. `packages/core-session/test/shared-session-manager.unit.test.ts`
5. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
6. `packages/memory-providers/sqlite-fs/src/sqlite-fs-memory-store-provider.ts`
7. `packages/memory-providers/sqlite-fs/test/sqlite-fs-memory-store-provider.unit.test.ts`

## 2. Findings
### 2.1 [P1] Partial legacy-session migration can silently drop historical events
- 位置: `packages/core-session/src/shared-session-manager.ts:440`
- 问题描述: `migrateLegacySessionPayload()` only checks whether `existingEventRecords.length === 0` before deciding whether to backfill the legacy blob into append-only event rows. If a previous migration attempt crashed after writing only part of the event rows, the next read sees a non-empty event log, skips replaying the missing legacy events, and still writes a summary row with the full `eventCount/turnCount`. After that, all future reads hydrate from the incomplete durable event log, so the missing historical events are silently lost while the summary falsely claims they still exist.
- 影响: This is a durable data-loss window exactly on the crash-recovery path the sqlite/event-log cutover is supposed to harden. Session replay, audit reconstruction, resume cursors, and later turn numbering can all become inconsistent after one interrupted migration.
- 建议: Migration should verify completeness, not mere non-emptiness. Either rebuild the full event log idempotently from the legacy blob when the persisted count/order does not match, or detect partial migration and fail closed instead of committing a summary row that points to an incomplete append-only history. Add a regression test for “legacy blob + partially written event records”.

### 2.2 [P1] Concurrent appenders can assign the same `eventIndex` and `turnIndex`
- 位置: `packages/core-session/src/shared-session-manager.ts:107`
- 问题描述: `appendEvent()` derives `nextEventIndex` and submitted-turn numbering from a previously read summary (`session.eventCount` / `turnCount`) and then writes the new event under a key that includes the derived index plus a unique `eventId`. Two writers appending to the same session concurrently will therefore compute the same next index, both persist successfully under different keys, and then race to overwrite the summary row with the same `eventCount` and potentially the same `turnCount`. The hydrated event log can then contain duplicate `eventIndex` values, duplicate turn numbers, and an under-reported summary count.
- 影响: `LocalOrchestrationServiceSessionRuntime` now uses `eventIndex` as the canonical event sequence/cursor, so duplicate indices break resume ordering and can cause skipped or ambiguous stream replay in the multi-agent shared-session path this manager is meant to support.
- 建议: Introduce an atomic monotonic allocator for session event/turn indices before writing append-only rows, or persist by event id first and derive the canonical sequence during a single-writer commit step. At minimum, add a concurrency regression test that appends from two writers to the same session and verifies unique ordered `eventIndex` / `turnIndex`.

## 3. Notes
1. 你贴的旧 finding `apps/cli/src/runtime/session-main-supervisor-runtime.ts:492-499` 不在当前 working tree 变更范围内，这轮没有把它当作新的 finding 复报。
2. 本轮 sqlite key-prefix query 和 distribution-default 的配套变更看起来是同步的；我没有在这些配套改动里再发现单独的新增回归点。

## 4. Verification
1. `/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run packages/core-session/test/shared-session-manager.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/memory-providers/sqlite-fs/test/sqlite-fs-memory-store-provider.unit.test.ts test/memory-sqlite-fs-provider.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 复核结论（2026-04-02）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：当前 [shared-session-manager.ts](/Users/jimmydaddy/study/ai-governor/packages/core-session/src/shared-session-manager.ts#L493) 已将 legacy migration 改为“验证已有 durable rows 是否仍是兼容前缀，再幂等回放整段 legacy history”，并在 [shared-session-manager.ts](/Users/jimmydaddy/study/ai-governor/packages/core-session/src/shared-session-manager.ts#L578) 对 summary/event-log 不一致直接 fail-closed，不再允许 incomplete event log 配合完整 summary 静默落盘。
   - 处理：已接受并修复，补了“部分迁移只写入 prefix event rows”回归到 [shared-session-manager.unit.test.ts](/Users/jimmydaddy/study/ai-governor/packages/core-session/test/shared-session-manager.unit.test.ts#L238)。
2. `2.2`
   - 判定：**认可**
   - 证据：当前 [shared-session-manager.ts](/Users/jimmydaddy/study/ai-governor/packages/core-session/src/shared-session-manager.ts#L121) 的 mutating path 已统一走 [shared-session-manager.ts](/Users/jimmydaddy/study/ai-governor/packages/core-session/src/shared-session-manager.ts#L545) 的 per-session mutation lock，同一进程内多 manager 共享同一 session 时不会再并发分配相同 `eventIndex/turnIndex`。
   - 处理：已接受并修复，补了确定性并发单元回归到 [shared-session-manager.unit.test.ts](/Users/jimmydaddy/study/ai-governor/packages/core-session/test/shared-session-manager.unit.test.ts#L313)，并补了 fs-csv 跨 manager 并发 smoke 到 [memory-session-store.integration.test.ts](/Users/jimmydaddy/study/ai-governor/test/memory-session-store.integration.test.ts#L199)。

### 验证命令
1. `pnpm exec biome check packages/core-session/src/shared-session-manager.ts packages/core-session/test/shared-session-manager.unit.test.ts test/memory-session-store.integration.test.ts packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`（通过）
2. `/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run packages/core-session/test/shared-session-manager.unit.test.ts test/memory-session-store.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run build`（通过）

## 修复执行记录（2026-04-02）

1. `2.1`：已完成
   - 变更文件：`packages/core-session/src/shared-session-manager.ts`、`packages/core-session/test/shared-session-manager.unit.test.ts`
   - 验证：`pnpm exec biome check packages/core-session/src/shared-session-manager.ts packages/core-session/test/shared-session-manager.unit.test.ts test/memory-session-store.integration.test.ts packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`、`/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run packages/core-session/test/shared-session-manager.unit.test.ts test/memory-session-store.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`（通过）
   - 说明：legacy blob 迁移现在要求已有 durable rows 与 legacy history 前缀兼容，并执行整段 idempotent replay；若 summary/event-log 已经不一致，会直接 fail-closed。
2. `2.2`：已完成
   - 变更文件：`packages/core-session/src/shared-session-manager.ts`、`packages/core-session/test/shared-session-manager.unit.test.ts`、`test/memory-session-store.integration.test.ts`
   - 验证：`pnpm exec biome check packages/core-session/src/shared-session-manager.ts packages/core-session/test/shared-session-manager.unit.test.ts test/memory-session-store.integration.test.ts packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`、`/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run packages/core-session/test/shared-session-manager.unit.test.ts test/memory-session-store.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`（通过）
   - 说明：同一进程内的 session mutation 现已按 `sessionId` 串行化，避免并发 append 复用同一 `eventIndex/turnIndex`。
