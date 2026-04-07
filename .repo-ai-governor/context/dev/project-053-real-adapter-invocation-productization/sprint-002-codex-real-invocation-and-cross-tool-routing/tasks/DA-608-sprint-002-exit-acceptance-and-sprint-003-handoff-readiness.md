# DA-608 sprint-002 exit acceptance and sprint-003 handoff readiness

- Status: completed
- Date: 2026-04-07
- Project: `project-053-real-adapter-invocation-productization`
- Sprint: `sprint-002-codex-real-invocation-and-cross-tool-routing`
- Task: `TK-608`

## 1. Exit Acceptance Summary

1. `TK-601`、`TK-602`、`TK-603` 已全部进入 `completed`，对应 contract freeze、runtime hardening、verify/docs evidence 均已落盘。
2. sprint-scoped `CR-001` 已完成 accepted finding 修复并收口为 `resolved`；fresh post-fix recheck `CR-002` clean resolved，当前 review surface 未发现新的 actionable finding。
3. `sprint-002` 的正式 closeout 真值现已落到 sprint/project plan；下一条执行边界固定为 `sprint-003 / TK-604`。

## 2. Verification Baseline For This Handoff

1. `pnpm vitest run packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts apps/cli/test/runtime/task-driven-run-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts test/first-batch-adapters-route.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm vitest run apps/cli/test/cli-governance-runtime.integration.test.ts -t "aligns adapter invoke timeout with the run-stage timeout budget for baseline prepare stages" --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run build`
4. `node ./dist/bin/repo-ai-governor.js --output json --adapters verify`
5. `node ./dist/bin/repo-ai-governor.js --output json --adapters --dry-run --trace run`
6. `pnpm run check`

## 3. Next Boundary

1. `sprint-003-github-copilot-boundary-and-local-model-positioning`
2. first task: `TK-604-freeze-github-copilot-real-invocation-boundary-and-local-model-fallback-positioning.md`
3. activation timing: after the sprint-002 boundary commit lands
