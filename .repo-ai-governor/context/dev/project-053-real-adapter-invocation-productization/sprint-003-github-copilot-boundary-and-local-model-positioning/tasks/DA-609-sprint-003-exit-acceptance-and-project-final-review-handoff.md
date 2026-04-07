# DA-609 sprint-003 exit acceptance and project-final review handoff

- Status: completed
- Date: 2026-04-07
- Project: `project-053-real-adapter-invocation-productization`
- Sprint: `sprint-003-github-copilot-boundary-and-local-model-positioning`
- Task: `TK-609`

## 1. Exit Acceptance Summary

1. `TK-604`、`TK-605`、`TK-606` 已全部进入 `completed`，对应 `github-copilot` real-path 边界、`local-model` fallback-only positioning、verify/docs evidence refresh 均已落盘。
2. sprint-scoped `CR-001` 已完成 accepted finding 修复并收口为 `resolved`；fresh post-fix recheck `CR-002` clean resolved，当前 review surface 未发现新的 actionable finding。
3. `sprint-003` 的正式 closeout 真值现已落到 sprint/project plan；下一条执行边界固定为 `project-053` 的 project-final scoped CR loop，并继续使用当前 sprint surface 作为默认 review / ledger 面。

## 2. Verification Baseline For This Handoff

1. `pnpm vitest run packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts test/first-batch-adapters-route.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. `node ./dist/bin/repo-ai-governor.js --output json --adapters verify`
4. `node ./dist/bin/repo-ai-governor.js --output json --adapters --dry-run --trace run`
5. `pnpm run check`
6. `node ./scripts/governance/check-task-ledger-sync.js`
7. `node ./scripts/governance/check-sprint-plan-status-sync.js`
8. `node ./scripts/governance/check-code-review-status-sync.js`

## 3. Next Boundary

1. `project-053-real-adapter-invocation-productization` project-final scoped CR loop
2. first review round: `CR-003` on the current `sprint-003-github-copilot-boundary-and-local-model-positioning` tasks / review surface
3. activation timing: immediately after `TK-609` ledger write-back；在 project-final clean 之前不切换到下一个 project
