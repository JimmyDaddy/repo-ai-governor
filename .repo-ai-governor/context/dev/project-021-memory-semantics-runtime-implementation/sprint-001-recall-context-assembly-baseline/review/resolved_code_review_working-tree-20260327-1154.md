# Code Review: project-021 working tree

- Status: resolved
- Date: 2026-03-27
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `packages/core-memory-semantics/src/types/interfaces/memory-semantics.interface.ts`
2. `packages/core-memory-semantics/src/memory-context-assembler.ts`
3. `apps/cli/src/runtime/task-driven-run-runtime.ts`
4. `apps/cli/test/runtime/task-driven-run-runtime.test.ts`
5. `apps/cli/src/cli-governance-runtime.ts`

## 2. Findings
### 2.1 [P1] Raw layered snapshots still leak into task-driven stage inputs and process globals
- 位置: `apps/cli/src/runtime/task-driven-run-runtime.ts:413`
- 问题描述: 这轮引入了 `MemoryRecallService` 和 `MemoryContextAssembler`，按注释本意应该把底层 snapshot 转成“prompt-safe and execution-safe memory context”。但 `CliTaskDrivenRunRuntime` 在构建 `commonTaskContextPayload` 和 `processDefinition.globals` 时，仍然把整个 `memoryRecall` 对象直接注入进去；而 `MemoryRecallResult` 类型本身包含 `selector` 和完整的 `layeredSnapshot`。这意味着原始 substrate snapshot、原始 payload 和底层选择器仍会被一并送进 stage inputs / globals，而不是只暴露已收敛的 `memoryContext`。
- 影响: 这会直接抵消本次 `runtime.memory-semantics` 改造的主要目标。首先，stage input 体积和敏感信息暴露面会继续按 raw snapshot 膨胀；其次，下游 runtime/adapter 仍可绕过 `MemoryContextAssembler` 继续消费底层 snapshot shape，bounded-context 边界没有真正建立。
- 建议: `memoryRecall` 应保留在 runtime 内部诊断或独立调试产物中，不应进入 task stage inputs 或 `processDefinition.globals`。面向执行链路只注入 `memorySelection`、`memorySnapshotSummary` 和收敛后的 `memoryContext`；如果确实需要 recall-level调试信息，也应提供去 substrate 化的精简 summary，而不是暴露 `layeredSnapshot`.

## 3. Notes
1. 这轮主要风险不在 package wiring，而在语义边界没有真正收紧。`core-memory-semantics` 已经提供了更安全的 `memoryContext`，但 CLI runtime 还没有完全切过去。

## 4. Verification
1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm exec vitest run packages/core-memory-semantics/test/memory-semantics.unit.test.ts apps/cli/test/runtime/task-driven-run-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./scripts/governance/check-code-review-status-sync.js`（通过）

## 复核结论（2026-03-27）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：当前 [task-driven-run-runtime.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/task-driven-run-runtime.ts) 不再把 `memoryRecall` 塞入 `commonTaskContextPayload` 或 `processDefinition.globals`；执行阶段只保留 `memorySelection`、`memorySnapshotSummary` 与 `memoryContext`。对应回归断言已补到 [task-driven-run-runtime.test.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/test/runtime/task-driven-run-runtime.test.ts)。
   - 处理：按 finding 建议完成修复，并把 raw layered snapshot 泄漏面从 stage inputs/globals 里移除。

### 验证命令
1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm exec vitest run apps/cli/test/runtime/task-driven-run-runtime.test.ts packages/core-memory-semantics/test/memory-semantics.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run check`（通过）

## 修复执行记录（2026-03-27）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/task-driven-run-runtime.ts`、`apps/cli/test/runtime/task-driven-run-runtime.test.ts`
   - 验证：`pnpm -s tsc -p tsconfig.json --noEmit && pnpm exec vitest run apps/cli/test/runtime/task-driven-run-runtime.test.ts packages/core-memory-semantics/test/memory-semantics.unit.test.ts --maxWorkers=1 --maxConcurrency=1 && pnpm run check`（通过）
   - 说明：`memoryRecall` 继续保留在 `CliTaskDrivenRunAssembly` 顶层供诊断使用，但不再进入 task stage inputs 或 process globals；执行链路只消费 `memorySelection`、`memorySnapshotSummary` 与 `memoryContext`。
