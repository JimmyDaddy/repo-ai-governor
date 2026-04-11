# project-078-normative-loading-promotion-and-decomposition 计划

- Status: completed
- Date: 2026-04-11
- Stage Mapping: technical solution promotion / follow-up decomposition
- Phase Mapping: governance.normative-loading formal cutover / lifecycle-delivery synchronization / planned rollout decomposition
- Upstream:
  - `.repo-ai-governor/draft/normative-loading-manifest-lifecycle-compaction-and-staged-sharding-technical-solution.md`
  - `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-005-regression-migration-cleanup-and-project-closeout/review/approved_solution_review_normative-loading-manifest-lifecycle-compaction-and-staged-sharding.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`

## 1. 目标

1. 将已批准的 `technical-solution.normative-loading-manifest-lifecycle-compaction-and-staged-sharding` 正式提升为 active lifecycle-managed solution。
2. 在新的 `governance.normative-loading` formal module 中收敛 root bootstrap truth preservation、archive sidecar boundary 与 deprecated compact contract。
3. 在同一变更窗口内把实现 follow-up 拆解为真实的 planned rollout stream `project-079-normative-loading-lifecycle-compaction-rollout`。

## 2. Sprint 细化

## 2.1 sprint-001-promotion-and-followup-decomposition

- Status: completed
- Sprint Goal: 完成 normative-loading solution 的 formal promotion cutover，并将后续实现拆解为 `project-079` planned follow-up stream。
- Task Package: `TK-747`、`TK-748`、`TK-749`、`TK-750`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-747 | sprint-001 | activate project-078 and freeze normative-loading promotion scope | governance/bootstrap | approved review + registries | completed |
| TK-748 | sprint-001 | promote normative-loading solution into formal module docs and registries | docs/promotion-cutover | TK-747 | completed |
| TK-749 | sprint-001 | decompose normative-loading rollout into planned project-079 and activation handoff | planning/followup-decomposition | TK-748 | completed |
| TK-750 | sprint-001 | finalize project-078 closeout and register planned rollout ownership | closeout/final-audit | TK-749 | completed |

## 4. 依赖产物策略

1. 本项目是 docs-only promotion / decomposition stream，不宣称 archive split、compact script 或 archive-check gate 已在本窗完成实现。
2. formal landing 固定为新模块 `governance.normative-loading`，而不是把 manifest lifecycle 治理挂到现有治理模块的边角。
3. 当前 formal scope 只收敛 `archive split + deprecated compact + root bootstrap truth preservation`，不把 active sharding、`manifest_refs` 或 sqlite projection 混入同窗。
4. `project-079` 只登记为 planned follow-up stream，不在本项目窗口内直接切换为 active implementation stream。

## 5. DoD（project-078）

1. `technical-solution.normative-loading-manifest-lifecycle-compaction-and-staged-sharding` 已进入 active lifecycle，并写入 `final_paths`。
2. `governance.normative-loading` formal docs 已固定 root bootstrap truth、archive sidecar 与 deprecated compact contract。
3. delivery registry 已指向真实 planned follow-up stream `project-079-normative-loading-lifecycle-compaction-rollout`。
4. review、task ledger、current-context、completed history 与 artifact registry 已同步。
5. lifecycle / delivery / module-graph / manifest / docs-triad / ledger / review / artifact gates 全部通过。

## 6. 里程碑记录

1. 2026-04-11：用户明确要求执行 `technical-solution-promotion`，并在 promotion 后继续做任务拆解。
2. 2026-04-11：创建 `project-078 / sprint-001`，正式承接 normative-loading solution promotion 与 follow-up decomposition。
3. 2026-04-11：完成 `TK-747 ~ TK-750`，formal docs、lifecycle / delivery / module registry / manifest、promotion review 与 planned `project-079` 已同步落地。
4. 2026-04-11：项目完成态审计摘要已记录为 `project-078-normative-loading-promotion-and-decomposition-completion-audit-summary.md`。

## 7. 里程碑记录入口

1. [project-078-normative-loading-promotion-and-decomposition-completion-audit-summary.md](./project-078-normative-loading-promotion-and-decomposition-completion-audit-summary.md)
