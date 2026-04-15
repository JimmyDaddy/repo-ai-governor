# TK-867 split probe invoke preserved-fact assertions and fallback entrypoint projection coverage onto the shared harness

- Status: completed
- Date: 2026-04-14
- Owner: AI-Agent
- Priority: P1
- Project: `project-102-cli-exec-launch-authoring-contract-tests-rollout`
- Sprint: `sprint-001-launch-authoring-contract-tests-rollout`

## 1. 任务目标

把 probe/invoke preserved-fact split 与 fallback entrypoint projection coverage 纳入 shared harness，避免 launch-authoring truth 在 failure-path 中再次漂移。

## 2. Depends On

1. `TK-857`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/adapter-authored-launch-plan-ownership-and-contract-tests.md`

## 3. 预期产物

1. shared harness coverage plan for probe/invoke split
2. fallback entrypoint projection coverage boundary
3. synced task ledger once activation begins

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-102-cli-exec-launch-authoring-contract-tests-rollout/sprint-001-launch-authoring-contract-tests-rollout/tasks/TK-857-implement-cli-exec-launch-authoring-contract-tests-rollout-baseline.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/adapter-authored-launch-plan-ownership-and-contract-tests.md`
3. `.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/plan.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/cli-exec-adapter-launch-authoring-contract-tests-technical-solution.md`

## 6. 实施计划

1. 将 probe/invoke preserved-fact split 固定到 shared harness，而不是散落在 adapter-local 断言中。
2. 为 fallback resolved entrypoint projection 建立独立 coverage boundary。
3. 激活时为 local `CR-001` 提供清晰的 harness-level review scope。

## 7. Development Verification

1. `pnpm exec vitest run packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-14：任务创建，状态初始化为 `planned`。
2. 2026-04-14：已把 probe launch truth projection、invoke launch truth projection 与 fallback entrypoint projection 收敛到 shared harness vocabulary，并补上 Codex CLI probe 的 `requestCancellationMode` ownership coverage；focused suites、`pnpm run build` 与 `pnpm run test:packages` 已在同窗通过，当前任务完成。

## 10. 产出

1. `test/native-cli-exec-launch-authoring-harness.ts`
2. `packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts`
3. `packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`
4. `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`
5. `packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`
