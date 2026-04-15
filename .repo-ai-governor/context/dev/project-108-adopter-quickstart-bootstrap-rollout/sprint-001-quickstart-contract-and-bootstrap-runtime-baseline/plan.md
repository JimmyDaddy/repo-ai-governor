# sprint-001-quickstart-contract-and-bootstrap-runtime-baseline 计划

- Status: planned
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
| TK-900 | freeze adopter quickstart bootstrap contract and rollout boundary | formal module docs | planned |
| TK-901 | define bootstrap summary selector and rerun semantics baseline | TK-900 | planned |
| TK-902 | plan implementation sequencing and consumer truthfulness follow-up | TK-900、TK-901 | planned |

## 3. Exit Criteria

1. `TK-900 ~ TK-902` 的 canonical task cards、checklist 与 `tasks.csv` 已保持 planned 同步。
2. `project-108/plan.md` 已冻结 `sprint-001 -> sprint-003` 的 queue，且 `current-context.md -> Planned Follow-Up Streams` 已稳定回链 `project-108 / sprint-001`。
3. 本 sprint 只创建 planned skeleton，不切换当前 idle primary stream。

## 4. Sprint Notes

1. review surface 仅保留 `.gitkeep`，正式 `code_review_*` 生命周期文件待真实 execution 激活后再创建。
2. `sprint-002` / `sprint-003` 已补齐 planned scaffold，但继续保留在 project-level planned queue，不提前切换为 active execution surface。
