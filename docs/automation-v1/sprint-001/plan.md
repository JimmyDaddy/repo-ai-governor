# Automation V1 Sprint 001 Plan

- Status: active
- Date: 2026-03-16
- Project: `automation-v1`
- Sprint: `sprint-001`

## Goal

交付自动化执行 `v1` 的第一阶段基线：提供受控编排命令、权限门禁和审计留痕，让仓库能以“可自动推进但可随时接管”的方式运行治理流程。

## Baseline

1. 仓库已具备 `init`、`plan`、`check`、`review`、`review-verify`、`report`、`skills`、`upgrade` 命令。
2. 已完成 workflow template、slot runtime、standards package 和首批 adapter/skill 基线。
3. 发布运维主线 `release-ops / sprint-001` 已收口，进入下一阶段能力建设。
4. PRD 中“AI 全自动开发模式”仍有 `run` 编排、权限门禁、审计回退等关键能力缺口。

## In Scope

1. 自动化控制器模型与执行状态机。
2. `run` 命令最小编排能力（串联关键治理阶段）。
3. 权限分级与高风险操作人工确认门禁。
4. 自动化审计日志与恢复检查点。
5. 多 AI（`codex / github-copilot / claude-code`）阶段路由策略。
6. 多 AI 自动化验收脚本与 CI smoke gate。

## Out Of Scope

1. 完整无人值守并发多任务调度。
2. 跨仓库远程编排和集中控制平面。
3. 可视化执行面板。
4. 第二批工具生态适配扩展。

## Task Breakdown

1. Wave A：执行编排主链路
   - `TK-951` 设计自动化控制器模型、执行状态机与阶段路由契约
   - `TK-952` 实现 `run` 命令最小编排能力与路由执行
2. Wave B：安全和可审计性
   - `TK-953` 实现权限分级与高风险人工确认门禁
   - `TK-954` 实现自动化执行审计日志与恢复检查点
   - `TK-955` 构建多 AI 自动化验收脚本与 CI smoke gate

## Multi-AI Stage Split Example

当前 sprint 的验收示例采用以下分工：

1. `solution_review` -> `claude-code`
2. `implementation` -> `codex`
3. `code_review` -> `github-copilot`

## Risks

1. 如果先实现 `run` 但门禁策略不足，可能导致高风险改动自动推进。
2. 如果审计模型不先统一，后续自动化问题定位与回放成本会很高。
3. 如果恢复检查点定义不清，失败后只能全量重跑，影响效率。

## Exit Criteria

1. `run` 命令可在 `assisted` 模式下串联阶段执行并输出结构化结果。
2. 高风险行为可被策略识别并触发确认或阻断。
3. 自动化执行日志可落盘并包含阶段轨迹、门禁判断和结果摘要。
4. `codex / github-copilot / claude-code` 三入口验收链路可在本地和 CI 中复现。
5. sprint 的 checklist、CSV、任务卡和 CR 目录结构保持同步。

## Output Paths

- `docs/automation-v1/index.md`
- `docs/automation-v1/execution-plan.md`
- `docs/automation-v1/sprint-001/index.md`
- `docs/automation-v1/sprint-001/plan.md`
- `docs/automation-v1/sprint-001/automation-controller-model.md`
- `docs/automation-v1/sprint-001/multi-ai-handoff-orchestration-solution.md`
- `docs/automation-v1/sprint-001/tasks/checklist.md`
- `docs/automation-v1/sprint-001/tasks/tasks.csv`
- `docs/automation-v1/sprint-001/tasks/TK-951.md`
- `docs/automation-v1/sprint-001/tasks/TK-952.md`
- `docs/automation-v1/sprint-001/tasks/TK-953.md`
- `docs/automation-v1/sprint-001/tasks/TK-954.md`
- `docs/automation-v1/sprint-001/tasks/TK-955.md`
- `docs/automation-v1/sprint-001/code-review/`
