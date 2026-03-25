# Code Review: TK-148 working tree follow-up

- Status: resolved
- Date: 2026-03-25
- Reviewer: AI-Agent
- Task: `TK-148`
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
1. `packages/core-runtime/src/process-runtime-facade.ts`
2. `packages/core-runtime/src/process-runtime-parity-harness.ts`
3. `packages/core-runtime/src/types/interfaces/runtime-facade.interface.ts`
4. `packages/core-runtime/src/index.ts`
5. `packages/core-runtime/package.json`
6. `packages/core-runtime/README.md`
7. `packages/core-runtime/test/process-runtime-facade.unit.test.ts`
8. `packages/shared/src/errors/error-code.constant.ts`
9. `vitest.internal-alias.ts`
10. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
11. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/plan.md`
12. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/TK-148-process-runtime-facade-backend-selector-and-cutover-parity-harness-baseline.md`
13. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-148-process-runtime-facade-backend-selector-and-cutover-parity-harness-baseline.md`

## 2. Findings
### 2.1 [P1] parity harness 没有比较本任务刚引入的 prepared execution profile 契约
- 位置: `packages/core-runtime/src/process-runtime-parity-harness.ts:48`
- 问题描述: `TK-148`/`DA-148` 明确把 `entryNodeId`、`currentStatus`、`initialNodeIds`、`supportedInterruptKinds`、`supportedTerminalStatuses`、`lifecycleEvents`、`nodeCount/edgeCount` 定义成 facade 新增的统一 prepared execution profile，但 `ProcessRuntimeParityHarness.compare()` 完全不比较这些字段，只比较 `pretty/plain/json`、artifact/audit/review/HITL/recovery 和 `execution` 摘要。也就是说，这轮真正新增的 facade surface 一旦在 `legacy/langgraph` 间漂移，parity report 仍会保持绿色。
- 影响: cutover parity harness 无法保护 `TK-148` 自己交付的 selector/profile 契约；后续 `TK-150/TK-151` 即使接在一个已经发生 interrupt/status/node-count 漂移的 facade 上，也可能被错误地判定为 parity 通过。
- 建议: 把 prepared execution profile 纳入 parity snapshot/compare 范围，至少覆盖 `entryNodeId/currentStatus/initialNodeIds/supportedInterruptKinds/supportedTerminalStatuses/nodeCount/edgeCount`，并补一条 profile drift 的失败单测。

### 2.2 [P2] artifact registry 把 TK-148 从其正式输入产物的 dependent_tasks 中漏掉了
- 位置: `.repo-ai-governor/context/artifact-registry/artifacts.csv:126`
- 问题描述: `TK-148` 的 `Depends On/Required Inputs` 明确正式消费 `DA-143`、`DA-145`、`DA-146`、`DA-147`，但 artifact registry 现在把这些产物的 `dependent_tasks` 改成只剩 `TK-149/TK-150/TK-151/TK-152`，把 `TK-148` 整体删掉了。
- 影响: dependency resolver、自动依赖注入和审计回溯会低估 `TK-148` 的真实输入链；当前任务虽然在 task card 里还能看到输入，但 canonical registry 已经和任务台账分叉。
- 建议: 将 `DA-143`、`DA-145`、`DA-146`、`DA-147` 的 `dependent_tasks` 回补 `TK-148`，并保持 registry 与 task card/DA 文档单窗同步。

## 3. Notes
1. 本轮 `tsc`、定向 `vitest`、`task-ledger`、`sprint-plan`、`artifact-registry-lifecycle` 都通过；问题集中在 parity contract 覆盖范围和 canonical dependency registration。
2. 你贴出来的旧 finding `packages/adapter-sdk/src/agent-cli-exec-operations-runtime.ts` 不在当前 diff 范围内，这轮没有继续把它计入本次 CR。

## 4. Verification
1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm exec vitest run packages/core-runtime/test/process-runtime-facade.unit.test.ts packages/core-runtime/test/process-runtime-engine.unit.test.ts packages/core-runtime-langgraph/test/langgraph-runtime-backend.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）

## 复核结论（2026-03-25）

- 整体结论：**部分认可**

### 逐条复核
1. `2.1 [P1] parity harness 没有比较本任务刚引入的 prepared execution profile 契约`
   - 判定：**认可**
   - 证据：`ProcessRuntimeParityHarness.compare()` 之前只覆盖 `pretty/plain/json`、artifact/audit/review/HITL/recovery 和 `execution` 摘要，没有覆盖 `ProcessRuntimePreparedExecutionProfile`；现在已新增 `preparedProfile` snapshot 和 compare 逻辑，并补了 profile drift 失败单测。
   - 处理：纳入本轮修复。
2. `2.2 [P2] artifact registry 把 TK-148 从其正式输入产物的 dependent_tasks 中漏掉了`
   - 判定：**不认可**
   - 证据：`check-artifact-registry-lifecycle.js` 的 expected dependency index 只从仍处于 open 状态的 task card `## Depends On` 中提取 artifact 依赖，并明确排除 `completed/closed/resolved` 任务；`TK-148` 当前已经完成，所以 `DA-143/145/146/147` 的 `dependent_tasks` 不应继续保留 `TK-148`。
   - 处理：保持当前 registry 收敛结果，不作为修复项。

### 验证命令
1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm exec vitest run packages/core-runtime/test/process-runtime-facade.unit.test.ts packages/core-runtime/test/process-runtime-engine.unit.test.ts packages/core-runtime-langgraph/test/langgraph-runtime-backend.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）
6. `pnpm run check`（通过）

## 修复执行记录（2026-03-25）

1. `2.1 [P1] parity harness 没有比较本任务刚引入的 prepared execution profile 契约`：已完成
   - 变更文件：`packages/core-runtime/src/process-runtime-parity-harness.ts`、`packages/core-runtime/src/types/interfaces/runtime-facade.interface.ts`、`packages/core-runtime/test/process-runtime-facade.unit.test.ts`、`packages/core-runtime/src/constants/runtime.constant.ts`、`packages/core-runtime/src/constants/index.ts`、`packages/core-runtime/src/index.ts`、`packages/core-runtime/src/types/index.ts`、`packages/core-runtime/src/types/interfaces/index.ts`
   - 验证：`pnpm run check`（通过）
   - 说明：已把 prepared execution profile 纳入 parity snapshot/compare，并将新增 finite literal sets 收敛为常量管理。
