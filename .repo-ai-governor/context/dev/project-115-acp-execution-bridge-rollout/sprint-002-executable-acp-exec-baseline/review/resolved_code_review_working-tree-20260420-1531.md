# Code Review: sprint-002 executable acp_exec baseline delegated recheck round 6

- Status: resolved
- Date: 2026-04-20
- Reviewer: AI-Agent
- Task: `CR-006`
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
1. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-acp-execution-state-store.ts`
2. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-acp-session-runtime.ts`
3. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`
4. `/Users/jimmydaddy/study/ai-governor/apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts`
5. `/Users/jimmydaddy/study/ai-governor/apps/cli/test/runtime/cli-acp-session-runtime.test.ts`

## 2. Findings
### 2.1 [P2] Process/execution-local cancel lookup is polluted by retained completed turns
- 位置: `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-acp-execution-state-store.ts`
- 问题描述: `findInvocationState()` 当前对 process/execution-local request shape 会把 store 里所有匹配 `processId/executionId` 的 state 都纳入唯一性判断，而 completed replay retention 仍会把已完成 turn 保留在 session-owned store 中。结果是“前一个 stage 已完成但仍 retained，后一个 stage 是唯一 live invocation”这一真实路径下，unscoped cancel 会因为匹配到两个 state 而返回 `undefined`。
- 影响: 这会让刚刚扩宽的 process/execution-local cancel lookup 在带 retained completed history 的真实长会话里重新失效，live stage 会继续跑完，不能被本地 abort。
- 建议: 在 unscoped cancel lookup 中明确排除 retained completed state，或者优先只在 live/cancellable candidates 上做唯一性判定，并补上“retained completed + unique live invocation”回归测试。

## 3. Notes
1. 这是一条基于真实复现路径的 risk-based finding，不是理论上的低概率担忧；它直接来自 round-6 reviewer 对 retained replay 与 broader cancel lookup 联动分支的复核。
2. reviewer 本轮没有再报告 round-5 已修复的 cancel ACK lifecycle race 或 stage/process-local lookup truth gap，说明范围已经缩到 retained completed state 与 unscoped cancel 的交叉点。

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
   - 证据：process/execution-local cancel lookup 先前确实会把 retained completed state 一起计入唯一性判断，所以“一个 retained completed + 一个唯一 live stage”会被误判成 ambiguous lookup 并落回 `acknowledged: false`。
   - 处理：接受，修复方向定为“unscoped cancel lookup 只在 live/cancellable candidate 上做唯一性判定，并新增 retained completed + unique live invocation regression coverage”。

### 验证命令
1. `pnpm vitest run apps/cli/test/runtime/cli-acp-session-runtime.test.ts apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm exec tsc -p tsconfig.json --noEmit`（通过）
3. `pnpm run build`（通过）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-20）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/cli-acp-execution-state-store.ts`、`apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts`
   - 验证：`pnpm vitest run apps/cli/test/runtime/cli-acp-session-runtime.test.ts apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm exec tsc -p tsconfig.json --noEmit`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：process/execution-local cancel lookup 现在会显式忽略 retained completed turn，只在 live/cancellable candidate 上判断唯一性；新增 retained completed + unique live invocation regression test，确保真实长会话路径不会再被 completed history 污染。

## 处置结果与剩余风险

1. CR-006 的 accepted finding 已完成修复，retained completed state 与 broader cancel lookup 的交叉污染路径已经被回归测试覆盖。
2. 当前这轮 `resolved` 之后没有新的 blocker 记录；下一步只需再走一轮 fresh delegated review，确认 sprint-002 是否已 reviewer-clean。
