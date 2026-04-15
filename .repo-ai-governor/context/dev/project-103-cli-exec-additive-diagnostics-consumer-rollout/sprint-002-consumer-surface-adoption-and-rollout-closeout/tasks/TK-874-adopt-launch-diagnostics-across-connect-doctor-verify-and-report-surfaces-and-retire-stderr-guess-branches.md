# TK-874 adopt launch_diagnostics across connect doctor verify and report surfaces and retire stderr-guess branches

- Status: completed
- Date: 2026-04-14
- Owner: AI-Agent
- Priority: P1
- Project: `project-103-cli-exec-additive-diagnostics-consumer-rollout`
- Sprint: `sprint-002-consumer-surface-adoption-and-rollout-closeout`

## 1. 任务目标

把 `launch_diagnostics` 统一接入 `connect / doctor / verify / report` surfaces，并退役 stderr/error-message 猜测分支。

## 2. Depends On

1. `TK-873`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/shared-launch-diagnostics-projection-and-consumer-surfaces.md`

## 3. 预期产物

1. consumer surface adoption plan
2. stderr-guess retirement boundary
3. synced task ledger once activation begins

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-103-cli-exec-additive-diagnostics-consumer-rollout/sprint-002-consumer-surface-adoption-and-rollout-closeout/plan.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/shared-launch-diagnostics-projection-and-consumer-surfaces.md`
3. `.repo-ai-governor/context/dev/project-102-cli-exec-launch-authoring-contract-tests-rollout/plan.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-002-additive-diagnostics-consumer/review/solution_review_cli-exec-additive-diagnostics-consumer-productization.md`

## 6. 实施计划

1. 将 `launch_diagnostics` 的 consumer surface 映射到 `connect / doctor / verify / report`。
2. 明确退役 stderr-guess branches 的范围，避免双重 truth source。
3. 为 `TK-875` scenario evidence 准备清晰的 consumer-side readback boundary。

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
2. 2026-04-14：`TK-873` closeout 已将 `sprint-002` 激活为新的 primary execution surface；当前任务切换为 `in_progress`，下一步预留本地 `CR-001` 后开始 consumer-surface adoption implementation。
3. 2026-04-14：新增 `CliLaunchDiagnosticsProjectionRuntime`，将同一份 snake_case `launch_diagnostics` companion 统一投影到 verify matrix 与 verification/report payload。
4. 2026-04-14：`connect` / `doctor` diagnostics artifact 现已显式写出 `verificationMatrix`，`verification.tools[] / roles[]` 也已 materialize additive `launch_diagnostics`，不再要求 consumer 回退到 stderr/error-message 猜测路径。
5. 2026-04-14：focused runtime/command tests、`pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 均通过；任务切换为 `completed`，等待本地 `CR-001` fresh reviewer loop。

## 10. 产出

1. `apps/cli/src/runtime/cli-launch-diagnostics-projection-runtime.ts`
2. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
3. `apps/cli/src/runtime/adapter-diagnostics-runtime.ts`
4. `apps/cli/src/commands/connect-command.ts`
5. `apps/cli/src/commands/doctor-command.ts`
