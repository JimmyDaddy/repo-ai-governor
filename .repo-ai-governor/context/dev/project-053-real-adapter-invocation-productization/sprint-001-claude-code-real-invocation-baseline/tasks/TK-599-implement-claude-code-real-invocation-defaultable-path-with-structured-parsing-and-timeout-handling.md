# TK-599 implement Claude Code real invocation defaultable path with structured parsing and timeout handling

- Status: completed
- Date: 2026-04-06
- Task ID: `TK-599`
- Owner: `AI-Agent`
- Priority: `P1`
- Sprint: `sprint-001-claude-code-real-invocation-baseline`
- Project: `project-053-real-adapter-invocation-productization`

## 1. 任务目标

实现 `Claude Code` 真实调用 defaultable path、structured parsing 与 timeout handling。

## 2. Depends On

1. `TK-598`

## 3. Expected Outputs

1. `DA-599-claude-code-default-real-path-structured-parsing-and-timeout-handling.md`
2. defaultable real invocation truth in onboarding/verify transport projection
3. `structuredResponse` parsing for Claude Code `cli_exec` and `remote_api` invoke paths
4. smoke/unit coverage plus same-window build evidence

## 4. Execution Notes

1. 2026-04-06：任务创建，等待 `TK-598` 完成。
2. 2026-04-06：完成 `DA-599`，为 `Claude Code` onboarding/verify transport matrix 接入 effective default `cli_exec` truth，避免未显式 transport 配置时对外显示为 `null`。
3. 2026-04-06：在 `packages/adapters/claude-code` 中补齐 raw JSON 与 fenced JSON 的 `structuredResponse` 提取，同时保留原始 `responseText` 作为真实输出证据。
4. 2026-04-06：同窗口 `pnpm vitest run packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts --maxWorkers=1 --maxConcurrency=1` 与 `pnpm run build` 全部通过，任务完成。
