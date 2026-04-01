# Code Review: working tree 2026-04-01 11:16

- Status: resolved
- Date: 2026-04-01
- Reviewer: AI-Agent
- Review Type: working tree review
- Review Target: `project-035-session-main-supervisor-and-role-subagent-productization`
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
2. `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
3. `apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
4. `apps/cli/test/runtime/session-main-parity.integration.test.ts`
5. `apps/cli/test/runtime/session-shell-runner.test.ts`
6. `packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts`
7. `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`
8. `packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts`
9. `packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`
10. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`

## 2. Findings
### 2.1 [P1] `session.main` direct-answer path again permits tool-capable agent execution
- 位置: `apps/cli/src/runtime/session-main-supervisor-runtime.ts:178`
- 问题描述: `resolveTurn()` now resolves answer surfaces with `allowToolCapableSurfaces: true`, and `isSafeDirectAnswerSurface()` consequently treats both `TOOL_CALLING=SUPPORTED` and `TOOL_CALLING=UNSUPPORTED` as safe. The selected surface is then passed straight into `relayProtocolStreamEvents()` and `routeRunner.dispatchStage()` with only prompt-level answer instructions in `createAnswerInput()`. This reopens the same governance hole previously fixed in sprint-002: an ordinary natural-language `session.main` turn can run on a real tool-capable CLI-exec adapter without going through preview/confirm handoff.
- 影响: This breaks the product boundary that natural-language foreground answers must not cross the command handoff governance seam. A direct-answer turn can mutate the workspace or invoke tools before the user ever sees a governed preview, which makes the new chatability path unsafe and undermines auditability.
- 建议: Reinstate a hard runtime guard for direct answers: either restrict direct-answer execution back to no-tool/read-only surfaces, or reject tool-capable answer dispatch and fall back to governed handoff/preview. Keep the regression test at the runtime boundary so this cannot silently reopen again.

## 3. Notes
1. 你消息里贴的 `Resumed direct_execute handoffs degrade into /confirm preview mode` 这轮没有复现。`session-shell-runner` 现在会在 `recoverPendingCommandState()` 中对 `executionMode === 'direct_execute'` 直接执行 pending command，而不是一律回到 `restorePendingCommandPreviewState()`。
2. 这轮没有发现新的 resume continuity 缺口；当前主要风险集中在 direct-answer governance 回归。

## 4. Verification
1. `/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-shell-ink-controller.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）

## 复核结论（2026-04-01）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P1] session.main direct-answer path again permits tool-capable agent execution`
   - 判定：**认可**
   - 证据：复核时 `resolveTurn()` 仍然在 direct-answer 分支把 `allowToolCapableSurfaces: true` 传给 `resolveSafeCandidateSurfaces(...)`，而同文件测试也显式断言“preferred tool-capable surface”可以直接回答，确实会绕过 preview/confirm handoff 治理边界。
   - 处理：已把 direct-answer 恢复为仅允许 no-tool safe surface，并把原先的 tool-capable happy-path 测试改为 safe fallback/no-tool 断言。

### 验证命令
1. `/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-shell-ink-controller.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）

## 修复执行记录（2026-04-01）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/session-main-supervisor-runtime.ts`
   - 验证：`/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-shell-ink-controller.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：direct-answer 不再放行 tool-capable surface；当 preferred surface 被 guard 拒绝时，只会回退到 no-tool safe surface，无法再直接穿透 handoff 治理。
2. `2.1`：已完成
   - 变更文件：`apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
   - 验证：`pnpm run build`（通过）
   - 说明：已把原先允许 tool-capable direct answer 的断言改成 safe fallback/no-tool 语义，并同步修正 direct-answer stream-event 覆盖用例。
