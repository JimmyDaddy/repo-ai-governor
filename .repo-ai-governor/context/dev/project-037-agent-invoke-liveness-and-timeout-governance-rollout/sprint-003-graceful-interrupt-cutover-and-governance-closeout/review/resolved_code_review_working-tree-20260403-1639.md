# Code Review: working tree

- Status: resolved
- Date: 2026-04-03
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `.repo-ai-governor/context/completed-streams-history.md`
2. `.repo-ai-governor/context/current-context.md`
3. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/plan.md`
4. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-002-cross-adapter-liveness-rollout-and-diagnostics/plan.md`
5. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-002-cross-adapter-liveness-rollout-and-diagnostics/tasks/TK-489-align-ollama-local-model-and-long-operation-progress-protections-with-invoke-liveness-governance.md`
6. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-002-cross-adapter-liveness-rollout-and-diagnostics/tasks/checklist.md`
7. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-002-cross-adapter-liveness-rollout-and-diagnostics/tasks/tasks.csv`
8. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-003-graceful-interrupt-cutover-and-governance-closeout/plan.md`
9. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-003-graceful-interrupt-cutover-and-governance-closeout/tasks/TK-487-roll-codex-onto-shared-invoke-liveness-watchdog-graceful-interrupt-and-partial-output-preservation.md`
10. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-003-graceful-interrupt-cutover-and-governance-closeout/tasks/checklist.md`
11. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-003-graceful-interrupt-cutover-and-governance-closeout/tasks/tasks.csv`
12. `packages/adapters/local-model/src/local-model-agent-adapter.ts`
13. `packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts`

## 2. Findings
### 2.1 [P2] Retry backoff is not covered by the invoke timeout budget
- 位置: `packages/adapters/local-model/src/local-model-agent-adapter.ts:412`, `packages/adapters/local-model/src/local-model-agent-adapter.ts:930`, `packages/adapters/local-model/src/local-model-agent-adapter.ts:1463`
- 问题描述: `startExecution()` 为整次 invoke 建立了 `timeoutBudget`，并把 `timeoutSignal` 传给 `requestResponse()`；但 `requestResponse()` 在 retryable error/status 分支里仍会无条件 `await this.delayRetry(attempt)`，而 `delayRetry()` 本身不接收也不监听 timeout/abort signal。这样一来，只要本地模型 endpoint 在截止前返回一次可重试失败且 `maxRetries > 0`，调用就会在 budget 已经过期后继续停留在 backoff 甚至下一次 attempt 中，直到下一次 fetch 重新观察到 abort 才会结束。当前新增 smoke 只覆盖了 body consumption timeout，没有覆盖 retry/backoff 分支，因此这个回归不会被现有测试捕获。
- 影响: 在启用重试的本地模型配置下，invoke-liveness 会在声明的 hard timeout 之后继续保持 `running`，推迟失败/超时上报，削弱本轮宣称的 timeout budget 治理与 cutover 可信度。
- 建议: 将 timeout/upstream abort signal 贯穿到 retry sleep，并在进入 backoff 与下一次 attempt 前短路已过期的 budget；同时新增一个 “retryable failure during timeout window” 的回归测试，覆盖 timeout 在 retry/backoff 阶段触发的场景。

## 3. Notes
1. 变更涉及的 sprint/context ledger 已通过同步检查，未发现 `plan/checklist/tasks.csv/current-context` 的状态漂移。
2. 除上述问题外，本轮 diff 中未再发现新的高优先级行为回归。

## 4. Verification
1. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" /Users/jimmydaddy/Library/pnpm/pnpm vitest run packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts`（通过）
2. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" /Users/jimmydaddy/Library/pnpm/pnpm run build`（通过）
3. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" /opt/homebrew/bin/node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" /opt/homebrew/bin/node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）

## 复核结论（2026-04-03）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P2] Retry backoff is not covered by the invoke timeout budget`
   - 判定：**认可**
   - 证据：`requestResponse()` 的 retryable status/request-error 分支都会进入 `delayRetry(attempt)`，但旧实现没有接收任何 timeout/upstream abort signal，因此 invoke timeout budget 若在 backoff 期间到期，流程会继续停留在 sleep 里，直到下一次 fetch 才重新观察到 abort。
   - 处理：将 retry backoff 改为 signal-aware，并补一个“timeout 在 retry/backoff 阶段触发”的定向 smoke 覆盖。

### 验证命令
1. `git status --short`（通过）
2. `git diff --name-only --diff-filter=ACMR`（通过）

## 修复执行记录（2026-04-03）

1. `2.1 [P2] Retry backoff is not covered by the invoke timeout budget`：已完成
   - 变更文件：`packages/adapters/local-model/src/local-model-agent-adapter.ts`、`packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts`
   - 验证：`PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" pnpm vitest run packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts`（通过）；`PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" pnpm run build`（通过）
   - 说明：`delayRetry()` 现在会监听 invoke timeout/upstream abort signal；当 budget 在 retry/backoff 阶段到期时，sleep 会立即中断并返回统一 timeout 终态，不再拖到下一次 fetch attempt。新增 smoke 也覆盖了“retryable failure -> backoff -> timeout budget 触发”的分支。
