# TK-882 implement explicit acp_exec transport routing and fail-closed separation from cli_exec

- Status: completed
- Date: 2026-04-14
- Owner: AI-Agent
- Priority: P1
- Project: `project-105-acp-host-facing-transport-rollout`
- Sprint: `sprint-001-acp-host-facing-transport-rollout`

## 1. 任务目标

实现显式 `acp_exec` transport routing，并保持 ACP 与 `cli_exec` fail-closed 分离，不允许把 ACP 成功/失败重写成 `cli_exec` truth。

## 2. Depends On

1. `TK-860`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-host-facing-transport-formalization-and-distribution-boundary.md`

## 3. 预期产物

1. explicit acp_exec routing plan
2. fail-closed separation boundary
3. synced task ledger once activation begins

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-105-acp-host-facing-transport-rollout/sprint-001-acp-host-facing-transport-rollout/tasks/TK-860-implement-acp-host-facing-transport-rollout-baseline.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-host-facing-transport-formalization-and-distribution-boundary.md`
3. `.repo-ai-governor/context/dev/project-104-cli-exec-onboarding-adoption-readiness-rollout/plan.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/acp-host-facing-transport-formalization-technical-solution.md`

## 6. 实施计划

1. 固定 `acp_exec` 与 `cli_exec` 的 distinct transport routing 边界。
2. 明确 fail-closed 语义，避免同一 surface 内 transport rewrite。
3. 为 `TK-883` companion carrier 提供清晰的 transport-scoped 上下文。

## 7. Development Verification

1. `pnpm exec vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts`
2. `pnpm run build`
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-14：任务创建，状态初始化为 `planned`。
2. 2026-04-15：已将 `acp_exec` 作为显式 transport 纳入 routing/runtime truth，并通过 CLI-local synthetic ACP protocol 保持 fail-closed 分离：`createProtocolBySurface()` 在 `acp_exec` 下不再复用 `cli_exec` adapter，verification/local probe 不再要求 `codex` 命令存在，health check 会稳定保留 `transportKind=acp_exec` 与 ACP baseline diagnostics，避免 same-surface transport rewrite。focused routing suites、`pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 已在同窗通过，当前任务完成。

## 10. 产出

1. `packages/shared/src/constants/adapter-runtime.constant.ts`
2. `apps/cli/src/runtime/adapter-routing-runtime.ts`
3. `apps/cli/src/runtime/local-model-probe-runtime.ts`
4. `apps/cli/src/runtime/cli-acp-host-protocol.ts`
5. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
6. `apps/cli/src/runtime/session-main-provider-continuation-runtime.ts`
7. `apps/cli/test/runtime/adapter-routing-runtime.test.ts`
8. `apps/cli/test/runtime/adapter-verification-runtime.test.ts`
9. `apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts`
