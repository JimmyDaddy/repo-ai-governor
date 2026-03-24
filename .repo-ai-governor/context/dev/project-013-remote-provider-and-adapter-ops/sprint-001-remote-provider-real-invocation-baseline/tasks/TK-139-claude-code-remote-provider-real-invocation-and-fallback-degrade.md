# TK-139 Claude Code 远端 provider 真实调用与 fallback/degrade 收口

- Status: planned
- Date: 2026-03-25
- Owner: AI-Agent
- Priority: P0
- Project: `project-013-remote-provider-and-adapter-ops`
- Sprint: `sprint-001-remote-provider-real-invocation-baseline`

## 1. 任务目标

将 Claude Code 从 baseline stub 升级为真实 provider 执行面，并补齐与 fallback/degrade、restricted-network/local fallback 的协作边界。

## 2. Depends On

1. `TK-136`
2. `DA-136`

## 3. 预期产物

1. `DA-139` Claude Code 远端 provider 真实调用与 fallback/degrade 基线。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops/plan.md`
2. `.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops/sprint-001-remote-provider-real-invocation-baseline/tasks/DA-136-remote-provider-execution-and-adapter-ops-baseline-and-dependency-contract.md`
3. `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
4. `apps/cli/src/runtime/adapter-routing-runtime.ts`

## 5. 实施计划

1. 接入真实 provider `probe/invoke` 路径。
2. 收敛 fallback/degrade 与 route-runner 协作边界。
3. 回写台账、产物与 review。

## 6. 验证

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm run test:packages -- packages/adapters/claude-code --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check`

## 7. 执行记录

1. 2026-03-25：任务创建，状态初始化为 `planned`。
