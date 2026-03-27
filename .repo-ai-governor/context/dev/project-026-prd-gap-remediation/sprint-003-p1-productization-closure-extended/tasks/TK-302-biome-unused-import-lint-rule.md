# TK-302 unused import lint 规则接入

- Status: completed
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P1
- Project: `project-026-prd-gap-remediation`
- Sprint: `sprint-003-p1-productization-closure-extended`

## 1. 任务目标

为仓库级 `Biome` lint 接入 `correctness/noUnusedImports`，对齐 TypeScript `ts(6133)` 中“已声明但从未读取”的 import 场景，并清理当前仓库内会阻断规则启用的现存命中点。

## 2. Depends On

1. `biome.json`
2. `apps/cli/src/cli-governance-runtime.ts`
3. `pnpm biome lint`

## 3. 预期产物

1. 仓库级 unused import lint 规则
2. 与新规则兼容的现存 import 清理
3. 对应验证记录

## 4. 实施计划

1. 确认 `ts(6133)` 对应的 `Biome` 规则名。
2. 在 `biome.json` 启用 `correctness/noUnusedImports`。
3. 清理仓库内现存 unused imports。
4. 通过定向 lint 与类型检查验证。

## 5. 验证命令

1. `pnpm biome lint . --only=correctness/noUnusedImports`
2. `pnpm run typecheck`

## 6. 执行记录

1. 2026-03-28：任务创建并直接收口，确认 `ClaudeCodeAgentAdapter` 未使用 import 对应 `Biome` 规则为 `correctness/noUnusedImports`。
2. 2026-03-28：已完成 `biome.json` 规则接入，并通过 `Biome` safe fix 清理 8 个文件中的现存 unused imports，覆盖 `apps/cli/src/cli-governance-runtime.ts`、`apps/cli/src/runtime/**`、`packages/core-*/**` 与测试文件。
3. 2026-03-28：已通过 `pnpm biome lint . --only=correctness/noUnusedImports` 与 `pnpm run typecheck` 验证。
