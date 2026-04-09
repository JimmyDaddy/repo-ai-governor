# TK-698 sprint-002 exit acceptance and project-final review activation handoff

- Status: completed
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-062-cli-continuity-and-adapter-truthfulness-hardening`
- Sprint: `sprint-002-adapter-probe-verify-truth-source-alignment`

## 1. 任务目标

在 `TK-664`、`TK-665`、`TK-666`、`CR-001` 与 `CR-002` 全部进入终态后，完成 `sprint-002` 的出口验收、closeout write-back，并把当前 sprint surface 固定为 `project-062` project-final CR loop 的默认 `tasks/` / `review/` 面。

## 2. Depends On

1. `TK-664`
2. `TK-665`
3. `TK-666`
4. `CR-001`
5. `CR-002`

## 3. 预期产物

1. sprint-002 closeout summary
2. project-final review activation handoff notes
3. 更新后的 project / sprint plan 与 canonical task ledger

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-062-cli-continuity-and-adapter-truthfulness-hardening/plan.md`
3. `.repo-ai-governor/context/dev/project-062-cli-continuity-and-adapter-truthfulness-hardening/sprint-002-adapter-probe-verify-truth-source-alignment/plan.md`
4. `.repo-ai-governor/context/dev/project-062-cli-continuity-and-adapter-truthfulness-hardening/sprint-002-adapter-probe-verify-truth-source-alignment/tasks/tasks.csv`
5. `.repo-ai-governor/context/dev/project-062-cli-continuity-and-adapter-truthfulness-hardening/sprint-002-adapter-probe-verify-truth-source-alignment/review/resolved_code_review_working-tree-20260408-0331.md`
6. `.repo-ai-governor/context/dev/project-062-cli-continuity-and-adapter-truthfulness-hardening/sprint-002-adapter-probe-verify-truth-source-alignment/review/resolved_code_review_working-tree-20260408-0342.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-062-cli-continuity-and-adapter-truthfulness-hardening/sprint-002-adapter-probe-verify-truth-source-alignment/tasks/TK-664-freeze-connect-doctor-verify-transcript-truth-source-contract.md`
2. `.repo-ai-governor/context/dev/project-062-cli-continuity-and-adapter-truthfulness-hardening/sprint-002-adapter-probe-verify-truth-source-alignment/tasks/TK-665-implement-adapter-probe-outcome-classification-and-presenter-safe-diagnostics-alignment.md`
3. `.repo-ai-governor/context/dev/project-062-cli-continuity-and-adapter-truthfulness-hardening/sprint-002-adapter-probe-verify-truth-source-alignment/tasks/TK-666-close-cli-truthfulness-hardening-with-cross-adapter-evidence-refresh.md`

## 6. 实施计划

1. 汇总 `sprint-002` 当前所有已终态 task / review evidence，确认出口验收输入完整。
2. 形成 sprint-002 closeout summary 与 project-final review activation handoff 所需输入。
3. 在 closeout 完成后同步 project / sprint plan 与 task ledger，同时继续保留当前 sprint surface 供 `project-final` CR 使用。

## 7. Development Verification

1. 校对 `tasks.csv` 最新终态是否已覆盖 `TK-664`、`TK-665`、`TK-666`、`CR-001` 与 `CR-002`。
2. 校对 `project-062 / sprint-002` 在 project-final CR round 打开前继续保持同一 active sprint surface。

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `node ./scripts/governance/check-worktree-review-target.js`
5. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
6. `pnpm run check`

## 9. 执行记录

1. 2026-04-08：在 `TK-664`、`TK-665`、`TK-666`、`CR-001` 与 `CR-002` 全部进入终态后创建本任务。
2. 2026-04-08：已写入 `DA-698`、project/sprint closeout handoff 与 task-ledger 同步；当前 sprint surface 保留给后续 `project-final` CR loop。
3. 2026-04-08：已通过 `pnpm run check`，满足 sprint 边界本地 commit 前的最终门禁。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-062-cli-continuity-and-adapter-truthfulness-hardening/sprint-002-adapter-probe-verify-truth-source-alignment/tasks/DA-698-sprint-002-closeout-and-project-final-review-activation-handoff.md`
2. `.repo-ai-governor/context/dev/project-062-cli-continuity-and-adapter-truthfulness-hardening/plan.md`
3. `.repo-ai-governor/context/dev/project-062-cli-continuity-and-adapter-truthfulness-hardening/sprint-002-adapter-probe-verify-truth-source-alignment/plan.md`
4. `.repo-ai-governor/context/current-context.md`
