# Code Review: sprint-002 executable acp_exec baseline delegated recheck round 5

- Status: resolved
- Date: 2026-04-20
- Reviewer: AI-Agent
- Task: `CR-005`
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
4. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-acp-host-operation-runtime.ts`
5. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-acp-host-protocol.ts`
6. `/Users/jimmydaddy/study/ai-governor/apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts`
7. `/Users/jimmydaddy/study/ai-governor/apps/cli/test/runtime/cli-acp-session-runtime.test.ts`
8. `/Users/jimmydaddy/study/ai-governor/apps/cli/test/runtime/adapter-routing-runtime.test.ts`
9. `/Users/jimmydaddy/study/ai-governor/apps/cli/test/runtime/agent-onboarding-runtime.test.ts`

## 2. Findings
### 2.1 [P2] Cancel ACK still leaves same-key retries attached to the cancelled execution
- 位置: `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`
- 问题描述: `cancelPromptTurn()` 在把 `execution.cancelled` 置位后就立即返回 `acknowledged: true`，但 shared invocation entry 仍然要等到旧 execution 的 `finally -> finishPromptTurnExecution()` 才会清理。结果是同 key caller 如果在收到 cancel ACK 后立刻 retry，`invokePromptTurn()` 仍有机会复用那条即将失败的旧 execution promise，而不是启动 fresh ACP turn。
- 影响: 这会让“cancel acknowledged 之后允许立即 retry”这一用户直觉失真，形成立即重试时序 race；旧 execution 的 teardown 还可能与新 retry 共享同一个 invocation lifecycle surface。
- 建议: 让 cancel ACK 与 execution/session-state 的可复用解绑同窗口完成，并补一条 cancel-then-immediate-retry regression test。

### 2.2 [P3] Advertised local-abort cancellation truth is broader than the implemented lookup boundary
- 位置: `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-acp-session-runtime.ts`
- 问题描述: probe/diagnostic surface 当前把 ACP cancellation truth 暴露为 `LOCAL_ABORT_ONLY`，但 runtime lookup 只接受同时带 `stageId` 和 `routeKey` 的 cancel request。对于只提供 `processId/executionId` 的本地 abort 请求，当前实现会直接落回 `acknowledged: false`，测试也没有覆盖这种请求形状。
- 影响: 这让对外 cancellation truth 与实际 lookup boundary 存在缝隙，至少在“唯一 live invocation”的场景下会显得过于保守或口径不清。
- 建议: 要么把 cancellation truth 明确收窄为 stage-scoped-only，要么让 process/execution-local cancel 在匹配唯一 live invocation 时可解析，并补相应的正/负向边界测试。

## 3. Notes
1. `2.1` 是时序一致性问题，`2.2` 是对外 cancellation truth 与 lookup boundary 的契约收敛问题；两者都属于 sprint-002 shared invoke/stream/cancel baseline 的剩余收口面。
2. reviewer 本轮没有再报告 round-4 已修复的 stale failed replay、retention eviction 或 payload/cardinality 问题，说明 round-5 的注意力进一步收敛到了 cancel ACK / lookup 合同。

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
   - 证据：cancel ACK 的确先于 old execution teardown 返回，而 `ensurePromptTurnExecution()` 又只按 invocation key 复用 map entry；这会让 ACK 之后的 immediate retry 仍有机会绑定旧 execution promise。
   - 处理：接受，修复方向定为“cancel ACK 同步解绑当前 execution/state 的复用资格，并以对象身份保护 old execution teardown 不反删 new retry state”。
2. `2.2`
   - 判定：**认可**
   - 证据：`findInvocationState()` 先前只接受完整的 `stageId + routeKey` 定位，确实没有覆盖 process/execution-local request shape；而 probe truth 已经宣称 ACP cancellation 属于 `LOCAL_ABORT_ONLY`。
   - 处理：接受，修复方向定为“对唯一匹配的 process/execution-local cancel 提供 lookup 支持，并增加多匹配时返回 `undefined` 的边界测试，避免过度承诺”。

### 验证命令
1. `pnpm vitest run apps/cli/test/runtime/cli-acp-session-runtime.test.ts apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm exec tsc -p tsconfig.json --noEmit`（通过）
3. `pnpm run build`（通过）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-20）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`、`apps/cli/src/runtime/cli-acp-execution-state-store.ts`、`apps/cli/src/runtime/cli-acp-session-runtime.ts`、`apps/cli/src/runtime/cli-acp-host-protocol.ts`、`apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts`
   - 验证：`pnpm vitest run apps/cli/test/runtime/cli-acp-session-runtime.test.ts apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm exec tsc -p tsconfig.json --noEmit`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：cancel ACK 现在会立即解绑当前 execution/state 的复用资格，而 old execution 的 finally 清理则改为按对象身份生效，避免 teardown 反删新 retry surface；同时新增 cancel-then-immediate-retry regression test。
2. `2.2`：已完成
   - 变更文件：`apps/cli/src/runtime/cli-acp-execution-state-store.ts`、`apps/cli/src/runtime/cli-acp-session-runtime.ts`、`apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts`、`apps/cli/test/runtime/cli-acp-session-runtime.test.ts`
   - 验证：`pnpm vitest run apps/cli/test/runtime/cli-acp-session-runtime.test.ts apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm exec tsc -p tsconfig.json --noEmit`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：cancel lookup 现在支持“process/execution 下唯一 live invocation”的 process/execution-local request shape，并增加“多匹配时返回 undefined”的边界测试，从而把 `LOCAL_ABORT_ONLY` truth 收敛到真实可回放的 runtime contract。

## 处置结果与剩余风险

1. CR-005 的两条 accepted findings 已完成修复，cancel ACK lifecycle 与 process/execution-local cancel lookup 的真实行为现在和测试证据保持一致。
2. 当前这轮 `resolved` 之后没有新增 blocker，但 sprint-002 仍需再走一轮 fresh delegated review，只有 reviewer 明确返回“no actionable findings”后才允许进入 boundary gate。
