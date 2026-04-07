# TK-620 decide AGENTS projector adoption boundary and close standards runtime productization baseline

- Status: completed
- Date: 2026-04-06
- Owner: `AI-Agent`
- Priority: `P2`
- Project: `project-056-standards-runtime-loader-and-pack-productization`
- Sprint: `sprint-001-standards-runtime-loader-product-path`

## 1. 任务目标

决定 `AgentsProjector` 是否进入 root `AGENTS.md` 自动写回链，并收口当前 standards runtime productization baseline。

## 2. Depends On

1. `TK-618`
2. `TK-619`

## 3. 预期产物

1. AGENTS adoption boundary decision
2. project-056 baseline closeout evidence
3. sprint closeout 输入

## 4. Required Inputs

1. `packages/standards/src/agents-projector.ts`
2. `packages/standards/src/standards-runtime-loader.ts`
3. `packages/standards/README.md`
4. `AGENTS.md`
5. `.repo-ai-governor/context/current-context.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-056-standards-runtime-loader-and-pack-productization/plan.md`
2. `.repo-ai-governor/context/dev/project-056-standards-runtime-loader-and-pack-productization/sprint-001-standards-runtime-loader-product-path/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`

## 6. 实施计划

1. 明确当前 boundary 下 `StandardsRuntimeLoader` / `AgentsProjector` 只负责生成 projection payload，不负责自动写回仓库根 `AGENTS.md`。
2. 用测试与 README 说明 caller-owned write boundary，避免把当前手工维护的 root `AGENTS.md` 误报成 runtime loader 自动产物。
3. 汇总 sprint closeout 与 project-final review 所需的 evidence surface。

## 7. Development Verification

1. `pnpm exec vitest run --config vitest.packages.config.ts packages/standards/test/standards-runtime-loader.integration.test.ts`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm exec vitest run --config vitest.packages.config.ts packages/standards/test/standards-runtime-loader.integration.test.ts packages/config/test/config.unit.test.ts`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-06：任务创建，等待 `TK-618 / TK-619` 完成。
2. 2026-04-07：通过 runtime integration test 与 README 文案明确 `projectAgents()` 只返回 caller-owned projection payload，不自动写回仓库根 `AGENTS.md`；同窗口通过 `pnpm exec vitest run --config vitest.packages.config.ts packages/standards/test/standards-runtime-loader.integration.test.ts packages/config/test/config.unit.test.ts` 与 `pnpm run build`。

## 10. 产出

1. `packages/standards/src/agents-projector.ts`
2. `packages/standards/src/standards-runtime-loader.ts`
3. `packages/standards/README.md`
4. `AGENTS.md`
5. `packages/standards/test/standards-runtime-loader.integration.test.ts`
6. `.repo-ai-governor/context/dev/project-056-standards-runtime-loader-and-pack-productization/sprint-001-standards-runtime-loader-product-path/tasks/checklist.md`
