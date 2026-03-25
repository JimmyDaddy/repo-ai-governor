# Code Review: TK-140 Working Tree Follow-up

- Status: resolved
- Date: 2026-03-25
- Reviewer: AI-Agent
- Task: `TK-140`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops/sprint-001-remote-provider-real-invocation-baseline/tasks/TK-140-cross-provider-adapter-operations-and-route-runner-truthfulness-hardening.md`
  - `.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops/sprint-001-remote-provider-real-invocation-baseline/tasks/DA-140-cross-provider-adapter-operations-and-route-runner-truthfulness-hardening.md`

## 1. Review Scope
1. `packages/adapter-sdk/src/agent-cli-exec-operations-runtime.ts`
2. `packages/adapter-sdk/src/constants/agent-cli-exec.constant.ts`
3. `packages/adapter-sdk/src/types/interfaces/agent-cli-exec.interface.ts`
4. `packages/adapters/codex/src/codex-agent-adapter.ts`
5. `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`
6. `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
7. `apps/cli/src/runtime/adapter-diagnostics-runtime.ts`
8. `packages/adapter-sdk/test/agent-cli-exec-operations-runtime.unit.test.ts`
9. `packages/adapters/*/test/*.smoke.test.ts`
10. `apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts`

## 2. Findings
### 2.1 [P1] Shared retry loop can overrun declared timeout and retry aborted operations
- 位置: `packages/adapter-sdk/src/agent-cli-exec-operations-runtime.ts:36`
- 问题描述:
  - `executeWithRetry()` now treats `timed out`, `timeout`, `AbortError`, and `aborted` as retriable.
  - Each adapter passes the same per-attempt `timeoutMs` back into the exec runner on every retry, rather than budgeting against one overall deadline.
  - As a result, a provider probe/invoke that times out after `request.timeoutMs` can be re-run again for another full timeout window; an already-aborted request can also enter the retry path instead of failing immediately.
- 影响:
  - The new shared runtime can violate the caller's timeout/cancellation contract across Codex, GitHub Copilot, and Claude Code.
  - With the new default `maxRetryAttempts=2`, a nominal `30s` operation can now take roughly `60s+` before surfacing the same timeout, which breaks truthfulness for runtime budgets and can delay route fallback / diagnostics.
- 建议:
  - Do not retry when the failure came from an already-aborted caller signal.
  - Track one overall deadline across retries, or classify adapter-local timeout as non-retriable unless there is explicit spare budget.

## 3. Notes
1. The previously reported Claude Code `STRUCTURED_OUTPUT` truthfulness issue is fixed in the current tree; `CLAUDE_CODE_REAL_CAPABILITY_SUPPORT` now marks it as `DEGRADED`.
2. This follow-up issue is introduced by the new cross-provider shared retry runtime, not by any single adapter parser.

## 4. Verification
1. `pnpm -s vitest run packages/adapter-sdk/test/agent-cli-exec-operations-runtime.unit.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. Static review of:
   - `packages/adapter-sdk/src/agent-cli-exec-operations-runtime.ts`
   - `packages/adapters/codex/src/codex-agent-adapter.ts`
   - `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`
   - `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`

## 复核结论（2026-03-25）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：共享 `executeWithRetry()` 之前没有消费 caller `signal`，也没有对重试尝试共享单一 timeout budget；adapter 会把同一个 `request.timeoutMs` 继续传给每次重试。
   - 处理：已将共享 runtime 改为显式接收 `signal + timeoutMs`，按总 deadline 计算每次重试的剩余预算，并对已 abort 信号 fail-fast。

### 验证命令
1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm -s vitest run packages/adapter-sdk/test/agent-cli-exec-operations-runtime.unit.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts test/first-batch-adapters-route.integration.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-03-25）

1. `2.1`：已完成
   - 变更文件：`packages/adapter-sdk/src/agent-cli-exec-operations-runtime.ts`、`packages/adapters/codex/src/codex-agent-adapter.ts`、`packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`、`packages/adapters/claude-code/src/claude-code-agent-adapter.ts`、`packages/adapter-sdk/test/agent-cli-exec-operations-runtime.unit.test.ts`
   - 验证：`pnpm -s tsc -p tsconfig.json --noEmit`、`pnpm -s vitest run packages/adapter-sdk/test/agent-cli-exec-operations-runtime.unit.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts test/first-batch-adapters-route.integration.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：共享 retry runtime 现不会重试已 abort 的 caller 请求，并且每次重试都消费同一个总 timeout budget，不再把单次 `timeoutMs` 线性叠加到多次重试上。
