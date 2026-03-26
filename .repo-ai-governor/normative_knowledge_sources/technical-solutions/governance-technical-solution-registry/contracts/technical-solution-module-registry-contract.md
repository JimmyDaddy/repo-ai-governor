# Technical Solution Module Registry Contract

- Status: active
- Date: 2026-03-26
- Contract ID: `contract.technical-solution.module-registry.v1`
- Producer Module: `governance.technical-solution-registry`

## 1. 目标

定义技术方案模块注册表的最小字段与可执行约束，使模块级方案的加载、依赖解析与门禁校验拥有单一事实源。
`draft/final` 生命周期不写入本注册表，而是通过配套的 `contract.technical-solution.lifecycle-registry.v1` 管理。

## 2. Minimum Fields

1. `module_id`
2. `status`
3. `owner`
4. `layer`
5. `summary_doc`
6. `detail_docs[]`
7. `north_star_refs[]`
8. `exports_contracts[]`
9. `imports_contracts[]`
10. `depends_on_modules[]`
11. `load_triggers[]`
12. `change_impact_policy`
13. `context_budget`

## 3. Required Constraints

1. `module_id` 必须唯一。
2. `exports_contracts` 在全注册表范围内必须唯一。
3. `imports_contracts` 必须能解析到某个已导出的 contract。
4. `north_star_refs[]` 不能为空。
5. `summary_doc` 与 `detail_docs[]` 必须指向真实文件。

## 4. Loading Budget

1. 默认模式是 `summary_plus_imported_contracts`。
2. `max_direct_dependency_depth` 在 `v1` 默认不大于 `1`。
3. transitive dependency 在 `v1` 只允许以推荐项或 contract summary 方式展开。

## 5. Compatibility

1. `v1` 允许 change impact policy 仅覆盖 `summary_doc_change`、`contract_doc_change`、`registry_change`。
2. `v1` 不要求覆盖自动版本迁移与 breaking change 推断。
3. `v1` 与 lifecycle registry contract 配套使用：module registry 管模块边界，lifecycle registry 管 draft/promote 状态机。
