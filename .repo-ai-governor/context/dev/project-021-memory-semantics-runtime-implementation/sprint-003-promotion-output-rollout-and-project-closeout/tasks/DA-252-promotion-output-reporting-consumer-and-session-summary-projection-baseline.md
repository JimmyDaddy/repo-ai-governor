# DA-252 promotion output reporting consumer and session-summary projection baseline

- Status: active
- Date: 2026-03-27
- Owner: AI-Agent
- Task: `TK-252`
- Project: `project-021-memory-semantics-runtime-implementation`
- Sprint: `sprint-003-promotion-output-rollout-and-project-closeout`

## 1. Delivery Conclusion

1. `execution_report` 已成为 `runtime.memory-semantics` 的 reporting-facing consumer：
   - report payload 新增 `memorySemantics.contextSummary`
   - report payload 新增 `memorySemantics.promotion`
2. `CliGovernanceRuntime` 现在会在 task-driven run 中对 `memoryContext.contractSafeSummary` 执行显式 promotion：
   - `dryRun=false` 时允许 session-summary projection 持久化
   - `dryRun=true` 时只输出 plan-only promotion truth，不伪报 merged
3. session-summary projection 现在同时具备两类可追溯输出：
   - `MemoryManager` 中的 session record
   - `execution_report` 中的 `sessionSummaryProjection`

## 2. Reporting Consumer Outcome

1. report consumer 只读取 report-safe `memorySemantics` block，不回退到底层 `layeredSnapshot`。
2. promotion output 在 report 中保持 machine-readable truthfulness：
   - `plannedMergeCount`
   - `mergedCount`
   - `phaseResults`
   - `sessionSummaryProjection`
3. 这条 consumer 属于 reporting-facing rollout，而不是新的 canonical-source owner。

## 3. Changed Surface

1. `packages/reporting/src/types/interfaces/reporting.interface.ts`
2. `packages/reporting/src/report-builder.ts`
3. `apps/cli/src/cli-governance-runtime.ts`
4. `apps/cli/test/cli-governance-runtime.integration.test.ts`
5. `packages/reporting/test/report-builder.unit.test.ts`

## 4. Validation

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/reporting/test/report-builder.unit.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
