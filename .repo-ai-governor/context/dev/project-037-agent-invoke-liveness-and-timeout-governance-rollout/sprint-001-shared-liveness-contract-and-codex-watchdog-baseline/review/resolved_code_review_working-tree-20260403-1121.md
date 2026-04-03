# Code Review: working tree 2026-04-03 11:21

- Status: resolved
- Date: 2026-04-03
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.codex/skills/workspace-code-review-workflow/SKILL.md`

## 1. Review Scope
1. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-002-cross-adapter-liveness-rollout-and-diagnostics/plan.md`
2. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-002-cross-adapter-liveness-rollout-and-diagnostics/tasks/TK-502-integrate-remote-api-streaming-liveness-and-execution-diagnostics-projection.md`
3. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-002-cross-adapter-liveness-rollout-and-diagnostics/tasks/checklist.md`
4. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-002-cross-adapter-liveness-rollout-and-diagnostics/tasks/tasks.csv`
5. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
6. `apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
7. `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
8. `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`
9. `packages/adapters/codex/src/codex-agent-adapter.ts`
10. `packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`
11. `packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts`
12. `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
13. `packages/core-orchestration-service/src/types/index.ts`
14. `packages/core-orchestration-service/src/types/interfaces/index.ts`
15. `packages/core-orchestration-service/src/types/interfaces/local-orchestration-service-shell.interface.ts`
16. `packages/core-orchestration-service/src/types/interfaces/session-main-supervisor-runtime.interface.ts`
17. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
18. `packages/orchestration-service-client/src/constants/orchestration-service.constant.ts`
19. `packages/orchestration-service-client/src/index.ts`
20. `packages/orchestration-service-client/src/types/index.ts`
21. `packages/orchestration-service-client/src/types/interfaces/index.ts`
22. `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`

## 2. Findings
### 2.1 [P2] Explicit provider completion events overwrite the final text preview with the literal status string
- 位置: `packages/adapters/codex/src/codex-agent-adapter.ts:1507`, `packages/adapters/claude-code/src/claude-code-agent-adapter.ts:1870`
- 问题描述: 两个 remote-api adapter 都会先用 `captureRemoteApiTransportEvent()` 处理 provider 的显式 completed 事件，再立刻用当前 `livenessState` 构造最终 `invokeLiveness` snapshot。`resolveRemoteApiEventPreview()` 把 `payload.status` 也当成 preview 候选，因此 `response.completed` / `message_stop` 这类只携带 `status='completed'` 的 transport event 会把 `latestTextPreview` 从最后一段真实输出覆盖成 `'completed'`。这样一来，最终流事件、`session.main` 存档，以及 execution summary/event stream 看到的就不是最后一段模型输出，而是一个状态字面量。
- 影响: 这次任务的核心目标之一就是把 partial-output 与 execution diagnostics 真值投影到 shared liveness / execution summary。当前实现会在最常见的成功终态路径上丢失最终文本预览，直接削弱超时、取消和 partial-output 诊断价值；现有 smoke test 也没有断言 completed 分支的 `latestTextPreview`，因此这个回归不会被当前测试捕获。
- 建议: completed 这类 transport-only 事件不要再把 `payload.status` 作为 text preview 来源，优先保留已有 `accumulatedText/latestTextPreview`；同时给 Codex 和 Claude Code 的 completed smoke case 增加 `invokeLiveness.latestTextPreview` 断言，防止后续再次回归。

## 3. Notes
1. 本次未发现第二个同等级功能性问题，但 automated verification 受当前终端环境限制影响较大，残余风险仍在。
2. 当前终端缺少 `node` / `pnpm`，因此无法直接执行仓库规范里的 `pnpm run build`、vitest 和 governance gate；报告中的验证证据仅覆盖静态 diff 审查与本地台账/规范核对。

## 4. Verification
1. `git status --short`（通过）
2. `git diff --name-only --diff-filter=ACMR`（通过）
3. `git diff --stat`（通过）
4. `pnpm vitest run packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`（未执行：当前终端缺少 `pnpm` / `node`）

## 复核结论（2026-04-03）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P2] Explicit provider completion events overwrite the final text preview with the literal status string`
   - 判定：**认可**
   - 证据：`packages/adapters/codex/src/codex-agent-adapter.ts` 与 `packages/adapters/claude-code/src/*` 的 `captureRemoteApiTransportEvent()` 都会对 completed transport event 调用 `resolveRemoteApiEventPreview()`；而该函数把 `payload.status` 作为候选值。`response.completed` / `message_stop` 事件只携带 `status: 'completed'` 时，会把已有 `latestTextPreview` 覆盖成字面量 `completed`。
   - 处理：移除 `payload.status` 作为 preview 候选，保留已有真实输出 preview；同时为 Codex / Claude Code completed smoke case 增加 `invokeLiveness.latestTextPreview` 回归断言。

### 验证命令
1. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" /Users/jimmydaddy/Library/pnpm/pnpm vitest run packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`（通过）
2. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" /Users/jimmydaddy/Library/pnpm/pnpm vitest run packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`（通过）
3. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" /Users/jimmydaddy/Library/pnpm/pnpm run build`（通过）

## 修复执行记录（2026-04-03）

1. `2.1 [P2] Explicit provider completion events overwrite the final text preview with the literal status string`：已完成
   - 变更文件：`packages/adapters/codex/src/codex-agent-adapter.ts`、`packages/adapters/claude-code/src/claude-code-agent-adapter.ts`、`packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`、`packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`
   - 验证：`PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" /Users/jimmydaddy/Library/pnpm/pnpm vitest run packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`（通过）；`PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" /Users/jimmydaddy/Library/pnpm/pnpm vitest run packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`（通过）；`PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" /Users/jimmydaddy/Library/pnpm/pnpm run build`（通过）
   - 说明：completed transport-only event 不再使用 `status` 字面量覆盖最终文本 preview，remote-api liveness final snapshot 会保留最后真实输出。
