# sprint-001-contract-and-runtime-decomposition 计划

- Status: completed
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
| TK-989 | freeze acp execution bridge runtime contract boundary | scaffold baseline | completed |
| TK-990 | decompose transport client session turn and host-operation runtimes | TK-989 | completed |
| TK-991 | prepare sprint-001 handoff and activation recommendation | TK-990 | completed |

## 3. Exit Criteria

1. project/sprint plan 已按标准模板落盘。
2. canonical TK/CR task cards、checklist、tasks.csv 与 review scaffold 已创建。
3. 正式执行前的 task-ledger canonicalization 命令已明确。

## 4. Sprint Notes

1. bootstrap 阶段不预生成 code_review 生命周期文件。
2. `2026-04-20`：按单分支串行执行方案正式激活为当前 primary execution surface。
3. sprint closeout 前，`project-116` 继续保持 planned follow-up，不提前切换 execution surface。
4. `2026-04-20`：ACP host protocol 已拆分为 capability-discovery、transport-client、session、prompt-turn 与 host-operation owners，并引入 transport-scoped shared invocation state；当前行为继续保持 fail-closed，不把 `acp_exec` 伪装为 `cli_exec`。
5. `2026-04-20`：本 sprint implementation baseline 已通过 `pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/cli-acp-session-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`。
6. `2026-04-20`：`CR-001` 已完成 accepted finding 修复与复验，sprint-001 作为 completed stream 移入 history；下一条 primary execution surface 已切到 `sprint-002-executable-acp-exec-baseline`。
