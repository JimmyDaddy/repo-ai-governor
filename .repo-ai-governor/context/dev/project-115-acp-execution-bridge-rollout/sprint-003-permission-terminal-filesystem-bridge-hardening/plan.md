# sprint-003-permission-terminal-filesystem-bridge-hardening 计划

- Status: planned
- Date: 2026-04-20
- Sprint Goal: 完成 permission terminal filesystem bridge hardening 与 capability-gated fail-closed 语义
- Project: `project-115-acp-execution-bridge-rollout`
- Upstream:
  - `.repo-ai-governor/draft/acp-execution-bridge-and-invoke-stream-confirm-cutover-technical-solution.md`
  - `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-003-phase-f-secure-authoring-and-user-settings/review/approved_solution_review_acp-execution-bridge-and-invoke-stream-confirm-cutover.md`

## 1. Scope

1. 打通 session/request_permission、terminal/* 与 fs/* bridge，并固化 capability-gated fail-closed 语义。
2. 收敛 permission reject、terminal timeout、filesystem capability missing 等 failure-path 行为。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-995 | implement permission bridge and active tool-call confirmation mapping | sprint-002-executable-acp-exec-baseline planned handoff | planned |
| TK-996 | implement terminal and filesystem bridge runtime hardening | TK-995 | planned |
| TK-997 | verify failure-path matrix and sprint-003 handoff | TK-996 | planned |

## 3. Exit Criteria

1. project/sprint plan 已按标准模板落盘。
2. canonical TK/CR task cards、checklist、tasks.csv 与 review scaffold 已创建。
3. 正式执行前的 task-ledger canonicalization 命令已明确。

## 4. Sprint Notes

1. bootstrap 阶段不预生成 code_review 生命周期文件。
2. 若用户只要求拆解，不自动修改 current-context.md。
3. 该 sprint 默认保持 planned，等待 sprint-002-executable-acp-exec-baseline handoff 或用户显式激活。
