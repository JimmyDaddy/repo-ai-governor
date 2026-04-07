# TK-606 close real adapter invocation rollout with support matrix and verify evidence refresh

- Status: completed
- Date: 2026-04-06
- Task ID: `TK-606`
- Owner: `AI-Agent`
- Priority: `P1`
- Sprint: `sprint-003-github-copilot-boundary-and-local-model-positioning`
- Project: `project-053-real-adapter-invocation-productization`

## 1. 任务目标

完成 support matrix 与 verify evidence refresh，收口 `project-053` 的 real adapter invocation rollout，并为 project-final CR loop 提供统一证据面。

## 2. Depends On

1. `TK-604`
2. `TK-605`

## 3. Expected Outputs

1. support matrix refresh
2. verify evidence refresh
3. project closeout truth inputs

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-053-real-adapter-invocation-productization/plan.md`
3. `.repo-ai-governor/context/dev/project-053-real-adapter-invocation-productization/sprint-003-github-copilot-boundary-and-local-model-positioning/tasks/TK-604-freeze-github-copilot-real-invocation-boundary-and-local-model-fallback-positioning.md`
4. `.repo-ai-governor/context/dev/project-053-real-adapter-invocation-productization/sprint-003-github-copilot-boundary-and-local-model-positioning/tasks/TK-605-implement-copilot-real-path-degrade-handling-and-local-model-support-matrix-alignment.md`
5. `docs/support-matrix.md`

## 5. Traceback References

1. `docs/support-matrix.zh-CN.md`
2. `docs/local-adoption-playbook.md`
3. `docs/local-adoption-playbook.zh-CN.md`

## 6. 实施计划

1. 汇总 `Copilot` real-path 与 `local-model` fallback 的正式证据。
2. 刷新 support matrix / playbook truth，形成 project-final review surface。
3. 为 `project-053` final CR loop 与项目 closeout 准备统一资料面。

## 7. Development Verification

1. `pnpm vitest run packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts test/first-batch-adapters-route.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`

## 8. Delivery Verification

1. `pnpm vitest run packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts test/first-batch-adapters-route.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. `node ./dist/bin/repo-ai-governor.js --output json --adapters verify`
4. `node ./dist/bin/repo-ai-governor.js --output json --adapters --dry-run --trace run`
5. `pnpm run check`

## 9. 执行记录

1. 2026-04-06：任务创建，状态初始化为 `planned`。
2. 2026-04-07：`TK-605` delivery verification 已完成，开始以 `.tmp/project-053-sprint-003-verify-adapters-tk-605-606.json`、`.tmp/project-053-sprint-003-run-dry-run-trace-tk-605-606.json` 及其 emitted diagnostics/report/replay artifacts 刷新 `docs/support-matrix*.md` 的正式验证快照与 project-final review surface。
3. 2026-04-07：已完成 `docs/support-matrix*.md` 的验证快照与 formal claim refresh：新增 sprint-003 targeted vitest、fresh `verify --adapters`、fresh `run --dry-run --trace` 行，并把 `project-053 / sprint-003` 的 `github-copilot` real-path + `local-model` fallback-only positioning 收口写入正式支持说明。
4. 2026-04-07：sprint-003 的 canonical delivery evidence 以 targeted vitest、`pnpm run build`、fresh `verify --adapters`、fresh `run --dry-run --trace`、`check-task-ledger-sync` 与 `check-sprint-plan-status-sync` 为主；同窗口另有一次 workspace-wide `pnpm run check` 通过，但其中包含 shared helper-script lint hygiene 修复，因此仅作为附加 release-gate 背景证据，不把它表述成 sprint-003 单独 closeout proof。
5. 2026-04-07：当前 project-final review 输入面保持不变：`.tmp/project-053-sprint-003-verify-adapters-tk-605-606.json`、`.tmp/project-053-sprint-003-run-dry-run-trace-tk-605-606.json`、`/Users/jimmydaddy/.repo-ai-governor/workspaces/2cf23e5951f0/.repo-ai-governor/context/diagnostics/verify/verify-1775518628055.json`、`/Users/jimmydaddy/.repo-ai-governor/workspaces/2cf23e5951f0/.repo-ai-governor/context/reports/cli-run-1775518628055.report.json`、`/Users/jimmydaddy/.repo-ai-governor/workspaces/2cf23e5951f0/.repo-ai-governor/context/replay/cli-run-1775518628055.replay.json` 与 `.../diagnostics/trace/cli-run-1775518628055.trace.json`。

## 10. 产出

1. real adapter invocation rollout evidence refresh 已完成：`docs/support-matrix.md` 与 `docs/support-matrix.zh-CN.md` 现同时记录 `TK-604/TK-605/TK-606` 的 fresh verification snapshot 与 claim-level refresh。
2. project-final review inputs 已完成：`.tmp/project-053-sprint-003-verify-adapters-tk-605-606.json`、`.tmp/project-053-sprint-003-run-dry-run-trace-tk-605-606.json` 及其 emitted diagnostics/report/replay artifacts 现可直接作为 `project-053` final CR loop 的 canonical review surface。
3. closeout-ready truth 已就位：当前 sprint-003 的 code / docs / tests / governance ledger 已通过 targeted delivery evidence 与 governance sync checks，可以进入 fresh sprint-scoped reviewer round；workspace-wide `pnpm run check` 仅作为同窗口附加 gate 背景，不替代 sprint-boundary canonical proof。
