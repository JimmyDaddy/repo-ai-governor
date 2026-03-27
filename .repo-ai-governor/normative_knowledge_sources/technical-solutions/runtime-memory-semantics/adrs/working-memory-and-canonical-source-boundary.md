# ADR: Working Memory And Canonical Source Boundary

- Status: active
- Date: 2026-03-27
- Module ID: `runtime.memory-semantics`

## 1. Context

当前仓库已经具备：

1. `core-memory` 的 substrate manager
2. `memory-store-adapter` 的 provider contract
3. `runtime.memory-provider-loading` 的 loading / truthfulness baseline
4. `runtime.orchestration` 的 graph-first runtime owner

但尚未正式定义：

1. working state 与长期记忆的边界
2. recall/context assembly 的显式 contract
3. canonical source 与 memory projection 的关系

## 2. Decision

1. working state 明确归 runtime/checkpointer 所有，不并入长期 recall memory。
2. `runtime.memory-semantics` 作为新的语义模块，引入 recall policy、context assembly 与 promotion pipeline。
3. `current-context`、task ledger、review lifecycle、normative docs、artifact registry 继续作为 canonical source；memory 只能保存 projection / summary / recall aid。
4. `runtime.memory-provider-loading` 继续只负责 provider loading，不吸收 recall/promotion 语义。

## 3. Consequences

1. `MemoryManager` 保持 substrate manager 身份，避免演变成 God object。
2. `runtime.orchestration` 可通过 contract 依赖 memory semantics，而不必把 memory policy 内嵌到 runtime owner 中。
3. future semantic/hybrid search、online collaboration 与 conflict-resolution 可通过 capability 或 repository seam 增量扩展，而不破坏当前基线。
