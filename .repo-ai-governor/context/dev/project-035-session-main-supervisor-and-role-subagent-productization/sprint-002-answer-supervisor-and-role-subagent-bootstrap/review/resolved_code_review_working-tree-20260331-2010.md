# Code Review: project-035 sprint-002 working tree

- Status: resolved
- Date: 2026-03-31
- Reviewer: AI-Agent
- Task: `TK-466`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/context/dev/project-035-session-main-supervisor-and-role-subagent-productization/sprint-002-answer-supervisor-and-role-subagent-bootstrap/plan.md`
  - `.repo-ai-governor/context/dev/project-035-session-main-supervisor-and-role-subagent-productization/sprint-002-answer-supervisor-and-role-subagent-bootstrap/tasks/TK-466-productize-role-subagent-collaboration-and-command-handoff-governance-baseline.md`

## 1. Review Scope
1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-035-session-main-supervisor-and-role-subagent-productization/plan.md`
3. `.repo-ai-governor/context/dev/project-035-session-main-supervisor-and-role-subagent-productization/sprint-002-answer-supervisor-and-role-subagent-bootstrap/plan.md`
4. `.repo-ai-governor/context/dev/project-035-session-main-supervisor-and-role-subagent-productization/sprint-002-answer-supervisor-and-role-subagent-bootstrap/tasks/TK-466-productize-role-subagent-collaboration-and-command-handoff-governance-baseline.md`
5. `.repo-ai-governor/context/dev/project-035-session-main-supervisor-and-role-subagent-productization/sprint-002-answer-supervisor-and-role-subagent-bootstrap/tasks/checklist.md`
6. `.repo-ai-governor/context/dev/project-035-session-main-supervisor-and-role-subagent-productization/sprint-002-answer-supervisor-and-role-subagent-bootstrap/tasks/tasks.csv`
7. `apps/cli/src/main.ts`
8. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
9. `apps/cli/src/runtime/session-main-subagent-registry.ts`
10. `apps/cli/src/types/index.ts`
11. `apps/cli/src/types/interfaces/index.ts`
12. `apps/cli/src/types/interfaces/session-main-subagent.interface.ts`
13. `apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
14. `apps/cli/test/runtime/session-main-parity.integration.test.ts`
15. `packages/core-orchestration-service/package.json`
16. `packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts`
17. `packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts`
18. `packages/core-orchestration-service/src/types/interfaces/session-main-supervisor-runtime.interface.ts`
19. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`

## 2. Findings
### 2.1 [P1] role-subagent delegate path derives required capabilities but never enforces them
- 位置: `apps/cli/src/runtime/session-main-supervisor-runtime.ts:226`
- 问题描述: `CliSessionMainSubagentRegistry.resolveSubagentDescriptor()` explicitly projects `requiredCapabilities` from the connected role, but `resolveSingleRoleDelegateTurn()` drops that contract when it creates the route runner and dispatch request. Neither `createRouteRunner()` nor `dispatchStage()` carries a `capabilityRequirement`, so the selected safe fallback only has to satisfy “no tool calling”, not the role's actual capability contract. In practice this lets `@planner` or future role delegates silently run on any no-tool surface even when that surface does not satisfy the role's required capabilities.
- 影响: This weakens the core role/session projection guarantee: the runtime can mark a turn as delegated to a connected role and emit `invokedRoleIds=['planner']`, while the actual selected surface may not satisfy the role contract declared in adapters config. That is a correctness issue in the new collaboration baseline, not just a presentation gap.
- 建议: Thread `descriptor.requiredCapabilities` into the route policy or `capabilityRequirementOverride`, and add a regression test where the only no-tool fallback lacks one required capability so the delegate turn is blocked or downgraded instead of silently executing.

