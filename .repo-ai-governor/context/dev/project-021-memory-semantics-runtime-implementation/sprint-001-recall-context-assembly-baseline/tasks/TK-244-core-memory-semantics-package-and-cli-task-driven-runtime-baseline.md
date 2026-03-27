# TK-244 core-memory-semantics package 与 CLI task-driven runtime baseline

- Status: completed
- Date: 2026-03-27
- Owner: AI-Agent
- Priority: P0
- Project: `project-021-memory-semantics-runtime-implementation`
- Sprint: `sprint-001-recall-context-assembly-baseline`

## 1. 任务目标

引入 `packages/core-memory-semantics`，并将 CLI task-driven runtime 的 memory path 从底层 snapshot 直连切到新的 recall/context assembly baseline。

## 2. Depends On

1. `TK-243`
2. `DA-239`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/module-overview.md`

## 3. 预期产物

1. `packages/core-memory-semantics/**`
2. `apps/cli/src/runtime/task-driven-run-runtime.ts` 对新的 semantics service 的接线
3. 相关 package / CLI tests
4. `DA-244`

## 4. 实施计划

1. 建立 `MemoryRecallService`、`MemoryContextAssembler` 与必要的 domain contracts/constants。
2. 以 `MemoryManager` 为 substrate 先实现 recall/context assembly baseline，不直接重写 canonical source。
3. 更新 CLI runtime 与测试，验证 `memorySelection -> recalled context -> stage inputs` 的新路径。

## 5. 验证

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm -s tsc -p tsconfig.build.json`
3. `pnpm exec vitest run apps/cli/test/runtime/task-driven-run-runtime.test.ts packages/core-memory-semantics/test/memory-semantics.unit.test.ts --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run check`

## 6. 执行记录

1. 2026-03-27：任务创建，状态初始化为 `planned`。
2. 2026-03-27：状态切换为 `in_progress`，开始收敛 `packages/core-memory-semantics` 包结构、service contract 与 CLI runtime integration points。
3. 2026-03-27：已完成 `core-memory-semantics` 新包、CLI recall/context assembly 接线、distribution runtime materialization 补齐与 `DA-244`。
