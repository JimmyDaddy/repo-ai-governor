# sprint-003-self-host-readiness-integration-and-consumer-truthfulness 计划

- Status: completed
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
| TK-897 | integrate self-host readiness signals into diagnostics verify and execution preflight | TK-896 | completed |
| TK-898 | add readiness applicability tests and refresh consumer docs truthfulness evidence | TK-897 | completed |
| TK-899 | finalize project-107 rollout closeout and completion audit | TK-897、TK-898 | completed |

## 3. Exit Criteria

1. `TK-897`、`TK-898`、`TK-899` 最新状态均为 `completed`，且 `CR-001` 至 `CR-005` 最新状态均为 `resolved`。
2. runtime integration、tests/docs truthfulness、project-final CR loop 与 completion audit 已全部通过 canonical task cards、review artifacts、checklist 与 `tasks.csv` 同步到完成态。
3. 本 sprint 已完成 project-final closeout write-back，并在 `current-context` 中迁出 active execution surface。

## 4. Sprint Notes

1. 本 sprint 已在 sprint-002 closeout 后切换为新的 primary stream；`TK-897` 于 2026-04-15 正式开工后，sprint plan 已同步切换为 `active`。
2. review surface 仅保留 `.gitkeep`，正式 `code_review_*` 生命周期文件待真实 execution 激活后再创建。
3. `TK-897` 开工时必须先执行 `node ./scripts/governance/sync-task-ledger.js --tasks-dir "<tasks-dir>"` 完成 canonical sqlite 对齐。
4. `TK-899` 只提供 project-final closeout 入口；是否真正把 `project-107` 切到 `completed`，取决于运行窗口是否产出了完整 build/test/docs evidence。
5. `TK-897` / `TK-898` 已在 2026-04-15 完成，并形成进入 sprint delegated CR round 的当前实现边界。
6. `CR-001` 与 `CR-002` 已于 2026-04-15 clean `resolved`；本 sprint 的 implementation + sprint-level CR boundary 已完成，现阶段继续保留为 project-final review / closeout surface，直到 `TK-899` 收口。
7. `CR-003` / `CR-004` 已完成 accepted finding 修复并 `resolved`，`CR-005` clean `resolved` 后已确认当前 project-final boundary 可进入正式 closeout。
8. `TK-899 / DA-899` 已完成 final closeout write-back；当前 sprint 已恢复为最终 `completed` 真值，并迁出 active execution surface。
