# TK-553 land standards runtime loader and governor config assembly contract

- Status: completed
- Date: 2026-04-05
- Owner: AI-Agent
- Priority: P1
- Project: `project-046-p1-product-surface-and-delivery-closure`
- Sprint: `sprint-001-p1-five-gap-closure`

## 1. 任务目标

将 `packages/standards` 从“显式传 packs 的库能力”推进到“可从 `governor.yaml.standards` 自动装配 official / team / repository packs 的运行时 loader contract”，并补齐测试与文档。

## 2. Depends On

1. `packages/standards/**`
2. `packages/config/**`
3. `governor.yaml` config baseline

## 3. 预期产物

1. standards config schema
2. standards runtime loader
3. tests and README alignment

## 4. Development Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 5. 执行记录

1. 2026-04-05：任务创建，状态初始化为 `planned`；承接 standards runtime loader 与 config contract 收口。
2. 2026-04-05：完成 `GovernorConfig.standards` schema、`StandardsRuntimeLoader`、fixture pack/runtime loader tests 与 `packages/{config,standards}/README.md` 的运行时装配文档。
3. 2026-04-05：验证通过 `pnpm run build` 与 `pnpm vitest run packages/config/test/config.unit.test.ts packages/standards/test/standards-registry-and-renderer.unit.test.ts packages/standards/test/standards-runtime-loader.integration.test.ts --maxWorkers=1 --maxConcurrency=1`。
