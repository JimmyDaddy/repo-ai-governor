# TK-894 build built-in pack source catalog and generated assembly baseline

- Status: completed
- Date: 2026-04-15
- Owner: AI-Agent
- Priority: P1
- Project: `project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout`
- Sprint: `sprint-002-generated-projection-and-placeholder-boundaries`

## 1. 任务目标

把 sprint-001 冻结出的 source catalog shape 落到 `packages/standards` 的 built-in pack assembly seam，形成真正可执行的 catalog-driven baseline。

## 2. Depends On

1. `TK-891`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/built-in-adoption-pack-parity-and-self-host-readiness-sync.md`

## 3. 预期产物

1. built-in pack source catalog definition 与 supporting field model
2. catalog-driven built-in pack assembly seam integration
3. 面向 `sprint-002` 后续实现的 standards-side touchpoint note

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/built-in-adoption-pack-parity-and-self-host-readiness-sync.md`
2. `.repo-ai-governor/context/dev/project-060-adoption-pack-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-654-adoption-pack-promotion-and-rollout-decomposition-handoff.md`
3. `packages/standards/src/built-in-adoption-pack-catalog.ts`
4. `packages/standards/src/adoption-pack-registry.ts`
5. `packages/standards/src/standards-runtime-loader.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout/sprint-002-generated-projection-and-placeholder-boundaries/plan.md`
3. `.repo-ai-governor/draft/approved_solution_review_built-in-adoption-pack-parity-and-self-host-readiness-sync.md`

## 6. 实施计划

1. 将 sprint-001 输出的 parity class / source mode 冻结为 machine-readable source catalog baseline。
2. 把 built-in pack assembly 从手写大段字面量逐步收拢到 catalog-driven seam。
3. 明确 `packages/standards` 内 source catalog、registry 与 runtime loader 的 producer/consumer boundary。
4. 记录后续 `TK-895` 所需的 projection / placeholder 实现切入点。

## 7. Development Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-15：任务创建，状态初始化为 `planned`。
2. 2026-04-15：状态切换为 `in_progress`，开始把 source catalog shape 收口为 catalog-driven built-in pack assembly seam。
3. 2026-04-15：已将 self-host runtime bootstrap surfaces 收口到 `ResolvedAdoptionPackDefinition.runtimeBootstrapRecords`，并通过 `pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`。

## 10. 产出

1. 已完成：`packages/standards/src/built-in-adoption-pack-catalog.ts` 与 `packages/standards/src/types/interfaces/adoption-pack.interface.ts` 新增 `runtimeBootstrapRecords` 与 `sourceCatalogId` linkage，使 built-in source catalog baseline 可覆盖 self-host bootstrap surfaces。
2. 已完成：`packages/standards/src/adoption-pack-registry.ts` 与 `apps/cli/src/runtime/adoption-pack-runtime.ts` 改为消费 catalog-driven runtime bootstrap definition，移除 CLI 内部的 self-host bootstrap 硬编码列表。
3. 已完成：standards/runtime seam 已明确冻结为“source catalog 决定 materialization order，readiness sinks 留待 sprint-003”，从而为 `TK-895` 的 placeholder boundary 与 `TK-896` 的 handoff 总结提供稳定输入。
