# Spec Sync Impact Classification Contract

- Status: active
- Date: 2026-03-26
- Contract ID: `contract.spec-sync.impact-classification.v1`
- Producer Module: `governance.spec-sync`

## 1. 目标

定义模块方案变更时的影响分类模型，使 triad/brief 同步检查可以在保留北极星约束的同时，避免对局部模块细节变更执行全文级递归阻断。

## 2. Classification Set

1. `local_detail_change`
2. `exported_contract_change`
3. `module_registry_change`
4. `north_star_change`
5. `layer_boundary_change`

## 3. Minimum Result Shape

1. `module_id`
2. `change_kind`
3. `change_classification`
4. `changed_files[]`
5. `enforced_sync_files[]`
6. `recommended_sync_files[]`
7. `direct_consumer_modules[]`

## 4. Behavioral Constraints

1. `local_detail_change` 默认不要求 triad 全量同步。
2. `exported_contract_change` 至少要求同步当前 module overview。
3. `north_star_change` 需要升级为 triad 同步面。
4. `layer_boundary_change` 需要同步架构文档，并输出 direct consumer 提示。
5. `adr_doc_change` 默认属于 `local_detail_change`，不应误触发 producer summary 强制同步。

## 5. Compatibility

1. `v1` 不要求自动推断 breaking change。
2. `v1` 允许 `recommended_sync_files[]` 仅作为提示，不默认阻断交付。
3. `v1` 允许通过 typed detail docs 把 `contract` 与 `adr` 的同步策略分离。
