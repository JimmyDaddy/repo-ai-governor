# TK-860 implement ACP host-facing transport rollout baseline

- Status: planned
- Date: 2026-04-13
- Owner: AI-Agent
- Priority: P0
- Project: `project-105-acp-host-facing-transport-rollout`
- Sprint: `sprint-001-acp-host-facing-transport-rollout`

## 1. 任务目标

将 `technical-solution.acp-host-facing-transport-formalization` 的 formal direction 落成真实 rollout baseline，启动 `acp_exec` host-facing transport、`acp_host_companion` carry path、packaged distribution 与 clean-room verify 的 implementation planning。

## 2. Depends On

1. `DA-855`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-host-facing-transport-formalization-and-distribution-boundary.md`

## 3. 预期产物

1. rollout implementation baseline
2. host-facing transport execution notes and verification evidence
3. updated task ledger once activation begins

## 4. Required Inputs

1. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
2. `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-004-acp-host-facing-transport-formalization/tasks/DA-855-acp-host-facing-transport-formalization-promotion-cutover.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-host-facing-transport-formalization-and-distribution-boundary.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/acp-host-facing-transport-formalization-technical-solution.md`
2. `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-004-acp-host-facing-transport-formalization/review/solution_review_acp-host-facing-transport-formalization.md`

## 6. 实施计划

1. 以 `acp_exec` distinct transport truth 与 `acp_host_companion` carrier 为前置，拆分 host-facing implementation、packaged distribution 与 runtime-service enablement scope。
2. 对齐 clean-room verify、support wording uplift 与 adopter guidance evidence，避免 rollout window 回退到 `cli_exec` alias 语义。
3. 激活时同步 task ledger、checklist、tasks.csv 与后续 CR loop surface。

## 7. Development Verification

1. 待激活后补充 implementation-window verification。

## 8. Delivery Verification

1. 待激活后补充 rollout-window delivery verification。

## 9. 执行记录

1. 2026-04-13：任务创建，状态初始化为 `planned`，作为 `followup_required` rollout skeleton 的 canonical task。

## 10. 产出

1. 待激活：implementation artifacts to be defined in rollout window
