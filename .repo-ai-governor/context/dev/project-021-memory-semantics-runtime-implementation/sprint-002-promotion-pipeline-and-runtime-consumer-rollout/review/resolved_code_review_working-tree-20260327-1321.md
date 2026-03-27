# Code Review: project-021 sprint-002 working tree

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
1. `packages/core-memory-semantics/src/memory-promotion-service.ts`
2. `packages/core-memory-semantics/src/memory-context-assembler.ts`
3. `packages/core-memory-semantics/src/types/interfaces/memory-semantics.interface.ts`
4. `packages/core-memory-semantics/test/memory-semantics.unit.test.ts`
5. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 2. Findings
### 2.1 [P1] Truncated contract-safe summaries can still be persisted as if they were complete promotion inputs
- 位置: `packages/core-memory-semantics/src/memory-promotion-service.ts:44`
- 问题描述: `MemoryContextAssembler` 已经在 `contractSafeSummary` 中显式暴露了 `assemblyOutcome` 和 `truncationReason`，并在 record 数超限时把结果标成 `TRUNCATED`。但 `MemoryPromotionService.promote()` 完全忽略这两个字段，直接基于 `contextSummary.items` 生成 candidate 并在存在 merge candidate 时持久化 session summary。也就是说，只要上游 summary 因 `maxRecordCount` 被截断，promotion 仍会把“不完整子集”写入长期 session 语义层。
- 影响: 这会把截断后的 partial view 冒充成完整 promotion result，导致 session summary 丢记录而调用方无从感知。对一个强调“explicit, auditable, bounded” 的 promotion pipeline 来说，这是实质性的数据正确性问题。
- 建议: 在 `assemblyOutcome !== context_ready` 或 `truncationReason !== null` 时 fail-closed，至少禁止持久化并返回 `plan_only` / validation failure；如果后续确实要支持“截断后 promotion”，也需要显式 opt-in 和单独的审计字段，而不是默默持久化子集。

### 2.2 [P2] Plan-only promotion still reports merged work in the machine-readable summary
- 位置: `packages/core-memory-semantics/src/memory-promotion-service.ts:68`
- 问题描述: `promote()` 支持 `persist?: false` 的 plan-only 模式，但返回值中的 `summary` 和 `phaseResults` 仍然按 `MERGE` decision 数量计算 `mergedCount`，并把 `merge_or_persist` phase 记成 `completed`。也就是说，在 `outcome=plan_only`、`persistedRecord=null` 的情况下，machine-readable summary 仍会声称已经 merge。
- 影响: 这会让审计和下游 consumer 误读 promotion 结果，破坏 `DA-248` 想建立的 audit-friendly pipeline truthfulness。调用方无法仅凭 summary 判断“规划了 merge”还是“真的已经持久化 merge”。
- 建议: `summary.mergedCount` 和 `merge_or_persist` phase 应基于实际持久化结果计算，而不是基于 merge candidate 数量；plan-only 模式下应区分 `plannedMergeCount` 与 `mergedCount=0`。

## 3. Notes
1. 本轮没有重复提出上一轮“raw layered snapshot 仍泄漏到 stage inputs”那条 finding，因为这批 diff 已经在 `task-driven-run-runtime` 测试里显式回归掉了。
2. 当前主要风险已经转到 `MemoryPromotionService` 自身的 truthfulness 和持久化边界。

## 4. Verification
1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm exec vitest run packages/core-memory-semantics/test/memory-semantics.unit.test.ts apps/cli/test/runtime/task-driven-run-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./scripts/governance/check-code-review-status-sync.js`（通过）

## 5. 复核结论（2026-03-27）
1. 结论：认可。
2. `2.1` 成立：`promote()` 当前确实会在 `contextSummary.assemblyOutcome="truncated"` 时继续基于残缺 `items` 生成 merge candidate，并在存在 `sessionId` 时写入 session summary。
3. `2.2` 成立：`persist=false` 时当前返回的 `summary.mergedCount` 和 `merge_or_persist` phase 仍按 merge candidate 数量计算，和 `outcome=plan_only` 不一致。
4. 处理要求：修复代码与单测后，再补“修复执行记录”并转为 `resolved`。

## 6. 修复执行记录（2026-03-27）
1. 已修复 `2.1`：`MemoryPromotionService.promote()` 现在会在 `contextSummary.truncationReason !== null` 或 `assemblyOutcome !== context_ready` 时阻断持久化，并把 `merge_or_persist` phase 标记为 `skipped`。
2. 已修复 `2.2`：promotion summary 新增 `plannedMergeCount`，`mergedCount` 改为仅反映实际持久化结果；`persist=false` 时不再伪报已完成 merge。
3. 已补回归测试：
   - `blocks persistence when the contract-safe summary is truncated`
   - `reports plan-only promotion without claiming a completed merge`
4. 验证：
   - `pnpm -s tsc -p tsconfig.json --noEmit`
   - `pnpm -s tsc -p tsconfig.build.json`
   - `pnpm exec vitest run packages/core-memory-semantics/test/memory-semantics.unit.test.ts apps/cli/test/runtime/task-driven-run-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`
