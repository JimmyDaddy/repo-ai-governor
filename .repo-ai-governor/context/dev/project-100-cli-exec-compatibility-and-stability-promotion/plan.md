# project-100-cli-exec-compatibility-and-stability-promotion 计划

- Status: completed
- Date: 2026-04-13
- Stage Mapping: technical solution promotion
- Phase Mapping: runtime.agent-projection formal cutover / lifecycle-delivery synchronization / docs-only closeout
- Upstream:
  - `.repo-ai-governor/draft/cli-exec-compatibility-and-stability-productization-technical-solution.md`
  - `.repo-ai-governor/context/dev/project-099-cli-exec-compatibility-and-stability-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_cli-exec-compatibility-and-stability-productization.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-runtime-hardening-and-explicit-acp-extension-seam.md`
  - `.repo-ai-governor/context/dev/project-098-cli-exec-runtime-rollout/project-098-cli-exec-runtime-rollout-completion-audit-summary.md`

## 1. 目标

1. 将已批准的 `technical-solution.cli-exec-compatibility-and-stability-productization` 正式提升为 active lifecycle-managed solution。
2. 在 `runtime.agent-projection` formal docs 中收敛 native `cli_exec` compatibility baseline、`scenario class x required preserved facts` taxonomy 与 focused verification guidance。
3. 在同一 docs-only 窗口完成 lifecycle / delivery / module-registry / manifest / review / artifact / closeout 同步，不新建 follow-up rollout stream。

## 2. Sprint 细化

## 2.1 sprint-001-formalization-and-promotion-cutover

- Status: completed
- Sprint Goal: 完成 cli-exec compatibility/stability solution 的 formal docs、registry/manifest/delivery promotion cutover，并关闭 `project-100`。
- Task Package: `TK-840`、`TK-841`、`TK-842`、`TK-843`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-840 | sprint-001 | activate project-100 and freeze cli-exec compatibility promotion scope | governance/bootstrap | approved review + registries | completed |
| TK-841 | sprint-001 | formalize cli-exec compatibility and stability baseline into runtime.agent-projection docs | docs/formalization | TK-840 | completed |
| TK-842 | sprint-001 | cut over cli-exec compatibility solution lifecycle delivery module-registry and manifest | promotion/governance | TK-841 | completed |
| TK-843 | sprint-001 | finalize project-100 closeout and restore idle context | closeout/final-audit | TK-842 | completed |

## 4. 依赖产物策略

1. 本项目是 docs-only promotion stream，不修改 `apps/**`、`packages/**`、`bin/**` 或 `test/**` 可执行代码。
2. formal landing 只更新既有 `runtime.agent-projection` module docs；本轮不新建平行 module，也不把 `.repo-ai-governor/draft/**` 变成 formal truth。
3. `cli_exec_compatibility_*` profiles 在本轮只被 formalize 为 runtime guidance，不升级为 `governance.execution-gates` 的正式 gate truth。
4. ACP host-facing transport、support matrix wording 与 follow-up rollout decomposition 继续留在独立 solution / stream，不在 `project-100` 隐式扩 scope。

## 5. DoD（project-100）

1. `technical-solution.cli-exec-compatibility-and-stability-productization` 已进入 active lifecycle，并写入完整 `final_paths`。
2. `runtime.agent-projection` formal docs 已同步 native `cli_exec` compatibility baseline、taxonomy 与 focused verification guidance。
3. delivery registry 已写入 `docs_only + internal_governance + not_required` 的最终 ownership。
4. review、task ledger、artifact registry、current-context 与 completed history 已同步。
5. lifecycle / delivery / module-graph / manifest / docs-triad / ledger / review / artifact / worktree gates 全部通过。

## 6. 里程碑记录

1. 2026-04-13：`project-099` 已完成 approved review，当前 solution 已具备直接 promotion 前置条件。
2. 2026-04-13：创建 `project-100 / sprint-001`，正式承接 cli-exec compatibility/stability solution promotion cutover。
3. 2026-04-13：完成 `TK-840 ~ TK-843`，formal docs、lifecycle / delivery / manifest、artifact registry 与 docs-only closeout 已同步落地。
4. 2026-04-13：项目完成态审计摘要已记录为 `project-100-cli-exec-compatibility-and-stability-promotion-completion-audit-summary.md`。

## 7. 里程碑记录入口

1. [project-100-cli-exec-compatibility-and-stability-promotion-completion-audit-summary.md](./project-100-cli-exec-compatibility-and-stability-promotion-completion-audit-summary.md)
