# DA-248 memory promotion pipeline and contract-safe summary baseline

- Status: active
- Date: 2026-03-27
- Owner: AI-Agent
- Task: `TK-248`
- Project: `project-021-memory-semantics-runtime-implementation`
- Sprint: `sprint-002-promotion-pipeline-and-runtime-consumer-rollout`

## 1. Delivery Conclusion

1. `packages/core-memory-semantics` 已新增显式 `MemoryPromotionService`，把 promotion pipeline 固定为：
   - `capture_candidates`
   - `classify_candidates`
   - `validate_candidates`
   - `decide_target_layer`
   - `merge_or_persist`
2. `MemoryContextAssembler` 现在会导出 `contractSafeSummary`，下游 consumer 不再需要读取 raw payload 或 substrate snapshot 才能理解 recall/context 结果。
3. 当前 baseline 的持久化目标只收敛到 `session` summary record：
   - execution short-term facts 可合并到 session summary
   - `normative_projection` 默认拒绝 promotion
   - 命中敏感标签的 candidate 默认拒绝 promotion

## 2. Runtime Boundary Outcome

1. 本轮没有改写 `MemoryManager` 或 `MemoryStoreProvider` contract。
2. promotion service 只消费 `contractSafeSummary`，没有把 raw `layeredSnapshot` 重新暴露给新的 runtime consumer。
3. CLI task-driven runtime 回归断言已补上，保证 `memoryContext.contractSafeSummary` 可用，给后续 `TK-249` 的第二 consumer rollout 提供稳定入口。

## 3. Follow-Up Constraint

1. `TK-249` 应优先选择非 `CliTaskDrivenRunRuntime` 的第二 consumer。
2. 新 consumer 只能消费 `memoryContext.contractSafeSummary` 或更窄的 contract-safe shape，不允许回退到 `memoryRecall.layeredSnapshot` 或 `selectedRecords` 直连。

## 4. Validation

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm -s tsc -p tsconfig.build.json`
3. `pnpm exec vitest run packages/core-memory-semantics/test/memory-semantics.unit.test.ts apps/cli/test/runtime/task-driven-run-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`
4. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
5. `pnpm exec vitest run test/technical-solution-delivery-registry-gate.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
6. `pnpm run check`
