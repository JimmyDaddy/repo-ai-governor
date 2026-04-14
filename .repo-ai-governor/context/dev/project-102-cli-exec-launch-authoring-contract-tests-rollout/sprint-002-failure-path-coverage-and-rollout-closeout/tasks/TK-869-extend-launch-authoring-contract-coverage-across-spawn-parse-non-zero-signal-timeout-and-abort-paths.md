# TK-869 extend launch-authoring contract coverage across spawn parse non-zero signal timeout and abort paths

- Status: completed
- Date: 2026-04-14
- Owner: AI-Agent
- Priority: P1
- Project: `project-102-cli-exec-launch-authoring-contract-tests-rollout`
- Sprint: `sprint-002-failure-path-coverage-and-rollout-closeout`

## 1. 任务目标

把 launch-authoring contract coverage 扩展到主要 failure-path，确保 authoring truth 在 shared runtime 的异常路径中仍被保住。

## 2. Depends On

1. `TK-868`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/adapter-authored-launch-plan-ownership-and-contract-tests.md`

## 3. 预期产物

1. failure-path coverage expansion plan
2. launch-authoring regression evidence boundary
3. synced task ledger once activation begins

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-102-cli-exec-launch-authoring-contract-tests-rollout/sprint-002-failure-path-coverage-and-rollout-closeout/plan.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/adapter-authored-launch-plan-ownership-and-contract-tests.md`
3. `.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/plan.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-098-cli-exec-runtime-rollout/plan.md`

## 6. 实施计划

1. 将 spawn、parse、non-zero、signal、timeout、abort 路径映射到 shared launch-authoring contract coverage。
2. 固定 failure-path 下 authoring truth 与 preserved facts 的读法。
3. 为 `TK-870` 的 compatibility alignment evidence 准备清晰输入。

## 7. Development Verification

1. `pnpm exec vitest run packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm exec vitest run packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `pnpm exec vitest run packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`
4. `pnpm exec vitest run packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 9. 执行记录

1. 2026-04-14：任务创建，状态初始化为 `planned`。
2. 2026-04-14：`sprint-001` 已在 clean `CR-001` 后完成 closeout，当前任务切换为 `in_progress`，并将 `sprint-002` 激活为新的 primary execution surface；下一步先本地预留 `CR-001`，再开始 failure-path coverage implementation。
3. 2026-04-14：已为 `Codex / Claude Code / GitHub Copilot` 的 `cli_exec` adapter 补齐 adapter-authored launch truth 回填逻辑，保证 exec runner 即使未显式带回 `launchDiagnostics`，returned execution result 与 thrown failure details 仍会投影 `selectedEntrypoint / shellWrapped / processTreePolicy`；shared runtime timeout/abort tests 与 adapter smoke tests 已同步扩展到统一 failure-path vocabulary，focused suites、`pnpm run build` 与 `pnpm run test:packages` 已在同窗通过，当前任务完成。

## 10. 产出

1. `packages/adapters/codex/src/codex-agent-adapter.ts`
2. `packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`
3. `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
4. `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`
5. `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`
6. `packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`
7. `packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts`
