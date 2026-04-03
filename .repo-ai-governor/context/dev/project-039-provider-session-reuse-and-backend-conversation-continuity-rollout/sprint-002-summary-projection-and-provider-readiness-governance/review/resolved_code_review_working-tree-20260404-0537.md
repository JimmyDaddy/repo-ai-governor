# Code Review: provider session reuse and backend conversation continuity working tree

- Status: resolved
- Date: 2026-04-04
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
  - `.repo-ai-governor/draft/provider-session-reuse-and-backend-conversation-continuity-technical-solution.md`

## 1. Review Scope
1. `.repo-ai-governor/draft/provider-session-reuse-and-backend-conversation-continuity-technical-solution.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
3. `packages/core-session/src/shared-session-manager.ts`
4. `packages/core-orchestration-service/src/provider-continuation-session-runtime.ts`
5. `packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts`
6. `packages/core-orchestration-service/src/types/interfaces/provider-continuation.interface.ts`
7. `apps/cli/src/runtime/session-main-provider-continuation-runtime.ts`
8. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
9. `apps/cli/src/runtime/interactive-shell/session-shell-transcript-store.ts`
10. `apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
11. `apps/cli/test/runtime/session-shell-transcript-store.test.ts`
12. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`

## 2. Findings
### 2.1 [P1] slot 持久化仍然依赖锁外拼整张 `providerContinuations` map
- 位置: `packages/core-orchestration-service/src/provider-continuation-session-runtime.ts:65`
- 问题描述: 这次实现虽然新增了 `ProviderContinuationSessionRuntime`，但它仍然是基于调用方传入的旧 context 快照重建整张 `slots` map，然后回写一个顶层 `providerContinuations` patch。调用点在 `LocalOrchestrationServiceSessionRuntime` 中直接把 turn 开始时的 `existingSession.context` 传给 `createContextPatch()`（`packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts:273-279`），最终持久化仍走 `SharedSessionManager.updateContext()` 的顶层浅合并（`packages/core-session/src/shared-session-manager.ts:175-187`）。这没有满足当前 draft 已写死的要求：slot mutation 必须在同一 session mutation lock 内完成 read-modify-write，不能依赖调用方在锁外拼装整张 map（`.repo-ai-governor/draft/provider-session-reuse-and-backend-conversation-continuity-technical-solution.md:252-269`）。
- 影响: 只要同一 session 在两个 turn/host surface 上并发更新 continuation slots，后写入的一方就可能用旧快照覆盖掉另一方刚写入的兄弟 lane slot。这个风险正好击中这次改动最核心的 lane-scoped persistence 语义，而且现有测试只覆盖了单 turn 单 writer 路径，没有拦住并发覆盖。
- 建议: 不要继续通过 `createContextPatch(existingSession.context, ...) + updateContext()` 组合来模拟 slot-aware seam。需要把 `upsert/clear slot` 提升成 `SharedSessionManager` 级别的专用 mutation API，或至少在真正持有 session mutation lock 的代码路径内重新读取当前 `providerContinuations` 再做 merge。

### 2.2 [P2] `unsupported` continuation 生命周期在 runtime 和 CLI 两端都被吞掉了
- 位置: `apps/cli/src/runtime/session-main-provider-continuation-runtime.ts:200`
- 问题描述: 当前 `resolveMutations()` 对 `AgentStageContinuationStatus.UNSUPPORTED` 只在“已有旧 slot”时生成一条 `CLEARED` mutation；如果本轮本来就是 fresh stateless path，则直接返回空数组（`apps/cli/src/runtime/session-main-provider-continuation-runtime.ts:200-215`）。这和当前 draft/active contract 要求的“`created / reused / refreshed / cleared / invalid / unsupported` 都必须可回放、可审计、可测试消费”不一致（`.repo-ai-governor/draft/provider-session-reuse-and-backend-conversation-continuity-technical-solution.md:412-418`, `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md:113-119`）。而且即便后续 runtime 修正为真的投影出 `unsupported`，CLI transcript store 现在也只渲染 `created / reused / refreshed / cleared / invalid`，对 `unsupported` 仍然直接丢弃（`apps/cli/src/runtime/interactive-shell/session-shell-transcript-store.ts:727-767`）。
- 影响: 对于当前大量“第一阶段不支持 reuse，只能诚实退回 stateless”的 provider/surface，shared session replay、diagnostics 和 CLI transcript 都看不到“本轮尝试过 continuation，但 adapter 明确不支持”的事实。结果是 fallback 原因被掩盖成“什么都没发生”或“已清理”，不利于 provider readiness 判断，也偏离了这次新增 summary projection 的主要价值。
- 建议: runtime 层应始终为 `unsupported` 生成 presenter-safe summary，即便没有旧 slot 也要留下状态记录；如果同时需要清理旧 slot，可以把 `unsupported` 与 `cleared` 区分为两条 summary/event，或至少保留原始 status。CLI presenter 也应补上 `unsupported` 的渲染分支，而不是继续把它静默吞掉。

## 3. Notes
1. 本次 working tree 同时包含代码、规范文档、registry 与 ledger 更新；我优先审查了 continuation contract/persistence/presenter 这条主路径，未逐项复述所有文档性改动。
2. 这次 review 没有跑 `pnpm run build` 或测试命令；当前结论基于工作树 diff、现有契约和测试覆盖的静态审查。

## 4. Verification
1. `git status --short`（通过）
2. `git diff --name-only --diff-filter=ACMR`（通过）
3. `git diff --stat`（通过）
4. `nl -ba packages/core-session/src/shared-session-manager.ts | sed -n '170,190p'`（通过）
5. `nl -ba packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts | sed -n '264,284p'`（通过）
6. `nl -ba packages/core-orchestration-service/src/provider-continuation-session-runtime.ts | sed -n '65,95p'`（通过）
7. `nl -ba apps/cli/src/runtime/session-main-provider-continuation-runtime.ts | sed -n '154,216p'`（通过）
8. `nl -ba apps/cli/src/runtime/interactive-shell/session-shell-transcript-store.ts | sed -n '699,775p'`（通过）
9. `nl -ba .repo-ai-governor/draft/provider-session-reuse-and-backend-conversation-continuity-technical-solution.md | sed -n '248,270p;410,418p'`（通过）
10. `nl -ba .repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md | sed -n '73,119p'`（通过）

## 5. 复核结论（2026-04-04）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P1] slot 持久化仍然依赖锁外拼整张 providerContinuations map`
   - 判定：**认可**
   - 证据：`SharedSessionManager` 已新增 `updateContextWithLatest()`，在 session mutation lock 内重新读取最新 context 并执行 patch builder；`LocalOrchestrationServiceSessionRuntime` 已改为在持锁路径中基于 `currentContext` 调用 `ProviderContinuationSessionRuntime.createContextPatch(...)`；同时新增 `packages/core-session/test/shared-session-manager.unit.test.ts`，验证跨 manager 的 sibling nested updates 不会被旧快照覆盖。
   - 处理：已修复并补回归。
