# sprint-001-parity-catalog-and-readiness-foundation 计划

- Status: planned
- Date: 2026-04-15
- Sprint Goal: 冻结 built-in adoption pack parity inventory、source catalog shape、self-host readiness applicability 与 first-wave verification strategy。
- Project: `project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout`
- Upstream:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/built-in-adoption-pack-parity-and-self-host-readiness-sync.md`
  - `.repo-ai-governor/context/dev/project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout/plan.md`

## 1. Scope

1. 冻结 built-in adoption pack `exact_sync / generated_projection / template_seed / adopter_owned_placeholder` 的首批 surface inventory 与 source catalog shape。
2. 明确 self-host placeholder readiness 的适用域、结果分组、输出面与 diagnostics / verify / execution preflight integration boundary。
3. 规划 first-wave parity tests、consumer docs truthfulness 与后续 sprint activation recommendation，不在本 sprint 直接承诺完整 rollout。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-891 | establish built-in pack parity catalog and source model foundation | formal module docs | planned |
| TK-892 | formalize self-host placeholder readiness applicability and diagnostics integration | TK-891 | planned |
| TK-893 | add first-wave parity tests and docs truthfulness follow-up plan | TK-892 | planned |

## 3. Exit Criteria

1. `TK-891 ~ TK-893` 的 canonical task cards、checklist 与 `tasks.csv` 已保持 planned 同步，且 `Required Inputs` / `Traceback References` 边界满足当前拆解规范。
2. `project-107/plan.md` 已冻结 `sprint-001 -> sprint-003` 的 project-level queue，且 `sprint-001 ~ sprint-003` 的 planned scaffold 已就位；当前 `current-context` 仍只把 `sprint-001` 作为默认 planned follow-up stream。
3. `current-context.md -> Planned Follow-Up Streams` 与 delivery registry 已稳定回链 `project-107 / sprint-001`，且本轮不切换 active primary stream。

## 4. Sprint Notes

1. 本 sprint 当前只创建 planned skeleton，不切换当前 primary stream。
2. review surface 仅保留 `.gitkeep`，正式 `code_review_*` 生命周期文件待真实 execution 激活后再创建。
3. 若后续窗口直接激活本 sprint，先执行 `node ./scripts/governance/sync-task-ledger.js --tasks-dir "<tasks-dir>"` 完成 canonical sqlite 对齐。
4. `sprint-002` / `sprint-003` 已补齐 planned scaffold 与 task ledger，但继续保留在 project-level planned queue，不提前切换为 active execution surface，避免在 source model 尚未稳定前拆出错误激活顺序。
