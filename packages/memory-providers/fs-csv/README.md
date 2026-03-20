# @repo-ai-governor/memory-provider-fs-csv

- Status: baseline
- Date: 2026-03-20
- Scope: `project-002-governance-core / TK-015`

## Purpose

提供 `memory-store-adapter` 的文件系统 + CSV 基线实现，用于本地 `read/write/query/snapshot/archive` 存储能力落地。

## Baseline API

1. `FsCsvMemoryStoreProvider`
   - 实现 `MemoryStoreProvider` 契约。
2. `FsCsvMemoryStoreProviderOptions`
   - `rootDirectory`（必填）
   - `recordsFileName/snapshotsFileName/archiveFileName/snapshotsDirectoryName`（可选）

## Notes

1. 记录存储默认文件：
   - `memory-records.csv`
   - `memory-snapshots.csv`
   - `memory-archive.csv`
2. 快照 payload 默认落盘在 `<rootDirectory>/snapshots/<snapshot_id>.json`。
3. `archive` 默认按 `namespace/updatedBefore/keys` 组合筛选并返回归档数量。
