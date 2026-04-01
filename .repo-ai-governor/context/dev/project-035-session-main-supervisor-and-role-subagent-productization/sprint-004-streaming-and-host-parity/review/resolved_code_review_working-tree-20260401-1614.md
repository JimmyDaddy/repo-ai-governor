# Code Review: working tree 2026-04-01 16:14

- Status: resolved
- Date: 2026-04-01
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/session-main-supervisor-and-role-subagent-collaboration.md`

## 1. Review Scope
1. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
2. `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
3. `apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
4. `apps/cli/test/runtime/session-slash-command-registry.test.ts`
5. `apps/cli/test/runtime/session-main-parity.integration.test.ts`
6. `packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts`
7. `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`
8. `packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`
9. `packages/adapters/codex/src/codex-agent-adapter.ts`
10. `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
11. `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`
12. `packages/adapters/local-model/src/local-model-agent-adapter.ts`

## 2. Findings
### 2.1 [P1] Explicit `/review verify` now bypasses the required preview-confirm gate
- 位置: `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts:100`
- 问题描述: The slash-command registry now marks `/review` as `executionMode: 'direct'`, and `resolveAction()` applies that same mode to `/review verify ...` because it keys off the normalized command token only. The updated test explicitly locks this in by expecting `registry.resolveAction('/review verify latest')` to return `executionMode: 'direct'`, even though the service-owned skill registry still classifies `review verify` as `PREVIEW_CONFIRM`, and the ADR says formal `review verify` actions must keep `preview + confirm` by default.
- 影响: Typing `/review verify latest` in the session shell now skips the confirmation boundary for a formal CR lifecycle action. That is a direct governance downgrade relative to both the natural-language path and the approved orchestration ADR, and it removes the last user-visible checkpoint before running `review-verify`.
- 建议: Split `/review` and `/review verify` confirmation policy at the slash-command layer. `review.code` can stay `direct` when you want that behavior, but `/review verify` should resolve back to `confirm`, with a regression test that protects the distinction.

### 2.2 [P2] Repository-review delegation drops reviewer capability requirements and can fall through to incapable fallback surfaces
- 位置: `apps/cli/src/runtime/session-main-supervisor-runtime.ts:683`
- 问题描述: For repository-review reviewer turns, `resolveRoleDelegateCapabilityRequirement()` returns `undefined`, so the reviewer role's projected `requiredCapabilities` stop being enforced. At the same time, `resolveRoleDelegateCandidateSurfaces()` still appends the local-model fallback surface. That means a repository-review request can route to any merely available fallback surface once the primary reviewer surfaces are unavailable, including the local-model adapter even though it advertises both `TOOL_CALLING=UNSUPPORTED` and `STRUCTURED_OUTPUT=UNSUPPORTED`.
- 影响: A foreground repository-review turn can silently downgrade into a surface that cannot inspect the repo and does not satisfy the reviewer role's declared capability contract, while still presenting the result as a real reviewer delegate outcome. This breaks both intent preservation and the role-projection contract the supervisor is supposed to honor.
- 建议: Keep the repository-review special mode, but do not drop the reviewer role's capability contract wholesale. Restrict repository-review delegation to surfaces that explicitly implement the review mode, or add a separate capability/eligibility gate for review-capable surfaces before allowing fallback.

## 3. Notes
1. 你上一条贴的 direct-answer P1 在当前 working tree 里我没有按原结论复报。当前实现已经把 `chat-only / tool-forbidden` execution policy 正式下发到 adapter，并且 Codex / Claude Code / GitHub Copilot 的宿主参数都做了 no-tool 或 read-only 收紧，所以它不再只是 prompt-level 约束。
2. 这轮 targeted tests 都是通过的，说明当前缺口主要是“错误的确认等级/eligibility 被测试一起锁定了”，不是已有 happy-path 自己报红。

## 4. Verification
1. `/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `git status --short`（通过）
3. `git diff --name-only --diff-filter=ACMR`（通过）

## 复核结论（2026-04-01）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P1] Explicit /review verify now bypasses the required preview-confirm gate`
   - 判定：**认可**
   - 证据：[session-slash-command-registry.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts#L199) 只对 `/workflow` 做了 executionMode 分流，导致 `/review verify latest` 继续沿用 [session-slash-command-registry.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts#L100) 的 `/review => direct`。对应测试 [session-slash-command-registry.test.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/test/runtime/session-slash-command-registry.test.ts#L101) 也明确锁定了 `executionMode: 'direct'`。而 skill 真值 [local-orchestration-service-session-main-skill-registry.ts](/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts#L97) 仍把 `review verify` 归为 `PREVIEW_CONFIRM`，ADR 也明确要求 formal `review verify` 保留 `preview + confirm`。
   - 处理：保留为待修复项，应把 `/review` 与 `/review verify` 在 slash-command 层拆开治理等级。

2. `2.2 [P2] Repository-review delegation drops reviewer capability requirements and can fall through to incapable fallback surfaces`
   - 判定：**认可**
   - 证据：[session-main-supervisor-runtime.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/session-main-supervisor-runtime.ts#L993) 对 repository-review reviewer dispatch 直接返回 `undefined capabilityRequirement`；随后 [session-main-supervisor-runtime.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/session-main-supervisor-runtime.ts#L624) 仍会把本地模型 fallback 追加进候选 surface。当前本地模型 capability 真值在 [local-model-agent-adapter.ts](/Users/jimmydaddy/study/ai-governor/packages/adapters/local-model/src/local-model-agent-adapter.ts#L36) 中仍是 `TOOL_CALLING=UNSUPPORTED`、`STRUCTURED_OUTPUT=UNSUPPORTED`，说明它并不满足 reviewer role 的原始能力契约，却仍可能被 availability-only fallback 选中。
   - 处理：保留为待修复项，应把 repository-review special mode 改成“review-capable surface eligibility”，而不是整段跳过 reviewer capability contract。

### 验证命令
1. `pnpm exec vitest run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `git status --short`（通过）
3. `git diff --name-only --diff-filter=ACMR`（通过）
4. `node ./scripts/governance/check-code-review-status-sync.js`（通过）

## 修复执行记录（2026-04-01）

1. `2.1 [P1] Explicit /review verify now bypasses the required preview-confirm gate`：已完成
   - 变更文件：`apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`、`apps/cli/test/runtime/session-slash-command-registry.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：显式 `/review verify ...` 已在 slash-command 层恢复为 `confirm`，不再沿用 `/review` 的 direct 模式。

2. `2.2 [P2] Repository-review delegation drops reviewer capability requirements and can fall through to incapable fallback surfaces`：已完成
   - 变更文件：`apps/cli/src/runtime/session-main-supervisor-runtime.ts`、`apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：repository-review reviewer delegate 现在只会在 review-capable front-stage surfaces 上做 fallback；本地模型这类不具备 review 模式的 surface 不再会被当成隐式 reviewer fallback。

3. 代码影响面构建校验：已完成
   - 变更文件：`apps/**`、`packages/**`
   - 验证：`pnpm run build`（通过）
   - 说明：执行语义改动已完成整仓构建验证。
