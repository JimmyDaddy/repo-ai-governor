# Governance Execution Gates Module Overview

- Status: active
- Date: 2026-03-27
- Module ID: `governance.execution-gates`
- Owner: architecture
- Layer: `governance-core`

## 1. 作用

负责把仓库级 gate 执行从“根包单体 orchestrator + 全仓串行前置”收敛为可治理的三层 execution model，使本地开发、CI 与后续 package graph 演进拥有稳定的 formal guidance。

## 2. 职责边界

1. 定义 `repo-global / package-local / heavy-runtime` 三层 gate 模型。
2. 定义 `full / fast / affected` 三类执行 profile 的边界与包含关系。
3. 定义哪些 gate 可以脱离全仓 `build` 独立运行，哪些必须消费 build 产物。
4. 约束 package-level build/typecheck/test 下沉与 future TS project references 的演进方向。

## 3. 非目标

1. 不直接实现具体 package 的 `build / typecheck / test` 脚本。
2. 不替代 `release`、`ga-check`、`clean-room` 等发布治理契约。
3. 不把当前 draft 里的所有 implementation phases 自动升级为已承诺执行任务。

## 4. North Star References

1. `prd.multi-agent-orchestration`
2. `overall.graph-first-runtime`
3. `architecture.governance-boundary`

## 5. Dependencies

1. 无 direct imported contract。
2. 本模块主要作为 governance guidance，被后续 gate runner、CI profile 与 package-level workspace layout 消费。

## 6. Exported Contracts

1. `contract.governance.gate-execution-profile.v1`

## 7. Loading Guidance

1. 默认只在 `governance_engine_change`、`technical_solution_module_change`、`gate_orchestration_change`、`ci_execution_change` 场景加载。
2. 作为依赖展开时，优先加载 contract，不默认加载全文。

## 8. Change Policy

1. `summary_doc_change` 视为 `local_detail_change`。
2. `contract_doc_change` 视为 `exported_contract_change`，至少需要同步当前 module overview。
3. `adr_doc_change` 视为 `local_detail_change`，默认不阻断，但建议同步当前 module overview 摘要。

## 9. Detail Docs

1. Contract:
   - `contracts/gate-execution-profile-contract.md`
2. ADR:
   - `adrs/repo-global-package-heavy-gate-stratification.md`
