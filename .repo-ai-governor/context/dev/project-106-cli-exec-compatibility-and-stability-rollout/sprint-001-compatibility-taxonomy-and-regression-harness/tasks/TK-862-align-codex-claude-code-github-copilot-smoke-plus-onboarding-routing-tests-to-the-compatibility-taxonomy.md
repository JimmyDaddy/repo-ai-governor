# TK-862 align codex claude-code github-copilot smoke plus onboarding routing tests to the compatibility taxonomy

- Status: completed
- Date: 2026-04-14
- Owner: AI-Agent
- Priority: P1
- Project: `project-106-cli-exec-compatibility-and-stability-rollout`
- Sprint: `sprint-001-compatibility-taxonomy-and-regression-harness`

## 1. 任务目标

将 `Codex / Claude Code / GitHub Copilot` smoke 与 onboarding/routing 测试对齐到同一 compatibility taxonomy，避免 baseline 只停留在 shared runtime owner 侧。

## 2. Depends On

1. `TK-861`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`

## 3. 预期产物

1. cross-adapter smoke/onboarding/routing alignment plan
2. compatibility evidence mapping across adapter and CLI surfaces
3. synced task ledger once activation begins

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/sprint-001-compatibility-taxonomy-and-regression-harness/tasks/TK-861-establish-native-cli-exec-scenario-class-compatibility-harness-and-preserved-facts-assertions.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-compatibility-and-stability-productization.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-098-cli-exec-runtime-rollout/plan.md`
2. `.repo-ai-governor/draft/cli-exec-five-direction-dependency-and-sequencing-analysis-technical-solution.md`

## 6. 实施计划

1. 将 adapter smoke、onboarding runtime 与 adapter routing surfaces 映射到统一 compatibility taxonomy。
2. 固定 adapter slice 与 runtime foundation 之间的 evidence readback，避免未来 regression 只在单一 surface 留痕。
3. 激活时为 local `CR-001` 提供明确的 cross-adapter review boundary。

## 7. Development Verification

1. `pnpm exec vitest run packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts`
2. `pnpm exec vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/connect-phase2.integration.test.ts`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 9. 执行记录

1. 2026-04-14：任务创建，状态初始化为 `planned`。
2. 2026-04-14：任务切换为 `in_progress`，开始把 Codex / Claude Code / GitHub Copilot 的 malformed-probe / malformed-invoke preserved-facts 断言接到同一 compatibility harness。
3. 2026-04-14：新增 onboarding / verification consumer-side preserved-facts checks，并补跑 `adapter-routing-runtime` 与 `connect-phase2` 集成切片，确认 cross-surface baseline 未回退。
4. 2026-04-14：已补齐 reviewer round 1 接受的 3 个 coverage gaps，并在 `CR-002` clean recheck 后确认当前 cross-surface alignment 无新的 actionable finding；当前任务推进为 `completed`。

## 10. 产出

1. `packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`
2. `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`
3. `packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`
4. `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
5. `apps/cli/test/runtime/adapter-verification-runtime.test.ts`
