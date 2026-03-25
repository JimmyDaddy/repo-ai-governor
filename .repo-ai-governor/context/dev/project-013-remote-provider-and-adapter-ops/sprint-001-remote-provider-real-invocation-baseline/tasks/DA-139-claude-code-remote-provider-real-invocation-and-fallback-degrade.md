# DA-139 Claude Code 远端 provider 真实调用与 fallback/degrade 基线

- Status: active
- Date: 2026-03-25
- Producer Task: `TK-139`
- Scope: `packages/adapters/claude-code`, `apps/cli`, route/integration/gate fixtures

## 1. 交付结论

1. Claude Code 已从 baseline stub 升级为真实 CLI-backed provider 路径，默认通过 `claude` 执行，并在缺失时回退到 `claude-code`。
2. `probe/invoke`、capability matrix、confirmation/cancellation 语义、CLI runtime route wiring、fixture/gate 注入面和 route/integration tests 已保持一致。
3. `project-013` 当前不再把 baseline Claude adapter 作为生产 route candidate；restricted-network / blackbox / examples runtime 也不再隐式依赖本机真实 Claude 会话。
4. 由于当前真实 CLI 仍是 plain-text `--output-format text` 路径，`STRUCTURED_OUTPUT` 已明确降级为 `DEGRADED`；默认 reviewer route 也已回切到 Codex 主选，避免把 Claude Code 当成正式结构化输出 surface。

## 2. 关键实现

1. `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
   - 新增 `CLI_EXEC` 模式。
   - 实现真实 `probe/invoke` 包装。
   - `probe` 使用真实健康检查 prompt，并对 timeout / credential / missing command 做 unavailable reason 映射。
   - `invoke` 通过非交互 print mode 执行 stage prompt。
   - `CLI_EXEC` 下 `requestConfirmation()` 改为 `REVISE`，`cancel()` 改为 `acknowledged=false`。
2. `packages/adapters/claude-code/src/constants/claude-code-agent-adapter.constant.ts`
   - 对齐共享 `AgentCliExecutionMode`。
3. `packages/adapters/claude-code/src/types/interfaces/claude-code-agent-adapter.interface.ts`
   - 对齐共享 CLI exec runner 基础契约，只保留 provider 特化字段。
4. `apps/cli/src/runtime/adapter-routing-runtime.ts`
   - `claude-code` 已默认使用 `CLI_EXEC` 模式，不再实例化 baseline adapter。
5. `apps/cli/src/runtime/claude-code-exec-fixture-runtime.ts`
   - 增加与 Codex / GitHub Copilot 对齐的内部 fixture 注入面，避免 gate 依赖真实 Claude 登录态。
6. `apps/cli/src/main.ts`
   - 将 Claude fixture runner 接入真实 CLI 入口。
7. `test/first-batch-adapters-route.integration.test.ts`
   - 路由回归不再锁定 baseline Claude stub，而是显式运行真实 `CLI_EXEC` 语义的 fixture runner。

## 3. Truthfulness 约束

1. Claude Code production route 现在只在 `CLI_EXEC` 路径上参与 routing。
2. capability matrix 不再夸大 confirmation/cancellation 语义。
3. 在真实 `CLI_EXEC` 仍未接入 JSON / schema 校验前，`STRUCTURED_OUTPUT` 不会被误报为 `SUPPORTED`。
4. 非零退出、缺失命令、认证缺失和超时都不会被误判成可用 surface。
5. `doctor/connect/verify` 的 diagnostics 与 route runner 的选路语义保持一致。

## 4. 验证证据

1. `claude --help` 已确认官方非交互入口为 `claude -p --output-format <format>`。
2. `claude auth status` 可返回结构化登录态；本机验证显示当前可识别认证是否存在。
3. `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`
   - 覆盖真实 `CLI_EXEC` capability truthfulness、credential failure、non-zero exit fail-closed、`claude -> claude-code` 回退。
4. `test/first-batch-adapters-route.integration.test.ts`
   - 覆盖 route runner 对真实 CLI-backed Claude surface 的选路。
5. `apps/cli/test/cli-governance-runtime.integration.test.ts`
   - 覆盖 CLI runtime 下的 Claude credential diagnostics。
6. `apps/cli/test/runtime/claude-code-exec-fixture-runtime.test.ts`
   - 覆盖 fixture enable gate 的 fail-closed 行为。

## 5. 后续输入

1. `TK-140` 应继续统一跨 provider 的 credential / retry / timeout / redaction / diagnostics 契约。
2. `TK-141` 应将 Claude Code 真实 provider 路径纳入 sprint-001 出口验收。
