# project-097-cli-exec-runtime-promotion-and-decomposition 计划

- Status: completed
- Date: 2026-04-13
- Stage Mapping: technical solution promotion / follow-up decomposition
- Phase Mapping: runtime.agent-projection formal cutover / lifecycle-delivery synchronization / native cli_exec rollout decomposition
- Upstream:
  - `.repo-ai-governor/draft/cli-exec-runtime-hardening-and-explicit-acp-extension-seam-technical-solution.md`
  - `.repo-ai-governor/context/dev/project-096-cli-exec-runtime-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_cli-exec-runtime-hardening-and-explicit-acp-extension-seam.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/agent-invoke-liveness-and-timeout-governance.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/transport-selection-authority-and-strict-transport-routing.md`

## 1. 目标

1. 将已批准的 `technical-solution.cli-exec-runtime-hardening-and-explicit-acp-extension-seam` 正式提升为 active lifecycle-managed solution。
2. 在 `runtime.agent-projection` formal docs 中收敛 shared native `cli_exec` process runtime、adapter-authored `resolved launch plan`、shared `lifecycle observer` 与 explicit ACP extension seam guardrail。
3. 在同一变更窗口内把实现 follow-up 拆成真实的 planned rollout stream `project-098-cli-exec-runtime-rollout`。

## 2. Sprint 细化

## 2.1 sprint-001-promotion-and-followup-decomposition

- Status: completed
- Sprint Goal: 完成 cli-exec runtime solution 的 promotion cutover，并将后续实现拆解为 `project-098` planned follow-up stream。
- Task Package: `TK-817`、`TK-818`、`TK-819`、`TK-820`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-817 | sprint-001 | activate project-097 and freeze cli-exec runtime promotion scope | governance/bootstrap | approved review + registries | completed |
| TK-818 | sprint-001 | promote cli-exec runtime solution into formal module docs and registries | docs/promotion-cutover | TK-817 | completed |
| TK-819 | sprint-001 | decompose cli-exec runtime rollout into planned project-098 and activation handoff | planning/followup-decomposition | TK-818 | completed |
| TK-820 | sprint-001 | finalize project-097 closeout and register planned rollout ownership | closeout/final-audit | TK-819 | completed |

## 4. 依赖产物策略

1. 本项目是 docs-only promotion / decomposition stream，不宣称 shared runtime、adapter cutover、Windows/Unix process-tree hardening 或 ACP protocol layer 已在同窗全部交付。
2. formal landing 只更新既有 `runtime.agent-projection` module docs；本轮不新建平行 module，也不把 `.repo-ai-governor/draft/**` 变成 formal truth。
3. `adapter-health-and-route-probe-contract` 与 `agent-invoke-liveness-contract` 只记录 additive / optional truth，不新增 minimum fields，也不在本轮引入新的 canonical transport value。
4. delivery mode 固定为 `followup_required`；promotion 完成后必须落地真实的 planned rollout project，而不是只在 approved review 中留下抽象 TODO。

## 5. DoD（project-097）

1. `technical-solution.cli-exec-runtime-hardening-and-explicit-acp-extension-seam` 已进入 active lifecycle，并写入 `final_paths`。
2. `runtime.agent-projection` formal docs 已同步 native `cli_exec` process runtime、adapter-owned launch authoring、shared lifecycle observer 与 explicit ACP seam guardrail。
3. delivery registry 已指向真实 planned follow-up stream `project-098-cli-exec-runtime-rollout`。
4. review、task ledger、current-context、completed history 与 artifact registry 已同步。
5. lifecycle / delivery / module-graph / manifest / docs-triad / ledger / review / artifact gates 全部通过。

## 6. 里程碑记录

1. 2026-04-13：approved review 已存在，用户随后继续要求把该 solution 正式 promotion，并承接 follow-up decomposition。
2. 2026-04-13：创建 `project-097 / sprint-001`，正式承接 cli-exec runtime solution promotion 与 follow-up decomposition。
3. 2026-04-13：完成 `TK-817 ~ TK-820`，formal docs、lifecycle / delivery / manifest 与 planned `project-098` 已同步落地。
4. 2026-04-13：项目完成态审计摘要已记录为 `project-097-cli-exec-runtime-promotion-and-decomposition-completion-audit-summary.md`。

## 7. 里程碑记录入口

1. [project-097-cli-exec-runtime-promotion-and-decomposition-completion-audit-summary.md](./project-097-cli-exec-runtime-promotion-and-decomposition-completion-audit-summary.md)
