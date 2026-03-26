# Governance Spec Sync Module Overview

- Status: active
- Date: 2026-03-26
- Module ID: `governance.spec-sync`
- Owner: architecture
- Layer: `governance-core`

## 1. 作用

负责把“需求 -> 方案 -> 架构 -> brief -> 模块方案”之间的同步关系收敛成可执行门禁与机器可读影响分类结果。

## 2. 职责边界

1. 维护 triad + brief 的同步规则。
2. 定义模块方案变更的 impact classification 语义。
3. 为本地执行与 CI 输出稳定的人类/机器双视图结果。
4. 管理 `contract` 与 `adr` 两类模块 detail docs 的同步边界。

## 3. 非目标

1. 不承载模块依赖图本身。
2. 不替代 `normative-loading-manifest` 对 active 文档登记的职责。
3. 不直接决定代码层 runtime/package 依赖边界。

## 4. North Star References

1. `prd.docs-sync`
2. `overall.spec-sync`
3. `architecture.governance-boundary`

## 5. Dependencies

1. 无 direct imported contract。
2. 其导出 contract 会被 `governance.technical-solution-registry` 消费。

## 6. Exported Contracts

1. `contract.spec-sync.impact-classification.v1`

## 7. Loading Guidance

1. 默认只在 `spec_sync_change`、`docs_contract_change`、`technical_solution_module_change` 场景加载。
2. 作为依赖展开时，优先加载 contract，不默认加载全文。

## 8. Change Policy

1. `summary_doc_change` 视为 `local_detail_change`。
2. `contract_doc_change` 视为 `exported_contract_change`，至少需要同步当前 module overview。
3. `adr_doc_change` 视为 `local_detail_change`，默认不阻断，但建议同步当前 module overview 摘要。

## 9. Detail Docs

1. Contract:
   - `contracts/spec-sync-impact-classification-contract.md`
2. ADR:
   - `adrs/spec-sync-escalation-and-module-impact-routing.md`

## 10. Migration Anchors

1. `project-003 / TK-026` 已完成 triad + brief 的初始 gate 接线。
2. sprint-002 在该基线上补齐模块 detail docs typed cutover，不再把 ADR 误判为 exported contract 变化。
