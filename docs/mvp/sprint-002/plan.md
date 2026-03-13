# MVP Sprint 002 Plan

- Status: active
- Date: 2026-03-13

## Goal

在 `mvp` 范围内完成流程编排与规范模型的设计基线，为后续 `plan / check / review / review-verify` 命令实现提供上游结构。

## Baseline

1. `sprint-001` 已完成 CLI 底座、配置 schema、配置加载、`init`、`doctor` 和 project/sprint 产物规范。
2. 当前进入 `sprint-002`，重点从“仓库激活能力”转向“治理流程与规则模型”。

## In Scope

1. 流程模板模型设计。
2. 标准规范包数据模型设计。
3. 声明式插槽 schema 设计。
4. 统一适配器接口设计。

## Out Of Scope

1. `plan`、`check`、`review`、`review-verify` 的真实执行实现。
2. 标准规范包正式内容编写。
3. 具体适配器接入样例与 CI 模板。

## Task Breakdown

1. Wave A：流程与规则核心模型
   - `TK-201` 设计流程模板模型
   - `TK-203` 设计标准规范包数据模型
2. Wave B：扩展点接口基线
   - `TK-301` 设计声明式插槽 schema
   - `TK-401` 设计统一适配器接口

## Risks

1. `TK-201` 和 `TK-203` 如果收口不清，会直接拖慢 `plan`、`check`、`review` 主线实现。
2. `TK-301` 和 `TK-401` 需要与流程模型配套，否则后续接入层容易重复定义字段。

## Exit Criteria

1. 至少完成 `TK-201` 与 `TK-203`，形成后续命令实现所需的核心模型。
2. `TK-301` 与 `TK-401` 至少完成首版草案并与已有 schema / layout 口径对齐。
3. 当前 sprint 的 checklist、CSV 和任务卡保持同步。

## Progress

1. `TK-201` 已完成，产出流程模板 schema、标准串行模板和覆盖解析 helper，为 `TK-202` 提供直接输入。
2. `TK-203` 已完成，产出标准规范包 schema、包级骨架和双视图渲染 helper，为 `TK-204` 与后续命令消费提供统一结构。
3. `TK-301` 已完成，产出增强版 slot schema、来源/类型建模、触发与冲突策略字段，以及插槽优先级 helper，为 `TK-302` 提供直接输入。
4. `TK-401` 已完成，产出增强版 adapter schema、统一输入输出契约和首批三类适配器预设，为 `TK-402`、`TK-403`、`TK-404` 提供统一入口。
