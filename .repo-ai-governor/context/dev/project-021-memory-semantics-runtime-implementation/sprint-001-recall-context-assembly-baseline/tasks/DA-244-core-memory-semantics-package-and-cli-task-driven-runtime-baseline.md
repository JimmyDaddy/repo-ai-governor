# DA-244 core-memory-semantics package and CLI task-driven runtime baseline

- Date: 2026-03-27
- Producer Task: `TK-244`
- Project: `project-021-memory-semantics-runtime-implementation`
- Sprint: `sprint-001-recall-context-assembly-baseline`

## 1. Summary

1. 新增 `@repo-ai-governor/core-memory-semantics` bounded-context baseline，正式落地 `MemoryRecallService` 与 `MemoryContextAssembler`。
2. CLI task-driven runtime 的 memory path 已从底层 `memorySnapshot` 直连切到显式 `memorySelection -> memoryRecall -> memoryContext` 路径。
3. distribution runtime materialization 已补齐 `core-memory-semantics`，避免源码通过但 `dist`/IDE smoke 缺少内部包。

## 2. Delivered Changes

1. 新包与测试：
   - `packages/core-memory-semantics/package.json`
   - `packages/core-memory-semantics/src/**`
   - `packages/core-memory-semantics/test/memory-semantics.unit.test.ts`
2. CLI 接线：
   - `apps/cli/src/runtime/task-driven-run-runtime.ts`
   - `apps/cli/src/cli-governance-runtime.ts`
   - `apps/cli/src/types/interfaces/cli-task-driven-run.interface.ts`
   - `apps/cli/test/runtime/task-driven-run-runtime.test.ts`
3. workspace/runtime wiring：
   - `apps/cli/package.json`
   - `tsconfig.json`
   - `vitest.internal-alias.ts`
4. distribution/runtime truthfulness：
   - `scripts/build/copy-runtime-assets.js`
   - `scripts/release/verify-local-distribution.js`

## 3. Behavioral Outcome

1. `core-memory` 继续作为 substrate manager，不承担新的语义 owner 职责。
2. `runtime.memory-semantics` 已有首轮 contract-to-code 映射：
   - metadata-first recall ordering
   - source refs / sensitivity tracing
   - truncation-aware context assembly
3. CLI 执行阶段现在消费 `memoryRecall` 与 `memoryContext`，而不是直接消费原始 layered snapshot。

## 4. Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm -s tsc -p tsconfig.build.json`
3. `pnpm exec vitest run apps/cli/test/runtime/task-driven-run-runtime.test.ts packages/core-memory-semantics/test/memory-semantics.unit.test.ts --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run check`
