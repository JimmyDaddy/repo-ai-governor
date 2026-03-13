# Workflow Template Model

- Task: `TK-201`
- Date: 2026-03-13
- Status: done

## Goal

为 Governance Engine 和后续 `plan / check / review / review-verify` 命令定义统一的流程模板模型，明确阶段顺序、输入输出和门禁表达方式。

## Model Summary

流程模板 v1 由四层组成：

1. `meta`
   - 提供中英文名称与描述。
2. `execution`
   - 当前 MVP 只支持 `serial`。
   - 统一表达 `allowSkipStages` 和 `stopOnFailure`。
3. `stages`
   - 使用数组顺序表达主执行顺序。
   - 使用 `dependsOn` 明确串行依赖，便于后续执行器和错误定位。
4. `gates`
   - 分成 `enter` 和 `exit` 两类门禁。
   - 支持 `artifacts-exist`、`checks-pass`、`review-status`、`task-record-updated`、`manual-approval`。

## Stage Model

每个阶段至少包含：

1. `id`
2. `name`
3. `executor`

可选能力：

1. `description`
2. `dependsOn`
3. `inputs`
4. `outputs`
5. `gates.enter`
6. `gates.exit`
7. `enabled`
8. `required`
9. `requiresApproval`
10. `onFailure`

## Executor Model

`executor` 用于把阶段和后续执行器绑定起来：

1. `command`
   - 对应 CLI 命令型阶段，例如 `plan`、`check`、`review`、`review-verify`
2. `manual`
   - 对应人工或 agent 主导的开发阶段，例如 `implement`
3. `internal`
   - 对应框架内部动作，例如 `task-record-sync`

## Input / Output Model

`inputs` 与 `outputs` 使用统一引用对象表达，核心字段为：

1. `kind`
2. `ref`
3. `required`
4. `multiple`

当前 v1 覆盖这些引用类型：

1. `context`
2. `config`
3. `artifact`
4. `workspace`
5. `review-record`
6. `check-result`
7. `task-record`

这让流程模板既能引用仓库状态，也能和当前 `docs/<project>/sprint-xxx/` 产物规范对齐。

## Standard Workflow V1

当前内置模板 `standard` 固定为串行七阶段：

1. `plan`
   - 输出 `plan.md`
2. `breakdown`
   - 输出 `tasks/checklist.md`、`tasks/tasks.csv`、`tasks/TK-xxx.md`
3. `implement`
   - 产出工作区变更
4. `self-check`
   - 输出质量门禁结果
5. `review`
   - 输出 `code-review/review_<slug>.md`
6. `review-verify`
   - 输出 `code-review/verified_review_<slug>.md`
7. `task-sync`
   - 回写 `tasks/checklist.md` 和 `tasks/tasks.csv`

## Compatibility Notes

1. 与当前 CLI 保持一致：`plan`、`check`、`review`、`review-verify` 均已作为命令入口保留。
2. 与当前 CR 生命周期保持一致：`review -> verified_review -> resolved_review`。
3. 与当前 sprint 产物规范保持一致：任务回写仍以 checklist 和 CSV 为最终记录面。
4. `governor.yaml` 中的 `workflow.stages` 继续作为模板级覆盖项，而不是重复定义完整模板。

## Code Artifacts

1. `src/config/schema/workflow-template.schema.json`
2. `src/workflow/template-model.js`
3. `test/config/schema.test.js`
4. `test/workflow/template-model.test.js`

## Follow-ups

1. `TK-202` 基于本模型实现最小执行器。
2. `TK-205`、`TK-206`、`TK-207`、`TK-208` 基于 `executor + gates + outputs` 建真实命令执行链。
