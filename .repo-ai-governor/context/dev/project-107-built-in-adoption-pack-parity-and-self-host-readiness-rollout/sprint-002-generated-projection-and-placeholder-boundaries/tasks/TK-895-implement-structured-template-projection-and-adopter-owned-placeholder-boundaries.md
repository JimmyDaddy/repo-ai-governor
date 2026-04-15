# TK-895 implement structured template projection and adopter-owned placeholder boundaries

- Status: completed
- Date: 2026-04-15
- Owner: AI-Agent
- Priority: P1
- Project: `project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout`
- Sprint: `sprint-002-generated-projection-and-placeholder-boundaries`

## 1. 任务目标

把 starter-instance surface 的 `structured_template_projection` 与 adopter-owned placeholder/template boundary 一起落到 self-host pack asset assembly，避免 whole-file sync 回潮。

## 2. Depends On

1. `TK-894`
2. `TK-892`

## 3. 预期产物

1. `structured_template_projection` implementation baseline
2. governance / product / execution adopter-owned placeholder seed policy
3. self-host pack asset assembly 的 boundary note 与 deferred runtime sink list

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
2. `.repo-ai-governor/context/dev/project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout/sprint-001-parity-catalog-and-readiness-foundation/tasks/TK-891-establish-built-in-pack-parity-catalog-and-source-model-foundation.md`
3. `.repo-ai-governor/context/dev/project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout/sprint-001-parity-catalog-and-readiness-foundation/tasks/TK-892-formalize-self-host-placeholder-readiness-applicability-and-diagnostics-integration.md`
4. `packages/standards/src/built-in-adoption-pack-catalog.ts`
5. `apps/cli/src/runtime/adoption-pack-runtime.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-060-adoption-pack-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-654-adoption-pack-promotion-and-rollout-decomposition-handoff.md`
2. `.repo-ai-governor/context/dev/project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout/plan.md`
3. `.repo-ai-governor/context/dev/project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout/sprint-002-generated-projection-and-placeholder-boundaries/plan.md`

## 6. 实施计划

1. 将 `current-context.md` / `normative-loading-manifest.yaml` 这类 starter-instance surface 与 template-safe whole-file sync surface 分开建模。
2. 把 governance / product / execution repo-specific docs 明确收拢到 adopter-owned placeholder / template seed boundary。
3. 在 standards-side asset assembly 中落实 starter-instance projection 与 placeholder seed routing。
4. 将需要延后到 runtime integration 的 readiness sink / diagnostics responsibility 显式标记为 deferred items。

## 7. Development Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-15：任务创建，状态初始化为 `planned`。
2. 2026-04-15：状态切换为 `in_progress`，开始把 `structured_template_projection` surface 与 adopter-owned placeholder/bootstrap boundary 对齐到 self-host asset assembly。
3. 2026-04-15：已把 template/bootstrap materialization 顺序绑定到 source catalog，并通过 `pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1` 验证 self-host placeholder bootstrap 仍保持 starter boundary。

## 10. 产出

1. 已完成：`current-context.md`、`normative-loading-manifest.yaml` 等 starter-instance surface 继续通过 source-catalog-linked template projection 物化，避免回退为无边界 whole-file sync。
2. 已完成：`code_standards.md`、`long-term-maintenance-guide.md` 与 self-host execution starter docs 作为 adopter-owned placeholder/template seed 的边界被明确保留，CLI bootstrap 只写 starter content 而不镜像 live authoring truth。
3. 已完成：deferred runtime sink list 已冻结为 `doctor diagnostics`、`adopt verify` 与 execution preflight，留待 `sprint-003` 接手 self-host readiness integration。
