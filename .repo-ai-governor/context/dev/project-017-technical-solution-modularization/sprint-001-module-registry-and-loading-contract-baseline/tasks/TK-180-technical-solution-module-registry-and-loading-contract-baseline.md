# TK-180 technical solution module registry 与 loading contract baseline

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-017-technical-solution-modularization`
- Sprint: `sprint-001-module-registry-and-loading-contract-baseline`

## 1. 任务目标

定义并落地 `technical-solution-module-registry.yaml` 的最小 schema，冻结 `module_id / north_star_refs / exports_contracts / imports_contracts / depends_on_modules / context_budget` 等核心字段，以及按需加载的 contract-first 解析规则。

## 2. Depends On

1. `TK-179`
2. `DA-179`
3. `.repo-ai-governor/draft/modular-technical-solution-loading-and-dependency-governance.md`

## 3. 预期产物

1. `technical-solution-module-registry.yaml` 草案或正式 skeleton。
2. module registry schema / validation baseline。
3. module loading contract 的正式说明。

## 4. 实施计划

1. 确定 registry 事实源与 `manifest` 的职责分界。
2. 定义 module/contract/ref/load-impact 的稳定字段。
3. 固定默认依赖展开规则与上下文预算边界。
4. 为后续 gate 集成输出机器可检验的最小模型。

## 5. 验证

1. `node ./scripts/governance/check-technical-solution-module-graph.js --format json`
2. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`

## 6. 执行记录

1. 2026-03-26：任务创建，状态初始化为 `planned`，待 `project-017` bootstrap 完成后启动。
2. 2026-03-26：状态切换为 `in_progress`，开始冻结 `technical-solution-module-registry.yaml`、module overview、contract 文档与 contract-first loading 规则。
3. 2026-03-26：已完成 registry schema、4 个模块 baseline 文档与 registry helper，形成 `DA-180` 并将 review 直接收口为 resolved。
