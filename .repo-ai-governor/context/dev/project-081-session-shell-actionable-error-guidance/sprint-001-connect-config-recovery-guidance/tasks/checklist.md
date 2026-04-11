# checklist

- [x] TK-763 add actionable session-shell recovery guidance for structured connect errors
  - 2026-04-11：任务创建并直接进入 `in_progress`，范围锁定为“结构化错误恢复 + connect 缺 adapters baseline 的可执行恢复提示”。
  - 2026-04-11：已确认症状由两层叠加造成：session shell 只会整段 `JSON.parse(stdout)`，重复 JSON 行会导致退回原样回显；同时 `next_action` 仍以 machine enum 直接展示。
  - 2026-04-11：已为 nested CLI 错误输出补齐“整段 JSON -> 逐行 JSON fallback”恢复逻辑，把 `inspect_governor_config` 等 next_action 翻译成用户可读提示，并为 `connect requires adapters baseline in source config` 增加 `/init` 与 `/workspace clear-config` 恢复建议。
  - 2026-04-11：已同步 session shell i18n、entrypoint runtime 回归测试、shell contract/module overview 与 adoption playbook，并通过 targeted vitest、i18n parity 与 `pnpm run build`；当前任务状态切换为 `completed`。
- [x] TK-764 finalize project-081 closeout and completion audit
  - 2026-04-11：任务创建并在同一窗口直接推进到 `completed`，用于承接 `TK-763` clean 后的最终 closeout write-back。
  - 2026-04-11：已写入 `DA-764` 与 completion audit summary，并将 `project-081 / sprint-001` plan、`current-context.md` 与 `completed-streams-history.md` 同步到最终 `completed / idle` 真值。
  - 2026-04-11：已完成 `TK-763 / TK-764` canonical task-ledger sync，并复跑 targeted vitest、i18n parity、`pnpm run build` 与治理检查；当前项目已具备完整完成态证据。
