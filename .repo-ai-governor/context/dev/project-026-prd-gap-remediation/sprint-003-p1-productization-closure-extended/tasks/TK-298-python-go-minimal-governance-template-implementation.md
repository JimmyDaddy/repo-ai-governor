# TK-298 Python/Go 最小治理模板实装

- Status: completed
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P1
- Project: `project-026-prd-gap-remediation`
- Sprint: `sprint-003-p1-productization-closure-extended`

## 1. 任务目标

在不引入新 standards loader 契约的前提下，为 Python 与 Go 提供可复用、可验证的最小治理模板 pack。

## 2. Depends On

1. `TK-297`
2. `packages/standards/`
3. `.repo-ai-governor/draft/gap-remediation-execution-order.md`

## 3. 预期产物

1. Python 最小治理模板 pack
2. Go 最小治理模板 pack
3. 对应定向验证与使用说明

## 4. 实施计划

1. 复用 `StandardsPack` 现有 contract，不新增额外 loader / schema。
2. 将 Python / Go 模板以可导入 pack 常量形式落到 `packages/standards`。
3. 为两套模板补齐渲染/投影层验证。
4. 在 `packages/standards/README.md` 说明定位与使用方式。

## 5. 验证命令

1. `pnpm vitest run --config vitest.packages.config.ts packages/standards/test/language-minimal-governance-packs.integration.test.ts`
2. `pnpm run typecheck`

## 6. 执行记录

1. 2026-03-27：任务创建，状态初始化为 `planned`。
2. 2026-03-28：状态切换为 `in_progress`，开始在 `packages/standards` 中补齐 Python / Go 最小治理模板与验证。
3. 2026-03-28：已完成 `pythonMinimalGovernancePack` / `goMinimalGovernancePack`、对应渲染投影测试与 `packages/standards/README.md` 使用说明，并通过定向测试、类型检查与构建验证。
