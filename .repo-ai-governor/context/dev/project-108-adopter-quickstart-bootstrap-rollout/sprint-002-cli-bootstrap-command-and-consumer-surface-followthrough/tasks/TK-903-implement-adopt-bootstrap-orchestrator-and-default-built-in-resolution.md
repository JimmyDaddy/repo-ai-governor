# TK-903 implement adopt bootstrap orchestrator and default built-in resolution

- Status: completed
- Date: 2026-04-15
- Owner: AI-Agent
- Priority: P1
- Project: `project-108-adopter-quickstart-bootstrap-rollout`
- Sprint: `sprint-002-cli-bootstrap-command-and-consumer-surface-followthrough`

## 1. 任务目标

在 `apps/cli` 落 `adopt bootstrap` orchestrator、default built-in selector behavior 与 fail-closed resolver baseline。

## 2. Depends On

1. `TK-901`
2. `TK-902`

## 3. 预期产物

1. bootstrap orchestrator runtime
2. default built-in selector behavior
3. fail-closed ambiguous resolution baseline

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-001-quickstart-contract-and-bootstrap-runtime-baseline/tasks/DA-900-adopter-quickstart-bootstrap-promotion-and-rollout-handoff.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adopter-quickstart-bootstrap-command-and-install-convenience-surface.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
4. `apps/cli/src/commands/adopt-command.ts`
5. `apps/cli/src/runtime/adoption-pack-runtime.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-002-cli-bootstrap-command-and-consumer-surface-followthrough/plan.md`
2. `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md`
3. `.repo-ai-governor/draft/approved_solution_review_adopter-quickstart-bootstrap-command.md`

## 6. 实施计划

1. 实现 convenience runtime orchestration seam。
2. 对齐 omitted selector 与 explicit selector 的 resolver behavior。
3. 将 ambiguity、drift 与 mismatch 继续保持为 fail-closed redirect path。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-15：任务创建，状态初始化为 `planned`。
2. 2026-04-15：开始进入实现窗口，状态切换为 `in_progress`，准备落 `adopt bootstrap` runtime orchestration、selector resolution 与 fail-closed boundary。
3. 2026-04-16：已完成 runtime 实现；`adopt bootstrap` 现在先执行 bootstrap 专属 doctor preflight，再进入 convenience install orchestration 与 additive diagnostics summary；在省略 selector 时默认回落官方 built-in pack，对显式 profile-alias 歧义保持 fail-closed，并把 clean rerun / drift redirect 语义收口到 `reuse_existing_installation` 与 `adopt diff/upgrade/remove`，而不是重回旧的 `doctor --fix -> adopt apply -> adopt verify` 固定编排口径。
4. 2026-04-16：验证结果已记录：`pnpm exec vitest run apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/adopt-command.integration.test.ts apps/cli/test/commands/adopt-command.test.ts --maxWorkers=1 --maxConcurrency=1` 通过，`pnpm run build` 通过；`pnpm -s tsc -p tsconfig.json --noEmit` 仍失败，但失败点分布在本任务变更面外的既有测试文件，未观察到新的 sprint-002 source-surface 类型错误。

## 10. 产出

1. `apps/cli/src/runtime/adoption-pack-bootstrap-runtime.ts` 已提供 bootstrap orchestrator runtime 与 additive summary artifact。
2. `apps/cli/src/runtime/adoption-pack-runtime.ts` 已收口 omitted selector 默认 built-in 与 explicit profile-alias ambiguity fail-closed 语义。
3. clean rerun、drift redirect 与 lifecycle handoff 已固定回 `adopt diff/upgrade/remove`。
