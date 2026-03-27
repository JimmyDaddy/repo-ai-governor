# DA-257 sensitivity-visibility assembly enforcement baseline

- Status: active
- Date: 2026-03-27
- Owner: AI-Agent
- Task: `TK-257`
- Project: `project-022-memory-semantics-safety-and-consumer-hardening`
- Sprint: `sprint-001-contract-alignment-safety-and-adopter-output-baseline`

## 1. Delivery Conclusion

1. `MemoryContextAssembler` 现在不再把以下记录原样透传到 runtime context：
   - 缺失 `sensitivity` 标签的记录
   - 命中禁止 `sensitivity` 标签的记录
   - 显式 `visibility` 不允许 runtime 消费的记录
2. baseline enforcement 选择的是 `redaction`，而不是静默透传或隐式丢弃：
   - provenance / source refs 继续保留
   - summary 被替换为稳定的 redacted placeholder
3. `MemoryPromotionService` 也同步要求 promotion candidate 至少具备 `sensitivity` 标签，避免未标注内容借由 promotion 进入长期 session summary。

## 2. Safety Outcome

1. `safetyNotes` 继续保留，但不再承担唯一治理责任。
2. 缺失 sensitivity label 现在会触发显式 redaction，而不是仅记录 `some_records_missing_sensitivity_labels`。
3. task-driven runtime 回归已补上，保证 redacted summary 会进入 runtime assembly payload，而不是继续无标签透传。

## 3. Changed Surface

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/contracts/memory-context-assembly-contract.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/module-overview.md`
3. `packages/core-memory-semantics/src/types/interfaces/memory-semantics.interface.ts`
4. `packages/core-memory-semantics/src/memory-recall-service.ts`
5. `packages/core-memory-semantics/src/memory-context-assembler.ts`
6. `packages/core-memory-semantics/src/memory-promotion-service.ts`
7. `packages/core-memory-semantics/test/memory-semantics.unit.test.ts`
8. `apps/cli/test/runtime/task-driven-run-runtime.test.ts`

## 4. Validation

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/core-memory-semantics/test/memory-semantics.unit.test.ts apps/cli/test/runtime/task-driven-run-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check`
