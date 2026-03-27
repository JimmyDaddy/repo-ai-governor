# TK-257 sensitivity visibility assembly enforcement baseline

- Status: completed
- Date: 2026-03-27
- Owner: AI-Agent
- Priority: P0
- Project: `project-022-memory-semantics-safety-and-consumer-hardening`
- Sprint: `sprint-001-contract-alignment-safety-and-adopter-output-baseline`

## 1. 任务目标

将 `sensitivity / visibility` 从 `context assembly` 的记录型提示升级为显式治理约束，降低敏感内容透传风险。

## 2. Depends On

1. `TK-255`
2. `DA-255`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/contracts/memory-context-assembly-contract.md`

## 3. 预期产物

1. `DA-257`
2. 更新后的 assembly / test / contract truth

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-022-memory-semantics-safety-and-consumer-hardening/sprint-001-contract-alignment-safety-and-adopter-output-baseline/tasks/DA-255-project-022-activation-and-project-021-closeout-handoff.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/contracts/memory-context-assembly-contract.md`
3. `packages/core-memory-semantics/src/memory-context-assembler.ts`
4. `packages/core-memory-semantics/src/memory-promotion-service.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-021-memory-semantics-runtime-implementation/project-021-memory-semantics-runtime-implementation-completion-audit-summary.md`

## 6. 实施计划

1. 明确哪些 sensitivity / visibility 条件需要 `warn`、`redact` 或 `block`。
2. 在 assembly 与必要的 promotion 相关路径上实现最小可执行 enforcement。
3. 补齐测试，确保安全约束不是仅靠 `safetyNotes` 文本表达。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/core-memory-semantics/test/memory-semantics.unit.test.ts apps/cli/test/runtime/task-driven-run-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm run check`

## 9. 执行记录

1. 2026-03-27：任务创建，状态初始化为 `planned`。
2. 2026-03-27：状态切换为 `in_progress`，开始明确缺失 sensitivity 标签、禁止 sensitivity 标签和显式 visibility 不允许 runtime 消费时的最小 enforcement。
3. 2026-03-27：已完成 assembly redaction baseline、promotion sensitivity label enforcement、contract truth 对齐、回归测试与 `DA-257`。

## 10. 产出

1. `DA-257`
