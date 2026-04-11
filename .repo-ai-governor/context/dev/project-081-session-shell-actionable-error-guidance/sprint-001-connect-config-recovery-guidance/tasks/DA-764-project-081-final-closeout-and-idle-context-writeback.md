# DA-764 project-081 final closeout and idle context writeback

- Status: completed
- Date: 2026-04-11
- Project: `project-081-session-shell-actionable-error-guidance`
- Sprint: `sprint-001-connect-config-recovery-guidance`
- Task: `TK-764`

## 1. Summary

1. `project-081-session-shell-actionable-error-guidance` 已完成最终 closeout。
2. session shell 现在会优先恢复 structured CLI error，并把 `connect` 缺少 adapters baseline 的场景直接转译成用户可执行的恢复建议。
3. 当前 worktree 继续保持无 active primary stream，`project-081 / sprint-001` 已移入 completed history。

## 2. Closed Evidence

1. `TK-763`：已修复重复 JSON stdout 在 session shell 中无法恢复结构化错误的问题。
2. `TK-763`：已将 machine next_action 转译为用户可读恢复步骤，并为 `connect requires adapters baseline in source config` 增加 `/init` / `/workspace clear-config` 提示。
3. `TK-763`：已同步 shell contract/module overview 与 adoption playbook，保证实现、规范和用户说明一致。

## 3. Final Closeout Result

1. `project-081` plan 已恢复为最终 `completed` 真值，并追加 completion audit summary milestone backlink。
2. `sprint-001` plan 已恢复为最终 `completed` 真值。
3. `current-context.md` 继续保持 `idle`，`completed-streams-history.md` 已登记 `stream-project-081-sprint-001`。
4. `tasks/checklist.md`、`tasks/tasks.csv` 与 canonical task-ledger sqlite 已完成同步。

## 4. Verification Note

1. 同窗口代码验证证据：`pnpm exec vitest run apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`、`node ./scripts/governance/check-i18n-parity-fallback.js`、`pnpm run build`。
2. closeout 治理验证：`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-worktree-review-target.js`。
