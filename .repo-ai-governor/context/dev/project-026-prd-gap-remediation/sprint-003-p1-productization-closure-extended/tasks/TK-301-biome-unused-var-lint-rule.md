# TK-301 unused var lint 规则接入

- Status: completed
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P1
- Project: `project-026-prd-gap-remediation`
- Sprint: `sprint-003-p1-productization-closure-extended`

## 1. 任务目标

为仓库级 `Biome` lint 接入 `correctness/noUnusedVariables`，并清理当前仓库内会阻断规则启用的现存命中点。

## 2. Depends On

1. `biome.json`
2. `package.json`
3. `pnpm biome lint`

## 3. 预期产物

1. 仓库级 unused var lint 规则
2. 与新规则兼容的现存代码清理
3. 对应验证记录

## 4. 实施计划

1. 确认当前 lint 基线与 `Biome` 规则名。
2. 在 `biome.json` 启用 `correctness/noUnusedVariables`。
3. 修复现存 unused variable / parameter 命中点。
4. 通过定向 lint 与类型检查验证。

## 5. 验证命令

1. `pnpm biome lint . --only=correctness/noUnusedVariables`
2. `pnpm run typecheck`

## 6. 执行记录

1. 2026-03-28：任务创建并直接收口，确认仓库当前 lint 基线由 `Biome` 承载，目标规则为 `correctness/noUnusedVariables`。
2. 2026-03-28：已完成 `biome.json` 规则接入，并修复 `packages/core-memory-semantics`、`packages/core-runtime-langgraph`、`scripts/governance`、`scripts/ci` 中共 7 处现存 unused variable / parameter 命中点。
3. 2026-03-28：已通过 `pnpm biome lint . --only=correctness/noUnusedVariables` 与 `pnpm run typecheck` 验证。
