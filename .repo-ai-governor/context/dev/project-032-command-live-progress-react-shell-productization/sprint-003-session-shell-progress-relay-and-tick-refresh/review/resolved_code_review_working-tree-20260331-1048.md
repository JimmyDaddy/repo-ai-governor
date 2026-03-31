# Code Review: working tree 20260331-1048

- Status: resolved
- Date: 2026-03-31
- Reviewer: AI-Agent
- Task: `sprint-003 session-shell progress relay and tick refresh`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/adrs/live-command-progress-and-running-react-shell.md`

## 1. Review Scope

1. `apps/cli/src/main.ts`
2. `apps/cli/src/runtime/interactive-shell/session-shell-entrypoint-runtime.ts`
3. `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
4. `apps/cli/src/runtime/interactive-shell/session-shell-command-progress-dock.ts`
5. `apps/cli/src/react-cli/session/react-cli-command-progress-controller.ts`
6. `apps/cli/src/react-cli/views/command-progress-panel.tsx`
7. `apps/cli/src/react-cli/views/session-shell-app.tsx`
8. `apps/cli/src/commands/doctor-command.ts`
9. `apps/cli/src/commands/verify-command.ts`
10. `apps/cli/src/types/**`
11. `apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts`
12. `apps/cli/test/runtime/session-shell-runner.test.ts`
13. `apps/cli/test/runtime/session-shell-command-progress-dock.test.ts`
14. `apps/cli/test/cli-output-contract.integration.test.ts`

## 2. Findings

### [P1] `createRunOptions()` drops the new relay/cancel seam before the session shell ever starts

- File: `apps/cli/src/runtime/interactive-shell/session-shell-entrypoint-runtime.ts:42-49,134-168`
- Why it matters:
  `CliSessionShellRunner.executePendingCommand(...)` now knows how to relay nested command progress and forward an outer `AbortSignal` through `options.commandExecutionOptions`, but `CliSessionShellEntrypointRuntimeOptions` does not accept that field and `createRunOptions()` never includes it in the returned runner payload.
- User-visible impact:
  real entrypoint paths such as the default no-subcommand session shell and `resume` still start the runner without `commandExecutionOptions`, so the new sprint-003 relay path is effectively disconnected in production entry usage. Upstream hosts cannot observe session-shell nested command progress, and any outer cancellation signal is lost before it reaches the bridge command execution.
- Why current tests missed it:
  the new runner tests inject `commandExecutionOptions` directly into `CliSessionShellRunner`, so they verify the inner seam in isolation but not the actual entrypoint wiring used by `main.ts`.

### [P2] Entrypoint tests stop at the nested executor seam and never assert runner-option relay

- File: `apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts:82-102`
- Why it matters:
  the only `createRunOptions()` assertion checks `cwd`, `workspaceSummary`, `resumeOnStartup`, `requestedSessionId`, and `initialPrompt`. It does not cover the new `commandExecutionOptions` ownership at all, and the integration coverage in `apps/cli/test/cli-output-contract.integration.test.ts` only exercises top-level direct-command relay in `json --no-interactive` mode.
- Regression risk:
  a product-entry wiring break in the default session shell or `resume` path can ship with green tests, which is exactly what happened here: the nested executor relay is tested, but the session-shell entrypoint never passes that seam to the runner.

## 3. Notes

1. The previously pasted `agent-projection-panel-view-model-builder` finding is not part of the current `project-032 / sprint-003` working-tree diff, so this review is scoped to the live command progress and session-shell relay changes actually present in the worktree.
2. The new `session-shell-command-progress-dock` tick-refresh behavior itself looks coherent: elapsed/heartbeat refresh, row/log cloning, and dock teardown all have direct test coverage.

## 4. Verification

1. `pnpm run test:packages -- apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-shell-command-progress-dock.test.ts apps/cli/test/cli-output-contract.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `node ./scripts/governance/check-code-review-status-sync.js`（通过）

## 复核结论（2026-03-31）

- 整体结论：**认可**

### 逐条复核
1. `[P1] createRunOptions() drops the new relay/cancel seam before the session shell ever starts`
   - 判定：**认可**
   - 证据：`apps/cli/src/runtime/interactive-shell/session-shell-entrypoint-runtime.ts` 确实缺少 `commandExecutionOptions` option contract，`createRunOptions()` 也没有把该字段透传给 `CliSessionShellRunner`；因此 `main.ts` 的默认 session shell / `resume` 入口不会把 outer relay/cancel seam 带到 runner。
   - 处理：已在 `CliSessionShellEntrypointRuntimeOptions` 与 `createRunOptions()` 中补齐 `commandExecutionOptions` 透传，并在 `apps/cli/src/main.ts` 构造 entrypoint runtime 时把 `dependencies.nestedCommandExecutionOptions` 接到该 seam。
2. `[P2] Entrypoint tests stop at the nested executor seam and never assert runner-option relay`
   - 判定：**认可**
   - 证据：原有 `session-shell-entrypoint-runtime.test.ts` 仅校验基础 runner options 字段，`cli-output-contract.integration.test.ts` 也只覆盖 nested direct-command relay，未断言默认 session shell / `resume` 入口是否真正把 `commandExecutionOptions` 传给 runner。
   - 处理：已补充 `apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts` 对 `commandExecutionOptions` 的断言，并在 `apps/cli/test/cli-output-contract.integration.test.ts` 中新增默认无子命令入口与 `resume` 入口的 runner-option relay 覆盖。

### 验证命令
1. `pnpm exec vitest run apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过）
2. `pnpm run build`（通过）

## 修复执行记录（2026-03-31）

1. `[P1] createRunOptions() drops the new relay/cancel seam before the session shell ever starts`：已完成
   - 变更文件：`apps/cli/src/runtime/interactive-shell/session-shell-entrypoint-runtime.ts`、`apps/cli/src/main.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过）；`pnpm run build`（通过）
   - 说明：entrypoint runtime 现会把 outer `commandExecutionOptions` 原样透传给 session-shell runner，默认 session shell 与 `resume` 入口不再丢失 relay/cancel seam。
2. `[P2] Entrypoint tests stop at the nested executor seam and never assert runner-option relay`：已完成
   - 变更文件：`apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts`、`apps/cli/test/cli-output-contract.integration.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过）；`pnpm run build`（通过）
   - 说明：新增 unit + integration 两层 coverage，后续如果 default session shell 或 `resume` 再次漏传 `commandExecutionOptions`，测试会直接失败。
