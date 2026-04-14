# TK-858 implement cli-exec additive diagnostics consumer rollout baseline

- Status: in_progress
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

1. 待激活后补充 implementation-window verification。

## 8. Delivery Verification

1. 待激活后补充 rollout-window delivery verification。

## 9. 执行记录

1. 2026-04-13：任务创建，状态初始化为 `planned`，作为 `followup_required` rollout skeleton 的 canonical task。
2. 2026-04-14：`project-102` final closeout 后，当前任务切换为 `in_progress`，作为 `project-103 / sprint-001` 激活后的 baseline implementation 入口。

## 10. 产出

1. 待激活：implementation artifacts to be defined in rollout window
