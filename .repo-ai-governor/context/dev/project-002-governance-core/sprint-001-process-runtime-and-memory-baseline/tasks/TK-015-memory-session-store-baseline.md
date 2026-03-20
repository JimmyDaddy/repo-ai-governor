# TK-015 Memory/Session/Store 基线

- Status: completed
- Date: 2026-03-20
- Owner: AI-Agent
- Priority: P0
- Project: `project-002-governance-core`
- Sprint: `sprint-001-process-runtime-and-memory-baseline`

## 1. 任务目标

交付 `core-memory`、`core-session`、`memory-store-adapter` 契约并落地 `memory-providers/fs-csv` 基线实现。

## 2. Depends On

1. `TK-013`
2. `TK-014`
3. `DA-020`
4. `DA-021`

## 3. 预期产物

1. `DA-022` memory session store baseline 文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/tasks/TK-013-process-dsl-and-compiler-ir-v1-baseline.md` (`DA-020`)
2. `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/tasks/TK-014-runtime-control-flow-engine-baseline.md` (`DA-021`)
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`（`§4.3`、`§4.2.1`）
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`（Memory & Context Layer）

## 5. 实施摘要

1. 新增 `packages/memory-store-adapter` 包，定义 `MemoryStoreProvider` 抽象契约与 `MemoryStoreAdapter` 统一封装，覆盖 `read/write/query/snapshot/archive` 五类能力并统一错误映射。
2. 新增 `packages/memory-providers/fs-csv` provider 基线，实现本地文件系统 + CSV 落盘能力：
   - `memory-records.csv`
   - `memory-snapshots.csv`
   - `memory-archive.csv`
   - `<root>/snapshots/<snapshot_id>.json`
3. 新增 `packages/core-memory` 包，提供 `MemoryManager` 分层入口，支持 `normative/execution/session` 三层快照读取与通用写入封装。
4. 新增 `packages/core-session` 包，提供 `SharedSessionManager` 会话生命周期管理：
   - `open/get/appendEvent/updateContext/finalize/list`
   - 关闭会话后禁止继续变更
   - payload 结构校验与标准化错误输出
5. 扩展 `GovernorErrorCode`：
   - `MEMORY_STORE_READ_FAILED`
   - `MEMORY_STORE_WRITE_FAILED`
   - `MEMORY_STORE_QUERY_FAILED`
   - `MEMORY_STORE_SNAPSHOT_FAILED`
   - `MEMORY_STORE_ARCHIVE_FAILED`
   - `MEMORY_SESSION_NOT_FOUND`
   - `MEMORY_SESSION_ALREADY_CLOSED`
   - `MEMORY_SESSION_INVALID_STATUS`
   - `MEMORY_SESSION_PAYLOAD_INVALID`
6. 新增跨层 smoke 测试 `test/memory-session-store.smoke.test.ts`，覆盖 provider/adapter/memory/session 协作链路。

## 6. 产出

1. `packages/memory-store-adapter/**`
2. `packages/memory-providers/fs-csv/**`
3. `packages/core-memory/**`
4. `packages/core-session/**`
5. `packages/shared/src/errors/error-code.constant.ts`
6. `test/memory-session-store.smoke.test.ts`
7. `DA-022` `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/tasks/TK-015-memory-session-store-baseline.md`
8. `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/code-review/verified_review_tk-015-memory-session-store-baseline.md`

## 7. 验证

1. `pnpm run typecheck`
2. `pnpm run test -- memory-session-store.smoke.test.ts`
3. `pnpm run check`

## 8. 执行记录

1. 2026-03-20：任务启动，状态切换为 `in_progress`。开始设计 `core-memory`、`core-session`、`memory-store-adapter` 与 `memory-providers/fs-csv` 的最小契约与目录骨架，并校准与 runtime 的数据边界。
2. 2026-03-20：完成 Memory/Session/Store 基线交付并通过全量门禁，CR 复核结论“认可”，报告推进为 `verified_review_tk-015-memory-session-store-baseline.md`。
