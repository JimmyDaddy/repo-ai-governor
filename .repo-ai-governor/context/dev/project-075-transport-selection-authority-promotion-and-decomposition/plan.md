# project-075-transport-selection-authority-promotion-and-decomposition 计划

- Status: completed
- Date: 2026-04-09
- Stage Mapping: technical solution promotion / follow-up decomposition
- Phase Mapping: runtime.agent-projection formal cutover / lifecycle-delivery synchronization / rollout project decomposition
- Upstream:
  - `.repo-ai-governor/draft/transport-selection-authority-and-strict-routing-follow-up-technical-solution.md`
  - `.repo-ai-governor/context/dev/project-074-transport-selection-authority-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_transport-selection-authority-and-strict-routing-followup.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/remote-api-transport-and-provider-binding-seam.md`

## 1. 目标

1. 将已批准的 `technical-solution.transport-selection-authority-and-strict-routing` 正式提升为 active lifecycle-managed solution。
2. 在 `runtime.agent-projection` formal docs 中收敛 transport selection authority、strict transport routing 与 evidence-gated public wording 边界。
3. 在同一变更窗口内把实现 follow-up 拆成真实的 planned rollout stream `project-076-transport-selection-authority-rollout`。

## 2. Sprint 细化

## 2.1 sprint-001-promotion-and-followup-decomposition

- Status: completed
- Sprint Goal: 完成 transport-selection-authority solution 的 promotion cutover，并将后续实现拆解为 `project-076` planned follow-up stream。
- Task Package: `TK-723`、`TK-724`、`TK-725`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-723 | sprint-001 | activate project-075 and freeze transport-selection-authority promotion scope | governance/bootstrap | approved review + registries | completed |
| TK-724 | sprint-001 | promote transport-selection-authority solution into formal module docs and registries | docs/promotion-cutover | TK-723 | completed |
| TK-725 | sprint-001 | decompose transport-selection-authority rollout into planned project-076 and activation handoff | planning/followup-decomposition | TK-724 | completed |

## 4. 依赖产物策略

1. 本项目是 docs-only promotion / decomposition stream，不宣称 runtime code、CLI flags 或 public docs support wording 已在同窗全部交付。
2. formal landing 只更新既有 `runtime.agent-projection` module docs；本轮不新建平行 module，也不把 `.repo-ai-governor/draft/**` 变成 formal truth。
3. `docs/support-matrix*` 与 `docs/local-adoption-playbook*` 的 wording uplift 仍受 evidence gate 约束，本项目只 formalize 其 gating boundary。
4. delivery mode 固定为 `followup_required`；promotion 完成后必须落地真实的 planned rollout project，而不是只在 review artifact 里留 TODO。

## 5. DoD（project-075）

1. `technical-solution.transport-selection-authority-and-strict-routing` 已进入 active lifecycle，并写入 `final_paths`。
2. `runtime.agent-projection` formal docs 已同步 transport selection authority、strict transport routing 与 onboarding canonical truth。
3. delivery registry 已指向真实 planned follow-up stream `project-076-transport-selection-authority-rollout`。
4. review、task ledger、current-context、completed history 与 artifact registry 已同步。
5. lifecycle / delivery / module-graph / manifest / docs-triad / ledger / review / artifact gates 全部通过。

## 6. 里程碑记录

1. 2026-04-09：用户明确要求对该 approved technical solution 执行 `technical-solution-promotion`。
2. 2026-04-09：创建 `project-075 / sprint-001`，正式承接 transport-selection-authority solution promotion 与 follow-up decomposition。
3. 2026-04-09：完成 `TK-723 ~ TK-725`，formal docs、lifecycle / delivery registry、promotion review 与 planned `project-076` 已同步落地。
4. 2026-04-09：项目完成态审计摘要已记录为 `project-075-transport-selection-authority-promotion-and-decomposition-completion-audit-summary.md`。

## 7. 里程碑记录入口

1. [project-075-transport-selection-authority-promotion-and-decomposition-completion-audit-summary.md](./project-075-transport-selection-authority-promotion-and-decomposition-completion-audit-summary.md)
