# TK-181 总技术方案北极星瘦身与 module overview 抽取基线

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-017-technical-solution-modularization`
- Sprint: `sprint-001-module-registry-and-loading-contract-baseline`

## 1. 任务目标

将总技术方案从“模块细节容器”收敛为“北极星索引 + 全局不变量 + 跨模块公共契约入口”，并定义 `module-overview / contract / ADR` 的文档职责边界。

## 2. Depends On

1. `TK-180`
2. `DA-179`
3. `.repo-ai-governor/draft/modular-technical-solution-loading-and-dependency-governance.md`

## 3. 预期产物

1. 总技术方案瘦身边界说明。
2. module overview 模板与首轮抽取策略。
3. contract / ADR 结构与引用规则。

## 4. 实施计划

1. 标记总纲必须保留与必须移出的章节类别。
2. 固定 module overview 的最小字段和 north star 对齐规则。
3. 明确 contract / ADR 的使用边界与引用关系。
4. 为首批复杂模块迁移准备标准模板。

## 5. 验证

1. `node ./scripts/governance/check-docs-triad-sync.js`
2. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`

## 6. 执行记录

1. 2026-03-26：任务创建，状态初始化为 `planned`，待 module registry contract 冻结后启动。
2. 2026-03-26：状态切换为 `in_progress`，开始同步总技术方案瘦身边界、module overview 抽取规范与 triad/manifest 对齐。
3. 2026-03-26：已完成总技术方案、架构分层、PRD/brief、manifest 与治理文档的模块化治理同步，形成 `DA-181` 并将 review 直接收口为 resolved。
