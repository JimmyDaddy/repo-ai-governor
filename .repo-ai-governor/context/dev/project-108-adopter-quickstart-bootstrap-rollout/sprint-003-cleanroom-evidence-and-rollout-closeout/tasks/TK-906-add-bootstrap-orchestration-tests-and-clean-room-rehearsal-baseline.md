# TK-906 add bootstrap orchestration tests and clean-room rehearsal baseline

- Status: completed
- Date: 2026-04-15
- Owner: AI-Agent
- Priority: P1
- Project: `project-108-adopter-quickstart-bootstrap-rollout`
- Sprint: `sprint-003-cleanroom-evidence-and-rollout-closeout`

## 1. 任务目标

为 `adopt bootstrap` 增加 orchestration tests、selector ambiguity coverage 与 clean-room rehearsal baseline。

## 2. Depends On

1. `TK-903`
2. `TK-904`

## 3. 预期产物

1. bootstrap orchestration tests
2. ambiguity and rerun coverage
3. clean-room rehearsal baseline

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-001-quickstart-contract-and-bootstrap-runtime-baseline/tasks/DA-900-adopter-quickstart-bootstrap-promotion-and-rollout-handoff.md`
2. `apps/cli/test/adopt-command.integration.test.ts`
3. `apps/cli/src/commands/adopt-command.ts`
4. `apps/cli/src/runtime/adoption-pack-runtime.ts`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adopter-quickstart-bootstrap-command-and-install-convenience-surface.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-003-cleanroom-evidence-and-rollout-closeout/plan.md`
2. `.repo-ai-governor/draft/approved_solution_review_adopter-quickstart-bootstrap-command.md`
3. `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md`

## 6. 实施计划

1. 补齐 orchestration success/warn/fail coverage。
2. 覆盖 selector ambiguity 与 rerun redirect behavior。
3. 准备 clean-room rehearsal baseline。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-15：任务创建，状态初始化为 `planned`。
2. 2026-04-16：状态切换为 `in_progress`，开始补齐 explicit selector reuse、multiple existing receipts blocker、clean rerun / drift redirect 的 bootstrap orchestration coverage，并准备 clean-room rehearsal baseline。
3. 2026-04-16：已补齐 explicit selector reuse、multiple receipts blocker 与 mismatch redirect 的 regression coverage，并用 `pnpm run build` 与 `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1` 验证通过。

## 10. 产出

1. 已完成：`apps/cli/test/adopt-command.integration.test.ts`
2. 已完成：`.tmp/project-108-adopt-bootstrap-cleanroom-summary.json`
3. 已完成：`.tmp/project-108-adopt-bootstrap-help.txt`
