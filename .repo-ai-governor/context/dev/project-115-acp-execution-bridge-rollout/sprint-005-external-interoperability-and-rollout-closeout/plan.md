# sprint-005-external-interoperability-and-rollout-closeout 计划

- Status: active
- Date: 2026-04-20
- Sprint Goal: 完成外部 ACP interoperability rehearsal、support 边界复核与 rollout closeout
- Project: `project-115-acp-execution-bridge-rollout`
- Upstream:
  - `.repo-ai-governor/draft/acp-execution-bridge-and-invoke-stream-confirm-cutover-technical-solution.md`
  - `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-003-phase-f-secure-authoring-and-user-settings/review/approved_solution_review_acp-execution-bridge-and-invoke-stream-confirm-cutover.md`

## 1. Scope

1. 以 Paseo 等外部 ACP consumer 作为 optional interoperability rehearsal surface。
2. 复核 support wording uplift 条件，完成 rollout closeout 与后续建议。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-1001 | run optional external acp interoperability rehearsal | sprint-004-clean-room-execution-and-packaged-evidence planned handoff | in_progress |
| TK-1002 | review support wording uplift and rollout claim boundary | TK-1001 | planned |
| TK-1003 | close rollout project and publish completion audit | TK-1002 | planned |

## 3. Exit Criteria

1. project/sprint plan 已按标准模板落盘。
2. canonical TK/CR task cards、checklist、tasks.csv 与 review scaffold 已创建。
3. 正式执行前的 task-ledger canonicalization 命令已明确。

## 4. Sprint Notes

1. bootstrap 阶段不预生成 code_review 生命周期文件。
2. 若用户只要求拆解，不自动修改 current-context.md。
3. 该 sprint 默认保持 planned，等待 sprint-004-clean-room-execution-and-packaged-evidence handoff 或用户显式激活。
4. `2026-04-20`：`TK-1021` 完成 sprint-004 closeout gate 与 activation write-back 后，本 sprint 被切换为新的 primary execution surface，`TK-1001` 成为当前 in-progress boundary。
