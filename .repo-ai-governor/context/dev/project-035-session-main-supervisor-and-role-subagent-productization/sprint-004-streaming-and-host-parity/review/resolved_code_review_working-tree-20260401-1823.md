# Code Review: working tree 2026-04-01 18:23

- Status: resolved
- Date: 2026-04-01
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
1. `apps/cli/src/react-cli/views/session-shell-live-app.tsx`
2. `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
3. `apps/cli/src/runtime/interactive-shell/session-shell-transcript-store.ts`
4. `apps/cli/src/runtime/interactive-shell/session-shell-turn-progress-dock.ts`
5. `apps/cli/test/runtime/session-shell-live-app.test.ts`
6. `apps/cli/test/runtime/session-shell-runner.test.ts`
7. `apps/cli/test/runtime/session-shell-transcript-store.test.ts`
8. `apps/cli/test/runtime/session-shell-turn-progress-dock.test.ts`
9. `packages/adapters/codex/src/codex-agent-adapter.ts`
10. `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`
11. `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
12. `packages/adapters/local-model/src/local-model-agent-adapter.ts`
13. `packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`
14. `packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`
15. `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`
16. `packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts`

## 2. Findings

### Finding 1
- Severity: P1
- Title: CLI-exec adapters now let `streamEvents()` start the real process before invoke-time governance is attached
- Affected Files:
  - `packages/adapters/codex/src/codex-agent-adapter.ts:309`
  - `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts:309`
  - `packages/adapters/claude-code/src/claude-code-agent-adapter.ts:281`
  - `packages/adapters/local-model/src/local-model-agent-adapter.ts:239`
- Detail:
  The new inflight-execution pattern moved real adapter execution behind `streamEvents()`. In the current `session.main` relay flow, `relayProtocolStreamEvents()` starts iterating the stream before `routeRunner.dispatchStage()` issues the authoritative `invokeStage()` call. Because `AgentStreamEventsRequest` carries neither cancellation nor per-invocation timeout overrides, whichever adapter execution is created by the stream side now runs without the invoke-time guardrails that `dispatchStage()` was supposed to own. In practice this means cancellation and request-specific timeout policy can be silently dropped, and the tests added in this patch only cover the happy-path concurrent reuse case, not abort/timeout behavior.

### Finding 2
- Severity: P2
- Title: Slash palette with no highlighted suggestion now falls through to composer history
- Affected Files:
  - `apps/cli/src/react-cli/views/session-shell-live-app.tsx:160`
- Detail:
  `shouldNavigatePalette()` returns `false` whenever `highlightedCommand` is `null`, even if the slash palette is still open and the user is actively typing a slash query. That makes `ArrowUp` / `ArrowDown` dispatch `COMPOSER_HISTORY_PREVIOUS/NEXT` for inputs like `/workspce` or any other no-match query, so the palette unexpectedly rewrites the current command with history instead of staying in palette navigation/no-op mode. This is a user-visible behavior regression and the new key-mapping tests do not cover the empty-suggestion branch.

## 3. Notes
1. 这轮 working tree 的主变化分成两条：一条是 session shell 前台把 live activity 挂回 final transcript details；另一条是四个 CLI-exec adapter 都新增了“同一次 execution 复用 `streamEvents()` + `invokeStage()`”的实现。
2. 你消息里贴的 `Repository-review fallback can violate reviewer capability contract` 这条旧 finding 不在当前 working tree 范围内，相关文件本轮没有改动，因此我没有把它当作本轮新的 actionable finding 复报。

## 4. Verification
1. `/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run apps/cli/test/runtime/session-shell-live-app.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）

## 复核结论（2026-04-01）

- 整体结论：**认可**

### 逐条复核
1. `Finding 1`
   - 判定：**认可**
   - 证据：`apps/cli/src/runtime/session-main-supervisor-runtime.ts` 里 `relayProtocolStreamEvents()` 确实在 `routeRunner.dispatchStage()` 之前启动 `protocol.streamEvents(request)`；复核时 `AgentStreamEventsRequest` 仍未携带 `agentInvocationTimeoutMs / stageTimeoutMs / flowTimeoutMs / signal`，而 `packages/adapters/codex/src/codex-agent-adapter.ts`、`packages/adapters/claude-code/src/claude-code-agent-adapter.ts`、`packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`、`packages/adapters/local-model/src/local-model-agent-adapter.ts` 的 `streamEvents()` 都会直接用 stream request 创建真实执行，因此先启动的 stream 分支会丢掉 invoke-time guardrail。
   - 处理：已接受并修复；将 shared stream request 契约补齐到与 invoke 对齐，并让 `session.main` relay 与 4 个 adapter 一起透传同一份 timeout / signal 护栏。
2. `Finding 2`
   - 判定：**认可**
   - 证据：`apps/cli/src/react-cli/views/session-shell-live-app.tsx` 的 `shouldNavigatePalette()` 复核时要求 `highlightedCommand` 非空才返回 `true`，所以像 `/workspce` 这种空建议场景会把 `↑↓` 分发成 `COMPOSER_HISTORY_PREVIOUS/NEXT`，确实会意外改写当前 slash query。
   - 处理：已接受并修复；palette 打开且 composer 仍处于 slash/query 模式时，`↑↓` 现在稳定留在 palette 导航语义里，即使当前没有高亮建议也不会再掉回输入历史。

### 验证命令
1. `pnpm exec vitest run apps/cli/test/runtime/session-shell-live-app.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）

## 修复执行记录（2026-04-01）

1. `Finding 1`：已完成
   - 变更文件：`packages/adapter-sdk/src/types/interfaces/agent-protocol.interface.ts`、`apps/cli/src/runtime/session-main-supervisor-runtime.ts`、`packages/adapters/codex/src/codex-agent-adapter.ts`、`packages/adapters/claude-code/src/claude-code-agent-adapter.ts`、`packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`、`packages/adapters/local-model/src/local-model-agent-adapter.ts`、对应 smoke tests
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/session-main-parity.integration.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：stream 先启动时现在会拿到与 invoke 相同的 `signal / timeout` 护栏，避免“先启动的一侧决定执行预算”的漂移。
2. `Finding 2`：已完成
   - 变更文件：`apps/cli/src/react-cli/views/session-shell-live-app.tsx`、`apps/cli/test/runtime/session-shell-live-app.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/session-shell-live-app.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：slash palette 无匹配时的 `↑↓` 现在保持 palette 语义，不再回落到 composer history。
