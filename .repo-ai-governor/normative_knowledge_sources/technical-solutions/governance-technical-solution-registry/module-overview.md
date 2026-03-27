# Governance Technical Solution Registry Module Overview

- Status: active
- Date: 2026-03-26
- Module ID: `governance.technical-solution-registry`
- Owner: architecture
- Layer: `governance-core`

## 1. 作用

负责将技术方案模块、contract import/export、bounded-context 边界、按需加载预算、draft/final promotion 生命周期，以及 formal solution 到执行流和用户侧 rollout 的 handoff ownership 收敛为单一结构化事实源。

## 2. 职责边界

1. 维护 `technical-solution-module-registry.yaml`。
2. 声明 `module_id / exports_contracts / imports_contracts / depends_on_modules / context_budget`。
3. 维护 `technical-solution-lifecycle-registry.yaml` 的 promotion/lifecycle 语义。
4. 维护 `technical-solution-delivery-registry.yaml` 的 solution -> execution handoff 语义。
5. 维护 consumer surfaces、user impact 与 rollout ownership 的结构化声明。
6. 为 module graph gate、lifecycle gate、delivery handoff gate 与 Spec Sync impact classification 提供结构化输入。

## 3. 非目标

1. 不直接替代 `repo-ai-governor-overall-technical-solution.md` 的北极星职责。
2. 不承担人类可读全文说明，全文说明仍由 module overview / contracts 提供。
3. 不替代 `normative-loading-manifest.yaml` 的仓库级文档登记职责。

## 4. North Star References

1. `prd.docs-sync`
2. `overall.technical-solution-modularity`
3. `architecture.governance-boundary`

## 5. Imported Contracts

1. `contract.spec-sync.impact-classification.v1`

## 6. Exported Contracts

1. `contract.technical-solution.module-registry.v1`
2. `contract.technical-solution.lifecycle-registry.v1`
3. `contract.technical-solution.delivery-registry.v1`

## 7. Loading Guidance

1. 命中 `technical_solution_module_change`、`technical_solution_promotion_change`、`module_dependency_change`、`governance_engine_change` 时加载。
2. 默认执行先读 registry，再按 `summary_doc + imported contracts` 展开。

## 8. Change Policy

1. `registry_change` 视为 `module_registry_change`。
2. `contract_doc_change` 视为 `exported_contract_change`，推荐同步总纲与架构文档。
3. lifecycle registry 变化默认不要求回读模块全文，但 promotion 改动必须同步 manifest、review、delivery handoff、rollout ownership 与台账。
