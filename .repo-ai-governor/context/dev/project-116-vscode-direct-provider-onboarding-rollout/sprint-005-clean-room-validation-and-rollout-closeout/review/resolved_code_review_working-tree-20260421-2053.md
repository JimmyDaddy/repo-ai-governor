# Code Review: Working Tree Follow-Up Review

- Status: resolved
- Date: 2026-04-21
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `apps/cli/src/main.ts`
2. `apps/vscode-extension/src/runtime/vscode-extension-chat-participant.ts`
3. `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
4. `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
5. `apps/vscode-extension/test/vscode-extension-chat-participant.test.ts`
6. `apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
7. `apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
8. `packages/core-orchestration-service/src/constants/index.ts`
9. `packages/core-orchestration-service/src/constants/local-orchestration-service-sidecar.constant.ts`
10. `packages/core-orchestration-service/src/index.ts`
11. `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts`
12. `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`
13. `packages/core-orchestration-service/src/local-orchestration-service-sidecar-client.ts`
14. `packages/core-orchestration-service/src/local-orchestration-service-sidecar-entry.ts`
15. `packages/core-orchestration-service/src/types/interfaces/local-orchestration-service-sidecar.interface.ts`
16. `packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`
17. `packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts`
18. `packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`
19. `packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.timeout.test.ts`

## 2. Findings
### 2.1 [P2] Generic 4-second timeout now misclassifies prompt-driven chat commands as already running work
- 位置: `apps/vscode-extension/src/runtime/vscode-extension-chat-participant.ts:63`
- 问题描述: `awaitChatCommandExecution()` now applies the same 4-second fallback to every `executeChatRequest()` call, and the participant emits the "still running / use Refresh" summary as soon as that timer wins. That is safe for long-running workspace operations such as `/doctor`, but several chat commands intentionally block on `InputBox`/`QuickPick` before any background work starts. Examples in the current tree include `runWorkflowPreview()/Create()/Edit()` (`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts:504`, `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts:539`, `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts:574`) plus `configureUserDefault()` and `setManagedSecret()` (`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts:761`, `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts:777`, `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts:999`, `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts:1292`). If the operator spends more than four seconds answering the prompt, chat now returns a final "running" card even though the command is still waiting for user input and no governed operation has started yet.
- 影响: chat results become misleading for prompt-driven flows, and the user can receive a "still running" status while VS Code is actually waiting on a modal choice or secret input. This is a user-visible control-flow regression in the VS Code plugin surface and makes the new pending-state messaging unreliable outside the `/doctor`-style long-running path it was meant to fix.
- 建议: restrict the 4-second fallback to commands that truly hand work off to a background/service operation without further user prompts, or move the timeout/start notification to after the prompt collection phase for interactive commands. Add one regression test that keeps a prompt-driven flow open past four seconds and asserts that chat does not emit the background-running summary while user input is still outstanding.

## 3. Notes
1. `current-context.md` is currently `idle` with no active stream review target, so this report was routed to `project-116 / sprint-005 / review` by working-tree relevance assumption because the modified files are all direct VS Code / sidecar follow-up work from that stream.
2. No second actionable issue was recorded after this pass. The new `send_session_turn` timeout budget and the sidecar-backed `session.main` supervisor wiring both have focused test coverage in the current tree.
3. This report stays `review_pending`, so `pnpm run build` is not required yet for a green closeout claim. If the finding is repaired, the verification window should include one real `pnpm run build` before any `resolved` state is claimed under `CS-034`.

## 4. Verification
1. `git diff --name-only --diff-filter=ACMR`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.timeout.test.ts apps/vscode-extension/test/vscode-extension-chat-participant.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`（通过）
3. `pnpm run build`（未执行；当前报告为 `review_pending`，尚未进入修复完成态验证窗口）

## 复核结论（2026-04-21）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`apps/vscode-extension/src/runtime/vscode-extension-chat-participant.ts` 当前会在 4 秒超时后直接输出“仍在执行中”的摘要；而 `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts` 中的 `WORKFLOW_*`、`CONFIGURE_USER_DEFAULT`、`SET_MANAGED_SECRET` 等路径确实会先等待 `InputBox` / `QuickPick` / confirm，再进入真正的后台操作，因此该摘要会把“等待用户输入”误报成“后台仍在执行”。
   - 处理：限制 pending summary 只用于明确可后台运行的 chat 命令；对于仍在等待 VS Code 交互输入的命令，chat participant 在 4 秒后继续等待真实结果，不再提前返回误导性摘要。

### 验证命令
1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-chat-participant.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`（通过）

## 修复执行记录（2026-04-21）

1. `2.1`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`、`apps/vscode-extension/src/runtime/vscode-extension-chat-participant.ts`、`apps/vscode-extension/test/vscode-extension-chat-participant.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-chat-participant.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`（通过）；`pnpm run build`（通过）
   - 说明：新增 chat 命令起始元数据来标记哪些命令允许在 4 秒后输出后台运行摘要；`doctor/check/bootstrap` 仍保留该人类可读摘要，`set managed secret` 等 prompt-driven 流程在超时后改为继续等待真实结果，并补了一条回归测试防止再次把“等待用户输入”误判成“后台仍在执行”。
