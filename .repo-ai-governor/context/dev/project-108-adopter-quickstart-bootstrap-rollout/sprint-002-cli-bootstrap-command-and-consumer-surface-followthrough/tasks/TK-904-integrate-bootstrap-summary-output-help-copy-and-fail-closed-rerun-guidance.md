# TK-904 integrate bootstrap summary output help copy and fail-closed rerun guidance

- Status: completed
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
2. 2026-04-15：进入实现窗口，开始把 bootstrap summary output、help copy 与 rerun guidance 对齐到 `adopt bootstrap` 的真实行为与 fail-closed 语义。
3. 2026-04-16：已完成 CLI presenter 与 i18n 接入；`adopt bootstrap` 子命令、result payload、help copy、blocker wording 与 bootstrap summary artifact 路径已经统一对齐到 quickstart contract，并保留 `check` 为显式 broader follow-up。
4. 2026-04-16：验证结果已记录：`pnpm exec vitest run apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/adopt-command.integration.test.ts apps/cli/test/commands/adopt-command.test.ts --maxWorkers=1 --maxConcurrency=1` 通过，`pnpm run build` 通过；根级 `pnpm -s tsc -p tsconfig.json --noEmit` 继续受既有仓库测试类型漂移影响而失败，未见本任务新引入的 presenter/runtime 类型错误。

## 10. 产出

1. `adopt bootstrap` 已在 CLI help 与 command dispatch 中成为公开 quickstart 子命令。
2. bootstrap summary presenter 已输出 selector resolution、reentry mode 与 init/doctor/bootstrap artifact 路径。
3. help/result copy 与 blocker messaging 已保留 `check` 作为显式 broader governance follow-up。
