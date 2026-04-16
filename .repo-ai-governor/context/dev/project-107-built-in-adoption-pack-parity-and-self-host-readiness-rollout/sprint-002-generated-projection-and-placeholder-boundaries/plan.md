# sprint-002-generated-projection-and-placeholder-boundaries 计划

- Status: completed
- Date: 2026-04-15
- Sprint Goal: 将 `packages/standards` built-in pack source catalog、projection assembly 与 adopter-owned placeholder/template boundary materialize 为首批实现面。
- Project: `project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout`
- Upstream:
  - `.repo-ai-governor/context/dev/project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout/plan.md`
  - `.repo-ai-governor/context/dev/project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout/sprint-001-parity-catalog-and-readiness-foundation/plan.md`

## 1. Scope

1. 将 sprint-001 冻结出的 source catalog shape materialize 到 `packages/standards` 的 built-in pack assembly seam。
2. 将 `current-context.md`、`normative-loading-manifest.yaml` 一类 starter-instance surface 以 `structured_template_projection` 收口，并明确 adopter-owned placeholder/template boundary。
3. 在 standards-side parity coverage 稳定后，通过 exit acceptance 把 runtime-facing inputs 压缩成 `sprint-003` 的首跳 handoff。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-894 | build built-in pack source catalog and generated assembly baseline | TK-891 | completed |
| TK-895 | implement structured template projection and adopter-owned placeholder boundaries | TK-894、TK-892 | completed |
| TK-896 | close sprint-002 standards parity coverage and sprint-003 handoff readiness | TK-894、TK-895、TK-893 | completed |
| TK-910 | finalize sprint-002 closeout and activate sprint-003 | CR-001 | completed |

## 3. Exit Criteria

1. `TK-894 ~ TK-896` 的 canonical task cards、checklist 与 `tasks.csv` 已保持 planned 同步，且 `Required Inputs` 保持 lightweight entry 边界。
2. `packages/standards` 侧的 source catalog / projection / placeholder implementation seam 已被明确拆成可执行任务，而不是继续停留在 project-level wording。
3. `sprint-003` 的 runtime integration 入口已经通过 `TK-896` 预冻结为单跳 handoff，不需要在激活窗口重新解释 scope。

## 4. Sprint Notes

1. 本 sprint 已在 sprint-001 closeout 同窗登记到 `current-context` 的 primary stream 槽位；当前已由 `TK-894` 正式开工，因此 sprint plan 切换为 `active`，并按 `TK-894 -> TK-895 -> TK-896` 顺序推进，再进入 delegated sprint CR loop。
2. review surface 仅保留 `.gitkeep`，正式 `code_review_*` 生命周期文件待真实 execution 激活后再创建。
3. 当前激活窗口继续遵循 task-card 语义主源，按状态切换执行 `node ./scripts/governance/sync-task-ledger.js` 回写 canonical sqlite 与派生视图。
4. `sprint-003` 虽已 scaffold，但仍不能跳过 `sprint-002` 直接启动，因为 runtime integration 依赖 standards-side source model 与 placeholder boundary 先稳定。
5. `TK-894 ~ TK-896`、`CR-001` 与 `TK-910` 已全部完成；sprint-002 已移入 completed history，`sprint-003` 已切换为下一条 primary stream。
