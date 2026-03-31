# Code Review: working tree 20260331-2313

- Status: resolved
- Date: 2026-03-31
- Reviewer: AI-Agent
- Task: `TK-468 / sprint-003 role collaboration and handoff productization`
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
2. `apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
3. `apps/cli/test/runtime/session-main-parity.integration.test.ts`
4. `apps/cli/test/runtime/session-shell-transcript-store.test.ts`
5. `apps/cli/test/runtime/react-cli-runner.test.ts`
6. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
7. `.repo-ai-governor/context/dev/project-035-session-main-supervisor-and-role-subagent-productization/**`

## 2. Findings

### 2.1 [P2] Explicit role mentions above the pilot limit are silently dropped

- 位置: `apps/cli/src/runtime/session-main-supervisor-runtime.ts:128-139`
- 问题描述: `resolveTurn()` now caps multi-role requests by slicing the resolved mention list to `SESSION_MAIN_PARALLEL_ROLE_FANOUT_LIMIT=3` or `SESSION_MAIN_SERIAL_ROLE_COLLABORATION_LIMIT=2`, then proceeds as if the truncated list were the full user intent. A prompt such as `@planner @architect @reviewer @verifier parallel analyze this change` will therefore execute only the first three configured roles and omit the fourth with no guard, warning, or follow-up question. The new tests only cover the 2-role and 3-role happy paths, so this truncation behavior can ship unnoticed.
- 影响: Foreground collaboration can present an apparently successful synthesized answer while silently ignoring one explicit role the user asked to include. That breaks the auditability and intent-preservation boundary for `session.main` role collaboration, especially now that the sprint claims completed truth for multi-role fan-out.
- 建议: When explicit mentions exceed the supported pilot limit, fail closed with a guarded/unresolved outcome or a short follow-up that states the current supported maximum, instead of truncating the role list. Add a regression test for the overflow case.

## 3. Notes

1. 用户消息里附带的旧 finding `[P2] Unknown @mentions suppress normal plan/review handoff` 在当前 working tree 中没有复现；dispatcher 现在按“已配置角色 mention”而不是任意 `@token` 来抑制 `/plan` 与 `/review` preview，并且 unit test 已覆盖 `@alice review this diff -> /review` preview。

## 4. Verification

1. `/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts apps/cli/test/runtime/react-cli-runner.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）

## 复核结论（2026-03-31）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P2] Explicit role mentions above the pilot limit are silently dropped`
   - 判定：**认可**
   - 证据：`apps/cli/src/runtime/session-main-supervisor-runtime.ts` 当前在 `resolveTurn()` 中先按 `SESSION_MAIN_PARALLEL_ROLE_FANOUT_LIMIT=3` / `SESSION_MAIN_SERIAL_ROLE_COLLABORATION_LIMIT=2` 对显式 role mentions 做 `slice()`，确实会在超出上限时静默截断用户请求的角色集合。
   - 处理：改为 fail closed。超过上限时不再进入 dispatch，而是返回明确的 serial/parallel overflow collaboration outcome，并补充对应 runtime regression tests。

### 验证命令
1. `/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）

## 修复执行记录（2026-03-31）

1. `2.1 [P2] Explicit role mentions above the pilot limit are silently dropped`：已完成
   - 变更文件：`apps/cli/src/runtime/session-main-supervisor-runtime.ts`
   - 验证：`/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：为 serial/parallel collaboration 新增 overflow fail-closed outcome，保留用户显式角色意图，不再静默裁掉超出 pilot 上限的 role。
2. `2.1 [P2] Explicit role mentions above the pilot limit are silently dropped`：已完成
   - 变更文件：`apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
   - 验证：`pnpm run build`（通过）
   - 说明：新增 serial overflow 与 parallel overflow 回归，覆盖 `>2` serial role mentions 与 `>3` parallel role mentions 的阻断分支。
