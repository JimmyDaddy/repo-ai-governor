# DA-599 Claude Code default real path structured parsing and timeout handling

- Status: completed
- Date: 2026-04-06
- Project: `project-053-real-adapter-invocation-productization`
- Sprint: `sprint-001-claude-code-real-invocation-baseline`
- Task: `TK-599`

## 1. Delivery Summary

1. `Claude Code` 的真实调用路径现在会在未显式声明 transport 时，对外投影为默认 `cli_exec`，避免 onboarding/verify contract 把真实默认路径显示成 `null`。
2. `cli_exec` 与 `remote_api` 两条真实调用路径都支持在保留原始 `responseText` 的同时，回填可选 `structuredResponse`，以承接 raw JSON 或 fenced JSON 输出。
3. timeout truth 继续沿用 `TK-598` 冻结后的 `500ms -> 600000ms` contract，本次工作没有引入新的 budget 漂移。

## 2. Contract Tightening

1. `apps/cli` onboarding transport matrix 现在统一通过 `resolveToolTransportKind(...)` 计算 transport truth，因此 `Claude Code`、`Codex`、`GitHub Copilot` 在未显式配置 transport 时仍会如实显示 `cli_exec`。
2. `packages/adapters/claude-code` 在 `invokeStage` 输出中新增可选 `structuredResponse` 字段，仅当响应文本可解析为 JSON 时回填，避免伪造结构化成功。
3. `remote_api` 路径对 Anthropic Messages 返回的文本同样执行结构化提取，支持整段 JSON 和 ````json fenced payload。

## 3. Verification Evidence

1. `pnpm vitest run packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run build`

## 4. Changed Surfaces

1. `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
2. `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`
3. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
4. `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
