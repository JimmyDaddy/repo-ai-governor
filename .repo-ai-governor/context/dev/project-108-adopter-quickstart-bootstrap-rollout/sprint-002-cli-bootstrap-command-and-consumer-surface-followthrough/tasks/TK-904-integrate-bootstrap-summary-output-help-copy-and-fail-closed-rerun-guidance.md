# TK-904 integrate bootstrap summary output help copy and fail-closed rerun guidance

- Status: planned
- Date: 2026-04-15
- Owner: AI-Agent
- Priority: P1
- Project: `project-108-adopter-quickstart-bootstrap-rollout`
- Sprint: `sprint-002-cli-bootstrap-command-and-consumer-surface-followthrough`

## 1. 任务目标

把 bootstrap summary output、help copy 与 rerun redirect guidance 接入 CLI presenter，同时保留 `check` explicit follow-up wording。

## 2. Depends On

1. `TK-903`

## 3. 预期产物

1. bootstrap summary presenter baseline
2. help and result copy
3. explicit `check` follow-up guidance

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-001-quickstart-contract-and-bootstrap-runtime-baseline/tasks/DA-900-adopter-quickstart-bootstrap-promotion-and-rollout-handoff.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adopter-quickstart-bootstrap-command-and-install-convenience-surface.md`
3. `apps/cli/src/commands/adopt-command.ts`
4. `packages/shared/src/i18n/locales/en-us.ts`
5. `packages/shared/src/i18n/locales/zh-cn.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-002-cli-bootstrap-command-and-consumer-surface-followthrough/plan.md`
2. `.repo-ai-governor/draft/approved_solution_review_adopter-quickstart-bootstrap-command.md`
3. `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md`

## 6. 实施计划

1. 接入 additive bootstrap summary output。
2. 补齐 help/copy 与 rerun redirect guidance。
3. 保留 `check` 作为 explicit broader audit follow-up 的 presenter wording。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-15：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：bootstrap summary presenter baseline
2. 待执行：help / result copy
3. 待执行：explicit `check` follow-up guidance
