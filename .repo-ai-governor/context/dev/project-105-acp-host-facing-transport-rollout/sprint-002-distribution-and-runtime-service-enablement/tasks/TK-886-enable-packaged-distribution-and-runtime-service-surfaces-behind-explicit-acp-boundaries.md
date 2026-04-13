# TK-886 enable packaged-distribution and runtime-service surfaces behind explicit ACP boundaries

- Status: planned
- Date: 2026-04-14
- Owner: AI-Agent
- Priority: P1
- Project: `project-105-acp-host-facing-transport-rollout`
- Sprint: `sprint-002-distribution-and-runtime-service-enablement`

## 1. 任务目标

启用 packaged distribution 与 runtime-service surfaces，同时保持所有 host-facing enablement 都收口在 explicit ACP boundaries 内。

## 2. Depends On

1. `TK-885`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-host-facing-transport-formalization-and-distribution-boundary.md`

## 3. 预期产物

1. packaged distribution/runtime-service enablement plan
2. ACP boundary guardrails
3. synced task ledger once activation begins

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-105-acp-host-facing-transport-rollout/sprint-002-distribution-and-runtime-service-enablement/tasks/TK-885-integrate-connect-doctor-verify-readiness-composition-for-acp-exec-and-host-next-actions.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-host-facing-transport-formalization-and-distribution-boundary.md`
3. `.repo-ai-governor/context/dev/project-104-cli-exec-onboarding-adoption-readiness-rollout/plan.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/acp-host-facing-transport-formalization-technical-solution.md`

## 6. 实施计划

1. 将 packaged distribution 与 runtime-service enablement 拆成 ACP-specific implementation surface。
2. 固定 enablement 过程中的 explicit boundary guardrails，避免 transport alias/rewrite。
3. 为 `TK-887` sprint handoff 准备清晰的 delivery boundary。

## 7. Development Verification

1. 待激活后补充 distribution/runtime-service verification。

## 8. Delivery Verification

1. 待激活后补充 rollout-window delivery verification与治理检查。

## 9. 执行记录

1. 2026-04-14：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待激活：distribution/runtime-service artifacts to be defined in rollout window。
