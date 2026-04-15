# sprint-001-parity-catalog-and-readiness-foundation 计划

- Status: completed
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
| TK-891 | establish built-in pack parity catalog and source model foundation | formal module docs | completed |
| TK-892 | formalize self-host placeholder readiness applicability and diagnostics integration | TK-891 | completed |
| TK-893 | add first-wave parity tests and docs truthfulness follow-up plan | TK-892 | completed |
| TK-909 | finalize sprint-001 closeout and activate sprint-002 | CR-001 | completed |

## 3. Exit Criteria

1. `TK-891 ~ TK-893`、`CR-001` 与 `TK-909` 的 canonical task cards、checklist 与 `tasks.csv` 已保持同步，且 `Required Inputs` / `Traceback References` 边界满足当前拆解规范。
2. `project-107/plan.md` 已冻结 `sprint-001 -> sprint-003` 的 project-level queue；当前 `sprint-001` 已完成并写入 completed history，`current-context` 已将 `sprint-002` 登记为下一条 primary stream，待 `TK-894` 开工后再把 sprint-002 plan 切到 `active`。
3. `current-context.md`、technical solution delivery registry 与 ledger truth 已回链 `project-107 / sprint-001` 的 closeout 结果，并把 `project-107 / sprint-002` 登记为新的 execution surface。

## 4. Sprint Notes

1. 本 sprint 已按 `TK-891 -> TK-892 -> TK-893 -> delegated sprint CR loop -> TK-909` 顺序完成，并在 clean review 后收口为 `completed`。
2. review surface 已在 sprint `review/` 目录下完成 `CR-001` 的 `resolved` 生命周期收口。
3. 激活窗口的状态切换始终以 task cards 为语义主源，再通过 `node ./scripts/governance/sync-task-ledger.js` 回写 canonical sqlite 与派生视图。
4. `sprint-002` 已在 closeout 同窗写入 `current-context` 的 primary stream 槽位；在 `TK-894` 正式开工前，sprint-002 plan 与 task aggregate 继续保持 `planned`。`sprint-003` 与 `project-108 / sprint-001` 继续保留在 planned follow-up queue。
5. 2026-04-15：`TK-909` 已完成 sprint-001 closeout、completed history write-back、primary stream 切换与 handoff 记录。
