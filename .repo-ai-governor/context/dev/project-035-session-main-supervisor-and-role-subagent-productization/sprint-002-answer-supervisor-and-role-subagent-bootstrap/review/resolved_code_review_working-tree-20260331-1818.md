# Code Review: project-035 sprint-002 working tree

- Status: resolved
- Date: 2026-03-31
- Reviewer: AI-Agent
- Task: `TK-465`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/context/dev/project-035-session-main-supervisor-and-role-subagent-productization/sprint-002-answer-supervisor-and-role-subagent-bootstrap/plan.md`
  - `.repo-ai-governor/context/dev/project-035-session-main-supervisor-and-role-subagent-productization/sprint-002-answer-supervisor-and-role-subagent-bootstrap/tasks/TK-465-bootstrap-service-owned-session-main-supervisor-and-direct-answer-path.md`

## 1. Review Scope
1. `apps/cli/src/main.ts`
2. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
3. `apps/cli/src/runtime/adapter-routing-runtime.ts`
4. `apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
5. `apps/cli/test/runtime/session-main-parity.integration.test.ts`
6. `packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts`
7. `packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts`
8. `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
9. `packages/core-orchestration-service/src/types/interfaces/session-main-supervisor-runtime.interface.ts`
10. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`

## 2. Findings
### 2.1 [P1] `session.main` direct-answer path currently bypasses command handoff governance
- 位置: `apps/cli/src/runtime/session-main-supervisor-runtime.ts:63`
- 问题描述: `resolveTurn()` now sends ordinary `session.main` natural-language turns straight into `AgentRouteRunner.dispatchStage()` and only passes a soft `governorInstructions` string in the stage input. The routed protocols come from `CliAdapterRoutingRuntime.createProtocolBySurface()`, which instantiates Codex / Claude Code / GitHub Copilot in `CLI_EXEC` mode, and those adapters explicitly advertise `TOOL_CALLING=SUPPORTED` while `CONFIRMATION_GATE=UNSUPPORTED`. Their invoke prompts simply serialize the JSON input as prompt text, so there is no hard runtime control that prevents the selected adapter from actually invoking tools or mutating the workspace when answering a “direct answer” turn.
- 影响: This breaks the sprint goal and product brief boundary that natural-language command handoff must continue through preview + confirm. A plain request such as “inspect workspace state” can now hit a real tool-capable agent surface and perform side effects without ever emitting the governed handoff preview/confirmation flow.
- 建议: Keep the bootstrap seam, but enforce one hard guard before marking this path complete: either route direct answers through a read-only / no-tool execution mode, or add an explicit runtime-side confirmation gate that rejects tool-capable direct-answer invocations and falls back to command preview/handoff instead. Add a regression test that proves a direct-answer turn cannot cross the high-side-effect governance boundary.

## 3. Notes
1. 你消息里贴的 `single-tool-minimal` finding 在当前 working tree 没有复现；`apps/cli/src/runtime/agent-onboarding-runtime.ts` 已经对 `SINGLE_TOOL_MINIMAL` 做了提前返回，现有测试也覆盖了这条回归。
2. 这轮 targeted regression tests 是通过的，因此当前风险更像“缺少治理约束与负向覆盖”，而不是现有 happy-path 用例失败。
3. 本次是 code review，不是修复窗口；`pnpm run build` 未执行，因此这里不宣称“全绿/已收尾”。

## 4. Verification
1. `/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `git status --short`（通过）
3. `git diff --name-only --diff-filter=ACMR`（通过）

## 复核结论（2026-03-31）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`CliSessionMainSupervisorRuntime.resolveTurn()` 现已在 dispatch 前显式 probe candidate surfaces，并仅保留 `TOOL_CALLING=UNSUPPORTED` 的 safe direct-answer surfaces；当首选 surface 不安全时会回退到安全 surface，当不存在任何安全 surface 时直接返回 governed fallback answer，不再触发真实 adapter invoke。对应修复位于 `apps/cli/src/runtime/session-main-supervisor-runtime.ts`，回归覆盖位于 `apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`。
   - 处理：已接受并进入同窗口修复。

### 验证命令
1. `pnpm exec vitest run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）

## 修复执行记录（2026-03-31）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/session-main-supervisor-runtime.ts`、`apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
   - 说明：direct-answer bootstrap 现只允许 no-tool surface 真正执行回答；若只有 tool-capable surfaces，则 turn 会停留在 governed fallback answer，不会跨过 preview + confirm 治理边界。
