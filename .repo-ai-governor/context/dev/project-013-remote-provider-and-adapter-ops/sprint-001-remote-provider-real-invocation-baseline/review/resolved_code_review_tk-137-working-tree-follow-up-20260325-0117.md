# Code Review: TK-137 Working Tree Follow-up

- Status: resolved
- Date: 2026-03-25
- Reviewer: AI-Agent
- Task: `TK-137`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops/sprint-001-remote-provider-real-invocation-baseline/tasks/TK-137-codex-remote-provider-real-invocation-and-credential-health-contract.md`
  - `.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops/sprint-001-remote-provider-real-invocation-baseline/tasks/DA-137-codex-remote-provider-real-invocation-and-credential-health-contract.md`

## 1. Review Scope
1. `apps/cli/src/main.ts`
2. `apps/cli/src/runtime/codex-exec-fixture-runtime.ts`
3. `packages/adapters/codex/src/codex-agent-adapter.ts`
4. `apps/cli/src/runtime/adapter-routing-runtime.ts`
5. `apps/cli/src/runtime/adapter-verification-runtime.ts`
6. `apps/cli/src/runtime/adapter-diagnostics-runtime.ts`
7. `apps/cli/test/cli-governance-runtime.integration.test.ts`
8. `apps/cli/test/cli-output-contract.integration.test.ts`
9. `apps/cli/test/runtime/codex-exec-fixture-runtime.test.ts`
10. `packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`
11. `scripts/examples/check-examples-runtime.js`
12. `scripts/ci/stage9-blackbox-ga-lib.js`
13. `test/e2e/blackbox-governance-flow.e2e.test.ts`

## 2. Findings
### 2.1 [P1] Production CLI unconditionally honors the Codex exec fixture environment override
- 位置: `apps/cli/src/main.ts:264-285`, `apps/cli/src/runtime/codex-exec-fixture-runtime.ts:23-37`
- 问题描述: `runCli()` 现在在所有真实 CLI 调用里都会读取 `REPO_AI_GOVERNOR_CODEX_EXEC_FIXTURE` 并把它解析成 `codexExecRunner` 注入运行时，没有任何 test-only / gate-only 限制。这样一来，只要外部 shell、CI 或目标仓库环境里出现这个变量，Codex 的真实 `probe/invoke` 就会被内部 fixture 静默替换。
- 影响: 这会把远端 provider 的真实性校验降成“看环境变量”，从而让 `connect --adapters`、后续 `verify/run` 乃至黑盒演练在没有真实 Codex 可用性的情况下也给出绿灯。实际复现中，不加 fixture 时 `HOME=/tmp node ./dist/bin/repo-ai-governor.js --output json --locale en-US connect --adapters` 返回 `adapter_status=warn` 且 Codex fallback；加上 `REPO_AI_GOVERNOR_CODEX_EXEC_FIXTURE=success` 后，同一命令直接变成 `adapter_status=pass`。
- 建议: 将 fixture 注入面限制在 test harness 或专用 gate wrapper 内，不要让生产 CLI 入口默认接受该 env；至少要加显式 debug/test 开关并在非测试上下文阻断。

### 2.2 [P2] Codex CLI_EXEC probe advertises contradictory cancellation semantics
- 位置: `packages/adapters/codex/src/codex-agent-adapter.ts:275-343`
- 问题描述: 在 `CLI_EXEC` 模式下，`requestConfirmation()` 明确返回 `REVISE`，`cancel()` 明确返回 `acknowledged: false`，同时 `capabilityStates` 也把 `CANCELLATION` 标成 `UNSUPPORTED`。但同一个 `createCapabilityMatrix()` 又把 `capabilityMatrix.cancellation.supportsCancel/supportsAbortSignal` 固定写成 `true`。
- 影响: 同一份 probe payload 对“是否支持取消”给出了互相冲突的结论。任何读取 `AgentCapabilityMatrix.cancellation` 的 route runner、诊断层或后续 adapter 统一治理逻辑，都会被误导到一个比真实能力更强的分支。
- 建议: 在 `CLI_EXEC` 模式下同步收紧 `capabilityMatrix.cancellation` 字段，使其与 `capabilityStates` 和 `cancel()` 的真实行为保持一致。

## 3. Notes
1. 用户贴出的旧 finding `test/ide-entry-smoke.integration.test.ts` 这一轮已修复：测试现在会把模板 env 注入 `runCli()`，并断言 `entrySurface / standardsProfileId / standardsSourceIds` diagnostics。
2. 本轮相关测试和 runtime smoke 都是绿的，说明上述风险目前不会被现有门禁自动拦住。

## 4. Verification
1. `pnpm -s vitest run apps/cli/test/runtime/codex-exec-fixture-runtime.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `HOME=/tmp node ./scripts/examples/check-examples-runtime.js`（通过）
3. `HOME=/tmp node ./dist/bin/repo-ai-governor.js --output json --locale en-US connect --adapters`（通过，结果为 `adapter_status=warn`）
4. `HOME=/tmp REPO_AI_GOVERNOR_CODEX_EXEC_FIXTURE=success node ./dist/bin/repo-ai-governor.js --output json --locale en-US connect --adapters`（通过，结果为 `adapter_status=pass`）

