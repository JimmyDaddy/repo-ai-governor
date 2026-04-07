# TK-619 implement and document standards runtime consumption examples plus team-pack path

- Status: completed
- Date: 2026-04-06
- Owner: `AI-Agent`
- Priority: `P2`
- Project: `project-056-standards-runtime-loader-and-pack-productization`
- Sprint: `sprint-001-standards-runtime-loader-product-path`

## 1. 任务目标

实现并文档化 standards runtime consumption examples 与 team-pack path，让 `team` 层不再只是类型里存在、README 里一笔带过的能力。

## 2. Depends On

1. `TK-618`

## 3. 预期产物

1. team-pack runtime fixture 或等价可执行示例
2. runtime consumption example 文档
3. official / team / repository 三层 precedence 行为验证

## 4. Required Inputs

1. `packages/standards/test/fixtures/runtime-loader/official-runtime-pack.fixture.ts`
2. `packages/standards/test/fixtures/runtime-loader/repository-runtime-pack.fixture.ts`
3. `packages/standards/test/standards-runtime-loader.integration.test.ts`
4. `packages/standards/README.md`
5. `packages/config/README.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-056-standards-runtime-loader-and-pack-productization/plan.md`
2. `.repo-ai-governor/context/dev/project-056-standards-runtime-loader-and-pack-productization/sprint-001-standards-runtime-loader-product-path/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`

## 6. 实施计划

1. 增加可执行的 `team` layer fixture / test path，证明官方、团队、仓库三层 precedence 在真实 runtime loader 中按预期工作。
2. 用正式示例展示调用方如何从 `governor.yaml.standards` 读取配置、加载 runtime、渲染 configured targets、以及生成 AGENTS projection payload。
3. 让 config README 与 standards README 指向同一条 product consumption story，避免 runtime contract 与用户文档分叉。

## 7. Development Verification

1. `pnpm exec vitest run --config vitest.packages.config.ts packages/standards/test/standards-runtime-loader.integration.test.ts packages/config/test/config.unit.test.ts`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm exec vitest run --config vitest.packages.config.ts packages/standards/test/standards-runtime-loader.integration.test.ts packages/config/test/config.unit.test.ts`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-06：任务创建，等待 `TK-618` 完成。
2. 2026-04-07：新增 `team-runtime-pack.fixture.ts`、三层 `official / team / repository` integration coverage，以及 README/config README 的统一 product consumption story；同窗口通过 `pnpm exec vitest run --config vitest.packages.config.ts packages/standards/test/standards-runtime-loader.integration.test.ts packages/config/test/config.unit.test.ts` 与 `pnpm run build`。

## 10. 产出

1. `packages/standards/test/fixtures/runtime-loader/team-runtime-pack.fixture.ts`
2. `packages/standards/test/standards-runtime-loader.integration.test.ts`
3. `packages/standards/README.md`
4. `packages/config/README.md`
5. `packages/config/test/config.unit.test.ts`
