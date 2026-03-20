# @repo-ai-governor/core-memory

- Status: baseline
- Date: 2026-03-20
- Scope: `project-002-governance-core / TK-015`

## Purpose

提供 Memory Manager 基线，对外统一封装 `read/write/query/snapshot/archive`，并输出规范记忆与执行记忆的分层快照视图。

## Baseline API

1. `MemoryManager`
   - `readEntry(request)`
   - `writeEntry(request)`
   - `queryEntries(request?)`
   - `snapshot(request?)`
   - `archiveEntries(request?)`
   - `loadLayeredSnapshot()`
2. `MemoryScope`
   - `NORMATIVE`
   - `EXECUTION`
   - `SESSION`

## Notes

1. `core-memory` 仅依赖 `memory-store-adapter` 抽象，不依赖具体 provider 实现。
2. 分层快照返回 `normative/execution/session` 三类记录，供 runtime 与 session 层组合消费。
3. 本包不负责会话状态机规则，会话生命周期由 `core-session` 负责。
