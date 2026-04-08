# TK-695 promote current-surface priority assessment and decomposition into formal ADRs and registries

- Status: completed
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-072-current-surface-priority-promotion-and-decomposition`
- Sprint: `sprint-001-promotion-and-formal-followup-decomposition`

## 1. 任务目标

将 current-surface priority assessment 与 decomposition 的 approved scope 正式提升到 `runtime.governance-clients`，并同步 lifecycle / delivery / module registry / manifest。

## 2. Depends On

1. `TK-694`
2. `.repo-ai-governor/context/dev/project-070-host-plugin-skill-agent-triad-sync/plan.md`

## 3. 预期产物

1. 更新后的 `runtime.governance-clients` formal ADRs / module overview
2. 同步后的 lifecycle / delivery / module registry / manifest
3. resolved promotion review

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
2. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
3. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-051-priority-roadmap-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/review/resolved_code_review_tk-586-588-priority-roadmap-promotion-and-decomposition.md`
2. `.repo-ai-governor/context/dev/project-071-draft-refresh-against-formal-triad/project-071-draft-refresh-against-formal-triad-completion-audit-summary.md`

## 6. 实施计划

1. 更新 `adopter-productization-priority-and-surface-sequencing` ADR，并新增 baseline/decomposition ADR。
2. 把 solution `v2` 接到 lifecycle / delivery / module registry / manifest。
3. 产出 resolved review，确保 promotion evidence 与 final paths 对齐。

## 7. Development Verification

1. formal-doc path and registry cross-check
2. planned delivery handoff visibility check

## 8. Delivery Verification

1. `node ./scripts/governance/check-technical-solution-lifecycle-registry.js`
2. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
3. `node ./scripts/governance/check-technical-solution-module-graph.js`
4. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`

## 9. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `planned`。
2. 2026-04-08：已完成 current-surface priority ADR updates、module overview 更新、lifecycle/delivery/module registry/manifest 接线，并形成 resolved promotion review。

## 10. 产出

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adopter-productization-priority-and-surface-sequencing.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/current-surface-baseline-classification-and-followup-decomposition.md`
3. `.repo-ai-governor/context/dev/project-072-current-surface-priority-promotion-and-decomposition/sprint-001-promotion-and-formal-followup-decomposition/review/resolved_code_review_tk-694-696-current-surface-priority-promotion-and-decomposition.md`
