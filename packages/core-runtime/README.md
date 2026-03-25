# @repo-ai-governor/core-runtime

- Status: baseline-in-progress
- Date: 2026-03-20
- Scope: `project-002-governance-core / TK-014`

## Purpose

提供 Process Runtime 控制流执行基线，统一执行 `Sequential/Parallel/Loop/Condition` 节点并沉淀中断语义（timeout/cancelled）。

## Baseline API

1. `ProcessRuntimeEngine`
   - `execute(compiledIr, stageHandler, options)`
2. `ProcessRuntimeFacade`
   - `prepare(compiledIr, options)`
   - `selectBackend(options)`
3. `ProcessRuntimeParityHarness`
   - `compare({ baseline, candidate })`
   - `createExecutionSnapshot(runtimeResult)`

## Notes

1. 运行时默认在内存层执行，不直接承担审计/持久化写入职责。
2. `Parallel` 采用 `allOf` 聚合基线，不包含 join-node 去重语义。
3. `Loop` 通过 `maxCycles` 与 `maxWallTimeSeconds` 双限制防止长时悬挂。
4. `TK-148` 开始引入 facade backend selector 与短生命周期 parity harness，但 CLI 主链接线仍保留到后续任务。
