# @repo-ai-governor/memory-store-adapter

- Status: baseline
- Date: 2026-03-20
- Scope: `project-002-governance-core / TK-015`

## Purpose

提供统一的 Memory Store Provider 契约与适配器封装，保证 `core-memory/core-session` 仅依赖抽象接口，不与具体存储实现耦合。

## Baseline API

1. `MemoryStoreAdapter`
   - `read(request)`
   - `write(request)`
   - `query(request)`
   - `snapshot(options?)`
   - `archive(options?)`
2. `MemoryStoreProvider`（interface）
   - `read(namespace, key)`
   - `write(record)`
   - `query(request)`
   - `snapshot(options?)`
   - `archive(options?)`

## Notes

1. Adapter 负责统一错误模型映射（`GovernorErrorCode` + `RuntimeError`）。
2. Provider 负责具体存储实现（例如 `memory-providers/fs-csv`）。
3. 该包是 `core-memory` 与 provider 层之间的稳定边界，不承载业务编排逻辑。
