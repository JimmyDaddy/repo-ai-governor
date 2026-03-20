# TK-022 sqlite+fs Memory Provider 基线

- Status: completed
- Date: 2026-03-20
- Owner: AI-Agent
- Priority: P0
- Project: `project-002-governance-core`
- Sprint: `sprint-001-process-runtime-and-memory-baseline`

## 1. 任务目标

基于现有 `MemoryStoreProvider` 抽象交付 `sqlite+fs` provider 基线，实现 `read/write/query/snapshot/archive` 能力并补齐跨层 smoke 覆盖。

## 2. Depends On

1. `TK-015`
2. `DA-022`

## 3. 预期产物

1. `DA-023` sqlite+fs provider baseline 文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/tasks/TK-015-memory-session-store-baseline.md` (`DA-022`)
2. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`（`§4.2.1`）
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`（`§7 Step 3`）

## 5. 实施摘要

1. 新增 `packages/memory-providers/sqlite-fs` 包，交付 `SqliteFsMemoryStoreProvider` 并实现 `MemoryStoreProvider` 五类能力：
   - `read/write/query/snapshot/archive`
2. sqlite 层负责结构化索引与查询，fs 层负责快照 payload 文件落盘：
   - sqlite 默认库：`memory-store.sqlite`
   - snapshot payload：`<root>/snapshots/<snapshot_id>.json`
3. provider 初始化阶段内置 sqlite schema 建表与索引初始化，保证本地 baseline 可直接运行。
4. 新增 `test/memory-sqlite-fs-provider.smoke.test.ts`，覆盖 memory 与 session 跨层协作链路，验证关闭会话后的写保护语义保持一致。
5. 新增 `packages/memory-providers/sqlite-fs/README.md` 记录接口与运行约束（Node.js `node:sqlite`）。

## 6. 产出

1. `packages/memory-providers/sqlite-fs/**`
2. `test/memory-sqlite-fs-provider.smoke.test.ts`
3. `DA-023` `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/tasks/TK-022-sqlite-fs-memory-provider-baseline.md`
4. `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/review/verified_review_tk-022-sqlite-fs-memory-provider-baseline.md`

## 7. 验证

1. `pnpm run typecheck`
2. `pnpm run test -- memory-sqlite-fs-provider.smoke.test.ts`
3. `pnpm run check`

## 8. 执行记录

1. 2026-03-20：任务启动，状态切换为 `in_progress`。开始新增 `packages/memory-providers/sqlite-fs` 并对齐 `memory-store-adapter` 契约与测试基线。
2. 2026-03-20：完成 sqlite+fs provider 基线交付并通过全量门禁，CR 复核结论“认可”，报告推进为 `verified_review_tk-022-sqlite-fs-memory-provider-baseline.md`。
