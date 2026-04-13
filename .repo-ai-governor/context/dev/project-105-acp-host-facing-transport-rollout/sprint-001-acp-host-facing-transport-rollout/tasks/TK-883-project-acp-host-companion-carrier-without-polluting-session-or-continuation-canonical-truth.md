# TK-883 project acp_host_companion carrier without polluting session or continuation canonical truth

- Status: planned
- Date: 2026-04-14
- Owner: AI-Agent
- Priority: P1
- Project: `project-105-acp-host-facing-transport-rollout`
- Sprint: `sprint-001-acp-host-facing-transport-rollout`

## 1. 任务目标

把 `acp_host_companion` 作为 projection-owned carrier 落到真实 implementation boundary，同时保持 session/continuation canonical truth 不被 ACP-local ids 污染。

## 2. Depends On

1. `TK-882`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-host-facing-transport-formalization-and-distribution-boundary.md`

## 3. 预期产物

1. acp_host_companion carrier plan
2. session/continuation isolation boundary
3. synced task ledger once activation begins

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-105-acp-host-facing-transport-rollout/sprint-001-acp-host-facing-transport-rollout/tasks/TK-882-implement-explicit-acp-exec-transport-routing-and-fail-closed-separation-from-cli-exec.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-host-facing-transport-formalization-and-distribution-boundary.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-004-acp-host-facing-transport-formalization/review/solution_review_acp-host-facing-transport-formalization.md`

## 6. 实施计划

1. 固定 `acp_host_companion` 的 carrier responsibility 与 presenter-safe facts。
2. 保持 ACP-local ids 不回写 shared session truth 或 continuation truth。
3. 为 `TK-884` closeout/activation handoff 准备清晰 evidence boundary。

## 7. Development Verification

1. 待激活后补充 companion-carrier verification。

## 8. Delivery Verification

1. 待激活后补充 rollout-window delivery verification与治理检查。

## 9. 执行记录

1. 2026-04-14：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待激活：acp_host_companion artifacts to be defined in rollout window。
