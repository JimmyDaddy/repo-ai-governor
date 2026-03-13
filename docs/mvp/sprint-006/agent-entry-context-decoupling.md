# AGENTS Context Decoupling

- Date: 2026-03-14
- Task: `TK-107`

## Goal

把 `AGENTS.md` 变成稳定入口，把会随着项目、sprint 和并发 stream 变化的执行上下文移到独立文件。

## Decision

1. `AGENTS.md` 保留 `Current Context` 章节，但只声明依赖文件，不再内联当前 project/sprint。
2. 新增默认上下文文件 `.repo-ai-governor/context/current-context.md`。
3. 上下文文件采用 `Primary Stream + Active Streams` 结构，为并发任务保留扩展位。
4. `init` 负责生成该文件，`doctor` 负责校验其存在性。
5. schema 新增 `agentEntry.contextFile`，保证工具生成和运行时都能通过结构化配置定位该文件。

## Why

1. 切换 sprint 时只需要更新上下文文件，避免频繁修改 `AGENTS.md`。
2. 入口文件保持稳定，有利于 AI/IDE 形成一致入口。
3. 并发任务可以通过追加 stream 条目管理，而不是不断覆写单一上下文块。

## Impact

1. 当前仓库 `AGENTS.md` 已改为依赖 `.repo-ai-governor/context/current-context.md`。
2. 新生成仓库将默认拥有独立上下文文件。
3. `doctor` 会把缺失上下文文件识别为 warning，便于渐进迁移。
