# @repo-ai-governor/core-process

- Status: baseline
- Date: 2026-03-20
- Scope: `project-002-governance-core / TK-013`

## Purpose

提供 Process DSL 与 Compiler IR v1 的统一契约，并沉淀 `compiled-ir` 快照落盘与版本兼容校验基线。

## Baseline API

1. `ProcessCompiler`
   - `compile(definition)`
   - `isCompilable(compiledIr)`
   - `assertIrVersionCompatibleOrThrow(irVersion)`
   - `persistCompiledIrSnapshot(workspaceRoot, compiledIr)`

## Notes

1. `irVersion` 当前固定为 `1.0.0`。
2. Loop 节点必须显式声明 `maxCycles` 与 `maxWallTimeSeconds`。
3. 编译快照默认写入 `<workspace_root>/context/compiled-ir/<execution_id>.json`。
4. 快照 JSON 持久化字段使用 `snake_case`（对齐技术方案契约）；内存对象保持 TypeScript `camelCase`。
