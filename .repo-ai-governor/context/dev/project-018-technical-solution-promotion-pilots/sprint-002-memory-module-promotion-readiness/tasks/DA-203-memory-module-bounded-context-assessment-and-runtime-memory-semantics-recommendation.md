# DA-203 memory-module bounded-context assessment and runtime.memory-semantics recommendation

- Status: active
- Date: 2026-03-26
- Owner: AI-Agent
- Task: `TK-203`
- Project: `project-018-technical-solution-promotion-pilots`
- Sprint: `sprint-002-memory-module-promotion-readiness`

## 1. Summary

1. `memory-module` draft 讨论的是 `MemoryManager / working-memory / recall / promotion policy / canonical-source boundary`，已经超出 `runtime.memory-provider-loading` 的 provider loading 边界。
2. 推荐目标模块不是现有 `runtime.memory-provider-loading`，而是新的 `runtime.memory-semantics`。
3. 推荐依赖关系是：`runtime.memory-semantics` imports `contract.memory-provider.loading.v1`，并被 `runtime.orchestration` 消费。

## 2. Key Outputs

1. 推荐模块 ID：`runtime.memory-semantics`
2. 推荐 exported contracts：
   - `contract.memory.recall-policy.v1`
   - `contract.memory.context-assembly.v1`
3. 推荐 detail docs：
   - `technical-solutions/runtime-memory-semantics/module-overview.md`
   - `technical-solutions/runtime-memory-semantics/contracts/memory-recall-policy-contract.md`
   - `technical-solutions/runtime-memory-semantics/contracts/memory-context-assembly-contract.md`
   - `technical-solutions/runtime-memory-semantics/adrs/working-memory-and-canonical-source-boundary.md`

## 3. Follow-Up Constraints

1. 在 `runtime.memory-semantics` 模块正式引入前，不应把 `memory-module` draft 继续挂在 `runtime.memory-provider-loading` 上做正式 promotion。
