# TK-861 establish native cli_exec scenario-class compatibility harness and preserved-facts assertions

- Status: completed
- Date: 2026-04-14
- Owner: AI-Agent
- Priority: P1
- Project: `project-106-cli-exec-compatibility-and-stability-rollout`
- Sprint: `sprint-001-compatibility-taxonomy-and-regression-harness`

## 1. 任务目标

建立 native `cli_exec` scenario-class compatibility harness 与 preserved-facts assertions，作为 compatibility/stability rollout 的基础实现面。

## 2. Depends On

1. `DA-842`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-compatibility-and-stability-productization.md`

## 3. 预期产物

1. compatibility scenario-class harness implementation boundary
2. preserved-facts assertion matrix and execution notes
3. synced task ledger once activation begins

## 4. Required Inputs

1. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
2. `.repo-ai-governor/context/dev/project-100-cli-exec-compatibility-and-stability-promotion/sprint-001-formalization-and-promotion-cutover/tasks/DA-842-cli-exec-compatibility-and-stability-promotion-cutover.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-compatibility-and-stability-productization.md`
4. `.repo-ai-governor/context/dev/project-098-cli-exec-runtime-rollout/project-098-cli-exec-runtime-rollout-completion-audit-summary.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/cli-exec-compatibility-and-stability-productization-technical-solution.md`
2. `.repo-ai-governor/context/dev/project-099-cli-exec-compatibility-and-stability-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_cli-exec-compatibility-and-stability-productization.md`

## 6. 实施计划

1. 将 scenario class 与 required preserved facts 拆成可执行的 harness 与 assertion entrypoint。
2. 固定 shared runtime、adapter projection 与 partial-output / terminate-phase 语义的回归断言面。
3. 激活时同步 task ledger、checklist、tasks.csv，并为后续 local `CR-001` 留出清晰 review boundary。

## 7. Development Verification

1. `pnpm exec vitest run packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 9. 执行记录

1. 2026-04-14：任务创建，状态初始化为 `planned`。
2. 2026-04-14：`project-106 / sprint-001` 激活，当前任务切换为 `in_progress`，开始收敛 scenario-class harness 与 preserved-facts assertion entrypoint。
3. 2026-04-14：新增 shared `test/native-cli-exec-compatibility-harness.ts`，将 scenario class x preserved-facts matrix 固化为可复用断言入口，并补齐 shared runtime 的 `spawn_failed / signal_exit / timeout_soft_terminated / timeout_hard_terminated / abort_soft_terminated / abort_hard_terminated` 覆盖。
4. 2026-04-14：focused compatibility tests、`pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 已通过，当前实现面进入 sprint-level `CR-001` 前置状态。
5. 2026-04-14：`CR-001` 已完成修复并 resolved，`CR-002` clean recheck 无 actionable finding；当前任务边界已满足 sprint-001 closeout 条件并推进为 `completed`。

## 10. 产出

1. `test/native-cli-exec-compatibility-harness.ts`
2. `packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts`
