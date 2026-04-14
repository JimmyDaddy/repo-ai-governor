# TK-875 produce scenario-driven evidence for spawn-failed parse-failed non-zero and signal consumer mappings

- Status: completed
- Date: 2026-04-14
- Owner: AI-Agent
- Priority: P1
- Project: `project-103-cli-exec-additive-diagnostics-consumer-rollout`
- Sprint: `sprint-002-consumer-surface-adoption-and-rollout-closeout`

## 1. 任务目标

为 `spawn_failed / parse_failed / non_zero / signal` 等场景产出 consumer-side diagnostics evidence，固定 additive launch evidence 的读法。

## 2. Depends On

1. `TK-874`
2. `.repo-ai-governor/context/dev/project-102-cli-exec-launch-authoring-contract-tests-rollout/plan.md`

## 3. 预期产物

1. scenario-driven diagnostics evidence plan
2. consumer mapping proof surface
3. synced task ledger once activation begins

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-103-cli-exec-additive-diagnostics-consumer-rollout/sprint-002-consumer-surface-adoption-and-rollout-closeout/tasks/TK-874-adopt-launch-diagnostics-across-connect-doctor-verify-and-report-surfaces-and-retire-stderr-guess-branches.md`
2. `.repo-ai-governor/context/dev/project-102-cli-exec-launch-authoring-contract-tests-rollout/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/cli-exec-five-direction-dependency-and-sequencing-analysis-technical-solution.md`

## 6. 实施计划

1. 将关键 failure scenarios 映射到 diagnostics consumer readback。
2. 固定 additive launch evidence 在不同 consumer surface 的解释边界。
3. 为 `TK-876` final closeout 准备 delivery-ready evidence surface。

## 7. Development Verification

1. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/commands/connect-command.test.ts apps/cli/test/commands/doctor-command.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/commands/connect-command.test.ts apps/cli/test/commands/doctor-command.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
4. sprint closeout 前补跑 `node ./scripts/governance/check-task-ledger-sync.js`
5. sprint closeout 前补跑 `node ./scripts/governance/check-sprint-plan-status-sync.js`
6. sprint closeout 前补跑 `node ./scripts/governance/check-code-review-status-sync.js`

## 9. 执行记录

1. 2026-04-14：任务创建，状态初始化为 `planned`。
2. 2026-04-14：新增 unit/command evidence，固定 `spawn_failed`、`probe_protocol_parse_failed`、`non_zero_exit` 与 `signal_exit` 在 verify/report consumer surfaces 上的 `launch_diagnostics` 读法。
3. 2026-04-14：focused runtime/command tests、`pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 均通过；任务切换为 `completed`，等待本地 `CR-001` fresh reviewer loop。

## 10. 产出

1. `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
2. `apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts`
3. `apps/cli/test/commands/connect-command.test.ts`
4. `apps/cli/test/commands/doctor-command.test.ts`
