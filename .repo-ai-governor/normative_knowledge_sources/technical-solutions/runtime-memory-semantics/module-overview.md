# Runtime Memory Semantics Module Overview

- Status: active
- Date: 2026-03-27
- Module ID: `runtime.memory-semantics`
- Owner: runtime
- Layer: `runtime-core`

## 1. 作用

负责把 working-state boundary、memory recall policy、context assembly 与 promotion pipeline 收敛为统一的 runtime 语义模块，避免继续把 memory 语义混在 provider loading 或 orchestration owner 内部。

## 2. 职责边界

1. 定义 working memory 与 recall memory 的稳定边界。
2. 定义 recall ordering、metadata filtering 与 selection policy。
3. 定义 memory context assembly 的显式 contract。
4. 定义从 session/execution 到长期记忆的 promotion baseline。
5. 定义 memory record 的审计字段、provenance 与 canonical-source boundary。

## 3. 非目标

1. 不负责 memory provider 的解析、加载、allowlist 与 distribution truthfulness。
2. 不负责 graph runtime 调度、checkpoint owner 管理或 host process 生命周期。
3. 不替代 `current-context`、task ledger、review lifecycle、normative docs 等 canonical source。
4. 不要求所有 provider 立即支持 semantic/vector/hybrid search。

## 4. North Star References

1. `prd.multi-agent-orchestration`
2. `overall.graph-first-runtime`
3. `architecture.runtime-boundary`

## 5. Imported Contracts

1. `contract.memory-provider.loading.v1`

## 6. Exported Contracts

1. `contract.memory.recall-policy.v1`
2. `contract.memory.context-assembly.v1`

## 7. Loading Guidance

1. 命中 `runtime_contract_change`、`module_dependency_change`、`memory_provider_change`、`governance_engine_change` 时加载。
2. 作为 direct dependency 时，优先只加载 contract。
3. 若问题涉及 working-state boundary、canonical-source boundary 或 promotion policy，应补载本模块 ADR。

## 8. Cutover Notes

1. 当前稳定 substrate 仍是 `core-memory` 提供的 `normative / execution / session` scope；本模块是在其之上的语义层，而不是替换 substrate。
2. `runtime.orchestration` 通过 `contract.memory.context-assembly.v1` 消费本模块，而不是继续内嵌 memory policy。
3. working state 继续归 runtime/checkpointer 所有，长期记忆只保存 projection / summary / recall aid。
4. `sourceRefs / provenance / sensitivity / visibility` 是治理型 memory semantics 的基线字段，优先级高于可选的重型搜索能力。
5. 当前 `v1` 已交付的 active recall baseline 只覆盖 `execution / session / normative_projection`；`workspace / user` 仍保留为 future capability / reserved logical layer，不应被视为已落地 consumer surface。
6. 2026-03-27 readiness assessment 结论：`workspace / user` seam 继续保持 reserved capability，直到 substrate、ownership seam 与 adopter demand 同时具备进入最小实现窗口的条件。

## 9. Detail Docs

1. Contract:
   - `contracts/memory-recall-policy-contract.md`
   - `contracts/memory-context-assembly-contract.md`
2. ADR:
   - `adrs/working-memory-and-canonical-source-boundary.md`