2. `2.2 [P2] unsupported continuation 生命周期在 runtime 和 CLI 两端都被吞掉了`
   - 判定：**认可**
   - 证据：`SessionMainProviderContinuationRuntime.resolveMutations()` 现在即便没有旧 slot 也会保留 `unsupported` summary mutation；`CliSessionShellTranscriptStore` 已增加 `unsupported` 渲染分支；`packages/shared/src/i18n/locales/en-us.ts` 与 `packages/shared/src/i18n/locales/zh-cn.ts` 已补齐对应 key，并新增 supervisor/transcript 回归测试。
   - 处理：已修复并补回归。

### 验证命令
1. `pnpm exec vitest run packages/core-session/test/shared-session-manager.unit.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`（通过）
2. `pnpm run build`（通过）

## 6. 修复执行记录（2026-04-04）

1. `2.1 [P1] slot 持久化仍然依赖锁外拼整张 providerContinuations map`：已完成
   - 变更文件：`packages/core-session/src/shared-session-manager.ts`、`packages/core-session/src/types/interfaces/shared-session.interface.ts`、`packages/core-session/src/types/interfaces/index.ts`、`packages/core-session/src/types/index.ts`、`packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts`、`packages/core-orchestration-service/src/provider-continuation-session-runtime.ts`、`packages/core-session/test/shared-session-manager.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-session/test/shared-session-manager.unit.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`（通过）；`pnpm run build`（通过）
   - 说明：provider continuation slot mutation 现在基于持锁时的最新 context 做 merge；当 slot map 没有实际变化时，也会安全退化为 no-op，不再依赖锁外整图拼装。
2. `2.2 [P2] unsupported continuation 生命周期在 runtime 和 CLI 两端都被吞掉了`：已完成
   - 变更文件：`apps/cli/src/runtime/session-main-provider-continuation-runtime.ts`、`apps/cli/src/runtime/interactive-shell/session-shell-transcript-store.ts`、`packages/shared/src/i18n/locales/en-us.ts`、`packages/shared/src/i18n/locales/zh-cn.ts`、`apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`、`apps/cli/test/runtime/session-shell-transcript-store.test.ts`
   - 验证：`pnpm exec vitest run packages/core-session/test/shared-session-manager.unit.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`（通过）；`pnpm run build`（通过）
   - 说明：fresh stateless path 下的 `unsupported` 尝试现在会保留 presenter-safe summary，并在 CLI transcript 中明确展示，而不是被误吞成“什么都没发生”。
