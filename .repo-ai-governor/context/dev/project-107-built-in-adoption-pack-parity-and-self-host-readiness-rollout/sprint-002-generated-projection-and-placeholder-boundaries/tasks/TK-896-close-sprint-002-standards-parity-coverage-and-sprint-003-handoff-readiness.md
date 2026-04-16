# TK-896 close sprint-002 standards parity coverage and sprint-003 handoff readiness

- Status: completed
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
2. 2026-04-15：状态切换为 `in_progress`，开始汇总 sprint-002 standards parity coverage、exit acceptance evidence 与 sprint-003 activation handoff。
3. 2026-04-15：已完成 sprint-002 standards-side coverage summary，并通过 `node ./scripts/governance/run-normative-loading-manifest-gate.js`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js` 验证 handoff 账面与治理入口保持同步。

## 10. 产出

1. 已完成：standards parity coverage 已冻结为“source catalog linkage + runtime bootstrap definition + placeholder boundary”三段式实现面，验证面覆盖 `packages/standards/test/adoption-pack-registry.unit.test.ts` 与 `apps/cli/test/adopt-command.integration.test.ts`。
2. 已完成：`sprint-003` activation handoff 已压缩为单跳输入，即仅接手 `doctor diagnostics`、`adopt verify`、execution preflight 的 self-host readiness integration，以及 `README.md`、`docs/local-adoption-playbook.md`、`docs/support-matrix.md` 的 consumer truthfulness refresh。
3. 已完成：sprint-002 exit acceptance evidence 已记录为 `pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`node ./scripts/governance/run-normative-loading-manifest-gate.js`，当前边界已可进入 delegated sprint CR loop。
