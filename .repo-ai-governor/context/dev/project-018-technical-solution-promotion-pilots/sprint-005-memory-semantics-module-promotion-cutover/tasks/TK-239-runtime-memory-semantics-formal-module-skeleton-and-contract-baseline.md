# TK-239 runtime.memory-semantics 正式模块 skeleton 与 contract baseline

- Status: completed
- Date: 2026-03-27
- Owner: AI-Agent
- Priority: P0
- Project: `project-018-technical-solution-promotion-pilots`
- Sprint: `sprint-005-memory-semantics-module-promotion-cutover`

## 1. 任务目标

为 `technical-solution.memory-module` 的 promotion 引入新的 `runtime.memory-semantics` formal module docs，并固定 recall/context/promotion 的最小 contract 边界。

## 2. Depends On

1. `TK-238`
2. `DA-203`
3. `DA-204`
4. `.repo-ai-governor/draft/memory-module-technical-solution.md`

## 3. 预期产物

1. `runtime-memory-semantics/module-overview.md`
2. `contracts/memory-recall-policy-contract.md`
3. `contracts/memory-context-assembly-contract.md`
4. `adrs/working-memory-and-canonical-source-boundary.md`
5. `DA-239`

## 4. 实施计划

1. 将 draft 里的主方案收敛为 formal module overview。
2. 固化 recall policy 与 context assembly 两份 contract。
3. 用 ADR 固化 working state 与 canonical source 边界。
4. 同步 `runtime.orchestration` 的 direct-consumer 说明，但不改坏其 runtime owner 边界。

## 5. 验证

1. `rg -n "Module ID|contract.memory.recall-policy.v1|contract.memory.context-assembly.v1|working-state" .repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics .repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/module-overview.md`

## 6. 执行记录

1. 2026-03-27：任务创建，状态初始化为 `planned`。
2. 2026-03-27：状态切换为 `in_progress`，开始新增 `runtime.memory-semantics` formal docs 与 direct-consumer 对齐。
3. 2026-03-27：已完成 formal module baseline、2 份 contract、1 份 ADR 与 direct-consumer 对齐，形成 `DA-239`。
