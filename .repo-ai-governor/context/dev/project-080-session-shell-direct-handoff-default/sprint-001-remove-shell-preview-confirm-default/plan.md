# sprint-001-remove-shell-preview-confirm-default 计划

- Status: completed
- Date: 2026-04-11
- Project: `project-080-session-shell-direct-handoff-default`
- Sprint Goal: 确认 `connect` 失败根因，移除 session shell 默认 preview-confirm 冗余交互，并在同一 sprint 内完成规范、验证与 closeout。

## 1. Task Package

1. `TK-761` remove shell-owned preview-confirm default for governed session commands
2. `TK-762` finalize project-080 closeout and completion audit

## 2. Exit Criteria

1. 用户可见默认命令 handoff 不再强制经过 preview + `/confirm`。
2. 真正的确认边界已回收到命令契约或 policy/HITL gate，而不是 shell 自己持有。
3. sprint 内实现与 closeout 任务均已完成，task ledger / checklist / tasks.csv 与 project plan 保持同步。

## 3. 里程碑记录

1. 2026-04-11：作为 `project-080` 的唯一 sprint 创建，并在同窗口直接收口为 `completed`。
2. 2026-04-11：已确认 `connect` 执行失败根因是 source config 缺少 `adapters` baseline，对应 runtime 会抛出 `ADAPTER_ROUTE_CONFIG_INVALID`。
3. 2026-04-11：`TK-761` 已完成 capability catalog / skill registry / slash registry / i18n / tests / shell-orchestration 规范同步，默认 governed handoff 已切换到 `direct_execute`。
4. 2026-04-11：`TK-762 / DA-762` 已完成 sprint/project closeout write-back；当前 sprint 已恢复为最终 `completed` 真值。
