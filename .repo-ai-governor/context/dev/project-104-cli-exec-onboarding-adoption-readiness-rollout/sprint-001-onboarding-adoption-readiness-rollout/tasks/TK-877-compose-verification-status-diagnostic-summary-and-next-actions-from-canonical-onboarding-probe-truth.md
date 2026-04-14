# TK-877 compose verification_status diagnostic_summary and next_action(s) from canonical onboarding probe truth

- Status: completed
- Date: 2026-04-14
- Owner: AI-Agent
- Priority: P1
- Project: `project-104-cli-exec-onboarding-adoption-readiness-rollout`
- Sprint: `sprint-001-onboarding-adoption-readiness-rollout`

## 1. 任务目标

从 canonical onboarding/probe truth 组合出 `verification_status / diagnostic_summary / next_action(s)`，作为 readiness evidence chain 的第一阶段实现边界。

## 2. Depends On

1. `TK-859`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/cli-exec-onboarding-and-adoption-readiness-productization.md`

## 3. 预期产物

1. readiness composition plan
2. onboarding/probe ownership split implementation boundary
3. synced task ledger once activation begins

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-104-cli-exec-onboarding-adoption-readiness-rollout/sprint-001-onboarding-adoption-readiness-rollout/tasks/TK-859-implement-cli-exec-onboarding-and-adoption-readiness-rollout-baseline.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/cli-exec-onboarding-and-adoption-readiness-productization.md`
3. `.repo-ai-governor/context/dev/project-103-cli-exec-additive-diagnostics-consumer-rollout/plan.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/cli-exec-onboarding-and-adoption-readiness-productization-technical-solution.md`

## 6. 实施计划

1. 将 readiness composition 固定在 onboarding-owned carrier 上，而不是让 docs/playbook 重算结果。
2. 保持 onboarding truth、probe truth 与 additive launch evidence 的 ownership split。
3. 激活时为 local `CR-001` 提供清晰的 readiness-composition review scope。

## 7. Development Verification

1. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/commands/connect-command.test.ts apps/cli/test/commands/doctor-command.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-14：任务创建，状态初始化为 `planned`。
2. 2026-04-14：已将 `verification_status / diagnostic_summary / next_action(s)` 的组合责任固定到 onboarding runtime，统一基于 canonical verification/probe truth 计算 readiness summary，并为 `doctor` additive 带出 `safe_local_fix` 计数；同一逻辑已进入 `verificationMatrix` 顶层字段，避免 command surface 与 diagnostics artifact 漂移。focused readiness suites、`pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 已在同窗通过，当前任务完成。
3. 2026-04-14：`CR-001` round 1 进一步要求 `doctor` 在 `manual_only` 路径省略虚假的 `safe_local_fix=0`，并补上真实命令边界断言；该 readiness composition chain 现已通过修复后重验并收口为 `resolved`。

## 10. 产出

1. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
2. `apps/cli/src/commands/connect-command.ts`
3. `apps/cli/src/commands/doctor-command.ts`
4. `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
5. `apps/cli/test/commands/connect-command.test.ts`
