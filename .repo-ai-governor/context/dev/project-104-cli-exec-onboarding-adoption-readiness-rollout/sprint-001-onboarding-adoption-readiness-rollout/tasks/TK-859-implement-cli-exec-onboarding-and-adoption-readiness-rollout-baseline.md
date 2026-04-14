# TK-859 implement cli-exec onboarding and adoption readiness rollout baseline

- Status: completed
- Date: 2026-04-13
- Owner: AI-Agent
- Priority: P0
- Project: `project-104-cli-exec-onboarding-adoption-readiness-rollout`
- Sprint: `sprint-001-onboarding-adoption-readiness-rollout`

## 1. 任务目标

将 `technical-solution.cli-exec-onboarding-and-adoption-readiness-productization` 的 formal direction 落成真实 rollout baseline，启动 readiness evidence consumer、local adoption runbook 对齐与 support-evidence planning。

## 2. Depends On

1. `DA-852`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/cli-exec-onboarding-and-adoption-readiness-productization.md`

## 3. 预期产物

1. onboarding/adoption readiness rollout implementation baseline
2. follow-up execution notes and verification evidence
3. updated task ledger once activation begins

## 4. Required Inputs

1. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
2. `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-003-onboarding-adoption-readiness/tasks/DA-852-cli-exec-onboarding-and-adoption-readiness-promotion-cutover.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/cli-exec-onboarding-and-adoption-readiness-productization.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/cli-exec-onboarding-and-adoption-readiness-productization-technical-solution.md`
2. `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-003-onboarding-adoption-readiness/review/solution_review_cli-exec-onboarding-and-adoption-readiness-productization.md`

## 6. 实施计划

1. 以 onboarding-owned readiness composition 与 probe-owned layered truth 为前置，拆分 `connect / doctor / verify` consumer rollout scope。
2. 对齐 local adoption runbook、next-action taxonomy 与 troubleshooting order，避免 rollout window 自行发明第二套 success/support truth。
3. 将 playbook uplift、support evidence 与 implementation verification 保持为后续激活窗口的真实产物，不在 skeleton 阶段预支完成结论。

## 7. Development Verification

1. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/commands/connect-command.test.ts apps/cli/test/commands/doctor-command.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`
5. `node ./scripts/governance/check-code-review-status-sync.js`

## 9. 执行记录

1. 2026-04-13：任务创建，状态初始化为 `planned`，作为 `followup_required` rollout skeleton 的 canonical task。
2. 2026-04-14：`project-103` final closeout 完成后，当前任务切换为 `in_progress`，并把 `project-104 / sprint-001` 激活为 primary execution surface；下一步先本地预留 `CR-001`，再开始 readiness rollout baseline implementation。
3. 2026-04-14：已把 readiness composition baseline 收敛到 `CliAgentOnboardingRuntime`，由 onboarding-owned logic 统一生成 `verification_status / diagnostic_summary / next_action(s)`，并将同一条 evidence chain additive 投影到 `verificationMatrix`；`connect`/`doctor` 不再手工拼接 `diagnostic_summary`。focused readiness suites、`pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 已在同窗通过，当前任务完成。
4. 2026-04-14：`CR-001` round 1 findings 已全部修复并收口为 `resolved`；当前 baseline 已补齐 `doctor` 的 truthful `safe_local_fix` 边界和真实命令级 readiness artifact 覆盖，进入下一轮 fresh clean recheck 前状态稳定。

## 10. 产出

1. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
2. `apps/cli/src/commands/connect-command.ts`
3. `apps/cli/src/commands/doctor-command.ts`
4. `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
5. `apps/cli/test/commands/connect-command.test.ts`
6. `apps/cli/test/commands/doctor-command.test.ts`
