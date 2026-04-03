# Code Review: session.main capability availability bridge working tree

- Status: resolved
- Date: 2026-04-03
- Reviewer: AI-Agent
- Task: `TK-498/TK-499`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
2. `apps/cli/src/commands/plan-command.ts`
3. `apps/cli/src/commands/review-verify-command.ts`
4. `packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts`
5. `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts`
6. `apps/cli/src/runtime/interactive-shell/session-shell-transcript-store.ts`
7. `apps/cli/src/react-cli/views/transcript-pane.tsx`
8. `packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`
9. `packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts`
10. `apps/cli/test/runtime/session-shell-transcript-store.test.ts`
11. `apps/cli/test/runtime/session-main-parity.integration.test.ts`
12. Sprint closeout ledgers under `.repo-ai-governor/context/dev/project-038-session-main-capability-explainer-productization/`

## 2. Findings
### 2.1 [P1] Local-only `plan` / `review-verify` are incorrectly gated behind adapter setup
- 位置: `apps/cli/src/runtime/session-main-supervisor-runtime.ts:90`
- 问题描述: `SESSION_MAIN_SURFACE_DEPENDENT_CAPABILITY_IDS` 把 `plan` 和 `review_verify` 也纳入了 surface probe gating。这样一来，只要当前没有 probe 成功的 adapter surface，`createCapabilityAvailabilityOverlay()` 就会把这两个能力标成 `setup_required` 并建议先 `/connect`。但 `plan` 实际只是本地写出 plan snapshot（`apps/cli/src/commands/plan-command.ts:17`），`review-verify` 也是本地消费 queued review artifact 并做 ledger backfill（`apps/cli/src/commands/review-verify-command.ts:139`），二者都不依赖已接入的 agent surface。
- 影响: 在未接入工具或 probe 临时失败的 workspace 中，capability explainer 会错误宣称这两个命令“需要先 /connect”，同轮 explain -> execute bridge 也会被错误阻断，直接削弱本次新增的 availability overlay / governed bridge 价值。
- 建议: 将真正依赖 agent surface 的能力与本地 CLI 命令分离；至少把 `plan`、`review_verify` 从 `SESSION_MAIN_SURFACE_DEPENDENT_CAPABILITY_IDS` 中移出，并补一组 `CliSessionMainSupervisorRuntime.resolveCapabilityAvailability()` 测试覆盖未接入 workspace 的这两个能力。

### 2.2 [P2] Availability explanation leaks raw internal routing markers into user-facing prose
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts:588`
- 问题描述: availability 详情块在渲染 “Suggested surface” 时，把 `selectedBy` 原样拼进 assistant markdown，例如 `session.main.preference`、`session.main.availability.fallback`。这些值是内部审计/路由 source marker，不是面向用户的语义文案，也没有经过 i18n 映射。
- 影响: 用户会在能力说明里直接看到内部实现标记，既破坏可读性，也让新增 availability prose 违反当前用户可见文本应走 i18n/可理解表达的基线。
- 建议: 将 `selectedBy` 映射为本地化的人类可读标签（例如 “preferred surface” / “fallback after probe”），或直接从 assistant prose 中移除，只保留在结构化 metadata / debug surface 里。

## 3. Notes
1. 聚焦测试已通过，但它们主要覆盖 dispatcher / explainer / transcript continuity；当前没有测试直接命中 `CliSessionMainSupervisorRuntime.resolveCapabilityAvailability()` 的本地命令分支，因此 2.1 这类误分类没有被现有测试拦住。
2. 本次 review 没有重新跑整仓 `pnpm run build` 或 `pnpm run check`，因为目标是审查工作树回归风险而不是做 closeout 复验。

## 4. Verification
1. `git status --short`（通过）
2. `git diff --name-only --diff-filter=ACMR`（通过）
3. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 复核结论（2026-04-03）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`SESSION_MAIN_SURFACE_DEPENDENT_CAPABILITY_IDS` 原先把 `plan` 和 `review_verify` 一并纳入 adapter surface gating；当前已仅保留真正需要 governed surface 的 `review` / `run`，并新增 `resolveCapabilityAvailability()` 用例覆盖未接入 workspace 下 `plan` / `review_verify` 仍为 `available` 的行为。
   - 处理：按建议修复，并保留 `review` 的 `/connect` gating。
2. `2.2`
   - 判定：**认可**
   - 证据：availability prose 原先直接输出 `selectedBy` 内部 marker；当前已将已知 routing source 映射为本地化的人类可读标签，未知 marker 不再泄露到 assistant markdown，并新增单测断言不再出现 raw marker。
   - 处理：按建议修复，并把新增 user-facing label 注册到 `en-us` / `zh-cn` locale。

### 验证命令
1. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" pnpm exec vitest run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" pnpm run build`（通过）

## 修复执行记录（2026-04-03）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/session-main-supervisor-runtime.ts`、`apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
   - 验证：`PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" pnpm exec vitest run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）；`PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" pnpm run build`（通过）
   - 说明：将 local-only `plan` / `review_verify` 从 surface-dependent gating 中移出，保留 `review` / `run` 的 governed availability 判定。
2. `2.2`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts`、`packages/shared/src/i18n/locales/en-us.ts`、`packages/shared/src/i18n/locales/zh-cn.ts`
   - 验证：`PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" pnpm exec vitest run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）；`PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" pnpm run build`（通过）
   - 说明：把 availability `selectedBy` 映射为本地化标签，未知 routing marker 不再暴露到 user-facing prose。
