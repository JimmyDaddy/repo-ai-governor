# TK-618 freeze standards runtime loader product path and source-layering contract

- Status: completed
- Date: 2026-04-06
- Owner: `AI-Agent`
- Priority: `P2`
- Project: `project-056-standards-runtime-loader-and-pack-productization`
- Sprint: `sprint-001-standards-runtime-loader-product-path`

## 1. 任务目标

冻结 `StandardsRuntimeLoader` 的产品消费路径与 `official / team / repository` source-layering contract，使其不再只是 README 中的隐式示例。

## 2. Depends On

1. `project-052` closeout recommended

## 3. 预期产物

1. standards runtime loader 的 source-layering contract
2. 面向调用方的 runtime consumption helper 或等价正式消费入口
3. 与 contract 对齐的测试与文档基线

## 4. Required Inputs

1. `packages/standards/src/standards-runtime-loader.ts`
2. `packages/standards/src/types/interfaces/standards.interface.ts`
3. `packages/config/src/types/interfaces/governor.interface.ts`
4. `packages/standards/README.md`
5. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-056-standards-runtime-loader-and-pack-productization/plan.md`
2. `.repo-ai-governor/context/dev/project-056-standards-runtime-loader-and-pack-productization/sprint-001-standards-runtime-loader-product-path/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adopter-productization-priority-and-surface-sequencing.md`

## 6. 实施计划

1. 冻结 runtime loader 对 `official / team / repository` 三层 pack source 的正式消费契约与返回面。
2. 为当前配置声明出的 render/projection target 补一个调用方可直接消费的 helper，而不是只暴露底层 registry/render/projector 组合件。
3. 用测试与 README 例子把 source-layering contract 固定下来，避免后续 team-pack 路径继续停留在隐含能力。

## 7. Development Verification

1. `pnpm exec vitest run --config vitest.packages.config.ts packages/standards/test/standards-runtime-loader.integration.test.ts packages/config/test/config.unit.test.ts`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm exec vitest run --config vitest.packages.config.ts packages/standards/test/standards-runtime-loader.integration.test.ts packages/config/test/config.unit.test.ts`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-06：任务创建，等待 `project-056` 激活。
2. 2026-04-07：`project-056` 已切换为当前 primary stream，开始收口 runtime loader 的 source-layering contract 与 product consumption path。
3. 2026-04-07：新增 `StandardsRuntimeLoader.renderConfiguredTargets()` 与 `StandardsRuntimeRenderInput`，把 `renderTargets` 从 README 示例提升为正式 runtime helper；同窗口通过 `pnpm exec vitest run --config vitest.packages.config.ts packages/standards/test/standards-runtime-loader.integration.test.ts packages/config/test/config.unit.test.ts` 与 `pnpm run build`。

## 10. 产出

1. `packages/standards/src/standards-runtime-loader.ts`
2. `packages/standards/src/types/interfaces/standards.interface.ts`
3. `packages/standards/src/types/interfaces/index.ts`
4. `packages/standards/src/types/index.ts`
5. `packages/standards/src/index.ts`
6. `packages/standards/README.md`
7. `packages/config/src/types/interfaces/governor.interface.ts`
8. `packages/config/README.md`
9. `packages/config/test/config.unit.test.ts`
10. `packages/standards/test/standards-runtime-loader.integration.test.ts`
