# Code Review: sprint-002 executable acp_exec baseline delegated recheck round 7

- Status: resolved
- Date: 2026-04-20
- Reviewer: AI-Agent
- Task: `CR-007`
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
1. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/session-main-supervisor-runtime.ts`
2. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`
3. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-acp-execution-state-store.ts`
4. `/Users/jimmydaddy/study/ai-governor/apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
5. `/Users/jimmydaddy/study/ai-governor/apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts`

## 2. Findings
### 2.1 [P1] ACP pre-dispatch relay executes on the wrong surface
- 位置: `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/session-main-supervisor-runtime.ts`
- 问题描述: supervisor 在 `dispatchStage()` 完成真实 surface 选择前，就对 primary surface 启动 `relayProtocolStreamEvents()`。当 primary surface 走 `acp_exec` 且后续 invoke 失败并切换到 fallback surface 时，ACP fixture stream 会先被投影到 host stream，造成“真正 selectedSurface 尚未成立，但 ACP primary token/lifecycle 已经泄漏”的错误表象。
- 影响: 这会破坏 sprint-002 对 ACP execution ownership / selected-surface truth 的边界约束，使 fallback path 的 host-facing stream 先暴露错误 surface 的事件。
- 建议: 对 `acp_exec` relay 改为“先 dispatch，再按真实 selectedSurface 做 stream attach / replay”，并补 direct-answer regression coverage；role-delegate path 也需要应用同一 gating 规则。

### 2.2 [P2] cancel 会过早丢弃 state，导致晚到的同键 stream attach 变成隐式 retry
- 位置: `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`
- 问题描述: 当前 cancel ACK 一返回就会删除 transport execution map 并立刻 `forgetInvocationState()`。这会让后续 `streamEvents()` 在同一 invocation key 上重新 `ensurePromptTurnExecution()`，把一个本应被动回放 cancelled/failed terminal 的 attach 路径变成新的 ACP execution。
- 影响: host-facing late stream attach 会错误地产生隐式 retry；同时 process/execution-local cancel lookup 会继续把 retained failed turn 当成 live candidate，污染后续 unscoped cancel resolution。
- 建议: cancel 后保留原 execution/state 直到 terminal failure 真正落盘，再让 `streamEvents()` 对 failed terminal 走 replay-only；显式 `invokeStage()` 才负责清理 failed replay state 并启动 fresh retry，同时补 retained failed + unique live cancellation regression coverage。

## 3. Notes
1. 这两条 finding 都直接命中 sprint-002 的 ACP execution contract：一个污染 selected-surface truth，一个污染 retry/replay truth，都会让后续 sprint-003 的 bridge hardening 建立在不稳定边界上。
2. reviewer 本轮没有再报告 round-6 修复过的 retained completed cancel pollution，说明问题已经进一步收敛到 ACP relay gating 与 cancel replay contract。

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
   - 证据：direct-answer / role-delegate path 在 route dispatch 前就会按 primary surface 提前 attach relay；当 `acp_exec` stream 成为真实 execution 后，这个时序会在 fallback 仍未成立时泄漏错误 surface 的 token/lifecycle。
   - 处理：接受，修复方向定为“`acp_exec` relay 只在 dispatch 得到真实 selectedSurface 后才 attach/replay”，并补 direct-answer fallback regression coverage。
2. `2.2`
   - 判定：**认可**
   - 证据：cancel ACK 当前会立即把 execution/state 从 transport/session lookup 面移除，导致晚到的同键 `streamEvents()` 重新开 turn；同时 retained failed state 若不被取消 lookup 排除，会让 unscoped cancel 再次退化成 ambiguous match。
   - 处理：接受，修复方向定为“cancel 后保留 failed terminal 供 stream replay，显式 invoke 才负责 fresh retry”，并补 retained failed replay / cancel lookup regression coverage。

### 验证命令
1. `pnpm vitest run apps/cli/test/runtime/cli-acp-session-runtime.test.ts apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm exec tsc -p tsconfig.json --noEmit`（通过）
3. `pnpm run build`（通过）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-20）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/session-main-supervisor-runtime.ts`、`apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
   - 验证：`pnpm vitest run apps/cli/test/runtime/cli-acp-session-runtime.test.ts apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm exec tsc -p tsconfig.json --noEmit`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：`acp_exec` surface 的 relay 现在会等到 dispatch 结束并拿到真实 `selectedSurface` 后再做 attach / replay，因此 direct-answer fallback 不会再先把 ACP primary token 泄漏到 host-facing stream。
2. `2.2`：已完成
   - 变更文件：`apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`、`apps/cli/src/runtime/cli-acp-execution-state-store.ts`、`apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts`
   - 验证：`pnpm vitest run apps/cli/test/runtime/cli-acp-session-runtime.test.ts apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm exec tsc -p tsconfig.json --noEmit`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：cancel ACK 不再提前忘掉 live state；late `streamEvents()` 现在会回放 failed terminal，而显式 `invokeStage()` 会等待 cancelled execution settle 后清理 failed replay state 并启动 fresh retry。process/execution-local cancel lookup 也会显式忽略 retained failed terminal，避免再次污染 live cancel resolution。

## 处置结果与剩余风险

1. CR-007 的两条 accepted finding 已全部修复，ACP relay 时序与 cancel replay/retry contract 现在都由回归测试覆盖。
2. 当前 round-7 已具备推进为 `resolved` 的条件；下一步需要继续 bootstrap 一轮 fresh delegated review，确认 sprint-002 是否已 reviewer-clean。
