# Code Review: sprint-002 executable acp_exec baseline delegated recheck round 4

- Status: resolved
- Date: 2026-04-20
- Reviewer: AI-Agent
- Task: `CR-004`
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
1. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`
2. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-acp-execution-state-store.ts`
3. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-acp-session-runtime.ts`
4. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-acp-host-protocol.ts`
5. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-acp-prompt-turn-runtime.ts`
6. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-acp-host-operation-runtime.ts`
7. `/Users/jimmydaddy/study/ai-governor/apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts`
8. `/Users/jimmydaddy/study/ai-governor/apps/cli/test/runtime/cli-acp-session-runtime.test.ts`
9. `/Users/jimmydaddy/study/ai-governor/apps/cli/test/runtime/adapter-routing-runtime.test.ts`
10. `/Users/jimmydaddy/study/ai-governor/apps/cli/test/runtime/agent-onboarding-runtime.test.ts`

## 2. Findings
### 2.1 [P1] Stream-first retry replays the stale failed ACP turn
- 位置: `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`
- 问题描述: `streamPromptTurn()` 在没有 live execution 时会直接回放 terminal buffer 并返回，但 failed/cancelled turn 的失败态只会在 `invokePromptTurn()` 入口重置。结果是同 key turn 一旦经历 cancellation/failure，后续如果先走 `streamEvents()` 作为 retry attach，就会先消费旧的 `FAILED` 终态并退出，而不会附着到新的执行。
- 影响: 这会打穿 sprint-002 `invoke/stream shared turn retry without stale terminal replay` 的契约，stream-first retry 会在失败后被旧终态短路。
- 建议: 让 stream path 在 failed/cancelled turn 后也进入 fresh retry 语义，或者只允许 completed terminal replay，并补上 `cancel -> streamEvents -> invokeStage` 的回归测试。

### 2.2 [P2] Completed retention compaction never evicts invocation keys from the session-owned state store
- 位置: `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`
- 问题描述: 当前 retention compaction 只会清空 aged-out completed turn 的 payload/buffer，但不会把 invocation key 从 `CliAcpExecutionStateStore` 中移除。由于 ACP protocol instance 会在长会话中复用，这意味着每个 unique invocation key 仍然会在 session-owned store 中永久占位。
- 影响: payload retention 虽然被压缩了，但 state-cardinality 仍然会随着 unique completed turns 单调增长，长期会话下依旧存在不可控的 state accumulation 风险。
- 建议: 在 aged-out completed turn 超过 retention limit 时，显式从 session-owned invocation store 驱逐对应 key，并补一个 `>32` turn cleanup 的 targeted regression test。

## 3. Notes
1. 两条 finding 都来自 round-4 fresh reviewer 的 working-tree 复核；其中 `2.1` 是直接阻断 sprint-002 边界交付的 correctness blocker，`2.2` 是长期会话下的 retention/cardinality 风险。
2. reviewer 没有再报告前几轮已经修复的 retry reset、probe truth、i18n 或 success-path replay regression，说明 round-4 的注意力已经收敛到剩余 retry/retention 边界。

## 4. Verification
1. reviewer 复用了当前窗口的绿色证据：`pnpm vitest run apps/cli/test/runtime/cli-acp-session-runtime.test.ts apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`
2. reviewer 复用了当前窗口的绿色证据：`pnpm exec tsc -p tsconfig.json --noEmit`
3. reviewer 复用了当前窗口的绿色证据：`pnpm run build`
4. reviewer 复用了当前窗口的绿色证据：`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 复核结论（2026-04-20）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`streamPromptTurn()` 的 terminal replay 分支确实会在 failed/cancelled turn 后直接消费旧 buffer 并返回，而 failed-state reset 只存在于 `invokePromptTurn()`；这会让 stream-first retry 在 retry attach 前就被旧 `FAILED` 终态短路。
   - 处理：接受，修复方向定为“failed/cancelled turn 的 stream path 也进入 fresh retry 语义，并新增 `cancel -> streamEvents -> invokeStage` regression coverage”。
2. `2.2`
   - 判定：**认可**
   - 证据：completed retention trim 当前只清空 aged-out state 的 payload/buffer，但没有触达 `CliAcpExecutionStateStore` 的 key 生命周期；长会话下 unique completed turns 仍会在 session-owned store 中单调增长。
   - 处理：接受，修复方向定为“aged-out completed turn 从 session-owned invocation store 显式驱逐，并新增 `>32` unique turns cleanup regression coverage”。

### 验证命令
1. `pnpm vitest run apps/cli/test/runtime/cli-acp-session-runtime.test.ts apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm exec tsc -p tsconfig.json --noEmit`（通过）
3. `pnpm run build`（通过）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-20）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`、`apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts`
   - 验证：`pnpm vitest run apps/cli/test/runtime/cli-acp-session-runtime.test.ts apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm exec tsc -p tsconfig.json --noEmit`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：stream path 现在在 failed/cancelled terminal 后也会进入 fresh retry 语义，只保留 completed terminal replay；同时新增 `cancel -> streamEvents -> invokeStage` regression coverage，保证 stream-first retry 不再被 stale failed event 短路。
2. `2.2`：已完成
   - 变更文件：`apps/cli/src/runtime/cli-acp-execution-state-store.ts`、`apps/cli/src/runtime/cli-acp-session-runtime.ts`、`apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`、`apps/cli/src/runtime/cli-acp-host-protocol.ts`、`apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts`
   - 验证：`pnpm vitest run apps/cli/test/runtime/cli-acp-session-runtime.test.ts apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm exec tsc -p tsconfig.json --noEmit`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：aged-out completed invocation 现在不仅会被 compact，还会从 session-owned invocation store 显式驱逐；新增 `>32` unique turns cleanup regression coverage，防止 payload bounded 但 key cardinality 无界增长。

## 处置结果与剩余风险

1. CR-004 的两条 accepted findings 已完成修复，stream-first retry 与 completed retention/cardinality 边界已经补齐对应回归覆盖。
2. 当前这轮 `resolved` 之后没有新增 blocker，但 sprint-002 仍需再走一轮 fresh delegated review，只有 reviewer 明确返回“no actionable findings”后才允许进入 boundary gate。
