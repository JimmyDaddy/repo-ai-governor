# Code Review: tk-445 tk-446 live command shell connect progress baseline follow-up

- Status: resolved
- Date: 2026-03-30
- Reviewer: AI-Agent
- Task: `TK-445 / TK-446`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-interactive-shell-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/adrs/live-command-progress-and-running-react-shell.md`

## 1. Review Scope

1. `apps/cli/src/main.ts`
2. `apps/cli/src/commands/doctor-command.ts`
3. `apps/cli/src/commands/verify-command.ts`
4. `packages/adapters/local-model/src/local-model-agent-adapter.ts`

## 2. Findings

### 2.1 [P1] React-mode double-Ctrl+C semantics are exposed to commands that still do not consume the abort seam
- 位置: `apps/cli/src/main.ts:596`
- 问题描述: `executeCliCommand(...)` now creates `CliLiveCommandCancelController` for every React UI command and unconditionally installs a `SIGINT` handler before dispatch, but the new abort/progress seam is still only consumed by `connect`. `verify` and `doctor` still call `context.resolveAdapterVerification()` without forwarding `context.abortSignal`, and the ADR explicitly says the two-stage Ctrl+C policy should only be exposed on commands that truly support `AbortSignal`. In practice, a first Ctrl+C on `doctor --ui react --adapters` or `verify --ui react` no longer terminates the process or cancels the probe work; it just flips the running shell into `cancel_requested`, and users have to press Ctrl+C again or wait for the probe window to finish.
- 影响: 这是交互层回归。原本一次 Ctrl+C 就能立即退出的 React-mode commands，现在会在未真正接通取消语义时吞掉第一次中断，尤其会影响外部探测卡住、认证等待或长时间健康检查场景。
- 建议: 只对已真正消费 `AbortSignal` 的命令启用 `CliLiveCommandCancelController`，或者先把 `doctor / verify / run` 等长时命令补齐 `abortSignal` 传播与测试，再开放全局两段式 Ctrl+C 语义。

### 2.2 [P1] Local-model probe swallows aborts as endpoint failures and may even retry them
- 位置: `packages/adapters/local-model/src/local-model-agent-adapter.ts:359`
- 问题描述: `probeLocalModelReadiness()` now receives `request.signal`, but its catch block converts every failure into `availabilityStatus=UNAVAILABLE` instead of rethrowing cancellation. At the same time, `requestJson()` still treats `AbortError` as retryable via `isRetryableRequestError()`. That means a cancelled Ollama health probe is downgraded to `local_model_endpoint_unreachable:*` and may burn the remaining retry budget before control returns to the caller.
- 影响: `connect`/future `doctor`/`verify` cancellation stays sluggish on the `ollama` surface and no longer honors the intended “adapter-stage internal abort” behavior. With retries configured, a single Ctrl+C can still wait through multiple retry delays/timeouts before the command finally notices the abort.
- 建议: detect abort/cancel errors in `probeLocalModelReadiness()` and rethrow a standardized `PROCESS_RUNTIME_CANCELLED` error immediately; also exclude abort failures from `isRetryableRequestError()` so cancellation never consumes retry budget.

## 3. Notes

1. 当前 worktree 里已有一个未提交的 `resolved_code_review_tk-445-tk-446-live-command-shell-connect-progress-baseline.md`，但基于这轮 follow-up 静态复核，不能继续把该变更视为 fully resolved。
2. 本轮没有执行 build/test 复跑；结论来自当前 diff、调用链和模块 contract/ADR 的静态核对。

## 4. Verification

1. `git diff --name-only --diff-filter=ACMR`（通过）
2. `rg -n "abortSignal|progressSink|resolveAdapterVerification\\(|resolveAdapterVerificationForConfig\\(" apps/cli/src/commands apps/cli/src/runtime apps/cli/src`（通过）
3. `pnpm run build`（未执行）

## 复核结论（2026-03-30）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`main.ts` 确实曾对所有 React-mode 命令无差别安装 `CliLiveCommandCancelController`，而 `doctor/verify` 调用链当时没有把 `context.abortSignal` 继续传入 `resolveAdapterVerification(...)`。
   - 处理：已新增 `CliLiveCommandCancellationPolicy`，将两段式 `Ctrl+C` 收敛到 `connect/doctor/verify`；同时补齐 `doctor` 与 `verify` 的 `abortSignal` 透传。
2. `2.2`
   - 判定：**认可**
   - 证据：`probeLocalModelReadiness()` 原先会把 `AbortError` 降级成 unavailable reason，而 `requestJson()` 会把 `AbortError` 当作 retryable request error。
   - 处理：已将 upstream abort 统一收口为 `PROCESS_RUNTIME_CANCELLED`，并禁止 `AbortError` 消耗 retry budget。

### 验证命令
1. `pnpm exec vitest run apps/cli/test/commands/live-command-abort-support.test.ts apps/cli/test/runtime/live-command-cancellation-policy.test.ts packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts apps/cli/test/commands/connect-command.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/live-command-cancel-controller.test.ts apps/cli/test/runtime/react-cli-command-progress-controller.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm exec biome check apps/cli/src/main.ts apps/cli/src/runtime/live-command-cancellation-policy.ts apps/cli/src/commands/doctor-command.ts apps/cli/src/commands/verify-command.ts packages/adapters/local-model/src/local-model-agent-adapter.ts apps/cli/test/commands/live-command-abort-support.test.ts apps/cli/test/runtime/live-command-cancellation-policy.test.ts packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts`（通过）

## 修复执行记录（2026-03-30）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/main.ts`、`apps/cli/src/runtime/live-command-cancellation-policy.ts`、`apps/cli/src/commands/doctor-command.ts`、`apps/cli/src/commands/verify-command.ts`、`apps/cli/test/commands/live-command-abort-support.test.ts`、`apps/cli/test/runtime/live-command-cancellation-policy.test.ts`
   - 验证：`pnpm run build` + `pnpm exec vitest run apps/cli/test/commands/live-command-abort-support.test.ts apps/cli/test/runtime/live-command-cancellation-policy.test.ts apps/cli/test/commands/connect-command.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/live-command-cancel-controller.test.ts apps/cli/test/runtime/react-cli-command-progress-controller.test.ts` + `pnpm exec biome check apps/cli/src/main.ts apps/cli/src/runtime/live-command-cancellation-policy.ts apps/cli/src/commands/doctor-command.ts apps/cli/src/commands/verify-command.ts apps/cli/test/commands/live-command-abort-support.test.ts apps/cli/test/runtime/live-command-cancellation-policy.test.ts`（通过）
   - 说明：React-mode 两段式 `Ctrl+C` 不再无差别暴露给所有命令；当前只对已接通 abort seam 的 `connect/doctor/verify` 开启。
2. `2.2`：已完成
   - 变更文件：`packages/adapters/local-model/src/local-model-agent-adapter.ts`、`packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts`
   - 验证：`pnpm run build` + `pnpm exec vitest run packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts` + `pnpm exec biome check packages/adapters/local-model/src/local-model-agent-adapter.ts packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts`（通过）
   - 说明：local-model probe 的 upstream abort 现在会立即按 `PROCESS_RUNTIME_CANCELLED` 收口，且不会再吃掉 retry budget。
