# TK-677 implement first-wave official pack expansion and runtime/docs examples

- Status: completed
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-066-standards-and-language-pack-ecosystem-expansion`
- Sprint: `sprint-001-official-pack-expansion-matrix-and-first-wave`

## 1. 任务目标

实现第一波 official pack 扩展与 runtime/docs examples，把生态能力从 minimal baseline 推向更有 adoption 价值的状态。

## 2. Depends On

1. `TK-676`
2. 当前 standards runtime / pack baseline

## 3. 预期产物

1. first-wave pack expansion
2. runtime/docs examples
3. validation input

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-066-standards-and-language-pack-ecosystem-expansion/sprint-001-official-pack-expansion-matrix-and-first-wave/tasks/TK-676-freeze-official-pack-expansion-matrix-and-acceptance-contract.md`
2. `.repo-ai-governor/context/dev/project-056-standards-runtime-loader-and-pack-productization/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/repo-ai-governor-current-surface-gap-guide-project-sprint-task-decomposition.md`
2. `.repo-ai-governor/context/dev/project-056-standards-runtime-loader-and-pack-productization/project-056-standards-runtime-loader-and-pack-productization-completion-audit-summary.md`

## 6. 实施计划

1. 实现 first-wave pack expansion。
2. 补 runtime/docs examples。
3. 准备 validation evidence 给 `TK-678`。

## 7. Development Verification

1. standards runtime example validation
2. official pack smoke checks

## 8. Delivery Verification

1. `pnpm exec vitest run packages/standards/test/language-minimal-governance-packs.integration.test.ts packages/standards/test/standards-runtime-loader.integration.test.ts packages/config/test/config.unit.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`

## 9. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `planned`。
2. 2026-04-08：已完成 first-wave official pack expansion：新增 `javascriptMinimalGovernancePack` 与 `rustMinimalGovernancePack`，并补齐 top-level export、runtime loader example、config example 与 render/projection tests。
3. 2026-04-08：已补齐验证窗口：`pnpm exec vitest run packages/standards/test/language-minimal-governance-packs.integration.test.ts packages/standards/test/standards-runtime-loader.integration.test.ts packages/config/test/config.unit.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 与 `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`。
4. 2026-04-08：first-wave official pack implementation 已完成；当前 sprint 的 next boundary 是 fresh reviewer CR loop，状态切换为 `completed`。

## 10. 产出

1. `/Users/jimmydaddy/study/ai-governor/packages/standards/src/examples/javascript-minimal-governance-pack.ts`
2. `/Users/jimmydaddy/study/ai-governor/packages/standards/src/examples/rust-minimal-governance-pack.ts`
3. `/Users/jimmydaddy/study/ai-governor/packages/standards/test/language-minimal-governance-packs.integration.test.ts`
4. `/Users/jimmydaddy/study/ai-governor/packages/standards/test/standards-runtime-loader.integration.test.ts`
5. `/Users/jimmydaddy/study/ai-governor/packages/config/README.md`
