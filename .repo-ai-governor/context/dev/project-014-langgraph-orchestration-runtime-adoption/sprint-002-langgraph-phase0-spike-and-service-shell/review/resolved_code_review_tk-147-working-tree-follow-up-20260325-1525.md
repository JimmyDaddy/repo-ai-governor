# Code Review: TK-147 working tree follow-up

- Status: resolved
- Date: 2026-03-25
- Reviewer: AI-Agent
- Task: `TK-147`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-143-process-runtime-to-langgraph-adapter-boundary-and-state-contract-baseline.md`
  - `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-145-langgraph-phase-0-spike-dual-runtime-parity-and-rollout-plan.md`
  - `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-146-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`

## 1. Review Scope
1. `packages/core-runtime-langgraph/package.json`
2. `packages/core-runtime-langgraph/src/**`
3. `packages/core-runtime-langgraph/test/**`
4. `tsconfig.json`
5. `.repo-ai-governor/context/current-context.md`
6. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
7. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/**`
8. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/TK-143*.md`
9. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/TK-145*.md`
10. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/TK-146*.md`

## 2. Findings
### 2.1 [P1] graph adapter 只校验 edge source，不校验 destination，坏 IR 会被“成功编图”
- 位置: `packages/core-runtime-langgraph/src/compiled-ir-graph-adapter.ts:100`
- 问题描述: `createGraphEdges()` 只对 `edge.fromNodeId` 做存在性校验，然后直接把 `toNodeId` 写进 graph plan。这样一来，只要传入的 `ProcessCompiledIr` 没有 `compileErrors`，哪怕其中某条 edge 指向一个根本不存在的 node，adapter 仍会产出看似成功的 `LangGraphCompiledGraphPlan`，后续 `LangGraphRuntimeBackend.prepare()` 还会继续发出 `execution.ready/edge.ready` 事件。
- 影响: 从 workspace 快照或外部载入的损坏 IR 会在“编图成功”阶段被误判为可执行，cutover parity、recovery smoke 和后续 graph scheduler 会在更晚的节点调度阶段才暴露悬空 edge，破坏当前 sprint 需要的 fail-closed backend baseline。
- 建议: 在 adapter 中同时校验 `toNodeId`，对 dangling edge 直接抛出 `PROCESS_RUNTIME_NODE_NOT_FOUND` 或等价 runtime error，并补一条 destination-missing 单测。

### 2.2 [P2] terminal-status 契约把 `pending` 混入终态集合
- 位置: `packages/core-runtime-langgraph/src/constants/langgraph-runtime.constant.ts:28`
- 问题描述: `LANGGRAPH_RUNTIME_TERMINAL_STATUSES` 当前包含 `pending`，而 `LangGraphRuntimeBackend.prepare()` 又把 `currentStatus` 和 `supportedTerminalStatuses` 都建立在这套类型上。结果是同一契约既把 `pending` 当作当前运行中状态，又把它暴露成“terminal status”。
- 影响: 后续 `TK-148` 的 parity harness、selector 或 service shell 如果按字段名把 `supportedTerminalStatuses` 当成完成态集合使用，就会把尚未开始/尚未结束的 `pending` 错判成终态，污染 cutover 比较和恢复状态机语义。
- 建议: 将 `pending` 从 terminal 集合中剥离，拆成通用 execution status 与 terminal subset，或至少更正常量/类型/字段命名，并补一条契约测试固定语义。

## 3. Notes
1. 这轮 `task-ledger`、`sprint-plan`、`artifact-registry` 三条治理 gate 都是绿色；问题集中在 `core-runtime-langgraph` 的 runtime contract 正确性。
2. 你贴出来的旧 finding `packages/adapter-sdk/src/agent-cli-exec-operations-runtime.ts` 不在当前 diff 范围内，这轮没有把它继续算作本次 CR 结论。

## 4. Verification
1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm exec vitest run packages/core-runtime-langgraph/test/compiled-ir-graph-adapter.unit.test.ts packages/core-runtime-langgraph/test/langgraph-runtime-backend.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）

## 复核结论（2026-03-25）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P1] graph adapter 只校验 edge source，不校验 destination，坏 IR 会被“成功编图”`
   - 判定：**认可**
   - 证据：`CompiledIrGraphAdapter.createGraphEdges()` 现在同时校验 `fromNodeId` 和 `toNodeId`，并在 target 缺失时抛出 `PROCESS_RUNTIME_NODE_NOT_FOUND`；同时补了一条“持久化 IR edge 指向缺失 node”的单测。
   - 处理：纳入本轮修复。
2. `2.2 [P2] terminal-status 契约把 \`pending\` 混入终态集合`
   - 判定：**认可**
   - 证据：runtime constants 已拆成 `LANGGRAPH_RUNTIME_EXECUTION_STATUSES` 与 `LANGGRAPH_RUNTIME_TERMINAL_STATUSES`；`currentStatus` / lifecycle event 使用 execution status，`supportedTerminalStatuses` 不再包含 `pending`。
   - 处理：纳入本轮修复。

### 验证命令
1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm exec vitest run packages/core-runtime-langgraph/test/compiled-ir-graph-adapter.unit.test.ts packages/core-runtime-langgraph/test/langgraph-runtime-backend.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）
6. `pnpm run check`（通过）

## 修复执行记录（2026-03-25）

1. `2.1 [P1] graph adapter 只校验 edge source，不校验 destination，坏 IR 会被“成功编图”`：已完成
   - 变更文件：`packages/core-runtime-langgraph/src/compiled-ir-graph-adapter.ts`、`packages/core-runtime-langgraph/test/compiled-ir-graph-adapter.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-runtime-langgraph/test/compiled-ir-graph-adapter.unit.test.ts packages/core-runtime-langgraph/test/langgraph-runtime-backend.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：adapter 现在对 source/target node 都执行 fail-closed 校验。
2. `2.2 [P2] terminal-status 契约把 \`pending\` 混入终态集合`：已完成
   - 变更文件：`packages/core-runtime-langgraph/src/constants/langgraph-runtime.constant.ts`、`packages/core-runtime-langgraph/src/constants/index.ts`、`packages/core-runtime-langgraph/src/index.ts`、`packages/core-runtime-langgraph/src/types/interfaces/langgraph-runtime-backend.interface.ts`、`packages/core-runtime-langgraph/src/langgraph-runtime-backend.ts`、`packages/core-runtime-langgraph/test/langgraph-runtime-backend.unit.test.ts`
   - 验证：`pnpm -s tsc -p tsconfig.json --noEmit`（通过）
   - 说明：已拆分 execution status 与 terminal status，避免 `pending` 被误判为终态。
