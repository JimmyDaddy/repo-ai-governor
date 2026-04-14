# TK-858 implement cli-exec additive diagnostics consumer rollout baseline

- Status: completed
- Date: 2026-04-13
- Owner: AI-Agent
- Priority: P0
- Project: `project-103-cli-exec-additive-diagnostics-consumer-rollout`
- Sprint: `sprint-001-additive-diagnostics-consumer-rollout`

## 1. 任务目标

将 `technical-solution.cli-exec-additive-diagnostics-consumer-productization` 的 formal direction 落成真实 rollout baseline，启动 onboarding / doctor / report 对 launch diagnostics 的 consumer projection implementation planning。

## 2. Depends On

1. `DA-849`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/shared-launch-diagnostics-projection-and-consumer-surfaces.md`

## 3. 预期产物

1. diagnostics consumer rollout implementation baseline
2. follow-up execution notes and verification evidence
3. updated task ledger once activation begins

## 4. Required Inputs

1. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
2. `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-002-additive-diagnostics-consumer/tasks/DA-849-cli-exec-additive-diagnostics-consumer-promotion-cutover.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/shared-launch-diagnostics-projection-and-consumer-surfaces.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/cli-exec-additive-diagnostics-consumer-productization-technical-solution.md`
2. `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-002-additive-diagnostics-consumer/review/solution_review_cli-exec-additive-diagnostics-consumer-productization.md`

## 6. 实施计划

1. 以 snake_case canonical projection 与 probe-owned preserved facts 为前置，拆分 onboarding / doctor / report consumer rollout scope。
2. 对齐 `spawn_failed / protocol_parse_failed / non_zero_exit / timeout/abort` 的 scenario-to-consumer evidence，避免 rollout window 把 additive evidence 升格为新的 minimum field。
3. 激活时同步 task ledger、checklist、tasks.csv 与后续 CR loop surface。

## 7. Development Verification

1. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm exec vitest run apps/cli/test/runtime/adapter-verification-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run build`
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-13：任务创建，状态初始化为 `planned`，作为 `followup_required` rollout skeleton 的 canonical task。
2. 2026-04-14：`project-102` final closeout 后，当前任务切换为 `in_progress`，作为 `project-103 / sprint-001` 激活后的 baseline implementation 入口。
3. 2026-04-14：已在 `CliAgentOnboardingRuntime` 为 `enabled_tools[]` canonical carrier 落地 CLI-exec additive `launch_diagnostics` companion，并让 `tool_transport_matrix` 仅做机械派生；同时补上 parse-failed / spawn-failed runtime coverage、canonical/alias parity 断言与命令级 `cli-output-contract` integration 证据。focused suites、`pnpm run build` 与 `pnpm run test:packages` 已在同窗通过，当前任务完成。

## 10. 产出

1. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
2. `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
