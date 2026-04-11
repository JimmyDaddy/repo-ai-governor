# Governance Normative Loading Module Overview

- Status: active
- Date: 2026-04-11
- Module ID: `governance.normative-loading`
- Owner: architecture
- Layer: `governance-core`

## 1. 作用

负责把 root `normative-loading-manifest.yaml` 的生命周期出清、archive sidecar 边界、`deprecated -> archived` 紧缩规则，以及 bootstrap truth preservation 收敛为可治理的 formal guidance。

## 2. 职责边界

1. 定义 root manifest 继续作为唯一 bootstrap truth 的边界。
2. 定义 archive manifest 只承载历史 `archived` catalog 的 sidecar 语义。
3. 定义 `deprecated` 宽限窗口、compact 运维命令与 monthly audit 入口。
4. 定义 archive split、parser/gate 兼容与 rollback 的最小契约。

## 3. 非目标

1. 不把 root manifest 直接替换为 sqlite canonical truth。
2. 不在当前 formal scope 内引入 active shard manifests、`manifest_refs` 或 merged active catalog。
3. 不替代 `governance.technical-solution-registry` 对 lifecycle/module/delivery registry 的职责。

## 4. North Star References

1. `prd.docs-sync`
2. `overall.technical-solution-modularity`
3. `architecture.governance-boundary`

## 5. Dependencies

1. 无 direct imported contract。
2. 本模块主要作为 governance guidance，被 root manifest gate、未来 compact/archive-check tooling 与 agent startup governance 消费。

## 6. Exported Contracts

1. `contract.governance.normative-loading.lifecycle.v1`

## 7. Loading Guidance

1. 默认只在 `technical_solution_module_change`、`technical_solution_promotion_change`、`governance_engine_change`、`normative_loading_policy_change` 场景加载。
2. 作为依赖展开时，优先加载 contract，不默认加载全文。

## 8. Change Policy

1. `summary_doc_change` 视为 `local_detail_change`。
2. `contract_doc_change` 视为 `exported_contract_change`，至少需要同步当前 module overview。
3. `adr_doc_change` 视为 `local_detail_change`，默认不阻断，但建议同步当前 module overview 摘要。

## 9. Detail Docs

1. Contract:
   - `contracts/normative-loading-lifecycle-contract.md`
2. ADR:
   - `adrs/root-bootstrap-truth-and-archive-sidecar-boundary.md`
