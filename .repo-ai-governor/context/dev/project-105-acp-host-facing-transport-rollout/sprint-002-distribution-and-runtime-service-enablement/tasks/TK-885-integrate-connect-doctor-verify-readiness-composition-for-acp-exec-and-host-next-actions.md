# TK-885 integrate connect doctor verify readiness composition for acp_exec and host next-actions

- Status: completed
- Date: 2026-04-15
- Owner: AI-Agent
- Priority: P1
- Project: `project-105-acp-host-facing-transport-rollout`
- Sprint: `sprint-002-distribution-and-runtime-service-enablement`

## 1. 任务目标

把 `connect / doctor / verify` 的 `acp_exec` readiness composition 落到真实 rollout boundary，并稳定投影 host next-actions。

## 2. Depends On

1. `TK-884`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`

## 3. 预期产物

1. ACP readiness composition plan
2. host next-actions projection boundary
3. synced task ledger once activation begins

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-105-acp-host-facing-transport-rollout/sprint-002-distribution-and-runtime-service-enablement/plan.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
3. `.repo-ai-governor/context/dev/project-104-cli-exec-onboarding-adoption-readiness-rollout/plan.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-004-acp-host-facing-transport-formalization/review/solution_review_acp-host-facing-transport-formalization.md`

## 6. 实施计划

1. 将 `acp_exec` readiness composition 接入 `connect / doctor / verify`。
2. 固定 host next-actions 与 ACP boundary 的 presenter-safe 投影方式。
3. 为 `TK-886` distribution/runtime-service enablement 准备清晰输入。

## 7. Development Verification

1. `pnpm vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts`
2. `pnpm run build`
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --tasks-dir ".repo-ai-governor/context/dev/project-105-acp-host-facing-transport-rollout/sprint-002-distribution-and-runtime-service-enablement/tasks"`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-code-review-status-sync.js`

## 9. 执行记录

1. 2026-04-14：任务创建，状态初始化为 `planned`。
2. 2026-04-15：`sprint-001` clean closeout 完成后，当前任务切换为 `in_progress`，并作为 `project-105 / sprint-002` 的 implementation 入口；下一步先本地预留 `CR-001`，再开始 ACP readiness composition 与 host next-actions implementation。
3. 2026-04-15：已把 ACP host companion/evidence runtime 接到 `connect / doctor / verify` readiness composition，`enabled_tools[] / tool_transport_matrix / verify matrix / diagnostics artifact` 现在都会稳定投影 `acp_host_companion`，`diagnostic_summary` 也会机械带出 ACP runtime/distribution readiness 计数。当前实现边界完成，进入 `CR-001` fresh reviewer loop。

## 10. 产出

1. ACP readiness composition implementation in `apps/cli/src/runtime/{cli-acp-host-protocol,cli-acp-host-evidence-runtime,cli-acp-host-companion-runtime,agent-onboarding-runtime,adapter-diagnostics-runtime,adapter-verification-runtime}.ts`
2. Focused ACP readiness coverage in `apps/cli/test/runtime/{adapter-routing-runtime,agent-onboarding-runtime,adapter-diagnostics-runtime,adapter-verification-runtime}.test.ts`
