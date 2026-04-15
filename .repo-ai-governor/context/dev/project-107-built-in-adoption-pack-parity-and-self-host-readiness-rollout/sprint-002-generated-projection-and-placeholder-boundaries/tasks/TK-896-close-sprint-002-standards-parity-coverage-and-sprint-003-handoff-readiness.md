# TK-896 close sprint-002 standards parity coverage and sprint-003 handoff readiness

- Status: planned
- Date: 2026-04-15
- Owner: AI-Agent
- Priority: P1
- Project: `project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout`
- Sprint: `sprint-002-generated-projection-and-placeholder-boundaries`

## 1. 任务目标

完成 sprint-002 的 standards-side exit acceptance，并把 runtime-facing inputs 压缩成 `sprint-003` 可直接激活的 handoff。

## 2. Depends On

1. `TK-894`
2. `TK-895`
3. `TK-893`

## 3. 预期产物

1. sprint-002 standards parity coverage summary
2. sprint-003 activation handoff recommendation
3. sprint-002 exit acceptance evidence note

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout/sprint-002-generated-projection-and-placeholder-boundaries/tasks/TK-894-build-built-in-pack-source-catalog-and-generated-assembly-baseline.md`
2. `.repo-ai-governor/context/dev/project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout/sprint-002-generated-projection-and-placeholder-boundaries/tasks/TK-895-implement-structured-template-projection-and-adopter-owned-placeholder-boundaries.md`
3. `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-001-launch-authoring-contract-tests/tasks/DA-846-cli-exec-launch-authoring-contract-tests-promotion-cutover.md`
4. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
5. `packages/standards/test/adoption-pack-registry.unit.test.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout/sprint-001-parity-catalog-and-readiness-foundation/tasks/TK-893-add-first-wave-parity-tests-and-docs-truthfulness-follow-up-plan.md`
2. `.repo-ai-governor/context/dev/project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout/plan.md`
3. `.repo-ai-governor/draft/approved_solution_review_built-in-adoption-pack-parity-and-self-host-readiness-sync.md`

## 6. 实施计划

1. 对齐 sprint-002 已落地的 source catalog、projection 与 placeholder boundary，与 sprint-001 规划之间的差异。
2. 收敛 standards-side parity coverage 的最小验收矩阵，并确认 runtime integration 所需的正式输入面。
3. 输出 `sprint-003` activation recommendation，但不在本任务内自动切换 active stream。
4. 为后续 project-final sprint 预留 docs truthfulness 与 closeout evidence 入口。

## 7. Development Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/run-normative-loading-manifest-gate.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-15：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：standards parity coverage summary
2. 待执行：sprint-003 activation handoff recommendation
3. 待执行：sprint-002 exit acceptance evidence note
