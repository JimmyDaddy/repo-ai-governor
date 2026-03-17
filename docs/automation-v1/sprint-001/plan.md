# Automation V1 Sprint 001 Plan

- Status: active
- Date: 2026-03-17
- Project: `automation-v1`
- Sprint: `sprint-001`

## Goal

交付自动化执行 `v1` 的第一阶段基线：提供受控编排命令、权限门禁和审计留痕，并让流程既可用默认模板也可按项目自定义编排。

## Baseline

1. 仓库已具备 `init`、`plan`、`check`、`review`、`review-verify`、`report`、`skills`、`upgrade` 命令。
2. 已完成 workflow template、slot runtime、standards package 和首批 adapter/skill 基线。
3. 发布运维主线 `release-ops / sprint-001` 已收口，进入下一阶段能力建设。
4. `TK-952` 已完成 `run` 基础编排，并新增“默认流程 + 自定义流程”配置入口。
5. PRD 中“AI 全自动开发模式”仍有权限门禁、审计回放、流程解释/校验与三入口验收等关键能力缺口。

## In Scope

1. 自动化控制器模型与执行状态机。
2. `run` 命令编排能力（默认流程 + 用户可配置流程）。
3. 权限分级与高风险操作人工确认门禁。
4. 自动化审计日志与恢复检查点。
5. 多 AI（`codex / github-copilot / claude-code`）阶段路由策略。
6. 多 AI 自动化验收脚本与 CI smoke gate。
7. 流程解释与流程配置校验能力（降低自编排接入风险）。

## Out Of Scope

1. 完整无人值守并发多任务调度。
2. 跨仓库远程编排和集中控制平面。
3. 可视化执行面板。
4. 第二批工具生态适配扩展。

## Task Breakdown

1. Wave A：执行编排主链路（done）
   - `TK-951` 设计自动化控制器模型、执行状态机与阶段路由契约
   - `TK-952` 实现 `run` 命令最小编排能力与路由执行（含默认流程+自定义流程基础）
2. Wave B：安全与审计（todo）
   - `TK-953` 实现权限分级与高风险人工确认门禁
   - `TK-954` 实现自动化执行审计日志与恢复检查点
3. Wave C：验收与自编排可用性（todo）
   - `TK-955` 构建多 AI 自动化验收脚本与 CI smoke gate
   - `TK-956` 输出编排解释结果（默认/自定义来源、已生效 loop 与路由）
   - `TK-957` 增加流程配置校验与解释命令入口

## Multi-AI Stage Split Example

当前 sprint 的推荐分工采用以下 routeKey 映射：

1. `requirements-draft` / `task-implementation` -> `codex`
2. `draft-review` / `technical-solution-review` -> `claude-code`
3. `task-code-review` -> `github-copilot`

## Risks

1. 如果先实现 `run` 但门禁策略不足，可能导致高风险改动自动推进。
2. 如果审计模型不先统一，后续自动化问题定位与回放成本会很高。
3. 如果恢复检查点定义不清，失败后只能全量重跑，影响效率。
4. 如果缺少流程解释/校验输出，用户自编排会出现“能配但难定位问题”的落地阻力。

## Exit Criteria

1. `run` 命令可在 `assisted` 模式下串联阶段执行并输出结构化结果。
2. 高风险行为可被策略识别并触发确认或阻断。
3. 自动化执行日志可落盘并包含阶段轨迹、门禁判断和结果摘要。
4. `codex / github-copilot / claude-code` 三入口验收链路可在本地和 CI 中复现。
5. `run` 输出可解释当前流程来源（默认/自定义）和生效编排配置。
6. sprint 的 checklist、CSV、任务卡和 CR 目录结构保持同步。

## Output Paths

- `docs/automation-v1/index.md`
- `docs/automation-v1/execution-plan.md`
- `docs/automation-v1/sprint-001/index.md`
- `docs/automation-v1/sprint-001/plan.md`
- `docs/automation-v1/sprint-001/automation-controller-model.md`
- `docs/automation-v1/sprint-001/multi-ai-handoff-orchestration-solution.md`
- `docs/automation-v1/sprint-001/default-and-custom-orchestration-solution.md`
- `docs/automation-v1/sprint-001/tasks/checklist.md`
- `docs/automation-v1/sprint-001/tasks/tasks.csv`
- `docs/automation-v1/sprint-001/tasks/TK-951.md`
- `docs/automation-v1/sprint-001/tasks/TK-952.md`
- `docs/automation-v1/sprint-001/tasks/TK-953.md`
- `docs/automation-v1/sprint-001/tasks/TK-954.md`
- `docs/automation-v1/sprint-001/tasks/TK-955.md`
- `docs/automation-v1/sprint-001/tasks/TK-956.md`
- `docs/automation-v1/sprint-001/tasks/TK-957.md`
- `docs/automation-v1/sprint-001/code-review/`
