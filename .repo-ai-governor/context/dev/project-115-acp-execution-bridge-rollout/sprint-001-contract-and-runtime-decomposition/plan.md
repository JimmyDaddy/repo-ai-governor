# sprint-001-contract-and-runtime-decomposition 计划

- Status: planned
- Date: 2026-04-20
- Sprint Goal: 完成 ACP execution bridge 的 contract gap 收敛、runtime owner 拆分与 shared invocation model 基线
- Project: `project-115-acp-execution-bridge-rollout`
- Upstream:
  - `.repo-ai-governor/draft/acp-execution-bridge-and-invoke-stream-confirm-cutover-technical-solution.md`
  - `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-003-phase-f-secure-authoring-and-user-settings/review/approved_solution_review_acp-execution-bridge-and-invoke-stream-confirm-cutover.md`

## 1. Scope

1. 冻结 ACP execution cutover 的 formal runtime ownership、shared invocation state 与 confirmation mapping 边界。
2. 明确 CliAcpTransportClientRuntime 与 sidecar substrate 的职责分离，并补齐 contract/additive fields 决策。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-989 | freeze acp execution bridge runtime contract boundary | scaffold baseline | planned |
| TK-990 | decompose transport client session turn and host-operation runtimes | TK-989 | planned |
| TK-991 | prepare sprint-001 handoff and activation recommendation | TK-990 | planned |

## 3. Exit Criteria

1. project/sprint plan 已按标准模板落盘。
2. canonical TK/CR task cards、checklist、tasks.csv 与 review scaffold 已创建。
3. 正式执行前的 task-ledger canonicalization 命令已明确。

## 4. Sprint Notes

1. bootstrap 阶段不预生成 code_review 生命周期文件。
2. 若用户只要求拆解，不自动修改 current-context.md。
3. 默认将该 sprint 作为首个 activation candidate，但只有在用户显式要求时才切为 active。
