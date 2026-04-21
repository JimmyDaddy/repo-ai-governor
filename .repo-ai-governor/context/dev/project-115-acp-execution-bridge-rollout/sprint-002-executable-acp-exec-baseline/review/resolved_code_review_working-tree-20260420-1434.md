# Code Review: sprint-002 executable acp_exec baseline delegated recheck round 3

- Status: resolved
- Date: 2026-04-20
- Reviewer: AI-Agent
- Task: `CR-003`
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
### 2.1 [P1] Stream-first completed ACP turns can be re-executed after success-path cache eviction
- 位置: `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`
- 问题描述: 当前 cleanup 方案把 successful execution 从 active cache 中释放掉以后，只剩 `invokePromptTurn()` 自己写入的 `invocationState.invokeResultPromise` 可供 completed replay 复用。但如果唯一 owning call 是 `streamPromptTurn()`，它不会把 `execution.resultPromise` 挂回 `invocationState`，因此 `streamEvents() -> completed -> later invokeStage()` 会失去 completed turn 复用能力并再次启动同 key execution。
- 影响: 这会直接打破 sprint-002 `invoke/stream shared turn without double execution` 的核心契约，未来真实 ACP prompt turn 一旦有 side effects 就可能被重复执行。
- 建议: 让 stream-owned execution 也把 completed `resultPromise` 写回 invocation state，或单独持久化 completed invoke result，并增加 `streamEvents() -> completion -> invokeStage()` 的回归测试。

## 3. Notes
1. 本轮 reviewer 明确指出：当前问题不是规则层面的 i18n/probe/cleanup 漂移，而是 shared-turn single-execution contract 被新的 cleanup patch 回归打穿。
2. reviewer 仍提到了 `acknowledged: false` 的 unmapped cancel 分支缺少定向测试，但只把它列为 residual risk，不是当前 blocker。

## 4. Verification
1. reviewer 复用了当前窗口的绿色证据：`pnpm vitest run apps/cli/test/runtime/cli-acp-session-runtime.test.ts apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`
2. reviewer 复用了当前窗口的绿色证据：`pnpm exec tsc -p tsconfig.json --noEmit`
3. reviewer 复用了当前窗口的绿色证据：`pnpm run build`
4. reviewer 还在 built artifact 上复现了 `streamEvents() -> invokeStage()` 返回 `executionStarts: 2` 的 stream-first double-execution。

## 复核结论（2026-04-20）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：success-path cleanup 之后，completed replay 只能依赖 `invocationState.invokeResultPromise`，而 stream-owned execution path 确实没有写回这一字段，所以 `streamEvents() -> completed -> later invokeStage()` 会丢失复用依据。
   - 处理：接受，修复方向定为“stream-owned execution 也回写 completed result promise，并新增 stream-first completion -> invokeStage regression coverage”。

### 验证命令
1. `pnpm vitest run apps/cli/test/runtime/cli-acp-session-runtime.test.ts apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm exec tsc -p tsconfig.json --noEmit`（通过）
3. `pnpm run build`（通过）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-20）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`、`apps/cli/src/runtime/cli-acp-prompt-turn-runtime.ts`、`apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts`
   - 验证：`pnpm vitest run apps/cli/test/runtime/cli-acp-session-runtime.test.ts apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm exec tsc -p tsconfig.json --noEmit`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：stream-owned execution 现在也会把 completed `resultPromise` 写回 `invocationState`，所以 success-path active cache eviction 之后仍能复用已完成 turn；另外新增 stream-first completion -> later invokeStage regression test，防止同 key ACP execution 再次启动。

## 处置结果与剩余风险

1. CR-003 的 accepted finding 已完成修复，`streamEvents() -> completed -> later invokeStage()` 不会再因为 success-path cache eviction 丢失 completed replay 依据。
2. 当前剩余风险仍是 reviewer 提到的低优先级 coverage note：`acknowledged: false` 的 unmapped cancel 分支尚未单独做 targeted test；该项继续保持为非阻断 follow-up 线索。
