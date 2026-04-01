# Code Review: working tree 2026-04-02 00:48

- Status: resolved
- Date: 2026-04-02
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `apps/cli/src/cli-governance-runtime.ts`
2. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
3. `apps/cli/src/runtime/interactive-shell/session-shell-command-progress-dock.ts`
4. `apps/cli/src/runtime/interactive-shell/session-shell-entrypoint-runtime.ts`
5. `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
6. `apps/cli/src/runtime/interactive-shell/session-shell-transcript-store.ts`
7. `apps/cli/src/runtime/interactive-shell/session-shell-turn-progress-dock.ts`
8. `apps/cli/src/runtime/interactive-shell/session-shell-execution-detail-line.ts`
9. `apps/cli/src/runtime/presentation/command-experience-builder.ts`
10. `apps/cli/test/cli-governance-runtime.integration.test.ts`
11. `apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
12. `apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts`
13. `apps/cli/test/runtime/session-shell-runner.test.ts`
14. `apps/cli/test/runtime/session-shell-transcript-store.test.ts`
15. `apps/cli/test/runtime/session-shell-turn-progress-dock.test.ts`
16. `packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts`
17. `packages/core-orchestration-service/src/types/interfaces/session-main-supervisor-runtime.interface.ts`
18. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
19. `packages/core-session/src/shared-session-manager.ts`
20. `packages/core-session/test/shared-session-manager.unit.test.ts`
21. `packages/shared/src/i18n/locales/en-us.ts`
22. `packages/shared/src/i18n/locales/zh-cn.ts`
23. `package.json`
24. `scripts/dev/debug-cleanroom-session-shell.js`
25. `scripts/dev/debug-cleanroom-session-shell.md`

## 2. Findings

### 2.1 [P1] Shared session cache can overwrite events written by another session owner
- 位置: `packages/core-session/src/shared-session-manager.ts:84-128`, `packages/core-session/src/shared-session-manager.ts:215-248`
- 问题描述: `getSession()` 现在会在 5 秒 TTL 内直接返回进程内 cache，而 `appendEvent()/updateContext()/finalizeSession()` 又都是“读整个 session -> 在内存里改 -> 整体写回”的模式。只要同一个 `sessionId` 在 TTL 窗口内被另一个 `SharedSessionManager` 实例或另一个进程追加过事件，这个实例下一次写入就会基于旧快照覆盖远端新事件，造成 session event stream 丢失。类注释自己就把它定义成“multiple agents should collaborate on one consistent session payload”，但这个 cache 没有任何版本校验或失效钩子，和 shared session 的一致性目标冲突。
- 影响: 多 agent / sidecar / resume 并发写 session 时可能 silently 丢事件，进而污染 transcript、cursor、恢复语义和审计链。
- 建议: 不要在可变 session payload 的写路径上直接复用本地快照；至少为 `appendEvent/updateContext/finalizeSession` 恢复真实读、或引入版本号 / compare-and-swap / 外部写入失效机制后再保留 cache。

### 2.2 [P2] Direct-answer preflight still crashes the turn when one surface probe throws
- 位置: `apps/cli/src/runtime/session-main-supervisor-runtime.ts:492-499`
- 问题描述: 新的 direct-answer preflight 明显想把 surface 检查结果转成 stream diagnostics 和 guarded fallback，但 `evaluateCandidateSurfaces()` 对 `protocol.probe()` 没有任何 `try/catch`。这意味着只要某个候选 surface 在 probe 时抛出真实运行错误（例如 CLI 未登录、binary 缺失、probe stderr 非零），当前 turn 会直接抛错退出，后面的 surface 根本不会继续检查，也不会回到本轮新增的 guarded fallback outcome。现有测试只覆盖了 `availabilityStatus=UNAVAILABLE`，没有覆盖 `probe()` throw 的分支。
- 影响: 用户最常见的“某个工具当前坏了，但其他 surface 还能答”场景会从可恢复降级成整轮 turn 失败，和这次 preflight/diagnostics 的产品目标不一致。
- 建议: 在 `evaluateCandidateSurfaces()` 里把 probe 异常收敛成“not eligible + reason”诊断，继续检查其他 surface；同时补一条 `probe()` throw 时仍能 fallback/guard 的测试。

## 3. Notes
1. 你贴的旧 finding `apps/cli/src/react-cli/views/session-shell-live-app.tsx:160-166` 不在当前 working tree 范围内，这轮没有复现，我没有把它当作本轮新 finding 复报。
2. 这轮新增的 run/session-shell execution-details 展示面、run 失败桥接和 recovery retry 前台反馈本身方向是对的；我的问题主要集中在“共享状态一致性”和“preflight 异常降级”两个 runtime contract 上。

## 4. Verification
1. `pnpm run build`（通过）
2. `/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-session/test/shared-session-manager.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 复核结论（2026-04-02）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P1] Shared session cache can overwrite events written by another session owner`
   - 判定：**认可**
   - 证据：`SharedSessionManager.appendEvent()/updateContext()/finalizeSession()` 原先都会先走带 TTL 的 `getSession()`，确实会在另一个 manager 已经写入新事件后继续基于旧快照整体回写。`test/memory-session-store.integration.test.ts` 新增的双 manager + fs-csv smoke 可以稳定复现“先 started、后 completed，最终只剩 started”的覆盖问题。
   - 处理：已移除 `SharedSessionManager` 的进程内 session cache，并让 `getSession()` / mutating path 都回到真实持久化读取，消除跨实例旧快照覆盖窗口。

2. `2.2 [P2] Direct-answer preflight still crashes the turn when one surface probe throws`
   - 判定：**认可**
   - 证据：`evaluateCandidateSurfaces()` 原先对 `protocol.probe()` 没有异常收敛，任何一个 candidate surface 的 probe throw 都会直接中断整轮 preflight。`apps/cli/test/runtime/session-main-supervisor-runtime.test.ts` 新增了 `codex probe crashed` 场景，修复前会整轮 throw，修复后会记录 diagnostics 并继续回退到下一个可用 surface。
   - 处理：已在 preflight 中把 `probe()` throw 收敛成 `not eligible` 诊断与 stream event，继续检查后续 surface，不再直接终止本轮 turn。

### 验证命令
1. `/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts packages/core-session/test/shared-session-manager.unit.test.ts test/memory-session-store.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）

## 修复执行记录（2026-04-02）

1. `2.1 [P1] Shared session cache can overwrite events written by another session owner`：已完成
   - 变更文件：`packages/core-session/src/shared-session-manager.ts`、`packages/core-session/test/shared-session-manager.unit.test.ts`、`test/memory-session-store.integration.test.ts`
   - 验证：`/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run packages/core-session/test/shared-session-manager.unit.test.ts test/memory-session-store.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：去除了 shared session 的本地 TTL cache，补上双 manager 回归，保证 fs-csv 真实组合下也不会覆盖别人的 event。

2. `2.2 [P2] Direct-answer preflight still crashes the turn when one surface probe throws`：已完成
   - 变更文件：`apps/cli/src/runtime/session-main-supervisor-runtime.ts`、`apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
   - 验证：`/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：probe throw 现在会进入 diagnostics + 继续 fallback/guard，不再把整轮 direct-answer turn 直接炸掉。
