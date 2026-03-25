# Adapter Implementations Working Tree Code Review

- Date: 2026-03-25 08:01:32 +0800
- Scope: `packages/adapter-sdk`, `packages/adapters/{codex,github-copilot,claude-code,local-model}`, `apps/cli/src/runtime/*`, `apps/cli/src/main.ts`, related adapter integration tests
- Reviewer: Codex
- Status: resolved

## Findings

### 1. [P1] Claude Code baseline stub is still wired as a production route candidate
- Files:
  - `apps/cli/src/runtime/adapter-routing-runtime.ts`
  - `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
  - `apps/cli/src/main.ts`
- Problem:
  - `CliAdapterRoutingRuntime.createProtocolBySurface()` still instantiates `new ClaudeCodeAgentAdapter()` for the real CLI routing path.
  - The adapter itself is still the old baseline implementation: `probe()` reports broad capability support, `requestConfirmation()` auto-approves, `cancel()` acknowledges success, and `invokeStage()` only returns `echoedInput`.
  - The default CLI adapters config still enables `claude-code` and even makes it the primary surface for `reviewer`, plus a fallback for multiple other roles.
- Impact:
  - `connect --adapters`, `doctor --adapters`, `verify --adapters`, and actual route dispatch can all treat Claude Code as a healthy executable surface even though `TK-139` is still only `planned` and no real provider `probe/invoke` path exists.
  - This breaks the sprint's stated truthfulness requirement: routing/diagnostics can go green or select `claude-code` while no real remote execution is happening.
- Evidence:
  - `project-013` plan still says `TK-139` is `planned` and that Codex / GitHub Copilot / Claude Code must be upgraded from baseline stub to real provider invocation.

### 2. [P2] Route/integration tests currently lock in the Claude Code stub as expected behavior
- Files:
  - `test/first-batch-adapters-route.integration.test.ts`
  - `apps/cli/test/cli-governance-runtime.integration.test.ts`
- Problem:
  - The route integration suite explicitly expects fallback selection to land on `claude-code`.
  - The CLI runtime integration fixtures also configure `claude-code` as an available tool and as a primary/fallback role surface.
- Impact:
  - Even after the Codex/GitHub Copilot paths became real `CLI_EXEC` implementations, this coverage still preserves the assumption that the baseline Claude Code adapter is a valid production fallback.
  - That makes the truthfulness gap above look intentional and reduces the chance that `TK-139` regressions or missing implementation work will be caught by the existing suite.

## Verification

1. `pnpm -s vitest run packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts test/first-batch-adapters-route.integration.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
   - Result: passed (`3` files, `42` tests)
2. Static review of:
   - `apps/cli/src/main.ts`
   - `apps/cli/src/runtime/adapter-routing-runtime.ts`
   - `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
   - `test/first-batch-adapters-route.integration.test.ts`
   - `apps/cli/test/cli-governance-runtime.integration.test.ts`

## Conclusion

Codex and GitHub Copilot real-provider paths are materially better aligned now, and the previously reported GitHub Copilot non-zero-exit bug is fixed in the current tree. The remaining high-risk gap in the current adapter surface is that Claude Code is still a baseline stub while the real CLI runtime and its regression suite already treat it like a live production candidate.

## 复核结论（2026-03-25）

- 整体结论：**认可**

### 逐条复核
1. `Finding 1`
   - 判定：**认可**
   - 证据：复核时 `apps/cli/src/runtime/adapter-routing-runtime.ts` 仍默认把 `claude-code` 作为生产 route candidate，但 `packages/adapters/claude-code/src/claude-code-agent-adapter.ts` 仍是 baseline `echoedInput` stub。
   - 处理：已将 Claude Code adapter 升级为真实 `CLI_EXEC` 路径，并让 route runner 默认实例化该真实模式。
2. `Finding 2`
   - 判定：**认可**
   - 证据：复核时 `test/first-batch-adapters-route.integration.test.ts` 的回归仍把 baseline Claude adapter 作为合法 fallback。
   - 处理：已将 route/integration fixtures 全部切到 Claude `CLI_EXEC` runner，不再锁定 baseline stub 行为。

### 验证命令
1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm -s vitest run packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts test/first-batch-adapters-route.integration.test.ts apps/cli/test/runtime/claude-code-exec-fixture-runtime.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./scripts/examples/check-examples-runtime.js`（通过）
4. `pnpm -s vitest run test/e2e/blackbox-governance-flow.e2e.test.ts --config vitest.e2e.config.ts --maxWorkers=1 --maxConcurrency=1`（通过）
5. `pnpm run check`（通过）

## 修复执行记录（2026-03-25）

1. `Finding 1`：已完成
   - 变更文件：`packages/adapters/claude-code/src/**`、`apps/cli/src/runtime/adapter-routing-runtime.ts`、`apps/cli/src/main.ts`
   - 说明：Claude Code 已从 baseline stub 升级为真实 CLI-backed provider，并默认参与生产 route。
2. `Finding 2`：已完成
   - 变更文件：`test/first-batch-adapters-route.integration.test.ts`、`apps/cli/test/cli-governance-runtime.integration.test.ts`、`apps/cli/test/runtime/claude-code-exec-fixture-runtime.test.ts`、`scripts/examples/check-examples-runtime.js`、`scripts/ci/stage9-blackbox-ga-lib.js`、`test/e2e/blackbox-governance-flow.e2e.test.ts`
   - 说明：route/runtime/gate fixture 全部切到真实 Claude `CLI_EXEC` 语义，不再保留 baseline stub 假设。
