# Governance Engine Runtime

- Date: 2026-03-13
- Task: `TK-202`
- Status: done

## Goal

为后续 `plan`、`check`、`review` 命令提供一个可复用的最小执行器，把流程模板从静态模型推进到可执行的串行阶段状态机。

## Delivered

1. 新增 `src/workflow/governance-engine.js`，提供：
   - `executeWorkflow`
   - `selectWorkflowStages`
   - `getWorkflowStageResult`
   - 阶段/执行结果状态常量
2. 执行器当前支持：
   - 基于完整 template 或 `workflowConfig` 解析执行模板
   - 按依赖关系扩展目标阶段选择
   - 串行执行阶段 handler
   - 统一 `passed / failed / skipped / blocked` 阶段结果
   - 失败后阻断后续阶段
   - 聚合阶段输出到统一 `artifacts`
3. 新增 `test/workflow/governance-engine.test.js`，覆盖：
   - 阶段选择与依赖展开
   - 串行执行和输出聚合
   - 阶段失败后的阻断行为
   - 基于 `workflowConfig` 的模板解析与 optional stage 行为

## Runtime Contract

1. Stage handler 可以按 `stage.id`、`stage.executor.ref` 或 `stage.executor.command` 注册。
2. Handler 输入包含：
   - 当前 `stage`
   - 选中阶段列表 `selectedStageIds`
   - 依赖结果 `dependencyResults`
   - 之前阶段结果 `previousResults`
   - 共享 `state`
   - 已聚合 `artifacts`
   - 调用元信息 `metadata`
3. Handler 输出可包含：
   - `status`
   - `summary`
   - `details`
   - `outputs`
   - `gates`
   - `warnings`

## Follow-up

1. `TK-205` 将直接复用 `executeWorkflow` 驱动 `plan -> breakdown`。
2. `TK-206` 将复用同一结果模型输出阶段检查汇总。
3. `TK-207`、`TK-208` 可以沿用当前 `review`、`review-verify` 阶段语义接入。
