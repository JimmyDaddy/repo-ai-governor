# DA-140 跨 provider adapter 运维契约与 route-runner truthfulness 基线

- Status: active
- Date: 2026-03-25
- Owner: AI-Agent
- Artifact ID: `DA-140`
- Produced By: `TK-140`
- Scope: `project-013-remote-provider-and-adapter-ops`

## 1. 目的

将 Codex / GitHub Copilot / Claude Code 已完成的单 provider 真实执行面进一步收敛为统一的远端 adapter 运维契约，确保 retry/backoff、错误细节抽取、脱敏、限流与 quota 诊断、以及 route-runner 对外 truthfulness 不再按 provider 各自散落实现。

## 2. 本轮实现摘要

1. `packages/adapter-sdk/src/agent-cli-exec-operations-runtime.ts`
   - 新增跨 provider 共用的 CLI exec operations runtime。
   - 统一 `probe/invoke` 的 retry/backoff 执行器。
   - 统一错误细节抽取、敏感输出脱敏与 unavailable reason 片段清洗。
2. `packages/adapter-sdk/src/constants/agent-cli-exec.constant.ts`
   - 上提 `DEFAULT_AGENT_CLI_EXEC_MAX_RETRY_ATTEMPTS` 与 `DEFAULT_AGENT_CLI_EXEC_RETRY_BACKOFF_MS`。
3. `packages/adapter-sdk/src/types/interfaces/agent-cli-exec.interface.ts`
   - 在共享 `AgentCliAdapterOptions` 中新增 `maxRetryAttempts`、`retryBackoffMs`。
4. `packages/adapters/codex/src/codex-agent-adapter.ts`
5. `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`
6. `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
   - 三个远端 provider 现统一消费 `AgentCliExecOperationsRuntime`，不再各自维护重试、错误 detail 拼接与脱敏逻辑。
7. `apps/cli/src/runtime/adapter-diagnostics-runtime.ts`
   - 对 `rate_limited`、`quota_exhausted` 的 diagnostics 文案统一人类可读映射。

## 3. 统一后的运维契约

1. retry/backoff
   - 所有远端 CLI-backed provider 默认统一使用 `maxRetryAttempts=2`、`retryBackoffMs=250`。
   - 仅对 timeout、rate-limit、quota 等可恢复故障重试；非瞬时错误保持 fail-fast。
   - 已 abort 的 caller 请求不会进入重试路径；每次重试都消费同一个总 timeout budget，而不是重复使用完整单次 `timeoutMs`。
2. secret redaction
   - stdout、stderr、message 中的 token/bearer/api-key/password 等敏感片段统一在共享 runtime 做脱敏。
   - provider 自身对外抛出的 `details` 不再直接暴露原始 CLI 输出。
3. error detail truthfulness
   - 优先读取 canonical `details`，兼容 legacy `metadata`，避免 provider 之间 detail 读取口径不一致。
   - `sanitizeReasonSegment()` 已统一，provider 不再各自生成风格不同的 unavailable reason 片段。
4. route-runner / diagnostics truthfulness
   - 远端 provider 的 rate-limit / quota 问题会被统一映射为可读 diagnostics，而不是散落成各 provider 私有模糊文案。
   - route/integration 层消费到的 unavailable reasons 与 adapter 实际 probe 行为保持一致。

## 4. 关键收益

1. 远端 adapter 不再各自复制 retry、detail、redaction 逻辑，后续新增 provider 时只需补 provider 特化探测与输出解析。
2. CLI runtime、route runner 和 diagnostics 面已经开始消费统一的 failure taxonomy，不再依赖单个 provider 的实现细节。
3. `TK-141` 可以直接以共享运维契约为 sprint-001 出口证据，而不需要逐个 provider 重述同类约束。

## 5. 后续输入

1. `TK-141` 需将本 artifact 纳入 sprint-001 出口验收，确认远端 provider 统一运维契约已经形成稳定基线。
2. 后续新增远端 provider 时，默认应复用 `AgentCliExecOperationsRuntime`，不得再次在 adapter 内复制 retry/redaction/detail 逻辑。

## 6. 验证

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm -s vitest run packages/adapter-sdk/test/agent-cli-exec-operations-runtime.unit.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts test/first-batch-adapters-route.integration.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run test:packages -- @repo-ai-governor/adapter-sdk @repo-ai-governor/adapter-codex @repo-ai-governor/adapter-github-copilot @repo-ai-governor/adapter-claude-code @repo-ai-governor/cli --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run check`
