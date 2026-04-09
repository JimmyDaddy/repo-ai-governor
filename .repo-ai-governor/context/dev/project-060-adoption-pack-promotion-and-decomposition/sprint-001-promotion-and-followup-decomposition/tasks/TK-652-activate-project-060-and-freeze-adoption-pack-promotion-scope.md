# TK-652 activate project-060 and freeze adoption-pack promotion scope

- Status: completed
- Date: 2026-04-09
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-060-adoption-pack-promotion-and-decomposition`
- Sprint: `sprint-001-promotion-and-followup-decomposition`

## 1. 任务目标

建立 adoption-pack promotion / decomposition stream，并冻结本轮的 solution id、target module、formal cutover 范围与 follow-up delivery owner。

## 2. Depends On

1. `.repo-ai-governor/context/dev/project-056-standards-runtime-loader-and-pack-productization/sprint-001-standards-runtime-loader-product-path/review/approved_solution_review_host-skill-distribution-and-discovery-followup.md`
2. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`

## 3. 预期产物

1. `project-060` project / sprint plan
2. `TK-652 ~ TK-655` canonical task surface
3. promotion/decomposition scope freeze

## 4. Required Inputs

1. `.repo-ai-governor/draft/host-skill-distribution-and-discovery-follow-up-technical-solution.md`
2. `.repo-ai-governor/context/dev/project-056-standards-runtime-loader-and-pack-productization/sprint-001-standards-runtime-loader-product-path/review/approved_solution_review_host-skill-distribution-and-discovery-followup.md`
3. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
4. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-049-governance-surface-clients-host-distribution-promotion-and-decomposition/plan.md`
2. `.repo-ai-governor/context/dev/project-049-governance-surface-clients-host-distribution-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/TK-572-promote-governance-surface-clients-host-distribution-refinement-into-formal-module-docs-and-registries.md`

## 6. 实施计划

1. 冻结 `runtime.governance-clients` 作为 formal owner module。
2. 冻结 installer contract、self-host ADR 与 planned rollout decomposition 的最小 promotion 边界。
3. 创建 `project-060` project / sprint / task surface，供后续 promotion 与 decomposition 同窗收口。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-09：任务创建，状态初始化为 `completed`，project-060 promotion/decomposition 范围已冻结。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-060-adoption-pack-promotion-and-decomposition/plan.md`
2. `.repo-ai-governor/context/dev/project-060-adoption-pack-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/plan.md`
3. `.repo-ai-governor/context/dev/project-060-adoption-pack-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/TK-653-promote-adoption-pack-installer-follow-up-into-formal-module-docs-and-registries.md`
