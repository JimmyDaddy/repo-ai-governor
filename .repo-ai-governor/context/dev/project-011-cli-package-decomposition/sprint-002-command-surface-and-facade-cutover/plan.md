# sprint-002-command-surface-and-facade-cutover 计划

- Status: in_progress
- Date: 2026-03-24
- Project: `project-011-cli-package-decomposition`

## 1. Sprint Goal

完成 artifact/presentation 与 command executor 抽离，并将 `CliGovernanceRuntime` 收敛为薄 facade。

## 2. In-Scope Tasks

1. TK-119 artifact/report/presentation 模块抽离（completed）
2. TK-120 通用命令执行器抽离与 entry registry 基线（completed）
3. TK-121 run/review 命令执行器抽离与 thin facade cutover（planned）
4. TK-122 sprint-002 出口验收与 sprint-003 输入约束（planned）

## 3. Entry Criteria

1. `DA-116`（sprint-001 出口验收与 sprint-002 输入约束）可检索。
2. CLI runtime 支撑模块第一批抽离已完成，不再阻塞 command surface 重构。

## 4. Exit Criteria

1. artifact/report/presentation 逻辑不再直接附着于 `CliGovernanceRuntime`。
2. 顶层命令执行逻辑已迁出到 `commands/*` 或等价边界。
3. `DA-117`~`DA-120` 可检索，并通过 sprint-002 出口验收。
