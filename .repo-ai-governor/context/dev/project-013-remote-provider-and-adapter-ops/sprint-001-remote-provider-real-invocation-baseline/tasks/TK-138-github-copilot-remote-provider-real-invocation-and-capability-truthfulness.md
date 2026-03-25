# TK-138 GitHub Copilot 远端 provider 真实调用与 capability truthfulness 收口

- Status: completed
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
2. 2026-03-25：任务启动，已确认 GitHub Copilot 当前官方 direct CLI 入口为 `copilot`，并保留 `gh copilot --` 兼容回退；开始收敛真实 `probe/invoke`、capability truthfulness 与 gate fixture 注入。
3. 2026-03-25：已完成真实 `probe/invoke`、`copilot` 直连优先与 `gh copilot --` 回退、capability truthfulness、fixture fail-closed 与 gate 稳定性收口；`DA-138` 与 resolved review 已补齐。
4. 2026-03-25：已完成 follow-up review comment 修复：将 `CLI_EXEC` / `probe|invoke` 闭合集合与 CLI exec 基础契约上提到 `adapter-sdk`，并让 `codex/github-copilot` 只保留 provider 特化扩展。
5. 2026-03-25：已完成 pending CR `2.1` 修复：GitHub Copilot adapter 现会对进程 `exitCode` 与 JSON `result.exitCode` 非零统一 fail-closed，并补齐 smoke 回归。
