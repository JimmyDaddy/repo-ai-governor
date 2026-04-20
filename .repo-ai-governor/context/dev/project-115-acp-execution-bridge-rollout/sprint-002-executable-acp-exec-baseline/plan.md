# sprint-002-executable-acp-exec-baseline 计划

- Status: planned
- Date: 2026-04-20
- Sprint Goal: 完成 session/new prompt cancel 主链路与 invoke/stream shared turn execution 基线
- Project: `project-115-acp-execution-bridge-rollout`
- Upstream:
  - `.repo-ai-governor/draft/acp-execution-bridge-and-invoke-stream-confirm-cutover-technical-solution.md`
  - `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-003-phase-f-secure-authoring-and-user-settings/review/approved_solution_review_acp-execution-bridge-and-invoke-stream-confirm-cutover.md`

## 1. Scope

1. 打通 session/new、session/prompt、session/cancel 与 invokeStage/streamEvents 共享 turn execution 主链路。
2. 让 acp_exec 结束 probe-only 状态，并通过 fixture-backed contract tests 证明不发生双执行。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-992 | implement executable acp_exec invoke prompt and cancel baseline | sprint-001-contract-and-runtime-decomposition planned handoff | planned |
| TK-993 | land shared invocation store and stream attachment semantics | TK-992 | planned |
| TK-994 | verify fixture-backed acp contract baseline and sprint-002 handoff | TK-993 | planned |

## 3. Exit Criteria

1. project/sprint plan 已按标准模板落盘。
2. canonical TK/CR task cards、checklist、tasks.csv 与 review scaffold 已创建。
3. 正式执行前的 task-ledger canonicalization 命令已明确。

## 4. Sprint Notes

1. bootstrap 阶段不预生成 code_review 生命周期文件。
2. 若用户只要求拆解，不自动修改 current-context.md。
3. 该 sprint 默认保持 planned，等待 sprint-001-contract-and-runtime-decomposition handoff 或用户显式激活。
