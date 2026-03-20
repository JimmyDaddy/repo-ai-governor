# @repo-ai-governor/memory-provider-sqlite-fs

- Status: baseline
- Date: 2026-03-20
- Scope: `project-002-governance-core / TK-022`

## Purpose

提供 `memory-store-adapter` 的 sqlite+fs 基线实现，以 sqlite 提供稳定索引与查询能力，以 fs 承载快照 payload 文件。

## Baseline API

1. `SqliteFsMemoryStoreProvider`
   - 实现 `MemoryStoreProvider` 契约。
2. `SqliteFsMemoryStoreProviderOptions`
   - `rootDirectory`（必填）
   - `databaseFileName/snapshotsDirectoryName`（可选）

## Notes

1. sqlite 数据库默认文件：`memory-store.sqlite`。
2. 快照 payload 默认落盘路径：`<rootDirectory>/snapshots/<snapshot_id>.json`。
3. 当前实现基于 Node.js `node:sqlite`（实验特性），建议在 Node.js 22+ 环境使用。
