# sprint-001-quickstart-contract-and-bootstrap-runtime-baseline 计划

- Status: completed
- Date: 2026-04-15
- Sprint Goal: 冻结 quickstart contract、selector and rerun semantics、bootstrap summary boundary 与 rollout execution plan。
- Project: `project-108-adopter-quickstart-bootstrap-rollout`
- Upstream:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adopter-quickstart-bootstrap-command-and-install-convenience-surface.md`
  - `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/plan.md`

## 1. Scope

1. 冻结 `baseline bootstrap` 与 `installer quickstart` 的分层口径，明确 `check` 继续属于 explicit follow-up audit。
2. 收敛 bootstrap summary、selector resolution、clean rerun 与 drift redirect semantics。
3. 规划 command/runtime、consumer docs 与 clean-room evidence 的 implementation sequencing，不在本 sprint 直接承诺完整 rollout。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-900 | freeze adopter quickstart bootstrap contract and rollout boundary | formal module docs | completed |
| TK-901 | define bootstrap summary selector and rerun semantics baseline | TK-900 | completed |
| TK-902 | plan implementation sequencing and consumer truthfulness follow-up | TK-900、TK-901 | completed |
| TK-911 | finalize sprint-001 closeout and activate sprint-002 | CR-001 | completed |

## 3. Exit Criteria

1. `TK-900 ~ TK-902` 已完成，`CR-001` 已 clean `resolved`，且 canonical task cards、checklist 与 `tasks.csv` 保持同步。
2. `DA-900` 已完成 rollout handoff，`project-108/plan.md` 与 `sprint-002` / `sprint-003` 计划已固化 selector/rerun/docs sequencing baseline。
3. `TK-911` 已完成 sprint-001 closeout write-back，并将 `sprint-002` 切换为新的 primary execution surface。

## 4. Sprint Notes

1. review surface 仅保留 `.gitkeep`，正式 `code_review_*` 生命周期文件待真实 execution 激活后再创建。
2. `sprint-002` / `sprint-003` 已补齐 planned scaffold，但继续保留在 project-level planned queue，不提前切换为 active execution surface。
3. `project-107` clean closeout commit 后，当前 sprint 已于 2026-04-15 正式激活为新的 primary stream。
4. `TK-900` 至 `TK-902` 已在 2026-04-15 完成 quickstart baseline freeze，等待 sprint-001 delegated CR loop 确认当前 boundary clean 后再进入 closeout。
5. 2026-04-15：`CR-001` 已 clean `resolved`；`TK-911` 已完成 sprint-001 closeout 与 sprint-002 activation handoff。
6. 2026-04-15：`sprint-001` 已移入 completed history，`current-context` 已将 `sprint-002` 登记为新的 primary stream，待 `TK-903` 开工后再把 sprint-002 plan 切到 `active`。
