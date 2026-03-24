# DA-137 Codex 远端 provider 真实调用与凭据/health 契约基线

- Status: active
- Date: 2026-03-25
- Owner: AI-Agent
- Artifact ID: `DA-137`
- Produced By: `TK-137`
- Scope: `project-013-remote-provider-and-adapter-ops`

## 1. 目的

将 `@repo-ai-governor/adapter-codex` 从 baseline stub 升级为可验证的真实 provider 执行面，并把凭据失败、health probe、诊断映射与 gate 稳定性固化为后续远端 provider 收口的参考基线。

## 2. 本轮实现摘要

1. `packages/adapters/codex/src/codex-agent-adapter.ts`
   - 新增 `CLI_EXEC` 执行模式，通过 `codex exec --skip-git-repo-check --json -` 进行真实 `probe/invoke`。
   - 为 probe 增加短 TTL 缓存，避免同一执行窗口内重复 health check。
   - 新增 JSONL 输出解析，提取 `agent_message`、`thread_id` 与 `usage`。
2. `apps/cli/src/runtime/adapter-routing-runtime.ts`
   - CLI runtime 默认对 Codex surface 走 `CLI_EXEC`，不再把 CLI 路由默认为 baseline stub。
3. `apps/cli/src/runtime/adapter-verification-runtime.ts`
   - 将 `credential_missing`、`health_check_timeout`、`health_check_invalid_response`、`health_check_failed` 统一映射到可消费的 failure attribution / next actions。
4. `apps/cli/src/runtime/adapter-diagnostics-runtime.ts`
   - 将上述 unavailable reasons 序列化为人类可读 diagnostics 与 `nextActions`。

## 3. 公开契约治理

1. 导出的有限集合常量集中到了 `packages/adapters/codex/src/constants/codex-agent-adapter.constant.ts`。
2. 导出的 interface/type 集中到了 `packages/adapters/codex/src/types/interfaces/codex-agent-adapter.interface.ts`。
3. `packages/adapters/codex/src/index.ts` 只做公共入口转发，`codex-agent-adapter.ts` 自身收敛为运行实现。

## 4. Gate 稳定性约束

1. 为避免 repo 级 smoke / e2e / `dist/bin` 路径在本地 gate 中依赖真实 Codex 登录态，CLI 新增了内部 fixture 注入面：
   - `apps/cli/src/constants/codex-exec-fixture.constant.ts`
   - `apps/cli/src/runtime/codex-exec-fixture-runtime.ts`
2. `main.ts` 会在设置 `REPO_AI_GOVERNOR_CODEX_EXEC_FIXTURE` 时注入确定性 `CodexExecRunner`，并把当前 fixture mode 写入 JSON diagnostics。
3. 以下 gate 路径已经切到 fixture：
   - `scripts/examples/check-examples-runtime.js`
   - `scripts/ci/stage9-blackbox-ga-lib.js`
   - `test/e2e/blackbox-governance-flow.e2e.test.ts`
   - `apps/cli/test/cli-output-contract.integration.test.ts`

## 5. 形成的运维契约

1. 缺少可执行文件时输出 `command_missing:codex:<command>`。
2. 缺少登录态或凭据时输出 `credential_missing:codex`。
3. health probe 超时时输出 `health_check_timeout:codex`。
4. health probe 返回异常响应时输出 `health_check_invalid_response:codex:<detail>`。
5. 其他 probe 失败统一输出 `health_check_failed:codex:<detail>`。

## 6. 后续输入

1. `TK-138` / `TK-139` 需要沿用本 artifact 的“真实 provider + 运维契约 + gate 稳定性”三段式收口方式。
2. `TK-140` 需要把本 artifact 中 Codex 的错误映射、fixture 稳定性和 truthfulness 规则抽象为跨 provider 的统一约束。
3. `TK-141` 应将本 artifact 作为 sprint-001 出口证据之一。

## 7. 验证

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm -s vitest run apps/cli/test/runtime/codex-exec-fixture-runtime.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts test/first-batch-adapters-route.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/examples/check-examples-runtime.js`
4. `pnpm -s vitest run test/e2e/blackbox-governance-flow.e2e.test.ts --config vitest.e2e.config.ts --maxWorkers=1 --maxConcurrency=1`
5. `pnpm run check`
