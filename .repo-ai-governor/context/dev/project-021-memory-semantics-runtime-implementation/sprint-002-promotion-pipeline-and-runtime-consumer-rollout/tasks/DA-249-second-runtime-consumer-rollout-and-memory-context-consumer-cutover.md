# DA-249 second runtime consumer rollout and memory-context consumer cutover

- Status: active
- Date: 2026-03-27
- Owner: AI-Agent
- Task: `TK-249`
- Project: `project-021-memory-semantics-runtime-implementation`
- Sprint: `sprint-002-promotion-pipeline-and-runtime-consumer-rollout`

## 1. Delivery Conclusion

1. 第二个 runtime consumer 已收敛到 `apps/cli/src/cli-governance-runtime.ts` 的 `assembly` check。
2. `assembly` check 不再读取 `runAssembly.memoryRecall.resultSummary`，而是只消费 `runAssembly.memoryContext.contractSafeSummary`：
   - `selectedRecordCount`
   - `layerCounts.execution`
   - `layerCounts.session`
   - `assemblyOutcome`
3. 本轮没有新增 raw snapshot surface，也没有把 `memoryRecall.layeredSnapshot` 或 `selectedRecords` 暴露给新的 consumer。

## 2. Runtime Boundary Outcome

1. `CliTaskDrivenRunRuntime` 仍然是 memory semantics 的首个 consumer，负责 recall/context assembly。
2. `CliGovernanceRuntime` 现在成为第二个 consumer，但它只读 contract-safe summary，不再直接耦合 recall-level summary。
3. 这次 rollout 保持了 `runtime.memory-semantics` 的边界：consumer 只能读 `memoryContext` 或更窄的 contract-safe summary，而不是回退到底层 substrate shape。

## 3. Verification Outcome

1. 新增集成断言，验证 `assembly` check 会输出：
   - `memory_context_selected`
   - `memory_context_execution`
   - `memory_context_session`
   - `memory_context_outcome`
2. 同时新增保护断言：`assembly` check detail 不再包含 `memory_recalled=...`。

## 4. Validation

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts apps/cli/test/runtime/task-driven-run-runtime.test.ts packages/core-memory-semantics/test/memory-semantics.unit.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check`
4. `node ./scripts/governance/check-task-ledger-sync.js`
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`
6. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
7. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
