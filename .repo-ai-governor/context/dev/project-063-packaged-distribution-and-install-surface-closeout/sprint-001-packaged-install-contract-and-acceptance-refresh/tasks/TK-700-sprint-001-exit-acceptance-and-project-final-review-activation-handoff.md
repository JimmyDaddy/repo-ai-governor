# TK-700 sprint-001 exit acceptance and project-final review activation handoff

- Status: completed
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-063-packaged-distribution-and-install-surface-closeout`
- Sprint: `sprint-001-packaged-install-contract-and-acceptance-refresh`

## 1. 任务目标

在 `TK-667`、`TK-668`、`TK-669` 与 `CR-001` 全部进入终态后，完成 `sprint-001` 的出口验收、closeout write-back，并把当前 sprint surface 固定为 `project-063` project-final CR loop 的默认 `tasks/` / `review/` 面。

## 2. Depends On

1. `TK-667`
2. `TK-668`
3. `TK-669`
4. `CR-001`

## 3. 预期产物

1. sprint-001 closeout summary
2. project-final review activation handoff notes
3. 更新后的 project / sprint plan 与 canonical task ledger

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-063-packaged-distribution-and-install-surface-closeout/plan.md`
3. `.repo-ai-governor/context/dev/project-063-packaged-distribution-and-install-surface-closeout/sprint-001-packaged-install-contract-and-acceptance-refresh/plan.md`
4. `.repo-ai-governor/context/dev/project-063-packaged-distribution-and-install-surface-closeout/sprint-001-packaged-install-contract-and-acceptance-refresh/tasks/tasks.csv`
5. `.repo-ai-governor/context/dev/project-063-packaged-distribution-and-install-surface-closeout/sprint-001-packaged-install-contract-and-acceptance-refresh/review/resolved_code_review_working-tree-20260408-0435.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-063-packaged-distribution-and-install-surface-closeout/sprint-001-packaged-install-contract-and-acceptance-refresh/tasks/TK-667-freeze-packaged-install-support-contract-and-acceptance-matrix.md`
2. `.repo-ai-governor/context/dev/project-063-packaged-distribution-and-install-surface-closeout/sprint-001-packaged-install-contract-and-acceptance-refresh/tasks/TK-668-implement-packaged-installer-runtime-layout-followup-or-explicit-online-only-boundary-hardening.md`
3. `.repo-ai-governor/context/dev/project-063-packaged-distribution-and-install-surface-closeout/sprint-001-packaged-install-contract-and-acceptance-refresh/tasks/TK-669-close-packaged-adoption-boundary-with-clean-room-rehearsal-and-support-matrix-refresh.md`

## 6. 实施计划

1. 汇总 `sprint-001` 当前所有已终态 task / review evidence，确认出口验收输入完整。
2. 形成 sprint-001 closeout summary 与 project-final review activation handoff 所需输入。
3. 在 closeout 完成后同步 project / sprint plan 与 task ledger，同时继续保留当前 sprint surface 供 `project-063` project-final CR 使用。

## 7. Development Verification

1. 校对 `tasks.csv` 最新终态是否已覆盖 `TK-667`、`TK-668`、`TK-669` 与 `CR-001`。
2. 校对 `project-063 / sprint-001` 在 project-final CR round 打开前继续保持同一 active sprint surface。

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `node ./scripts/governance/check-worktree-review-target.js`
5. `pnpm run check`

## 9. 执行记录

1. 2026-04-08：在 `TK-667`、`TK-668`、`TK-669` 与 `CR-001` 全部进入终态后创建本任务。
2. 2026-04-08：已写入 `DA-700`、project/sprint closeout handoff 与 task-ledger 同步；当前 sprint surface 保留给后续 `project-final` CR loop。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-063-packaged-distribution-and-install-surface-closeout/sprint-001-packaged-install-contract-and-acceptance-refresh/tasks/DA-700-sprint-001-closeout-and-project-final-review-activation-handoff.md`
2. `.repo-ai-governor/context/dev/project-063-packaged-distribution-and-install-surface-closeout/plan.md`
3. `.repo-ai-governor/context/dev/project-063-packaged-distribution-and-install-surface-closeout/sprint-001-packaged-install-contract-and-acceptance-refresh/plan.md`
4. `.repo-ai-governor/context/current-context.md`
