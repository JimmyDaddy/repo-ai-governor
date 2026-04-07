# TK-598 freeze Claude Code real invocation config probe timeout and degrade contract

- Status: completed
- Date: 2026-04-06
- Task ID: `TK-598`
- Owner: `AI-Agent`
- Priority: `P1`
- Sprint: `sprint-001-claude-code-real-invocation-baseline`
- Project: `project-053-real-adapter-invocation-productization`

## 1. 任务目标

冻结 `Claude Code` 真实调用的 config/probe/timeout/degrade contract。

## 2. Depends On

1. `project-052` final closeout completed

## 3. Expected Outputs

1. `DA-598-claude-code-real-invocation-config-probe-timeout-and-degrade-contract.md`
2. timeout / capability contract-aligned Claude Code adapter runtime updates
3. smoke-test evidence covering timeout and repository-review defaults

## 4. Execution Notes

1. 2026-04-06：任务创建，等待 `project-053` 激活。
2. 2026-04-06：`project-052` final closeout 已完成，任务切换为 `in_progress`，开始冻结 `Claude Code` 真实调用 contract 边界。
3. 2026-04-06：已完成 `DA-598`、timeout contract 对齐与 smoke-test 补强；同窗口 `pnpm vitest run packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1` 与 `pnpm run build` 均通过，`Claude Code` real invocation 的 config/probe/timeout/degrade contract 已冻结。