### 2.2 [P2] any `@token` suppresses `plan/review` handoff even when no configured role was mentioned
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts:51`
- 问题描述: The dispatcher now treats any `@...` token as `explicitRoleMentionPresent` by stripping with a generic regex, and that flag disables the `/plan` and `/review` command-handoff branches. But the CLI supervisor only delegates when `CliSessionMainSubagentRegistry.resolveMentionedRoleId()` matches a configured role or role profile id. As a result, inputs like `@alice review this diff` or a typo such as `@plannre break this down` no longer get the normal governed `/review` or `/plan` preview; they fall through into the direct-answer/safe-fallback path instead.
- 影响: Ordinary user text that contains GitHub handles, reviewer mentions, or misspelled role names changes routing semantics in a surprising way and bypasses the intended command-handoff UX for `plan`/`review`. This is a user-visible regression in the new “explicit role mention” branch.
- 建议: Base the “explicit role mention” guard on successful role resolution rather than raw regex detection, or preserve `plan/review` handoff until a configured role has actually been resolved. Add a regression test for one unknown `@mention` plus a `plan`/`review` intent.

## 3. Notes
1. 你消息里贴的 `single-tool-minimal` finding 在当前 working tree 没有复现；这轮改动范围也不在 `agent-onboarding-runtime.ts`。
2. 本轮 targeted regressions 是通过的，所以这两条都是“现有测试未覆盖到的行为/契约缺口”。
3. 这次是 review 窗口，不是修复窗口；`pnpm run build` 未执行，因此这里不把结果表述成 `resolved` 或“全绿”。

## 4. Verification
1. `/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `git status --short`（通过）
3. `git diff --name-only --diff-filter=ACMR`（通过）

## 复核结论（2026-03-31）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P1] role-subagent delegate path derives required capabilities but never enforces them`
   - 判定：**认可**
   - 证据：当前 `resolveSingleRoleDelegateTurn()` 只按 “no-tool surface” 过滤候选面，确实没有把 `subagentDescriptor.requiredCapabilities` 送进 route policy 或 probe/evaluation 分支。这样像 `planner.requiredCapabilities=[structured_output]` 的角色，会在 `ollama` 仅满足 `TOOL_CALLING=UNSUPPORTED` 但不满足 `STRUCTURED_OUTPUT` 时仍被当成成功 delegate。
   - 处理：已把 role delegate 的 capability requirement 正式接进 safe-surface filtering 和 `AgentRouteRunner` route policy，并补了“唯一 no-tool fallback 缺少 required capability 时必须 guarded，不得 invokeStage”的回归。
2. `2.2 [P2] any @token suppresses plan/review handoff even when no configured role was mentioned`
   - 判定：**认可**
   - 证据：dispatcher 之前用泛化正则判断 `explicitRoleMentionPresent`，而真正的 supervisor delegate 只会对已配置 role/profile 生效，所以 `@alice review this diff`、`@plannre plan this work` 确实会误伤 `/review` / `/plan` handoff。
   - 处理：已把 guard 收敛成“只有 `sessionMainSupervisorRuntime.resolveMentionedRoleId()` 真正解析出 configured role 时才抑制 `plan/review` handoff”，并补了 unknown `@mention` 的 `/review` 回归。

### 验证命令
1. `pnpm exec vitest run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `pnpm run check`（通过）

## 修复执行记录（2026-03-31）

1. `2.1 [P1] role-subagent delegate path derives required capabilities but never enforces them`：已完成
   - 变更文件：`apps/cli/src/runtime/session-main-supervisor-runtime.ts`、`apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`pnpm run check`（通过）
   - 说明：role delegate 现在同时受 no-tool guard 和 required-capability contract 约束，不满足 capability 的 fallback 不会再被误记为成功 delegate。
2. `2.2 [P2] any @token suppresses plan/review handoff even when no configured role was mentioned`：已完成
   - 变更文件：`packages/core-orchestration-service/src/types/interfaces/session-main-supervisor-runtime.interface.ts`、`packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts`、`packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`、`apps/cli/test/runtime/session-main-parity.integration.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`pnpm run check`（通过）
   - 说明：现在只有“已配置 role 真正解析成功”的显式 mention 才会改变 `plan/review` 路由，普通 `@mention` 和拼写错误不会再绕开 handoff preview。