## 复核结论（2026-03-25）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`runCli()` 原先只要看到 `REPO_AI_GOVERNOR_CODEX_EXEC_FIXTURE` 就会注入 fake runner，确实会污染真实 CLI / dist 路径。现在 `apps/cli/src/runtime/codex-exec-fixture-runtime.ts` 已要求额外满足 `REPO_AI_GOVERNOR_ENABLE_TEST_FIXTURES=1`，否则直接 fail-closed；repo 级 smoke/e2e/gate wrapper 已改为显式传入双钥匙。
   - 处理：已修复。
2. `2.2`
   - 判定：**认可**
   - 证据：`packages/adapters/codex/src/codex-agent-adapter.ts` 现在按 `executionMode` 收紧 `capabilityMatrix.cancellation`，`CLI_EXEC` 模式下不再宣称 `supportsCancel/supportsAbortSignal=true`。
   - 处理：已修复。

### 验证命令
1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm -s vitest run apps/cli/test/runtime/codex-exec-fixture-runtime.test.ts apps/cli/test/cli-output-contract.integration.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `HOME=/tmp REPO_AI_GOVERNOR_CODEX_EXEC_FIXTURE=success node ./dist/bin/repo-ai-governor.js --output json --locale en-US connect --adapters`（通过，退出码 `1`，按预期 fail-closed）
4. `HOME=/tmp node ./scripts/examples/check-examples-runtime.js`（通过）
5. `pnpm run check`（通过）

## 修复执行记录（2026-03-25）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/constants/codex-exec-fixture.constant.ts`、`apps/cli/src/runtime/codex-exec-fixture-runtime.ts`、`apps/cli/test/cli-output-contract.integration.test.ts`、`scripts/examples/check-examples-runtime.js`、`scripts/ci/stage9-blackbox-ga-lib.js`、`test/e2e/blackbox-governance-flow.e2e.test.ts`
   - 验证：`HOME=/tmp REPO_AI_GOVERNOR_CODEX_EXEC_FIXTURE=success node ./dist/bin/repo-ai-governor.js --output json --locale en-US connect --adapters`（通过）
   - 说明：fixture 现在必须显式配合 `REPO_AI_GOVERNOR_ENABLE_TEST_FIXTURES=1` 才会生效，生产 CLI 默认不接受该 override。
2. `2.2`：已完成
   - 变更文件：`packages/adapters/codex/src/codex-agent-adapter.ts`、`packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`
   - 验证：`pnpm -s vitest run apps/cli/test/runtime/codex-exec-fixture-runtime.test.ts apps/cli/test/cli-output-contract.integration.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：`CLI_EXEC` 模式的 cancellation matrix 已与 `capabilityStates` 和 `cancel()` 的真实行为对齐。
