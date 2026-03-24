# DA-131 runtime memory 选择性注入与依赖定向快照

- Status: active
- Date: 2026-03-24
- Source Task: `TK-133`
- Project: `project-012-execution-context-optimization`
- Sprint: `sprint-002-ledger-review-gate-and-memory-follow-up`

## 1. 交付摘要

memory/context 装配已经从“无参数全量三层快照”升级为“execution/task/project/sprint/artifact 选择器驱动”的 selective snapshot。

## 2. 关键变化

1. `MemoryManager.loadLayeredSnapshot()` 新增 selective request，支持按 `executionId/taskId/projectId/sprintId/artifactIds/sessionId` 做定向查询与去重。
2. `AuditRecorder` 和 `SharedSessionManager` 写入时补齐了 `task/execution/artifact` 相关 tags，为后续 selective query 提供真实索引。
3. `CliTaskDrivenRunRuntime` 会根据 task card、active stream 与 input artifacts 生成 `memorySelection`，并把 selective memory snapshot 注入 task-driven stage inputs。
4. CLI run assembly 输出已携带 memory selection summary，可验证默认上下文不再被全量三层快照放大。

## 3. 证据路径

1. `packages/core-memory/src/memory-manager.ts`
2. `packages/core-memory/test/memory-manager.unit.test.ts`
3. `packages/core-session/src/audit-recorder.ts`
4. `packages/core-session/src/shared-session-manager.ts`
5. `apps/cli/src/runtime/task-driven-run-runtime.ts`
6. `apps/cli/test/runtime/task-driven-run-runtime.test.ts`

## 4. 结论

分析稿 `6.7 / P2` 中“运行时内存选择性加载”的缺口已完成第一轮实装收口，task-driven runtime 现在具备了轻量上下文装配路径。
