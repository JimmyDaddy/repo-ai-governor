# sprint-002-org-governance-and-rollout-readiness 计划

- Status: completed
- Date: 2026-03-22
- Project: `project-007-platformization`

## 1. Sprint Goal

落地平台化核心能力最小实现链路（市场供给、可视化联调、组织级分发与审计治理），形成 project-007 出口验收与后续 rollout 输入约束，并补齐 workspace code review 无修复项时的自动收口规则。

## 2. In-Scope Tasks

1. TK-069 插槽市场供给链与权限治理落地（completed）
2. TK-070 可视化面板 MVP 与流程编排联调（completed）
3. TK-071 组织级策略包分发与版本治理落地（completed）
4. TK-072 跨租户审计视图与导出治理落地（completed）
5. TK-073 project-007 出口验收与后续 rollout 输入约束（completed）
6. TK-074 workspace code review 无修复项直接 resolved 规则（completed）

## 3. Entry Criteria

1. `DA-081`（sprint-001 出口验收与 sprint-002 输入约束）可检索。
2. Stage 7 核心门禁入口保持可复跑：`test:resilience`、`release:rollback-rehearsal`、`release:ga-candidate-unified-gate`。
3. 平台控制面、市场契约、可视化契约、组织策略分发契约基线已在 sprint-001 收敛并可消费。

## 4. Exit Criteria

1. 形成 `DA-082`~`DA-085` 四项实现态产物并可回链。
2. 形成 `DA-086`（project-007 出口验收与后续 rollout 输入约束）。
3. 任务卡、checklist、tasks.csv 三者字段同步满足 `CS-021`。
4. workspace code review 在无 actionable finding 时直接进入 `resolved` 状态，避免 pending/verified 空转。
