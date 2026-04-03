# Code Review: working tree

- Status: resolved
- Date: 2026-04-03
- Reviewer: AI-Agent
- Task: `TK-487`
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
4. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-003-graceful-interrupt-cutover-and-governance-closeout/tasks/TK-487-roll-codex-onto-shared-invoke-liveness-watchdog-graceful-interrupt-and-partial-output-preservation.md`
5. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-003-graceful-interrupt-cutover-and-governance-closeout/tasks/checklist.md`
6. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-003-graceful-interrupt-cutover-and-governance-closeout/tasks/tasks.csv`
7. `packages/adapter-sdk/src/types/interfaces/agent-cli-exec.interface.ts`
8. `packages/adapters/codex/src/codex-agent-adapter.ts`
9. `packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`

## 2. Findings
### 2.1 [P1] Abort-signal path clears the hard-terminate fuse before the real Codex process exits
- 位置: `packages/adapters/codex/src/codex-agent-adapter.ts:3001`, `packages/adapters/codex/src/codex-agent-adapter.ts:3067`, `packages/adapters/codex/src/codex-agent-adapter.ts:3173`, `packages/adapters/codex/src/codex-agent-adapter.ts:3241`
- 问题描述: 两条 real-spawn 路径现在都把 `request.signal` 直接传给 `spawn(..., { signal })`，同时又在 `onAbortSignal` 中启动自定义的 graceful-interrupt -> hard-terminate fuse。问题是 Node 在 `AbortSignal` 触发时会先让 child 发出 `AbortError`，而当前 `child.on('error') -> finishReject()` 会立刻 `clearTerminationTimers()` 并 reject。这样一来，abort 驱动的真实 CLI 进程如果没有在第一次 `SIGTERM` 后自行退出，后续的 `SIGKILL` fuse 会在真正生效前就被清掉。这个缺口不会被现有 smoke 覆盖，因为新增测试只验证了 injected `execRunner` 路径；我本地用 `/bin/sh -c 'trap \"\" TERM; while true; do sleep 1; done'` 复现实验时，abort 后先收到 `AbortError`，500ms 后 child 仍未 `close`，说明当前 real-spawn 逻辑确实会在进程还活着时结束上层 promise。
- 影响: 用户 abort / flow cancel 场景下，Codex 子进程可能在 governor 已经返回失败并完成清理后继续存活，破坏 `TK-487` 这轮承诺的 dual-stage terminate governance，也会让后续 invocation、TTY 资源和诊断状态出现悬挂/串扰。
- 建议: 不要同时依赖 `spawn(..., { signal })` 和自定义 terminate fuse。更稳妥的修法是对 real-spawn 路径改为只监听 `request.signal`，在 abort 时手动发 `SIGTERM` 并保留 hard-terminate fuse，直到 `close`/`exit` 真正到来后再清理；同时补一条真实 spawn 路径的 regression，覆盖“abort 后子进程忽略 SIGTERM，最终必须升级到 SIGKILL”的场景。

## 3. Notes
1. 本轮台账面已通过同步门禁，未发现 `current-context / plan / checklist / tasks.csv` 的状态漂移。
2. 除上述问题外，这轮 `TK-487` diff 中未再发现新的同级别行为回归。

## 4. Verification
1. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" /Users/jimmydaddy/Library/pnpm/pnpm vitest run packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`（通过）
2. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" /Users/jimmydaddy/Library/pnpm/pnpm run build`（通过）
3. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" /opt/homebrew/bin/node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" /opt/homebrew/bin/node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `/opt/homebrew/bin/node -e "<spawn AbortSignal reproduction>"`（通过，观测到 `AbortError` 先于 `close`，且忽略 `SIGTERM` 的子进程在 500ms 内未自动退出）

## 复核结论（2026-04-03）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P1] Abort-signal path clears the hard-terminate fuse before the real Codex process exits`
   - 判定：**认可**
   - 证据：当前 `executeCodexCli()` 与 `executeCodexCliStreaming()` 的 real-spawn 路径都同时使用了 `spawn(..., { signal: request.signal })` 和自定义 `onAbortSignal -> SIGTERM -> hardTerminateFuse`。实际复现实验确认 `AbortError` 会先于 `close` 到达，而 `child.on('error') -> finishReject()` 会立即清掉 fuse，使忽略 `SIGTERM` 的子进程在 governor 已返回失败后继续存活。
   - 处理：移除 real-spawn 对 `spawn(..., { signal })` 的直接依赖，改为只监听 `request.signal` 并手动触发 `SIGTERM -> SIGKILL`；同时补一条真实 spawn 回归，覆盖“abort 后忽略 `SIGTERM`，最终必须升级到 `SIGKILL`”的场景。

### 验证命令
1. `/opt/homebrew/bin/node -e "<spawn AbortSignal reproduction>"`（通过）

## 修复执行记录（2026-04-03）

1. `2.1 [P1] Abort-signal path clears the hard-terminate fuse before the real Codex process exits`：已完成
   - 变更文件：`packages/adapters/codex/src/codex-agent-adapter.ts`
   - 验证：`PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" pnpm vitest run packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`（通过）
   - 说明：real-spawn 路径不再把 `request.signal` 直接传给 `spawn()`；abort 现在只通过手动监听触发 `SIGTERM -> SIGKILL`，并在 `close` 真正到达前保留 hard-terminate fuse。
2. `2.1 [P1] Abort-signal path clears the hard-terminate fuse before the real Codex process exits`：已完成
   - 变更文件：`packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`
   - 验证：`PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" pnpm run build`（通过）
   - 说明：新增真实 spawn 回归，覆盖“abort 后子进程忽略 `SIGTERM`，最终必须升级到 `SIGKILL`”场景，防止 injected exec-runner 覆盖不到的竞态回归。
