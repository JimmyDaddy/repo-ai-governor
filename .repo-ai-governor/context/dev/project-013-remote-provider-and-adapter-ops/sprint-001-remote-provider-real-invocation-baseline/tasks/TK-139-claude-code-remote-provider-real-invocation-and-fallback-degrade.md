# TK-139 Claude Code 远端 provider 真实调用与 fallback/degrade 收口

- Status: completed
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
2. 2026-03-25：任务启动，开始核对 Claude Code 本地 CLI 入口、baseline adapter truthfulness 缺口，以及与 route-runner / restricted-network fallback 的协作边界。
3. 2026-03-25：已完成真实 `CLI_EXEC` 路径、`claude -> claude-code` 回退、route/fallback truthfulness 与 fixture gate 注入；`DA-139`、task review 与 adapters working-tree follow-up review 已同步收口。
4. 2026-03-25：已完成 follow-up CR 修复；`STRUCTURED_OUTPUT` truthfulness 已降为 `DEGRADED`，默认 reviewer route 已切回 Codex 主选，并补齐 fail-closed 回归。
5. 2026-03-25：已完成第二轮 pending CR 复核；确认当前 working tree 已覆盖 `STRUCTURED_OUTPUT` truthfulness 与 route fail-closed 修复，无需新增代码补丁。
