# checklist

- [x] TK-304 project-027 激活与 React shell implementation handoff
  - 2026-03-28：任务创建，状态切换为 `in_progress`，开始搭建 project-027 与 sprint-001 基线。
  - 2026-03-28：已完成，project-027 / sprint-001 与 `current-context`、plan、task ledger 已完成 handoff 对齐。
- [x] TK-305 shell runner、UI mode resolver 与 stderr/SIGINT baseline
  - 2026-03-28：任务创建，状态切换为 `in_progress`，开始搭建 shell runner 与输出边界。
  - 2026-03-28：已完成，新增 `--ui` 解析、`interactive-shell` mode resolver、stderr renderer 与 `SIGINT`/unmount baseline，并把 `plain/json`、非 TTY、`--no-interactive` 固化为 `ui_mode=none`。
- [x] TK-306 `init` React shell 最小向导与 descriptor/state baseline
  - 2026-03-28：任务创建，状态切换为 `in_progress`，开始落地 init 最小向导闭环。
  - 2026-03-28：已完成，`init` 接入 descriptor/state 驱动的最小 React 风格向导，并保留 classic fallback；`init-manifest` 的 `workspaceMode` 也改为回写实际交互选择。
- [x] TK-307 M1 回归测试、fallback 与 non-interactive contract gate
  - 2026-03-28：任务创建，状态切换为 `in_progress`，开始补齐回归测试与门禁。
  - 2026-03-28：已完成，新增 UI mode resolver 单测、`init` shell runner 单测、CLI output contract 集成测试，并通过 TypeScript 与 sprint ledger 相关门禁验证。
  - 2026-03-28：按更严格的 CR 标准追加收口，补充 restart-loop 分支测试，并为 SIGINT / teardown 双保险路径增加意图注释，同时把 stricter-bar 规则写入 `workspace-code-review-workflow` skill。
