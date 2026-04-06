# DA-598 Claude Code real invocation config probe timeout and degrade contract

- Status: completed
- Date: 2026-04-06
- Project: `project-053-real-adapter-invocation-productization`
- Sprint: `sprint-001-claude-code-real-invocation-baseline`
- Task: `TK-598`

## 1. Contract Summary

1. `Claude Code` 的 real invocation contract 仅在 `cli_exec` 与 `remote_api` 两种 execution mode 下成立；默认 `baseline` mode 仍只提供 fixture-backed truth。
2. `cli_exec` real path 以 live probe + live invoke 为真值，命令入口优先 `claude`，缺失时 fallback 到 `claude-code`。
3. `remote_api` real path 以 Anthropic Messages-compatible 请求为真值；只有显式 `remoteApi` 配置存在时才可进入该路径。

## 2. Config And Probe Contract

1. `remote_api` credential source 按 `env -> credentialRef -> provider-local` 的 truth surface 暴露；`credentialRef` 在 secret 未 materialize 时保持 manual-only unavailable truth，不伪装成 available。
2. provider-local Claude settings 只在 `allowProviderLocalConfig: true` 时启用，且 discovery 保持 read-only。
3. `cli_exec` probe 使用 live health-check prompt（`Respond with exactly OK.`）与短 TTL cache；missing command、credential failure、timeout、rate limit 继续映射为稳定 unavailable reasons。

## 3. Timeout Contract

1. `Claude Code` real invocation 的正式 timeout contract 固定为 `500ms -> 600000ms`。
2. 普通 real invoke / stream 默认 budget 为 `30000ms`；repository-review route 默认 budget 为 `600000ms`。
3. `agentInvocationTimeoutMs` 与 `remoteApi.requestTimeoutMs` 都会被规范化到上述 contract window 内，避免 capability matrix 与真实执行预算再出现漂移。

## 4. Degrade Contract

1. `cli_exec` real path 的 capability matrix 明确保留以下 truth：
   - `structured_output`、`parallel_task`、`streaming` 为 `degraded`
   - `confirmation_gate`、`cancellation` 为 `unsupported`
2. credential / probe / endpoint 等环境前置条件失败时，adapter probe 仍返回 `unavailable` 真值；产品层 fallback/degraded routing 由更上层 orchestration 负责，不在 adapter probe 中伪装成 success。

## 5. Evidence

1. `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
2. `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`
3. `docs/support-matrix.md`
4. `docs/support-matrix.zh-CN.md`
