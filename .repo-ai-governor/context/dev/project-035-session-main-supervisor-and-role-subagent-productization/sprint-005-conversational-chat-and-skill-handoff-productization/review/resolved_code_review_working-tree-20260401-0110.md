# Code Review: working tree 20260401-0110

- Status: resolved
- Date: 2026-04-01
- Reviewer: AI-Agent
- Task: `TK-471 ~ TK-473 / sprint-005 conversational chat and skill handoff productization`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/context/dev/project-035-session-main-supervisor-and-role-subagent-productization/sprint-002-answer-supervisor-and-role-subagent-bootstrap/review/resolved_code_review_working-tree-20260331-1818.md`

## 1. Review Scope

1. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
2. `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
3. `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
4. `packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts`
5. `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`
6. `packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts`
7. `packages/core-orchestration-service/src/types/**`
8. `apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
9. `apps/cli/test/runtime/session-main-parity.integration.test.ts`
10. `apps/cli/test/runtime/session-shell-runner.test.ts`
11. `apps/cli/test/runtime/session-slash-command-registry.test.ts`
12. `apps/cli/test/runtime/session-shell-ink-controller.test.ts`
13. `packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`
14. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
15. `.repo-ai-governor/context/dev/project-035-session-main-supervisor-and-role-subagent-productization/sprint-005-conversational-chat-and-skill-handoff-productization/**`

## 2. Findings

### 2.1 [P1] Direct-answer turns are again allowed to land on tool-capable agent surfaces

- 位置: `apps/cli/src/runtime/session-main-supervisor-runtime.ts:166-178,630-645`
- 问题描述: This change reopens the exact governance hole that sprint-002 previously fixed. `resolveTurn()` now calls `resolveSafeCandidateSurfaces(..., { allowToolCapableSurfaces: true })` for ordinary direct-answer turns, and `isSafeDirectAnswerSurface()` explicitly accepts `TOOL_CALLING=SUPPORTED` in that mode. The only remaining safeguard is the prompt string in `createAnswerInput()` telling the model not to execute commands. That is not a runtime-enforced boundary, so a conversational turn can once again reach Codex / Claude Code / Copilot style tool-capable protocols without going through preview + confirm handoff.
- 影响: The new “chatability” path can bypass the governed natural-language handoff boundary and perform side effects during what is presented as an ordinary answer turn. This is a regression against the previously accepted sprint-002 fix and weakens the product’s audit and approval model.
- 建议: Reintroduce a hard runtime guard for direct-answer mode: either keep direct answers on no-tool/read-only surfaces only, or add a protocol/runtime flag that disables tool execution for answer-mode invocations before this path is treated as complete.

### 2.2 [P2] Resumed `direct_execute` handoffs are downgraded into `/confirm` preview state

- 位置: `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts:124-127,824-827,1401-1425,1267-1275`
- 问题描述: The new continuity logic restores any unresolved pending handoff by calling `restorePendingCommandPreviewState()` on startup and after `/resume`, regardless of whether the original `handoffExecutionMode` was `direct_execute` or `preview_confirm`. That helper always sets `handoffState=PREVIEWING`, and the prompt-bar contract for `PREVIEWING` is `/confirm · /cancel · Esc`. So a low-risk skill that was explicitly classified as auto-execute will come back from resume as a confirmation-required preview instead of preserving its original execution semantics. Current tests only cover same-turn auto-execute and bundle preview resume; they do not cover unresolved direct-execute resume.
- 影响: This breaks the sprint’s claimed “direct_execute / preview_confirm continuity parity” and can strand low-risk resumed work behind a manual confirmation step that did not exist in the original handoff contract.
- 建议: Preserve execution-mode semantics across resume. Either auto-resume unresolved `direct_execute` handoffs, or surface a distinct resumed-direct-execute state that does not advertise `/confirm`. Add an integration test that resumes an unresolved low-risk direct-execute handoff and asserts the expected post-resume behavior.

## 3. Notes

1. 用户消息里贴的旧 finding `[P2] Explicit role mentions above the pilot limit are silently dropped` 在当前 working tree 中没有复现；`apps/cli/src/runtime/session-main-supervisor-runtime.ts` 现在已经对 serial/parallel role overflow 返回显式 outcome，而不是继续静默截断。
2. 这轮 targeted tests 与 `pnpm run build` 都通过，所以风险点不在 happy-path 覆盖是否能跑通，而在治理边界和恢复语义是否被错误放宽。

## 4. Verification

1. `/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-shell-ink-controller.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）

## 复核结论（2026-04-01）

- 整体结论：**部分认可**

### 逐条复核
1. `2.1`
   - 判定：**不认可**
   - 证据：`sprint-005` 已批准的 formal direction 明确接受 `session.main.answer` 运行在 tool-capable surface 上，以恢复主 agent 的真实闲聊入口；因此把该行为继续按 `sprint-002` 的 no-tool-only 规则认定为回归，不再符合当前 solution truth。当前适配器协议仍缺少“answer turn runtime hard-disable tools”的硬契约，这更适合作为后续增强，而不是本次 CR 的阻塞修复项。
   - 处理：保留为后续协议增强风险，不纳入本次 accepted repair list。
2. `2.2`
   - 判定：**认可**
   - 证据：`CliSessionShellRunner` 在 startup、显式 `/resume` 与 `/clear` 恢复 pending handoff 时，之前确实统一调用了 preview 恢复路径，导致 `direct_execute` handoff 会被错误降级成 `/confirm` preview。现已改为按原始 `executionMode` 恢复：`direct_execute` 自动继续执行，`preview_confirm` 才恢复 preview。
   - 处理：已纳入修复并补充 resume regression coverage。

### 验证命令
1. `/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `pnpm run check`（通过）
4. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）

## 修复执行记录（2026-04-01）

1. `2.2`：已完成
   - 变更文件：`apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
   - 验证：`/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts --maxWorkers=1 --maxConcurrency=1 ; pnpm run build ; pnpm run check`（通过）
   - 说明：新增 `recoverPendingCommandState()`，让 startup、显式 `/resume` 与 `/clear` 都按 `executionMode` 恢复 pending handoff；`direct_execute` 不再掉回 `/confirm` preview。
2. `2.2`：已完成
   - 变更文件：`apps/cli/test/runtime/session-shell-runner.test.ts`
   - 验证：`/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：补充显式 `/resume` 对 unresolved `direct_execute` handoff 的 runner-level regression coverage。
3. `2.2`：已完成
   - 变更文件：`apps/cli/test/runtime/session-main-parity.integration.test.ts`
   - 验证：`/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：补充 real runtime resume-on-startup parity，用真实 shared-session event 恢复未执行的低风险 `verify` handoff，确认不会被降级为 preview-confirm。
