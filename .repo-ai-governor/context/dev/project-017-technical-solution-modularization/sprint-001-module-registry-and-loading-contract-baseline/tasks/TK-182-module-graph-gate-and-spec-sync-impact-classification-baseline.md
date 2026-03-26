# TK-182 module graph gate 与 Spec Sync impact classification 基线

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-017-technical-solution-modularization`
- Sprint: `sprint-001-module-registry-and-loading-contract-baseline`

## 1. 任务目标

建立 module graph gate 与 `Spec Sync Guard` 的 impact classification 基线，使模块级方案拆分后仍可阻断未声明依赖、缺失 north star 对齐与错误影响面同步。

## 2. Depends On

1. `TK-180`
2. `TK-181`
3. `DA-179`
4. `.repo-ai-governor/draft/modular-technical-solution-loading-and-dependency-governance.md`

## 3. 预期产物

1. module graph gate 任务设计与最小校验项。
2. `local_detail_change / exported_contract_change / north_star_change / layer_boundary_change` 的 impact classification 基线。
3. gate 接线与后续验证脚本拆解输入。

## 4. 实施计划

1. 固定 module graph gate 的校验维度。
2. 定义与现有 `manifest` / `Spec Sync Guard` 的职责边界。
3. 建立变化类型到同步要求的映射。
4. 规划脚本、测试与门禁接线位置。

## 5. 验证

1. `node ./scripts/governance/check-technical-solution-module-graph.js --format json`
2. `node ./scripts/governance/check-docs-triad-sync.js`
3. `pnpm -s tsc -p tsconfig.json --noEmit`
4. `pnpm exec vitest run test/docs-triad-sync-gate.integration.test.ts test/technical-solution-module-graph-gate.integration.test.ts --maxWorkers=1 --maxConcurrency=1`

## 6. 执行记录

1. 2026-03-26：任务创建，状态初始化为 `planned`，待 module registry 与总纲瘦身边界冻结后启动。
2. 2026-03-26：状态切换为 `in_progress`，开始实现 module graph gate、Spec Sync impact classification 与测试/接线。
3. 2026-03-26：已完成 `check-technical-solution-module-graph.js`、扩展 `check-docs-triad-sync.js`、补齐集成测试与 gate wiring，形成 `DA-182` 并将 review 直接收口为 resolved。
