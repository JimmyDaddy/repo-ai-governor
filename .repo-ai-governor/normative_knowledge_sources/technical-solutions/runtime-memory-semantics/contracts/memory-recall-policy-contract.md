# Memory Recall Policy Contract

- Status: active
- Date: 2026-03-27
- Contract ID: `contract.memory.recall-policy.v1`
- Producer Module: `runtime.memory-semantics`

## 1. 目标

定义 runtime 在执行前如何显式选择、排序与过滤 memory recall 结果，避免 memory 注入变成隐式副作用。

## 2. Minimum Fields

1. `query_intent`
2. `workspace_id`
3. `execution_id`
4. `session_id`
5. `requested_layers`
6. `requested_memory_kinds`
7. `metadata_filters`
8. `recall_order`
9. `selection_policy`
10. `result_summary`

## 3. Behavioral Constraints

1. recall 必须是显式 phase，而不是 provider 注册后的默认自动注入。
2. 默认 recall order 固定为 `execution short-term facts -> session -> workspace -> user -> normative_projection`。
3. metadata filtering 必须先于任何更重的搜索或排序能力。
4. working state 不得被伪装成长期 recall memory 写回 provider store。
5. canonical-source projection 只能作为 recall aid，不得替代 source document 本体。
6. provider loading 结果必须通过 `contract.memory-provider.loading.v1` 解析，不允许 memory semantics 自己重复推导 provider 选择。

## 4. Consumers

1. `runtime.orchestration`

## 5. Compatibility

1. `v1` 只要求 metadata filtering、recall ordering 与 selection policy 稳定可判定。
2. `v1` 不要求 semantic/vector/hybrid search 成为基础门槛。
3. `v1` 允许将 `user` 层保持为预留逻辑层，而不要求当前 runtime 必须立即落地完整 user memory。
