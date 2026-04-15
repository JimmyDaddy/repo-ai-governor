# DA-863 sprint-001 closeout and sprint-002 activation handoff

- Status: `active`
- Date: 2026-04-14
- Owner: `AI-Agent`
- Project: `project-106-cli-exec-compatibility-and-stability-rollout`
- Source Task: `TK-863`

## 1. Scope

1. 收口 `sprint-001-compatibility-taxonomy-and-regression-harness`。
2. 激活 `sprint-002-verification-profiles-trigger-matrix-and-closeout` 作为新的 primary execution surface。

## 2. Closeout Summary

1. `TK-861` 已完成 shared native `cli_exec` compatibility harness 与 preserved-facts assertion matrix 落地。
2. `TK-862` 已完成 Codex / Claude Code / GitHub Copilot smoke 以及 onboarding / verification consumer-side baseline 对齐。
3. `CR-001` 已完成 accepted finding 修复并收口为 `resolved`。
4. `CR-002` 作为 fresh post-fix recheck round 返回 clean，无新的 actionable finding。

## 3. Handoff Write-Back

1. `sprint-001` plan 已写回 `completed`。
2. `stream-project-106-sprint-001` 已迁入 `.repo-ai-governor/context/completed-streams-history.md`。
3. `current-context.md` 已切换到 `stream-project-106-sprint-002`。
4. `sprint-002` plan 已激活为 `active`，`TK-864` 已切换为 `in_progress`。

## 4. Verification Evidence

1. `pnpm run build` 已在当前 change window 通过。
2. focused vitest compatibility suite 已在当前 change window 通过。
3. `CR-001` / `CR-002` lifecycle、task ledger、sprint-plan sync 与 worktree-review-target governance checks 已在 handoff write-back 窗口通过。
4. `pnpm run check` 已在本次 sprint-001 local commit 前作为最终 sanity gate 通过。

## 5. Sprint-002 Activation Constraints

1. 激活后先为 `sprint-002` 分配本地 `CR-001`，再开始 implementation。
2. 当前窗口只允许落地 compatibility verification profiles、trigger matrix 与 closeout guidance。
3. 不得把 compatibility profiles 升格为 `governance.execution-gates` formal truth。
