# sprint-001-connect-config-recovery-guidance 计划

- Status: completed
- Date: 2026-04-11
- Project: `project-081-session-shell-actionable-error-guidance`
- Sprint Goal: 把 `connect` 缺少 adapters baseline 的结构化错误从“原始 JSON 回显”收敛成 session shell 内可执行的恢复指导，并在同一 sprint 内完成 closeout。

## 1. Task Package

1. `TK-763` add actionable session-shell recovery guidance for structured connect errors
2. `TK-764` finalize project-081 closeout and completion audit

## 2. Exit Criteria

1. session shell 能恢复重复 JSON 错误输出中的 `cli_output_v1` payload。
2. `connect` 缺 adapters baseline 时，用户能在 shell 内看到明确恢复路径，而不是只看到原始 JSON。
3. sprint 内实现与 closeout 任务均已完成，task ledger / checklist / tasks.csv / project plan 保持同步。

## 3. 里程碑记录

1. 2026-04-11：作为 `project-081` 的唯一 sprint 创建，并在同窗口直接收口为 `completed`。
2. 2026-04-11：已确认当前症状由“重复 JSON 解析失败 + machine next_action 直出”共同造成。
3. 2026-04-11：`TK-763` 已完成结构化错误恢复、connect config 修复指引、i18n/测试/规范同步。
4. 2026-04-11：`TK-764 / DA-764` 已完成 sprint/project closeout write-back；当前 sprint 已恢复为最终 `completed` 真值。
