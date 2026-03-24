# sprint-002-autonomous-mainchain-foundation 计划

- Status: in_progress
- Date: 2026-03-24
- Project: `project-010-local-model-and-ide-expansion`

## 1. Sprint Goal

将 Stage 9 自动主链从固定模板升级为任务驱动受控链路，完成 `run/review/HITL` 的第一轮闭环收口。

## 2. In-Scope Tasks

1. TK-099 任务驱动 DAG 与 `run` 主链装配（in_progress）
2. TK-100 review 子链内联与 ledger backfill 收口（completed）
3. TK-101 HITL 决策回执与恢复执行语义（in_progress）
4. TK-102 sprint-002 出口验收与 sprint-003 输入约束（planned）

## 3. Entry Criteria

1. `DA-102`（sprint-001 出口验收与 sprint-002 输入约束）可检索。
2. `DA-121`、`DA-122`、`DA-123` 与 `project-011-cli-package-decomposition-completion-audit-summary.md` 可检索，CLI decomposition 基线与正式 rollout handoff 已建立。
3. 本地模型路径、route fallback、restricted network 诊断基线保持可复跑。
4. 当前 CLI/runtime 的 `execution_id/report/ledger` 链路可作为自动主链升级输入，不重做 Stage 0-8 已完成模块。

## 4. Exit Criteria

1. `run` 可按任务目标、依赖产物、角色能力生成可执行 DAG。
2. `review -> review-verify -> ledger backfill` 可作为自动主链子链推进，并与审计事实一致。
3. HITL 决策回执支持 `resume/terminate/degrade`，且至少 1 条通知路径可复跑。
4. 形成 `DA-103`~`DA-106` 并通过台账与质量门禁。
