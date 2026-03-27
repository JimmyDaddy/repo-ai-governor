# TK-296 团队共享规范包分发路径文档与示例

- Status: completed
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P1
- Project: `project-026-prd-gap-remediation`
- Sprint: `sprint-002-p1-productization-closure-baseline`

## 1. 任务目标

沉淀官方 / 团队 / 仓库三层 Standards Pack 来源的外部消费路径，并补充最小分发与使用示例。

## 2. Depends On

1. `TK-293`
2. `packages/standards/README.md`

## 3. 预期产物

1. 团队共享 pack 发布/消费流程说明
2. 最小示例配置或示意
3. 外部 adopter 可执行的消费路径文档

## 4. 实施计划

1. 梳理 `official/team/repository` 三层来源职责。
2. 明确团队共享 pack 的发布与接入路径。
3. 补充 README / 示例。

## 5. 验证命令

1. `pnpm vitest run --config vitest.integration.config.ts test/public-package-exports.integration.test.ts`
2. `pnpm run typecheck`

## 6. 执行记录

1. 2026-03-27：任务创建，状态初始化为 `planned`。
2. 2026-03-28：状态切换为 `in_progress`，开始整理 `official/team/repository` 三层 Standards Pack 分发路径与当前真实消费方式。
3. 2026-03-28：已在 `packages/standards/README.md` 补充官方/团队/仓库三层分发路径、最小组装示例，以及 `governor.yaml.standards` 仍未自动 loader 化的当前边界说明。
