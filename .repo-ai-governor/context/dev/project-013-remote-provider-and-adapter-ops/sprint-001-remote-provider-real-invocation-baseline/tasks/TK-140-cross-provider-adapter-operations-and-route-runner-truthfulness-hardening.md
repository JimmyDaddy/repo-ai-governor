# TK-140 跨 provider adapter 运维契约与 route-runner truthfulness hardening

- Status: completed
- Date: 2026-03-25
- Owner: AI-Agent
- Priority: P0
- Project: `project-013-remote-provider-and-adapter-ops`
- Sprint: `sprint-001-remote-provider-real-invocation-baseline`

## 1. 任务目标

统一 Codex / GitHub Copilot / Claude Code 的 adapter operations 契约，并收敛 route-runner、capability matrix、diagnostics 与真实执行面的 truthfulness。

## 2. Depends On

1. `TK-137`
2. `TK-138`
3. `TK-139`
4. `DA-136`

## 3. 预期产物

1. `DA-140` 跨 provider adapter 运维契约与 route-runner truthfulness 基线。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops/plan.md`
2. `.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops/sprint-001-remote-provider-real-invocation-baseline/tasks/DA-136-remote-provider-execution-and-adapter-ops-baseline-and-dependency-contract.md`
3. `apps/cli/src/runtime/adapter-routing-runtime.ts`
4. `packages/adapter-sdk/src/agent-route-runner.ts`
5. `packages/adapters/codex/src/codex-agent-adapter.ts`
6. `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`
7. `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`

## 5. 实施计划

1. 统一凭据优先级、health/deep probe、retry/backoff、secret redaction 与 degrade path。
2. 统一 route-runner diagnostics、capability truthfulness 与 adapter output 结构。
3. 回写台账、产物与 review。

## 6. 验证

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check`

## 7. 执行记录

1. 2026-03-25：任务创建，状态初始化为 `planned`。
2. 2026-03-25：任务启动，开始把 Codex / GitHub Copilot / Claude Code 已落下的真实 CLI exec 基线收敛为共享运维契约，优先统一 retry/backoff、detail 抽取、脱敏和 diagnostics truthfulness。
3. 2026-03-25：已完成共享 `AgentCliExecOperationsRuntime`、统一 retry/backoff defaults、跨 provider redaction/detail 收口，以及 CLI diagnostics 对 rate-limit / quota 的统一 truthfulness；`DA-140` 和 resolved review 已补齐。
4. 2026-03-25：已完成 follow-up CR 修复：共享 retry runtime 现显式消费 caller `signal + timeoutMs`，已 abort 请求不再重试，并按单一总 timeout budget 计算每次重试的剩余时间。
