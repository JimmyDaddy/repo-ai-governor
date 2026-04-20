# Code Review: sprint-002 executable acp_exec baseline delegated recheck round 2

- Status: resolved
- Date: 2026-04-20
- Reviewer: AI-Agent
- Task: `CR-002`
- Review Type: delegated sprint recheck
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-acp-host-protocol.ts`
2. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`
3. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-acp-session-runtime.ts`
4. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-acp-prompt-turn-runtime.ts`
5. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-acp-host-operation-runtime.ts`
6. `/Users/jimmydaddy/study/ai-governor/apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts`
7. `/Users/jimmydaddy/study/ai-governor/apps/cli/test/runtime/adapter-routing-runtime.test.ts`
8. `/Users/jimmydaddy/study/ai-governor/apps/cli/test/runtime/adapter-verification-runtime.test.ts`
9. `/Users/jimmydaddy/study/ai-governor/apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts`
10. `/Users/jimmydaddy/study/ai-governor/apps/cli/test/runtime/agent-onboarding-runtime.test.ts`

## 2. Findings
### 2.1 [P2] Successful ACP turns never leave the shared protocol cache
- 位置: `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`
- 问题描述: 当前 `ensurePromptTurnExecution()` 会把每个 invocation key 的 execution 放进 `promptTurnExecutionByInvocationKey`，但 `finishPromptTurnExecution()` 只在 cancelled/failed 时删除条目。结果是成功完成的 ACP turn 也会在缓存协议实例里长期保留，继续持有 completed `resultPromise` 和 execution metadata。
- 影响: 在长生命周期 protocol instance 中，成功态 execution 会持续累积，形成 cleanup boundary 缺失的内存/状态保留风险；而这轮 sprint 本身又已经通过 routing/runtime 测试固定了 protocol instance reuse。
- 建议: 在保证 late stream replay 与 completed invoke idempotence 的前提下，释放 successful execution cache，或者引入明确的 bounded retention/release 策略。

## 3. Notes
1. 本轮 reviewer 没有继续报告 `CR-001` 已修复的 retry reset、probe cancellation truth 或 i18n 问题；当前唯一 actionable finding 收敛到 success-path cleanup。
2. reviewer 还提到了“cancel request 无法映射 live invocation 时，`acknowledged: false` 分支缺少定向测试”，但这被标为 residual risk/missing-test note，而非本轮 blocker。

## 4. Verification
1. reviewer 复查了 `resolved_code_review_working-tree-20260420-1333.md` 与当前 working-tree diff。
2. reviewer 复用了当前窗口的绿色证据：`pnpm vitest run apps/cli/test/runtime/cli-acp-session-runtime.test.ts apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`
3. reviewer 复用了当前窗口的绿色证据：`pnpm exec tsc -p tsconfig.json --noEmit`
4. reviewer 复用了当前窗口的绿色证据：`pnpm run build`
5. reviewer 复用了当前窗口的绿色证据：`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 复核结论（2026-04-20）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`finishPromptTurnExecution()` 的确只清理 cancelled/failed 分支，successful ACP turn 仍保留在 `promptTurnExecutionByInvocationKey` 中；而 sprint-002 自己的 routing/runtime tests 也明确依赖 protocol instance reuse。
   - 处理：接受，修复方向定为“success-path active cache eviction + completed invoke/stream replay fallback + bounded completed-retention compaction”，避免新的 cleanup hole。

### 验证命令
1. `pnpm vitest run apps/cli/test/runtime/cli-acp-session-runtime.test.ts apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm exec tsc -p tsconfig.json --noEmit`（通过）
3. `pnpm run build`（通过）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-20）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`、`apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts`
   - 验证：`pnpm vitest run apps/cli/test/runtime/cli-acp-session-runtime.test.ts apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm exec tsc -p tsconfig.json --noEmit`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：successful ACP execution 现在会从 active shared cache 中释放，同时保留 completed invoke/result replay；另外新增 bounded completed-retention compaction，避免长会话无限持有 completed execution state。

## 处置结果与剩余风险

1. CR-002 的 accepted finding 已完成修复，success-path cleanup 不再依赖长期驻留的 active execution cache。
2. 当前剩余风险只剩 reviewer 提到的低优先级 coverage note：`acknowledged: false` 的 unmapped cancel 分支还没有单独的 targeted test；这被记录为 follow-up coverage 线索，不阻断本轮 `resolved`。
