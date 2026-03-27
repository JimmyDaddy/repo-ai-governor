# TK-256 workspace-user layer contract 对齐与 future capability 降级

- Status: completed
- Date: 2026-03-27
- Owner: AI-Agent
- Priority: P0
- Project: `project-022-memory-semantics-safety-and-consumer-hardening`
- Sprint: `sprint-001-contract-alignment-safety-and-adopter-output-baseline`

## 1. 任务目标

把 `runtime-memory-semantics` 文档 contract、常量与实现边界对齐，明确 `workspace/user` 是已实现能力还是 future capability，消除过度承诺。

## 2. Depends On

1. `TK-255`
2. `DA-255`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/module-overview.md`

## 3. 预期产物

1. `DA-256`
2. 更新后的 module docs / contracts / constants / tests

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-022-memory-semantics-safety-and-consumer-hardening/sprint-001-contract-alignment-safety-and-adopter-output-baseline/tasks/DA-255-project-022-activation-and-project-021-closeout-handoff.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/module-overview.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/contracts/memory-recall-policy-contract.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/adrs/working-memory-and-canonical-source-boundary.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-021-memory-semantics-runtime-implementation/project-021-memory-semantics-runtime-implementation-completion-audit-summary.md`

## 6. 实施计划

1. 盘点 `workspace/user` 在 docs、constants、recall service 与 substrate 中的真实状态。
2. 选择“降级为 reserved capability”或“实现最小 seam”中的一种，并在同一 change set 内保持文档/代码真值同步。
3. 补齐对应测试与 follow-up 说明。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/core-memory-semantics/test/memory-semantics.unit.test.ts --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
2. `pnpm run check`

## 9. 执行记录

1. 2026-03-27：任务创建，状态初始化为 `planned`。
2. 2026-03-27：状态切换为 `in_progress`，开始盘点 `workspace/user` 在 docs、default constants、recall service 与 substrate 中的真实状态。
3. 2026-03-27：已完成 module overview / recall contract / ADR / default constants / task-driven runtime tests 对齐，并形成 `DA-256`。

## 10. 产出

1. `DA-256`
