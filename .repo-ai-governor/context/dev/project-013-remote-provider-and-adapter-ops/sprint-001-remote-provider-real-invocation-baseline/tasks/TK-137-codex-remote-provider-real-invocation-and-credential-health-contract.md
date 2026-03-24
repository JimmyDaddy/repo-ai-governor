# TK-137 Codex 远端 provider 真实调用与凭据/health 契约

- Status: in_progress
- Date: 2026-03-25
- Owner: AI-Agent
- Priority: P0
- Project: `project-013-remote-provider-and-adapter-ops`
- Sprint: `sprint-001-remote-provider-real-invocation-baseline`

## 1. 任务目标

将 Codex 从 baseline stub 升级为真实 provider 执行面，并补齐凭据来源优先级、health/deep probe、错误映射与最小 degrade path 契约。

## 2. Depends On

1. `TK-136`
2. `DA-136`

## 3. 预期产物

1. `DA-137` Codex 远端 provider 真实调用与凭据/health 契约基线。
2. `resolved_code_review_tk-137-codex-remote-provider-real-invocation-and-credential-health-contract.md`

## 4. Input References

1. `.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops/plan.md`
2. `.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops/sprint-001-remote-provider-real-invocation-baseline/tasks/DA-136-remote-provider-execution-and-adapter-ops-baseline-and-dependency-contract.md`
3. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/DA-094-multi-tool-model-real-invocation-and-unattended-flow.md`
4. `packages/adapters/codex/src/codex-agent-adapter.ts`
5. `apps/cli/src/runtime/adapter-routing-runtime.ts`

## 5. 实施计划

1. 落地 Codex 的真实 credential resolution 与 health/deep probe。
2. 将 `invokeStage()` 从 baseline stub 升级为真实 provider 调用路径。
3. 同步 capability truthfulness、diagnostics 和 route-runner 输出。
4. 回写台账、产物与 review。

## 6. 验证

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm run test:packages -- packages/adapters/codex --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check`

## 7. 执行记录

1. 2026-03-25：任务创建，状态初始化为 `planned`。
2. 2026-03-25：任务启动，已将 `DA-136` 固化为唯一基线输入；当前开始收敛 Codex 真实 `probe/invoke` 与凭据/health 运维契约。
