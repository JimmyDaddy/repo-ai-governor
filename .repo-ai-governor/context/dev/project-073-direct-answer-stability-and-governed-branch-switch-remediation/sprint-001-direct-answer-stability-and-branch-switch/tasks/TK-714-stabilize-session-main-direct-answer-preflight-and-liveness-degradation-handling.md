# TK-714 stabilize session.main direct-answer preflight and liveness degradation handling

- Status: completed
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-073-direct-answer-stability-and-governed-branch-switch-remediation`
- Sprint: `sprint-001-direct-answer-stability-and-branch-switch`

## 1. 任务目标

修复 `session.main` direct-answer 路径在 surface preflight 与 invoke liveness 上的脆弱行为，降低因为慢 probe、慢 stdout 或过早 suspect 造成的误伤失败与糟糕前台体验。

## 2. Depends On

1. `.repo-ai-governor/context/current-context.md`
2. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
3. `packages/adapters/codex/src/codex-agent-adapter.ts`

## 3. 预期产物

1. 调整后的 `session.main` direct-answer preflight / fallback 逻辑
2. 调整后的 Codex liveness/watchdog 行为或 presenter-safe degrade contract
3. 覆盖该回归面的测试与验证证据

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
4. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
5. `packages/adapters/codex/src/codex-agent-adapter.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-073-direct-answer-stability-and-governed-branch-switch-remediation/plan.md`
2. `.repo-ai-governor/context/dev/project-073-direct-answer-stability-and-governed-branch-switch-remediation/sprint-001-direct-answer-stability-and-branch-switch/plan.md`
3. `不适用：本任务直接承接用户报告的 current app surface gap。`

## 6. 实施计划

1. 收紧 direct-answer preflight 的阻塞面，避免慢 probe 拖住整个 turn。
2. 优化 Codex invoke liveness/watchdog 的 suspect 阈值或降级策略，减少误判失败。
3. 为 preflight / liveness / presenter regression 补齐测试，并记录 build + targeted verification 证据。

## 7. Development Verification

1. `pnpm exec vitest run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm exec vitest run packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts apps/cli/test/runtime/session-shell-turn-progress-dock.test.ts --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm exec vitest run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts apps/cli/test/runtime/session-shell-turn-progress-dock.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/sync-task-ledger.js --task-id TK-714 --tasks-dir ".repo-ai-governor/context/dev/project-073-direct-answer-stability-and-governed-branch-switch-remediation/sprint-001-direct-answer-stability-and-branch-switch/tasks"`
4. `node ./scripts/governance/check-task-ledger-sync.js`
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`
6. `pnpm run check`

## 9. 执行记录

1. 2026-04-08：任务创建并直接切换为 `in_progress`，当前先修复 direct-answer 稳定性边界。
2. 2026-04-08：已将 direct-answer preflight 收敛为“首个安全 surface 快路径”，避免慢 probe 持续阻塞整轮自由回答。
3. 2026-04-08：已为首选 direct-answer surface 的 invoke failure 增加自动 fallback 到下一个安全 surface 的恢复路径，并补充对应 supervisor regression tests。
4. 2026-04-08：已将 Codex CLI liveness suspect 阈值调整得更保守，并通过 `pnpm exec vitest run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts apps/cli/test/runtime/session-shell-turn-progress-dock.test.ts --maxWorkers=1 --maxConcurrency=1` 与 `pnpm run build`，任务状态切换为 `completed`，下一边界进入 fresh reviewer CR loop。
5. 2026-04-08：在 `CR-001` 复核中确认了 direct-answer fallback 复用跨 attempt relay state 的可见性回归风险，已修正为 per-attempt relay state，并新增 partial-token fallback 回归测试；`CR-001` 已 resolved，当前任务边界 clean。

## 10. 产出

1. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
2. `packages/adapters/codex/src/codex-agent-adapter.ts`
3. `apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
4. `packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`
