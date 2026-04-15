# sprint-003-self-host-readiness-integration-and-consumer-truthfulness 计划

- Status: planned
- Date: 2026-04-15
- Sprint Goal: 将 self-host-only readiness interlock 接入 runtime / diagnostics / verify / execution preflight，并完成首批 consumer docs truthfulness 与 evidence follow-through。
- Project: `project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout`
- Upstream:
  - `.repo-ai-governor/context/dev/project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout/plan.md`
  - `.repo-ai-governor/context/dev/project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout/sprint-002-generated-projection-and-placeholder-boundaries/plan.md`

## 1. Scope

1. 将 self-host-only readiness interlock 接到 `doctor diagnostics`、`adopt verify` 与 execution preflight，且不误伤默认 `adopter-complete` 路径。
2. 补齐 `packages/standards` 与 `apps/cli` 的 applicability-scope tests，并刷新 consumer docs truthfulness evidence。
3. 作为 project-final sprint，补齐 completion audit 与 closeout evidence，给 `project-107` 提供正式收口入口。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-897 | integrate self-host readiness signals into diagnostics verify and execution preflight | TK-896 | planned |
| TK-898 | add readiness applicability tests and refresh consumer docs truthfulness evidence | TK-897 | planned |
| TK-899 | finalize project-107 rollout closeout and completion audit | TK-897、TK-898 | planned |

## 3. Exit Criteria

1. `TK-897 ~ TK-899` 的 canonical task cards、checklist 与 `tasks.csv` 已保持 planned 同步，且 project-final closeout 已提前获得显式承接任务。
2. runtime integration、tests/docs truthfulness 与 completion audit 的 project-final ownership 已拆清，不会在 closeout 时混成单一笼统任务。
3. 本 sprint 被明确标记为 project-final execution surface，但仍保持 planned，直到用户显式要求激活。

## 4. Sprint Notes

1. 本 sprint 当前只创建 planned scaffold，不切换当前 primary stream。
2. review surface 仅保留 `.gitkeep`，正式 `code_review_*` 生命周期文件待真实 execution 激活后再创建。
3. 若后续窗口直接激活本 sprint，先执行 `node ./scripts/governance/sync-task-ledger.js --tasks-dir "<tasks-dir>"` 完成 canonical sqlite 对齐。
4. `TK-899` 只提供 project-final closeout 入口；是否真正把 `project-107` 切到 `completed`，取决于运行窗口是否产出了完整 build/test/docs evidence。
