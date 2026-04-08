# TK-693 finalize project-071 closeout and restore idle context

- Status: completed
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-071-draft-refresh-against-formal-triad`
- Sprint: `sprint-001-priority-and-decomposition-refresh`

## 1. 任务目标

在两份 draft 刷新完成后，把 `project-071 / sprint-001` 的 project、sprint、task ledger、completion audit、completed history 与当前上下文一次性收口到最终完成态。

## 2. Depends On

1. `TK-691`
2. `TK-692`

## 3. 预期产物

1. `DA-693` closeout handoff
2. `project-071` completion audit summary
3. `current-context.md` 与 `completed-streams-history.md` 最终 completed / idle 真值

## 4. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --task-id TK-693`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-code-review-status-sync.js`
5. `node ./scripts/governance/check-worktree-review-target.js`
6. docs-only closeout：未修改 `apps/**`、`packages/**`、`bin/**`、`test/**` 可执行代码，因此 `pnpm run build` not required

## 5. 执行记录

1. 2026-04-08：任务创建，等待 `TK-691 / TK-692` 完成后执行 final closeout。
2. 2026-04-08：已写入 `project-071` plan、sprint plan、completion audit 与 `DA-693`。
3. 2026-04-08：已把 `current-context.md` 恢复为 `idle`，并在 `completed-streams-history.md` 中登记 `stream-project-071-sprint-001`。
4. 2026-04-08：治理检查通过，任务完成。
