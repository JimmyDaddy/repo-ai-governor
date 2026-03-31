# Code Review: working tree 20260331-2157

- Status: resolved
- Date: 2026-03-31
- Reviewer: AI-Agent
- Task: `TK-467 / sprint-003 role collaboration and handoff productization`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope

1. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
2. `apps/cli/src/runtime/session-main-subagent-registry.ts`
3. `packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts`
4. `packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts`
5. `packages/core-orchestration-service/src/types/interfaces/session-main-supervisor-runtime.interface.ts`
6. `apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
7. `apps/cli/test/runtime/session-main-parity.integration.test.ts`
8. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
9. `.repo-ai-governor/context/dev/project-035-session-main-supervisor-and-role-subagent-productization/**`
10. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 2. Findings

未发现需要修复的点。

## 3. Notes

1. 用户消息里附带的旧 finding `[P2] Unknown @mentions suppress normal plan/review handoff` 在当前 working tree 中没有复现：`packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts` 现在按 `configuredRoleMentionPresent` 而不是任意 `@token` 来抑制 `/plan` 与 `/review` preview，`packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts` 也已覆盖 `@alice review this diff -> /review` preview 这条路径。
2. `apps/cli/src/runtime/session-main-supervisor-runtime.ts` 本轮 serial collaboration 改动同时把 role delegate 的 `requiredCapabilities` 重新接回了 safe-surface probe 和 `AgentRouteRunner` dispatch；我在 diff 里没有再看到之前“投影了 requiredCapabilities 但真正 dispatch 没有 enforce”的回归。
3. 当前实现仍然是 `TK-467` 的 serial collaboration 基线，只收敛了显式双 role mention 的前台路径；更广的 parallel fan-out/presenter 语义仍留给后续 `TK-468`，但这和本轮 working tree 的既定 sprint 目标一致，不构成当前 CR 的 actionable finding。

## 4. Verification

1. `/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `pnpm run check`（通过）
