# TS Vitest V1 Sprint 001 Plan

- Status: in-progress
- Date: 2026-03-17
- Project: `ts-vitest-v1`
- Sprint: `sprint-001`

## Goal

建立 TypeScript + Vitest + Biome（formatter + linter）的工程基线，并完成首批关键模块迁移，形成可持续推进的分批重构模式。

## In Scope

1. 增加 TypeScript 编译配置与构建命令。
2. 增加 Vitest 配置并切换默认单测入口。
3. 接入 Biome formatter 并统一格式化命令。
4. 参考 `camera_point` 启用 Biome linter 规则与 lint 命令。
5. 完成首批基础模块与测试迁移（低风险高收益路径）。
6. 对齐 CI / 质量门禁 / 发布入口的迁移约束。

## Out Of Scope

1. 一次性迁移全部业务模块。
2. 大规模功能重构或行为变更。
3. 新增与迁移目标无关的架构改造。

## Acceptance

1. 仓库存在可执行的 TS 构建链路（含类型检查）。
2. `npm test` 已切换至 Vitest 并完成基础回归。
3. 已提供 `npm run format` / `npm run format:check` 的 Biome 格式化能力。
4. 已提供 `npm run lint` 的 Biome lint 能力。
5. 首批迁移模块在类型检查和测试层面通过。
6. 发布入口与 CI 不依赖源码 `.js` 才能工作。

## Verification Path

1. `npm run typecheck`
2. `npm run build`
3. `npm run test`
4. `npm run format:check`
5. `npm run lint`
6. `npm run check`

## Tasks

1. `TK-1001` 建立 TypeScript 工程与构建基线
2. `TK-1002` 接入 Vitest 并迁移测试运行基线
3. `TK-1003` 迁移基础模块与对应单测（试点批次）
4. `TK-1004` 对齐 CI/Gate 与发布入口的 TS/Vitest 约束
5. `TK-1005` 接入 Biome formatter 与格式化命令基线
6. `TK-1006` 参考 `camera_point` 启用 Biome linter 规则与 lint 命令
