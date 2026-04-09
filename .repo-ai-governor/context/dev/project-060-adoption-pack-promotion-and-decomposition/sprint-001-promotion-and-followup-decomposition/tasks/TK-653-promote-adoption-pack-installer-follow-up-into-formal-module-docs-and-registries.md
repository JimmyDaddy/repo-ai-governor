# TK-653 promote adoption-pack installer follow-up into formal module docs and registries

- Status: completed
- Date: 2026-04-09
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-060-adoption-pack-promotion-and-decomposition`
- Sprint: `sprint-001-promotion-and-followup-decomposition`

## 1. 任务目标

将 approved adoption-pack follow-up draft 正式提升为 `runtime.governance-clients` 的 active lifecycle-managed solution，并完成 formal module docs、lifecycle、delivery、module registry 与 manifest 接线。

## 2. Depends On

1. `TK-652`

## 3. 预期产物

1. `runtime-governance-clients` module overview delta
2. adoption-pack install contract / self-host template bootstrap ADR
3. lifecycle / delivery / module registry / manifest sync

## 4. Required Inputs

1. `.repo-ai-governor/draft/host-skill-distribution-and-discovery-follow-up-technical-solution.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-host-distribution-contract.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`
5. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-056-standards-runtime-loader-and-pack-productization/sprint-001-standards-runtime-loader-product-path/review/approved_solution_review_host-skill-distribution-and-discovery-followup.md`
2. `.repo-ai-governor/context/dev/project-049-governance-surface-clients-host-distribution-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/TK-572-promote-governance-surface-clients-host-distribution-refinement-into-formal-module-docs-and-registries.md`

## 6. 实施计划

1. 将 `verified` technical-solution review evidence 演进为 `approved` canonical artifact。
2. formalize installer-layer `adoption pack` contract，并将 self-host bootstrap boundary 收口到新 ADR。
3. 同步 lifecycle / delivery / module registry / manifest 与 `runtime.governance-clients` overview。

## 7. Development Verification

1. `node ./scripts/governance/check-technical-solution-lifecycle-registry.js`
2. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
3. `node ./scripts/governance/check-technical-solution-module-graph.js`
4. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`

## 8. Delivery Verification

1. `node ./scripts/governance/check-docs-triad-sync.js`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-code-review-status-sync.js`
5. `node ./scripts/governance/check-artifact-registry-lifecycle.js`

## 9. 执行记录

1. 2026-04-09：任务创建，状态初始化为 `completed`。
2. 2026-04-09：已完成 `approved` review artifact write-back，并新增 installer-focused contract 与 self-host template bootstrap ADR。
3. 2026-04-09：已完成 lifecycle registry、delivery registry、module registry 与 normative-loading-manifest 的 promotion cutover 同步。

## 10. 产出

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-host-distribution-contract.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adoption-pack-installer-and-self-host-template-bootstrap.md`
