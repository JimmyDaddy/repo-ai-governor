# Code Review: working-tree-20260420-1238

- Status: resolved
- Date: 2026-04-20
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: sprint delegated review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`

## 1. Review Scope

1. `apps/cli/src/runtime/cli-acp-host-protocol.ts`
2. `apps/cli/src/runtime/cli-acp-capability-discovery-runtime.ts`
3. `apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`
4. `apps/cli/src/runtime/cli-acp-session-runtime.ts`
5. `apps/cli/src/runtime/cli-acp-prompt-turn-runtime.ts`
6. `apps/cli/src/runtime/cli-acp-host-operation-runtime.ts`
7. `apps/cli/src/runtime/cli-acp-execution-state-store.ts`
8. `apps/cli/src/types/interfaces/cli-acp-host-runtime.interface.ts`
9. `apps/cli/test/runtime/cli-acp-session-runtime.test.ts`
10. `.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-001-contract-and-runtime-decomposition/**`

## 2. Findings

### 2.1 [P1] shared invocation store stops being shared after the second lookup

- 位置: `apps/cli/src/runtime/cli-acp-execution-state-store.ts:34`
- 问题描述: repeated `ensureInvocationState()` 原本会复制并替换 existing row，导致 shared mutable row 的对象别名失稳。
- 影响: shared invocation baseline 会在后续真实 `invokeStage / streamEvents` attach 时丢失 canonical row mutation visibility。
- 处理结论: **已修复**。store 现在在命中 existing row 时只原地刷新 `updatedAt` 并返回同一对象引用。

### 2.2 [P2] session runtime test misses the shared-state aliasing contract

- 位置: `apps/cli/test/runtime/cli-acp-session-runtime.test.ts:5`
- 问题描述: 原测试没有直接验证 shared-state aliasing 与 mutation visibility。
- 影响: store aliasing regression 可以在 targeted runtime test 仍为绿色时漏检。
- 处理结论: **已修复**。测试现在同时覆盖 invoke-first 与 stream-first 两种顺序，并直接断言 repeated ensure 返回同一 shared object、后续 mutation 对另一侧可见。

## 3. Notes

1. 本轮没有发现需要继续阻塞 sprint-001 closeout 的治理漂移问题；task-ledger、sprint status 与 review lifecycle 均保持同步。
2. 修复仍然保持 ACP fail-closed posture，不把 `acp_exec` 提前解释为 executable production path；当前只把 shared invocation baseline 修正到可安全 handoff 的状态。

## 4. Verification

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/cli-acp-session-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过，2 files / 14 tests）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过，4 files / 88 tests）
3. `pnpm run build`（通过）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过，156 files / 1187 tests）
5. `pnpm run check`（通过）

## 5. 复核结论（2026-04-20）

1. 复核确认本轮 2 条 findings 均有效，且都在同窗口被接受并完成修复。
2. `2.1` 的风险点已经通过 stable shared row reference 消除；shared invocation store 不再在 repeated ensure 时替换 canonical row。
3. `2.2` 的测试缺口已经通过 invoke-first / stream-first 双顺序回归覆盖补齐，当前 sprint-001 handoff claim 已有直接自动化保护。

## 6. 修复执行记录（2026-04-20）

1. 在 `apps/cli/src/runtime/cli-acp-execution-state-store.ts` 中移除了 repeated ensure 分支的对象克隆写回，改为只更新同一 shared row 的 `updatedAt`。
2. 在 `apps/cli/test/runtime/cli-acp-session-runtime.test.ts` 中补充 aliasing regression coverage，分别验证 invoke-first 与 stream-first 两个顺序下 shared state 的对象同一性与 mutation visibility。
3. 修复后 targeted runtime vitest、project-115 baseline vitest、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 与 `pnpm run check` 全部通过，当前 round 可推进为 `resolved`。
