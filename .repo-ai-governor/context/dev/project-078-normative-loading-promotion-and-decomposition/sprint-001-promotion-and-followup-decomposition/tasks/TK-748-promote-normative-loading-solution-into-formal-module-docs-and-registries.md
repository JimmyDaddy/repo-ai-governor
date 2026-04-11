# TK-748 promote normative-loading solution into formal module docs and registries

- Status: completed
- Date: 2026-04-11
- Owner: AI-Agent
- Priority: P0
- Project: `project-078-normative-loading-promotion-and-decomposition`
- Sprint: `sprint-001-promotion-and-followup-decomposition`

## 1. 任务目标

将 approved normative-loading draft 正式提升为 `governance.normative-loading` 的 active lifecycle-managed solution，并完成 formal docs、lifecycle、delivery、module registry 与 manifest 接线。

## 2. Depends On

1. `TK-747`

## 3. 预期产物

1. `governance.normative-loading` module overview
2. normative-loading lifecycle contract 与 bootstrap-truth ADR
3. lifecycle / delivery / module registry / manifest sync

## 4. Required Inputs

1. `.repo-ai-governor/draft/normative-loading-manifest-lifecycle-compaction-and-staged-sharding-technical-solution.md`
2. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-005-regression-migration-cleanup-and-project-closeout/review/approved_solution_review_normative-loading-manifest-lifecycle-compaction-and-staged-sharding.md`
3. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
4. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-024-gate-execution-efficiency-technical-solution-promotion/plan.md`
2. `.repo-ai-governor/context/dev/project-075-transport-selection-authority-promotion-and-decomposition/plan.md`

## 6. 实施计划

1. 选择 `governance.normative-loading` 作为 formal landing，并把 current approved scope 收敛成新的 formal module docs。
2. 将 solution lifecycle 从 `approved` 推进到 `active`，写入 `final_paths`、`target_module_ids` 与 planned delivery ownership。
3. 同步 module registry、normative-loading manifest 与 promotion review evidence。

## 7. Development Verification

1. `node ./scripts/governance/sync-task-ledger.js --tasks-dir .repo-ai-governor/context/dev/project-078-normative-loading-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks --task-id TK-748 --execution-id exec-20260411-748-promotion --result "formal docs、lifecycle、delivery、module registry 与 manifest promotion cutover 已完成" --verify "node ./scripts/governance/check-technical-solution-lifecycle-registry.js; node ./scripts/governance/check-technical-solution-delivery-registry.js; node ./scripts/governance/check-technical-solution-module-graph.js; node ./scripts/governance/check-normative-loading-manifest.js --mode block" --review-delta "governance.normative-loading formal landing activated" --checklist-note "2026-04-11：已完成 governance.normative-loading formal docs 与 lifecycle/module/delivery/manifest promotion cutover。"`
2. `node ./scripts/governance/check-docs-triad-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `node ./scripts/governance/check-artifact-registry-lifecycle.js`

## 9. 执行记录

1. 2026-04-11：任务创建，状态初始化为 `completed`。
2. 2026-04-11：已新增 `governance.normative-loading` module overview、lifecycle contract 与 bootstrap-truth ADR。
3. 2026-04-11：已完成 lifecycle registry、delivery registry、module registry 与 normative-loading manifest 的 promotion cutover 同步。

## 10. 产出

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-normative-loading/module-overview.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-normative-loading/contracts/normative-loading-lifecycle-contract.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-normative-loading/adrs/root-bootstrap-truth-and-archive-sidecar-boundary.md`
