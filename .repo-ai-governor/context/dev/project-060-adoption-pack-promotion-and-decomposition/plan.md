# project-060-adoption-pack-promotion-and-decomposition 计划

- Status: completed
- Date: 2026-04-09
- Stage Mapping: technical solution approval / promotion / follow-up decomposition
- Phase Mapping: approved review evidence / formal docs cutover / rollout decomposition / project closeout
- Upstream:
  - `.repo-ai-governor/draft/host-skill-distribution-and-discovery-follow-up-technical-solution.md`
  - `.repo-ai-governor/context/dev/project-056-standards-runtime-loader-and-pack-productization/sprint-001-standards-runtime-loader-product-path/review/approved_solution_review_host-skill-distribution-and-discovery-followup.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`

## 1. 目标

1. 将用户已明确批准的 `technical-solution.host-skill-distribution-and-discovery-followup` 从 review evidence 正式提升为 `runtime.governance-clients` 的 lifecycle-managed formal direction。
2. 在 `runtime.governance-clients` 下补齐 installer-layer adoption-pack contract 与 self-host template bootstrap ADR，并同步 lifecycle / delivery / module registry / manifest。
3. 在同一变更窗口内，将 rollout 拆解为可直接规划和后续激活的 `project-061` planned follow-up stream。

## 2. Sprint 细化

## 2.1 sprint-001-promotion-and-followup-decomposition

- Status: completed
- Sprint Goal: 完成 adoption-pack installer technical solution 的 formal promotion cutover，并将实现拆解为 `project-061` planned follow-up stream。
- Task Package: `TK-652`、`TK-653`、`TK-654`、`TK-655`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-652 | sprint-001 | activate project-060 and freeze adoption-pack promotion scope | governance/bootstrap | approved solution review + registries | completed |
| TK-653 | sprint-001 | promote adoption-pack installer follow-up into formal module docs and registries | docs/promotion-cutover | TK-652 | completed |
| TK-654 | sprint-001 | decompose adoption-pack installer rollout into planned project-061 and activation handoff | planning/followup-decomposition | TK-653 | completed |
| TK-655 | sprint-001 | finalize project-060 closeout and register the new planned follow-up stream | closeout/final-audit | TK-654 | completed |

## 4. 依赖产物策略

1. 本项目是 docs-only promotion / decomposition stream，不宣称 `adopt` installer、managed ownership、self-host bootstrap 或 clean-room rehearsal 已在代码面交付。
2. 正式化沿用既有 `runtime.governance-clients` module，不新增并行 module。
3. `project-061` 只登记为 planned follow-up stream，不在本项目窗口内抢跑实现。

## 5. DoD（project-060）

1. `technical-solution.host-skill-distribution-and-discovery-followup` 已进入 `active` lifecycle-managed solution。
2. `runtime.governance-clients` 已补齐 adoption-pack installer contract / ADR，并与 host distribution lower-level boundary 明确分层。
3. delivery handoff 已切换到真实 planned follow-up stream `project-061-adoption-pack-installer-and-self-host-bootstrap-rollout`。
4. current-context、completed history、task ledger、review artifact 与 artifact registry 已同步。
5. lifecycle / delivery / module-graph / manifest / docs-triad / ledger / review / artifact gates 全部通过。

## 6. 里程碑记录

1. 2026-04-09：用户要求“approved 然后提升这个技术方案，最后进行任务拆分”，因此创建 `project-060` 承接 adoption-pack installer follow-up promotion。
2. 2026-04-09：完成 `technical-solution.host-skill-distribution-and-discovery-followup` 的 approval write-back，并将其正式提升到 `runtime.governance-clients` lifecycle-managed module docs。
3. 2026-04-09：完成 `project-061` planned follow-up stream 拆解，并将其登记到 `current-context.md` 的 `Planned Follow-Up Streams`。
4. 2026-04-09：项目完成态审计摘要已记录为 `project-060-adoption-pack-promotion-and-decomposition-completion-audit-summary.md`。

## 7. 里程碑记录入口

1. [project-060-adoption-pack-promotion-and-decomposition-completion-audit-summary.md](./project-060-adoption-pack-promotion-and-decomposition-completion-audit-summary.md)
