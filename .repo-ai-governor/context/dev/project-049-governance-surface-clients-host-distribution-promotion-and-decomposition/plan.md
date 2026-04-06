# project-049-governance-surface-clients-host-distribution-promotion-and-decomposition 计划

- Status: completed
- Date: 2026-04-06
- Stage Mapping: technical solution promotion / follow-up decomposition
- Phase Mapping: v2 module refinement / registry-manifest synchronization / host distribution rollout decomposition
- Upstream:
  - `.repo-ai-governor/draft/codex-claude-code-and-github-copilot-host-native-packaging-technical-solution.md`
  - `.repo-ai-governor/context/dev/project-048-governance-surface-clients-rollout/sprint-004-automation-queue-and-multi-workspace-governance/review/resolved_code_review_codex-claude-code-and-github-copilot-host-native-packaging-solution.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`

## 1. 目标

1. 将用户已确认并已完成 review 收口的 host-native packaging draft 正式提升为 `technical-solution.governance-surface-clients` 的 `v2` refinement。
2. 在 `runtime.governance-clients` 下补齐 host distribution contract 与 ADR，并同步 lifecycle / delivery / module registry / manifest。
3. 在同一变更窗口内，把 follow-up rollout 拆解为可直接激活的 `project-050` planned stream。

## 2. Sprint 细化

## 2.1 sprint-001-promotion-and-followup-decomposition

- Status: completed
- Sprint Goal: 完成 governance surface clients host distribution refinement 的 promotion cutover，并把实现拆解为 `project-050` planned follow-up stream。
- Task Package: `TK-571`、`TK-572`、`TK-573`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-571 | sprint-001 | activate project-049 and freeze governance surface clients host distribution promotion scope | governance/bootstrap | approved draft + registries | completed |
| TK-572 | sprint-001 | promote governance surface clients host distribution refinement into formal module docs and registries | docs/promotion-cutover | TK-571 | completed |
| TK-573 | sprint-001 | decompose governance surface clients host distribution rollout into planned project-050 and activation handoff | planning/followup-decomposition | TK-572 | completed |

## 4. 依赖产物策略

1. 本项目是 docs-only promotion / decomposition stream，不宣称 host renderer、bundle packager 或 MCP bridge 已在代码面交付。
2. 正式化沿用既有 `runtime.governance-clients` module，不新增并行 module。
3. `project-050` 只登记为 planned follow-up stream，不在本项目窗口内抢跑实现。

## 5. DoD（project-049）

1. `technical-solution.governance-surface-clients` 已升级为 `v2` active lifecycle。
2. `runtime.governance-clients` 的 host distribution contract / ADR 已落地并接入 module registry 与 manifest。
3. delivery handoff 已切换到真实 planned follow-up stream `project-050-governance-surface-clients-host-distribution-rollout`。
4. current-context、completed history、task ledger、review artifact 与 artifact registry 已同步。
5. lifecycle / delivery / module-graph / manifest / docs-triad / ledger / review / artifact gates 全部通过。

## 6. 里程碑记录

1. 2026-04-06：用户要求“帮我提升这个技术方案，然后拆解对应的任务”，因此创建 `project-049` 承接 host distribution refinement promotion。
2. 2026-04-06：完成 `technical-solution.governance-surface-clients` 的 `v2` cutover，并将 host-native distribution boundary 正式写入 `runtime-governance-clients` module docs。
3. 2026-04-06：完成 `project-050` planned follow-up stream 拆解，并将其登记到 `current-context.md` 的 `Planned Follow-Up Streams`。
4. 2026-04-06：项目完成态审计摘要已记录为 `project-049-governance-surface-clients-host-distribution-promotion-and-decomposition-completion-audit-summary.md`。

## 7. 里程碑记录入口

1. [project-049-governance-surface-clients-host-distribution-promotion-and-decomposition-completion-audit-summary.md](./project-049-governance-surface-clients-host-distribution-promotion-and-decomposition-completion-audit-summary.md)
