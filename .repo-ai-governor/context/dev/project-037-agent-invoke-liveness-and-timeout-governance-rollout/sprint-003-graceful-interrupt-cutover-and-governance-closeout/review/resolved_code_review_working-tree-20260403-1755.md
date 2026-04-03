# Code Review: working tree

- Status: resolved
- Date: 2026-04-03
- Reviewer: AI-Agent
- Task: `TK-490`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/plan.md`
3. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-003-graceful-interrupt-cutover-and-governance-closeout/plan.md`
4. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-003-graceful-interrupt-cutover-and-governance-closeout/tasks/TK-490-route-session-main-interactive-shell-and-doctor-verify-through-invoke-liveness-diagnostics.md`
5. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-003-graceful-interrupt-cutover-and-governance-closeout/tasks/checklist.md`
6. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-003-graceful-interrupt-cutover-and-governance-closeout/tasks/tasks.csv`
7. `apps/cli/src/runtime/adapter-diagnostics-runtime.ts`
8. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
9. `apps/cli/src/runtime/interactive-shell/session-shell-turn-progress-dock.ts`
10. `apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts`
11. `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
12. `apps/cli/test/runtime/session-shell-turn-progress-dock.test.ts`
13. `packages/shared/src/i18n/locales/en-us.ts`
14. `packages/shared/src/i18n/locales/zh-cn.ts`

## 2. Findings
### 2.1 [P2] `doctor/verify` budget diagnostics stay `null` for CLI-backed adapters
- 位置: `apps/cli/src/runtime/agent-onboarding-runtime.ts:259`
- 问题描述: 新增的 `invoke_liveness_diagnostics.request_timeout_ms` / `max_retries` 只从 `configuredTool.remoteApi` 和 `configuredTool.localModel` 读取；但 `AdapterToolConfig` 并没有 CLI transport 的对应字段，而 CLI-backed adapters (`Codex` / `Claude Code` / `GitHub Copilot`) 仍在各自构造函数里维护真实的 `requestTimeoutMs` / `maxRetryAttempts` 默认值。CLI routing 也没有把这些 runtime budget 透传进 `createInvokeLivenessDiagnosticsPayload()`。结果就是对 CLI-backed tool 运行 `doctor/verify` 时，输出会宣称存在 invoke-liveness diagnostics，却把 timeout/retry budget 展示成 `null`，与真实运行时预算不一致。现有新增测试只覆盖了 remote-api budget 行，没有覆盖 CLI-backed surface。
- 影响: operator 看到的 `doctor/verify` diagnostics 会低估或误判 CLI adapter 的 timeout/retry 约束，和 `TK-490` 台账里“已补齐 budget diagnostics”的结论不一致。
- 建议: 要么把 CLI-backed adapter 的 resolved budget 纳入可诊断输入并投影到 payload，要么把字段改成显式的 configured-only 语义，避免输出看起来像 runtime truth；同时补一条 CLI-backed surface 的 verify payload regression。

### 2.2 [P2] Interactive shell new timeout/termination branches are not regression-covered
- 位置: `apps/cli/test/runtime/session-shell-turn-progress-dock.test.ts:330`
- 问题描述: `CliSessionShellTurnProgressDock` 这轮新增了 `semantic_stall_suspect`、`hard_terminating`、`invoke_semantic_stall_timeout` 和 `invoke_graceful_interrupt_exceeded` 的 summary/detail/reason-code humanization 分支，但测试只覆盖了 `transport_idle_suspect` 与 `graceful_interrupting`。这些分支属于用户可见的 live summary / execution-details 呈现路径，而且正好对应 timeout / escalation 控制流；按当前 review bar，这类新分支没有回归覆盖应视为 actionable。
- 影响: 一旦后续改动打断 `semantic stall` 或 `hard terminate` 的文案映射，interactive shell 只会在真实超时/升级场景里退化，常规 smoke 很难及时发现。
- 建议: 在现有 `session-shell-turn-progress-dock` test 里补一条并列场景，显式覆盖 `semantic_stall_suspect` 与 `hard_terminating` 的 summaryLine、detail 文案和 humanized reason code。

## 3. Notes
1. 本轮台账同步正常：`current-context / plan / TK-490 / checklist / tasks.csv` 未发现状态漂移。
2. 除上述两点外，本轮 CLI diagnostics / i18n diff 没再发现新的同级别行为回归。

## 4. Verification
1. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" /Users/jimmydaddy/Library/pnpm/pnpm vitest run apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/session-shell-turn-progress-dock.test.ts`（通过）
2. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" /opt/homebrew/bin/node ./scripts/governance/check-i18n-parity-fallback.js`（通过）
3. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" /opt/homebrew/bin/node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" /opt/homebrew/bin/node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" /Users/jimmydaddy/Library/pnpm/pnpm run build`（通过）

## 复核结论（2026-04-03）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P2] doctor/verify budget diagnostics stay null for CLI-backed adapters`
   - 判定：**认可**
   - 证据：`apps/cli/src/runtime/agent-onboarding-runtime.ts` 之前只从 `remoteApi/localModel` 读取 `request_timeout_ms/max_retries`；`codex/claude-code/github-copilot` 的 `cli_exec` 默认 budget 没有进入 payload，所以 `verify` 输出会把真实 runtime budget 表示成 `null`。
   - 处理：已补 `cli_exec` transport 解析和默认 budget 投影，并新增 CLI-backed diagnostics 回归。
2. `2.2 [P2] Interactive shell new timeout/termination branches are not regression-covered`
   - 判定：**认可**
   - 证据：`apps/cli/test/runtime/session-shell-turn-progress-dock.test.ts` 原先只覆盖了 `transport_idle_suspect` 与 `graceful_interrupting`，没有覆盖同一轮新增的 `semantic_stall_suspect`、`hard_terminating` 和对应 humanized reason code 分支。
   - 处理：已补充 `semantic stall` / `hard terminate` 并列场景，覆盖 summary/detail/reason-code 输出。

### 验证命令
1. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" pnpm vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/session-shell-turn-progress-dock.test.ts`（通过）
2. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" pnpm run build`（通过）

## 修复执行记录（2026-04-03）

1. `2.1 [P2] doctor/verify budget diagnostics stay null for CLI-backed adapters`：已完成
   - 变更文件：`apps/cli/src/runtime/agent-onboarding-runtime.ts`、`apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
   - 验证：`PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" pnpm vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts`（通过）；`PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" pnpm run build`（通过）
   - 说明：CLI-backed surface 现在会把 `cli_exec` 的默认 timeout/retry budget 投影到 `invoke_liveness_diagnostics`，避免 `doctor/verify` 将 runtime truth 展示成 `null`。
2. `2.2 [P2] Interactive shell new timeout/termination branches are not regression-covered`：已完成
   - 变更文件：`apps/cli/test/runtime/session-shell-turn-progress-dock.test.ts`
   - 验证：`PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" pnpm vitest run apps/cli/test/runtime/session-shell-turn-progress-dock.test.ts`（通过）；`PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" pnpm run build`（通过）
   - 说明：新增回归覆盖 `semantic_stall_suspect`、`hard_terminating` 以及 `invoke_semantic_stall_timeout`、`invoke_graceful_interrupt_exceeded` 的文案映射。
