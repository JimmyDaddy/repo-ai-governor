# TK-891 establish built-in pack parity catalog and source model foundation

- Status: planned
- Date: 2026-04-15
- Owner: AI-Agent
- Priority: P1
- Project: `project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout`
- Sprint: `sprint-001-parity-catalog-and-readiness-foundation`

## 1. 任务目标

将 built-in adoption pack 的 drift inventory、parity class 与 source catalog shape 收敛成可执行的 implementation baseline。

## 2. Depends On

1. `technical-solution.built-in-adoption-pack-parity-and-self-host-readiness-sync`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/built-in-adoption-pack-parity-and-self-host-readiness-sync.md`

## 3. 预期产物

1. 覆盖 `exact_sync / generated_projection / template_seed / adopter_owned_placeholder` 的 built-in pack parity inventory baseline
2. 包含 `source_mode / source_ref / structure-instance split / placeholder policy` 的 source catalog field model
3. 面向 `packages/standards` 的 first-wave touchpoint mapping 与 `sprint-002` activation recommendation

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/built-in-adoption-pack-parity-and-self-host-readiness-sync.md`
2. `.repo-ai-governor/context/dev/project-060-adoption-pack-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-654-adoption-pack-promotion-and-rollout-decomposition-handoff.md`
3. `packages/standards/src/built-in-adoption-pack-catalog.ts`
4. `packages/standards/src/adoption-pack-registry.ts`
5. `packages/standards/src/standards-runtime-loader.ts`

## 5. Traceback References

1. `.repo-ai-governor/draft/approved_solution_review_built-in-adoption-pack-parity-and-self-host-readiness-sync.md`
2. `.repo-ai-governor/context/dev/project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout/plan.md`
3. `.repo-ai-governor/context/dev/project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout/sprint-001-parity-catalog-and-readiness-foundation/plan.md`

## 6. 实施计划

1. 盘点 current built-in pack assets，并把 surface 映射到 `exact_sync / generated_projection / template_seed / adopter_owned_placeholder`。
2. 明确哪些 surface 必须走 `structured_template_projection`，哪些仍允许 template-safe `repo_file_sync` 或 generated assembly。
3. 冻结 source catalog 的首批字段、producer/consumer seam 与 `packages/standards` 代码触点。
4. 写出 `sprint-002` 的 activation recommendation，但不在本任务里启动实现窗口。

## 7. Development Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-15：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：built-in pack parity inventory baseline
2. 待执行：source catalog field model
3. 待执行：`packages/standards` first-wave touchpoint mapping / sprint-002 activation recommendation
