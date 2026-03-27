# TK-261 sensitivity visibility policy stratification 与 runtime-safe decision baseline

- Status: completed
- Date: 2026-03-27
- Owner: AI-Agent
- Priority: P0
- Project: `project-022-memory-semantics-safety-and-consumer-hardening`
- Sprint: `sprint-002-policy-tuning-and-surface-expansion`

## 1. 任务目标

将当前单一的 assembly redaction baseline 升级为更明确的 sensitivity / visibility policy 分层与 runtime-safe decision 语义。

## 2. Depends On

1. `TK-260`
2. `DA-257`
3. `DA-259`

## 3. 预期产物

1. `DA-261`
2. 更新后的 policy / contract / tests

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-022-memory-semantics-safety-and-consumer-hardening/sprint-002-policy-tuning-and-surface-expansion/tasks/DA-260-sprint-002-activation-and-sprint-001-closeout-handoff.md`
2. `.repo-ai-governor/context/dev/project-022-memory-semantics-safety-and-consumer-hardening/sprint-001-contract-alignment-safety-and-adopter-output-baseline/tasks/DA-257-sensitivity-visibility-assembly-enforcement-baseline.md`
3. `.repo-ai-governor/context/dev/project-022-memory-semantics-safety-and-consumer-hardening/sprint-001-contract-alignment-safety-and-adopter-output-baseline/tasks/DA-259-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`

## 5. Traceback References

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/contracts/memory-context-assembly-contract.md`

## 6. 实施计划

1. 明确哪些条件应 `warn`、哪些应 `redact`、哪些应 `block`。
2. 将 policy 决策结果稳定映射到 runtime-safe contract。
3. 补齐测试与文档，确保 adopter-facing surface 能解释该策略。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/core-memory-semantics/test/memory-semantics.unit.test.ts apps/cli/test/runtime/task-driven-run-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `node ./scripts/governance/run-normative-loading-manifest-gate.js`

## 9. 执行记录

1. 2026-03-27：任务创建，状态初始化为 `planned`。
2. 2026-03-27：状态切换为 `in_progress`，开始把单一 redaction baseline 升级为 `allow / warn / redact / block` stratification，并切断 raw selected records 进入 stage inputs 的路径。
3. 2026-03-27：已完成 policy stratification、runtime-safe memoryContext 注入、contract truth 对齐、相关 unit/integration tests 与 `DA-261`。

## 10. 产出

1. `DA-261`
