# checklist

- [x] TK-666 run clean-room adopter and self-host rehearsals plus truthfulness evidence refresh
  - 2026-04-09：任务创建，状态初始化为 `planned`。
  - 2026-04-09：已用构建后的 `dist/bin/repo-ai-governor.js` 重新执行 adopter / lifecycle / self-host clean-room rehearsal，并刷新受管安装、升级移除与 self-host bootstrap 的正式证据包。
- [x] TK-667 close docs alignment rollout audit and delivery evidence
  - 2026-04-09：任务创建，状态初始化为 `planned`。
  - 2026-04-09：已将 README、本地 adoption playbook 与 support matrix 对齐到真实 `adopt` / self-host / host-export 边界，并把 project-061 clean-room truthfulness evidence 回链到公开文档面。
  - 2026-04-09：已补齐 `project-061-adoption-pack-installer-and-self-host-bootstrap-rollout-completion-audit-summary.md`，并将 support matrix clean-room evidence timestamp 刷新到最新 `dist` 构建后的 clean-room summary。
- [x] CR-001 project-061-adoption-pack-installer-and-self-host-bootstrap-rollout final delegated review loop round 1
  - 2026-04-09：任务创建，状态初始化为 `review_pending`。
  - 2026-04-09：delegated reviewer `Franklin` 在 round 1 提出 3 条 actionable finding：`adopt remove` drift fail-closed、project-061 closeout ledger sync、project-level completion audit 缺失。
  - 2026-04-09：主 agent 认可全部 findings，并完成代码修复、plan/context/history/audit write-back、targeted vitest、`pnpm run build` 与 governance gates；当前 CR 已推进为 `resolved`。
- [x] TK-673 sprint-006 exit acceptance and project-final closeout readiness
  - 2026-04-09：delegated reviewer Franklin 在 round 1 提出 3 条 actionable finding：`adopt remove` drift fail-closed、project-061 closeout ledger sync、project completion audit 缺失。
  - 2026-04-09：主 agent 认可全部 findings，并在同一窗口完成代码修复、ledger/plan/audit write-back 与 final recheck，使 `sprint-006` 达到 project-final closeout-ready state。
- [x] TK-674 finalize project-061 closeout and completion audit
  - 2026-04-09：在 `TK-673` 与 `CR-001` `resolved` 后完成 project-061 final closeout write-back。
  - 2026-04-09：已创建 completion audit summary、回链 project milestone、将 `current-context` 切换为 `idle`，并把 `stream-project-061-sprint-006` 迁入 completed history。
  - Final closeout completed: project-061 moved to completed history.
