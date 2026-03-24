# TK-138 GitHub Copilot 远端 provider 真实调用与 capability truthfulness 收口

- Status: planned
- Date: 2026-03-25
- Owner: AI-Agent
- Priority: P0
- Project: `project-013-remote-provider-and-adapter-ops`
- Sprint: `sprint-001-remote-provider-real-invocation-baseline`

## 1. 任务目标

将 GitHub Copilot 从 baseline stub 升级为真实 provider 执行面，并收敛 capability matrix、diagnostics 与真实行为的一致性。

## 2. Depends On

1. `TK-136`
2. `DA-136`

## 3. 预期产物

1. `DA-138` GitHub Copilot 远端 provider 真实调用与 capability truthfulness 基线。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops/plan.md`
2. `.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops/sprint-001-remote-provider-real-invocation-baseline/tasks/DA-136-remote-provider-execution-and-adapter-ops-baseline-and-dependency-contract.md`
3. `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`
4. `apps/cli/src/runtime/adapter-routing-runtime.ts`

## 5. 实施计划

1. 接入真实 provider `probe/invoke` 路径。
2. 校准 capability truthfulness、错误映射和 diagnostics。
3. 回写台账、产物与 review。

## 6. 验证

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm run test:packages -- packages/adapters/github-copilot --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check`

## 7. 执行记录

1. 2026-03-25：任务创建，状态初始化为 `planned`。
