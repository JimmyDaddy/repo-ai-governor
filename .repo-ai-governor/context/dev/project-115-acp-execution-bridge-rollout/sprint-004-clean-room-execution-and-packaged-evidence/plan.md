# sprint-004-clean-room-execution-and-packaged-evidence 计划

- Status: completed
- Date: 2026-04-20
- Sprint Goal: 完成 source-checkout packaged clean-room execution evidence 与 failure-path 验证
- Project: `project-115-acp-execution-bridge-rollout`
- Upstream:
  - `.repo-ai-governor/draft/acp-execution-bridge-and-invoke-stream-confirm-cutover-technical-solution.md`
  - `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-003-phase-f-secure-authoring-and-user-settings/review/approved_solution_review_acp-execution-bridge-and-invoke-stream-confirm-cutover.md`

## 1. Scope

1. 补齐 source-checkout 与 packaged distribution 场景下的 ACP execution clean-room evidence。
2. 覆盖 cancel、terminal cleanup、session reuse degrade 等关键 execution 验证切片。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-998 | build source-checkout acp execution clean-room slice | sprint-003-permission-terminal-filesystem-bridge-hardening planned handoff | completed |
| TK-999 | land packaged distribution and runtime-service execution evidence | TK-998 | completed |
| TK-1000 | prepare sprint-004 closeout and support-truth readiness recommendation | TK-999 | completed |
| TK-1021 | close sprint-004 boundary and activate sprint-005 execution surface | CR-001 reviewer-clean handoff | completed |

## 3. Exit Criteria

1. project/sprint plan 已按标准模板落盘。
2. canonical TK/CR task cards、checklist、tasks.csv 与 review scaffold 已创建。
3. 正式执行前的 task-ledger canonicalization 命令已明确。

## 4. Sprint Notes

1. bootstrap 阶段不预生成 code_review 生命周期文件。
2. 若用户只要求拆解，不自动修改 current-context.md。
3. `2026-04-20`：`CR-001` 确认 sprint-003 reviewer-clean 后，本 sprint 被激活为新的 primary execution surface；`TK-998` 成为当前 in-progress execution boundary。
4. `2026-04-20`：`TK-998 / TK-999 / TK-1000` 已完成 sprint-004 implementation boundary，形成 source-checkout + packaged-distribution/runtime-service clean-room evidence、support-truth readiness recommendation 与 sprint-005 activation handoff；下一步进入 fresh delegated CR round。
5. `2026-04-20`：`CR-001` 已 resolved，当前 sprint 立即创建 `TK-1021` 作为 closeout surface，避免 implementation/review 全终态后继续悬挂为无 closeout task 的 active sprint。
6. `2026-04-20`：`TK-1021` 已完成 boundary gate 与 activation write-back，当前 sprint 正式收口为 `completed`；下一条 primary execution surface 已切换到 `sprint-005-external-interoperability-and-rollout-closeout`。
