# DA-868 sprint-001 closeout and sprint-002 activation handoff

- Status: `active`
- Date: 2026-04-14
- Owner: `AI-Agent`
- Project: `project-102-cli-exec-launch-authoring-contract-tests-rollout`
- Source Task: `TK-868`

## 1. Scope

1. 收口 `sprint-001-launch-authoring-contract-tests-rollout`。
2. 激活 `sprint-002-failure-path-coverage-and-rollout-closeout` 作为新的 primary execution surface。

## 2. Closeout Summary

1. `TK-857` 已完成 shared launch-authoring harness baseline 与 adapter/runtime smoke coverage 更新。
2. `TK-867` 已完成 probe/invoke preserved-fact split 与 fallback entrypoint projection shared vocabulary 落地。
3. `CR-001` fresh reviewer round 返回 clean，无新的 actionable finding。

## 3. Handoff Write-Back

1. `sprint-001` plan 已写回 `completed`。
2. `stream-project-102-sprint-001` 已迁入 `.repo-ai-governor/context/completed-streams-history.md`。
3. `current-context.md` 已切换到 `stream-project-102-sprint-002`。
4. `sprint-002` plan 已激活为 `active`，`TK-869` 已切换为 `in_progress`。
5. launch-authoring solution delivery truth 已切换到 `sprint-002` surface，并保持 `execution_status=in_progress`。

## 4. Verification Evidence

1. focused launch-authoring suites 已在当前 change window 通过。
2. `pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 已在当前 change window 通过。
3. `CR-001` lifecycle、task ledger、sprint-plan sync 与 worktree-review-target governance checks 已在 handoff write-back 窗口通过。
4. `pnpm run check` 将在本次 sprint-001 local commit 前作为最终 sanity gate 执行。

## 5. Sprint-002 Activation Constraints

1. 激活后先为 `sprint-002` 分配本地 `CR-001`，再开始 implementation。
2. 当前窗口只允许扩展 `spawn / parse / non_zero / signal / timeout / abort` failure-path launch-authoring coverage，并补 compatibility alignment evidence。
3. 不得把 launch-authoring ownership guardrail 扩面成 general adapter test strategy。
