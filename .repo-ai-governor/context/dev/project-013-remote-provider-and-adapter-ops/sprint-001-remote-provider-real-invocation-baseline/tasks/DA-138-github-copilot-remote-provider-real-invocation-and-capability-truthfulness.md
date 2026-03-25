# DA-138 GitHub Copilot 远端 provider 真实调用与 capability truthfulness 基线

- Status: active
- Date: 2026-03-25
- Owner: AI-Agent
- Artifact ID: `DA-138`
- Produced By: `TK-138`
- Scope: `project-013-remote-provider-and-adapter-ops`

## 1. 目的

将 `@repo-ai-governor/adapter-github-copilot` 从 baseline stub 升级为可验证的真实 provider 执行面，并把命令入口、capability truthfulness、诊断映射和 gate 稳定性固化为后续远端 provider 收口的第二条参考基线。

## 2. 本轮实现摘要

1. `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`
   - 新增 `CLI_EXEC` 执行模式，通过 GitHub Copilot CLI 非交互 JSON 模式执行真实 `probe/invoke`。
   - 默认优先走直接命令 `copilot`，缺失时自动回退到 `gh copilot --` 兼容入口。
   - 增加 probe 缓存、JSONL 输出解析、quota/credential/timeout 失败映射。
2. `apps/cli/src/runtime/adapter-routing-runtime.ts`
   - CLI runtime 默认对 GitHub Copilot surface 走 `CLI_EXEC`，不再继续使用 baseline stub。
3. `apps/cli/src/runtime/local-model-probe-runtime.ts`
   - 本地 readiness probe 改为优先 `copilot --version`，缺失时回退 `gh copilot -- --version`。
4. `apps/cli/src/main.ts`
   - CLI entrypoint 新增 GitHub Copilot deterministic fixture 注入，并把当前 fixture mode 写入 JSON diagnostics。

## 3. capability truthfulness 收口

1. `CLI_EXEC` 模式下：
   - `TOOL_CALLING` 保持 `SUPPORTED`
   - `STRUCTURED_OUTPUT` 保持 `DEGRADED`
   - `CONFIRMATION_GATE` 收紧为 `UNSUPPORTED`
   - `CANCELLATION` 收紧为 `UNSUPPORTED`
2. `requestConfirmation()` 在 `CLI_EXEC` 下返回 `REVISE + escalate_to_human_gate`，不再伪装成本地可确认 provider。
3. `cancel()` 在 `CLI_EXEC` 下返回 `acknowledged=false`，避免对 CLI 子进程取消能力做超额承诺。

## 4. 公开契约治理

1. 导出的有限集合常量集中到了 `packages/adapters/github-copilot/src/constants/github-copilot-agent-adapter.constant.ts`。
2. 导出的 interface/type 集中到了 `packages/adapters/github-copilot/src/types/interfaces/github-copilot-agent-adapter.interface.ts`。
3. `packages/adapters/github-copilot/src/index.ts` 只做公共入口转发，`github-copilot-agent-adapter.ts` 自身收敛为运行实现。

## 5. Gate 稳定性约束

1. CLI 新增内部 fixture 注入面：
   - `apps/cli/src/constants/github-copilot-exec-fixture.constant.ts`
   - `apps/cli/src/runtime/github-copilot-exec-fixture-runtime.ts`
2. fixture override 需要同时满足：
   - `REPO_AI_GOVERNOR_GITHUB_COPILOT_EXEC_FIXTURE=<mode>`
   - `REPO_AI_GOVERNOR_ENABLE_TEST_FIXTURES=1`
3. 以下 gate 路径已经切到 fixture：
   - `apps/cli/test/cli-output-contract.integration.test.ts`
   - `scripts/examples/check-examples-runtime.js`
   - `scripts/ci/stage9-blackbox-ga-lib.js`
   - `test/e2e/blackbox-governance-flow.e2e.test.ts`

## 6. 形成的运维契约

1. 缺少可执行文件时输出 `command_missing:github-copilot:<command>`。
2. 缺少登录态或凭据时输出 `credential_missing:github-copilot`。
3. health probe 超时时输出 `health_check_timeout:github-copilot`。
4. quota 耗尽时输出 `health_check_failed:github-copilot:quota_exhausted`。
5. 其他 probe 失败统一输出 `health_check_failed:github-copilot:<detail>`。

## 7. 后续输入

1. `TK-139` 需要沿用本 artifact 的“真实 provider + capability truthfulness + gate 稳定性”三段式收口方式。
2. `TK-140` 需要把 GitHub Copilot 的命令入口回退、capability truthfulness 和 fixture fail-closed 规则抽象成跨 provider 统一约束。
3. `TK-141` 应将本 artifact 作为 sprint-001 出口证据之一。

## 8. 验证

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm -s vitest run packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts apps/cli/test/runtime/github-copilot-exec-fixture-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts test/first-batch-adapters-route.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/examples/check-examples-runtime.js`
4. `pnpm -s vitest run test/e2e/blackbox-governance-flow.e2e.test.ts --config vitest.e2e.config.ts --maxWorkers=1 --maxConcurrency=1`
5. `pnpm run check`
