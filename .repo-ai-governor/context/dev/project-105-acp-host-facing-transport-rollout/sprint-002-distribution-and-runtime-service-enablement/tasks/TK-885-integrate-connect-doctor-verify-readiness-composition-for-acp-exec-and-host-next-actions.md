# TK-885 integrate connect doctor verify readiness composition for acp_exec and host next-actions

- Status: in_progress
- Date: 2026-04-14
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

1. 待激活后补充 ACP readiness composition verification。

## 8. Delivery Verification

1. 待激活后补充 rollout-window delivery verification与治理检查。

## 9. 执行记录

1. 2026-04-14：任务创建，状态初始化为 `planned`。
2. 2026-04-15：`sprint-001` clean closeout 完成后，当前任务切换为 `in_progress`，并作为 `project-105 / sprint-002` 的 implementation 入口；下一步先本地预留 `CR-001`，再开始 ACP readiness composition 与 host next-actions implementation。

## 10. 产出

1. 待激活：ACP readiness composition artifacts to be defined in rollout window。
