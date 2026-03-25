# Code Review: TK-149 / TK-150 LangGraph Runtime Working Tree Follow-Up

- Status: resolved
- Date: 2026-03-25
- Reviewer: AI-Agent
- Task: `TK-149/TK-150`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/artifact-registry-lifecycle-governance.md`

## 1. Review Scope
1. `packages/core-runtime/src/process-runtime-facade.ts`
2. `packages/core-runtime-langgraph/src/file-backed-checkpointer.ts`
3. `apps/cli/src/cli-governance-runtime.ts`
4. `packages/core-runtime/test/process-runtime-facade.unit.test.ts`
5. `apps/cli/test/cli-governance-runtime.integration.test.ts`
6. `packages/core-runtime-langgraph/test/file-backed-checkpointer.unit.test.ts`
7. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
8. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/plan.md`
9. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/TK-149-file-backed-checkpointer-and-recovery-smoke-baseline.md`
10. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/TK-150-langgraph-run-review-hitl-minimal-mainchain-integration.md`
11. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/TK-151-sqlite-fs-checkpointer-and-shared-local-orchestration-service-shell-convergence.md`

## 2. Findings
### 2.1 [P1] `parityMode=comparison` 仍未真正执行 comparison backend
- 位置: `packages/core-runtime/src/process-runtime-facade.ts:98`
- 问题描述: `selectBackend()`/`prepare()` 会在 `enableParityHarness=true` 时填入 `comparisonBackend=legacy` 并返回 `parityMode="comparison"`，CLI 也会把 `runtime_comparison_backend` 与 `runtime_parity_mode=comparison` 暴露到正式输出面；但 `execute()` 只调用一次 `executeSelectedBackend(preparedExecution.selection.primaryBackend, ...)`，没有执行 comparison backend，也没有调用 `ProcessRuntimeParityHarness.compare()` 产出任何 drift 判定。本轮我用 `dist/node_modules` 里的 snapshot 做了最小复现：一个 2-node flow 在 `enableParityHarness=true` 下，`stageHandler` 只被调用了 `2` 次，而不是执行双 backend 时应有的 `4` 次。
- 影响: 当前输出把“已进入 comparison parity 模式”说得比实现更多，迁移 cutover 的安全信号会被高估，后续 `TK-151/TK-152` 若据此判断 parity 已在线运行，会在没有真实 baseline compare 的情况下继续推进。
- 建议: 要么在 facade/CLI 里真实执行 primary + comparison 两套 runtime 并调用 `ProcessRuntimeParityHarness.compare()`；要么在本轮 Phase 0 明确改名，避免将仅有 comparison profile 的状态暴露成 `parityMode=comparison`。

### 2.2 [P2] file-backed recovery 读取路径不会 fail-closed 拦截被篡改的 checkpoint envelope
- 位置: `packages/core-runtime-langgraph/src/file-backed-checkpointer.ts:75`
- 问题描述: `read()` 只校验 `executionId/executionSessionId` 命名空间，`recover()` 会直接信任文件里的 `checkpointSource`、`checkpointPath`、`processId`、`activeNodeIds`、`visitedNodeIds`，也不会重新校验 `reducedState` 的 top-level key。最小复现里，我手工写入了一个同 namespace 的伪造 payload：`checkpointSource="tampered"`、`processId="wrong-process"`、`checkpointPath="/tmp/fake.json"`、`activeNodeIds=["fake-node"]`，并额外放入非法 reduced-state key；`recover()` 仍然返回 `recovered=true`，而且把这些伪造字段原样带了出来。
- 影响: 当前 CLI recovery smoke 会把被污染的 checkpoint 当成有效恢复结果；后续 `TK-151` 若复用这条持久化恢复路径做真正的 resume/service shell，会有恢复到错误 node、输出错误 checkpoint source/path、以及把坏状态继续向上游 contract 扩散的风险。
- 建议: 在 `read()`/`recover()` 阶段补齐 envelope shape 校验，至少重新验证 `checkpointSource`、`processId`、`checkpointPath`、`activeNodeIds/visitedNodeIds`、`pendingInterrupt` 形状，以及 `reducedState` key 白名单；同时新增一条“篡改/脏 checkpoint payload 必须 fail-closed”的单测。

## 3. Notes
1. `tasks/checklist.md`、`tasks/tasks.csv`、`plan.md` 和 `artifacts.csv` 这轮治理同步是对齐的，没有额外 drift finding。
2. `scripts/build/copy-runtime-assets.js` 与 `scripts/release/verify-local-distribution.js` 这轮增量没有发现新的单独问题。

## 4. Verification
1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm exec vitest run packages/core-runtime-langgraph/test/file-backed-checkpointer.unit.test.ts packages/core-runtime/test/process-runtime-facade.unit.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）
6. `node --input-type=module -e "<dist snapshot parity reproduction>"`（通过；`enableParityHarness=true` 下 2-node flow 的 `stageHandler` 仅被调用 `2` 次，未执行 comparison backend）
7. `node --input-type=module -e "<dist snapshot checkpointer tamper reproduction>"`（通过；伪造 `checkpointSource/processId/checkpointPath/activeNodeIds` 仍被 `recover()` 原样接受）

## 复核结论（2026-03-25）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`apps/cli/src/cli-governance-runtime.ts` 已不再对 `ProcessRuntimeFacade.execute()` 传入 `enableParityHarness=true`；当前 CLI 正式输出面回落为 `runtime_comparison_backend=null`、`runtime_parity_mode=disabled`，不再对外声称 comparison backend 已在线执行。
   - 处理：接受 finding 中“要么真实执行、要么改名/降级输出面”的第二条路径；本轮选择收回 CLI 主链的 parity 宣称，避免在 Phase 0 高估 cutover 安全信号。
2. `2.2`
   - 判定：**认可**
   - 证据：`packages/core-runtime-langgraph/src/file-backed-checkpointer.ts` 现在在 `read()/recover()` 阶段重新校验 `processId`、`checkpointSource`、`checkpointPath`、`activeNodeIds/visitedNodeIds`、`reducedState` key 白名单和 `pendingInterrupt` 形状；`packages/core-runtime-langgraph/test/file-backed-checkpointer.unit.test.ts` 已新增篡改 payload fail-closed 用例。
   - 处理：按 finding 建议补齐 envelope 校验，阻断同 namespace 的脏 checkpoint 被恢复层接受。

### 验证命令
1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm exec vitest run packages/core-runtime-langgraph/test/file-backed-checkpointer.unit.test.ts packages/core-runtime/test/process-runtime-facade.unit.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）
6. `pnpm run check`（通过）

## 修复执行记录（2026-03-25）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/cli-governance-runtime.ts`、`apps/cli/test/cli-governance-runtime.integration.test.ts`、`.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-150-langgraph-run-review-hitl-minimal-mainchain-integration.md`
   - 验证：`pnpm exec vitest run packages/core-runtime/test/process-runtime-facade.unit.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：当前主链接线继续保留 `langgraph` 作为 primary backend，但不再把 comparison parity 说成已在线执行。
2. `2.2`：已完成
   - 变更文件：`packages/core-runtime-langgraph/src/file-backed-checkpointer.ts`、`packages/core-runtime-langgraph/test/file-backed-checkpointer.unit.test.ts`、`apps/cli/src/cli-governance-runtime.ts`
   - 验证：`pnpm exec vitest run packages/core-runtime-langgraph/test/file-backed-checkpointer.unit.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：恢复路径现在对篡改 envelope fail-closed，并要求调用方传入 `expectedProcessId` 参与校验。
